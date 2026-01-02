import Concert from '../models/Concert.js';
import TicketClass from '../models/TicketClass.js';
import ShowSeat from '../models/ShowSeat.js';
import Seat from '../models/Seat.js';
import Zone from '../models/Zone.js';
import { ApiError } from '../middleware/errorHandler.js';

/**
 * Concert Controller
 * Handles concert/event management
 */

/**
 * @desc    Get all concerts (public, with filters)
 * @route   GET /api/concerts
 * @access  Public
 */
export const getConcerts = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 12,
      category,
      genre,
      status = 'PUB',
      search,
      startDate,
      endDate,
      minPrice,
      maxPrice,
      venue,
      artist,
      featured,
      trending,
      sortBy = 'start_time',
      sortOrder = 'asc'
    } = req.query;

    const query = {};

    // For public, only show published concerts
    if (!req.user || req.user.role === 'CUS') {
      query.status = 'PUB';
    } else if (status) {
      query.status = status;
    }

    // Category filter
    if (category) {
      query.category = category;
    }

    // Genre filter
    if (genre) {
      query.genre = { $regex: genre, $options: 'i' };
    }

    // Text search
    if (search) {
      query.$text = { $search: search };
    }

    // Date range
    if (startDate || endDate) {
      query.start_time = {};
      if (startDate) query.start_time.$gte = new Date(startDate);
      if (endDate) query.start_time.$lte = new Date(endDate);
    } else {
      // Default: only upcoming events
      query.start_time = { $gte: new Date() };
    }

    // Venue filter
    if (venue) {
      query.venue = venue;
    }

    // Artist filter
    if (artist) {
      query.artists = artist;
    }

    // Featured/Trending
    if (featured === 'true') query.featured = true;
    if (trending === 'true') query.trending = true;

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };

    const [concerts, total] = await Promise.all([
      Concert.find(query)
        .populate('venue', 'name address city')
        .populate('artists', 'name image genre')
        .populate('organizer', 'username organizer.company_name')
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit)),
      Concert.countDocuments(query)
    ]);

    // Get price range for each concert
    const concertsWithPrices = await Promise.all(
      concerts.map(async (concert) => {
        const ticketClasses = await TicketClass.find({ concert: concert._id });
        const prices = ticketClasses.map(tc => tc.price);
        return {
          ...concert.toObject(),
          priceRange: {
            min: prices.length ? Math.min(...prices) : 0,
            max: prices.length ? Math.max(...prices) : 0
          },
          ticketClasses: ticketClasses.map(tc => ({
            _id: tc._id,
            name: tc.name,
            price: tc.price,
            available: tc.available_qty
          }))
        };
      })
    );

    res.json({
      success: true,
      data: {
        concerts: concertsWithPrices,
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
 * @desc    Get single concert by ID
 * @route   GET /api/concerts/:id
 * @access  Public
 */
export const getConcertById = async (req, res, next) => {
  try {
    const concert = await Concert.findById(req.params.id)
      .populate('venue')
      .populate('artists')
      .populate('organizer', 'username fullName organizer');

    if (!concert) {
      throw new ApiError(404, 'Concert not found');
    }

    // Increment view count
    concert.viewCount += 1;
    await concert.save();

    // Get ticket classes
    const ticketClasses = await TicketClass.find({ concert: concert._id })
      .populate('zone', 'name color capacity');

    // Get seat availability summary by zone
    const seatStats = await ShowSeat.aggregate([
      { $match: { concert: concert._id } },
      {
        $lookup: {
          from: 'seats',
          localField: 'seat',
          foreignField: '_id',
          as: 'seatInfo'
        }
      },
      { $unwind: '$seatInfo' },
      {
        $group: {
          _id: '$seatInfo.zone',
          total: { $sum: 1 },
          available: {
            $sum: { $cond: [{ $eq: ['$status', 'AVAILABLE'] }, 1, 0] }
          },
          sold: {
            $sum: { $cond: [{ $eq: ['$status', 'SOLD'] }, 1, 0] }
          },
          locked: {
            $sum: { $cond: [{ $eq: ['$status', 'LOCKED'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        concert,
        ticketClasses,
        seatStats
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create new concert
 * @route   POST /api/concerts
 * @access  Admin, Organizer
 */
export const createConcert = async (req, res, next) => {
  try {
    const {
      title,
      description,
      category,
      genre,
      start_time,
      end_time,
      venue,
      artists,
      thumbnail,
      images,
      policies,
      ticketClasses // Array of ticket class definitions
    } = req.body;

    // Verify venue exists
    const venueDoc = await Zone.findOne({ venue }).distinct('venue');
    if (!venueDoc) {
      // Check if venue ID is valid
      const Venue = (await import('../models/Venue.js')).default;
      const venueExists = await Venue.findById(venue);
      if (!venueExists) {
        throw new ApiError(404, 'Venue not found');
      }
    }

    // Create concert
    const concert = await Concert.create({
      title,
      description,
      category,
      genre,
      start_time,
      end_time,
      venue,
      organizer: req.user._id,
      artists: artists || [],
      thumbnail,
      images: images || [],
      policies: policies || {},
      status: req.user.role === 'ADMIN' ? 'PUB' : 'DRAFT'
    });

    // Create ticket classes if provided
    if (ticketClasses && ticketClasses.length > 0) {
      const zones = await Zone.find({ venue });
      
      for (const tc of ticketClasses) {
        const zone = zones.find(z => z.name === tc.zoneName || z._id.toString() === tc.zone);
        if (!zone) continue;

        await TicketClass.create({
          concert: concert._id,
          zone: zone._id,
          name: tc.name,
          price: tc.price,
          quota: tc.quota || zone.capacity,
          open_time: tc.open_time,
          close_time: tc.close_time,
          description: tc.description,
          benefits: tc.benefits || []
        });
      }

      // Initialize show seats for the concert
      const seats = await Seat.find({ zone: { $in: zones.map(z => z._id) } });
      
      const showSeats = seats.map(seat => {
        const zone = zones.find(z => z._id.toString() === seat.zone.toString());
        const ticketClass = ticketClasses.find(tc => 
          tc.zoneName === zone?.name || tc.zone === zone?._id.toString()
        );
        
        return {
          concert: concert._id,
          seat: seat._id,
          status: 'AVAILABLE',
          price: ticketClass?.price || 0
        };
      });

      if (showSeats.length > 0) {
        await ShowSeat.insertMany(showSeats);
        concert.totalTickets = showSeats.length;
        await concert.save();
      }
    }

    res.status(201).json({
      success: true,
      message: 'Concert created successfully',
      data: concert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update concert
 * @route   PUT /api/concerts/:id
 * @access  Admin, Organizer (own concerts)
 */
export const updateConcert = async (req, res, next) => {
  try {
    let concert = await Concert.findById(req.params.id);

    if (!concert) {
      throw new ApiError(404, 'Concert not found');
    }

    // Check ownership for organizers
    if (req.user.role === 'ORG' && concert.organizer.toString() !== req.user._id.toString()) {
      throw new ApiError(403, 'You can only update your own concerts');
    }

    const allowedUpdates = [
      'title', 'description', 'category', 'genre',
      'start_time', 'end_time', 'thumbnail', 'images',
      'policies', 'artists', 'featured', 'trending'
    ];

    // Admin can also update status
    if (req.user.role === 'ADMIN') {
      allowedUpdates.push('status', 'venue');
    }

    const updates = {};
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field];
      }
    });

    concert = await Concert.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('venue artists organizer');

    res.json({
      success: true,
      message: 'Concert updated successfully',
      data: concert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete concert
 * @route   DELETE /api/concerts/:id
 * @access  Admin
 */
export const deleteConcert = async (req, res, next) => {
  try {
    const concert = await Concert.findById(req.params.id);

    if (!concert) {
      throw new ApiError(404, 'Concert not found');
    }

    // Check if there are sold tickets
    const soldSeats = await ShowSeat.countDocuments({
      concert: concert._id,
      status: 'SOLD'
    });

    if (soldSeats > 0) {
      throw new ApiError(400, 'Cannot delete concert with sold tickets. Cancel it instead.');
    }

    // Delete related data
    await Promise.all([
      TicketClass.deleteMany({ concert: concert._id }),
      ShowSeat.deleteMany({ concert: concert._id }),
      Concert.findByIdAndDelete(concert._id)
    ]);

    res.json({
      success: true,
      message: 'Concert deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get concert seats/seating map
 * @route   GET /api/concerts/:id/seats
 * @access  Public
 */
export const getConcertSeats = async (req, res, next) => {
  try {
    const concert = await Concert.findById(req.params.id).populate('venue');

    if (!concert) {
      throw new ApiError(404, 'Concert not found');
    }

    // Get zones for this venue
    const zones = await Zone.find({ venue: concert.venue._id });

    // Get all show seats with seat info
    const showSeats = await ShowSeat.find({ concert: concert._id })
      .populate({
        path: 'seat',
        populate: { path: 'zone', select: 'name color' }
      })
      .populate('ticketClass', 'name price');

    // Group by zone
    const seatMap = {};
    zones.forEach(zone => {
      seatMap[zone._id] = {
        zone: {
          _id: zone._id,
          name: zone.name,
          color: zone.color,
          capacity: zone.capacity
        },
        seats: []
      };
    });

    showSeats.forEach(ss => {
      const zoneId = ss.seat.zone._id.toString();
      if (seatMap[zoneId]) {
        seatMap[zoneId].seats.push({
          _id: ss._id,
          seatId: ss.seat._id,
          row: ss.seat.row,
          number: ss.seat.number,
          label: ss.seat.label,
          status: ss.status,
          price: ss.price || ss.ticketClass?.price,
          ticketClass: ss.ticketClass?.name
        });
      }
    });

    res.json({
      success: true,
      data: {
        venue: concert.venue,
        zones: Object.values(seatMap)
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Publish concert
 * @route   PUT /api/concerts/:id/publish
 * @access  Admin
 */
export const publishConcert = async (req, res, next) => {
  try {
    const concert = await Concert.findById(req.params.id);

    if (!concert) {
      throw new ApiError(404, 'Concert not found');
    }

    if (concert.status === 'PUB') {
      throw new ApiError(400, 'Concert is already published');
    }

    concert.status = 'PUB';
    await concert.save();

    res.json({
      success: true,
      message: 'Concert published successfully',
      data: concert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Cancel concert
 * @route   PUT /api/concerts/:id/cancel
 * @access  Admin
 */
export const cancelConcert = async (req, res, next) => {
  try {
    const concert = await Concert.findById(req.params.id);

    if (!concert) {
      throw new ApiError(404, 'Concert not found');
    }

    concert.status = 'CANCEL';
    await concert.save();

    // TODO: Notify customers, process refunds

    res.json({
      success: true,
      message: 'Concert cancelled. Customer notifications will be sent.',
      data: concert
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get organizer's concerts
 * @route   GET /api/concerts/my-concerts
 * @access  Organizer
 */
export const getMyConcerts = async (req, res, next) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const query = { organizer: req.user._id };
    if (status) query.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [concerts, total] = await Promise.all([
      Concert.find(query)
        .populate('venue', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit)),
      Concert.countDocuments(query)
    ]);

    res.json({
      success: true,
      data: {
        concerts,
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
 * @desc    Get featured/trending concerts
 * @route   GET /api/concerts/featured
 * @access  Public
 */
export const getFeaturedConcerts = async (req, res, next) => {
  try {
    const { type = 'featured', limit = 6 } = req.query;

    const query = {
      status: 'PUB',
      start_time: { $gte: new Date() }
    };

    if (type === 'featured') {
      query.featured = true;
    } else if (type === 'trending') {
      query.trending = true;
    }

    const concerts = await Concert.find(query)
      .populate('venue', 'name address')
      .populate('artists', 'name image')
      .sort({ viewCount: -1, start_time: 1 })
      .limit(parseInt(limit));

    res.json({
      success: true,
      data: concerts
    });
  } catch (error) {
    next(error);
  }
};

export default {
  getConcerts,
  getConcertById,
  createConcert,
  updateConcert,
  deleteConcert,
  getConcertSeats,
  publishConcert,
  cancelConcert,
  getMyConcerts,
  getFeaturedConcerts
};
