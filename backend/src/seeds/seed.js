import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import models
import User from '../models/User.js';
import Venue from '../models/Venue.js';
import Zone from '../models/Zone.js';
import Seat from '../models/Seat.js';
import Artist from '../models/Artist.js';
import Concert from '../models/Concert.js';
import TicketClass from '../models/TicketClass.js';
import ShowSeat from '../models/ShowSeat.js';
import Voucher from '../models/Voucher.js';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://quickshow_db_user:ticket111@ticket.udwy4wi.mongodb.net/ticket';

/**
 * Working Image URLs from Unsplash
 */
const images = {
  music: [
    'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=800&q=80',
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=800&q=80',
    'https://images.unsplash.com/photo-1524368535928-5b5e00ddc76b?w=800&q=80',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=800&q=80',
  ],
  sport: [
    'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=800&q=80',
    'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
    'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800&q=80',
    'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&q=80',
    'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80',
  ],
  theater: [
    'https://images.unsplash.com/photo-1503095396549-807759245b35?w=800&q=80',
    'https://images.unsplash.com/photo-1507676184212-d03ab07a01bf?w=800&q=80',
    'https://images.unsplash.com/photo-1460723237483-7a6dc9d0b212?w=800&q=80',
    'https://images.unsplash.com/photo-1518834107812-67b0b7c58434?w=800&q=80',
    'https://images.unsplash.com/photo-1514306191717-452ec28c7814?w=800&q=80',
  ],
  other: [
    'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800&q=80',
    'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=800&q=80',
    'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=800&q=80',
    'https://images.unsplash.com/photo-1517457373958-b7bdd4587205?w=800&q=80',
    'https://images.unsplash.com/photo-1511795409834-ef04bbd61622?w=800&q=80',
  ],
  artists: [
    'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&q=80',
    'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=400&q=80',
    'https://images.unsplash.com/photo-1511367461989-f85a21fda167?w=400&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&q=80',
    'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=400&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400&q=80',
  ],
  banners: [
    'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=1200&q=80',
    'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=1200&q=80',
    'https://images.unsplash.com/photo-1501281668745-f7f57925c3b4?w=1200&q=80',
    'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=1200&q=80',
  ]
};

/**
 * Clear all collections
 */
async function clearDatabase() {
  console.log('🧹 Clearing existing data...');
  await Promise.all([
    User.deleteMany({}),
    Venue.deleteMany({}),
    Zone.deleteMany({}),
    Seat.deleteMany({}),
    Artist.deleteMany({}),
    Concert.deleteMany({}),
    TicketClass.deleteMany({}),
    ShowSeat.deleteMany({}),
    Voucher.deleteMany({})
  ]);
  console.log('✅ Database cleared');
}

/**
 * Create Users
 */
async function createUsers() {
  console.log('👤 Creating users...');
  
  const passwordHash = await bcrypt.hash('Password123!', 10);
  
  const users = [
    {
      username: 'admin',
      email: 'admin@quickshow.com',
      password_hash: passwordHash,
      fullName: 'System Administrator',
      phone: '0901234567',
      role: 'ADMIN',
      status: true,
      email_verified: true
    },
    {
      username: 'organizer1',
      email: 'organizer@quickshow.com',
      password_hash: passwordHash,
      fullName: 'Event Organizer',
      phone: '0902345678',
      role: 'ORG',
      status: true,
      email_verified: true
    },
    {
      username: 'staff1',
      email: 'staff@quickshow.com',
      password_hash: passwordHash,
      fullName: 'Check-in Staff',
      phone: '0903456789',
      role: 'STAFF',
      status: true,
      email_verified: true
    },
    {
      username: 'customer1',
      email: 'customer@example.com',
      password_hash: passwordHash,
      fullName: 'Nguyễn Văn A',
      phone: '0904567890',
      role: 'CUS',
      status: true,
      email_verified: true
    }
  ];

  const createdUsers = await User.insertMany(users);
  console.log(`✅ Created ${createdUsers.length} users`);
  return createdUsers;
}

/**
 * Create Venues with Zones and Seats
 */
async function createVenues() {
  console.log('🏟️ Creating venues...');
  
  const venuesData = [
    {
      name: 'Sân vận động Mỹ Đình',
      address: 'Đường Lê Đức Thọ, Nam Từ Liêm',
      city: 'Hà Nội',
      total_capacity: 40000,
      description: 'Sân vận động quốc gia lớn nhất Việt Nam',
      facilities: ['Parking', 'Food Court', 'VIP Lounge'],
      zones: [
        { name: 'VIP', rows: 5, seatsPerRow: 20, color: '#FFD700' },
        { name: 'CAT A', rows: 10, seatsPerRow: 30, color: '#FF6B6B' },
        { name: 'Standing', rows: 1, seatsPerRow: 100, color: '#95E1D3' }
      ]
    },
    {
      name: 'Nhà hát Lớn Hà Nội',
      address: '1 Tràng Tiền, Hoàn Kiếm',
      city: 'Hà Nội',
      total_capacity: 600,
      description: 'Nhà hát lịch sử với kiến trúc Pháp cổ điển',
      facilities: ['VIP Lounge', 'Bar'],
      zones: [
        { name: 'Orchestra', rows: 10, seatsPerRow: 20, color: '#FFD700' },
        { name: 'Balcony', rows: 8, seatsPerRow: 15, color: '#FF6B6B' }
      ]
    },
    {
      name: 'Gem Center',
      address: '8 Nguyễn Bỉnh Khiêm, Quận 1',
      city: 'Hồ Chí Minh',
      total_capacity: 2000,
      description: 'Trung tâm hội nghị và sự kiện cao cấp',
      facilities: ['Parking', 'Restaurant'],
      zones: [
        { name: 'VIP', rows: 5, seatsPerRow: 15, color: '#FFD700' },
        { name: 'Standard', rows: 15, seatsPerRow: 25, color: '#4ECDC4' }
      ]
    }
  ];

  const createdVenues = [];
  
  for (const venueData of venuesData) {
    const { zones: zonesData, ...venueInfo } = venueData;
    const venue = await Venue.create(venueInfo);
    
    for (const zoneData of zonesData) {
      const zoneCapacity = zoneData.rows * zoneData.seatsPerRow;
      const zone = await Zone.create({
        venue: venue._id,
        name: zoneData.name,
        description: `${zoneData.name} zone`,
        color: zoneData.color,
        capacity: zoneCapacity
      });
      
      const seats = [];
      for (let row = 1; row <= zoneData.rows; row++) {
        for (let seatNum = 1; seatNum <= zoneData.seatsPerRow; seatNum++) {
          seats.push({
            zone: zone._id,
            row: String.fromCharCode(64 + row),
            number: seatNum,
            label: `${String.fromCharCode(64 + row)}${seatNum}`,
            status: 'AVAILABLE'
          });
        }
      }
      if (seats.length > 0) await Seat.insertMany(seats);
    }
    createdVenues.push(venue);
  }
  
  console.log(`✅ Created ${createdVenues.length} venues`);
  return createdVenues;
}

/**
 * Create Artists
 */
async function createArtists() {
  console.log('🎤 Creating artists...');
  
  const artistsData = [
    { name: 'Sơn Tùng M-TP', slug: 'son-tung-mtp', bio: 'Ca sĩ, nhạc sĩ hàng đầu Việt Nam', image: images.artists[0], genres: ['V-Pop', 'EDM'] },
    { name: 'SOOBIN', slug: 'soobin', bio: 'Ca sĩ, nhạc sĩ người Việt Nam', image: images.artists[1], genres: ['V-Pop', 'Ballad'] },
    { name: 'Đen Vâu', slug: 'den-vau', bio: 'Rapper nổi tiếng Việt Nam', image: images.artists[2], genres: ['Hip-Hop', 'Rap'] },
    { name: 'Hà Anh Tuấn', slug: 'ha-anh-tuan', bio: 'Ca sĩ ballad hàng đầu Việt Nam', image: images.artists[3], genres: ['Ballad', 'Pop'] },
    { name: 'Mỹ Tâm', slug: 'my-tam', bio: 'Nữ hoàng nhạc Pop Việt Nam', image: images.artists[4], genres: ['V-Pop', 'Dance'] },
    { name: 'Tóc Tiên', slug: 'toc-tien', bio: 'Ca sĩ pop nổi tiếng', image: images.artists[5], genres: ['V-Pop', 'EDM'] },
  ];

  const createdArtists = await Artist.insertMany(artistsData);
  console.log(`✅ Created ${createdArtists.length} artists`);
  return createdArtists;
}

/**
 * Create Concerts - 5 per category (20 total)
 */
async function createConcerts(venues, artists, organizer) {
  console.log('🎫 Creating concerts...');
  
  const concertsData = [
    // ===== MUSIC (5 events) =====
    {
      title: 'Sơn Tùng M-TP: Sky Tour 2026',
      slug: 'son-tung-sky-tour-2026',
      description: 'Chuyến lưu diễn âm nhạc lớn nhất năm của Sơn Tùng M-TP với những bản hit đình đám.',
      category: 'music',
      thumbnail: images.music[0],
      banner: images.banners[0],
      base_price: 800000,
      venue: venues[0]._id,
      artists: [artists[0]._id],
      start_time: new Date('2026-02-15T19:00:00'),
      end_time: new Date('2026-02-15T23:00:00'),
      sale_start: new Date('2026-01-01T10:00:00'),
      sale_end: new Date('2026-02-14T23:59:59'),
      status: 'PUB',
      featured: true,
      trending: true,
      ticketClasses: [
        { name: 'VIP', price: 2500000, benefits: ['Meet & Greet', 'Premium Seating'] },
        { name: 'CAT A', price: 1500000, benefits: ['Good View'] },
        { name: 'Standing', price: 800000, benefits: ['General Admission'] }
      ]
    },
    {
      title: 'SOOBIN Live Concert 2026',
      slug: 'soobin-live-2026',
      description: 'Đêm nhạc đặc biệt của SOOBIN với những ca khúc mới nhất.',
      category: 'music',
      thumbnail: images.music[1],
      banner: images.banners[1],
      base_price: 600000,
      venue: venues[2]._id,
      artists: [artists[1]._id],
      start_time: new Date('2026-03-01T20:00:00'),
      end_time: new Date('2026-03-01T23:00:00'),
      sale_start: new Date('2026-01-15T10:00:00'),
      sale_end: new Date('2026-02-28T23:59:59'),
      status: 'PUB',
      featured: true,
      ticketClasses: [
        { name: 'VIP', price: 1800000, benefits: ['Photo Opportunity'] },
        { name: 'Standard', price: 600000, benefits: ['Reserved Seating'] }
      ]
    },
    {
      title: 'Đen Vâu: Trời Hôm Nay Nhiều Mây Cực',
      slug: 'den-vau-live-2026',
      description: 'Đêm nhạc rap với những bản hit triệu view của Đen Vâu.',
      category: 'music',
      thumbnail: images.music[2],
      banner: images.banners[2],
      base_price: 500000,
      venue: venues[0]._id,
      artists: [artists[2]._id],
      start_time: new Date('2026-04-10T19:30:00'),
      end_time: new Date('2026-04-10T22:30:00'),
      sale_start: new Date('2026-02-01T10:00:00'),
      sale_end: new Date('2026-04-09T23:59:59'),
      status: 'PUB',
      trending: true,
      ticketClasses: [
        { name: 'VIP', price: 1500000, benefits: ['Closest to Stage'] },
        { name: 'CAT A', price: 800000, benefits: ['Good View'] },
        { name: 'Standing', price: 500000, benefits: ['Festival Experience'] }
      ]
    },
    {
      title: 'Hà Anh Tuấn: Romance Concert',
      slug: 'ha-anh-tuan-romance-2026',
      description: 'Đêm nhạc ballad lãng mạn nhất năm với giọng ca vàng Hà Anh Tuấn.',
      category: 'music',
      thumbnail: images.music[3],
      banner: images.music[3],
      base_price: 700000,
      venue: venues[1]._id,
      artists: [artists[3]._id],
      start_time: new Date('2026-05-20T20:00:00'),
      end_time: new Date('2026-05-20T22:30:00'),
      sale_start: new Date('2026-03-01T10:00:00'),
      sale_end: new Date('2026-05-19T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'Orchestra', price: 2000000, benefits: ['Premium Sound'] },
        { name: 'Balcony', price: 700000, benefits: ['Great Acoustics'] }
      ]
    },
    {
      title: 'Y-Concert Festival 2026',
      slug: 'y-concert-festival-2026',
      description: 'Đại nhạc hội quy tụ hàng loạt nghệ sĩ hàng đầu Việt Nam.',
      category: 'music',
      thumbnail: images.music[4],
      banner: images.banners[3],
      base_price: 400000,
      venue: venues[0]._id,
      artists: [artists[4]._id, artists[5]._id],
      start_time: new Date('2026-06-15T14:00:00'),
      end_time: new Date('2026-06-15T23:59:00'),
      sale_start: new Date('2026-04-01T10:00:00'),
      sale_end: new Date('2026-06-14T23:59:59'),
      status: 'PUB',
      featured: true,
      ticketClasses: [
        { name: 'VIP', price: 2500000, benefits: ['VIP Lounge Access'] },
        { name: 'CAT A', price: 1200000, benefits: ['Good View'] },
        { name: 'Standing', price: 400000, benefits: ['General Admission'] }
      ]
    },

    // ===== SPORT (5 events) =====
    {
      title: 'V-League 2026: Hà Nội FC vs HAGL',
      slug: 'vleague-hanoi-hagl-2026',
      description: 'Trận đấu đỉnh cao V-League giữa Hà Nội FC và Hoàng Anh Gia Lai.',
      category: 'sport',
      thumbnail: images.sport[0],
      banner: images.sport[0],
      base_price: 80000,
      venue: venues[0]._id,
      artists: [],
      start_time: new Date('2026-03-05T19:00:00'),
      end_time: new Date('2026-03-05T21:00:00'),
      sale_start: new Date('2026-02-01T10:00:00'),
      sale_end: new Date('2026-03-04T23:59:59'),
      status: 'PUB',
      trending: true,
      ticketClasses: [
        { name: 'VIP', price: 500000, benefits: ['Best View'] },
        { name: 'CAT A', price: 200000, benefits: ['Good View'] },
        { name: 'Standing', price: 80000, benefits: ['General Admission'] }
      ]
    },
    {
      title: 'Vietnam Basketball League Finals',
      slug: 'vbl-finals-2026',
      description: 'Trận chung kết giải bóng rổ chuyên nghiệp Việt Nam.',
      category: 'sport',
      thumbnail: images.sport[1],
      banner: images.sport[1],
      base_price: 150000,
      venue: venues[2]._id,
      artists: [],
      start_time: new Date('2026-04-20T18:00:00'),
      end_time: new Date('2026-04-20T21:00:00'),
      sale_start: new Date('2026-03-01T10:00:00'),
      sale_end: new Date('2026-04-19T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'VIP', price: 800000, benefits: ['Courtside'] },
        { name: 'Standard', price: 150000, benefits: ['Reserved Seating'] }
      ]
    },
    {
      title: 'SEA Games 2026: Football Finals',
      slug: 'seagames-football-2026',
      description: 'Trận chung kết bóng đá SEA Games 2026 tại Việt Nam.',
      category: 'sport',
      thumbnail: images.sport[2],
      banner: images.sport[2],
      base_price: 200000,
      venue: venues[0]._id,
      artists: [],
      start_time: new Date('2026-05-15T19:00:00'),
      end_time: new Date('2026-05-15T21:30:00'),
      sale_start: new Date('2026-04-01T10:00:00'),
      sale_end: new Date('2026-05-14T23:59:59'),
      status: 'PUB',
      featured: true,
      ticketClasses: [
        { name: 'VIP', price: 1000000, benefits: ['Best View', 'Refreshments'] },
        { name: 'CAT A', price: 500000, benefits: ['Good View'] },
        { name: 'Standing', price: 200000, benefits: ['General Admission'] }
      ]
    },
    {
      title: 'Vietnam Marathon 2026',
      slug: 'vietnam-marathon-2026',
      description: 'Giải chạy marathon lớn nhất Việt Nam năm 2026.',
      category: 'sport',
      thumbnail: images.sport[3],
      banner: images.sport[3],
      base_price: 500000,
      venue: venues[0]._id,
      artists: [],
      start_time: new Date('2026-07-04T05:00:00'),
      end_time: new Date('2026-07-04T12:00:00'),
      sale_start: new Date('2026-04-01T10:00:00'),
      sale_end: new Date('2026-07-01T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'Full Marathon', price: 1200000, benefits: ['42km Race', 'Medal', 'T-shirt'] },
        { name: 'Half Marathon', price: 800000, benefits: ['21km Race', 'Medal'] },
        { name: '10K Run', price: 500000, benefits: ['10km Race'] }
      ]
    },
    {
      title: 'Tennis Vietnam Open 2026',
      slug: 'tennis-vietnam-open-2026',
      description: 'Giải quần vợt quốc tế tại Việt Nam.',
      category: 'sport',
      thumbnail: images.sport[4],
      banner: images.sport[4],
      base_price: 300000,
      venue: venues[2]._id,
      artists: [],
      start_time: new Date('2026-08-10T09:00:00'),
      end_time: new Date('2026-08-10T18:00:00'),
      sale_start: new Date('2026-06-01T10:00:00'),
      sale_end: new Date('2026-08-09T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'VIP', price: 1500000, benefits: ['Courtside', 'Lunch'] },
        { name: 'Standard', price: 300000, benefits: ['General Seating'] }
      ]
    },

    // ===== THEATER (5 events) =====
    {
      title: 'Vở kịch: Dưới Bóng Giai Nhân',
      slug: 'duoi-bong-giai-nhan-2026',
      description: 'Vở kịch nổi tiếng của Nhà hát Kịch IDECAF.',
      category: 'theater',
      thumbnail: images.theater[0],
      banner: images.theater[0],
      base_price: 250000,
      venue: venues[1]._id,
      artists: [],
      start_time: new Date('2026-02-08T20:00:00'),
      end_time: new Date('2026-02-08T22:30:00'),
      sale_start: new Date('2026-01-01T10:00:00'),
      sale_end: new Date('2026-02-07T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'Orchestra', price: 600000, benefits: ['Center Stage View'] },
        { name: 'Balcony', price: 250000, benefits: ['Elevated View'] }
      ]
    },
    {
      title: 'Ballet: Hồ Thiên Nga',
      slug: 'ballet-ho-thien-nga-2026',
      description: 'Vở ballet kinh điển Hồ Thiên Nga được trình diễn bởi đoàn ballet quốc gia.',
      category: 'theater',
      thumbnail: images.theater[1],
      banner: images.theater[1],
      base_price: 400000,
      venue: venues[1]._id,
      artists: [],
      start_time: new Date('2026-03-20T19:30:00'),
      end_time: new Date('2026-03-20T22:00:00'),
      sale_start: new Date('2026-02-01T10:00:00'),
      sale_end: new Date('2026-03-19T23:59:59'),
      status: 'PUB',
      featured: true,
      ticketClasses: [
        { name: 'Orchestra', price: 1200000, benefits: ['Best View'] },
        { name: 'Balcony', price: 400000, benefits: ['Good View'] }
      ]
    },
    {
      title: 'GOm Show Tháng 2',
      slug: 'gom-show-thang-2-2026',
      description: 'Đêm hài kịch GOm Show với những tiết mục đặc sắc.',
      category: 'theater',
      thumbnail: images.theater[2],
      banner: images.theater[2],
      base_price: 200000,
      venue: venues[1]._id,
      artists: [],
      start_time: new Date('2026-02-15T20:00:00'),
      end_time: new Date('2026-02-15T22:00:00'),
      sale_start: new Date('2026-01-15T10:00:00'),
      sale_end: new Date('2026-02-14T23:59:59'),
      status: 'PUB',
      trending: true,
      ticketClasses: [
        { name: 'Orchestra', price: 450000, benefits: ['Front Rows'] },
        { name: 'Balcony', price: 200000, benefits: ['Good View'] }
      ]
    },
    {
      title: 'Opera: La Traviata',
      slug: 'opera-la-traviata-2026',
      description: 'Vở opera La Traviata của Giuseppe Verdi.',
      category: 'theater',
      thumbnail: images.theater[3],
      banner: images.theater[3],
      base_price: 500000,
      venue: venues[1]._id,
      artists: [],
      start_time: new Date('2026-04-25T19:00:00'),
      end_time: new Date('2026-04-25T22:00:00'),
      sale_start: new Date('2026-03-01T10:00:00'),
      sale_end: new Date('2026-04-24T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'Orchestra', price: 1500000, benefits: ['Premium Experience'] },
        { name: 'Balcony', price: 500000, benefits: ['Classic View'] }
      ]
    },
    {
      title: 'Stand-up Comedy Night',
      slug: 'standup-comedy-night-2026',
      description: 'Đêm hài độc thoại với các comedian nổi tiếng.',
      category: 'theater',
      thumbnail: images.theater[4],
      banner: images.theater[4],
      base_price: 300000,
      venue: venues[2]._id,
      artists: [],
      start_time: new Date('2026-05-10T20:00:00'),
      end_time: new Date('2026-05-10T22:30:00'),
      sale_start: new Date('2026-04-01T10:00:00'),
      sale_end: new Date('2026-05-09T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'VIP', price: 800000, benefits: ['Front Row', 'Meet & Greet'] },
        { name: 'Standard', price: 300000, benefits: ['General Seating'] }
      ]
    },

    // ===== OTHER (5 events) =====
    {
      title: 'Tech Conference Vietnam 2026',
      slug: 'tech-conference-2026',
      description: 'Hội nghị công nghệ lớn nhất năm với các diễn giả hàng đầu.',
      category: 'other',
      thumbnail: images.other[0],
      banner: images.other[0],
      base_price: 500000,
      venue: venues[2]._id,
      artists: [],
      start_time: new Date('2026-03-10T08:00:00'),
      end_time: new Date('2026-03-10T18:00:00'),
      sale_start: new Date('2026-01-01T10:00:00'),
      sale_end: new Date('2026-03-09T23:59:59'),
      status: 'PUB',
      featured: true,
      ticketClasses: [
        { name: 'VIP', price: 2000000, benefits: ['All Access', 'Lunch', 'Networking'] },
        { name: 'Standard', price: 500000, benefits: ['Conference Access'] }
      ]
    },
    {
      title: 'Workshop: Làm Tranh Rêu',
      slug: 'workshop-tranh-reu-2026',
      description: 'Workshop làm khung tranh rêu độc đáo cho người yêu nghệ thuật.',
      category: 'other',
      thumbnail: images.other[1],
      banner: images.other[1],
      base_price: 350000,
      venue: venues[2]._id,
      artists: [],
      start_time: new Date('2026-02-20T14:00:00'),
      end_time: new Date('2026-02-20T17:00:00'),
      sale_start: new Date('2026-01-15T10:00:00'),
      sale_end: new Date('2026-02-19T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'Standard', price: 350000, benefits: ['All Materials Included'] }
      ]
    },
    {
      title: 'Food Festival Saigon 2026',
      slug: 'food-festival-saigon-2026',
      description: 'Lễ hội ẩm thực với hàng trăm gian hàng đặc sản.',
      category: 'other',
      thumbnail: images.other[2],
      banner: images.other[2],
      base_price: 100000,
      venue: venues[0]._id,
      artists: [],
      start_time: new Date('2026-04-15T10:00:00'),
      end_time: new Date('2026-04-15T22:00:00'),
      sale_start: new Date('2026-03-01T10:00:00'),
      sale_end: new Date('2026-04-14T23:59:59'),
      status: 'PUB',
      trending: true,
      ticketClasses: [
        { name: 'VIP', price: 500000, benefits: ['VIP Area', 'Food Vouchers'] },
        { name: 'Standard', price: 100000, benefits: ['Entry Access'] }
      ]
    },
    {
      title: 'Art Exhibition: Modern Vietnam',
      slug: 'art-exhibition-modern-vietnam',
      description: 'Triển lãm nghệ thuật hiện đại Việt Nam.',
      category: 'other',
      thumbnail: images.other[3],
      banner: images.other[3],
      base_price: 150000,
      venue: venues[2]._id,
      artists: [],
      start_time: new Date('2026-05-01T09:00:00'),
      end_time: new Date('2026-05-01T18:00:00'),
      sale_start: new Date('2026-04-01T10:00:00'),
      sale_end: new Date('2026-04-30T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'VIP', price: 500000, benefits: ['Guided Tour', 'Catalogue'] },
        { name: 'Standard', price: 150000, benefits: ['Entry Access'] }
      ]
    },
    {
      title: 'EDM Party: Glow Night',
      slug: 'edm-party-glow-night-2026',
      description: 'Đêm tiệc EDM với DJ quốc tế và hiệu ứng ánh sáng hoành tráng.',
      category: 'other',
      thumbnail: images.other[4],
      banner: images.other[4],
      base_price: 400000,
      venue: venues[0]._id,
      artists: [],
      start_time: new Date('2026-06-20T21:00:00'),
      end_time: new Date('2026-06-21T04:00:00'),
      sale_start: new Date('2026-05-01T10:00:00'),
      sale_end: new Date('2026-06-19T23:59:59'),
      status: 'PUB',
      ticketClasses: [
        { name: 'VIP', price: 1500000, benefits: ['VIP Area', 'Free Drinks'] },
        { name: 'Standard', price: 400000, benefits: ['General Admission'] }
      ]
    }
  ];

  const createdConcerts = [];
  
  for (const concertData of concertsData) {
    const { ticketClasses: ticketClassesData, ...concertInfo } = concertData;
    
    const concert = await Concert.create({
      ...concertInfo,
      organizer: organizer._id
    });
    
    const zones = await Zone.find({ venue: concert.venue });
    const ticketClassMap = {};
    
    for (let i = 0; i < ticketClassesData.length; i++) {
      const tcData = ticketClassesData[i];
      const zone = zones[i % zones.length];
      
      const ticketClass = await TicketClass.create({
        concert: concert._id,
        zone: zone._id,
        name: tcData.name,
        price: tcData.price,
        benefits: tcData.benefits,
        quota: 200,
        sold_qty: 0
      });
      
      ticketClassMap[zone._id.toString()] = ticketClass;
    }
    
    // Create ShowSeats
    for (const zone of zones) {
      const seats = await Seat.find({ zone: zone._id }).limit(50);
      const ticketClass = ticketClassMap[zone._id.toString()];
      
      if (ticketClass && seats.length > 0) {
        const showSeats = seats.map(seat => ({
          concert: concert._id,
          seat: seat._id,
          ticketClass: ticketClass._id,
          price: ticketClass.price,
          status: 'AVAILABLE'
        }));
        await ShowSeat.insertMany(showSeats);
      }
    }
    
    createdConcerts.push(concert);
  }
  
  console.log(`✅ Created ${createdConcerts.length} concerts`);
  return createdConcerts;
}

/**
 * Create Vouchers
 */
async function createVouchers() {
  console.log('🎟️ Creating vouchers...');
  
  const vouchersData = [
    { code: 'WELCOME10', discount_percent: 10, max_amount: 200000, min_order_amount: 500000, usage_limit: 1000, valid_from: new Date('2026-01-01'), valid_until: new Date('2026-12-31'), description: 'Giảm 10% cho khách hàng mới', active: true },
    { code: 'NEWYEAR2026', discount_percent: 15, max_amount: 300000, min_order_amount: 800000, usage_limit: 500, valid_from: new Date('2026-01-01'), valid_until: new Date('2026-01-31'), description: 'Giảm 15% mừng năm mới', active: true },
    { code: 'VIP20', discount_percent: 20, max_amount: 500000, min_order_amount: 2000000, usage_limit: 100, valid_from: new Date('2026-01-01'), valid_until: new Date('2026-06-30'), description: 'Giảm 20% cho vé VIP', active: true },
  ];

  const createdVouchers = await Voucher.insertMany(vouchersData);
  console.log(`✅ Created ${createdVouchers.length} vouchers`);
  return createdVouchers;
}

/**
 * Main seed function
 */
async function seed() {
  try {
    console.log('🚀 Starting database seed...\n');
    
    await mongoose.connect(MONGODB_URI);
    console.log('✅ Connected to MongoDB\n');
    
    await clearDatabase();
    
    const users = await createUsers();
    const organizer = users.find(u => u.role === 'ORG');
    
    const venues = await createVenues();
    const artists = await createArtists();
    const concerts = await createConcerts(venues, artists, organizer);
    await createVouchers();
    
    console.log('\n' + '═'.repeat(50));
    console.log('🎉 Database seeded successfully!\n');
    console.log('📊 Summary:');
    console.log(`   • Users: ${users.length}`);
    console.log(`   • Venues: ${venues.length}`);
    console.log(`   • Artists: ${artists.length}`);
    console.log(`   • Concerts: ${concerts.length} (5 per category)`);
    console.log('');
    console.log('🔐 Test Accounts (Password: Password123!):');
    console.log('   • Admin:     admin@quickshow.com');
    console.log('   • Organizer: organizer@quickshow.com');
    console.log('   • Staff:     staff@quickshow.com');
    console.log('   • Customer:  customer@example.com');
    console.log('═'.repeat(50));
    
  } catch (error) {
    console.error('❌ Seed failed:', error);
  } finally {
    await mongoose.connection.close();
    console.log('\n🔌 Database connection closed');
  }
}

seed();
