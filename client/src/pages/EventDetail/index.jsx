/**
 * EventDetail Page - Redesigned
 * Shows comprehensive event information with sections:
 * 1. Category Bar with filters
 * 2. Event Info Header (blurred banner background)
 * 3. Content Navigation (Introduction, Schedule, Artists, Organizer)
 * 4. Introduction Section
 * 5. Event Schedule with Seat Chart and Show Times
 * 6. Artists Section
 * 7. Organizer Section
 * 8. Recommended Events
 * 9. Footer
 */

import React, { useEffect, useState, useRef } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useUser, useClerk } from "@clerk/clerk-react";
import CategoryBar from "../../components/CategoryBar";
import EventInfoHeader from "./components/EventInfoHeader";
import ContentNavbar from "./components/ContentNavbar";
import IntroductionSection from "./components/IntroductionSection";
import EventScheduleSection from "./components/EventScheduleSection";
import ArtistsSection from "./components/ArtistsSection";
import OrganizerSection from "./components/OrganizerSection";
import RecommendedEvents from "./components/RecommendedEvents";
import SeatSelection from "../../components/SeatSelection";

const API_BASE = "http://localhost:5000/api";

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isSignedIn } = useUser();
  const { openSignIn } = useClerk();

  const [event, setEvent] = useState(null);
  const [recommended, setRecommended] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showSeatSelection, setShowSeatSelection] = useState(false);
  const [selectedShow, setSelectedShow] = useState(null);
  const [selectedTicketClass, setSelectedTicketClass] = useState(null);

  // Refs for section scrolling
  const introRef = useRef(null);
  const scheduleRef = useRef(null);
  const artistsRef = useRef(null);
  const organizerRef = useRef(null);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const res = await fetch(`${API_BASE}/concerts/${id}`);
        if (res.ok) {
          const response = await res.json();
          const concertData = response.data?.concert || response.data || response;
          const ticketClasses = response.data?.ticketClasses || [];

          setEvent({
            ...concertData,
            ticket_classes: ticketClasses
          });
        } else {
          console.error('Failed to fetch event');
        }

        // Fetch recommended events (8 random events)
        const r = await fetch(`${API_BASE}/concerts?limit=20`);
        const allEventsData = await r.json();
        const allEvents = allEventsData.data?.concerts || allEventsData.data || allEventsData.concerts || [];
        const others = allEvents.filter((e) => e._id !== id);
        // Shuffle and pick 8
        for (let i = others.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [others[i], others[j]] = [others[j], others[i]];
        }
        setRecommended(others.slice(0, 8));
      } catch (err) {
        console.error("Error fetching event detail:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEvent();
    // Scroll to top on load
    window.scrollTo(0, 0);
  }, [id]);

  const handleBuyTicket = (ticketClass, showTime) => {
    if (!isSignedIn) {
      openSignIn();
      return;
    }

    setSelectedTicketClass(ticketClass);
    setSelectedShow(showTime);

    // If event has seats, show seat selection
    if (event.hasSeats || event.ticket_classes?.some(t => t.hasSeats)) {
      setShowSeatSelection(true);
      return;
    }

    // Otherwise go to checkout
    navigate("/checkout", {
      state: {
        event,
        ticketClass,
        quantity: 1,
        selectedSeats: null,
      },
    });
  };

  const handleSeatSelect = (selectedSeats) => {
    setShowSeatSelection(false);
    navigate("/checkout", {
      state: {
        event,
        ticketClass: selectedTicketClass,
        quantity: selectedSeats.length,
        selectedSeats,
      },
    });
  };

  const scrollToSection = (section) => {
    const refs = {
      introduction: introRef,
      schedule: scheduleRef,
      artists: artistsRef,
      organizer: organizerRef,
    };
    refs[section]?.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const handleCategoryChange = (slug) => {
    if (slug) {
      navigate(`/category/${slug}`);
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center">
        <div className="animate-spin w-10 h-10 border-3 border-primary border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen bg-[#1a1a1a] flex items-center justify-center text-white">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-4">Không tìm thấy sự kiện</h2>
          <Link to="/" className="text-primary hover:underline">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1a1a1a]">
      {/* Category Bar */}
      <div className="sticky top-16 z-40 bg-[#1a1a1a] border-b border-white/10">
        <div className="px-6 md:px-16 lg:px-24">
          <CategoryBar
            selectedCategory={null}
            onCategoryChange={handleCategoryChange}
            onHomeClick={() => navigate('/')}
          />
        </div>
      </div>

      {/* Event Info Header with Blurred Background */}
      <EventInfoHeader event={event} onBuyClick={handleBuyTicket} />

      {/* Content Navigation Bar */}
      <ContentNavbar onNavigate={scrollToSection} />

      {/* Introduction Section */}
      <div ref={introRef}>
        <IntroductionSection event={event} />
      </div>

      {/* Event Schedule Section */}
      <div ref={scheduleRef}>
        <EventScheduleSection 
          event={event} 
          onBuyTicket={handleBuyTicket}
        />
      </div>

      {/* Artists Section */}
      <div ref={artistsRef}>
        <ArtistsSection artists={event.artists} />
      </div>

      {/* Organizer Section */}
      <div ref={organizerRef}>
        <OrganizerSection organizer={event.organizer} />
      </div>

      {/* Recommended Events */}
      <RecommendedEvents events={recommended} />

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
    </div>
  );
};

export default EventDetail;
