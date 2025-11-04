import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, MapPin, Clock } from "lucide-react";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [event, setEvent] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [quantity, setQuantity] = useState(1);

  useEffect(() => {
    // Try fetching single event by id, fallback to fetching all
    const fetchEvent = async () => {
      try {
        const res = await fetch(`http://localhost:5000/events/${id}`);
        if (res.ok) {
          const data = await res.json();
          setEvent(data);
        } else {
          // fallback to all
          const r2 = await fetch("http://localhost:5000/events");
          const all = await r2.json();
          const found = all.find((e) => e._id === id || e.id === id);
          setEvent(found || all[0]);
        }

        // recommended: fetch all and pick random 4
        const r = await fetch("http://localhost:5000/events");
        const allEvents = await r.json();
        const others = allEvents.filter((e) => e._id !== id && e._id !== (event && event._id));
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  useEffect(() => {
    if (event && event.tickets && event.tickets.length > 0) {
      setSelectedTicket(event.tickets[0]);
    }
  }, [event]);

  const handleBuy = () => {
    if (!selectedTicket && !event) return;
    const price = selectedTicket ? selectedTicket.price : event.price_set || 0;
    const total = price * quantity;
    alert(`Buying ${quantity} x ${selectedTicket ? selectedTicket.seatType : "General"} - Total: ${total}đ`);
  };

  if (loading) return <div className="px-6 md:px-16 pt-32 text-white">Loading...</div>;
  if (!event) return <div className="px-6 md:px-16 pt-32 text-white">Event not found</div>;

  return (
    <div className="text-white pt-28 pb-12 px-6 md:px-16 lg:px-24">
      {/* Hero */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2">
          <div className="rounded-xl overflow-hidden">
            <img src={event.image} alt={event.name} className="w-full h-96 object-cover rounded-lg" />
            <div className="mt-5">
              <h1 className="text-3xl md:text-4xl font-bold">{event.name}</h1>
              <div className="flex items-center gap-4 mt-3 text-gray-300">
                <div className="flex items-center gap-2"><Calendar className="w-4 h-4" />{event.date}</div>
                <div className="flex items-center gap-2"><Clock className="w-4 h-4" />{event.time || "TBA"}</div>
                <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />{event.place || event.venue || "Unknown place"}</div>
              </div>
            </div>
          </div>

          {/* Introduction */}
          <section className="mt-8 bg-[rgb(37,36,36)] p-6 rounded-lg">
            <h2 className="text-xl font-semibold mb-3">Introduction</h2>
            <p className="text-gray-300 leading-relaxed">
              {event.description || event.intro || "No description provided for this event."}
            </p>
          </section>

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
            <h3 className="text-xl font-semibold">Tickets</h3>
            <p className="text-gray-400 mt-2">Select ticket type and quantity</p>

            <div className="mt-4 space-y-3">
              {event.tickets && event.tickets.length > 0 ? (
                <select
                  value={selectedTicket ? selectedTicket.seatType : ""}
                  onChange={(e) => {
                    const t = event.tickets.find((t) => t.seatType === e.target.value);
                    setSelectedTicket(t);
                  }}
                  className="w-full p-2 rounded bg-black/30"
                >
                  {event.tickets.map((t) => (
                    <option key={t.seatType} value={t.seatType}>{`${t.seatType} - ${t.price}đ (${t.available} left)`}</option>
                  ))}
                </select>
              ) : (
                <div className="text-gray-300">From {event.price_set}đ</div>
              )}

              <div className="flex items-center gap-3">
                <label className="text-gray-300">Qty</label>
                <input type="number" min={1} max={10} value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} className="w-20 p-2 rounded bg-black/30" />
              </div>

              <button onClick={handleBuy} className="w-full mt-2 bg-primary text-black font-semibold px-4 py-2 rounded">Buy Ticket</button>
            </div>
          </div>

          <div className="bg-[rgb(37,36,36)] p-6 rounded-lg mt-6">
            <h3 className="text-lg font-semibold">Organizer</h3>
            <p className="text-gray-300 mt-2">{(event.organizer && event.organizer.name) || "Unknown Organizer"}</p>
            <p className="text-gray-400 text-sm mt-1">{(event.organizer && event.organizer.description) || "No additional information."}</p>
            {event.organizer && event.organizer.contact && (
              <div className="mt-3 text-sm text-gray-400">
                <div>Contact: {event.organizer.contact}</div>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* Recommended */}
      <section className="mt-10">
        <h3 className="text-2xl font-semibold mb-4">Recommended Events</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {recommended.map((rec) => (
            <div key={rec._id} onClick={() => navigate(`/event/${rec._id}`)} className="bg-[rgb(37,36,36)] rounded-lg overflow-hidden cursor-pointer">
              <img src={rec.image} className="w-full h-36 object-cover" />
              <div className="p-3">
                <div className="font-semibold line-clamp-2">{rec.name}</div>
                <div className="text-sm text-gray-400 mt-2">{rec.date} • {rec.price_set}đ</div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};

export default EventDetail;
