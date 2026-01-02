import React, { useEffect, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { Search as SearchIcon, Filter, Calendar, MapPin, X } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api";

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatPrice = (price) => {
  if (!price) return '0';
  return new Intl.NumberFormat('vi-VN').format(price);
};

const Search = () => {
  const navigate = useNavigate();
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    category: '',
    startDate: '',
    sortBy: 'start_time'
  });

  const query = new URLSearchParams(useLocation().search).get("q") || "";

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    setLoading(true);
    
    // Build query params
    const params = new URLSearchParams({
      search: query,
      ...(filters.category && { category: filters.category }),
      ...(filters.startDate && { startDate: filters.startDate }),
      sortBy: filters.sortBy
    });

    fetch(`${API_URL}/concerts?${params}`)
      .then((res) => res.json())
      .then((response) => {
        const concerts = response.data?.concerts || response.data || response.concerts || [];
        setResults(Array.isArray(concerts) ? concerts : []);
        setLoading(false);
      })
      .catch(() => {
        setResults([]);
        setLoading(false);
      });
  }, [query, filters]);

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'MUSIC', label: 'Music & Concert' },
    { value: 'THEATER', label: 'Theater & Art' },
    { value: 'SPORT', label: 'Sports' },
    { value: 'OTHER', label: 'Other' },
  ];

  return (
    <div className="px-6 md:px-16 lg:px-24 py-8 min-h-screen">
      <div className="mt-24 mb-8">
        <h2 className="text-2xl font-bold text-white mb-6">
          {query ? `Results for "${query}"` : 'Search Events'}
        </h2>

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition ${
              showFilters ? 'border-primary bg-primary/10 text-primary' : 'border-gray-700 text-gray-400 hover:border-gray-500'
            }`}
          >
            <Filter size={18} />
            Filters
          </button>
          
          {filters.category && (
            <span className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800 text-gray-300">
              {categories.find(c => c.value === filters.category)?.label}
              <X size={16} className="cursor-pointer hover:text-primary" onClick={() => setFilters(f => ({...f, category: ''}))} />
            </span>
          )}
        </div>

        {showFilters && (
          <div className="bg-[rgb(37,36,36)] rounded-xl p-4 mb-6 flex flex-wrap gap-4">
            <select
              value={filters.category}
              onChange={(e) => setFilters(f => ({...f, category: e.target.value}))}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-primary focus:outline-none"
            >
              {categories.map(cat => (
                <option key={cat.value} value={cat.value}>{cat.label}</option>
              ))}
            </select>

            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => setFilters(f => ({...f, startDate: e.target.value}))}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-primary focus:outline-none"
            />

            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(f => ({...f, sortBy: e.target.value}))}
              className="px-4 py-2 rounded-lg bg-gray-800 text-white border border-gray-700 focus:border-primary focus:outline-none"
            >
              <option value="start_time">Date (Soonest)</option>
              <option value="-start_time">Date (Latest)</option>
              <option value="base_price">Price (Low to High)</option>
              <option value="-base_price">Price (High to Low)</option>
            </select>
          </div>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
            <div
              key={i}
              className="bg-gray-800 rounded-xl overflow-hidden shadow-md animate-pulse"
            >
              <div className="w-full h-44 bg-gray-700"></div>
              <div className="p-4 space-y-3">
                <div className="h-4 bg-gray-700 rounded w-3/4"></div>
                <div className="h-3 bg-gray-700 rounded w-1/2"></div>
                <div className="h-4 bg-gray-700 rounded w-1/3 mt-3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : results.length === 0 ? (
        <div className="text-center py-16">
          <SearchIcon className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-400">No events found</h3>
          <p className="text-gray-500 mt-2">
            {query ? `No results for "${query}"` : 'Enter a search term to find events'}
          </p>
        </div>
      ) : (
        <>
          <p className="text-gray-400 mb-4">{results.length} events found</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {results.map((ev) => (
              <Link
                key={ev._id}
                to={`/event/${ev._id}`}
                className="bg-gray-900 rounded-xl shadow-md overflow-hidden hover:ring-2 hover:ring-primary transition-all group"
              >
                <div className="relative overflow-hidden">
                  <img
                    src={ev.thumbnail || 'https://via.placeholder.com/400x300'}
                    alt={ev.title}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  {ev.category && (
                    <span className="absolute top-2 left-2 px-2 py-1 bg-black/60 backdrop-blur-sm rounded text-xs text-white">
                      {ev.category}
                    </span>
                  )}
                </div>

                <div className="p-4">
                  <h3 className="text-lg font-bold text-white line-clamp-2 mb-2 group-hover:text-primary transition">
                    {ev.title}
                  </h3>
                  
                  <div className="flex items-center gap-2 text-gray-400 text-sm mb-2">
                    <Calendar size={14} />
                    <span>{formatDate(ev.start_time)}</span>
                  </div>
                  
                  {ev.venue && (
                    <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                      <MapPin size={14} />
                      <span className="truncate">{ev.venue.name || ev.venue}</span>
                    </div>
                  )}

                  <p className="text-primary font-bold">
                    {ev.base_price ? `${formatPrice(ev.base_price)}đ` : 'TBA'}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default Search;
