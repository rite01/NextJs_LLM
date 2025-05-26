import { useState, useEffect, useCallback, useRef } from "react";

export type Listing = {
  _id: string;
  title: string;
  description: string;
  price: number;
  location: string;
  attributes: Record<string, string>;
};

export type FacetValue = {
  value: string;
  count: number;
};

export type Facets = Record<string, FacetValue[]>;

export type Filters = Record<string, string[]>;

type Category = {
  name: string;
  slug: string;
};

type SearchResponse = {
  listings: Listing[];
  facets: Facets;
  total?: number;
};

export function useSearchListings() {
  const [q, setQ] = useState<string>("");
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState<string>("all");
  const [filters, setFilters] = useState<Filters>({});
  const [results, setResults] = useState<Listing[]>([]);
  const [facets, setFacets] = useState<Facets>({});
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

  const loadingRef = useRef(false);

  useEffect(() => {
    const fetchedCategories: Category[] = [
      { name: "All", slug: "all" },
      { name: "Televisions", slug: "televisions" },
      { name: "Running Shoes", slug: "running-shoes" },
      { name: "Smartphones", slug: "smartphones" },
    ];
    setCategories(fetchedCategories);
    setCategory(fetchedCategories[0]?.slug || "all");
  }, []);

  useEffect(() => {
    setResults([]);
    setPage(1);
    setHasMore(true);
  }, [q, category, filters]);

  const fetchResults = useCallback(
    async (pageToFetch: number) => {
      if (loadingRef.current) return;
      loadingRef.current = true;
      setLoading(true);

      const filterStr = encodeURIComponent(JSON.stringify(filters));
      const categoryParam = category === "all" ? "" : category;
      const limit = 20;

      const url = `/api/search?q=${encodeURIComponent(
        q
      )}&category=${categoryParam}&filters=${filterStr}&page=${pageToFetch}&limit=${limit}`;

      try {
        const res = await fetch(url);
        if (!res.ok) throw new Error("Network response was not ok");
        const json: SearchResponse = await res.json();

        setResults((prev) =>
          pageToFetch === 1
            ? json.listings || []
            : [...prev, ...(json.listings || [])]
        );
        setFacets(json.facets || {});
        setHasMore(json.listings?.length === limit);
      } catch (err) {
        console.error("Failed to fetch:", err);
        if (pageToFetch === 1) {
          setResults([]);
          setFacets({});
        }
        setHasMore(false);
      } finally {
        setLoading(false);
        loadingRef.current = false;
      }
    },
    [q, category, filters]
  );

  useEffect(() => {
    fetchResults(page);
  }, [fetchResults, page]);

  useEffect(() => {
    const onScroll = () => {
      if (loading || !hasMore) return;
      const scrollable = document.documentElement;
      const scrollTop = scrollable.scrollTop;
      const windowHeight = window.innerHeight;
      const scrollHeight = scrollable.scrollHeight;
      if (scrollTop + windowHeight + 100 >= scrollHeight) {
        setPage((prev) => prev + 1);
      }
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, [loading, hasMore]);

  const toggleFilter = (key: string, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[key] || [];
      const exists = currentValues.includes(value);
      const updatedValues = exists
        ? currentValues.filter((v) => v !== value)
        : [...currentValues, value];

      const newFilters = { ...prev, [key]: updatedValues };
      if (updatedValues.length === 0) {
        delete newFilters[key];
      }

      return newFilters;
    });
  };

  return {
    q,
    setQ,
    categories,
    category,
    setCategory,
    filters,
    results,
    facets,
    loading,
    hasMore,
    toggleFilter,
  };
}
