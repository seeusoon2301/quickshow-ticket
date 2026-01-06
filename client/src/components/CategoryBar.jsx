/**
 * CategoryBar Component - Category navigation with filter support
 * When a category is selected, shows additional filter bar
 */

import React, { useEffect, useState, useRef } from "react";
import { Music, Theater, Trophy, MoreHorizontal, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";

const API_BASE = "http://localhost:5000/api";

// Icon mapping
const iconMap = {
  Music: Music,
  Theater: Theater,
  Trophy: Trophy,
  MoreHorizontal: MoreHorizontal,
};

const CategoryBar = ({ 
  selectedCategory, 
  onCategoryChange, 
  onHomeClick,
  showFilters = false 
}) => {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  useEffect(() => {
    fetch(`${API_BASE}/categories`)
      .then((res) => res.json())
      .then((response) => {
        setCategories(response.data?.categories || []);
        setLoading(false);
      })
      .catch((err) => {
        console.error("Failed to fetch categories:", err);
        setLoading(false);
      });
  }, []);

  // Check scroll position
  const checkScroll = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 5);
    }
  };

  useEffect(() => {
    checkScroll();
    window.addEventListener("resize", checkScroll);
    return () => window.removeEventListener("resize", checkScroll);
  }, [categories]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      scrollRef.current.scrollBy({
        left: direction === "left" ? -200 : 200,
        behavior: "smooth",
      });
      setTimeout(checkScroll, 300);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-3 py-4">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-10 w-24 bg-white/10 rounded-full animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Scroll Left Button */}
      {canScrollLeft && (
        <button
          onClick={() => scroll("left")}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-[#2a2a2a] hover:bg-primary rounded-full shadow-lg transition"
        >
          <ChevronLeft size={18} className="text-white" />
        </button>
      )}

      {/* Categories Container */}
      <div
        ref={scrollRef}
        onScroll={checkScroll}
        className="flex items-center gap-2 py-4 overflow-x-auto scrollbar-hide"
      >
        {/* All Categories Button (acts as category option, not a homepage link) */}
        <div
          onClick={() => onCategoryChange(null)}
          role="button"
          tabIndex={0}
          onKeyDown={(e) => { if (e.key === 'Enter') onCategoryChange(null); }}
          className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer ${
            !selectedCategory
              ? "bg-primary text-white"
              : "bg-white/10 text-white/80 hover:bg-white/20"
          }`}
        >
          <span>Tất cả</span>
        </div>

        {/* Category Buttons */}
        {categories.map((cat) => {
          const isSelected = selectedCategory === cat.slug;
          return (
            <div
              key={cat._id}
              onClick={() => onCategoryChange(isSelected ? null : cat.slug)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap font-medium transition-all cursor-pointer ${
                isSelected
                  ? "text-white"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
              style={isSelected ? { backgroundColor: cat.color || "#F84565" } : {}}
            >
              <span>{cat.name}</span>
            </div>
          );
        })}
      </div>

      {/* Scroll Right Button */}
      {canScrollRight && (
        <button
          onClick={() => scroll("right")}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 p-1.5 bg-[#2a2a2a] hover:bg-primary rounded-full shadow-lg transition"
        >
          <ChevronRight size={18} className="text-white" />
        </button>
      )}
    </div>
  );
};

export default CategoryBar;
