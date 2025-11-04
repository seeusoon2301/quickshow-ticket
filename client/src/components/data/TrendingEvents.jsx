import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Calendar } from "lucide-react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";

const TopPicks = () => {
  const [trendingEvents, setTrendingEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then(res => res.json())
      .then(data => {
        const trendings = data.filter((e) => e.type === "trending");
        setTimeout(() => {
          setTrendingEvents(trendings);
          setLoading(false);
        }, 2000); 
      })
      .catch((err) => console.error("❌ Lỗi khi lấy dữ liệu:", err));
  }, []);
  const TrendingSkeletonCard = () => {
  return (
    <div className="shrink-0 w-[250px] sm:w-[300px] md:w-[350px] lg:w-[480px] 
      bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden">

      <div className="w-full h-60 sm:h-72 md:h-60 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer rounded-lg mb-4"></div>

      <div className="px-3 space-y-3 pb-3">
        <div className="h-5 bg-gray-700 rounded w-3/4 animate-shimmer"></div>

        <div className="flex justify-between items-center">
          <div className="h-4 bg-gray-900 rounded w-1/3 animate-shimmer"></div>
          <div className="h-4 bg-gray-800 rounded w-1/4 animate-shimmer"></div>
        </div>
      </div>
    </div>
  );
};
  return (
    <>
      <motion.div
        className="mt-16 text-center"
        initial={{ opacity: 0, y: 30 }}
        whileInView={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        viewport={{ once: true }}
      >
        {loading ? (
          <div className="mx-auto h-8 w-48 rounded bg-gray-200 animate-pulse"></div>
        ) : (
          <p className="text-xl md:text-3xl font-semibold tracking-wide">
            <span className="text-primary">Trending</span> For You
          </p>
        )}
      </motion.div>

      {/* Custom Navigation Arrows */}
      <div className="relative mt-8">
        <button 
          className={`tp-prev absolute -left-4 top-[40%] -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow cursor-pointer ${
            loading ? "invisible" : ""
          }`}
        >
          <ion-icon name="arrow-back-outline" size="small"></ion-icon>
        </button>

        <button 
          className={`tp-next absolute -right-4 top-[40%] -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow cursor-pointer ${
            loading ? "invisible" : ""
          }`}
        >
          <ion-icon name="arrow-forward-outline" size="small"></ion-icon>
        </button>


        <Swiper
          slidesPerView={1.3}
          spaceBetween={1}
          freeMode={{enabled: true,momentumRatio: 0.3, momentumVelocityRatio: 0.3,}}
          grabCursor={true}
          modules={[FreeMode, Navigation]}
          navigation={{
            nextEl: ".tp-next",
            prevEl: ".tp-prev",
          }}
          breakpoints={{
            640: { slidesPerView: 1.2 },
            768: { slidesPerView: 1.5 },
            1024: { slidesPerView: 2 },
            1280: { slidesPerView: 3.2 },
          }}
        >
          {loading
          ? [...Array(4)].map((_, i) => (
              <SwiperSlide key={i}>
                <TrendingSkeletonCard />
              </SwiperSlide>
            ))
          : trendingEvents.map((card) => (
              <SwiperSlide key={card._id}>
                <div
                  onClick={() => window.location.assign(`/event/${card._id}`)}
                  className="shrink-0 w-[250px] sm:w-[300px] md:w-[350px] lg:w-[480px]
                  bg-[rgb(37,36,36)] rounded-lg shadow-md overflow-hidden cursor-pointer"
                >
                  <img
                    src={card.image}
                    alt={card.name}
                    className="w-full h-60 sm:h-72 md:h-60 object-cover rounded-lg mb-4"
                  />

                  <div className="flex justify-between items-center mb-4 px-3">
                    <h3 className="text-lg font-bold text-white mb-2 line-clamp-1 truncate">
                      {card.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between text-gray-400 px-3 pb-3">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{card.date}</span>
                    </div>
                    <p className="text-primary font-bold">{card.price_set}đ</p>
                  </div>
                </div>
              </SwiperSlide>
            ))
        }

        </Swiper>
      </div>
    </>
  );
};

export default TopPicks;
