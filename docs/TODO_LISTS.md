# TODO Listen - Phase 2 Implementierung

**Stand:** 2026-04-30  
**Basis:** FEATURE_COMPARISON.md Anforderungsabgleich  
**Organisiert nach:** Feature-Bereiche mit Priorisierung

---

## 🔴 KRITISCH (Phase 2A+B: Wochen 1-4)

### 1. TOUREN-TYPEN & VARIANTEN (0% → 100%)

**Backlog:** 12 Tasks | Aufwand: ~40 Stunden

- [ ] **Task 1.1**: Datenmodell erweitern
  - [ ] `BookingVariant` Tabelle (name, description, price, boat_type)
  - [ ] `Booking` um `type: ENUM(GRUPPENTOUR, RUNDFAHRT)` erweitern
  - [ ] `Booking` um `variant_id: FK` erweitern
  - Migration schreiben + Seed-Daten
  - Unit Tests für Modell-Validierung

- [ ] **Task 1.2**: Repository & Service erweitern
  - [ ] `VariantRepository` für CRUD-Operationen
  - [ ] `BookingService.getAvailableVariants(boat_id, date)`
  - [ ] `BookingService.validateVariantAvailability()`
  - Integration Tests

- [ ] **Task 1.3**: API-Endpoints für Varianten
  - [ ] `GET /api/variants` — alle Varianten auflisten
  - [ ] `GET /api/variants/{id}` — Variante mit Details
  - [ ] `GET /api/boats/{boat_id}/variants` — Varianten pro Boot
  - [ ] `POST /api/variants` (Admin only) — neue Variante
  - [ ] `PUT /api/variants/{id}` (Admin only) — Variante ändern
  - API Tests mit Auth-Validierung

- [ ] **Task 1.4**: Booking-Workflow erweitern
  - [ ] Booking-API: `POST /api/bookings` akzeptiert `variant_id`
  - [ ] Validation: Variante muss zum Boot passen
  - [ ] Validation: Preis wird aus Variante übernommen
  - [ ] Validation: Kapazität wird korrekt berechnet
  - Integration Tests mit Varianten

- [ ] **Task 1.5**: Frontend: Varianten-Auswahl
  - [ ] Booking-Formular: Varianten-Dropdown (abhängig von Boot)
  - [ ] Preis-Anzeige basierend auf Variante
  - [ ] Beschreibung der Variante unter Dropdown
  - [ ] Validation: Variante erforderlich
  - [ ] Tests für Varianten-Logik

- [ ] **Task 1.6**: Admin-UI für Varianten
  - [ ] Varianten-Verwaltungsseite
  - [ ] CRUD-Formulare (Create, Edit, Delete)
  - [ ] Bestätigung vor Delete
  - [ ] Fehlerbehandlung (z.B. Variante in Benutzung)

---

### 2. TICKETING & VERKAUFSKANÄLE (30% → 100%)

**Backlog:** 16 Tasks | Aufwand: ~60 Stunden

- [ ] **Task 2.1**: Datenmodell für Tickets
  - [ ] `Ticket` Tabelle (booking_id, customer_name, email, qr_code, status)
  - [ ] `TicketStatus` ENUM (SOLD, CHECKED_IN, CANCELLED)
  - [ ] `Booking` um `sale_channel` ENUM (ONLINE, COUNTER, BOAT) erweitern
  - Constraints: Tickets gehören zu gültigem Booking
  - Unit Tests

- [ ] **Task 2.2**: Öffentlicher Online-Shop (Frontend)
  - [ ] Neue Route: `/shop`
  - [ ] Boot-Auswahlseite (Kalender mit Verfügbarkeit)
  - [ ] Buchungs-Details: Datum, Zeit, Boot, Variante
  - [ ] Gäste-Daten erfassen (Name, Email, Anzahl)
  - [ ] Preis-Zusammenfassung
  - [ ] "Zur Kasse"-Button
  - [ ] Bestätigungsseite mit Ticket-Link/QR-Code

- [ ] **Task 2.3**: Schalter-Modus (Staff-UI)
  - [ ] Neue Route (nur Staff sichtbar): `/counter-mode`
  - [ ] Schnell-Buchungs-Interface
  - [ ] Boot + Datum + Variante + Anzahl Gäste
  - [ ] Sofortige Kapazitäts-Prüfung
  - [ ] Booking sofort speichern
  - [ ] Ticket sofort drucken (Druckvorschau)
  - [ ] Zahlungs-Status: PAID vs PENDING

- [ ] **Task 2.4**: Boot-Modus Vorbereitung (Skipper)
  - [ ] Neue Route (nur Skipper sichtbar): `/boat-mode`
  - [ ] Quelle: Wird in Task 5 (App) detailliert
  - [ ] Für MVP: Web-basiert, responsive Layout

- [ ] **Task 2.5**: Live-Kapazitäts-API
  - [ ] `GET /api/boats/{boat_id}/availability?date=YYYY-MM-DD`
  - [ ] Response: { available_seats, total_capacity, booked }
  - [ ] Cache: Max. 1 Minute
  - [ ] WebSocket-Alternative für Echtzeit (optional Phase 2B)

- [ ] **Task 2.6**: Live-Verfügbarkeits-UI
  - [ ] Online-Shop: "Noch 5 Plätze frei" Anzeige
  - [ ] Automatisches Refresh beim Ändern von Datum/Boot
  - [ ] Fehlermeldung wenn ausgebucht
  - [ ] Blockierung des "Zur Kasse"-Buttons wenn nicht verfügbar

- [ ] **Task 2.7**: QR-Code-Generierung
  - [ ] Ticket-Model: QR-Code mit Ticket-ID generieren
  - [ ] QR-Code in Bestätigungsseite anzeigen
  - [ ] QR-Code druckbar (PDF oder Screenshot)
  - [ ] Dependency: python-qrcode oder ähnlich

- [ ] **Task 2.8**: Zahlungs-Status-Tracking (einfach)
  - [ ] `Booking.payment_status` ENUM (UNPAID, PAID, PARTIAL)
  - [ ] `Booking.payment_method` String (CASH, EC, ONLINE)
  - [ ] Schalter-Modus: Dropdown für Payment-Method
  - [ ] Online-Shop: PENDING bis manuell auf PAID gesetzt (Phase 3)
  - [ ] UI: Status-Badge in Booking-Liste

- [ ] **Task 2.9**: Fehlerbehandlung
  - [ ] Race Condition: Doppelter Ticketverkauf verhindern
  - [ ] Timeout: Booking-Session 30 Min Gültigkeit (optional)
  - [ ] Validation: Gäste-Daten vollständig
  - [ ] Validation: Kapazität nicht überschritten (DB-Constraint)

- [ ] **Task 2.10**: API-Tests
  - [ ] Test: Online-Shop Booking-Flow
  - [ ] Test: Schalter-Modus Booking-Flow
  - [ ] Test: Kapazitäts-Grenze wird respektiert
  - [ ] Test: QR-Code wird generiert
  - [ ] Test: Payment-Status wird richtig gesetzt

- [ ] **Task 2.11**: Frontend-Integration
  - [ ] React Query Hooks für Shop-Daten
  - [ ] Form State Management (Formik oder React Hook Form)
  - [ ] Error Boundaries für Fehlerbehandlung
  - [ ] Loading States (Spinner während API-Calls)

- [ ] **Task 2.12**: Dokumentation
  - [ ] Verkaufskanal-Unterschiede dokumentieren
  - [ ] Ticket-Workflow: Online bis Check-in
  - [ ] Staff-Anleitung für Schalter-Modus
  - [ ] Skipper-Anleitung für Boot-Modus (Vorbereitung Task 5)

---

### 3. ZAHLUNGEN (0% → 50% Phase 2)

**Backlog:** 10 Tasks | Aufwand: ~50 Stunden  
*(EC-Terminal in Phase 3)*

- [ ] **Task 3.1**: Zahlungs-Datenmodell
  - [ ] `Payment` Tabelle (id, booking_id, amount, method, status, timestamp)
  - [ ] `PaymentStatus` ENUM (PENDING, COMPLETED, FAILED, REFUNDED)
  - [ ] `PaymentMethod` ENUM (CASH, EC_TERMINAL, ONLINE_STRIPE, ONLINE_PAYPAL)
  - [ ] Foreign Key: booking_id
  - [ ] Constraint: amount > 0, timestamp auto
  - Unit Tests

- [ ] **Task 3.2**: Repository & Service
  - [ ] `PaymentRepository`: CRUD für Payments
  - [ ] `PaymentService.createPayment(booking_id, amount, method)`
  - [ ] `PaymentService.confirmPayment(payment_id)`
  - [ ] `PaymentService.refund(payment_id, reason)`
  - [ ] `PaymentService.getPaymentsByBooking(booking_id)`
  - Integration Tests

- [ ] **Task 3.3**: Zahlungs-API
  - [ ] `POST /api/payments` — neue Zahlung initiieren
  - [ ] `GET /api/payments/{payment_id}` — Status abrufen
  - [ ] `POST /api/payments/{payment_id}/confirm` — Zahlung bestätigen
  - [ ] `POST /api/payments/{payment_id}/refund` — Rückerstattung
  - [ ] `GET /api/bookings/{booking_id}/payment` — Payment zu Booking
  - API Tests mit Auth

- [ ] **Task 3.4**: Zahlungs-UI (Schalter-Modus)
  - [ ] Zahlungs-Formular in Schalter-Modus
  - [ ] Methoden-Auswahl: Cash, EC (pending), Online (pending)
  - [ ] Betrag-Anzeige aus Booking
  - [ ] Bestätigung nach Zahlung
  - [ ] Fehlerbehandlung

- [ ] **Task 3.5**: Zahlungs-UI (Online-Shop)
  - [ ] Zahlungs-Formular im Checkout
  - [ ] Für MVP: "PENDING" Status, manuell bestätigen (Admin)
  - [ ] (Phase 3: Stripe/PayPal Integration)
  - [ ] Fehlermeldung wenn Zahlung fehlschlägt

- [ ] **Task 3.6**: Audit-Log
  - [ ] `PaymentAuditLog` Tabelle (payment_id, action, user_id, timestamp, details)
  - [ ] Für jede Zahlung: CREATE, CONFIRM, REFUND logged
  - [ ] Nur lesbar (append-only)
  - [ ] Tests

- [ ] **Task 3.7**: Reconciliation-Reports (einfach)
  - [ ] Report: Umsatz pro Tag nach Kanal (Cash, EC, Online)
  - [ ] Report: Ausstehende Zahlungen (PENDING)
  - [ ] Report: Rückerstattungen (REFUNDED)
  - [ ] CSV-Export möglich
  - [ ] Tests

- [ ] **Task 3.8**: Fehlerbehandlung
  - [ ] Doppel-Zahlung verhindern (Idempotency Key?)
  - [ ] Ungültige Zahlungs-Methode ablehnen
  - [ ] Betrag validieren (muss > 0)
  - [ ] Negative Szenarien: Netzwerkfehler, Timeout

- [ ] **Task 3.9**: Admin-UI: Zahlungsübersicht
  - [ ] Dashboard: Zahlungs-Status pro Booking
  - [ ] Filter nach Status (PENDING, COMPLETED, FAILED)
  - [ ] Manuell auf PAID setzen möglich (MVP)
  - [ ] Refund-Button mit Bestätigung
  - [ ] Audit-Log anzeigen

- [ ] **Task 3.10**: Dokumentation
  - [ ] Zahlungs-Workflow dokumentieren
  - [ ] Payment-Methoden und Grenzen
  - [ ] Reconciliation-Prozess
  - [ ] (Phase 3 wird EC/Online-Integration hinzufügen)

---

### 4. BOOTSFÜHRER-APP (10% → 80% Phase 2)

**Backlog:** 14 Tasks | Aufwand: ~60 Stunden  
*(Offline-Modus in Phase 3)*

- [ ] **Task 4.1**: Mobile-responsive Layout
  - [ ] Neue Route: `/skipper-app` (nur Skipper-Rolle)
  - [ ] Mobile-first Design (Bootstrap/Tailwind)
  - [ ] Touch-freundliche Buttons
  - [ ] Landscape + Portrait Support
  - [ ] Kein Horizontal-Scroll nötig

- [ ] **Task 4.2**: Heute's-Fahrten-Übersicht
  - [ ] Zeige alle Fahrten des Skippers heute
  - [ ] Boot-Name, Uhrzeit, Anzahl Gäste
  - [ ] Status: "Vorbereitung", "Im Einsatz", "Beendet"
  - [ ] Sortierung nach Uhrzeit
  - [ ] Refresh-Button (oder Auto-Refresh alle 30s)

- [ ] **Task 4.3**: Gäste-Liste pro Fahrt
  - [ ] Click auf Fahrt → Gäste-Liste
  - [ ] Name, Ticketnummer, Zahlungs-Status
  - [ ] Suchfunktion (nach Name/Ticket)
  - [ ] Filterung (checked-in / nicht gebucht)

- [ ] **Task 4.4**: QR-Code Scanner (Vorbereitung)
  - [ ] QR-Code Input-Feld (Kamera oder manuell)
  - [ ] Ticket validieren wenn QR-Code gescannt
  - [ ] Visuelle Bestätigung: ✅ oder ❌
  - [ ] Audible Feedback (Beep?)
  - [ ] (Echte Kamera-Integration: Phase 2B+)

- [ ] **Task 4.5**: Ticketing am Boot (Skipper)
  - [ ] "+ Gast hinzufügen" Button
  - [ ] Schnell-Form: Name, Email, Variante
  - [ ] Spontan-Ticket erstellen (inline)
  - [ ] Sofort im Gäste-Status sichtbar
  - [ ] Zahlungs-Status: Cash?

- [ ] **Task 4.6**: Check-in-Verwaltung
  - [ ] Gast-Status: "Wartet" → "Checked in" → "An Bord"
  - [ ] Button pro Gast: "Check in"
  - [ ] Zeitstempel speichern
  - [ ] Visueller Indikator (Farbe/Haken)

- [ ] **Task 4.7**: Kapazitäts-Live-Monitor
  - [ ] Oben auf Seite: "12/25 Plätze belegt"
  - [ ] Farbe ändert sich: Grün < 50%, Orange 50-80%, Rot > 80%
  - [ ] Auto-Refresh wenn Gäste hinzugefügt/entfernt
  - [ ] Warnung wenn voll

- [ ] **Task 4.8**: Notizen pro Fahrt (optional)
  - [ ] Feld für Skipper-Notizen
  - [ ] Auto-Save
  - [ ] Sichtbar nur für diesen Skipper
  - [ ] (z.B. "Boot war etwas laut" oder "Gast brauchte Bandage")

- [ ] **Task 4.9**: Offline-Indikator (Vorbereitung)
  - [ ] Netzwerk-Status-Anzeige
  - [ ] Falls offline: "Lokale Kopie - synchronisiere wenn wieder online"
  - [ ] Echte Offline-Sync: Phase 3
  - [ ] Warnung: Manche Features nicht verfügbar offline

- [ ] **Task 4.10**: Sicherheit & Authentifizierung
  - [ ] App nur sichtbar für Skipper (Role Check)
  - [ ] JWT Token in LocalStorage (wie Admin)
  - [ ] Automatisches Logout nach 30 Min Inaktivität
  - [ ] Logout-Button oben rechts

- [ ] **Task 4.11**: API für Skipper-Operationen
  - [ ] `GET /api/captains/me/today-tours` — Heute's Fahrten
  - [ ] `GET /api/tours/{tour_id}/guests` — Gäste-Liste
  - [ ] `POST /api/tours/{tour_id}/checkin/{guest_id}` — Check-in
  - [ ] `POST /api/tours/{tour_id}/guests` — Gast hinzufügen
  - [ ] `GET /api/tours/{tour_id}/capacity` — aktuelle Auslastung
  - Tests mit Auth (Skipper kann nur eigene Touren sehen)

- [ ] **Task 4.12**: Frontend-Tests
  - [ ] Skipper-App sollte nur für Skipper erreichbar sein
  - [ ] Gäste-Liste wird korrekt geladen
  - [ ] Check-in ändert Status
  - [ ] Kapazitäts-Anzeige ist aktuell
  - [ ] Offline-Indikator funktioniert

- [ ] **Task 4.13**: UX-Optimierung
  - [ ] Schnelle Navigation (Tab-Navigation)
  - [ ] Große Touch-Targets (min 44x44px)
  - [ ] Kontrast: Text lesbar in Sonnenlicht
  - [ ] Keine Horizontales Scrollen

- [ ] **Task 4.14**: Dokumentation
  - [ ] Skipper-Anleitung (wie App benutzen)
  - [ ] API-Doku für Skipper-Endpoints
  - [ ] Offline-Modus Erwartungen (Phase 3)

---

## 🟠 HOCH (Phase 2C: Wochen 5-7)

### 5. DIENSTPLÄNE & SCHICHTPLANUNG (0% → 100%)

**Backlog:** 12 Tasks | Aufwand: ~50 Stunden

- [ ] **Task 5.1**: Datenmodell für Dienstpläne
  - [ ] `ShiftSchedule` Tabelle (id, captain_id, boat_id, date, start_time, end_time, status)
  - [ ] `ShiftStatus` ENUM (SCHEDULED, CONFIRMED, REJECTED, COMPLETED, CANCELLED)
  - [ ] Constraints: captain_id + boat_id + date eindeutig (kein Doppel-Eintrag)
  - [ ] Constraints: end_time > start_time
  - [ ] Foreign Keys: captain_id, boat_id
  - Unit Tests

- [ ] **Task 5.2**: Repository & Service
  - [ ] `ShiftScheduleRepository`: CRUD
  - [ ] `ShiftService.createShift(captain_id, boat_id, date, hours)`
  - [ ] `ShiftService.getShiftsForDate(date)` → nach Boot geordnet
  - [ ] `ShiftService.confirmShift(shift_id)`
  - [ ] `ShiftService.rejectShift(shift_id, reason)`
  - [ ] `ShiftService.getShiftsForCaptain(captain_id, from_date, to_date)`
  - Integration Tests

- [ ] **Task 5.3**: Validierung
  - [ ] Skipper max 8h pro Tag
  - [ ] Skipper max 40h pro Woche
  - [ ] Qualifikation prüfen (Skipper muss Boot fahren können)
  - [ ] Keine Überschneidungen
  - [ ] Tests für alle Validierungen

- [ ] **Task 5.4**: API für Dienstplan-Verwaltung
  - [ ] `POST /api/shifts` (Admin only) — Schicht erstellen
  - [ ] `GET /api/shifts?date=YYYY-MM-DD` — Alle Schichten an Datum
  - [ ] `GET /api/shifts/captain/{captain_id}` — Schichten des Skippers
  - [ ] `PUT /api/shifts/{shift_id}` (Admin) — ändern
  - [ ] `DELETE /api/shifts/{shift_id}` (Admin) — löschen
  - [ ] `POST /api/shifts/{shift_id}/confirm` (Skipper) — bestätigen
  - [ ] `POST /api/shifts/{shift_id}/reject` (Skipper) — ablehnen
  - Tests mit Auth (Skipper kann nur eigene Schichten sehen/bestätigen)

- [ ] **Task 5.5**: Dienstplan-Editor (UI)
  - [ ] Neue Admin-Route: `/scheduling`
  - [ ] Kalender-Ansicht (Woche oder Monat)
  - [ ] Pro Boot: Spalte für Schichten
  - [ ] "+ Schicht" Modal: Boot, Datum, Zeit, Skipper
  - [ ] Drag-and-Drop (optional: nur Reihenfolge)
  - [ ] Bestätigung vor Löschen

- [ ] **Task 5.6**: Status-Bubbles / Fehler-Indikatoren
  - [ ] Rotes Bubble: "Boot X: Skipper fehlt" wenn keine Schicht
  - [ ] Gelbes Bubble: "Boot X: Nur 1 Skipper" wenn nur eine Schicht geplant
  - [ ] Grünes Bubble: "Boot X: 2+ Skipper" wenn ausreichend besetzt
  - [ ] Dashboard-Widget für schnelle Übersicht
  - [ ] Click auf Bubble → Schicht hinzufügen Modal

- [ ] **Task 5.7**: Skipper-Inbox (Schicht-Bestätigung)
  - [ ] Skipper-sichtbare Route: `/my-shifts`
  - [ ] Liste der zugewiesenen Schichten (die Woche)
  - [ ] Status pro Schicht: "Ausstehend", "Bestätigt", "Abgelehnt"
  - [ ] Buttons: "Bestätigen" / "Ablehnen"
  - [ ] Notiz-Feld beim Ablehnen (optional)

- [ ] **Task 5.8**: Automatische Warnungen (einfach)
  - [ ] E-Mail an Admin wenn Schicht > 1 Woche nicht bestätigt
  - [ ] E-Mail an Skipper: "Du hast eine neue Schicht zugewiesen"
  - [ ] (Advanced Alerts: Phase 3)

- [ ] **Task 5.9**: Konflikte & Warnungen
  - [ ] Prüfung: Skipper bereits in anderer Schicht zu dieser Zeit?
  - [ ] Prüfung: Maximale Stunden überschritten?
  - [ ] Warnung vor speichern: "Skipper hat bereits 7h diese Woche"
  - [ ] Tests

- [ ] **Task 5.10**: Schicht-Historie
  - [ ] Vergangene Schichten anzeigen (Skipper)
  - [ ] Status: "Completed" oder "Cancelled"
  - [ ] Gesamtstunden pro Monat (für Reporting)
  - [ ] Tests

- [ ] **Task 5.11**: Frontend-Integration
  - [ ] React Query Hooks für Shift-API
  - [ ] Form Validation (Zeit-Picker)
  - [ ] Error Boundaries
  - [ ] Loading States

- [ ] **Task 5.12**: Dokumentation
  - [ ] Admin-Anleitung: Schichten eintragen
  - [ ] Skipper-Anleitung: Schichten bestätigen/ablehnen
  - [ ] Validierungsregeln dokumentieren

---

### 6. AUTO-SAVE FUNKTIONALITÄT (0% → 100%)

**Backlog:** 6 Tasks | Aufwand: ~15 Stunden

- [ ] **Task 6.1**: Auto-Save Service (Frontend)
  - [ ] Debounce-Funktion (speichern nach 2s Inaktivität)
  - [ ] `useAutoSave()` Hook für React-Komponenten
  - [ ] Status-Indikator: "Speichern...", "Gespeichert ✓", "Fehler"
  - [ ] Retry-Logik bei Fehler

- [ ] **Task 6.2**: Auto-Save in Booking-Formular
  - [ ] Jedes Feld wird beim Ändern auto-gespeichert
  - [ ] Status-Indicator unten rechts
  - [ ] Nur gültige Daten speichern
  - [ ] Validation-Fehler blockieren Save

- [ ] **Task 6.3**: Auto-Save in Skipper-App
  - [ ] Notiz-Feld auto-speichern
  - [ ] Keine Nachricht beim Submit (wird bereits gespeichert)
  - [ ] Tests

- [ ] **Task 6.4**: Conflict Resolution
  - [ ] Falls andere Person gleichzeitig ändert: Warning anzeigen
  - [ ] Benutzer kann überschreiben oder abbrechen
  - [ ] (Optional: Merge-Logik in Phase 3)

- [ ] **Task 6.5**: Tests
  - [ ] Auto-Save wird nach Debounce-Delay getriggert
  - [ ] Fehler werden handled
  - [ ] Validation blockiert Save wenn nötig
  - [ ] Conflict-Scenario getestet

- [ ] **Task 6.6**: Dokumentation
  - [ ] UX erklärt: Auto-Save ist "unsichtbar"
  - [ ] Benutzer sehen nur Status wenn Fehler

---

## 🟡 MITTEL (Phase 2D: Wochen 8-10 / später)

### 7. STATISTIKEN & REPORTING (0% → 80%)

**Backlog:** 10 Tasks | Aufwand: ~35 Stunden

- [ ] **Task 7.1**: Reporting-Queries schreiben
  - [ ] `getGuestCountsByDate(from_date, to_date)` — Tages-Gästezahlen
  - [ ] `getGuestCountsByBoat(from_date, to_date)` — pro Boot
  - [ ] `getCaptainHours(captain_id, from_date, to_date)` — Stunden pro Skipper
  - [ ] `getCapacityUtilization(boat_id, from_date, to_date)` — Auslastung %
  - [ ] `getRevenueByChannel(from_date, to_date)` — Umsatz nach Kanal
  - Tests für alle Queries

- [ ] **Task 7.2**: Reporting-API
  - [ ] `GET /api/reports/guests` mit Query-Params (from_date, to_date, boat_id)
  - [ ] `GET /api/reports/captain-hours` mit Query-Params
  - [ ] `GET /api/reports/capacity` mit Query-Params
  - [ ] `GET /api/reports/revenue` mit Query-Params
  - [ ] Alle nur Admin-zugänglich
  - Tests

- [ ] **Task 7.3**: Report-UI (Dashboard)
  - [ ] Neue Admin-Route: `/reports`
  - [ ] Tab 1: Gäste-Statistiken
    - [ ] Tages-Gästezahlen (Tabelle oder Chart)
    - [ ] Durchschnitt pro Boot
    - [ ] Trend (Woche/Monat)
  - [ ] Tab 2: Skipper-Stunden
    - [ ] Stunden pro Skipper (Tabelle)
    - [ ] Monatliche Summe
    - [ ] Vergleich mit Zielstunden
  - [ ] Tab 3: Auslastung
    - [ ] % Auslastung pro Boot (Chart)
    - [ ] Beste/schlechteste Zeiten
  - [ ] Tab 4: Umsatz
    - [ ] Umsatz nach Kanal (Pie Chart)
    - [ ] Trend über Zeit
    - [ ] Durchschnitt pro Fahrt

- [ ] **Task 7.4**: Charts & Grafiken
  - [ ] Library: Recharts oder Chart.js
  - [ ] Line Chart für Trends
  - [ ] Bar Chart für Vergleiche
  - [ ] Pie Chart für Kanäle
  - [ ] Responsive Design

- [ ] **Task 7.5**: Export-Funktionalität
  - [ ] CSV-Export pro Report
  - [ ] PDF-Export (optional)
  - [ ] Dateiname mit Datum
  - [ ] Tests

- [ ] **Task 7.6**: Datum-Filter
  - [ ] Date-Range-Picker (React-DatePicker oder ähnlich)
  - [ ] Vordefinierte Ranges: "Diese Woche", "Dieser Monat", "Letzter Monat", "Custom"
  - [ ] Auto-Refresh beim Ändern

- [ ] **Task 7.7**: Kachel-Ansicht (Dashboard-Home)
  - [ ] Oben auf Admin-Dashboard:
    - [ ] "Heute Gäste: 47"
    - [ ] "Umsatz heute: €240"
    - [ ] "Boote im Einsatz: 3"
    - [ ] "Skipper verfügbar: 5"
  - [ ] Kacheln sind Links zu Detail-Reports

- [ ] **Task 7.8**: Caching
  - [ ] Reports cachen (max 5 Minuten)
  - [ ] Cache invalidieren wenn neue Booking erstellt
  - [ ] Tests

- [ ] **Task 7.9**: Performance
  - [ ] Queries sollten < 1s sein (auch mit großen Datenmengen)
  - [ ] Database Indizes ggf. anpassen
  - [ ] Tests mit realistischen Datenmengen

- [ ] **Task 7.10**: Dokumentation
  - [ ] Admin-Anleitung: Statistiken lesen
  - [ ] Report-Erklärungen (was bedeutet was)
  - [ ] Export-Prozess

---

## Zusammenfassung & Aufwand-Übersicht

| Bereich | Tasks | Stunden | Phase |
|---------|-------|---------|-------|
| **1. Touren-Typen & Varianten** | 6 | 40 | 2A |
| **2. Ticketing & Verkaufskanäle** | 12 | 60 | 2A |
| **3. Zahlungen** | 10 | 50 | 2A |
| **4. Bootsführer-App** | 14 | 60 | 2B |
| **5. Dienstpläne & Schichtplanung** | 12 | 50 | 2C |
| **6. Auto-Save Funktionalität** | 6 | 15 | 2C |
| **7. Statistiken & Reporting** | 10 | 35 | 2D |
| | | | |
| **TOTAL PHASE 2** | **70** | **310h** | |

**Geschätzter Zeitaufwand (Team):**
- **1 Dev, Vollzeit:** 7-8 Wochen (40h/Woche)
- **2 Devs, parallel:** 4-5 Wochen
- **3 Devs, parallel:** 3-4 Wochen

---

**Status:** Ready für AGENT_PLAN.md Erstellung  
**Nächster Schritt:** Sequential Task-Priorität mit Abhängigkeiten für Agent-Execution
