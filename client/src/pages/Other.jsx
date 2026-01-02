import React, { useEffect, useState } from "react";
import { Calendar } from "lucide-react";

const API_BASE = "http://localhost:5000/api";

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatPrice = (price) => {
  if (!price) return '0';
  return new Intl.NumberFormat('vi-VN').format(price);
};

const OtherPage = () => {
  const [otherItems, setOtherItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_BASE}/concerts`)
      .then((res) => res.json())
      .then((response) => {
        const concerts = response.data?.concerts || response.data || response.concerts || [];
        const others = concerts.filter((e) => e.category === "other");
        setTimeout(() => { // delay để skeleton hiển thị
          setOtherItems(others);
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
            Other Events
          </h2>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {loading
          ? [...Array(8)].map((_, i) => <MusicSkeletonCard key={i} />)
          : otherItems.map((item) => (
              <div
                key={item._id}
                className="bg-gray-900 rounded-lg shadow-md overflow-hidden cursor-pointer"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  className="w-full h-60 sm:h-72 md:h-60 object-cover rounded-lg mb-4"
                />
                <div className="px-3 mb-4">
                  <h3 className="text-lg font-bold text-white line-clamp-1 truncate">
                    {item.title}
                  </h3>
                </div>
                <div className="flex items-center justify-between text-gray-400 px-3 pb-3">
                  <div className="flex items-center">
                    <Calendar className="w-4 h-4 mr-2" />
                    <span>{formatDate(item.start_time)}</span>
                  </div>
                  <p className="text-primary font-bold">{formatPrice(item.base_price)}đ</p>
                </div>
              </div>
            ))}
      </div>
    </div>
  );
};

export default OtherPage;
