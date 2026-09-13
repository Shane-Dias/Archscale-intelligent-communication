import { useState } from "react";
import { search } from "../api/client";

export default function SearchBar({ onResults }) {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSearch(e) {
    e.preventDefault();
    if (!q.trim()) return;
    setLoading(true);
    try {
      const results = await search(q);
      onResults(results, q);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="search-bar" onSubmit={handleSearch}>
      <input
        type="text"
        placeholder="Search past decisions, tasks, or conversations..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
      />
      <button type="submit" disabled={loading}>
        {loading ? "Searching..." : "Search"}
      </button>
    </form>
  );
}
