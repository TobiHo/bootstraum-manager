# Phase 2 Roadmap - Ticketing & Bootsführer-Management

**Version:** 1.0  
**Datum:** 2026-04-30  
**Ziel:** Vollständiges Ticketing-System + Bootsführer-App  
**Timeline:** ~8-12 Wochen (abhängig von Ressourcen & Priorisierung)

---

## PHASE 2A: Kern-Ticketing (Wochen 1-4)

### ⚡ Task Group 2A.1: Datenmodell erweitern

#### Task 2A.1.1: Booking-Modell erweitern
**Datei:** `bootstrap-manager-backend/app/models/db.py`

**Was:**
- Booking-Tabelle: Neue Felder hinzufügen
  - `tour_type`: ENUM (GRUPPENTOUR, ÖFFENTLICHE_RUNDFAHRT)
  - `variant_id`: FK zu BookingVariant
  - `ticketing_status`: ENUM (PENDING, PAID, CANCELLED)
  - `notes` für interne Infos

**Akzeptanzkriterium:**
- DB-Migration läuft fehlerfrei
- Tests für neue Felder
- Backward-compatibility gewährleistet (alte Bookings noch sichtbar)

---

#### Task 2A.1.2: BookingVariant & Ticket Modelle
**Datei:** `bootstrap-manager-backend/app/models/db.py`

**Was:**
```python
class BookingVariant(Base):
    name: str (z.B. "Standard", "Premium", "Family")
    description: str
    price: Decimal
    max_participants: int
    boat_id: FK
    available: bool
    
class Ticket(Base):
    booking_id: FK
    variant_id: FK
    customer_name: str
    customer_email: str
    ticket_number: str (eindeutig)
    status: ENUM (VALID, USED, CANCELLED)
    paid: bool
    payment_method: str (CASH, EC, ONLINE)
    created_at, used_at
```

**Akzeptanzkriterium:**
- Modelle im Code
- Migrationen schreiben (alembic)
- Tests für Ticket-Erstellung

---

#### Task 2A.1.3: Payment-Modell
**Datei:** `bootstrap-manager-backend/app/models/db.py`

**Was:**
```python
class Payment(Base):
    booking_id: FK
    amount: Decimal
    method: ENUM (CASH, EC, ONLINE, OTHER)
    status: ENUM (PENDING, COMPLETED, FAILED, REFUNDED)
    transaction_id: str (für EC/Online)
    timestamp: DateTime
    processed_by: FK zu User
```

**Akzeptanzkriterium:**
- Schema konsistent mit Booking
- Tests

---

### 💾 Task Group 2A.2: Backend-APIs erweitern

#### Task 2A.2.1: BookingVariant API
**Dateien:** `app/api/routes/bookings.py` + `app/services/booking_service.py`

**Endpoints:**
```
GET    /api/booking-variants                - Alle Varianten
GET    /api/booking-variants?boat_id=X      - Varianten für Boot
GET    /api/boats/{boat_id}/variants        - Alternative Route
POST   /api/booking-variants (admin only)   - Neue Variante erstellen
PUT    /api/booking-variants/{id} (admin)   - Editieren
DELETE /api/booking-variants/{id} (admin)   - Löschen
```

**Logik:**
- Varianten sind Boot-spezifisch (Boot A hat nur Varianten A, B; Boot B hat C, D)
- Preis, Kapazität pro Variante
- Verfügbarkeit toggeln (z.B. "Familie" nur am Wochenende)

**Akzeptanzkriterium:**
- Alle Endpoints funktionieren
- Tests (CRUD, Validierung)
- Pydantic Schemas für Request/Response

---

#### Task 2A.2.2: Ticket-Management API
**Dateien:** `app/services/booking_service.py` + `app/api/routes/bookings.py`

**Endpoints:**
```
POST   /api/bookings/{id}/tickets           - Tickets für Buchung erstellen
GET    /api/bookings/{id}/tickets           - Alle Tickets einer Buchung
PUT    /api/tickets/{ticket_id}             - Ticket-Status ändern (USED, CANCELLED)
POST   /api/tickets/{ticket_id}/validate    - QR-Code Scanning (Bootführer)
GET    /api/tickets/search?number=XYZ       - Ticket suchen
```

**Logik:**
- Ticket-Nummer eindeutig generieren (z.B. Tour-ID + laufende Nummer)
- Status-Übergänge prüfen (VALID → USED, CANCELLED allowed)
- Audit-Logging (wer hat Ticket gescannt/validiert)

**Akzeptanzkriterium:**
- Endpoints funktionieren
- Ticket-Validierung via QR-Code (Mock-Implementation)
- Tests

---

#### Task 2A.2.3: Payment API (Phase 1: ohne EC)
**Dateien:** `app/services/booking_service.py` + `app/api/routes/bookings.py`

**Endpoints:**
```
POST   /api/bookings/{id}/payment          - Zahlung registrieren
GET    /api/payments?status=PENDING         - Offene Zahlungen (Admin)
POST   /api/payments/{id}/confirm           - Zahlung abhaken (Schalter)
```

**Logik:**
- CASH: Einfach registrieren (Schalter bestätigt)
- EC: Placeholder für später (Terminal-Integration)
- ONLINE: Placeholder für Stripe/PayPal Integration

**Akzeptanzkriterium:**
- Endpoints funktionieren
- Status-Übergänge prüfen
- Tests (ohne externe Payment-Integration)

---

### 🎨 Task Group 2A.3: Frontend - Public Shop

#### Task 2A.3.1: Shop Landing Page
**Dateien:** `src/pages/Shop.tsx` + `src/components/shop/`

**Was:**
- Boote anzeigen (Bilder, Kapazität, Beschreibung)
- Datum/Uhrzeit-Picker
- Pro Boot: Verfügbare Varianten anzeigen (mit Preis)
- "Buchen" Button

**Akzeptanzkriterium:**
- Responsive Design
- Verfügbarkeiten live aktualisieren (API-Calls)
- Link zu Buchungs-Formular

---

#### Task 2A.3.2: Shop Buchungs-Workflow
**Dateien:** `src/pages/Shop.tsx` + mehrschrittige Forms

**Workflow:**
1. **Schritt 1:** Boot + Datum + Variante wählen
2. **Schritt 2:** Gäste-Infos (Namen, Email)
3. **Schritt 3:** Zahlungs-Methode (CASH, EC, ONLINE)
4. **Schritt 4:** Bestätigung + Ticket-Nummer anzeigen

**Akzeptanzkriterium:**
- Multi-Step Form mit Validierung
- API-Calls an Backend (POST /bookings + /tickets)
- Bestätigungsseite mit Ticket-Details
- Fehlerbehandlung

---

#### Task 2A.3.3: Ticket-Anzeige & Download
**Dateien:** `src/pages/TicketDetail.tsx`

**Was:**
- Ticket-QR-Code anzeigen (oder Ticket-Nummer)
- PDF-Export (Ticket zum Ausdrucken)
- Email-Versand (optional)
- Mobile-freundlich (am Handy zeigen beim Einsteigen)

**Akzeptanzkriterium:**
- QR-Code generierbar (library: `qrcode.react`)
- PDF-Export funktioniert
- Mobile responsive

---

### 👨‍💼 Task Group 2A.4: Frontend - Schalter-Modus

#### Task 2A.4.1: Staff Booking UI
**Dateien:** `src/pages/StaffBooking.tsx`

**Was:**
- Mitarbeiter-spezifisches Interface
- Schnelle Buchung (weniger Clicks als Shop)
- Offline-Modus (lokale DB falls offline)
- Auto-Save

**Unterschiede zu Shop:**
- Keine Gäste-Daten abfragen (später am Boot erfasst)
- Einfach: Boot, Datum, Variante, Anzahl, Zahlungs-Status
- Quick-Actions (Vorkasse, Nachzahlung markieren)

**Akzeptanzkriterium:**
- Fast & intuitive Bedienung
- Auto-Save Änderungen (localStorage + API)
- Validierung aller Felder

---

#### Task 2A.4.2: Schalter-Zahlungs-Integration
**Dateien:** `src/components/shop/PaymentModal.tsx`

**Was:**
- Zahlungs-Status UI (Pending, Paid, Failed)
- Manuelle Bestätigung (Schalter tippt "Zahlung erhalten")
- EC-Terminal Placeholder (für Phase 3)

**Akzeptanzkriterium:**
- Einfache, fehlerfreie Bedienung
- Undo-Möglichkeit (Zahlungs-Status zurücksetzen)

---

### 📊 Task Group 2A.5: Live-Kapazität & Auto-Save

#### Task 2A.5.1: Live-Verfügbarkeits-API
**Dateien:** `app/services/booking_service.py`

**Endpoints:**
```
GET /api/boats/{boat_id}/availability?date=YYYY-MM-DD
Response: {
  boat_id: 1,
  date: "2024-05-15",
  total_capacity: 50,
  booked_seats: 35,
  available_seats: 15,
  variants: [
    { variant_id: 1, name: "Standard", available: true, seats: 10 },
    { variant_id: 2, name: "Premium", available: false, seats: 0 }
  ]
}
```

**Akzeptanzkriterium:**
- Schnelle Response (<200ms)
- Korrekte Berechnungen
- Tests

---

#### Task 2A.5.2: Auto-Save Frontend
**Dateien:** `src/hooks/useAutoSave.ts` + `src/components/`

**Was:**
- Alle Form-Änderungen auto-speichern (nach 2 Sekunden Inaktivität)
- Visual Feedback ("Speichern...")
- Offline-Handling (Queue, später synchen)

**Implementierung:**
```typescript
function useAutoSave(data, endpoint, delay = 2000) {
  const [isSaving, setIsSaving] = useState(false);
  
  useEffect(() => {
    const timer = setTimeout(() => {
      apiClient.post(endpoint, data)
        .then(() => setIsSaving(false))
        .catch(err => showError(err));
    }, delay);
    
    return () => clearTimeout(timer);
  }, [data]);
}
```

**Akzeptanzkriterium:**
- Auto-Save für alle Forms
- Offline-Queue (localStorage)
- Visual Feedback

---

## PHASE 2B: Bootsführer-App (Wochen 5-7)

### 📱 Task Group 2B.1: Mobile Bootsführer-Interface

#### Task 2B.1.1: Responsive Redesign für Bootsführer
**Dateien:** `src/pages/BoatskipperDashboard.tsx`

**Was:**
- Separates Interface für Bootführer (mobil-optimiert)
- 1 aktuelle Fahrt prominent anzeigen
- Gäste-Liste (Namen, Check-in Status)
- Kapazitäts-Anzeige (aktuell 18/50)

**Akzeptanzkriterium:**
- Funktioniert auf iPhone/Android
- Große, tippbar Buttons
- Schnelle Ladezeit (<2s)

---

#### Task 2B.1.2: Check-in / Ticket-Scanning
**Dateien:** `src/components/boatskipper/TicketScanner.tsx`

**Was:**
- QR-Code Scanner (HTML5 camera API)
- Manual Ticket-Nummer Eingabe (Fallback)
- Check-in bestätigen (Gast sitzt, markiert als "USED")
- Fehler-Handling (ungültig, doppelt gescannt)

**Akzeptanzkriterium:**
- QR-Code scannen funktioniert
- Fallback auf Ticket-Nummer
- Clear Feedback (✅ oder ❌)

---

#### Task 2B.1.3: Live Kapazitäts-Anzeige
**Dateien:** `src/hooks/useLiveCapacity.ts`

**Was:**
- WebSocket oder Polling (GET /api/boats/{id}/live-capacity)
- Zeige aktualisiert sich in Echtzeit
- Red/Yellow/Green Status (voll/fast-voll/OK)

**Akzeptanzkriterium:**
- Updates innerhalb 3 Sekunden
- Funktioniert über längere Zeit (nicht laggy)

---

### 📋 Task Group 2B.2: Dienstplan-Verwaltung

#### Task 2B.2.1: Schichtplan-Datenmodell
**Dateien:** `app/models/db.py`

**Was:**
```python
class ShiftSchedule(Base):
    boat_id: FK
    captain_id: FK
    date: Date
    start_time: Time
    end_time: Time
    status: ENUM (SCHEDULED, CONFIRMED, COMPLETED, CANCELLED)
    notes: str
```

**Logik:**
- Pro Boot + Datum: max. 1 Skipper zugleich
- Constraint: Captain kann nicht gleichzeitig 2 Boote fahren
- Skipper kann Schicht ablehnen (Status → CANCELLED)

**Akzeptanzkriterium:**
- Schema korrekt
- Migrations (alembic)
- Constraints prüfen (Tests)

---

#### Task 2B.2.2: Schichtplan-API
**Dateien:** `app/api/routes/schedules.py` (new) + service

**Endpoints:**
```
GET    /api/schedules?month=2024-05&boat_id=1          - Schichten anzeigen
POST   /api/schedules                  (admin)          - Neue Schicht eintragen
PUT    /api/schedules/{id}             (admin, captain) - Bearbeiten/Bestätigen
DELETE /api/schedules/{id}             (admin)          - Löschen
GET    /api/schedules/overview         (admin)          - Übersicht (fehlen noch Skipper?)
```

**Akzeptanzkriterium:**
- CRUD funktioniert
- Constraints prüfen
- Tests

---

#### Task 2B.2.3: Schichtplan-Editor (Admin UI)
**Dateien:** `src/pages/admin/SchedulePlanner.tsx`

**Was:**
- Kalender-View (Monat)
- Pro Boot: Schichten anzeigen
- Drag & Drop Skipper auf Schicht (optional)
- Form zum manuell eintragen
- **Status-Bubbles:** "Boot 1: Fahrer fehlt" (rot)

**Bubble-Logik:**
```
Für jede Schicht in diesem Monat:
  if (boat.shift === null OR captain.shift === null)
    → BUBBLE (rot): "Boot X: Fahrer fehlt"
  else
    → OK (grün)
```

**Akzeptanzkriterium:**
- Kalender anzeigen
- Schichten eintragen/bearbeiten
- Status-Bubbles funktionieren
- Responsive

---

## PHASE 2C: Statistiken & Dashboards (Wochen 8-10)

### 📈 Task Group 2C.1: Reporting-Backend

#### Task 2C.1.1: Statistik-Queries schreiben
**Dateien:** `app/services/reporting_service.py` (new)

**Was:**
```python
# Gästezahlen
def get_guest_statistics(start_date, end_date):
    return {
        "total_guests": sum all participants,
        "by_boat": { boat_id: count },
        "by_variant": { variant_id: count },
        "by_date": { date: count }
    }

# Bootsführer-Stunden
def get_captain_hours(captain_id, start_date, end_date):
    return {
        "total_hours": sum(end_time - start_time),
        "by_boat": { boat_id: hours },
        "by_week": { week: hours }
    }

# Auslastung
def get_utilization(boat_id, start_date, end_date):
    return {
        "avg_capacity_percent": avg(booked / capacity),
        "by_variant": { variant_id: percent }
    }
```

**Akzeptanzkriterium:**
- Alle Queries funktionieren
- Performance OK (<1s für Jahresstatistik)
- Tests

---

#### Task 2C.1.2: Reporting-API
**Dateien:** `app/api/routes/reports.py` (new)

**Endpoints:**
```
GET /api/reports/guests?start=2024-01-01&end=2024-12-31
GET /api/reports/captain-hours?captain_id=1&start=...
GET /api/reports/utilization?boat_id=1&start=...
GET /api/reports/revenue?payment_method=EC&start=...
```

**Akzeptanzkriterium:**
- Endpoints funktionieren
- Filter (date range, boat, captain, etc.)
- JSON Response

---

### 📊 Task Group 2C.2: Frontend Reports

#### Task 2C.2.1: Report-Dashboard
**Dateien:** `src/pages/admin/Reports.tsx` + `src/components/reports/`

**Was:**
- Tab 1: Gäste-Statistiken (Chart: Gäste/Tag, Gäste/Boot, etc.)
- Tab 2: Bootsführer-Stunden (Chart: Stunden/Skipper)
- Tab 3: Auslastung (Chart: % Auslastung/Boot)
- Datum-Filter (Start/End)
- Export-Buttons (CSV, PDF)

**Charts:** Verwende `recharts` library (bereits installiert)

**Akzeptanzkriterium:**
- Charts laden Daten vom API
- Filter funktionieren
- Export funktioniert

---

#### Task 2C.2.2: Export zu CSV/PDF
**Dateien:** `src/utils/export.ts`

**Was:**
- CSV-Export: Einfach (comma-separated)
- PDF-Export: Mit Branding (VVV Nordhorn Logo, etc.)
- Library: `react-pdf` oder `pdfkit` (backend)

**Akzeptanzkriterium:**
- CSV & PDF Dateien generierbar
- Daten vollständig
- Formatierung OK

---

## PHASE 3: Payment & Production (Wochen 11-13+)

### 💳 Task Group 3.1: EC-Terminal Integration

#### Task 3.1.1: EC-Payment Service (Placeholder)
**Dateien:** `app/services/payment_service.py`

**Was:**
- Interface für EC-Terminal (Ingenico / Worldline / SumUp)
- Mock-Implementation für Dev
- Error-Handling

**Akzeptanzkriterium:**
- Service funktioniert
- Falsche Eingaben abfangen
- Logging

---

#### Task 3.1.2: PCI-Compliance & Security
- Keine CC-Nummern im Code/DB speichern
- Nur Token-basierte Zahlungen
- Audit-Logging
- Tests für Edge-Cases

---

### 🚀 Task Group 3.2: Production-Ready

#### Task 3.2.1: Deployment
- Docker-Image bauen & testen
- PostgreSQL Backup-Strategie
- Monitoring (Error-Logging, Performance)
- Load-Testing

---

#### Task 3.2.2: Dokumentation
- API-Doku (OpenAPI/Swagger)
- User-Handbuch (Mitarbeiter)
- Admin-Handbuch (Konfiguration)
- Troubleshooting-Guide

---

## Priorisierung: Quick Summary

### MUSS haben (Phase 2A+B):
- [ ] Ticketing-Grundsystem (Online + Schalter)
- [ ] Bootsführer-App (Mobile-freundlich)
- [ ] Schichtplanung mit Status-Bubbles
- [ ] Auto-Save Funktionalität

### SOLLTE haben (Phase 2C):
- [ ] Statistiken & Reporting
- [ ] PDF-Export
- [ ] Einfacher Budget-Überblick

### KÖNNTE haben (Phase 3):
- [ ] EC-Payment Integration
- [ ] Native Mobile App
- [ ] Advanced Analytics
- [ ] Anbindung an Buchhaltung

---

## Ressourcen & Timeline

### Szenario A: 1 Developer (vollzeit)
- Phase 2A: 4 Wochen
- Phase 2B: 3 Wochen
- Phase 2C: 2 Wochen
- Phase 3: 2-3 Wochen
- **Total: 11-12 Wochen (~3 Monate)**

### Szenario B: 2 Developer (fulltime)
- Parallel Phase 2A + B
- 6 Wochen für Phase 2
- 2 Wochen Phase 2C
- 2 Wochen Phase 3
- **Total: 6-7 Wochen (~2 Monate)**

### Szenario C: 1 Developer (part-time 50%)
- **Total: 6 Monate**

---

## Nächste Schritte (Morgen)

1. ✅ Anforderungen validieren mit Stakeholder
2. ✅ Timeline/Budget klären
3. ✅ Developer-Ressourcen zuweisen
4. ✅ Phase 2A Task 2A.1.1 starten (DB-Modelle)

---

**Status:** Ready to Start  
**Gültig bis:** 2026-06-30  
**Besitzer:** Product Owner  
**Nächste Review:** 2026-05-30
