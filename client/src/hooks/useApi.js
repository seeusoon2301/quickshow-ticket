/**
 * Custom hooks for API calls with loading and error states
 */

import { useState, useCallback, useEffect } from "react";

/**
 * Generic hook for API calls with loading and error handling
 * @param {Function} apiFunction - The API function to call
 * @param {boolean} immediate - Whether to call immediately on mount
 * @returns {Object} { data, loading, error, execute }
 */
export const useApi = (apiFunction, immediate = false) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const execute = useCallback(
    async (...args) => {
      setLoading(true);
      setError(null);
      try {
        const result = await apiFunction(...args);
        setData(result);
        return result;
      } catch (err) {
        setError(err.message || "An error occurred");
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [apiFunction]
  );

  useEffect(() => {
    if (immediate) {
      execute();
    }
  }, [immediate]); // eslint-disable-line react-hooks/exhaustive-deps

  return { data, loading, error, execute, setData };
};

/**
 * Hook for fetching events
 */
export const useEvents = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvents = useCallback(async (params = {}) => {
    setLoading(true);
    setError(null);
    try {
      // For now, return mock data since backend isn't set up
      const mockEvents = [
        {
          _id: "1",
          title: "Anh Trai Vượt Ngàn Chông Gai Concert",
          description: "Concert hoành tráng với dàn nghệ sĩ khủng",
          start_time: "2025-02-15T19:00:00",
          end_time: "2025-02-15T22:00:00",
          status: "PUB",
          image: "https://salt.tkbcdn.com/ts/ds/42/ea/97/67d19b96ee0bb9c898cec87c57eade55.jpg",
          venue: { name: "Sân vận động Mỹ Đình", address: "Hà Nội" },
          ticketClasses: [
            { _id: "tc1", name: "VIP", price: 2000000, quota: 100 },
            { _id: "tc2", name: "Standard", price: 800000, quota: 500 },
          ],
        },
        {
          _id: "2",
          title: "Blackpink World Tour",
          description: "K-pop sensation in Vietnam",
          start_time: "2025-03-20T20:00:00",
          end_time: "2025-03-20T23:00:00",
          status: "PUB",
          image: "https://salt.tkbcdn.com/ts/ds/e0/3f/a9/dbfec49d4a16f668685e74b584eb9a07.jpg",
          venue: { name: "Phú Thọ Stadium", address: "TP.HCM" },
          ticketClasses: [
            { _id: "tc3", name: "VIP", price: 3500000, quota: 50 },
            { _id: "tc4", name: "Premium", price: 2000000, quota: 200 },
            { _id: "tc5", name: "Standard", price: 1000000, quota: 1000 },
          ],
        },
      ];
      setEvents(mockEvents);
      return mockEvents;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { events, loading, error, refetch: fetchEvents };
};

/**
 * Hook for fetching a single event
 */
export const useEvent = (eventId) => {
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchEvent = useCallback(async () => {
    if (!eventId) return;
    setLoading(true);
    setError(null);
    try {
      // Mock data for now
      const mockEvent = {
        _id: eventId,
        title: "Anh Trai Vượt Ngàn Chông Gai Concert",
        description: "Concert hoành tráng nhất năm 2025 với sự tham gia của dàn nghệ sĩ khủng từ chương trình Anh Trai Vượt Ngàn Chông Gai. Một đêm nhạc đầy cảm xúc và năng lượng.",
        start_time: "2025-02-15T19:00:00",
        end_time: "2025-02-15T22:00:00",
        status: "PUB",
        image: "https://salt.tkbcdn.com/ts/ds/42/ea/97/67d19b96ee0bb9c898cec87c57eade55.jpg",
        venue: { 
          name: "Sân vận động Mỹ Đình", 
          address: "Đường Lê Đức Thọ, Nam Từ Liêm, Hà Nội",
          total_capacity: 40000 
        },
        artists: [
          { _id: "a1", name: "Trọng Hiếu", image: "/artists/tronghieu.jpg" },
          { _id: "a2", name: "Noo Phước Thịnh", image: "/artists/noo.jpg" },
        ],
        ticketClasses: [
          { _id: "tc1", name: "SVIP", price: 5000000, quota: 50, sold_qty: 30 },
          { _id: "tc2", name: "VIP", price: 3000000, quota: 200, sold_qty: 150 },
          { _id: "tc3", name: "Premium", price: 1500000, quota: 500, sold_qty: 300 },
          { _id: "tc4", name: "Standard", price: 800000, quota: 1000, sold_qty: 600 },
        ],
        zones: [
          { _id: "z1", name: "Zone A - SVIP", capacity: 50 },
          { _id: "z2", name: "Zone B - VIP", capacity: 200 },
          { _id: "z3", name: "Zone C - Premium", capacity: 500 },
          { _id: "z4", name: "Zone D - Standard", capacity: 1000 },
        ],
      };
      setEvent(mockEvent);
      return mockEvent;
    } catch (err) {
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    fetchEvent();
  }, [fetchEvent]);

  return { event, loading, error, refetch: fetchEvent };
};

/**
 * Hook for user's orders
 */
export const useOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data
      const mockOrders = [
        {
          _id: "ord1",
          code: "QST2025010001",
          total_amount: 3000000,
          status: "PAID",
          created_at: "2025-01-10T10:30:00",
          event: { title: "Anh Trai Vượt Ngàn Chông Gai Concert", start_time: "2025-02-15T19:00:00" },
          items: [{ ticketClass: "VIP", quantity: 1, price: 3000000 }],
          payment: { method: "MOMO", status: "SUCCESS" },
        },
      ];
      setOrders(mockOrders);
      return mockOrders;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  return { orders, loading, error, refetch: fetchOrders };
};

/**
 * Hook for user's tickets
 */
export const useTickets = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Mock data
      const mockTickets = [
        {
          _id: "tkt1",
          ticket_code: "QST-20250115-VIP-001",
          qr_hash: "abc123xyz",
          status: "VALID",
          event: {
            title: "Anh Trai Vượt Ngàn Chông Gai Concert",
            start_time: "2025-02-15T19:00:00",
            image: "https://salt.tkbcdn.com/ts/ds/42/ea/97/67d19b96ee0bb9c898cec87c57eade55.jpg",
            venue: { name: "Sân vận động Mỹ Đình", address: "Hà Nội" },
          },
          ticketClass: "VIP",
          seat: { row: "A", number: 5 },
          zone: "Zone B - VIP",
        },
      ];
      setTickets(mockTickets);
      return mockTickets;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  return { tickets, loading, error, refetch: fetchTickets };
};

export default useApi;
