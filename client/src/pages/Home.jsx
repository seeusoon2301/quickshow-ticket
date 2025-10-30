import React, { useState, useEffect } from "react";
import HeroSection from "../components/HeroSection";
import FeaturedSection from "../components/FeaturedSection";
import Preloader from "../components/Preloader";

const Home = () => {
  const [loading, setLoading] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const [showContent, setShowContent] = useState(false);

  useEffect(() => {
    // Random thời gian loading: 1.5s - 3s
    const randomDuration = Math.floor(Math.random() * 1500) + 1500;

    const timer1 = setTimeout(() => setFadeOut(true), randomDuration);
    const timer2 = setTimeout(() => {
      setLoading(false);
      setShowContent(true);
    }, randomDuration + 700);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);

  return (
    <>
      {loading && <Preloader fadeOut={fadeOut} />}

      <div
        className={`transition-all duration-1000 transform ${
          showContent
            ? "opacity-100 translate-y-0"
            : "opacity-0 translate-y-8"
        }`}
      >
        <HeroSection />
        <FeaturedSection />
      </div>
    </>
  );
};

export default Home;
