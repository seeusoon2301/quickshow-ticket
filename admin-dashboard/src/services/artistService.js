/**
 * Artist Service - API functions for artist management
 */

import { API_URL, buildQueryString, handleResponse } from './api';

/**
 * Get artists list
 */
export const getArtists = async (authFetch, { page = 1, limit = 10, search }) => {
  const query = buildQueryString({ page, limit, search });
  const response = await authFetch(`${API_URL}/artists?${query}`);
  return handleResponse(response);
};

/**
 * Get artist by ID
 */
export const getArtistById = async (authFetch, artistId) => {
  const response = await authFetch(`${API_URL}/artists/${artistId}`);
  return handleResponse(response);
};

/**
 * Create artist
 */
export const createArtist = async (authFetch, artistData) => {
  const response = await authFetch(`${API_URL}/artists`, {
    method: 'POST',
    body: JSON.stringify(artistData),
  });
  return handleResponse(response);
};

/**
 * Update artist
 */
export const updateArtist = async (authFetch, artistId, artistData) => {
  const response = await authFetch(`${API_URL}/artists/${artistId}`, {
    method: 'PUT',
    body: JSON.stringify(artistData),
  });
  return handleResponse(response);
};

/**
 * Delete artist
 */
export const deleteArtist = async (authFetch, artistId) => {
  const response = await authFetch(`${API_URL}/artists/${artistId}`, {
    method: 'DELETE',
  });
  return handleResponse(response);
};

/**
 * Default artist form
 */
export const DEFAULT_ARTIST_FORM = {
  name: '',
  bio: '',
  genre: [],
  image: '',
  social: {
    facebook: '',
    instagram: '',
    twitter: '',
    youtube: '',
    website: '',
  },
};

/**
 * Genre options
 */
export const GENRES = [
  'Pop', 'Rock', 'Hip-hop', 'R&B', 'Jazz', 'Classical', 
  'EDM', 'Country', 'Folk', 'Indie', 'Metal', 'K-pop',
  'V-pop', 'Ballad', 'Rap', 'Acoustic', 'Alternative'
];

/**
 * Get artist avatar
 */
export const getArtistAvatar = (artist) => {
  if (artist.image) return artist.image;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.name)}&background=8B5CF6&color=fff`;
};
