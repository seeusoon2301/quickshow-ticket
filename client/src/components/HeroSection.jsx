import React, { useState, useEffect } from "react";
import { backgrounds } from "../assets/assets";
import { ArrowRight, CalendarIcon, MapPinIcon } from "lucide-react";

const HeroSection = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Tự động chuyển slide
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) =>
        prevIndex === backgrounds.length - 1 ? 0 : prevIndex + 1
      );
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const bg = backgrounds[currentIndex];

  return (
    <div className="relative flex flex-col items-start justify-center gap-4 px-6 md:px-16 lg:px-36 h-screen text-white transition-all duration-700 overflow-hidden">

      <img
        src={bg.image}
        alt={bg.name}
        className="absolute inset-0 w-full h-full 
          object-contain sm:object-cover 
          transition-all duration-700 -z-10"
      />

      <div className="absolute  inset-0 bg-black/40 -z-10"></div>

      <div
        className="absolute inset-y-0 left-0 w-1/2 pointer-events-none hidden sm:block -z-10"
        style={{
          backdropFilter: "blur(24px)",
          WebkitBackdropFilter: "blur(24px)",
          maskImage:
            "linear-gradient(to right, black 0%, rgba(0,0,0,0.6) 80%, transparent 100%)",
          WebkitMaskImage:
            "linear-gradient(to right, black 0%, rgba(0,0,0,0.6) 80%, transparent 100%)",
        }}
      ></div>


      <div className="absolute bottom-15 md:bottom-48 z-10 max-w-[700px] px-3 md:text-left">

        <h1
          className="text-[22px] sm:text-[28px] md:text-[48px] leading-tight md:leading-[1.1]
    font-semibold drop-shadow-lg mb-3 -mt-6 md:mt-0 wrap-break-words"
        >
          {bg.name}
        </h1>

        <div
          className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6
    text-gray-200 text-sm sm:text-base md:text-lg mb-4 -mt-2 md:mt-0"
        >
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{bg.time}</span>
          </div>

          <div className="flex items-center gap-2">
            <MapPinIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>{bg.place}</span>
          </div>
        </div>

        <p
          className="max-w-md text-gray-300 mb-6 text-xs sm:text-sm md:text-base
    leading-relaxed opacity-90"
        >
          {bg.description}
        </p>

        <button
          className="flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3
    text-xs sm:text-sm md:text-base bg-primary hover:bg-primary/80
    transition rounded-full font-medium cursor-pointer shadow-md"
        >
          Explore Now <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>
      </div>

      <div className="absolute bottom-10 left-1/2 transform -translate-x-1/2 flex gap-3 z-10">
        {backgrounds.map((_, i) => (
          <div
            key={i}
            onClick={() => setCurrentIndex(i)}
            className={`w-3 h-3 rounded-full cursor-pointer transition-all ${
              i === currentIndex ? "bg-primary scale-125" : "bg-gray-500"
            }`}
          ></div>
        ))}
      </div>
    </div>
  );
};

export default HeroSection;
