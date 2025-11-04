import React, { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { assets } from "../assets/assets";
import { MenuIcon, SearchIcon, TicketPlus, XIcon } from "lucide-react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const { openSignIn } = useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef(null);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);
  const [results, setResults] = useState([]);

  // ✅ Theo dõi cuộn để ẩn navbar
  useEffect(() => {
  const handleScroll = () => {
      // Nếu popup search mở thì không cho navbar biến mất
      if (isSearchOpen) {
        setIsVisible(true);
        return;
      }

      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) setIsVisible(false);
      else setIsVisible(true);
      setLastScrollY(currentScrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY, isSearchOpen]);


  // ✅ Click ngoài box thì đóng popup featured
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setIsSearchOpen(false);
        setTimeout(() => setResults([]), 200);
      }
    };
    document.addEventListener("pointerdown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);


  const isActive = (path) => location.pathname === path;


  return (
    <div
      className={`fixed top-0 left-0 z-50 w-full flex items-center justify-between px-6 md:px-16 lg:px-36 py-5 transition-transform duration-500 ${
        isVisible ? "translate-y-0" : "-translate-y-full"
      }`}
    >
      <Link to="/" className="max-md:flex-1">
        <img src={assets.logo} alt="" className="w-48 h-auto" />
      </Link>

      {/* Links */}
      <div
        className={`max-md:absolute max-md:top-0 max-md:left-0 max-md:font-medium max-md:text-lg z-50 flex flex-col md:flex-row items-center max-md:justify-center gap-12 md:px-8 py-4 max-md:h-screen md:rounded-full backdrop-blur bg-black/70 md:bg-white/10 md:border border-gray-300/20 overflow-hidden transition-[width] duration-300 md:ml-16 ${
          isOpen ? "max-md:w-full" : "max-md:w-0"
        }`}
      >
        <XIcon
          className="md:hidden absolute top-6 right-6 w-8 h-8 cursor-pointer"
          onClick={() => setIsOpen(!isOpen)}
        />
        {["/", "/music", "/theatersandart", "/sport", "/other"].map((path, i) => {
          const labels = ["Home", "Music", "Theaters & Art", "Sport", "Other"];
          return (
            <Link
              key={path}
              onClick={() => {
                scrollTo(0, 0);
                setIsOpen(false);
              }}
              to={path}
              className={`transition ${
                isActive(path)
                  ? "text-primary font-semibold"
                  : "text-white/70 hover:text-white"
              }`}
            >
              {labels[i]}
            </Link>
          );
        })}
      </div>

      {/* Search & User */}
      <div className="flex items-center gap-8 relative" ref={searchRef}>
        <div className="relative hidden md:block">
          <input
            type="text"
            placeholder="Search events, artists..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onFocus={() => setIsSearchOpen(true)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && searchTerm.trim() !== "") {
                navigate(`/search?q=${encodeURIComponent(searchTerm.trim())}`);
                setSearchTerm("");
                setIsSearchOpen(false);
              }
            }}
            className="pl-10 pr-4 py-2 rounded-2xl border border-gray-300 bg-white focus:outline-none focus:ring-2 focus:ring-primary transition-all w-64 text-black font-semibold"
          />
          <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 w-5 h-5 cursor-pointer" />

          {/* ✅ SEARCH DROPDOWN */}
          {isSearchOpen && (
            <div className="absolute top-full left-0 mt-2 w-[420px] bg-white shadow-xl border rounded-xl p-4 z-50 animate-fadeIn">

              {/* Nếu đang nhập searchTerm → Gợi ý */}
              {searchTerm.trim() !== "" ? (
                <div className="space-y-2">
                  <p className="text-sm text-gray-600">Search suggestions</p>
                  {["Taylor Swift Tour", "Ho Chi Minh Concert", "EDM Festival", "Comedy Show"]
                    .filter(item => item.toLowerCase().includes(searchTerm.toLowerCase()))
                    .map((item, i) => (
                      <div
                        key={i}
                        className="px-3 py-2 flex gap-3 items-center hover:bg-gray-100 rounded-lg cursor-pointer"
                        onClick={() => navigate(`/search?q=${item}`)}
                      >
                        <SearchIcon className="w-4 h-4 text-gray-500" />
                        <span className="text-black">{item}</span>
                      </div>
                    ))}
                </div>
              ) : (
                /* ✅ Featured search khi chưa gõ */
                <div>
                  <p className="text-sm text-gray-600 mb-2">Trending Searches</p>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {["Jazz Night", "Rock Concert", "KPop Show", "Theater", "Stand-up Comedy"].map((tag, i) => (
                      <span
                        key={i}
                        onClick={() => navigate(`/search?q=${tag}`)}
                        className="text-xs bg-gray-200 hover:bg-primary hover:text-white transition px-3 py-1 rounded-full cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>

                  <p className="text-sm text-gray-600 mb-2">Popular Events</p>
                  <div className="space-y-2">
                    {[
                      { name: "Jazz Night Live", img: "https://i.ibb.co/2kQZ5W8/event1.jpg" },
                      { name: "Orchestra Symphony", img: "https://i.ibb.co/Ht4qWjh/event2.jpg" },
                      { name: "Kpop Tour 2025", img: "https://i.ibb.co/MG3Rw6Z/event3.jpg" },
                    ].map((ev, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-3 p-2 hover:bg-gray-100 rounded-lg cursor-pointer"
                        onClick={() => navigate("/music")}
                      >
                        <img src={ev.img} className="w-10 h-10 rounded-md object-cover" />
                        <p className="font-medium text-black text-sm">{ev.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

  <SearchIcon className="md:hidden w-6 h-6 cursor-pointer ml-2" />

  {!user ? (
    <button
      onClick={openSignIn}
      className="px-4 py-1 sm:px-7 sm:py-2 bg-primary hover:bg-primary-dull transition rounded-full font-bold cursor-pointer -ml-2"
    >
      Login
    </button>
  ) : (
    <UserButton appearance={{ elements: { avatarBox: { border: "2px solid #F84565", width: "48px", height: "48px" }}}}
    >
      <UserButton.MenuItems>
        <UserButton.Action
          label="My Tickets"
          labelIcon={<TicketPlus width={15} />}
          onClick={() => navigate("/my-tickets")}
        />
      </UserButton.MenuItems>
    </UserButton>
  )}
</div>


      <MenuIcon
        className="max-md:ml-4 md:hidden w-8 h-8 cursor-pointer"
        onClick={() => setIsOpen(!isOpen)}
      />
    </div>
  );
};

export default Navbar;
