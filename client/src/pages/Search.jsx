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
      <h2 className="text-2xl font-bold mt-48 mb-12">
        Search for “{query}” :
      </h2>

      {loading ? (
        // ✅ Skeleton shimmer Netflix style
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
        <p className="text-gray-400">Không có kết quả nào.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
          {results.slice(0, 4).map((ev) => (
            <div
              key={ev._id}
              className="rounded-2xl overflow-hidden bg-gray hover:scale-[1.05] transition duration-300 cursor-pointer shadow-lg"
            >
              <img
                src={ev.image}
                alt={ev.name}
                className="w-full h-48 object-cover"
              />

              <div className="p-4">
                <h3 className="font-semibold text-lg line-clamp-2">{ev.name}</h3>
                <p className="text-gray-400 text-sm mt-1">
                  {ev.date} — {ev.place}
                </p>

                {ev.tickets?.[0] && (
                  <p className="text-primary font-bold mt-2">
                    {ev.tickets[0].price.toLocaleString()}đ
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;
