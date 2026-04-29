# Boat Tour Management System - Design Spec

**Date:** 2026-04-29  
**Status:** Approved  
**Phase:** MVP with User Management  

---

## 1. Project Overview

**Name:** Boat Tour Management System  
**Client:** VVV Nordhorn  
**Purpose:** Manage boat tours, boat inventory, boat captains, and booking scheduling with a focus on preventing double-bookings and enforcing captain-boat compatibility rules.

**Key Features (MVP):**
- Booking calendar (month/week/day views) with conflict prevention
- Boat management (CRUD: add, edit, delete boats with capacity & availability)
- Captain management (CRUD: certifications, boat qualifications)
- User authentication & role-based access (Admin, Staff, Customer)
- Availability checking (smart filtering by capacity, captain qualifications, time conflicts)

---

## 2. Tech Stack

| Layer | Technology | Notes |
|-------|-----------|-------|
| **Frontend** | React 18 + TypeScript + Vite | Already exists; using shadcn-ui, Tailwind, React Big Calendar |
| **Backend** | Python FastAPI | New; replacing in-memory state |
| **Database** | PostgreSQL (self-hosted) | New; clean schema with constraints |
| **Auth** | JWT (access + refresh tokens) | Middleware-based role checking |
| **API Client** | axios + React Query | For state management & caching |
| **Styling** | Tailwind CSS + shadcn-ui | Consistent with existing frontend |

---

## 3. Architecture

### 3.1 Backend Structure (Clean Architecture)

```
bootstrap-manager-backend/
├── app/
│   ├── __init__.py
│   ├── main.py (FastAPI app setup, middleware)
│   ├── config.py (env vars: DB_URL, JWT_SECRET, etc)
│   │
│   ├── api/routes/
│   │   ├── auth.py (register, login, refresh, logout)
│   │   ├── boats.py (CRUD + availability check)
│   │   ├── captains.py (CRUD + boat assignment)
│   │   ├── bookings.py (CRUD + conflict detection)
│   │   └── users.py (profile, role management)
│   │
│   ├── services/
│   │   ├── auth_service.py (JWT, password hashing)
│   │   ├── booking_service.py (validate, prevent double-booking, captain-boat compatibility)
│   │   ├── boat_service.py (availability logic)
│   │   ├── captain_service.py (boat qualification checks)
│   │   └── user_service.py (CRUD operations)
│   │
│   ├── repositories/
│   │   ├── base.py (abstract repository pattern)
│   │   ├── boat_repository.py (DB queries)
│   │   ├── captain_repository.py
│   │   ├── booking_repository.py
│   │   └── user_repository.py
│   │
│   ├── models/
│   │   ├── schemas.py (Pydantic models: BoatCreate, BookingResponse, etc)
│   │   └── db.py (SQLAlchemy ORM models)
│   │
│   ├── domain/
│   │   ├── booking.py (enums: BookingStatus; value types)
│   │   ├── boat.py
│   │   ├── captain.py
│   │   └── user.py (enums: UserRole)
│   │
│   ├── middleware/
│   │   ├── auth.py (JWT verification, role checking)
│   │   └── error_handler.py (consistent error responses)
│   │
│   └── db/
│       ├── database.py (SQLAlchemy engine, session factory)
│       └── migrations/ (Alembic)
│
├── tests/ (pytest)
├── requirements.txt (fastapi, sqlalchemy, alembic, python-jose, passlib, etc)
├── .env (DB_URL, JWT_SECRET_KEY, JWT_ALGORITHM, etc)
└── docker-compose.yml (PostgreSQL container)
```

**Layer Flow:**
```
HTTP Request → FastAPI Route → Service (business logic) → Repository (DB abstraction) → SQLAlchemy → PostgreSQL
                   ↑                                                                                       ↓
                   ←──────────────── Pydantic Response ────────────────────────────────────────────────────
```

---

## 4. API Specification

### 4.1 Authentication Endpoints

```
POST /api/auth/register
  Body: { email, password, name }
  Response: { id, email, name, role, created_at }
  Status: 201 Created

POST /api/auth/login
  Body: { email, password }
  Response: { access_token, refresh_token, token_type: "bearer" }
  Status: 200 OK

POST /api/auth/refresh
  Header: Authorization: Bearer <refresh_token>
  Response: { access_token }
  Status: 200 OK

POST /api/auth/logout
  Header: Authorization: Bearer <token>
  Status: 204 No Content
```

### 4.2 Boat Endpoints

```
GET /api/boats
  Query: ?available=true&capacity_min=20
  Response: [{ id, name, capacity, type, description, available }]
  Auth: None (public)

POST /api/boats
  Body: { name, capacity, type, description?, available }
  Auth: admin
  Response: { id, ... }, 201 Created

GET /api/boats/{id}
  Auth: None
  Response: { id, name, capacity, type, description, available }

PUT /api/boats/{id}
  Body: partial boat data
  Auth: admin
  Response: updated boat

DELETE /api/boats/{id}
  Auth: admin
  Status: 204 No Content

GET /api/boats/{id}/available?start=2024-08-15T10:00&end=2024-08-15T14:00
  Response: { available: true/false, reason?: "booked", bookings: [...] }
  Auth: None
```

### 4.3 Captain Endpoints

```
GET /api/captains
  Response: [{ id, name, email, phone, certifications, availableBoats: [id] }]
  Auth: None

POST /api/captains
  Body: { name, email, phone, certifications }
  Auth: admin
  Response: { id, ... }, 201 Created

GET /api/captains/{id}
  Response: captain with availableBoats

PUT /api/captains/{id}
  Auth: admin
  Body: partial captain data
  Response: updated captain

DELETE /api/captains/{id}
  Auth: admin
  Status: 204

PUT /api/captains/{id}/boats
  Body: { boatIds: [1, 3, 5] }
  Auth: admin
  Response: captain with updated availableBoats

GET /api/captains/{id}/available?start=...&end=...
  Response: { available: true/false, bookings: [...] }
  Auth: None
```

### 4.4 Booking Endpoints

```
GET /api/bookings
  Query: ?status=confirmed&boatId=1&startDate=2024-08-01&endDate=2024-08-31
  Response: [{ id, startDate, endDate, customer, participants, boat, captain, catering, notes, status }]
  Auth: staff+ (staff sees own bookings, admin sees all)

POST /api/bookings
  Body: { startDate, endDate, customer, participants, boatId, captainId, catering?, notes? }
  Validation:
    - participants > 0 and <= boat.capacity
    - boat not booked same time (confirmed status)
    - captain can operate boat (captain_boats)
    - captain not booked same time (confirmed status)
  Auth: staff+
  Response: { id, status: "pending", ... }, 201 Created
  Error: 409 Conflict if overlap, 400 Bad Request if invalid

GET /api/bookings/{id}
  Auth: staff+ (can only see if own booking or admin)
  Response: booking details

PUT /api/bookings/{id}
  Auth: staff+ (can only edit if own or admin)
  Body: partial booking data (re-validate on save)
  Response: updated booking

DELETE /api/bookings/{id}
  Auth: staff+
  Status: 204 (soft delete: status = "cancelled")

GET /api/bookings/check-availability?boatId=1&captainId=3&start=...&end=...
  Response: { boatAvailable: true/false, captainAvailable: true/false }
  Auth: None
```

### 4.5 User Endpoints

```
GET /api/users/me
  Auth: required
  Response: { id, email, name, role, created_at }

PUT /api/users/me
  Auth: required
  Body: { name?, email? }
  Response: updated user

GET /api/users
  Auth: admin
  Response: [{ id, email, name, role, created_at }]

PUT /api/users/{id}/role
  Auth: admin
  Body: { role: "admin" | "staff" | "customer" }
  Response: updated user, 200 OK
```

---

## 5. Database Schema

### 5.1 Core Tables

```sql
-- Users (authentication & roles)
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'staff',  -- 'admin', 'staff', 'customer'
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Boats
CREATE TABLE boats (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  capacity INT NOT NULL CHECK (capacity > 0),
  type VARCHAR(100) NOT NULL,
  description TEXT,
  available BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Captains
CREATE TABLE captains (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL,
  phone VARCHAR(20),
  certifications TEXT[] DEFAULT '{}'::TEXT[],  -- PostgreSQL array type
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Captain-Boat Relationship (Many-to-Many)
CREATE TABLE captain_boats (
  captain_id INT NOT NULL REFERENCES captains(id) ON DELETE CASCADE,
  boat_id INT NOT NULL REFERENCES boats(id) ON DELETE CASCADE,
  PRIMARY KEY (captain_id, boat_id)
);
CREATE INDEX idx_captain_boats_boat ON captain_boats(boat_id);

-- Bookings
CREATE TABLE bookings (
  id SERIAL PRIMARY KEY,
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255) NOT NULL,
  customer_phone VARCHAR(20),
  customer_company VARCHAR(255),
  participants INT NOT NULL CHECK (participants > 0),
  boat_id INT NOT NULL REFERENCES boats(id),
  captain_id INT NOT NULL REFERENCES captains(id),
  catering BOOLEAN DEFAULT FALSE,
  notes TEXT,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',  -- 'pending', 'confirmed', 'cancelled'
  created_by INT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraints
  CHECK (participants > 0),
  CHECK (end_date > start_date),
  CONSTRAINT unique_boat_confirmed_time UNIQUE (boat_id, start_date, end_date)
    WHERE status = 'confirmed'
);

-- Indices for Performance
CREATE INDEX idx_bookings_boat_date ON bookings(boat_id, start_date, end_date) WHERE status = 'confirmed';
CREATE INDEX idx_bookings_captain_date ON bookings(captain_id, start_date, end_date) WHERE status = 'confirmed';
CREATE INDEX idx_bookings_status ON bookings(status);
CREATE INDEX idx_bookings_created_by ON bookings(created_by);
```

### 5.2 Key Constraints & Logic

- **Boat Capacity:** `participants <= boat.capacity` (checked in service layer + DB constraint)
- **Double-Booking Prevention:** UNIQUE constraint on (boat_id, start_date, end_date) for confirmed bookings
- **Captain-Boat Compatibility:** Must exist row in `captain_boats` table
- **Captain Availability:** No overlapping confirmed bookings with same captain (checked in service)
- **Time Validation:** `end_date > start_date` (DB constraint + validation)

---

## 6. Authentication & Authorization

### 6.1 JWT Token Structure

```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "staff",
  "exp": 1719673200,
  "iat": 1719669600,
  "type": "access"
}
```

**Token Types:**
- `access`: 1 hour expiry (used for API requests)
- `refresh`: 7 days expiry (stored in DB, can be revoked)

### 6.2 Role-Based Access Control (RBAC)

| Feature | Admin | Staff | Customer | Unauthenticated |
|---------|-------|-------|----------|-----------------|
| View boats | ✓ | ✓ | ✓ | ✓ |
| Create/edit/delete boats | ✓ | ✗ | ✗ | ✗ |
| View captains | ✓ | ✓ | ✓ | ✓ |
| Create/edit/delete captains | ✓ | ✗ | ✗ | ✗ |
| Assign boats to captains | ✓ | ✗ | ✗ | ✗ |
| View all bookings | ✓ | ✓ own | ✗ | ✗ |
| Create bookings | ✓ | ✓ | ✓ | ✗ |
| Edit bookings | ✓ | ✓ own | ✓ own | ✗ |
| Manage users/roles | ✓ | ✗ | ✗ | ✗ |
| Check availability | ✓ | ✓ | ✓ | ✓ |

### 6.3 Auth Flow

```
1. User Registration/Login
   → FastAPI creates JWT
   → Frontend stores in localStorage (access) + cookie (refresh, httpOnly for security)
   
2. Every Request
   → axios interceptor adds: Authorization: Bearer <token>
   
3. Token Expiry
   → If 401 response: call POST /api/auth/refresh
   → Get new access token
   → Retry original request
   
4. Logout
   → Frontend clears localStorage/cookie
   → Backend invalidates refresh token (optional)
```

---

## 7. Data Flow Example: Create Booking

```
1. Frontend (React)
   User selects time slot: Aug 15, 10:00-14:00
   Fills form: customer name, 35 participants, boat (1), captain (3), catering=true
   Clicks "Save" → POST /api/bookings

2. API Layer (auth.py)
   JWT verified → user_id=2, role='staff'
   Request body validated (Pydantic schema)
   → BookingCreate(startDate, endDate, customer, participants, boatId, captainId, ...)

3. Service Layer (booking_service.py)
   validate_booking_creation(booking_create, user_id):
     a) Check boat exists & capacity >= participants
        → boat.capacity (50) >= 35 ✓
     
     b) Check no double-booking (confirmed status only)
        SELECT * FROM bookings 
        WHERE boat_id=1 AND status='confirmed'
          AND start_date < '14:00' AND end_date > '10:00'
        → Empty set ✓
     
     c) Check captain qualified for boat
        SELECT * FROM captain_boats WHERE captain_id=3 AND boat_id=1
        → Found ✓
     
     d) Check captain available same time
        SELECT * FROM bookings 
        WHERE captain_id=3 AND status='confirmed'
          AND start_date < '14:00' AND end_date > '10:00'
        → Empty set ✓

4. Repository Layer (booking_repository.py)
   insert_booking({...}, created_by=2)
   → SQL: INSERT INTO bookings (start_date, end_date, ..., created_by, status)
          VALUES (..., 2, 'pending')
   → Returns booking_id = 42

5. Response
   HTTP 201 Created
   {
     "id": 42,
     "startDate": "2024-08-15T10:00:00",
     "endDate": "2024-08-15T14:00:00",
     "boat": { "id": 1, "name": "MS Nordhorn" },
     "captain": { "id": 3, "name": "Klaus Müller" },
     "customer": { "name": "Firma GmbH", ... },
     "participants": 35,
     "catering": true,
     "status": "pending",
     "createdAt": "2024-04-29T..."
   }

6. Frontend (React)
   React Query invalidates ['bookings']
   Calendar re-fetches → new event appears
   Toast: "Booking erstellt!"
   Modal closes
```

**Error Scenarios:**
- 400 Bad Request: invalid data, passengers > capacity, invalid boat/captain
- 409 Conflict: boat/captain already booked same time
- 401 Unauthorized: missing/invalid JWT
- 403 Forbidden: staff trying to book with captain they don't manage

---

## 8. Frontend Integration

### 8.1 API Client Setup

```typescript
// api/client.ts
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:8000/api',
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor: add JWT
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: auto-refresh on 401
apiClient.interceptors.response.use(null, async (error) => {
  if (error.response?.status === 401) {
    try {
      const refreshToken = localStorage.getItem('refresh_token');
      const { data } = await axios.post('/api/auth/refresh', {}, {
        headers: { Authorization: `Bearer ${refreshToken}` }
      });
      localStorage.setItem('access_token', data.access_token);
      error.config.headers.Authorization = `Bearer ${data.access_token}`;
      return apiClient(error.config);
    } catch (e) {
      // Redirect to login
      localStorage.clear();
      window.location.href = '/login';
    }
  }
  return Promise.reject(error);
});

export default apiClient;
```

### 8.2 State Management Pattern

```typescript
// hooks/useBookings.ts
const { data: bookings, isLoading, error } = useQuery(
  ['bookings'],
  () => apiClient.get('/bookings').then(r => r.data),
  { staleTime: 5 * 60 * 1000 } // 5 min cache
);

const createBooking = useMutation(
  (booking: BookingCreate) => apiClient.post('/bookings', booking),
  {
    onSuccess: () => {
      queryClient.invalidateQueries(['bookings']);
      toast.success('Booking erstellt!');
    },
    onError: (err: AxiosError) => {
      toast.error(err.response?.data?.detail || 'Fehler');
    }
  }
);
```

### 8.3 CORS Configuration (Backend)

```python
# main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",  # React dev server
        "http://localhost:3000",  # Alternative
        "https://vvv-nordhorn.de"  # Production domain
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["content-type"]
)
```

---

## 9. Extensibility & Future Features

The design supports these additions without major refactoring:

1. **Notifications** (email, SMS, push)
   - Add `notifications` table + service
   - Trigger on booking status changes

2. **Reports & Analytics**
   - Add new routes: `/api/reports/utilization`, `/api/reports/revenue`
   - Service layer aggregates existing data

3. **Payment Processing**
   - Add `payments` table + payment service
   - Integrate Stripe/PayPal at booking creation

4. **Calendar Sync** (iCal, Google Calendar)
   - Export bookings as iCal format
   - Add sync service (no DB changes needed)

5. **Availability Rules** (blackout dates, seasonal pricing)
   - Add `availability_rules` table + service
   - Check rules in booking validation

6. **Multi-language** (German/English/Dutch)
   - i18n in frontend (no backend changes)
   - DB strings already German (can localize)

7. **Microservices** (later)
   - Domains (booking, boats, captains) can become separate services
   - Use event-driven architecture (Kafka/RabbitMQ)

---

## 10. Testing Strategy

### Unit Tests (pytest)
- Service layer: booking_service.validate_booking(), boat_service.check_availability()
- Repository layer: mocked DB queries
- Schemas: Pydantic validation

### Integration Tests
- API endpoints with real test database
- Auth flow: register → login → request with JWT

### Frontend Tests (Vitest + React Testing Library)
- Components: BookingCalendar, BookingModal, BoatCard
- Hooks: useBookings, useCreateBooking
- API client: interceptors, error handling

---

## 11. Deployment Plan

**Development:**
- Backend: `python -m uvicorn app.main:app --reload`
- Frontend: `npm run dev`
- Database: Docker `docker-compose up`

**Production:**
- Backend: Docker + Gunicorn/uvicorn on VPS
- Frontend: npm build → static hosting (Vercel/Netlify or nginx)
- Database: Managed PostgreSQL (AWS RDS, Heroku, etc) OR self-hosted with backups

---

## 12. Success Criteria

✅ MVP is production-ready when:
1. All CRUD operations work (boats, captains, bookings, users)
2. Double-booking prevention prevents conflicts
3. Captain-boat compatibility enforced
4. JWT auth with role-based access works
5. Calendar UI shows bookings from PostgreSQL
6. Tests cover happy path + error scenarios
7. No security vulnerabilities (SQL injection, XSS, CSRF)
8. Response times < 200ms for typical queries
9. Error messages clear & actionable
10. Ready to extend (modularity validated)

---

## 13. Risks & Mitigation

| Risk | Impact | Mitigation |
|------|--------|-----------|
| DB design locks in features | Medium | Review schema with user before migration; Alembic for easy schema changes |
| Performance (many bookings) | Medium | Indices on date columns; pagination on GET /bookings |
| Time zone issues | Medium | Store all times as UTC in DB; frontend converts to local |
| Concurrent booking creation | Low | UNIQUE constraint on DB; application-level check first |
| Token expiry UX | Low | Auto-refresh via interceptor; user stays logged in |

---

**Next Step:** Implementation planning (Phase 7 - invoke writing-plans skill)
