"use client";
import styles from "./SearchPage.module.css";
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
    <div className={styles.container}>
      <aside className={styles.aside}>
        <h2>Search Listings</h2>

        <input
          type="text"
          value={q}
          placeholder="Search..."
          onChange={(e) => setQ(e.target.value)}
          className={styles.input}
        />

        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={styles.select}
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
                <label key={value} className={styles.filterLabel}>
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

      <main className={styles.main}>
        <h3>Results ({results.length})</h3>

        {loading ? (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {Array.from({ length: 5 }).map((_, idx) => (
              <li key={idx} className={styles.loadingItem}>
                <div
                  style={{
                    height: "20px",
                    width: "60%",
                    background: "#ddd",
                    marginBottom: "0.5rem",
                  }}
                />
                <div className={styles.loadingBar} style={{ width: "80%" }} />
                <div className={styles.loadingBar} style={{ width: "40%" }} />
                <div className={styles.loadingBar} style={{ width: "70%" }} />
              </li>
            ))}
          </ul>
        ) : results.length === 0 ? (
          <p>No results found</p>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {results.map((item) => (
              <li key={item._id} className={styles.resultItem}>
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
