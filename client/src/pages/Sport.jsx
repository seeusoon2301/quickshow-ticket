import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

const SportPage = () => {
  const [sportItems, setSportItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then((res) => res.json())
      .then((data) => {
        const sports = data.filter((e) => e.category === "sport");
        setTimeout(() => { // delay để skeleton hiển thị
          setSportItems(sports);
          setLoading(false);
        }, 1500);
      })
      .catch((err) => {
        console.error("Lỗi fetch Music items:", err);
        setLoading(false);
      });
  }, []);

  const MusicSkeletonCard = () => (
    <div className="bg-gray-800 rounded-lg shadow-md overflow-hidden animate-pulse h-80">
      <div className="w-full h-3/4 bg-gray-700 mb-4"></div>
      <div className="px-3 space-y-2">
        <div className="h-5 bg-gray-600 rounded w-3/4"></div>
        <div className="h-4 bg-gray-600 rounded w-1/4"></div>
      </div>
    </div>
  );

  return (
    <div className="px-4 md:px-8 mt-48">
      {/* Title */}
      <div className="text-center mb-10">
        {loading ? (
          <div className="mx-auto h-8 w-48 rounded bg-gray-200 animate-pulse"></div>
        ) : (
          <h2 className="text-3xl md:text-4xl font-bold text-primary">
            Sport Events
          </h2>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading
          ? [...Array(8)].map((_, i) => <MusicSkeletonCard key={i} />)
          : sportItems.map((item) => (
              <div
                key={item._id}
                className="bg-gray-900 rounded-lg shadow-md overflow-hidden cursor-pointer"
              >
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-60 sm:h-72 md:h-60 object-cover rounded-lg mb-4"
                />
                <div className="px-3 mb-4">
                  <h3 className="text-lg font-bold text-white line-clamp-1 truncate">
                    {item.name}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-gray-400 px-3 pb-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{item.date}</span>
                  </div>
                  <p className="text-primary font-bold">{item.price_set?.toLocaleString()}đ</p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default SportPage;
