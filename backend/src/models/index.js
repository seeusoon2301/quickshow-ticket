/**
 * QuickShow Ticket - Models Index (ES Modules)
 * 
 * Based on ERD with 12 entities
 * 
 * ENTITY RELATIONSHIPS:
 * =====================
 * 
 * User (base for all roles)
 *   └── customer, staff, organizer, admin (embedded fields)
 * 
 * Venue
 *   └── Zone (1:N)
 *         └── Seat (1:N)
 * 
 * Concert
 *   ├── Venue (N:1)
 *   ├── Organizer/User (N:1)
 *   ├── Artist (N:M)
 *   ├── TicketClass (1:N)
 *   └── ShowSeat (1:N)
 * 
 * TicketClass
 *   ├── Concert (N:1)
 *   ├── Zone (N:1)
 *   └── Ticket (1:N)
 * 
 * ShowSeat
 *   ├── Concert (N:1)
 *   ├── Seat (N:1)
 *   └── Ticket (1:1)
 * 
 * Order
 *   ├── Customer/User (N:1)
 *   ├── Concert (N:1)
 *   ├── Voucher (N:1, optional)
 *   ├── OrderDetail (1:N)
 *   └── Payment (1:1)
 * 
 * OrderDetail
 *   ├── Order (N:1)
 *   └── Ticket (N:1)
 */

import User from './User.js';
import Artist from './Artist.js';
import Venue from './Venue.js';
import Zone from './Zone.js';
import Seat from './Seat.js';
import Concert from './Concert.js';
import TicketClass from './TicketClass.js';
import ShowSeat from './ShowSeat.js';
import Ticket from './Ticket.js';
import Voucher from './Voucher.js';
import Order from './Order.js';
import OrderDetail from './OrderDetail.js';
import Payment from './Payment.js';

export {
  User,
  Artist,
  Venue,
  Zone,
  Seat,
  Concert,
  TicketClass,
  ShowSeat,
  Ticket,
  Voucher,
  Order,
  OrderDetail,
  Payment
};

export default {
  User,
  Artist,
  Venue,
  Zone,
  Seat,
  Concert,
  TicketClass,
  ShowSeat,
  Ticket,
  Voucher,
  Order,
  OrderDetail,
  Payment
};
