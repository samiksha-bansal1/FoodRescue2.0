# FoodRescue Platform

## Overview

FoodRescue is a full-stack food donation management platform that connects food donors (restaurants/businesses) with NGOs and volunteers to redistribute surplus food and reduce waste. The application features real-time updates, multi-role authentication, donation tracking, and automated volunteer task assignment.

**Tech Stack:**
- Frontend: React 18 + TypeScript + Vite
- Backend: Express.js + Node.js
- Database: PostgreSQL with Drizzle ORM
- Real-time: Socket.io
- UI: Shadcn UI + Tailwind CSS
- Animations: Framer Motion
- State Management: React Query (TanStack)

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Multi-Role Authentication System
**Design Pattern:** JWT-based token authentication with role-based access control (RBAC)

**Implementation:**
- Four user roles: Donor, NGO, Volunteer, Admin
- JWT tokens stored in localStorage with automatic injection via request interceptors
- Protected routes using `ProtectedRoute` component that validates user role before rendering
- Password hashing with bcrypt (10 salt rounds)
- Session management via Express middleware

**Rationale:** JWT provides stateless authentication suitable for modern SPA applications. Role-based access ensures proper data isolation and security boundaries between different user types.

### Real-Time Updates Architecture
**Technology:** Socket.io for bidirectional WebSocket communication

**Event Flow:**
1. User connects → Socket joins user-specific room by userId
2. Database mutation occurs → Server emits event to relevant rooms
3. Client receives event → React Query cache invalidated → UI auto-updates

**Key Events:**
- `donation_accepted` - NGO accepts donation (50% completion)
- `task_accepted` - Volunteer accepts delivery (75% completion)
- `delivery_completed` - Delivery finished (100% completion)
- `new_notification` - Real-time notification delivery

**Rationale:** Socket.io chosen over polling for lower latency and reduced server load. Room-based architecture ensures users only receive relevant updates.

### Database Schema Design
**ORM:** Drizzle with PostgreSQL dialect

**Core Tables:**
- `users` - Polymorphic user table with role-specific JSON profiles (donorProfile, ngoProfile, volunteerProfile)
- `donations` - Food donation records with embedded location coordinates
- `volunteer_tasks` - Delivery task assignments
- `ratings` - Donor rating system for NGO feedback
- `notifications` - User notification queue

**Design Decisions:**
- **JSON columns for role profiles** instead of separate tables to reduce joins and maintain flexibility
- **Embedded coordinates** as arrays `[lat, lng]` for geospatial queries
- **Status enums** enforced at database level for data integrity
- **UUID primary keys** using PostgreSQL's `gen_random_uuid()` for distributed systems compatibility

**Rationale:** JSON profiles avoid complex polymorphic associations while maintaining type safety via TypeScript. PostgreSQL's JSON support provides indexing and query capabilities when needed.

### State Management Strategy
**Pattern:** Server state via React Query + Local state via React hooks

**Query Caching:**
- 5-minute stale time for user lists
- Real-time invalidation on mutations
- Optimistic updates for better UX
- Automatic background refetching

**Auth State:**
- Stored in Context API (`AuthContext`)
- Persisted to localStorage
- Synchronized with Socket.io connection

**Rationale:** React Query handles server state synchronization better than Redux for this use case. Context API sufficient for simple auth state. Avoids prop drilling while keeping bundle size small.

### Frontend Routing Architecture
**Library:** Wouter (lightweight React Router alternative)

**Route Protection:**
```
Public routes: /, /login, /register
Protected routes: Require authentication + role check
Role-specific dashboards: /donor, /ngo, /volunteer, /admin
```

**Implementation:**
- `ProtectedRoute` wrapper component validates auth + role
- Hydration check prevents flash of wrong content
- Automatic redirect to login if unauthenticated
- Role-based redirect after login

**Rationale:** Wouter chosen for minimal bundle size (1.5KB vs 40KB for React Router). Route protection centralized in single component for maintainability.

### UI Component System
**Framework:** Shadcn UI (copy-paste component library)

**Design System:**
- Primary color: Emerald green (#10B981) for sustainability theme
- Consistent 6px border radius across components
- Glass-morphism effects on cards
- Framer Motion for enter/exit animations
- Mobile-first responsive design

**Component Organization:**
- `/components/ui` - Base shadcn components
- `/components/shared` - Reusable business components (StatsCard, EmptyState)
- `/components/[role]` - Role-specific components (DonationBrowser, TaskList)
- `/components/layout` - Layout wrappers (DashboardLayout, Sidebar)

**Rationale:** Shadcn provides full customization without runtime overhead. Components are copied into project for easy modification. Consistent design tokens via CSS variables.

### File Upload & Storage
**Current Implementation:** Base64 encoding for image uploads stored in database JSON

**Future Consideration:** Can be migrated to S3/Cloudinary for production scale

**Rationale:** Base64 simplifies initial development without external dependencies. Database storage acceptable for low-volume MVP. Migration path clear when needed.

### Form Validation Strategy
**Libraries:** React Hook Form + Zod schemas

**Validation Flow:**
1. Zod schema defines data structure
2. React Hook Form handles form state
3. `@hookform/resolvers/zod` connects them
4. Backend validates again using same Drizzle schemas

**Rationale:** Type-safe validation shared between client and server. Zod provides excellent TypeScript inference. React Hook Form minimizes re-renders during typing.

### Geolocation Handling
**Implementation:**
- Browser Geolocation API for user position
- Reverse geocoding via OpenStreetMap Nominatim API
- Coordinates stored as `[latitude, longitude]` arrays
- Distance calculations use Haversine formula

**Rationale:** OpenStreetMap chosen as free alternative to Google Maps API. Coordinate arrays match GeoJSON standard for future compatibility.

### Notification System
**Architecture:** Dual delivery via Socket.io + database persistence

**Flow:**
1. Event occurs → Create notification in database
2. Emit Socket.io event to connected user
3. Client shows toast + updates notification bell
4. Persisted notifications survive page refresh

**Rationale:** Combining real-time and persisted notifications ensures users never miss important updates even when offline.

### Development vs Production Modes
**Dev Server:** `server/index-dev.ts` uses Vite middleware for HMR
**Production:** `server/index-prod.ts` serves pre-built static files

**Build Process:**
1. `vite build` compiles React app to `/dist/public`
2. `esbuild` bundles server code to `/dist/index.js`
3. Production server serves from `/dist/public`

**Rationale:** Separate entry points avoid dev dependencies in production bundle. Vite's dev server provides instant HMR during development.

## External Dependencies

### Database
**Provider:** PostgreSQL (via Neon serverless or Replit database)
**Connection:** Environment variable `DATABASE_URL` with connection string
**Migrations:** Drizzle Kit push/migrate commands

### Authentication
**No external service** - JWT signing handled in-app with `JWT_SECRET` environment variable

### Real-time Communication
**Socket.io Server** - Bundled with Express server, no external service

### Maps & Geolocation
**Leaflet** - Client-side map rendering library
**React-Leaflet** - React bindings for Leaflet
**OpenStreetMap** - Free tile provider (no API key required)
**Nominatim API** - Reverse geocoding (no API key, rate-limited)

### UI & Styling
**Shadcn UI** - Component templates (copied into project)
**Tailwind CSS** - Utility-first CSS framework
**Radix UI** - Headless UI primitives for accessibility
**Lucide React** - Icon library

### State & Data Fetching
**@tanstack/react-query** - Server state management
**Axios** - Not used (native fetch preferred)
**date-fns** - Date manipulation library

### Build Tools
**Vite** - Frontend build tool and dev server
**esbuild** - Server code bundling
**TypeScript** - Type checking
**Drizzle Kit** - Database schema management

### Hosting Considerations
**Replit:** Built-in PostgreSQL, zero-config deployment
**Vercel:** Requires external PostgreSQL (Neon/Supabase recommended)
**Environment Variables Required:**
- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - Secret key for JWT signing
- `SESSION_SECRET` - Session encryption key
- `NODE_ENV` - "development" or "production"