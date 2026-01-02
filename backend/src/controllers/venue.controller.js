import Venue from '../models/Venue.js';
import Zone from '../models/Zone.js';
import Seat from '../models/Seat.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Venue Controller
 * Handles venue and seating management
 */

/**
 * @desc    Get all venues
 * @route   GET /api/venues
 * @access  Public
 */
export const getVenues = async (req, res, next) => {
  try {
    const { search, city, page = 1, limit = 20 } = req.query;

    const query = {};

    if (search) {
      query.$text = { $search: search };
    }

    if (city) {
      query.city = { $regex: city, $options: 'i' };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [venues, total] = await Promise.all([
      Venue.find(query)
        .sort({ name: 1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Venue.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        venues,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          total,
          pages: Math.ceil(total / parseInt(limit))
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single venue with zones and seats
 * @route   GET /api/venues/:id
 * @access  Public
 */
export const getVenueById = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    // Get zones
    const zones = await Zone.find({ venue: venue._id });

    // Get seat count per zone
    const zoneWithSeats = await Promise.all(
      zones.map(async (zone) => {
        const seatCount = await Seat.countDocuments({ zone: zone._id });
        return {
          ...zone.toObject(),
          seatCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        venue,
        zones: zoneWithSeats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new venue
 * @route   POST /api/venues
 * @access  Admin
 */
export const createVenue = async (req, res, next) => {
  try {
    const { name, address, city, total_capacity, map_image, description, facilities, google_maps_url, contact } = req.body;

    const venue = await Venue.create({
      name,
      address,
      city,
      total_capacity,
      map_image,
      description,
      facilities,
      google_maps_url,
      contact
    });

    res.status(201).json({
      success: true,
      message: 'Venue created successfully',
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update venue
 * @route   PUT /api/venues/:id
 * @access  Admin
 */
export const updateVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    res.json({
      success: true,
      message: 'Venue updated successfully',
      data: venue
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete venue
 * @route   DELETE /api/venues/:id
 * @access  Admin
 */
export const deleteVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    // Delete all related zones and seats
    const zones = await Zone.find({ venue: venue._id });
    await Seat.deleteMany({ zone: { $in: zones.map(z => z._id) } });
    await Zone.deleteMany({ venue: venue._id });
    await Venue.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Venue and all related data deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create zone for venue
 * @route   POST /api/venues/:id/zones
 * @access  Admin
 */
export const createZone = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    const { name, capacity, color, description } = req.body;

    const zone = await Zone.create({
      venue: venue._id,
      name,
      capacity,
      color,
      description
    });

    res.status(201).json({
      success: true,
      message: 'Zone created successfully',
      data: zone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update zone
 * @route   PUT /api/venues/:venueId/zones/:zoneId
 * @access  Admin
 */
export const updateZone = async (req, res, next) => {
  try {
    const zone = await Zone.findOneAndUpdate(
      { _id: req.params.zoneId, venue: req.params.venueId },
      req.body,
      { new: true, runValidators: true }
    );

    if (!zone) {
      throw new ApiError(404, 'Zone not found');
    }

    res.json({
      success: true,
      message: 'Zone updated successfully',
      data: zone
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete zone
 * @route   DELETE /api/venues/:venueId/zones/:zoneId
 * @access  Admin
 */
export const deleteZone = async (req, res, next) => {
  try {
    const zone = await Zone.findOne({
      _id: req.params.zoneId,
      venue: req.params.venueId
    });

    if (!zone) {
      throw new ApiError(404, 'Zone not found');
    }

    // Delete all seats in zone
    await Seat.deleteMany({ zone: zone._id });
    await Zone.findByIdAndDelete(zone._id);

    res.json({
      success: true,
      message: 'Zone and all seats deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate seats for zone
 * @route   POST /api/venues/:venueId/zones/:zoneId/generate-seats
 * @access  Admin
 */
export const generateSeats = async (req, res, next) => {
  try {
    const zone = await Zone.findOne({
      _id: req.params.zoneId,
      venue: req.params.venueId
    });

    if (!zone) {
      throw new ApiError(404, 'Zone not found');
    }

    const { rows, seatsPerRow, startRow = 'A' } = req.body;

    if (!rows || !seatsPerRow) {
      throw new ApiError(400, 'Please provide rows and seatsPerRow');
    }

    // Delete existing seats
    await Seat.deleteMany({ zone: zone._id });

    // Generate new seats
    const seats = [];
    const startCharCode = startRow.charCodeAt(0);

    for (let r = 0; r < rows; r++) {
      const row = String.fromCharCode(startCharCode + r);
      for (let n = 1; n <= seatsPerRow; n++) {
        seats.push({
          zone: zone._id,
          row,
          number: n,
          type: 'NORMAL'
        });
      }
    }

    await Seat.insertMany(seats);

    // Update zone capacity
    zone.capacity = seats.length;
    await zone.save();

    res.json({
      success: true,
      message: `Generated ${seats.length} seats successfully`,
      data: {
        zone,
        seatCount: seats.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get seats for zone
 * @route   GET /api/venues/:venueId/zones/:zoneId/seats
 * @access  Public
 */
export const getZoneSeats = async (req, res, next) => {
  try {
    const zone = await Zone.findOne({
      _id: req.params.zoneId,
      venue: req.params.venueId
    });

    if (!zone) {
      throw new ApiError(404, 'Zone not found');
    }

    const seats = await Seat.find({ zone: zone._id }).sort({ row: 1, number: 1 });

    // Group by row
    const seatsByRow = seats.reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        zone,
        seatsByRow,
        totalSeats: seats.length
      }
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  createZone,
  updateZone,
  deleteZone,
  generateSeats,
  getZoneSeats
};
