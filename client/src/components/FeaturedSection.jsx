import React, { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Calendar } from "lucide-react";
import { useNavigate } from "react-router-dom";
const FeaturedSection = () => {
  const specialRef = useRef(null);
  const topPicksRef = useRef(null);
  const [specialEvents, setSpecialEvents] = useState([]);
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [musicEvents, setMusicEvents] = useState([]);
  const [theater_artEvents, setTheater_artEvents] = useState([]);
  const [sportEvents, setSportEvents] = useState([]);
  const [otherEvents, setOtherEvents] = useState([]);
  const [selectedTab, setSelectedTab] = useState("week");
  const [allEvents, setAllEvents] = useState([]);
  const navigate = useNavigate();

  // FETCH API MONGODB ========================================
  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then((res) => res.json())
      .then((data) => {
        const specials = data.filter((e) => e.type === "special");
        const trendings = data.filter((e) => e.type === "trending");
        const music = data.filter((e) => e.category === "music");
        const theater = data.filter((e) => e.category === "theater");
        const sport = data.filter((e) => e.category === "sport");
        const other = data.filter((e) => e.category === "other");
        setSpecialEvents(specials);
        setTrendingEvents(trendings);
        setMusicEvents(music);
        setTheater_artEvents(theater);
        setSportEvents(sport);
        setOtherEvents(other);
        setAllEvents(data);
      })
      .catch((err) => console.error("❌ Lỗi khi lấy dữ liệu:", err));
  }, []);

  const now = new Date();
  const dayOfWeek = now.getDay(); // Chủ nhật=0, Thứ 2=1, ..., Thứ 7=6
  // Tính ngày Thứ 2 của tuần hiện tại
  const diffToMonday = (dayOfWeek === 0 ? -6 : 1) - dayOfWeek;
  const startOfWeek = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate() + diffToMonday
  );
  startOfWeek.setHours(0, 0, 0, 0); // bắt đầu ngày

  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999); // kết thúc ngày

  // Đầu và cuối tháng hiện tại
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

  const filteredEvents = allEvents.filter((card) => {
    const [year, month, day] = card.date.split("-").map(Number);
    const eventDate = new Date(year, month - 1, day);

    if (selectedTab === "week") {
      return eventDate >= startOfWeek && eventDate <= endOfWeek;
    } else if (selectedTab === "month") {
      return eventDate >= startOfMonth && eventDate <= endOfMonth;
    } else {
      return true;
    }
  });
  // Thay vì chỉ filteredEvents, ta sort theo ngày tăng dần
  const sortedFilteredEvents = filteredEvents.sort((a, b) => {
    const [yearA, monthA, dayA] = a.date.split("-").map(Number);
    const [yearB, monthB, dayB] = b.date.split("-").map(Number);
    const dateA = new Date(yearA, monthA - 1, dayA);
    const dateB = new Date(yearB, monthB - 1, dayB);
    return dateA - dateB;
  });

  // ===========================================
  // DRAG TO SCROLL LOGIC
  const handleMouseDrag = (ref) => {
    let isDown = false;
    let startX;
    let scrollLeft;

    const slider = ref.current;

    const onMouseDown = (e) => {
      isDown = true;
      slider.classList.add("active");
      startX = e.pageX - slider.offsetLeft;
      scrollLeft = slider.scrollLeft;
    };

    const onMouseLeave = () => {
      isDown = false;
      slider.classList.remove("active");
    };

    const onMouseUp = () => {
      isDown = false;
      slider.classList.remove("active");
    };

    const onMouseMove = (e) => {
      if (!isDown) return;
      e.preventDefault();
      const x = e.pageX - slider.offsetLeft;
      const walk = (x - startX) * 1.5; // tốc độ cuộn
      slider.scrollLeft = scrollLeft - walk;
    };

    slider.addEventListener("mousedown", onMouseDown);
    slider.addEventListener("mouseleave", onMouseLeave);
    slider.addEventListener("mouseup", onMouseUp);
    slider.addEventListener("mousemove", onMouseMove);

    // cleanup
    return () => {
      slider.removeEventListener("mousedown", onMouseDown);
      slider.removeEventListener("mouseleave", onMouseLeave);
      slider.removeEventListener("mouseup", onMouseUp);
      slider.removeEventListener("mousemove", onMouseMove);
    };
  };

  useEffect(() => {
    const cleanup1 = handleMouseDrag(specialRef);
    const cleanup2 = handleMouseDrag(topPicksRef);
    return () => {
      cleanup1 && cleanup1();
      cleanup2 && cleanup2();
    };
  }, []);

  // ===========================================

  return (
    <div className="relative px-6 md:px-16 lg:px-24 xl:px-44 py-16 text-white select-none">
      {/* Special Events */}
      <div className="text-center mb-10">
        <p className="text-primary uppercase tracking-widest font-semibold">
          Special
        </p>
        <h2 className="text-4xl md:text-5xl font-bold">Events</h2>
      </div>

      {/* Scrollable Special Events */}
      <div
        ref={specialRef}
        className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide snap-x snap-mandatory px-4 cursor-grab active:cursor-grabbing"
      >
        {specialEvents.map((event, index) => (
          <div
            key={event._id || index}
            className="shrink-0 w-[80%] sm:w-[45%] md:w-[30%] lg:w-[19%]
              rounded-2xl overflow-hidden shadow-lg relative snap-center
              transform transition-all duration-700 hover:scale-[1.03]"
          >
            <img
              src={event.image}
              alt={event.name}
              className="w-full h-100 object-cover"
            />
            <div className="absolute inset-0 bg-linear-to-t from-black/50 to-transparent"></div>
          </div>
        ))}
      </div>

      {/* Top Picks */}
      <motion.div
        className="mt-16 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        <p className="text-xl md:text-3xl font-semibold tracking-wide">
          <span className="text-primary">Trending</span> For You
        </p>
      </motion.div>

      <div
        ref={topPicksRef}
        className="flex gap-6 overflow-x-auto scroll-smooth scrollbar-hide px-4 mt-8 cursor-grab active:cursor-grabbing"
      >
        {trendingEvents.map((card) => (
          <div
            key={card._id}
            className="shrink-0 w-[250px] sm:w-[300px] md:w-[350px] lg:w-[480px]
            bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer
            transform transition-all duration-300 hover:scale-105"
          >
            <img
              src={card.image}
              alt={card.name}
              className="w-full h-60 sm:h-72 md:h-60 object-cover rounded-lg mb-4"
            />
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold text-white">{card.name}</h3>
            </div>
            <div className="flex items-center justify-between text-gray-400">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{card.date}</span>
              </div>
              <p className="text-primary font-bold">{card.price_set}đ</p>
            </div>
          </div>
        ))}
      </div>

      {/* Music */}
      <motion.div
        className="mt-16 flex items-center justify-between"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        {/* Tiêu đề */}
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

      {/* Hiển thị 2 card trên mobile, 4 card trên PC */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 mt-8">
        {musicEvents.slice(0, 4).map((card) => (
          <div
            key={card._id}
            className="bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer
  transform transition-all duration-300 hover:scale-105 flex flex-col justify-between h-full"
          >
            <div>
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-48 sm:h-60 md:h-60 object-cover rounded-lg mb-4"
              />
              <div className="flex justify-between items-center mb-4 px-3">
                <h3 className="text-base md:text-lg font-bold text-white leading-tight line-clamp-2">
                  {card.name}
                </h3>
              </div>
            </div>

            {/* Phần ngày + giá luôn ở cuối card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white px-3 pb-3 text-sm md:text-base gap-1 mt-auto">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{card.date}</span>
              </div>
              <p className="text-primary font-bold">{card.price_set}đ</p>
            </div>
          </div>
        ))}
      </div>

      {/* Theater & Art */}
      <motion.div
        className="mt-16 flex items-center justify-between"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        {/* Tiêu đề */}
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

      {/* Hiển thị 2 card trên mobile, 4 card trên PC */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 mt-8">
        {theater_artEvents.slice(0, 4).map((card) => (
          <div
            key={card._id}
            className="bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer
      transform transition-all duration-300 hover:scale-105 flex flex-col justify-between h-full"
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
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white-400 px-3 pb-3 text-sm md:text-base gap-1">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{card.date}</span>
              </div>
              <p className="text-primary font-bold">{card.price_set}đ</p>
            </div>
          </div>
        ))}
      </div>

      {/* Sport */}
      <motion.div
        className="mt-16 flex items-center justify-between"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        {/* Tiêu đề */}
        <p className="text-xl md:text-3xl font-semibold tracking-wide">
          <span className="text-primary">Sport</span>
        </p>

        <motion.button
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 200 }}
          onClick={() => navigate("/sport")}
          className="flex items-center gap-2 text-sm md:text-base text-primary font-semibold cursor-pointer"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Hiển thị 2 card trên mobile, 4 card trên PC */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 mt-8">
        {sportEvents.slice(0, 4).map((card) => (
          <div
            key={card._id}
            className="bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer
  transform transition-all duration-300 hover:scale-105 flex flex-col justify-between h-full"
          >
            <div>
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-48 sm:h-60 md:h-60 object-cover rounded-lg mb-4"
              />
              <div className="flex justify-between items-center mb-4 px-3">
                <h3 className="text-base md:text-lg font-bold text-white leading-tight line-clamp-2">
                  {card.name}
                </h3>
              </div>
            </div>

            {/* Phần ngày + giá luôn ở cuối card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white px-3 pb-3 text-sm md:text-base gap-1 mt-auto">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{card.date}</span>
              </div>
              <p className="text-primary font-bold">{card.price_set}đ</p>
            </div>
          </div>
        ))}
      </div>

      {/* Other */}
      <motion.div
        className="mt-16 flex items-center justify-between"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        {/* Tiêu đề */}
        <p className="text-xl md:text-3xl font-semibold tracking-wide">
          <span className="text-primary">Other</span>
        </p>

        <motion.button
          whileHover={{ x: 5 }}
          transition={{ type: "spring", stiffness: 200 }}
          onClick={() => navigate("/other")}
          className="flex items-center gap-2 text-sm md:text-base text-primary font-semibold cursor-pointer"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Hiển thị 2 card trên mobile, 4 card trên PC */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 mt-8">
        {otherEvents.slice(0, 4).map((card) => (
          <div
            key={card._id}
            className="bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer
  transform transition-all duration-300 hover:scale-105 flex flex-col justify-between h-full"
          >
            <div>
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-48 sm:h-60 md:h-60 object-cover rounded-lg mb-4"
              />
              <div className="flex justify-between items-center mb-4 px-3">
                <h3 className="text-base md:text-lg font-bold text-white leading-tight line-clamp-2">
                  {card.name}
                </h3>
              </div>
            </div>

            {/* Phần ngày + giá luôn ở cuối card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white px-3 pb-3 text-sm md:text-base gap-1 mt-auto">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{card.date}</span>
              </div>
              <p className="text-primary font-bold">{card.price_set}đ</p>
            </div>
          </div>
        ))}
      </div>

      {/* This week and this month */}
      <motion.div
        className="mt-16 flex items-center justify-between"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        {/* Tiêu đề */}
        <div className="flex gap-6">
          <button
            onClick={() => setSelectedTab("week")}
            className={`text-xl md:text-3xl font-semibold tracking-wide transition-all  cursor-pointer ${
              selectedTab === "week"
                ? "text-primary underline underline-offset-8 border-b-2 border-primary"
                : "text-white-400"
            }`}
          >
            This Week
          </button>

          <button
            onClick={() => setSelectedTab("month")}
            className={`text-xl md:text-3xl font-semibold tracking-wide transition-all  cursor-pointer ${
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
          transition={{ type: "spring", stiffness: 200 }}
          onClick={() => navigate("/theatersandart")}
          className="flex items-center gap-2 text-sm md:text-base text-primary font-semibold cursor-pointer"
        >
          View All
          <ArrowRight className="w-4 h-4" />
        </motion.button>
      </motion.div>

      {/* Hiển thị 2 card trên mobile, 4 card trên PC */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6 px-4 mt-8">
        {sortedFilteredEvents.slice(0, 4).map((card) => (
          <div
            key={card._id}
            className="bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer
  transform transition-all duration-300 hover:scale-105 flex flex-col justify-between h-full"
          >
            <div>
              <img
                src={card.image}
                alt={card.name}
                className="w-full h-48 sm:h-60 md:h-60 object-cover rounded-lg mb-4"
              />
              <div className="flex justify-between items-center mb-4 px-3">
                <h3 className="text-base md:text-lg font-bold text-white leading-tight line-clamp-2">
                  {card.name}
                </h3>
              </div>
            </div>

            {/* Phần ngày + giá luôn ở cuối card */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between text-white px-3 pb-3 text-sm md:text-base gap-1 mt-auto">
              <div className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                <span>{card.date}</span>
              </div>
              <p className="text-primary font-bold">{card.price_set}đ</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FeaturedSection;
