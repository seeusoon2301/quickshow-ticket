/**
 * Ticket Service - API functions for ticket class management
 */

import { API_URL, buildQueryString, handleResponse } from './api';

/**
 * Get ticket classes for concert
 */
export const getTicketClasses = async (authFetch, concertId) => {
  const query = buildQueryString({ concert: concertId });
  const response = await authFetch(`${API_URL}/ticket-classes?${query}`);
  return handleResponse(response);
};

/**
 * Create ticket class
 */
export const createTicketClass = async (authFetch, ticketData) => {
  const response = await authFetch(`${API_URL}/ticket-classes`, {
    method: 'POST',
    body: JSON.stringify(ticketData),
  });
  return handleResponse(response);
};

/**
 * Update ticket class
 */
export const updateTicketClass = async (authFetch, ticketId, ticketData) => {
  const response = await authFetch(`${API_URL}/ticket-classes/${ticketId}`, {
    method: 'PUT',
    body: JSON.stringify(ticketData),
  });
  return handleResponse(response);
};

/**
 * Delete ticket class
 */
export const deleteTicketClass = async (authFetch, ticketId) => {
  const response = await authFetch(`${API_URL}/ticket-classes/${ticketId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

// ========================
// Check-in API
// ========================

/**
 * Verify ticket
 */
export const verifyTicket = async (authFetch, { ticketCode, qrHash }) => {
  const response = await authFetch(`${API_URL}/tickets/verify`, {
    method: 'POST',
    body: JSON.stringify({ ticketCode, qrHash }),
  });
  return handleResponse(response);
};

/**
 * Check-in ticket by ID
 */
export const checkInTicket = async (authFetch, ticketId) => {
  const response = await authFetch(`${API_URL}/tickets/${ticketId}/check-in`, {
    method: 'POST',
  });
  return handleResponse(response);
};

/**
 * Check-in by QR
 */
export const checkInByQR = async (authFetch, qrHash) => {
  const response = await authFetch(`${API_URL}/tickets/check-in-qr`, {
    method: 'POST',
    body: JSON.stringify({ qrHash }),
  });
  return handleResponse(response);
};

/**
 * Get check-in list for concert
 */
export const getCheckInList = async (authFetch, concertId, { page = 1, status }) => {
  const query = buildQueryString({ page, status });
  const response = await authFetch(`${API_URL}/tickets/concert/${concertId}/check-in-list?${query}`);
  return handleResponse(response);
};

/**
 * Ticket class presets
 */
export const TICKET_PRESETS = [
  { name: 'VIP', price: 2000000, benefits: ['Best seats', 'Meet & greet', 'VIP lounge'] },
  { name: 'Premium', price: 1500000, benefits: ['Priority entry', 'Good seats'] },
  { name: 'Standard', price: 800000, benefits: ['General admission'] },
  { name: 'Early Bird', price: 600000, benefits: ['Discounted price', 'Limited availability'] },
  { name: 'Student', price: 400000, benefits: ['Student discount', 'ID required'] },
  { name: 'Group (5+)', price: 3500000, benefits: ['Group of 5', 'Discounted rate'] },
];

/**
 * Default ticket class form
 */
export const DEFAULT_TICKET_FORM = {
  concert: '',
  zone: '',
  name: '',
  price: 0,
  quota: 0,
  open_time: '',
  close_time: '',
  description: '',
  benefits: [],
};
