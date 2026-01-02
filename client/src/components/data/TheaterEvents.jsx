import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

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

const TheaterEvents = () => {
  const [theaterEvents, setTheaterEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch(`${API_BASE}/concerts`)
      .then((res) => res.json())
      .then((response) => {
        const concerts = response.data?.concerts || response.data || response.concerts || [];
        const theater = concerts.filter((e) => e.category === "theater");
        setTheaterEvents(theater);
      })
      .catch((err) => console.error("❌ Lỗi khi lấy dữ liệu:", err));
  }, []);

  return (
    <>
      <motion.div
        className="mt-16 flex items-center justify-between"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <p className="text-xl md:text-3xl font-semibold tracking-wide">
          <span className="text-primary">Theater & Art</span>
        </p>

        <motion.button
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 200 }}
          onClick={() => navigate("/theatersandart")}
          className="flex items-center gap-2 text-sm md:text-base text-primary font-semibold cursor-pointer"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 mt-8">
        {theaterEvents.slice(0, 4).map((card) => (
          <div
            key={card._id}
            onClick={() => navigate(`/event/${card._id}`)}
            className="bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 flex flex-col justify-between h-full"
          >
            <img
              src={card.thumbnail}
              alt={card.title}
              className="w-full h-48 sm:h-60 md:h-60 object-cover rounded-lg mb-4"
            />
            <div className="flex justify-between items-center mb-4 px-3">
              <h3 className="text-base md:text-lg font-bold text-white">
                {card.title}
              </h3>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white px-3 pb-3 text-sm md:text-base gap-1">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{formatDate(card.start_time)}</span>
              </div>
              <p className="text-primary font-bold">{formatPrice(card.base_price)}đ</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TheaterEvents;
