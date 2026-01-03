import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock, Users, Share2, Heart, ShoppingCart, Check } from "lucide-react";
import { useUser, useClerk } from "@clerk/clerk-react";
import { useCart } from "../context/CartContext";
import SeatSelection from "../components/SeatSelection";
import toast from "react-hot-toast";

const API_BASE = "http://localhost:5000/api";

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const formatTime = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
};

const formatPrice = (price) => {
  if (!price) return '0';
  return new Intl.NumberFormat('vi-VN').format(price);
};

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();
  const { addToCart, cartItems } = useCart();
  
  const [event, setEvent] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    // Fetch single concert by id
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_BASE}/concerts/${id}`);
        if (res.ok) {
          const response = await res.json();
          // API returns { data: { concert, ticketClasses, seatStats } }
          const concertData = response.data?.concert || response.data || response;
          const ticketClasses = response.data?.ticketClasses || [];
          
          // Merge ticket classes into concert data
          setEvent({
            ...concertData,
            ticket_classes: ticketClasses
          });
        } else {
          console.error('Failed to fetch event');
        }

        // recommended: fetch all and pick random 4
        const r = await fetch(`${API_BASE}/concerts`);
        const allEventsData = await r.json();
        const allEvents = allEventsData.data?.concerts || allEventsData.data || allEventsData.concerts || [];
        const others = allEvents.filter((e) => e._id !== id);
        // shuffle
        for (let i = others.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [others[i], others[j]] = [others[j], others[i]];
        }
        setRecommended(others.slice(0, 4));
      } catch (err) {
        console.error("Error fetching event detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
  }, [id]);

  useEffect(() => {
    if (event && event.ticket_classes && event.ticket_classes.length > 0) {
      setSelectedTicket(event.ticket_classes[0]);
    }
  }, [event]);

  const handleBuy = () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    
    // If event has seat selection, show seat map
    if (event.hasSeats || event.ticket_classes?.some(t => t.hasSeats)) {
      setShowSeatSelection(true);
      return;
    }
    
    // Otherwise go directly to checkout
    const ticketClass = selectedTicket || { name: "General", price: event.base_price || 0 };
    navigate("/checkout", {
      state: {
        event,
        ticketClass,
        quantity,
        selectedSeats: null,
      },
    });
  };

  const handleSeatSelect = (selectedSeats) => {
    setShowSeatSelection(false);
    const ticketClass = selectedTicket || { name: "General", price: event.base_price || 0 };
    navigate("/checkout", {
      state: {
        event,
        ticketClass,
        quantity: selectedSeats.length,
        selectedSeats,
      },
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: window.location.href,
      });
    } catch (err) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      alert("Link copied to clipboard!");
    }
  };

  const toggleWishlist = () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }
    setIsWishlisted(!isWishlisted);
    // TODO: Call API to save wishlist
  };

  const handleAddToCart = () => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    const ticketClass = selectedTicket || { 
      _id: 'general', 
      name: "General Admission", 
      price: event.base_price || 0 
    };

    addToCart({
      eventId: event._id,
      eventTitle: event.title,
      eventThumbnail: event.thumbnail,
      eventDate: event.start_time,
      eventVenue: event.venue?.name || event.venue || "TBA",
      ticketClassId: ticketClass._id || ticketClass.name,
      ticketClassName: ticketClass.name,
      price: ticketClass.price,
      quantity,
    });

    setAddedToCart(true);
    toast.success(`Added ${quantity} ticket(s) to cart!`);
    
    setTimeout(() => setAddedToCart(false), 2000);
  };

  if (loading) return <div className="px-6 md:px-16 pt-32 text-white">Loading...</div>;
  if (!event) return <div className="px-6 md:px-16 pt-32 text-white">Event not found</div>;

  return (
    <div className="text-white pt-28 pb-12 px-6 md:px-16 lg:px-24">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="rounded-xl overflow-hidden">
            <img src={event.thumbnail} alt={event.title} className="w-full h-72 object-cover rounded-lg" />
            <div className="mt-5">
              <h1 className="text-3xl md:text-4xl font-bold">{event.title}</h1>
              <div className="flex items-center gap-4 mt-3 text-gray-300">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{formatDate(event.start_time)}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{formatTime(event.start_time) || "TBA"}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{event.venue?.name || event.venue || "Unknown place"}</div>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <section className="mt-8 bg-[rgb(37,36,36)] p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              {event.description || "No description provided for this event."}
            </p>
          </section>

          {/* Venue Info */}
          {event.venue && typeof event.venue === 'object' && (
            <section className="mt-6 bg-[rgb(37,36,36)] p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-3">Venue</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-lg font-medium text-white">{event.venue.name}</h3>
                  <p className="text-gray-400">{event.venue.address}{event.venue.city ? `, ${event.venue.city}` : ''}</p>
                </div>
                {event.venue.google_maps_url && (
                  <a 
                    href={event.venue.google_maps_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition text-sm"
                  >
                    <MapPin className="w-4 h-4" />
                    View on Google Maps
                  </a>
                )}
              </div>
            </section>
          )}

          {/* Schedule & Seating */}
          <section className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-[rgb(37,36,36)] p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Event Schedule</h3>
              <ul className="text-gray-300 space-y-2">
                {event.schedule && event.schedule.length > 0 ? (
                  event.schedule.map((s, i) => (
                    <li key={i} className="flex justify-between">
                      <span>{s.title}</span>
                      <span className="text-gray-400">{s.time}</span>
                    </li>
                  ))
                ) : (
                  <li>{event.time || "No schedule available."}</li>
                )}
              </ul>
            </div>

            <div className="bg-[rgb(37,36,36)] p-6 rounded-lg">
              <h3 className="text-lg font-semibold mb-3">Seating Chart</h3>
              <div className="grid grid-cols-10 gap-1">
                {Array.from({ length: 80 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-full h-6 rounded-sm text-[10px] flex items-center justify-center ${i % 7 === 0 ? "bg-red-600" : "bg-green-600"}`}
                    title={`Seat ${i + 1} ${i % 7 === 0 ? "(VIP - limited)" : "(Available)"}`}
                  />
                ))}
              </div>
              <div className="flex gap-3 mt-3 text-sm text-gray-300">
                <div className="flex items-center gap-2"><span className="w-4 h-4 bg-green-600 rounded-sm inline-block" /> Available</div>
                <div className="flex items-center gap-2"><span className="w-4 h-4 bg-red-600 rounded-sm inline-block" /> Premium</div>
              </div>
            </div>
          </section>
        </div>

        {/* Right column: tickets & organizer */}
        <aside className="md:col-span-1">
          <div className="bg-[rgb(37,36,36)] p-6 rounded-lg">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">Tickets</h3>
              <div className="flex gap-2">
                <button 
                  onClick={toggleWishlist}
                  className={`p-2 rounded-full transition ${isWishlisted ? 'bg-primary text-black' : 'bg-white/10 hover:bg-white/20'}`}
                  title="Add to Wishlist"
                >
                  <Heart className={`w-5 h-5 ${isWishlisted ? 'fill-current' : ''}`} />
                </button>
                <button 
                  onClick={handleShare}
                  className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition"
                  title="Share"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>
            <p className="text-gray-400">Select ticket type and quantity</p>

            <div className="mt-4 space-y-3">
              {event.ticket_classes && event.ticket_classes.length > 0 ? (
                <select
                  value={selectedTicket ? selectedTicket.name : ""}
                  onChange={(e) => {
                    const t = event.ticket_classes.find((t) => t.name === e.target.value);
                    setSelectedTicket(t);
                  }}
                  className="w-full p-3 rounded-lg bg-black/30 border border-gray-700 focus:border-primary focus:outline-none"
                >
                  {event.ticket_classes.map((t) => (
                    <option key={t._id || t.name} value={t.name}>{`${t.name} - ${formatPrice(t.price)}đ (${t.available || t.available_qty || 0} left)`}</option>
                  ))}
                </select>
              ) : (
                <div className="text-2xl font-bold text-primary">
                  {event.priceRange ? (
                    `From ${formatPrice(event.priceRange.min)}đ`
                  ) : (
                    'Price TBA'
                  )}
                </div>
              )}

              <div className="flex items-center justify-between py-3 border-t border-gray-700">
                <label className="text-gray-300">Quantity</label>
                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600"
                  >
                    -
                  </button>
                  <span className="w-8 text-center font-semibold">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(10, quantity + 1))}
                    className="w-8 h-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600"
                  >
                    +
                  </button>
                </div>
              </div>

              <button 
                onClick={handleBuy} 
                className="w-full py-3 bg-primary text-black font-bold text-lg rounded-lg hover:bg-primary-dull transition"
              >
                {isSignedIn ? 'Buy Now' : 'Sign in to Buy'}
              </button>

              <button 
                onClick={handleAddToCart}
                disabled={addedToCart}
                className={`w-full py-3 font-semibold rounded-lg transition flex items-center justify-center gap-2 ${
                  addedToCart 
                    ? 'bg-green-600 text-white' 
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
              >
                {addedToCart ? (
                  <>
                    <Check className="w-5 h-5" /> Added to Cart
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" /> Add to Cart
                  </>
                )}
              </button>
              
              {event.hasSeats && (
                <button 
                  onClick={() => {
                    if (!isSignedIn) {
                      openSignIn();
                      return;
                    }
                    setShowSeatSelection(true);
                  }}
                  className="w-full py-3 bg-white/10 text-white font-semibold rounded-lg hover:bg-white/20 transition"
                >
                  Select Seats
                </button>
              )}
            </div>
          </div>

          <div className="bg-[rgb(37,36,36)] p-6 rounded-lg mt-6">
            <h3 className="text-lg font-semibold">Organizer</h3>
            <p className="text-gray-300 mt-2">
              {event.organizer?.organizer?.company_name || event.organizer?.username || event.organizer?.fullName || "Unknown Organizer"}
            </p>
            <p className="text-gray-400 text-sm mt-1">
              {event.organizer?.organizer?.description || "Event organized and managed professionally."}
            </p>
          </div>
        </aside>
      </div>

      {/* Seat Selection Modal */}
      {showSeatSelection && (
        <SeatSelection
          concert={event}
          zones={event.zones || [
            { name: "VIP", price: 2500000 },
            { name: "Zone A", price: 1500000 },
            { name: "Zone B", price: 800000 },
          ]}
          ticketClasses={event.ticket_classes}
          onSelect={handleSeatSelect}
          onClose={() => setShowSeatSelection(false)}
          maxSeats={10}
        />
      )}

      {/* Recommended */}
      <section className="mt-10">
        <h3 className="text-2xl font-semibold mb-4">Recommended Events</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommended.map((rec) => (
            <div key={rec._id} onClick={() => navigate(`/event/${rec._id}`)} className="bg-[rgb(37,36,36)] rounded-lg overflow-hidden cursor-pointer">
              <img src={rec.thumbnail} className="w-full h-36 object-cover" />
              <div className="p-3">
                <div className="font-semibold line-clamp-2">{rec.title}</div>
                <div className="text-sm text-gray-400 mt-2">{formatDate(rec.start_time)} • {formatPrice(rec.base_price)}đ</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EventDetail;
