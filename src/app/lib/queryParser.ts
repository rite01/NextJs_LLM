// import nlp from "compromise";

// export async function parseNaturalLanguageQuery(
//   q: string,
//   {
//     categories,
//     attributeFilters,
//   }: {
//     categories: { name: string; slug: string }[];
//     attributeFilters: Record<string, string[]>;
//   }
// ) {
//   const result: any = {
//     filters: {},
//     categorySlug: "",
//   };

//   const lowerQ = q.toLowerCase();
//   const doc = nlp(lowerQ);

//   // Category matching
//   for (const cat of categories) {
//     if (lowerQ.includes(cat.name.toLowerCase())) {
//       result.categorySlug = cat.slug;
//       break;
//     }
//   }

//   // Attribute filter matching (support multiple values)
//   for (const [key, values] of Object.entries(attributeFilters)) {
//     const matchedValues: string[] = [];

//     for (const value of values) {
//       if (lowerQ.includes(value.toLowerCase())) {
//         matchedValues.push(value);
//       }
//     }

//     if (matchedValues.length > 0) {
//       result.filters[key] =
//         matchedValues.length === 1 ? matchedValues[0] : { $in: matchedValues };
//     }
//   }

//   // Price extraction
//   const numbers = doc.numbers().out("array");
//   let priceCandidate: number | null = null;

//   if (Array.isArray(numbers) && numbers.length > 0) {
//     const parsed = Number(numbers[0]);
//     priceCandidate = isNaN(parsed) ? null : parsed;
//   }

//   if (priceCandidate !== null) {
//     if (/\b(under|below|less than|max|cheaper than)\b/.test(lowerQ)) {
//       result.filters.price = { $lte: priceCandidate };
//     } else if (/\b(over|above|min|more than|costlier than)\b/.test(lowerQ)) {
//       result.filters.price = { $gte: priceCandidate };
//     }
//   }

//   return result;
// }
// -- The parseNaturalLanguageQuery function (unchanged) --

type Category = {
  name: string;
  slug: string;
};

type AttributeFilters = Record<string, string[]>;

type ParsedQueryResult = {
  filters: Record<string, string | number>;
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

  for (const cat of categories) {
    if (lowerQ.includes(cat.name.toLowerCase())) {
      result.categorySlug = cat.slug;
      break;
    }
  }

  for (const [attrKey, values] of Object.entries(attributeFilters)) {
    for (const value of values) {
      if (lowerQ.includes(value.toLowerCase())) {
        result.filters[attrKey] = value;
        break;
      }
    }
  }

  const priceMatch = lowerQ.match(/(?:under|below)\s*₹?\s*(\d{3,6})/i);
  if (priceMatch) {
    result.filters["price_max"] = parseInt(priceMatch[1], 10);
  }

  return result;
}
