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
- **User**: Authentication, profile, internal trust metrics (never exposed)
- **Service**: Seller listings with base price + optional extras (multiples of 5)
- **Order**: Core transaction with service snapshot, escrow tracking, state machine
- **Chat/Message**: 1:1 order-to-chat, read-only after order closure
- **Dispute**: Buyer-initiated on DELIVERED orders, admin-resolved
- **Review**: Immutable post-completion feedback
- **Wallet/Transaction**: Escrow accounting with append-only transaction log

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

### Environment Variables Required
- `MONGO_URI` - MongoDB connection string (required)
- `JWT_SECRET` - JWT signing secret (defaults to fallback)
- `CORS_ORIGIN` - Allowed origins (defaults to `*`)
- `PORT` - Server port (optional)

### Build Tools (Dev)
- Tailwind CSS with PostCSS/Autoprefixer
- CSS built from `public/app/assets/css/src/input.css` to `tailwind.css`