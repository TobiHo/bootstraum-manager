# Bootstraum Manager – Feature Roadmap

*Based on VVV Nordhorn boat tour offerings analysis*

## Current Status
✅ Core authentication & CRUD operations  
✅ Calendar-based booking management  
✅ Form validation & error handling  
✅ Role-based access control (Admin/Staff/Customer)  
✅ Dark/Light theme with corporate blue color scheme  

---

## Phase 3: Advanced Booking Features

### 3.1 Tour Type Management
**Problem**: All bookings treated uniformly; VVV offers 6+ tour types with different pricing, duration, capacity.

**Features**:
- Tour type templates (Roundtrip, Punch Cruise, Sundowner, Ranger, Cliquentour, Charter)
- Each type has: name, default duration, base pricing, capacity constraints, available seasons
- Admin can create/edit tour types
- Dropdown selector in booking modal
- Different validation rules per tour type (e.g., Ranger tours require 2+ hours)

**Files to create/modify**:
- `src/pages/TourTypes.tsx` (new)
- `src/components/TourTypeModal.tsx` (new)
- `src/lib/api.ts` – add tour type methods
- `bootstrap-manager-backend/app/models/db.py` – add TourType model
- `bootstrap-manager-backend/app/api/routes/tours.py` (new)

---

### 3.2 Dynamic Pricing Engine
**Problem**: Pricing is fixed per boat/hour; VVV uses tiered pricing by group size, season, tour type.

**Features**:
- Price calculation based on: tour type, group size, season (off/regular/peak), boat type, guide option
- Pricing rules table (e.g., "Punch Cruise: €24 adult, €12 child")
- Group discounts (e.g., "€26/person if 12+ guests, else €330 flat")
- Dynamic pricing display in booking form (shows calculated total cost)
- Price locked on confirmation (can't change retroactively)
- Revenue reports by tour type/week/boat

**Pricing data**:
```
Roundtrip: €11.50 (adult) / €6 (child)
Punch/Mulled Wine: €24 (adult) / €12 (child) | Group: €330–€430/hour
Sundowner: €11.50 (adult, €10 w/GN-Card) / €6 (child)
Charter: €160/h (Vechtestromer) | €240/h (others) + €60/h guide option
Ranger: €200 (children ≤14) | Adults on request
Cliquentour: €26/person (12+ min) or €330 flat
```

**Files to create/modify**:
- `src/components/calendar/BookingModal.tsx` – show calculated price
- `src/pages/Pricing.tsx` (new, admin-only)
- `src/components/PricingRuleEditor.tsx` (new)
- `bootstrap-manager-backend/app/services/pricing_service.py` (new)
- `bootstrap-manager-backend/app/models/db.py` – add PricingRule model

---

### 3.3 Scheduled/Public Tours
**Problem**: Currently all bookings are private charters; VVV runs scheduled public tours.

**Features**:
- Admin creates recurring public tour schedules (e.g., "Mon-Fri 14:00 Roundtrip")
- Calendar shows scheduled tours differently (locked, public, auto-confirm)
- Booking modal shows available seats (e.g., "8/14 seats available")
- Customers register for scheduled tours (reduces admin work)
- Separate view: "Scheduled Tours" with seat availability

**Implementation**:
- Mark tour as "scheduled" vs. "charter"
- Auto-generate recurring instances
- Seat inventory management
- Waitlist if full

**Files to create/modify**:
- `src/pages/ScheduledTours.tsx` (new)
- `src/components/ScheduleTourModal.tsx` (new)
- `bootstrap-manager-backend/app/models/db.py` – add ScheduledTour model
- `bootstrap-manager-backend/app/api/routes/scheduled_tours.py` (new)

---

### 3.4 Guide/Staff Scheduling
**Problem**: Guides are currently just "captains"; need separate guide management.

**Features**:
- Distinguish captains (boat operators) from guides (educational/tour leaders)
- Guide availability calendar
- Assign guides to specific tours (optional, adds €60/hour to price)
- Guide skill tags (history expert, nature guide, children's specialist)
- Conflict detection (guide can't do 2 tours simultaneously)

**Files to create/modify**:
- `src/pages/Guides.tsx` (new, if separate from Captains)
- Modify `src/pages/Captains.tsx` – add guide role option
- `bootstrap-manager-backend/app/models/db.py` – add Guide/guide_role column

---

### 3.5 Seasonal Features & Special Events
**Problem**: Punch cruises (Nov-Dec), Sundowner (summer) not tracked; no season/theme management.

**Features**:
- Define active seasons (date ranges)
- Tour types available only in certain seasons
- Special event calendars (Punch Cruise season starts Nov 1)
- Seasonal pricing overrides
- Notification when entering/leaving season

**Implementation**:
- Add `available_from` / `available_to` dates to TourType
- Add `season_tag` (winter, summer, autumn, spring)
- Filter tour options by current date

---

### 3.6 Discount & Card System
**Problem**: GN-Card discounts and group-size tiers not managed.

**Features**:
- Discount types: fixed % off, fixed € off, card-based (GN-Card)
- Apply discounts at booking time
- Track which customers have discounts
- Reporting: total discounts given, revenue impact

**Files to create/modify**:
- `src/components/calendar/BookingModal.tsx` – add discount selector
- `bootstrap-manager-backend/app/models/db.py` – add Discount/DiscountCode models

---

### 3.7 Revenue & Reporting Dashboard
**Problem**: No visibility into bookings, revenue, occupancy.

**Features**:
- Admin dashboard: "Reports" tab
- Metrics:
  - Total revenue (period/tour type/boat)
  - Occupancy rate by boat (% capacity filled)
  - Booking count by status (confirmed/pending/cancelled)
  - Revenue forecast (future bookings)
  - Top tour types, peak days/times
  - Discount/refund impact
- Exportable reports (CSV)
- Graphs: revenue over time, occupancy trends

**Files to create/modify**:
- `src/pages/Reports.tsx` (new, admin-only)
- `src/components/ReportCharts.tsx` (new)
- `bootstrap-manager-backend/app/services/reporting_service.py` (new)

---

## Phase 4: Customer Portal & Communication

### 4.1 Customer Self-Service Portal
**Problem**: All bookings created by staff; customers can't check availability or reserve.

**Features**:
- Public-facing tour search page (no login required)
- Filter by: date, tour type, duration, capacity, price
- Seat availability display
- Book as "guest" (email-based) or registered user
- Confirmation email with booking details/QR code
- Invoice/receipt generation

---

### 4.2 Automated Confirmations & Reminders
**Problem**: Manual email management; no booking reminders.

**Features**:
- Auto-send confirmation email on booking (with cost, boat name, captains)
- Reminder emails: 1 week before, 1 day before, 2 hours before
- SMS notifications (optional, paid service)
- Cancellation/refund emails

---

### 4.3 Feedback & Ratings
**Problem**: No post-tour feedback collection.

**Features**:
- Post-tour survey link (email or QR code)
- Star ratings + comment
- Display top-rated tours/captains
- Issue tracking (customer complaints)

---

## Phase 5: Business Intelligence & Integrations

### 5.1 Payment Processing
**Problem**: No payment integration; everything manual.

**Features**:
- Stripe/PayPal integration for deposit/full payment
- Invoice generation & delivery
- Automated payment reminders
- Refund processing

---

### 5.2 Calendar Sync
**Problem**: No integration with Google/Outlook calendars.

**Features**:
- Export iCal feed for captains/guides
- Two-way sync: external calendar changes → app
- Sync to Nextcloud (for privacy)

---

### 5.3 CRM Integration
**Problem**: Customer contact list isolated; no history tracking.

**Features**:
- Customer profiles with booking history
- Notes/tags per customer (VIP, repeat, high-maintenance)
- Contact history (calls, emails)
- Export customer list (email, phone for marketing)

---

### 5.4 Analytics & Forecasting
**Problem**: Ad-hoc reporting; no trend analysis.

**Features**:
- Booking trends (seasonal patterns, day-of-week bias)
- Demand forecasting (predict busy periods)
- Churn analysis (customers who don't rebook)
- Marketing ROI tracking (which channels bring bookings)

---

## Quick Wins (MVP++, 1-2 days each)

1. **Past Booking Warning** ✅ *Done*
   - Show warning toast when creating booking in the past (still allows)

2. **Tour Type Dropdown** (0.5 day)
   - Add simple "Tour Type" field to booking modal (no full CRUD yet)
   - Choices: Roundtrip, Punch Cruise, Sundowner, Ranger, Cliquentour, Charter

3. **Pricing Display** (1 day)
   - Show calculated tour cost in booking confirmation
   - Hard-code pricing for initial tour types (no admin UI yet)

4. **Occupancy Indicator** (1 day)
   - Show "Seats: 8/14" in calendar event tooltip
   - In booking modal, show selected boat capacity vs. participants

5. **Basic Revenue Report** (1 day)
   - Single "Revenue This Month" widget on dashboard
   - Sum of all confirmed bookings' calculated prices
   - Break down by tour type (pie chart)

---

## Technical Debt & Cleanup

- [ ] Move magic pricing numbers to database/config
- [ ] Extract booking calculation logic to service layer
- [ ] Add integration tests for pricing engine
- [ ] Standardize API error responses
- [ ] Add rate limiting to auth endpoints
- [ ] Document API in OpenAPI/Swagger

---

## Success Metrics

- **Operational**: Reduce booking time from 15 min → 5 min (automation)
- **Revenue**: Increase bookings by enabling self-service & seasonal tours
- **Customer**: Improve satisfaction via confirmations, reminders, feedback
- **Data**: Enable data-driven decisions (peak periods, popular tours, pricing optimization)

