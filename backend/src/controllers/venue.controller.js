import Venue from '../models/Venue.js';
import Seat from '../models/Seat.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Venue Controller
 * Handles venue and seat layout management
 * 
 * NEW STRUCTURE:
 * - Venues contain Seats directly (no zones)
 * - Seats are physical layout templates
 * - TicketClasses and seat "painting" are handled per event via ShowSeat
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
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { city: { $regex: search, $options: 'i' } }
      ];
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

    // Add seat count to each venue
    const venuesWithSeats = await Promise.all(
      venues.map(async (venue) => {
        const seatCount = await Seat.countDocuments({ venue: venue._id });
        return {
          ...venue.toObject(),
          seatCount
        };
      })
    );

    res.json({
      success: true,
      data: {
        venues: venuesWithSeats,
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
 * @desc    Get single venue with seats
 * @route   GET /api/venues/:id
 * @access  Public
 */
export const getVenueById = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    const seatCount = await Seat.countDocuments({ venue: venue._id });

    res.json({
      success: true,
      data: {
        venue: {
          ...venue.toObject(),
          seatCount
        }
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
 * @desc    Delete venue and all its seats
 * @route   DELETE /api/venues/:id
 * @access  Admin
 */
export const deleteVenue = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    // Delete all seats belonging to this venue
    await Seat.deleteMany({ venue: venue._id });
    await Venue.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Venue and all seats deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all seats for a venue
 * @route   GET /api/venues/:id/seats
 * @access  Public
 */
export const getVenueSeats = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    const seats = await Seat.find({ venue: venue._id }).sort({ row: 1, number: 1 });

    // Group by row for easier rendering
    const seatsByRow = seats.reduce((acc, seat) => {
      if (!acc[seat.row]) acc[seat.row] = [];
      acc[seat.row].push(seat);
      return acc;
    }, {});

    res.json({
      success: true,
      data: {
        venue: {
          _id: venue._id,
          name: venue.name,
          total_capacity: venue.total_capacity
        },
        seats,
        seatsByRow,
        totalSeats: seats.length
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Save all seats for a venue (replace existing)
 * @route   PUT /api/venues/:id/seats
 * @access  Admin
 */
export const saveVenueSeats = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    const { seats: newSeats } = req.body;

    if (!newSeats || !Array.isArray(newSeats)) {
      throw new ApiError(400, 'Please provide seats array');
    }

    // Validate against venue capacity
    if (newSeats.length > venue.total_capacity) {
      throw new ApiError(400, 
        `Cannot save ${newSeats.length} seats. ` +
        `Exceeds venue capacity of ${venue.total_capacity}.`
      );
    }

    // Delete all existing seats
    await Seat.deleteMany({ venue: venue._id });

    // Insert new seats if any
    let insertedSeats = [];
    if (newSeats.length > 0) {
      const seatsToInsert = newSeats.map(s => ({
        venue: venue._id,
        row: s.row,
        number: s.number,
        label: s.label || `${s.row}${s.number}`,
        seatType: s.seatType || 'NORMAL',
        isActive: s.isActive !== false,
        x: s.x || 0,
        y: s.y || 0,
        rotation: s.rotation || 0
      }));

      insertedSeats = await Seat.insertMany(seatsToInsert);
    }

    res.json({
      success: true,
      message: `Saved ${insertedSeats.length} seats`,
      data: { 
        seatCount: insertedSeats.length,
        venueCapacity: venue.total_capacity,
        remainingCapacity: venue.total_capacity - insertedSeats.length
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(400, 'Duplicate seat detected (same row and number)');
    }
    next(error);
  }
};

/**
 * @desc    Add seats to venue
 * @route   POST /api/venues/:id/seats
 * @access  Admin
 */
export const addSeats = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    const { seats: newSeats } = req.body;

    if (!newSeats || !Array.isArray(newSeats) || newSeats.length === 0) {
      throw new ApiError(400, 'Please provide seats array');
    }

    // Check current seat count
    const currentSeatCount = await Seat.countDocuments({ venue: venue._id });
    const newTotalSeats = currentSeatCount + newSeats.length;

    if (newTotalSeats > venue.total_capacity) {
      const remaining = venue.total_capacity - currentSeatCount;
      throw new ApiError(400, 
        `Cannot add ${newSeats.length} seats. ` +
        `Only ${remaining} seats can be added (current: ${currentSeatCount}, capacity: ${venue.total_capacity}).`
      );
    }

    const seatsToInsert = newSeats.map(s => ({
      venue: venue._id,
      row: s.row,
      number: s.number,
      label: s.label || `${s.row}${s.number}`,
      seatType: s.seatType || 'NORMAL',
      isActive: s.isActive !== false,
      x: s.x || 0,
      y: s.y || 0,
      rotation: s.rotation || 0
    }));

    const insertedSeats = await Seat.insertMany(seatsToInsert, { ordered: false });

    res.status(201).json({
      success: true,
      message: `Added ${insertedSeats.length} seats`,
      data: { 
        insertedCount: insertedSeats.length,
        totalSeats: newTotalSeats,
        venueCapacity: venue.total_capacity
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(400, 'Some seats already exist (duplicate row/number)');
    }
    next(error);
  }
};

/**
 * @desc    Delete specific seats
 * @route   DELETE /api/venues/:id/seats
 * @access  Admin
 */
export const deleteSeats = async (req, res, next) => {
  try {
    const { seatIds } = req.body;

    if (!seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      throw new ApiError(400, 'Please provide seatIds array');
    }

    const result = await Seat.deleteMany({
      _id: { $in: seatIds },
      venue: req.params.id
    });

    res.json({
      success: true,
      message: `Deleted ${result.deletedCount} seats`,
      data: { deletedCount: result.deletedCount }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update seat properties
 * @route   PUT /api/venues/:id/seats/:seatId
 * @access  Admin
 */
export const updateSeat = async (req, res, next) => {
  try {
    const { seatType, isActive, x, y, rotation, label } = req.body;
    
    const seat = await Seat.findOneAndUpdate(
      { _id: req.params.seatId, venue: req.params.id },
      { seatType, isActive, x, y, rotation, label },
      { new: true, runValidators: true }
    );

    if (!seat) {
      throw new ApiError(404, 'Seat not found');
    }

    res.json({
      success: true,
      message: 'Seat updated successfully',
      data: seat
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get venue capacity info
 * @route   GET /api/venues/:id/capacity
 * @access  Public
 */
export const getVenueCapacity = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    const seatCount = await Seat.countDocuments({ venue: venue._id });

    res.json({
      success: true,
      data: {
        venueId: venue._id,
        venueName: venue.name,
        venueCapacity: venue.total_capacity,
        seatsCreated: seatCount,
        remainingCapacity: venue.total_capacity - seatCount
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Generate seats in a grid pattern
 * @route   POST /api/venues/:id/generate-seats
 * @access  Admin
 */
export const generateSeats = async (req, res, next) => {
  try {
    const venue = await Venue.findById(req.params.id);

    if (!venue) {
      throw new ApiError(404, 'Venue not found');
    }

    const { 
      rows, 
      seatsPerRow, 
      startRow = 'A',
      startNumber = 1,
      spacing = 35,
      startX = 100,
      startY = 100,
      clearExisting = false
    } = req.body;

    if (!rows || !seatsPerRow) {
      throw new ApiError(400, 'Please provide rows and seatsPerRow');
    }

    const totalNewSeats = rows * seatsPerRow;

    // Check capacity
    let currentSeatCount = 0;
    if (!clearExisting) {
      currentSeatCount = await Seat.countDocuments({ venue: venue._id });
    }

    if (currentSeatCount + totalNewSeats > venue.total_capacity) {
      throw new ApiError(400, 
        `Cannot generate ${totalNewSeats} seats. ` +
        `Would exceed venue capacity of ${venue.total_capacity}. ` +
        `Currently have ${currentSeatCount} seats.`
      );
    }

    // Clear existing if requested
    if (clearExisting) {
      await Seat.deleteMany({ venue: venue._id });
    }

    // Generate seats
    const seatsToCreate = [];
    const startCharCode = startRow.charCodeAt(0);

    for (let r = 0; r < rows; r++) {
      const rowLabel = String.fromCharCode(startCharCode + r);
      for (let n = 0; n < seatsPerRow; n++) {
        const seatNumber = startNumber + n;
        seatsToCreate.push({
          venue: venue._id,
          row: rowLabel,
          number: seatNumber,
          label: `${rowLabel}${seatNumber}`,
          seatType: 'NORMAL',
          isActive: true,
          x: startX + n * spacing,
          y: startY + r * spacing,
          rotation: 0
        });
      }
    }

    const insertedSeats = await Seat.insertMany(seatsToCreate);

    res.status(201).json({
      success: true,
      message: `Generated ${insertedSeats.length} seats`,
      data: {
        seatCount: insertedSeats.length,
        venueCapacity: venue.total_capacity
      }
    });
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(400, 'Duplicate seats detected. Try clearing existing seats first.');
    }
    next(error);
  }
};

export default {
  getVenues,
  getVenueById,
  createVenue,
  updateVenue,
  deleteVenue,
  getVenueSeats,
  saveVenueSeats,
  addSeats,
  deleteSeats,
  updateSeat,
  getVenueCapacity,
  generateSeats
};
