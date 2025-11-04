import React, { useState, useRef } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/effect-fade";
import "swiper/css/pagination";
import { backgrounds } from "../assets/assets";
import { ArrowRight, CalendarIcon, MapPinIcon } from "lucide-react";
import { motion } from "framer-motion";

const HeroSection = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const swiperRef = useRef(null);

  const handleThumbClick = (index) => {
    swiperRef.current.slideToLoop(index); // nhảy tới slide tương ứng
  };

  return (
    <div className="relative h-[80vh] md:h-screen w-full text-white overflow-hidden">
      <Swiper
        modules={[EffectFade, Autoplay]}
        effect="fade"
        autoplay={{ delay: 5000, disableOnInteraction: false }}
        slidesPerView={1}
        speed={1000}
        loop={true}
        onSwiper={(swiper) => (swiperRef.current = swiper)}
        onSlideChange={(swiper) => setActiveIndex(swiper.realIndex)}
      >
        {backgrounds.map((bg, index) => (
          <SwiperSlide key={index}>
            <div className="relative h-screen w-full">
              <motion.img
                key={bg.image}
                src={bg.image}
                className="absolute inset-0 w-full h-full object-cover -z-10"
              />
              <div className="absolute inset-0 bg-black/40 -z-10"></div>
              <motion.div className="absolute bottom-72 md:bottom-48 left-6 md:left-16 lg:left-36 max-w-[650px]">
                <h1 className="text-4xl md:text-6xl font-bold mb-4">{bg.name}</h1>
                <div className="flex flex-col sm:flex-row gap-4 text-gray-200 mb-4">
                  <div className="flex items-center gap-2">
                    <CalendarIcon /> {bg.time}
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPinIcon /> {bg.place}
                  </div>
                </div>
                <p className="text-gray-300 mb-5 max-w-md">{bg.description}</p>
                <button className="flex items-center gap-2 bg-primary px-6 py-3 rounded-full shadow-md font-medium">
                  Explore Now <ArrowRight />
                </button>
              </motion.div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* ✅ Custom Thumbnail Pagination */}
      <div className="absolute bottom-48 right-5 -translate-x-1/2 flex gap-3 z-20">
        {backgrounds.map((bg, index) => (
          <img
            key={index}
            src={bg.image}
            onClick={() => handleThumbClick(index)}
            className={`w-16 h-10 object-cover rounded-md cursor-pointer transition-all duration-300 
              ${activeIndex === index ? "ring-2 ring-primary opacity-100" : "opacity-60 hover:opacity-80"}`}
          />
        ))}
      </div>
    </div>
  );
};


export default HeroSection;
