# AGENT_PLAN - Boat Tour Management System Phase 2

> **Für Agenten:** Dies ist ein strukturierter Ausführungsplan für die Implementierung von Phase 2. Folge den Phasen sequenziell. Siehe TODO_LISTS.md für detaillierte Task-Listen.

**Stand:** 2026-04-30  
**Gesamtaufwand:** ~310 Stunden | ~8 Wochen (1 Dev Vollzeit)  
**Arbeitsmodus:** Subagent-Driven Development (frischer Agent pro Phase)

---

## 🎯 MASTER PLAN - Kritische Pfad

```
Phase 2A: KERN-TICKETING (4 Wochen)
├── Woche 1: Varianten-System (Task 1: 1.1-1.6)
├── Woche 2: Zahlungs-Modell (Task 3: 3.1-3.3)
├── Woche 3: Online-Shop & Schalter (Task 2: 2.1-2.8)
└── Woche 4: Integration & Tests (Task 2: 2.9-2.12, Task 3: 3.4-3.10)

Phase 2B: SKIPPER-APP (2 Wochen)
├── Woche 5: App-Layout & Fahrten-Übersicht (Task 4: 4.1-4.3)
└── Woche 6: Check-in, Ticketing, Monitor (Task 4: 4.4-4.14)

Phase 2C: PLANUNG & AUTO-SAVE (2 Wochen)
├── Woche 7: Dienstplan-System (Task 5: 5.1-5.6)
└── Woche 8: Skipper-Inbox & Auto-Save (Task 5: 5.7-5.12, Task 6: 6.1-6.6)

Phase 2D: STATISTIKEN (1 Woche)
└── Woche 9-10: Reporting, Charts, Export (Task 7: 7.1-7.10)

Phase 3: EC-PAYMENT & PRODUCTION (später)
```

---

## 📋 PHASE 2A: KERN-TICKETING (Wochen 1-4)

**Ziel:** Online-Shop, Schalter-Modus, und Zahlungs-Tracking funktionieren.  
**Abhängigkeiten:** Keine (auf MVP aufbauend)  
**Go/No-Go Gate:** Kunden können Tickets online UND am Schalter kaufen.

### WOCHE 1: VARIANTEN-SYSTEM

**Sprint Goal:** Boote können verschiedene Buchungs-Varianten haben (z.B. Standard, Premium).

#### Subagent Dispatch #1: Varianten Backend (Task 1.1 + 1.2)

**Input an Agent:**
```
Task: Implement Booking Variants Backend
Acceptance Criteria:
  ✓ BookingVariant model with fields: name, description, price, boat_type
  ✓ Booking model extended with variant_id FK
  ✓ VariantRepository with CRUD methods
  ✓ BookingService.getAvailableVariants(boat_id, date)
  ✓ All methods tested with unit + integration tests
  ✓ Database migration created + seeded with 2-3 test variants
  ✓ Constraints: variant price > 0, unique name per boat type

Files to Create/Modify:
  - Create: app/models/db.py (extend Booking, add BookingVariant)
  - Create: app/repositories/variant_repository.py
  - Modify: app/services/booking_service.py (add getAvailableVariants)
  - Create: tests/test_variants.py
  - Create: alembic migrations/

Time Budget: 8 hours
Done Criteria: All tests passing, 2+ variants in seed data
```

**After completion:**
- [ ] Verify: `BookingVariant` table exists with seed data
- [ ] Verify: `Booking.variant_id` foreign key exists
- [ ] Verify: Tests passing (run: `pytest tests/test_variants.py -v`)
- [ ] Verify: Seed includes: Standard (€10), Premium (€15), Family (€12)

---

#### Subagent Dispatch #2: Varianten API (Task 1.3)

**Input an Agent:**
```
Task: Implement Variants REST API
Depends On: Task 1.1 + 1.2 (Variants Backend)
Acceptance Criteria:
  ✓ GET /api/variants - list all variants
  ✓ GET /api/variants/{id} - get single variant
  ✓ GET /api/boats/{boat_id}/variants - variants for specific boat
  ✓ POST /api/variants (Admin only) - create new variant
  ✓ PUT /api/variants/{id} (Admin only) - update variant
  ✓ DELETE /api/variants/{id} (Admin only) - delete variant
  ✓ All endpoints tested with auth validation
  ✓ No auth bypass possible
  ✓ Invalid IDs return 404

Files to Create/Modify:
  - Create: app/api/routes/variants.py
  - Modify: app/main.py (add variants router)
  - Create: tests/test_variants_api.py

Time Budget: 6 hours
Done Criteria: All API tests passing, Swagger docs show 5 new endpoints
```

**After completion:**
- [ ] Verify: All 6 endpoints responding
- [ ] Verify: Non-admins cannot POST/PUT/DELETE
- [ ] Verify: Tests passing (run: `pytest tests/test_variants_api.py -v`)
- [ ] Test: `curl http://localhost:8000/api/variants` returns 3+ variants

---

#### Subagent Dispatch #3: Booking Service Extension (Task 1.4)

**Input an Agent:**
```
Task: Extend Booking Service for Variants
Depends On: Task 1.1, 1.2, 1.3
Acceptance Criteria:
  ✓ BookingService.createBooking() accepts variant_id parameter
  ✓ Validation: variant_id must be valid
  ✓ Validation: variant must match boat type
  ✓ Validation: price comes from variant (not user input)
  ✓ Validation: capacity check still works with variants
  ✓ All new validations in unit tests
  ✓ Double-booking prevention still works

Files to Create/Modify:
  - Modify: app/services/booking_service.py (extend createBooking)
  - Modify: app/schemas.py (BookingCreate needs variant_id)
  - Modify: tests/test_bookings.py (add variant tests)

Time Budget: 5 hours
Done Criteria: All booking tests pass, variant validation tested
```

**After completion:**
- [ ] Verify: Booking can be created with variant_id
- [ ] Verify: Invalid variant_id is rejected
- [ ] Verify: Price correctly taken from variant, not request body
- [ ] Verify: Tests passing

---

#### Subagent Dispatch #4: Frontend Variant Selector (Task 1.5 + 1.6)

**Input an Agent:**
```
Task: Implement Variant Selection in Frontend
Depends On: All Task 1 backend + API
Acceptance Criteria:
  ✓ Booking form includes variant selector dropdown
  ✓ Dropdown loads variants via API (getAvailableVariants)
  ✓ Variant selector shows: Name, Price, Description
  ✓ Variant selector disabled until boat selected
  ✓ Default variant selected if only 1 available
  ✓ Admin can manage variants via /admin/variants page
  ✓ CRUD forms for Create/Edit/Delete variant
  ✓ Confirmation dialog before delete
  ✓ Error handling: Show message if no variants available
  ✓ Tests for variant logic

Files to Create/Modify:
  - Modify: src/pages/BookingForm.tsx (add variant selector)
  - Create: src/pages/admin/VariantManagement.tsx
  - Modify: src/api/client.ts (add getVariants, getBoatVariants)
  - Create: src/hooks/useVariants.ts
  - Create: tests/BookingForm.test.tsx (variant tests)

Time Budget: 8 hours
Done Criteria: Variant dropdown appears and works, admin can CRUD variants
```

**After completion:**
- [ ] Verify: Booking form shows variant dropdown
- [ ] Verify: Variants load from API
- [ ] Verify: Price updates when variant changes
- [ ] Verify: Admin page at /admin/variants loads
- [ ] Verify: Can create new variant in admin panel

---

**WEEK 1 GATE:** Before proceeding to Week 2:
- [ ] All Task 1.1-1.6 complete
- [ ] Tests passing: `pytest tests/test_variants*.py -v`
- [ ] Frontend variant selector working
- [ ] Admin can CRUD variants
- [ ] New Booking form accepts variant_id

---

### WOCHE 2: ZAHLUNGS-MODELL & ONLINE-SHOP VORBEREITUNG

**Sprint Goal:** Zahlungs-Tracking ist implementiert. Online-Shop Frontend ist bereit.

#### Subagent Dispatch #5: Payments Backend (Task 3.1 + 3.2)

**Input an Agent:**
```
Task: Implement Payments Data Model & Service
Acceptance Criteria:
  ✓ Payment model: id, booking_id, amount, method, status, timestamp
  ✓ PaymentStatus enum: PENDING, COMPLETED, FAILED, REFUNDED
  ✓ PaymentMethod enum: CASH, EC_TERMINAL, ONLINE_STRIPE, ONLINE_PAYPAL
  ✓ PaymentRepository: full CRUD
  ✓ PaymentService.createPayment(booking_id, amount, method)
  ✓ PaymentService.confirmPayment(payment_id)
  ✓ PaymentService.refund(payment_id, reason)
  ✓ PaymentService.getPaymentsByBooking(booking_id)
  ✓ Validation: amount > 0
  ✓ Validation: booking_id must exist
  ✓ Foreign key: booking_id (cascade delete? No - keep payment history)
  ✓ All methods tested

Files to Create/Modify:
  - Modify: app/models/db.py (add Payment, PaymentStatus, PaymentMethod)
  - Create: app/repositories/payment_repository.py
  - Create: app/services/payment_service.py
  - Create: alembic/versions/payment_migration.py
  - Create: tests/test_payments.py

Time Budget: 8 hours
Done Criteria: Payment model in DB, 12+ unit tests passing
```

**After completion:**
- [ ] Verify: `payments` table exists
- [ ] Verify: Payment can be created
- [ ] Verify: Amount validation works
- [ ] Verify: Tests passing

---

#### Subagent Dispatch #6: Payments API (Task 3.3)

**Input an Agent:**
```
Task: Implement Payments REST API
Depends On: Task 3.1 + 3.2 (Payments Backend)
Acceptance Criteria:
  ✓ POST /api/payments - create payment
  ✓ GET /api/payments/{payment_id} - get payment status
  ✓ POST /api/payments/{payment_id}/confirm - mark paid
  ✓ POST /api/payments/{payment_id}/refund - refund payment
  ✓ GET /api/bookings/{booking_id}/payment - get payment for booking
  ✓ All endpoints require auth
  ✓ Only admin/staff can create payments
  ✓ Customer can only see own payments
  ✓ Tests for all endpoints + auth

Files to Create/Modify:
  - Create: app/api/routes/payments.py
  - Modify: app/main.py (add payments router)
  - Create: tests/test_payments_api.py

Time Budget: 6 hours
Done Criteria: All payment endpoints responding, tests passing
```

**After completion:**
- [ ] Verify: Endpoints responding
- [ ] Verify: Auth working (no bypass)
- [ ] Verify: Tests passing

---

#### Subagent Dispatch #7: Online-Shop Frontend Scaffold (Task 2.2 partial)

**Input an Agent:**
```
Task: Build Online Shop Frontend Structure
Depends On: Task 1 (Variants), Task 3 (Payments)
Acceptance Criteria:
  ✓ New route: /shop
  ✓ Boot selection page (calendar view, shows available dates)
  ✓ Booking details form (date, time, boat, variant selector)
  ✓ Guest data form (name, email, number of guests)
  ✓ Price summary (pulls from variant)
  ✓ "Go to Checkout" button (not functional yet - Week 3)
  ✓ Confirmation page placeholder
  ✓ Responsive design (mobile-first)
  ✓ No form submission yet - just wireframe

Files to Create/Modify:
  - Create: src/pages/Shop.tsx
  - Create: src/pages/ShopCheckout.tsx
  - Create: src/pages/ShopConfirmation.tsx
  - Create: src/components/BoatSelector.tsx
  - Create: src/components/VariantSelector.tsx (reuse from admin)
  - Create: src/components/GuestForm.tsx
  - Create: src/hooks/useShop.ts
  - Modify: src/App.tsx (add /shop route)

Time Budget: 10 hours
Done Criteria: /shop page loads, all forms visible, responsive
```

**After completion:**
- [ ] Verify: `/shop` route accessible
- [ ] Verify: Forms display correctly on mobile
- [ ] Verify: Variant dropdown works
- [ ] Verify: Price updates when variant changes

---

**WEEK 2 GATE:** Before proceeding to Week 3:
- [ ] Task 3.1-3.3 complete (Payments backend + API)
- [ ] Task 2.2 partial (Shop UI structure)
- [ ] All tests passing
- [ ] Shop frontend structure visible

---

### WOCHE 3: ONLINE-SHOP & SCHALTER-MODUS

**Sprint Goal:** Kunden können online Tickets kaufen. Staff können Tickets am Schalter verkaufen.

#### Subagent Dispatch #8: Online Shop Completion (Task 2.2 + 2.5 + 2.6)

**Input an Agent:**
```
Task: Complete Online Shop - Booking & Capacity
Depends On: Shop frontend structure from Week 2
Acceptance Criteria:
  ✓ Shop booking form submits to POST /api/bookings/online
  ✓ New endpoint POST /api/bookings/online:
    - accepts: boat_id, date, time, variant_id, guest_name, guest_email, guest_count
    - returns: booking_id, confirmation_url, qr_code
    - creates Payment with status PENDING
  ✓ GET /api/boats/{boat_id}/availability?date=YYYY-MM-DD
    - returns: available_seats, total_capacity, booked
    - caches for 1 minute
  ✓ Shop shows "X seats remaining" (live)
  ✓ Booking blocked if 0 seats remaining
  ✓ Confirmation page shows: Booking details, QR code, ticket link
  ✓ Email not sent yet (Phase 3: add email service)
  ✓ Tests for all flows

Files to Create/Modify:
  - Modify: app/api/routes/bookings.py (add POST /online endpoint)
  - Create: app/api/routes/availability.py
  - Modify: src/pages/ShopCheckout.tsx (hook up form submission)
  - Modify: src/pages/ShopConfirmation.tsx (show real data)
  - Modify: src/components/BoatSelector.tsx (show availability)
  - Create: tests/test_shop_booking.py
  - Create: tests/Shop.test.tsx

Time Budget: 10 hours
Done Criteria: Full shop flow works: select → checkout → confirmation
```

**After completion:**
- [ ] Verify: Can complete booking on /shop
- [ ] Verify: Payment created with PENDING status
- [ ] Verify: Confirmation page shows QR code
- [ ] Verify: Availability API returns correct counts
- [ ] Verify: Tests passing

---

#### Subagent Dispatch #9: QR Code Generation (Task 2.7)

**Input an Agent:**
```
Task: Implement QR Code Generation for Tickets
Depends On: Shop completion
Acceptance Criteria:
  ✓ Ticket model: qr_code field (stores as image URL or base64)
  ✓ When Payment.status = COMPLETED, generate QR code
  ✓ QR code encodes: booking_id + ticket_id
  ✓ QR code image available at: /api/tickets/{ticket_id}/qr
  ✓ QR code printable (PDF or PNG)
  ✓ Shop confirmation page displays QR code
  ✓ Tests for QR generation

Libraries: python-qrcode
Files to Create/Modify:
  - Modify: app/models/db.py (add qr_code field to Ticket)
  - Create: app/services/qr_service.py
  - Modify: app/services/payment_service.py (generate QR on confirm)
  - Create: app/api/routes/tickets.py (GET /qr endpoint)
  - Modify: src/pages/ShopConfirmation.tsx (display QR)
  - Create: tests/test_qr.py

Time Budget: 5 hours
Done Criteria: QR code generated and displayed on confirmation page
```

**After completion:**
- [ ] Verify: QR code visible on confirmation page
- [ ] Verify: QR code can be printed
- [ ] Verify: QR code encodes correct booking_id

---

#### Subagent Dispatch #10: Schalter-Modus UI (Task 2.3)

**Input an Agent:**
```
Task: Implement Counter Mode for Staff Ticketing
Acceptance Criteria:
  ✓ New route: /counter-mode (Staff only)
  ✓ Fast booking interface (minimal form):
    - Boot dropdown
    - Datum (today's date default)
    - Variante dropdown
    - Gästezahl (input)
    - Gastname (input)
    - Payment method: Cash / EC / Online
  ✓ "Speichern" button: creates booking immediately
  ✓ Confirmation shows: Ticket-ID, QR code (preview)
  ✓ Print button: prints QR code
  ✓ "Neue Buchung" button: clears form
  ✓ Validation: all fields required
  ✓ Responsive design (touch-friendly)
  ✓ Tests

Files to Create/Modify:
  - Create: src/pages/CounterMode.tsx
  - Create: src/components/FastBookingForm.tsx
  - Create: src/hooks/useCounterMode.ts
  - Modify: src/api/client.ts (POST /bookings/counter endpoint)
  - Create: app/api/routes/bookings.py (POST /counter endpoint)
  - Modify: src/App.tsx (add /counter-mode route, protect with role)
  - Create: tests/CounterMode.test.tsx

Time Budget: 8 hours
Done Criteria: Staff can book tickets via /counter-mode
```

**After completion:**
- [ ] Verify: /counter-mode only accessible to Staff role
- [ ] Verify: Can complete booking in <30 seconds
- [ ] Verify: QR code generated and printable
- [ ] Verify: Payment method saved

---

#### Subagent Dispatch #11: Payment Status UI (Task 2.8 + 2.9)

**Input an Agent:**
```
Task: Payment Status Tracking & Admin Dashboard
Depends On: Task 3 (Payments) + Task 2 (Shop + Counter)
Acceptance Criteria:
  ✓ Admin sees payment status per booking:
    - Badge color: green=PAID, yellow=PENDING, red=FAILED
  ✓ Admin can manually mark booking as PAID (dropdown)
  ✓ Admin can refund booking (button + confirmation)
  ✓ Audit log shows who changed status when
  ✓ Payment list shows:
    - Booking ID, Guest name, Amount, Method, Status, Date
  ✓ Filter by status (PAID, PENDING, FAILED)
  ✓ Validations:
    - Cannot refund non-PAID payments
    - Cannot double-mark as paid
  ✓ Tests for all scenarios

Files to Create/Modify:
  - Modify: src/pages/BookingManagement.tsx (add payment columns)
  - Create: src/pages/PaymentDashboard.tsx
  - Create: src/components/PaymentStatusBadge.tsx
  - Modify: src/hooks/useBookings.ts (add payment data)
  - Modify: app/api/routes/payments.py (add list endpoint)
  - Create: tests/PaymentDashboard.test.tsx

Time Budget: 8 hours
Done Criteria: Admin can see and manage payment statuses
```

**After completion:**
- [ ] Verify: Payment status displayed correctly
- [ ] Verify: Admin can change status
- [ ] Verify: Refund button works
- [ ] Verify: Audit log updated

---

**WEEK 3 GATE:** Before proceeding to Week 4:
- [ ] Online shop fully functional (select → confirm)
- [ ] Counter-mode fully functional
- [ ] QR codes generated and working
- [ ] Payment status tracking visible
- [ ] All tests passing

---

### WOCHE 4: INTEGRATION, FEHLERBEHANDLUNG & POLISH

**Sprint Goal:** System ist robust und production-ready für Phase 2A go-live.

#### Subagent Dispatch #12: Error Handling & Validation (Task 2.9 + 2.11 + 3.8)

**Input an Agent:**
```
Task: Robust Error Handling & Race Condition Prevention
Depends On: All previous tasks in Phase 2A
Acceptance Criteria:
  ✓ Race condition: prevent double-booking via DB constraint
    - UNIQUE(boat_id, date, time) + application-level check
  ✓ Capacity validation at 2 levels:
    - Application service (fast)
    - Database constraint (authoritative)
  ✓ Payment validation:
    - Amount must be > 0
    - Cannot double-charge same booking
    - Idempotent: same payment twice = idempotent, not error
  ✓ User-friendly error messages:
    - "Boot ist bereits zu diesem Zeitpunkt gebucht"
    - "Nicht genug Plätze verfügbar"
    - "Zahlungsfehlgeschlagen - bitte versuchen Sie es später"
  ✓ Timeout handling: API calls must complete in <30s
  ✓ Network resilience:
    - Retry logic for transient failures
    - Fallback to PENDING status if unsure
  ✓ Tests for all error scenarios

Files to Create/Modify:
  - Modify: app/exceptions.py (add custom exceptions)
  - Modify: app/api/routes/*.py (add try-catch + logging)
  - Modify: app/services/*.py (add validation checks)
  - Modify: src/api/client.ts (add error handling)
  - Modify: src/pages/*.tsx (show error messages)
  - Create: tests/test_error_handling.py
  - Create: tests/ErrorHandling.test.tsx

Time Budget: 10 hours
Done Criteria: All error scenarios handled gracefully
```

**After completion:**
- [ ] Verify: Double-booking prevented
- [ ] Verify: Capacity enforced
- [ ] Verify: Error messages user-friendly
- [ ] Verify: Tests passing

---

#### Subagent Dispatch #13: Documentation & Admin Guide (Task 2.12 + 3.10)

**Input an Agent:**
```
Task: Write Documentation for Phase 2A
Acceptance Criteria:
  ✓ Admin Guide:
    - How to manage variants
    - How to use counter-mode
    - How to track payments
    - How to refund bookings
    - Troubleshooting common issues
  ✓ User Guide (for customers):
    - How to book online
    - How to use QR code
    - What happens after booking (pending state)
  ✓ API Documentation:
    - New endpoints: /bookings/online, /boats/{id}/availability, /payments/*
    - Request/response examples
    - Error codes
  ✓ Ticket Workflow documented:
    - Online → Shop → Checkout → Confirmation
    - Counter → Fast Form → Confirmation
    - Payment states: PENDING → COMPLETED
  ✓ All docs in markdown, in /docs folder

Files to Create/Modify:
  - Create: docs/PHASE_2A_ADMIN_GUIDE.md
  - Create: docs/PHASE_2A_USER_GUIDE.md
  - Create: docs/PHASE_2A_API_DOCS.md
  - Modify: docs/FEATURE_COMPARISON.md (mark Phase 2A tasks as DONE)

Time Budget: 5 hours
Done Criteria: Docs complete and reviewed
```

**After completion:**
- [ ] Verify: Admin guide covers all features
- [ ] Verify: API docs complete
- [ ] Verify: FEATURE_COMPARISON.md updated

---

#### Subagent Dispatch #14: Testing Suite Completion (Task 2.10, 3.9, 3.10)

**Input an Agent:**
```
Task: Complete Testing Suite for Phase 2A
Acceptance Criteria:
  ✓ Test coverage > 80% for:
    - Services (payment, booking, variant)
    - API routes (payments, bookings, variants)
  ✓ Integration tests:
    - Full shop booking flow
    - Full counter booking flow
    - Full payment flow (create → confirm → refund)
  ✓ End-to-end tests (optional, Selenium/Cypress):
    - User completes shop booking
    - Admin completes counter booking
    - Admin manages payments
  ✓ Load tests (optional):
    - 100 concurrent bookings (should not fail)
  ✓ All tests passing: pytest + jest
  ✓ CI/CD ready (tests run on push)

Files to Create/Modify:
  - Create: tests/integration/test_shop_flow.py
  - Create: tests/integration/test_counter_flow.py
  - Create: tests/integration/test_payment_flow.py
  - Modify: pytest.ini (coverage settings)
  - Modify: .github/workflows/test.yml (or similar CI)

Time Budget: 10 hours
Done Criteria: Test suite comprehensive, all passing
```

**After completion:**
- [ ] Verify: `pytest` reports >80% coverage
- [ ] Verify: `npm test` all pass
- [ ] Verify: CI pipeline green

---

#### Subagent Dispatch #15: Phase 2A Review & Commit (Final)

**Input an Agent:**
```
Task: Review Phase 2A Completion & Prepare for Phase 2B
Acceptance Criteria:
  ✓ All tasks 1-3 complete (Variants, Ticketing, Payments)
  ✓ All tests passing
  ✓ Documentation complete
  ✓ No known bugs or TODOs in code (except Phase 2B TODO comments)
  ✓ Code review done (no merge without review)
  ✓ Docker image builds successfully
  ✓ Database migrations tested on clean DB
  ✓ Performance acceptable (API <500ms)
  ✓ Security review done:
    - Auth checks on all endpoints
    - No SQL injection
    - CORS configured correctly
  ✓ Commit message:
    feat(phase2a): implement variants, ticketing, payments
    
    - Tour variants system (online, standard, premium, family)
    - Online shop for customer ticket purchase
    - Counter mode for staff point-of-sale
    - Payment tracking (cash, EC, online placeholders)
    - QR code generation for tickets
    - Automatic capacity checks
    - Comprehensive test suite (>80% coverage)
    
    Closes #phase-2a (or similar tracking)

Files to Review:
  - All app/models/db.py changes
  - All app/services/* files
  - All app/api/routes/* files
  - All src/pages/* and src/components/* in Shop area
  - tests/* (all)

Time Budget: 5 hours (review only, not implementation)
Done Criteria: Ready to push + create PR + merge to main
```

**After completion:**
- [ ] Verify: Code review approved
- [ ] Verify: All tests passing
- [ ] Verify: Docker build successful
- [ ] Verify: Commit message clear
- [ ] Ready: Create PR or merge to main

---

**PHASE 2A GATE:** Before starting Phase 2B:
- [ ] All 15 subagent dispatches complete
- [ ] All tests passing (pytest + jest)
- [ ] Code review approved
- [ ] Docker image builds
- [ ] Documentation complete
- [ ] No blocking issues
- [ ] Feature comparison updated

---

## 📋 PHASE 2B: SKIPPER-APP (Wochen 5-6)

**Ziel:** Bootsführer können Gäste verwalten, Tickets scannen, Kapazität live sehen.  
**Abhängigkeiten:** Phase 2A complete  
**Go/No-Go Gate:** Skipper kann auf dem Boot Gäste checken, Tickets scannen.

### WOCHE 5: APP-LAYOUT & FAHRTEN-ÜBERSICHT

#### Subagent Dispatch #16: Skipper App Infrastructure (Task 4.1 + 4.2)

**Input an Agent:**
```
Task: Build Skipper App Layout & Today's Tours
Depends On: Phase 2A complete
Acceptance Criteria:
  ✓ New route: /skipper-app (Skipper role only)
  ✓ Mobile-responsive layout
    - Header: Boot name, Uhrzeit, "Zugeordnet: [skipper name]"
    - Main area: List of tours today (Zeit, Boot, Gästezahl)
    - Touch-friendly buttons (min 44x44px)
    - No horizontal scroll
  ✓ Tour list shows:
    - Start time
    - Boot name + capacity
    - Expected guest count
    - Status badge: "Vorbereitung" / "Im Einsatz" / "Beendet"
  ✓ Click on tour → details page
  ✓ Auto-refresh every 30 seconds
  ✓ Offline indicator (preparation for Phase 3)
  ✓ Logout button top-right
  ✓ Tests

Files to Create/Modify:
  - Create: src/pages/SkipperApp.tsx
  - Create: src/pages/SkipperTourDetails.tsx
  - Create: src/components/TourCard.tsx
  - Create: src/hooks/useSkipperTours.ts
  - Modify: src/App.tsx (add /skipper-app route, protect with role)
  - Modify: app/api/routes/captains.py (add GET /me/today-tours)
  - Create: tests/SkipperApp.test.tsx

Time Budget: 8 hours
Done Criteria: /skipper-app loads, shows today's tours
```

**After completion:**
- [ ] Verify: `/skipper-app` accessible to Skipper role only
- [ ] Verify: Tours list displays
- [ ] Verify: Responsive on mobile

---

#### Subagent Dispatch #17: Guest List & Check-in (Task 4.3 + 4.6)

**Input an Agent:**
```
Task: Implement Guest List & Check-in
Depends On: Task 4.1 + 4.2
Acceptance Criteria:
  ✓ Tour details page shows guest list:
    - Name, Email, Ticket#, Payment status
    - Badge colors: green=PAID, yellow=PENDING
  ✓ Search box: filter by name/ticket#
  ✓ Check-in button per guest:
    - Click → status changes to "Checked In"
    - Timestamp recorded
    - Visual indicator (checkmark icon)
  ✓ Status progression: "Wartet" → "Checked In" → "An Bord"
  ✓ Cannot check in same guest twice
  ✓ Tests

Files to Create/Modify:
  - Modify: src/pages/SkipperTourDetails.tsx (add guest list + checkin)
  - Create: src/components/GuestListTable.tsx
  - Modify: src/hooks/useSkipperTours.ts (add checkin mutation)
  - Modify: app/api/routes/tours.py:
    - GET /tours/{tour_id}/guests
    - POST /tours/{tour_id}/checkin/{guest_id}
  - Create: app/models/db.py (extend Booking/Ticket with checkin_at)
  - Create: tests/SkipperCheckIn.test.tsx

Time Budget: 7 hours
Done Criteria: Skipper can check in guests
```

**After completion:**
- [ ] Verify: Guest list displays
- [ ] Verify: Check-in button works
- [ ] Verify: Status updates visually

---

### WOCHE 6: QR-SCANNER & KAPAZITÄTS-MONITOR

#### Subagent Dispatch #18: QR Code Scanner (Task 4.4)

**Input an Agent:**
```
Task: Implement QR Code Ticket Validation
Depends On: Task 4.3 (Guest list)
Acceptance Criteria:
  ✓ QR input field: text input or camera (browser Camera API)
  ✓ When QR scanned:
    - Validate ticket format
    - Find matching guest in tour
    - Auto-check-in guest
    - Show visual feedback: ✅ or ❌
  ✓ Sound feedback: beep on successful scan (can disable)
  ✓ Error handling:
    - Invalid QR → red message "Ungültiges Ticket"
    - Ticket not for this tour → orange message "Nicht für diese Fahrt"
    - Already checked in → yellow message "Bereits eingecheckt"
  ✓ Manual input fallback (type ticket# if camera fails)
  ✓ Tests

Libraries: html5-qrcode (JavaScript QR scanner)
Files to Create/Modify:
  - Create: src/components/QRScanner.tsx
  - Modify: src/pages/SkipperTourDetails.tsx (add scanner)
  - Modify: app/api/routes/tours.py:
    - GET /tours/{tour_id}/validate-qr/{qr_code}
  - Create: tests/QRScanner.test.tsx

Time Budget: 7 hours
Done Criteria: QR scanner works, guests auto-check-in
```

**After completion:**
- [ ] Verify: QR scanner appears on tour details
- [ ] Verify: Scanning QR checks in guest
- [ ] Verify: Error messages display correctly

---

#### Subagent Dispatch #19: Capacity Monitor & Add Guest (Task 4.5 + 4.7)

**Input an Agent:**
```
Task: Live Capacity Monitor & Spontaneous Ticketing
Depends On: Task 4.3 (Guest list)
Acceptance Criteria:
  ✓ Capacity gauge (top of page):
    - Shows "12/25 Plätze belegt"
    - Color: green <50%, orange 50-80%, red >80%
    - Updates immediately when guest added/checked
  ✓ Add guest spontaneously (at boot):
    - Button: "+ Gast hinzufügen"
    - Modal form: Name, Email, Variant (if available)
    - Creates ticket on-the-fly
    - Adds to guest list immediately
    - Marks as "Checked In" automatically (already at boot)
  ✓ Capacity full warning:
    - Red banner: "Boot ist voll"
    - "Add guest" button disabled
  ✓ Auto-refresh capacity every 10s (or on change)
  ✓ Tests

Files to Create/Modify:
  - Create: src/components/CapacityGauge.tsx
  - Modify: src/pages/SkipperTourDetails.tsx (add add-guest modal)
  - Create: src/components/QuickAddGuestForm.tsx
  - Modify: app/api/routes/tours.py:
    - POST /tours/{tour_id}/guests (quick add)
  - Create: tests/CapacityMonitor.test.tsx

Time Budget: 6 hours
Done Criteria: Capacity monitor visible, add guest works
```

**After completion:**
- [ ] Verify: Capacity gauge displays
- [ ] Verify: Color changes based on occupancy
- [ ] Verify: Can add guest at boot
- [ ] Verify: Capacity updates

---

#### Subagent Dispatch #20: Skipper App Testing & Polish (Task 4.11 + 4.12 + 4.13)

**Input an Agent:**
```
Task: Complete Skipper App - Tests, Security, UX Polish
Depends On: All Task 4 components
Acceptance Criteria:
  ✓ Security:
    - App only accessible to Skipper role
    - Skipper can only see own tours (not other skippers)
    - No access to other captains' data
  ✓ Tests (>80% coverage):
    - Skipper app route protected
    - Guest list loads correctly
    - Check-in works
    - QR scanner works
    - Capacity updates
  ✓ UX Polish:
    - Large buttons (touch-friendly)
    - Good contrast (readable in sunlight)
    - No horizontal scroll on any resolution
    - Fast response (<500ms API calls)
    - Smooth animations
  ✓ Performance:
    - App loads in <2s
    - Guest list renders smoothly (100+ guests)
  ✓ Documentation:
    - Skipper user guide

Files to Create/Modify:
  - Modify: src/pages/SkipperApp.tsx (add security checks)
  - Modify: app/api/routes/tours.py (add authorization checks)
  - Create: tests/SkipperAppSecurity.test.tsx
  - Create: docs/SKIPPER_APP_GUIDE.md

Time Budget: 8 hours
Done Criteria: All tests passing, app production-ready
```

**After completion:**
- [ ] Verify: All tests passing
- [ ] Verify: Security checks in place
- [ ] Verify: UX polished

---

**PHASE 2B GATE:** Before starting Phase 2C:
- [ ] All Task 4 complete
- [ ] Skipper can see tours, check-in guests, scan QR
- [ ] All tests passing
- [ ] Security verified
- [ ] UX polished

---

## 📋 PHASE 2C: PLANUNG & AUTO-SAVE (Wochen 7-8)

**Ziel:** Dienstpläne können verwaltet werden. Changes auto-speichern.  
**Abhängigkeiten:** Phase 2A complete (Variants, Ticketing, Payments)  
**Go/No-Go Gate:** Admin kann Dienstpläne erstellen. Skipper bestätigen.

### WOCHE 7: DIENSTPLAN-SYSTEM

#### Subagent Dispatch #21: Shift Scheduling Backend (Task 5.1 + 5.2)

**Input an Agent:**
```
Task: Implement Shift Scheduling Data Model & Service
Acceptance Criteria:
  ✓ ShiftSchedule model: captain_id, boat_id, date, start_time, end_time, status
  ✓ ShiftStatus enum: SCHEDULED, CONFIRMED, REJECTED, COMPLETED, CANCELLED
  ✓ Validation: end_time > start_time
  ✓ Validation: one shift per boat per day max (or allow multiple?)
  ✓ Foreign keys: captain_id, boat_id (both required)
  ✓ ShiftRepository: full CRUD
  ✓ ShiftService methods:
    - createShift(captain, boat, date, hours)
    - getShiftsForDate(date) - all boats
    - getShiftsForCaptain(captain_id, from_date, to_date)
    - confirmShift(shift_id) - skipper confirms
    - rejectShift(shift_id, reason) - skipper rejects
    - cancelShift(shift_id) - admin cancels
  ✓ Validation rules:
    - Skipper max 8h per day
    - Skipper max 40h per week
    - Skipper must have qualification for boat
    - No overlapping shifts for same skipper
  ✓ Tests: >80% coverage

Files to Create/Modify:
  - Modify: app/models/db.py (add ShiftSchedule, ShiftStatus)
  - Create: app/repositories/shift_repository.py
  - Create: app/services/shift_service.py (all methods + validation)
  - Create: alembic/versions/shift_migration.py
  - Create: tests/test_shifts.py

Time Budget: 10 hours
Done Criteria: Shift model in DB, all validations working
```

**After completion:**
- [ ] Verify: `shift_schedules` table exists
- [ ] Verify: Can create shift
- [ ] Verify: Validations enforce rules
- [ ] Verify: Tests passing

---

#### Subagent Dispatch #22: Shift Scheduling API (Task 5.3 + 5.4)

**Input an Agent:**
```
Task: Implement Shift Scheduling REST API
Depends On: Task 5.1 + 5.2 (Shift backend)
Acceptance Criteria:
  ✓ POST /api/shifts (Admin only) - create shift
  ✓ GET /api/shifts?date=YYYY-MM-DD (Admin/Skipper) - list shifts
  ✓ GET /api/captains/{captain_id}/shifts (Admin/Captain) - captain's shifts
  ✓ PUT /api/shifts/{shift_id} (Admin only) - edit shift
  ✓ DELETE /api/shifts/{shift_id} (Admin only) - cancel shift
  ✓ POST /api/shifts/{shift_id}/confirm (Skipper only) - confirm shift
  ✓ POST /api/shifts/{shift_id}/reject (Skipper only) - reject shift
  ✓ Authorization checks:
    - Admin can CRUD all shifts
    - Skipper can only confirm/reject own shifts
    - Skipper cannot see other skippers' shifts
  ✓ Tests: auth + CRUD

Files to Create/Modify:
  - Create: app/api/routes/shifts.py (all endpoints)
  - Modify: app/main.py (add shifts router)
  - Modify: app/api/routes/captains.py (extend with shift endpoints)
  - Create: tests/test_shifts_api.py

Time Budget: 7 hours
Done Criteria: All 7 endpoints working, auth verified
```

**After completion:**
- [ ] Verify: Endpoints responding
- [ ] Verify: Auth checks working
- [ ] Verify: Tests passing

---

#### Subagent Dispatch #23: Shift Scheduling UI (Task 5.5 + 5.6)

**Input an Agent:**
```
Task: Implement Shift Scheduling Admin UI
Depends On: Task 5.1-5.4 (Shift backend + API)
Acceptance Criteria:
  ✓ New admin route: /scheduling
  ✓ Calendar view (week or month):
    - Columns: one per boat
    - Rows: days
    - Shows assigned skippers per boat per day
  ✓ "+ Shift" button per boat/day:
    - Modal form: date, boat, skipper, start time, end time
    - Validates: no overlaps, max 8h/day, qualification
    - On save: creates shift, shows in calendar
  ✓ Edit shift: click on shift → edit modal
  ✓ Delete shift: button with confirmation
  ✓ Status bubbles:
    - Green bubble: "Boot X: 2+ Skipper zugewiesen"
    - Yellow bubble: "Boot X: Nur 1 Skipper"
    - Red bubble: "Boot X: Kein Skipper"
    - Click bubble → quick-assign modal
  ✓ Color-coding: SCHEDULED=blue, CONFIRMED=green, REJECTED=red
  ✓ Tests

Files to Create/Modify:
  - Create: src/pages/admin/ShiftScheduling.tsx
  - Create: src/components/CalendarGrid.tsx
  - Create: src/components/ShiftForm.tsx
  - Create: src/components/StatusBubbles.tsx
  - Create: src/hooks/useShiftScheduling.ts
  - Modify: src/App.tsx (add /scheduling route, protect with admin)
  - Create: tests/ShiftScheduling.test.tsx

Time Budget: 12 hours
Done Criteria: Shift calendar visible, can add/edit shifts
```

**After completion:**
- [ ] Verify: Calendar displays
- [ ] Verify: Can add shift
- [ ] Verify: Status bubbles show
- [ ] Verify: Edit/delete work

---

### WOCHE 8: SKIPPER-INBOX & AUTO-SAVE

#### Subagent Dispatch #24: Skipper Shift Inbox (Task 5.7 + 5.8)

**Input an Agent:**
```
Task: Implement Skipper Shift Inbox & Notifications
Depends On: Task 5.1-5.6 (Shift system)
Acceptance Criteria:
  ✓ Skipper route: /my-shifts
  ✓ Shows shifts assigned to skipper:
    - Date, boat, time, status
    - Status colors: blue=SCHEDULED, green=CONFIRMED, red=REJECTED
  ✓ Actions:
    - "Bestätigen" button → confirm shift
    - "Ablehnen" button + modal for reason → reject shift
    - "Notiz hinzufügen" (optional text)
  ✓ Notifications:
    - When new shift assigned: email (optional, Phase 3)
    - When admin cancels shift: notification on page
  ✓ Past shifts visible (completed/cancelled)
  ✓ Tests

Files to Create/Modify:
  - Create: src/pages/SkipperShiftInbox.tsx
  - Create: src/components/ShiftCard.tsx
  - Create: src/hooks/useSkipperShifts.ts
  - Modify: src/App.tsx (add /my-shifts route)
  - Modify: app/api/routes/shifts.py (extend endpoints)
  - Create: tests/SkipperShiftInbox.test.tsx

Time Budget: 7 hours
Done Criteria: Skipper can see and confirm shifts
```

**After completion:**
- [ ] Verify: `/my-shifts` loads
- [ ] Verify: Skipper can confirm shift
- [ ] Verify: Skipper can reject shift

---

#### Subagent Dispatch #25: Auto-Save Functionality (Task 6.1 + 6.2 + 6.3)

**Input an Agent:**
```
Task: Implement Auto-Save for Forms
Depends On: Phase 2A + 2B (forms exist)
Acceptance Criteria:
  ✓ Auto-save service:
    - Debounce user input (2 second wait before save)
    - POST request to API on change
    - Handle network errors gracefully
    - Retry on failure (exponential backoff)
  ✓ Status indicator:
    - "Speichern..." when saving
    - "✓ Gespeichert" when done
    - "⚠ Fehler" if failed (clickable to retry)
    - Clears after 3 seconds if successful
  ✓ Auto-save in:
    - Booking form (variant selection, guest data)
    - Shift note field (skipper's notes)
    - Admin shift form (while editing)
  ✓ Only save valid data (validation passes)
  ✓ Don't save if error in validation
  ✓ Tests

Files to Create/Modify:
  - Create: src/hooks/useAutoSave.ts
  - Modify: src/pages/BookingForm.tsx (add auto-save)
  - Modify: src/pages/SkipperTourDetails.tsx (add auto-save for notes)
  - Modify: src/pages/admin/ShiftScheduling.tsx (add auto-save)
  - Create: src/components/AutoSaveIndicator.tsx
  - Create: tests/useAutoSave.test.ts

Time Budget: 6 hours
Done Criteria: Forms auto-save, indicator visible
```

**After completion:**
- [ ] Verify: Auto-save indicator appears
- [ ] Verify: Data saved after 2 seconds
- [ ] Verify: Error handling works

---

#### Subagent Dispatch #26: Phase 2C Final Review (Task 5.9-5.12, 6.4-6.6)

**Input an Agent:**
```
Task: Complete Phase 2C - Final Integration & Testing
Depends On: All Phase 2C tasks
Acceptance Criteria:
  ✓ Conflict detection:
    - Admin sees warning when creating overlapping shift
    - Admin sees warning when shift would exceed max hours
  ✓ Conflict resolution:
    - User can override warning (with confirmation)
    - Or system blocks and shows clear error
  ✓ Documentation:
    - Admin guide: shift scheduling process
    - Skipper guide: how to confirm shifts
    - Validation rules documented
  ✓ Tests (>80% coverage):
    - Shift scheduling
    - Skipper inbox
    - Auto-save
    - Conflict detection
  ✓ Security:
    - Auth checks on all endpoints
    - Skipper only sees own shifts
    - Admin can CRUD all
  ✓ Performance:
    - Calendar loads in <2s
    - Auto-save doesn't slow down UI
  ✓ Commit message:
    feat(phase2c): implement shift scheduling + auto-save
    
    - Shift scheduling system for captain assignment
    - Status bubbles showing boat coverage
    - Skipper inbox for shift confirmation
    - Auto-save for all forms
    - Comprehensive validation (hours, conflicts)
    - Full test suite
    
    Closes #phase-2c

Time Budget: 8 hours
Done Criteria: Phase 2C complete, ready to merge
```

**After completion:**
- [ ] Verify: All tests passing
- [ ] Verify: Code review approved
- [ ] Verify: Documentation complete
- [ ] Ready: Create PR or merge

---

**PHASE 2C GATE:** Before starting Phase 2D:
- [ ] All Task 5-6 complete
- [ ] Shift scheduling working
- [ ] Auto-save working
- [ ] All tests passing
- [ ] Documentation complete

---

## 📋 PHASE 2D: STATISTIKEN & REPORTING (Wochen 9-10)

**Ziel:** Admin kann Statistiken abrufen und exportieren.  
**Abhängigkeiten:** Phase 2A, 2B, 2C complete  
**Go/No-Go Gate:** Reports zeigen korrekte Daten.

### WOCHE 9-10: REPORTING & ANALYTICS

#### Subagent Dispatch #27: Reporting Queries & API (Task 7.1 + 7.2)

**Input an Agent:**
```
Task: Implement Reporting Queries & API
Acceptance Criteria:
  ✓ Reporting queries:
    - getGuestCountsByDate(from, to) → daily totals
    - getGuestCountsByBoat(from, to, boat_id) → per boat
    - getCaptainHours(captain_id, from, to) → hours worked
    - getCapacityUtilization(boat_id, from, to) → % full
    - getRevenueByChannel(from, to) → cash/ec/online
    - getPaymentStatus(from, to) → paid/pending/failed
  ✓ All queries tested with realistic data
  ✓ Query performance <1s
  ✓ API endpoints:
    - GET /api/reports/guests?from=&to=&boat_id=
    - GET /api/reports/captain-hours?from=&to=&captain_id=
    - GET /api/reports/capacity?from=&to=&boat_id=
    - GET /api/reports/revenue?from=&to=
    - GET /api/reports/payments?from=&to=&status=
  ✓ All endpoints admin-only
  ✓ Tests: auth + data validation

Files to Create/Modify:
  - Create: app/services/reporting_service.py (all queries)
  - Create: app/api/routes/reports.py (all endpoints)
  - Modify: app/main.py (add reports router)
  - Create: tests/test_reports.py (>80% coverage)

Time Budget: 10 hours
Done Criteria: All reports returning correct data
```

**After completion:**
- [ ] Verify: Endpoints responding
- [ ] Verify: Data correct
- [ ] Verify: Performance acceptable
- [ ] Verify: Tests passing

---

#### Subagent Dispatch #28: Reporting UI & Charts (Task 7.3 + 7.4)

**Input an Agent:**
```
Task: Implement Reports Dashboard with Charts
Depends On: Task 7.1 + 7.2 (Reporting API)
Acceptance Criteria:
  ✓ New admin route: /reports
  ✓ Date range picker (from/to dates)
  ✓ Predefined ranges: "This Week", "This Month", "Last Month", "Custom"
  ✓ Tab 1: Guest Statistics
    - Table: Date, Total Guests, Avg per Boot
    - Line chart: guest trend over time
    - Filter by boat
  ✓ Tab 2: Captain Hours
    - Table: Captain name, Hours this period, Avg per shift
    - Bar chart: hours by captain
  ✓ Tab 3: Capacity Utilization
    - Table: Boat, Capacity, Utilization %
    - Bar chart: utilization % by boat
    - Color coded: green <50%, orange 50-80%, red >80%
  ✓ Tab 4: Revenue
    - Table: Date, Channel (Cash/EC/Online), Amount
    - Pie chart: revenue by channel
    - Summary: total revenue, avg per booking
  ✓ Summary cards (top):
    - "Total Guests", "Total Revenue", "Avg Utilization", "Completion Rate"
    - Click card → detail view
  ✓ Responsive design
  ✓ Tests

Libraries: Recharts (React charting)
Files to Create/Modify:
  - Create: src/pages/admin/Reports.tsx
  - Create: src/pages/admin/GuestReport.tsx
  - Create: src/pages/admin/CaptainHoursReport.tsx
  - Create: src/pages/admin/CapacityReport.tsx
  - Create: src/pages/admin/RevenueReport.tsx
  - Create: src/components/ReportChart.tsx
  - Create: src/components/DateRangePicker.tsx
  - Create: src/components/SummaryCards.tsx
  - Create: src/hooks/useReports.ts
  - Modify: src/App.tsx (add /reports route)
  - Create: tests/Reports.test.tsx

Time Budget: 14 hours
Done Criteria: Reports dashboard displays all charts
```

**After completion:**
- [ ] Verify: `/reports` loads
- [ ] Verify: All tabs display data
- [ ] Verify: Charts render correctly
- [ ] Verify: Date filter works

---

#### Subagent Dispatch #29: Export & Caching (Task 7.5 + 7.6 + 7.8)

**Input an Agent:**
```
Task: Implement CSV/PDF Export & Caching
Depends On: Task 7.3 + 7.4 (Reports UI)
Acceptance Criteria:
  ✓ CSV export per report:
    - Button: "Download CSV"
    - Filename: `report_YYYY-MM-DD.csv`
    - Includes all data visible in table
  ✓ PDF export (optional):
    - Button: "Download PDF"
    - Includes charts + tables
    - Professional layout
  ✓ Caching:
    - Reports cached for 5 minutes
    - Cache invalidated on new booking/payment/shift
    - Admin can force refresh
  ✓ Performance:
    - Report load <2s (from cache)
    - Data freshness acceptable
  ✓ Tests

Libraries: python-csv (built-in), reportlab or pypdf (PDF export)
Files to Create/Modify:
  - Modify: app/api/routes/reports.py (add export endpoints)
  - Create: app/services/export_service.py (CSV/PDF generation)
  - Create: app/utils/cache.py (report caching)
  - Modify: src/pages/admin/Reports.tsx (add export buttons)
  - Create: tests/test_export.py

Time Budget: 8 hours
Done Criteria: Can export CSV, PDF (optional)
```

**After completion:**
- [ ] Verify: CSV export works
- [ ] Verify: Data in CSV is correct
- [ ] Verify: Cache working (check performance)

---

#### Subagent Dispatch #30: Dashboard Home & Performance (Task 7.7 + 7.9)

**Input an Agent:**
```
Task: Admin Dashboard Home + Performance Tuning
Depends On: All Phase 2D tasks
Acceptance Criteria:
  ✓ Admin dashboard (/admin or /dashboard) shows:
    - Summary cards: "Today's Guests: 47", "Revenue: €240", "Booked Tours: 3"
    - Quick metrics: "Capacity Status", "Payment Status", "Shift Status"
    - Links to detail pages
    - Last updated timestamp
  ✓ Performance tuning:
    - All reports <1s (cached)
    - Dashboard loads <2s
    - No N+1 queries
    - Database indices optimized
  ✓ Load testing:
    - System handles 100 concurrent bookings
    - Reports still responsive
  ✓ Tests

Files to Create/Modify:
  - Create/Modify: src/pages/admin/Dashboard.tsx
  - Modify: app/services/reporting_service.py (optimize queries)
  - Modify: alembic (add indices if needed)
  - Create: tests/test_performance.py

Time Budget: 8 hours
Done Criteria: Dashboard fast and informative
```

**After completion:**
- [ ] Verify: Dashboard displays summary cards
- [ ] Verify: Links work
- [ ] Verify: Performance acceptable

---

#### Subagent Dispatch #31: Phase 2D Docs & Final Review (Task 7.10 + final)

**Input an Agent:**
```
Task: Documentation & Phase 2D Final Review
Acceptance Criteria:
  ✓ Documentation:
    - Admin guide: how to read reports
    - Report explanations: what each metric means
    - Export process documented
  ✓ Tests (>80% coverage):
    - Report queries
    - API endpoints
    - UI interactions
    - Export
  ✓ Security:
    - Only admin can access /reports
    - No data leaks
  ✓ All Phase 2 features working:
    - Variants ✓
    - Ticketing ✓
    - Payments ✓
    - Skipper App ✓
    - Shift Scheduling ✓
    - Auto-Save ✓
    - Reports ✓
  ✓ Final commit:
    feat(phase2d): implement reporting & analytics
    
    - Guest statistics (daily, by boat, trends)
    - Captain hours reporting
    - Capacity utilization analytics
    - Revenue tracking by channel
    - CSV/PDF export
    - Dashboard with summary cards
    - Query caching for performance
    - Full test suite
    
    Closes #phase-2 (full phase 2 complete)

Time Budget: 8 hours
Done Criteria: Phase 2 COMPLETE, ready for production
```

**After completion:**
- [ ] Verify: Documentation complete
- [ ] Verify: All tests passing
- [ ] Verify: Code review approved
- [ ] Verify: Ready to deploy Phase 2

---

**PHASE 2 FINAL GATE:**
- [ ] All tasks 1-7 complete (Variants, Ticketing, Payments, Skipper App, Scheduling, Auto-Save, Reports)
- [ ] All tests passing (>80% coverage)
- [ ] Documentation complete
- [ ] Code review approved
- [ ] Security verified
- [ ] Performance acceptable
- [ ] Ready: Create final PR, merge to main, deploy Phase 2

---

## 🎯 NEXT STEPS AFTER PHASE 2

### Phase 3: EC-PAYMENT & PRODUCTION (2-3 Wochen)
- EC-Terminal Integration (Ingenico/Worldline)
- Email notifications
- Backup & Disaster Recovery
- Monitoring (Sentry, DataDog)
- Performance optimization
- Security hardening

### Optional Future Phases
- Mobile app (React Native)
- Advanced analytics (BI integration)
- Multi-language support
- Email/SMS notifications
- API rate limiting

---

## 📊 Master Timeline Summary

| Phase | Focus | Weeks | Subagents | Go-Live |
|-------|-------|-------|-----------|---------|
| **2A** | Variants, Ticketing, Payments | 4 | #1-15 | Week 4 |
| **2B** | Skipper App | 2 | #16-20 | Week 6 |
| **2C** | Shift Scheduling, Auto-Save | 2 | #21-26 | Week 8 |
| **2D** | Reports & Analytics | 2 | #27-31 | Week 10 |
| | | | | |
| **Phase 2 Total** | Core features | **10** | **31** | **Week 10** |

---

**Status:** Ready for agent execution via Subagent-Driven Development  
**Start Condition:** User approval to begin Phase 2A with Subagent Dispatch #1  
**Success Metric:** All 31 subagent dispatches complete, all tests passing, Phase 2 deployed
