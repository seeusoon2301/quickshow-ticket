/**
 * Venue Service - API functions for venue management
 */

import { API_URL, buildQueryString, handleResponse } from './api';

/**
 * Get all venues
 */
export const getVenues = async (authFetch, { page = 1, limit = 10, search, city }) => {
  const query = buildQueryString({ page, limit, search, city });
  const response = await authFetch(`${API_URL}/venues?${query}`);
  return handleResponse(response);
};

/**
 * Get venue by ID
 */
export const getVenueById = async (authFetch, venueId) => {
  const response = await authFetch(`${API_URL}/venues/${venueId}`);
  return handleResponse(response);
};

/**
 * Create venue
 */
export const createVenue = async (authFetch, venueData) => {
  const response = await authFetch(`${API_URL}/venues`, {
    method: 'POST',
    body: JSON.stringify(venueData),
  });
  return handleResponse(response);
};

/**
 * Update venue
 */
export const updateVenue = async (authFetch, venueId, venueData) => {
  const response = await authFetch(`${API_URL}/venues/${venueId}`, {
    method: 'PUT',
    body: JSON.stringify(venueData),
  });
  return handleResponse(response);
};

/**
 * Delete venue
 */
export const deleteVenue = async (authFetch, venueId) => {
  const response = await authFetch(`${API_URL}/venues/${venueId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

// ========================
// Zone Management
// ========================

/**
 * Create zone for venue
 */
export const createZone = async (authFetch, venueId, zoneData) => {
  const response = await authFetch(`${API_URL}/venues/${venueId}/zones`, {
    method: 'POST',
    body: JSON.stringify(zoneData),
  });
  return handleResponse(response);
};

/**
 * Update zone
 */
export const updateZone = async (authFetch, venueId, zoneId, zoneData) => {
  const response = await authFetch(`${API_URL}/venues/${venueId}/zones/${zoneId}`, {
    method: 'PUT',
    body: JSON.stringify(zoneData),
  });
  return handleResponse(response);
};

/**
 * Delete zone
 */
export const deleteZone = async (authFetch, venueId, zoneId) => {
  const response = await authFetch(`${API_URL}/venues/${venueId}/zones/${zoneId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

/**
 * Generate seats for zone
 */
export const generateSeats = async (authFetch, venueId, zoneId, { rows, seatsPerRow, startRow = 'A' }) => {
  const response = await authFetch(`${API_URL}/venues/${venueId}/zones/${zoneId}/generate-seats`, {
    method: 'POST',
    body: JSON.stringify({ rows, seatsPerRow, startRow }),
  });
  return handleResponse(response);
};

/**
 * Get zone seats
 */
export const getZoneSeats = async (authFetch, venueId, zoneId) => {
  const response = await authFetch(`${API_URL}/venues/${venueId}/zones/${zoneId}/seats`);
  return handleResponse(response);
};

/**
 * Default venue form
 */
export const DEFAULT_VENUE_FORM = {
  name: '',
  address: '',
  city: '',
  total_capacity: 0,
  description: '',
  facilities: [],
  google_maps_url: '',
  contact: { phone: '', email: '' },
};

/**
 * Default zone form
 */
export const DEFAULT_ZONE_FORM = {
  name: '',
  capacity: 0,
  color: '#3B82F6',
  description: '',
};

/**
 * Zone color presets
 */
export const ZONE_COLORS = [
  { name: 'Blue', value: '#3B82F6' },
  { name: 'Purple', value: '#8B5CF6' },
  { name: 'Pink', value: '#EC4899' },
  { name: 'Red', value: '#EF4444' },
  { name: 'Orange', value: '#F97316' },
  { name: 'Yellow', value: '#EAB308' },
  { name: 'Green', value: '#22C55E' },
  { name: 'Teal', value: '#14B8A6' },
];
