import React from "react";
import SpecialEvents from "./data/SpecialEvents";
import TopPicks from "./data/TrendingEvents";
import MusicEvents from "./data/MusicEvents";
import TheaterEvents from "./data/TheaterEvents";
import SportEvents from "./data/SportEvents";
import OtherEvents from "./data/OtherEvents";
import WeeklyMonthlyEvents from "./data/WeeklyMonthlyEvents";

const FeaturedSection = () => {

  return (
    <div className="relative px-6 md:px-16 lg:px-24 xl:px-44 py-16 text-white select-none">
      <SpecialEvents />
      <TopPicks />
      <MusicEvents />
      <TheaterEvents />
      <SportEvents />
      <OtherEvents />
      <WeeklyMonthlyEvents />
    </div>
  );
};

export default FeaturedSection;
