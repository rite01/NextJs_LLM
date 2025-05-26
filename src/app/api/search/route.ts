/* eslint-disable @typescript-eslint/no-explicit-any */
import { dbConnect } from "../../database/mongodb";
import Category from "../../models/Category";
import Listing from "../../models/Listing";
import { parseNaturalLanguageQuery } from "../../lib/queryParser";

interface AttributeFilter {
  [key: string]: string | string[];
}

interface FacetResult {
  _id: string;
  count: number;
}

export async function GET(request: Request): Promise<Response> {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q")?.trim() || "";
    const filtersRaw = searchParams.get("filters") || "{}";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.max(1, parseInt(searchParams.get("limit") || "10", 10));

    const categories = await Category.find(
      {},
      { name: 1, slug: 1, attributeSchema: 1 }
    ).lean();

    const attributeFilters: Record<string, string[]> = {};
    categories.forEach((cat) => {
      cat.attributeSchema?.forEach((attr: any) => {
        if (!attributeFilters[attr.key]) attributeFilters[attr.key] = [];
        if (Array.isArray(attr.options)) {
          attributeFilters[attr.key].push(
            ...attr.options.map((o: any) => o.value || o)
          );
        }
      });
    });

    const parsed = await parseNaturalLanguageQuery(q, {
      categories,
      attributeFilters,
    });

    let filters: AttributeFilter = {};
    try {
      filters = {
        ...parsed.filters,
        ...JSON.parse(filtersRaw),
      };
    } catch {
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

    // <-- UPDATED filter application here -->
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
  } catch (error: any) {
    console.error("Search API Error:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
}
