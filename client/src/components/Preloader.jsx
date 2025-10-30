import React from "react";

const Preloader = ({ fadeOut }) => {
  return (
    <div
      className={`fixed inset-0 flex flex-col items-center justify-center bg-neutral-900 z-50 transition-opacity duration-700 ${
        fadeOut ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
    >
      {/* 3 chấm animation loading */}
      <div className="flex space-x-2">
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce-dot delay-[0ms]"></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce-dot delay-[200ms]"></div>
        <div className="w-3 h-3 bg-primary rounded-full animate-bounce-dot delay-[400ms]"></div>
      </div>

      <p className="mt-4 text-primary font-bold text-2xl">Loading...</p>
    </div>
  );
};

export default Preloader;
