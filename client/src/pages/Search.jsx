import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

const Search = () => {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const query = new URLSearchParams(useLocation().search).get("q") || "";

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    fetch(`http://localhost:5000/events?name=${encodeURIComponent(query)}`)
      .then((res) => res.json())
      .then((data) => {
        setResults(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [query]);

  return (
    <div className="px-6 md:px-40 py-8">
      <h2 className="text-2xl font-bold mt-48 mb-12">Search for “{query}” :</h2>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-gray-700 rounded-xl overflow-hidden shadow-md"
            >
              <div className="w-full h-44 shimmer rounded-t-xl"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 shimmer rounded w-3/4"></div>
                <div className="h-3 shimmer rounded w-1/2"></div>
                <div className="h-4 shimmer rounded w-1/3 mt-3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <p className="text-gray-400">No search here.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {results.slice(0, 4).map((ev) => (
            <div
              key={ev._id}
              className="bg-gray-900 rounded-lg shadow-md overflow-hidden cursor-pointer"
            >
              <img
                src={ev.image}
                alt={ev.name}
                className="w-full h-60 sm:h-72 md:h-60 object-cover rounded-lg mb-4"
              />

              <div className="px-3 mb-4">
                <h3 className="text-lg font-bold text-white line-clamp-1 truncate">
                  {ev.name}
                </h3>
              </div>

              <div className="flex items-center justify-between text-gray-400 px-3 pb-3">
                <span>{ev.date}</span>
                <p className="text-primary font-bold">
                  {ev.tickets?.[0]?.price?.toLocaleString()}đ
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
