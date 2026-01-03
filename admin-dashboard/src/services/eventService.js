/**
 * Event/Concert Service - API functions for event management
 */

import { API_URL, buildQueryString, handleResponse } from './api';

/**
 * Get concerts list with pagination and filters
 */
export const getConcerts = async (authFetch, { page = 1, limit = 10, search, status, category }) => {
  const query = buildQueryString({ page, limit, search, status, category });
  const response = await authFetch(`${API_URL}/concerts?${query}`);
  return handleResponse(response);
};

/**
 * Get concert by ID
 */
export const getConcertById = async (authFetch, concertId) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}`);
  return handleResponse(response);
};

/**
 * Create concert
 */
export const createConcert = async (authFetch, concertData) => {
  const response = await authFetch(`${API_URL}/concerts`, {
    method: 'POST',
    body: JSON.stringify(concertData),
  });
  return handleResponse(response);
};

/**
 * Update concert
 */
export const updateConcert = async (authFetch, concertId, concertData) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}`, {
    method: 'PUT',
    body: JSON.stringify(concertData),
  });
  return handleResponse(response);
};

/**
 * Delete concert
 */
export const deleteConcert = async (authFetch, concertId) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

/**
 * Publish concert
 */
export const publishConcert = async (authFetch, concertId) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}/publish`, {
    method: 'PUT',
  });
  return handleResponse(response);
};

/**
 * Cancel concert
 */
export const cancelConcert = async (authFetch, concertId) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}/cancel`, {
    method: 'PUT',
  });
  return handleResponse(response);
};

/**
 * Get concert seats with ticket class assignments
 */
export const getConcertSeats = async (authFetch, concertId) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}/seats`);
  return handleResponse(response);
};

// =============================================================================
// TICKET CLASS MANAGEMENT
// =============================================================================

/**
 * Add a ticket class to a concert
 */
export const addTicketClass = async (authFetch, concertId, ticketClassData) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}/ticket-classes`, {
    method: 'POST',
    body: JSON.stringify(ticketClassData),
  });
  return handleResponse(response);
};

/**
 * Update a ticket class
 */
export const updateTicketClass = async (authFetch, concertId, ticketClassId, ticketClassData) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}/ticket-classes/${ticketClassId}`, {
    method: 'PUT',
    body: JSON.stringify(ticketClassData),
  });
  return handleResponse(response);
};

/**
 * Delete a ticket class
 */
export const deleteTicketClass = async (authFetch, concertId, ticketClassId) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}/ticket-classes/${ticketClassId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

// =============================================================================
// SEAT ASSIGNMENT (PAINTING)
// =============================================================================

/**
 * Assign seats to a ticket class ("paint" seats with a color)
 * @param {Function} authFetch - Authenticated fetch function
 * @param {string} concertId - Concert ID
 * @param {string} ticketClassId - Ticket class ID to assign seats to
 * @param {string[]} seatIds - Array of seat IDs to assign
 */
export const assignSeatsToTicketClass = async (authFetch, concertId, ticketClassId, seatIds) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}/assign-seats`, {
    method: 'POST',
    body: JSON.stringify({ ticketClassId, seatIds }),
  });
  return handleResponse(response);
};

/**
 * Unassign seats from their ticket classes (remove "paint")
 * @param {Function} authFetch - Authenticated fetch function
 * @param {string} concertId - Concert ID
 * @param {string[]} seatIds - Array of seat IDs to unassign
 */
export const unassignSeats = async (authFetch, concertId, seatIds) => {
  const response = await authFetch(`${API_URL}/concerts/${concertId}/unassign-seats`, {
    method: 'POST',
    body: JSON.stringify({ seatIds }),
  });
  return handleResponse(response);
};

/**
 * Status configuration
 */
export const STATUS_CONFIG = {
  DRAFT: { label: 'Draft', color: 'gray' },
  PUB: { label: 'Published', color: 'emerald' },
  SOLDOUT: { label: 'Sold Out', color: 'blue' },
  CANCEL: { label: 'Cancelled', color: 'red' },
  COMPLETED: { label: 'Completed', color: 'purple' },
};

/**
 * Category configuration
 */
export const CATEGORY_CONFIG = {
  music: { label: 'Music', icon: '🎵' },
  theater: { label: 'Theater & Art', icon: '🎭' },
  sport: { label: 'Sport', icon: '⚽' },
  other: { label: 'Other', icon: '🎪' },
};

/**
 * Default form data
 */
export const DEFAULT_CONCERT_FORM = {
  title: '',
  description: '',
  category: 'music',
  genre: '',
  start_time: '',
  end_time: '',
  venue: '',
  artists: [],
  thumbnail: '',
  status: 'DRAFT',
  policies: {
    minAge: 0,
    refundPolicy: '',
    rules: [],
  },
};
