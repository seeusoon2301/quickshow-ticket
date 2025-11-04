import React, { useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";

const SpecialEvents = () => {
  const [specialEvents, setSpecialEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("http://localhost:5000/events")
      .then((res) => res.json())
      .then((data) => {
        const specials = data.filter((e) => e.type === "special");

        // Delay để skeleton hiển thị
        setTimeout(() => {
          setSpecialEvents(specials);
          setLoading(false);
        }, 2000); // 1 giây
      })
      .catch((err) => {
        console.error("Lỗi fetch Special Events:", err);
        setLoading(false);
      });
  }, []);

  const SkeletonCard = () => (
    <div className="relative overflow-hidden rounded-2xl h-100 bg-black-300">
      <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/40 to-transparent animate-shimmer"></div>
    </div>
  );

  return (
    <>
      {loading ? (
        <div className="text-center mb-10">
          {/* Skeleton title */}
          <div className="mx-auto w-32 h-5 bg-gray-300 rounded animate-pulse mb-3"></div>
          <div className="mx-auto w-56 h-8 bg-gray-100 rounded animate-pulse"></div>
        </div>
      ) : (
        <div className="text-center mb-10">
          <p className="text-primary uppercase tracking-widest font-semibold">
            Special
          </p>
          <h2 className="text-4xl md:text-5xl font-bold">Events</h2>
        </div>
      )}

      <div className="relative">
        <button
          className={`custom-prev absolute -left-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow cursor-pointer ${
            loading ? "invisible" : ""
          }`}
        >
          <ion-icon name="arrow-back-outline" size="small"></ion-icon>
        </button>

        <button
          className={`custom-next absolute -right-4 top-1/2 -translate-y-1/2 z-10 w-9 h-9 bg-white rounded-full flex items-center justify-center shadow cursor-pointer ${
            loading ? "invisible" : ""
          }`}
        >
          <ion-icon name="arrow-forward-outline" size="small"></ion-icon>
        </button>


        <Swiper
          slidesPerView={1.2}
          spaceBetween={20}
          freeMode={{enabled: true,momentumRatio: 0.3, momentumVelocityRatio: 0.3,}}
          grabCursor={true}
          modules={[FreeMode, Navigation]}
          navigation={{
            nextEl: ".custom-next",
            prevEl: ".custom-prev",
          }}
          breakpoints={{
            0: { slidesPerView: 1.5 },
            640: { slidesPerView: 2.2 },
            768: { slidesPerView: 3.2 },
            1024: { slidesPerView: 4.2 },
            1280: { slidesPerView: 5 },
          }}
        >
          {loading
            ? [...Array(5)].map((_, i) => (
                <SwiperSlide key={i}>
                  <SkeletonCard />
                </SwiperSlide>
              ))
            : specialEvents.map((event) => (
                <SwiperSlide key={event._id}>
                  <div className="rounded-2xl overflow-hidden shadow-lg relative cursor-pointer">
                    <img
                      src={event.image}
                      alt={event.name}
                      className="w-full h-100 object-cover"
                    />
                    <div className="absolute inset-0 bg-linear-to-t from-black/50"></div>
                  </div>
                </SwiperSlide>
              ))}
        </Swiper>
      </div>
    </>
  );
};

export default SpecialEvents;
