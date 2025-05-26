import nlp from "compromise";

type Category = {
  name: string;
  slug: string;
};

type AttributeFilters = Record<string, string[]>;

type ParsedQueryResult = {
  filters: Record<
    string,
    string | number | { $in: string[] } | { $lte: number } | { $gte: number }
  >;
  categorySlug: string;
};

export async function parseNaturalLanguageQuery(
  q: string,
  {
    categories,
    attributeFilters,
  }: {
    categories: Category[];
    attributeFilters: AttributeFilters;
  }
): Promise<ParsedQueryResult> {
  const result: ParsedQueryResult = {
    filters: {},
    categorySlug: "",
  };

  const lowerQ = q.toLowerCase();
  const doc = nlp(lowerQ);

  for (const cat of categories) {
    if (lowerQ.includes(cat.name.toLowerCase())) {
      result.categorySlug = cat.slug;
      break;
    }
  }

  for (const [attrKey, values] of Object.entries(attributeFilters)) {
    const matchedValues: string[] = [];

    for (const value of values) {
      if (lowerQ.includes(value.toLowerCase())) {
        matchedValues.push(value);
      }
    }

    if (matchedValues.length === 1) {
      result.filters[attrKey] = matchedValues[0];
    } else if (matchedValues.length > 1) {
      result.filters[attrKey] = { $in: matchedValues };
    }
  }

  const numbers = doc.numbers().out("array");
  if (numbers.length > 0) {
    const price = Number(numbers[0]);

    if (!isNaN(price)) {
      if (/\b(under|below|less than|max|cheaper than)\b/.test(lowerQ)) {
        result.filters.price = { $lte: price };
      } else if (/\b(over|above|min|more than|costlier than)\b/.test(lowerQ)) {
        result.filters.price = { $gte: price };
      } else {
        result.filters.price = price;
      }
    }
  }

  return result;
}
