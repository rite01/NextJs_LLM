"use client";
import { useSearchListings } from "./useSearchListings.hook";

export default function SearchPage() {
  const {
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
  } = useSearchListings();

  return (
    <div style={{ display: "flex", padding: "2rem", gap: "2rem" }}>
      <style jsx global>{`
        @keyframes pulse {
          0% {
            background-color: #f0f0f0;
          }
          50% {
            background-color: #e0e0e0;
          }
          100% {
            background-color: #f0f0f0;
          }
        }
      `}</style>

      <aside style={{ flex: "1", maxWidth: "300px" }}>
        <h2>Search Listings</h2>

        <input
          type="text"
          value={q}
          placeholder="Search..."
          onChange={(e) => setQ(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{
            width: "100%",
            padding: "0.75rem",
            marginBottom: "1.5rem",
            borderRadius: "4px",
            border: "1px solid #ccc",
          }}
        >
          {categories.map(({ slug, name }) => (
            <option key={slug} value={slug}>
              {name}
            </option>
          ))}
        </select>

        <h3>Filters</h3>
        {Object.keys(facets).length === 0 && <p>No filters available</p>}

        {Object.entries(facets).map(([key, values]) => (
          <div key={key} style={{ marginBottom: "1rem" }}>
            <strong style={{ textTransform: "capitalize" }}>{key}</strong>
            <div style={{ marginTop: "0.5rem" }}>
              {values.map(({ value, count }) => (
                <label
                  key={value}
                  style={{ display: "block", marginBottom: "0.25rem" }}
                >
                  <input
                    type="checkbox"
                    checked={filters[key]?.includes(value) || false}
                    onChange={() => toggleFilter(key, value)}
                    style={{ marginRight: "0.5rem" }}
                  />
                  {value} ({count})
                </label>
              ))}
            </div>
          </div>
        ))}
      </aside>

      <main style={{ flex: "3" }}>
        <h3>Results ({results.length})</h3>

        {loading ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <li
                key={idx}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  padding: "1rem",
                  marginBottom: "1rem",
                  backgroundColor: "#f6f6f6",
                  animation: "pulse 1.5s infinite",
                }}
              >
                <div
                  style={{
                    height: "20px",
                    width: "60%",
                    background: "#ddd",
                    marginBottom: "0.5rem",
                  }}
                />
                <div
                  style={{
                    height: "15px",
                    width: "80%",
                    background: "#e0e0e0",
                    marginBottom: "0.5rem",
                  }}
                />
                <div
                  style={{
                    height: "15px",
                    width: "40%",
                    background: "#e0e0e0",
                    marginBottom: "0.5rem",
                  }}
                />
                <div
                  style={{
                    height: "15px",
                    width: "70%",
                    background: "#ddd",
                  }}
                />
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          <p>No results found</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {results.map((item) => (
              <li
                key={item._id}
                style={{
                  border: "1px solid #e0e0e0",
                  borderRadius: "6px",
                  padding: "1rem",
                  marginBottom: "1rem",
                  boxShadow: "0 2px 5px rgba(0, 0, 0, 0.05)",
                }}
              >
                <h4>{item.title}</h4>
                <p style={{ color: "#555" }}>{item.description}</p>
                <p>
                  <strong>Price:</strong> ${item.price} |{" "}
                  <strong>Location:</strong> {item.location}
                </p>
                <p>
                  <strong>Attributes:</strong>{" "}
                  {Object.entries(item.attributes)
                    .map(([k, v]) => `${k}: ${v}`)
                    .join(", ")}
                </p>
              </li>
            ))}
          </ul>
        )}

        {!hasMore && results.length > 0 && !loading && <p>End of results</p>}
      </main>
    </div>
  );
}
