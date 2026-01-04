/**
 * EventInfoHeader Component
 * Displays event banner with blurred background, event details, and buy button
 */

import React from "react";
import { Calendar, Clock, MapPin, ExternalLink } from "lucide-react";
import { Facebook, Link2 } from "lucide-react";

const formatDate = (dateString) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('vi-VN', { 
    day: 'numeric', 
    month: 'long', 
    year: 'numeric' 
  });
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

const getStatusConfig = (status) => {
  const configs = {
    'PUB': { text: 'Đang mở bán', bgColor: 'bg-green-500', textColor: 'text-green-500' },
    'SOLDOUT': { text: 'Hết vé', bgColor: 'bg-red-500', textColor: 'text-red-500' },
    'DRAFT': { text: 'Sắp mở bán', bgColor: 'bg-yellow-500', textColor: 'text-yellow-500' },
    'CANCEL': { text: 'Đã hủy', bgColor: 'bg-gray-500', textColor: 'text-gray-500' },
    'COMPLETED': { text: 'Đã kết thúc', bgColor: 'bg-gray-500', textColor: 'text-gray-500' },
  };
  return configs[status] || configs['DRAFT'];
};

const EventInfoHeader = ({ event, onBuyClick }) => {
  const statusConfig = getStatusConfig(event.status);
  
  // Calculate cheapest ticket price
  const cheapestPrice = event.ticket_classes?.length > 0 
    ? Math.min(...event.ticket_classes.map(tc => tc.price))
    : event.priceRange?.min || 0;

  const highestPrice = event.ticket_classes?.length > 0 
    ? Math.max(...event.ticket_classes.map(tc => tc.price))
    : event.priceRange?.max || 0;

  // Build Google Maps URL from venue
  const getMapUrl = () => {
    if (event.venue?.google_maps_url) {
      return event.venue.google_maps_url;
    }
    const address = event.venue?.address || '';
    const city = event.venue?.city || '';
    const query = encodeURIComponent(`${address}, ${city}`);
    return `https://www.google.com/maps/search/?api=1&query=${query}`;
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: event.title,
        text: `Check out this event: ${event.title}`,
        url: window.location.href,
      });
    } catch (err) {
      navigator.clipboard.writeText(window.location.href);
      alert("Link đã được sao chép!");
    }
  };

  const handleFacebookShare = () => {
    const url = encodeURIComponent(window.location.href);
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${url}`, '_blank');
  };

  return (
    <div className="relative">
      {/* Blurred Background Banner */}
      <div className="absolute inset-0 h-[450px] overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center scale-110 blur-xl opacity-50"
          style={{ backgroundImage: `url(${event.thumbnail})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#1a1a1a]/60 to-[#1a1a1a]" />
      </div>

      {/* Content */}
      <div className="relative px-6 md:px-16 lg:px-24 py-10">
        <div className="flex flex-col lg:flex-row gap-10 items-start">
          {/* Event Thumbnail */}
          <div className="flex-shrink-0 w-full lg:w-auto">
            <div className="relative group">
              <img 
                src={event.thumbnail} 
                alt={event.title} 
                className="w-full lg:w-[400px] h-auto rounded-xl shadow-2xl object-cover"
              />
              {/* Overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-xl" />
            </div>
            
            {/* Buy Button (Mobile & Desktop) */}
            <button
              onClick={() => onBuyClick(event.ticket_classes?.[0])}
              disabled={event.status !== 'PUB'}
              className={`w-full mt-4 py-4 rounded-xl font-bold text-lg transition ${
                event.status === 'PUB'
                  ? 'bg-primary hover:bg-primary/90 text-black'
                  : 'bg-gray-600 cursor-not-allowed text-gray-300'
              }`}
            >
              Mua vé ngay
            </button>
          </div>

          {/* Event Info */}
          <div className="flex-1 text-white lg:pt-4">
            {/* Status Badge */}
            <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-medium ${statusConfig.bgColor} text-white mb-4`}>
              {statusConfig.text}
            </span>

            {/* Event Title */}
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8">{event.title}</h1>

            {/* Event Details */}
            <div className="space-y-5">
              {/* Date */}
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <p className="font-medium">{formatDate(event.start_time)}</p>
                  <p className="text-gray-400 text-sm">
                    Từ {formatTime(event.start_time)}
                    {event.end_time && ` - ${formatTime(event.end_time)}`}
                  </p>
                </div>
              </div>

              {/* Location */}
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0" />
                <div>
                  <a 
                    href={getMapUrl()}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium hover:text-primary transition inline-flex items-center gap-1"
                  >
                    {event.venue?.name || 'Địa điểm đang cập nhật'}
                    <ExternalLink className="w-4 h-4" />
                  </a>
                  <p className="text-gray-400 text-sm">
                    {event.venue?.address}
                    {event.venue?.city && `, ${event.venue.city}`}
                  </p>
                </div>
              </div>

              {/* Ticket Price */}
              <div className="flex items-start gap-3">
                <span className="w-5 h-5 text-gray-400 mt-1 flex-shrink-0 flex items-center justify-center font-bold">₫</span>
                <div>
                  <p className="font-medium">Giá vé</p>
                  <p className="text-gray-400 text-sm">
                    {cheapestPrice > 0 ? (
                      cheapestPrice === highestPrice 
                        ? `${formatPrice(cheapestPrice)} VND`
                        : `Từ ${formatPrice(cheapestPrice)} VND đến ${formatPrice(highestPrice)} VND`
                    ) : (
                      'Đang cập nhật'
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Social Share */}
            <div className="flex items-center gap-3 mt-6">
              <button
                onClick={handleFacebookShare}
                className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition"
                title="Chia sẻ Facebook"
              >
                <Facebook className="w-5 h-5 text-white" />
              </button>
              <button
                onClick={handleShare}
                className="p-3 bg-gray-600 hover:bg-gray-500 rounded-full transition"
                title="Sao chép link"
              >
                <Link2 className="w-5 h-5 text-white" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EventInfoHeader;
