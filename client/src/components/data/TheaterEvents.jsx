import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";

const TheaterEvents = () => {
  const [theaterEvents, setTheaterEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then((res) => res.json())
      .then((data) => {
        const theater = data.filter((e) => e.category === "theater");
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
            className="bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer transform transition-all duration-300 hover:scale-105 flex flex-col justify-between h-full"
          >
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-48 sm:h-60 md:h-60 object-cover rounded-lg mb-4"
            />
            <div className="flex justify-between items-center mb-4 px-3">
              <h3 className="text-base md:text-lg font-bold text-white">
                {card.name}
              </h3>
            </div>
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white px-3 pb-3 text-sm md:text-base gap-1">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{card.date}</span>
              </div>
              <p className="text-primary font-bold">{card.price_set}đ</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
};

export default TheaterEvents;
