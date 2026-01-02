import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

const MusicEvents = () => {
  const [musicEvents, setMusicEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/concerts?category=music&limit=4`)
      .then((res) => res.json())
      .then((response) => {
        // API returns { success: true, data: { concerts: [...] } }
        const concerts = response.data?.concerts || response.concerts || [];
        setMusicEvents(concerts);
      })
      .catch((err) => console.error("❌ Lỗi khi lấy dữ liệu:", err));
  }, []);

  // Format date helper
  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  // Format price helper
  const formatPrice = (price) => {
    if (!price) return 'Liên hệ';
    return price.toLocaleString('vi-VN') + 'đ';
  };

  return (
    <>
      {/* Title */}
      <motion.div
        className="mt-16 flex items-center justify-between"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <p className="text-xl md:text-3xl font-semibold tracking-wide">
          <span className="text-primary">Music</span>
        </p>

        <motion.button
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 200 }}
          onClick={() => navigate("/music")}
          className="flex items-center gap-2 text-sm md:text-base text-primary font-semibold cursor-pointer"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 mt-8">
        {musicEvents.slice(0, 4).map((concert) => (
          <div
            key={concert._id}
            onClick={() => navigate(`/event/${concert._id}`)}
            className="bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 flex flex-col justify-between h-full"
          >
            <div>
              <img
                src={concert.thumbnail || concert.image}
                alt={concert.title || concert.name}
                className="w-full h-48 sm:h-60 md:h-60 object-cover rounded-lg mb-4"
              />
              <div className="flex justify-between items-center mb-4 px-3">
                <h3 className="text-base md:text-lg font-bold text-white leading-tight line-clamp-2">
                  {concert.title || concert.name}
                </h3>
              </div>
            </div>

            <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white px-3 pb-3 text-sm md:text-base gap-1 mt-auto">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDate(concert.start_time || concert.date)}</span>
              </div>
              <p className="text-primary font-bold">{formatPrice(concert.minPrice || concert.price_set)}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default MusicEvents;
