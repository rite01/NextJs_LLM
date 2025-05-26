import OpenAI from "openai";
import { dbConnect } from "../../database/mongodb";
import Category from "../../models/Category";
import Listing from "../../models/Listing";

interface FacetResult {
  _id: string;
  count: number;
}

interface CategoryType {
  name: string;
  slug: string;
  synonyms?: string[];
  attributeSchema?: {
    key: string;
    options: { value: string }[];
  }[];
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || "your-api-key",
});

async function parseQueryWithLLM(
  q: string,
  categories: CategoryType[],
  attributeFilters: Record<string, string[]>
): Promise<{ filters: Record<string, any>; categorySlug: string }> {
  if (!q.trim()) return { filters: {}, categorySlug: "" };

  const categoryList = categories
    .map((c) =>
      c.synonyms && c.synonyms.length
        ? `- ${c.name} (slug: ${c.slug}, synonyms: ${c.synonyms.join(", ")})`
        : `- ${c.name} (slug: ${c.slug})`
    )
    .join("\n");

  const prompt = `
You are an assistant that parses user search queries into structured filters and categories.

User query: "${q}"

Categories:
${categoryList}

Attributes and possible values:
${Object.entries(attributeFilters)
  .map(([key, values]) => `- ${key}: ${values.join(", ")}`)
  .join("\n")}

Price can be specified as "price min max", "under X", "over Y", or ranges.

Return a JSON object:
{
  "categorySlug": "slug or empty string",
  "filters": {
    "attributeKey": "value or array or {min,max}",
    ...
  }
}
`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content:
            "You are an assistant that parses user search queries into structured filters and categories.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
      max_tokens: 300,
      temperature: 0,
    });

    const message = completion.choices[0]?.message?.content?.trim() || "{}";

    const sanitized = message
      .replace(/^```json/g, "")
      .replace(/^```/, "")
      .replace(/```$/, "")
      .trim();

    return JSON.parse(sanitized);
  } catch (err) {
    console.error("LLM parsing error:", err);
    return { filters: {}, categorySlug: "" };
  }
}

export async function GET(request: Request): Promise<Response> {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const filtersRaw = searchParams.get("filters") || "{}";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    const categories: any = await Category.find(
      {},
      { name: 1, slug: 1, synonyms: 1, attributeSchema: 1 }
    ).lean();

    const attributeFilters: Record<string, string[]> = {};
    categories.forEach((cat: any) => {
      cat.attributeSchema?.forEach((attr: any) => {
        if (!attributeFilters[attr.key]) attributeFilters[attr.key] = [];
        if (Array.isArray(attr.options)) {
          attributeFilters[attr.key].push(
            ...attr.options.map((o: any) => o.value || o)
          );
        }
      });
    });

    const parsed = await parseQueryWithLLM(q, categories, attributeFilters);

    let filters: any = {};
    try {
      const cleanedFilters = filtersRaw
        .replace(/^```json/g, "")
        .replace(/^```/, "")
        .replace(/```$/, "")
        .trim();

      filters = {
        ...parsed.filters,
        ...JSON.parse(cleanedFilters),
      };
    } catch (err) {
      console.error("Invalid filters JSON:", err);
      return new Response("Invalid filters JSON", { status: 400 });
    }

    const categorySlug =
      searchParams.get("category")?.trim() || parsed.categorySlug || "";
    let category: any = null;
    let attributeSchema: any[] = [];

    if (categorySlug && categorySlug !== "all") {
      category = await Category.findOne({ slug: categorySlug }).lean();
      if (!category || !Array.isArray(category.attributeSchema)) {
        return new Response("Category not found or schema invalid", {
          status: 404,
        });
      }
      attributeSchema = category.attributeSchema;
    }

    const baseFilter: any = {};
    if (category) baseFilter.categoryId = category._id;

    if (filters.price) {
      if (
        typeof filters.price === "object" &&
        filters.price !== null &&
        (filters?.price?.min !== undefined || filters.price.max !== undefined)
      ) {
        baseFilter.price = {};
        if (filters.price.min !== undefined)
          baseFilter.price.$gte = filters.price.min;
        if (filters.price.max !== undefined)
          baseFilter.price.$lte = filters.price.max;
      } else if (typeof filters.price === "number") {
        baseFilter.price = filters.price;
      }
      delete filters.price;
    }

    for (const [key, value] of Object.entries(filters)) {
      if (value) {
        if (Array.isArray(value)) {
          baseFilter[`attributes.${key}`] = { $in: value };
        } else {
          baseFilter[`attributes.${key}`] = value;
        }
      }
    }

    const textSearchFilter = q
      ? { ...baseFilter, $text: { $search: q } }
      : baseFilter;

    const pipeline: any[] = [
      { $match: textSearchFilter },
      ...(q
        ? [
            { $addFields: { score: { $meta: "textScore" } } },
            { $sort: { score: -1, createdAt: -1 } },
          ]
        : [{ $sort: { createdAt: -1 } }]),
      { $skip: (page - 1) * limit },
      { $limit: limit },
      {
        $project: {
          title: 1,
          description: 1,
          price: 1,
          location: 1,
          attributes: 1,
          categoryId: 1,
        },
      },
    ];

    const listings = await Listing.aggregate(pipeline);

    const totalCountAgg = await Listing.aggregate([
      { $match: textSearchFilter },
      { $count: "count" },
    ]);
    const totalCount = totalCountAgg[0]?.count || 0;

    const facets: Record<string, { value: string; count: number }[]> = {};
    if (category) {
      const facetStage: Record<string, any[]> = {};
      for (const attr of attributeSchema) {
        facetStage[attr.key] = [
          { $match: baseFilter },
          { $group: { _id: `$attributes.${attr.key}`, count: { $sum: 1 } } },
        ];
      }

      const facetAgg = await Listing.aggregate([{ $facet: facetStage }]);
      const facetResult = facetAgg[0] || {};

      for (const attr of attributeSchema) {
        const attrFacets = facetResult[attr.key] || [];
        facets[attr.key] = attrFacets
          .filter((f: FacetResult) => f._id !== null)
          .map((f: FacetResult) => ({ value: f._id, count: f.count }));
      }
    }

    return new Response(
      JSON.stringify({
        listings,
        totalCount,
        facets,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Search API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
