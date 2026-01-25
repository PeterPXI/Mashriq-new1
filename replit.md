# Mashriq (مشرق) - Student Marketplace Platform

## Overview

Mashriq is an Arabic-first digital services marketplace platform designed for students. It enables users to buy and sell digital services (design, programming, writing, etc.) with a complete escrow-based transaction system. The platform follows a "sunrise theme" design language with RTL (right-to-left) Arabic support.

The core purpose is connecting student freelancers with buyers through a secure order flow: service browsing → checkout → escrow hold → delivery → completion/dispute resolution.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Technology**: Vanilla JavaScript with Tailwind CSS
- **Routing Pattern**: Static HTML pages served from `/app/*` paths
- **Component System**: JavaScript modules for reusable UI (Navbar, Footer, Loader, Toast)
- **Styling**: Tailwind CSS with custom design system variables, Arabic fonts (Cairo), RTL layout
- **State Management**: LocalStorage for auth tokens and user data
- **API Communication**: Centralized API module with fetch wrapper

**Key Frontend Patterns**:
- Config-driven routing via `CONFIG.ROUTES` object
- Auth module handles token/user persistence
- All API calls use `/api/*` prefix
- Navigation uses `window.location.href` for page transitions

### Backend Architecture
- **Framework**: Express.js (Node.js)
- **Pattern**: Controller → Service → Model layered architecture
- **API Design**: RESTful JSON APIs at `/api/*` routes only

**Layer Responsibilities**:
- **Controllers**: HTTP handling, validation, permission checks - NO business logic
- **Services**: All business logic, state machines, integrations
- **Models**: Mongoose schemas with constitution rules documented in headers

**Critical Design Decisions**:
1. **Strict Route Separation** (see ROUTING_RULES.md):
   - `/app/*` = Frontend static files
   - `/api/*` = JSON API endpoints only
   
2. **Order State Machine**: ACTIVE → DELIVERED → COMPLETED/CANCELLED
   - Only OrderService can modify order status
   - Escrow operations triggered by state transitions

3. **Trust System**: Internal-only metrics that affect visibility/limits but are NEVER exposed via API

4. **Immutable Audit Trail**: Transactions, Messages, and Reviews cannot be edited/deleted

### Data Models
Core entities with documented "constitution rules" in model files:
- **User**: Authentication, profile, internal trust metrics (never exposed), email verification fields, password reset tokens
- **Service**: Seller listings with base price + optional extras (multiples of 5)
- **Order**: Core transaction with service snapshot, escrow tracking, state machine
- **Chat/Message**: 1:1 order-to-chat, read-only after order closure
- **Dispute**: Buyer-initiated on DELIVERED orders, admin-resolved
- **Review**: Immutable post-completion feedback
- **Wallet/Transaction**: Escrow accounting with append-only transaction log
- **Payment**: Stripe payment sessions for wallet top-ups with idempotency protection
- **Notification**: User notifications with type-based categorization and read status
- **Favorite**: User's saved/bookmarked services (unique per user-service pair)

### Notifications System
- **Model**: `models/Notification.js` - Stores all user notifications
- **Service**: `services/NotificationService.js` - Handles notification creation for all events
- **Types**: new_order, order_delivered, order_completed, order_cancelled, new_message, new_review, dispute_opened, dispute_resolved, wallet_deposit
- **Frontend**: Bell icon in navbar with unread count, dedicated notifications page

### Admin Dashboard
- **Routes**: `/api/admin/*` - Admin-only endpoints
- **Pages**: 
  - `/app/admin/dashboard.html` - Overview stats and navigation
  - `/app/admin/users.html` - User management (search, filter, activate/deactivate)
  - `/app/admin/disputes.html` - Dispute resolution interface
  - `/app/admin/services.html` - Service moderation
- **Access Control**: `requireAdmin` middleware restricts to admin role users

### Authentication
- JWT-based authentication with Bearer tokens
- Middleware (`authenticateToken`) validates tokens and attaches user to request
- Role is contextual (buyer/seller/admin) per action, not fixed per user

### API Response Contract
Standardized via `utils/apiResponse.js`:
```javascript
// Success: { success: true, message: string, data: object }
// Error: { success: false, message: string, code: string }
```

## External Dependencies

### Database
- **MongoDB** via Mongoose ODM
- Connection configured through `MONGO_URI` environment variable
- Database connection logic in `config/db.js`

### NPM Packages
| Package | Purpose |
|---------|---------|
| express | Web framework |
| mongoose | MongoDB ODM |
| bcryptjs | Password hashing |
| jsonwebtoken | JWT auth |
| multer | File uploads |
| cors | Cross-origin requests |
| dotenv | Environment variables |
| uuid | Unique ID generation |
| stripe | Stripe payment gateway |

### Stripe Integration (Wallet Top-ups)
- **Implementation**: Stripe Checkout Sessions for secure payments
- **Flow**: Create checkout → Stripe processes → Webhook confirms → Wallet credited
- **Security Features**:
  - Webhook signature verification (requires `STRIPE_WEBHOOK_SECRET`)
  - Atomic idempotency via Payment model (pending → processing → completed)
  - User validation on verify-payment endpoint
- **Files**: `services/stripeClient.js`, `routes/stripeRoutes.js`, `models/Payment.js`
- **Endpoints**:
  - `GET /api/stripe/config` - Get publishable key
  - `POST /api/stripe/create-checkout` - Create checkout session
  - `POST /api/stripe/webhook` - Stripe webhook (mounted before express.json)
  - `POST /api/stripe/verify-payment` - Client-side payment verification
  - `GET /api/stripe/balance` - Get wallet balance
  - `GET /api/stripe/transactions` - Get transaction history

### Notifications API
- `GET /api/notifications` - Get user notifications
- `GET /api/notifications/count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark as read
- `PUT /api/notifications/read-all` - Mark all as read

### Admin API
- `GET /api/admin/stats` - Platform statistics
- `GET /api/admin/users` - List users with search/filter
- `PUT /api/admin/users/:id/status` - Toggle user active status
- `GET /api/admin/disputes` - List disputes
- `PUT /api/admin/disputes/:id/resolve` - Resolve a dispute
- `GET /api/admin/services` - List services
- `PUT /api/admin/services/:id/status` - Toggle service active status

### Auth API (Password Reset & Email Verification)
- `POST /api/auth/forgot-password` - Request password reset code (6-digit, 1-hour expiry)
- `POST /api/auth/verify-reset-code` - Verify reset code validity
- `POST /api/auth/reset-password` - Reset password with code
- `POST /api/auth/send-verification` - Send email verification code (requires auth, 10-min expiry)
- `POST /api/auth/verify-email` - Verify email with code (requires auth)

### Favorites API
- `GET /api/favorites` - Get user's saved services (requires auth)
- `POST /api/favorites/:serviceId` - Add service to favorites (requires auth)
- `DELETE /api/favorites/:serviceId` - Remove from favorites (requires auth)
- `GET /api/favorites/check/:serviceId` - Check if service is favorited (requires auth)

### Advanced Search (Services API)
The `/api/services` endpoint now supports advanced filtering:
- `category` - Filter by category ID
- `search` - Text search in title, description, seller name
- `minPrice` / `maxPrice` - Price range filter
- `minRating` - Minimum rating filter (e.g., 3+, 4+ stars)
- `deliveryTime` - Maximum delivery days filter
- `sort` - Sort options: `-createdAt`, `-rating`, `price`, `-price`, `-ordersCount`
- `page` / `limit` - Pagination support

### Static & Auxiliary Pages
- `/app/settings.html` - User settings (profile edit, password, seller mode)
- `/app/change-password.html` - Dedicated password change page
- `/app/become-seller.html` - Seller activation landing page
- `/app/about.html` - About Us page
- `/app/terms.html` - Terms of Service
- `/app/privacy.html` - Privacy Policy
- `/app/help.html` - Help center / FAQ
- `/app/contact.html` - Contact form
- `/app/forgot-password.html` - Password reset flow (3-step: email → code + new password → success)
- `/app/verify-email.html` - Email verification page (requires auth)
- `/app/favorites.html` - User's saved services page (requires auth)
- `/app/explore.html` - Advanced search with filters (category, price range, rating, delivery time)

### Environment Variables Required
- `MONGO_URI` - MongoDB connection string (required)
- `JWT_SECRET` - JWT signing secret (defaults to fallback)
- `STRIPE_WEBHOOK_SECRET` - Stripe webhook signing secret (required for production)
- `CORS_ORIGIN` - Allowed origins (defaults to `*`)
- `PORT` - Server port (optional)

### Build Tools (Dev)
- Tailwind CSS with PostCSS/Autoprefixer
- CSS built from `public/app/assets/css/src/input.css` to `tailwind.css`