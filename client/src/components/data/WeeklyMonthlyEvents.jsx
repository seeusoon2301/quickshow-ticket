import React, { useState, useEffect } from "react";
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

const WeeklyMonthlyEvents = () => {
  const [allEvents, setAllEvents] = useState([]);
  const [selectedTab, setSelectedTab] = useState("week");
  const navigate = useNavigate();

  // ✅ Fetch API tại đây
  useEffect(() => {
    fetch(`${API_BASE}/concerts`)
      .then((res) => res.json())
      .then((response) => {
        const concerts = response.data?.concerts || response.data || response.concerts || [];
        setAllEvents(concerts);
      })
      .catch((err) => console.error("❌ Error fetching weekly events:", err));
  }, []);

  const now = new Date();
  const dayOfWeek = now.getDay();
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const startOfWeek = new Date(now.getFullYear(), now.getMonth(), now.getDate() + diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);

  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const filteredEvents = allEvents.filter((card) => {
    const eventDate = new Date(card.start_time);

    if (selectedTab === "week") {
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    } else if (selectedTab === "month") {
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    }
    return true;
  });

  const sortedFilteredEvents = filteredEvents.sort((a, b) => {
    const da = new Date(a.start_time);
    const db = new Date(b.start_time);
    return da - db;
  });

  return (
    <div className="mt-16">
      <motion.div
        className="flex items-center justify-between"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8 }}
        viewport={{ once: true }}
      >
        <div className="flex gap-6">
          <button
            onClick={() => setSelectedTab("week")}
            className={`text-xl md:text-3xl font-semibold transition ${
              selectedTab === "week"
                ? "text-primary underline underline-offset-8 border-b-2 border-primary"
                : "text-white-400"
            }`}
          >
            This Week
          </button>

          <button
            onClick={() => setSelectedTab("month")}
            className={`text-xl md:text-3xl font-semibold transition ${
              selectedTab === "month"
                ? "text-primary underline underline-offset-8 border-b-2 border-primary"
                : "text-white-400"
            }`}
          >
            This Month
          </button>
        </div>

        <motion.button
          whileHover={{ x: 5 }}
          onClick={() => navigate("/theatersandart")}
          className="flex items-center gap-2 text-primary font-semibold"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* ✅ Grid cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 mt-8">
        {sortedFilteredEvents.slice(0, 4).map((card) => (
          <div
            key={card._id}
            onClick={() => navigate(`/event/${card._id}`)}
            className="bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer hover:scale-105 transition"
          >
            <img src={card.thumbnail} alt={card.title} className="w-full h-48 sm:h-60 object-cover" />

            <div className="p-3">
              <h3 className="text-base md:text-lg font-bold text-white line-clamp-2">{card.title}</h3>

              <div className="flex justify-between items-center mt-2 text-sm text-white">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-2" />
                  {formatDate(card.start_time)}
                </div>
                <p className="text-primary font-bold">{formatPrice(card.base_price)}đ</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyMonthlyEvents;
