# Boat Tour Management System - Requirements Analysis

**Datum:** 2026-04-30  
**Basis:** Anforderungen von "travelmanager" vs. aktuelle Implementierung

---

## 1. Anforderungs-Vergleich

### ✅ Bereits implementiert (MVP-Phase 1)

| Anforderung | Status | Details |
|-------------|--------|---------|
| Bootsverwaltung | ✅ | 4 Boote mit Kapazität, Typ, Beschreibung |
| Bootsführer verwalten | ✅ | Name, Email, Zertifizierungen, Boot-Qualifikation |
| Buchungskalender | ✅ | Monat/Woche/Tag-Sicht, Buchungen anzeigen |
| Booking-System | ✅ | Gruppentour buchen, Datum/Zeit/Bootswahl |
| Double-Booking Verhinderung | ✅ | Boote können nicht doppelt gebucht werden |
| JWT Authentifizierung | ✅ | Rollen: Admin, Staff, Customer |
| API mit Clean Architecture | ✅ | FastAPI, Services, Repositories, ORM |
| PostgreSQL Datenbank | ✅ | Mit Constraints und Indices |
| Unit Tests | ✅ | Tests für Auth, Boats, Bookings |
| Docker Setup | ✅ | docker-compose mit PostgreSQL + Backend |

---

### ❌ GAPS: Fehlende Funktionen (Phase 2+)

#### A. **Ticketing & Verkaufskanäle** (PRIORITÄT: HOCH)
| Anforderung | Gap | Aufwand |
|-------------|-----|---------|
| Unterscheidung: Gruppentour vs. öffentliche Rundfahrt | Keine Unterscheidung im Booking-Modell | Mittel |
| Verschiedene Varianten buchbar (z.B. "Standart", "Premium", "Family") | Nicht modelliert | Mittel |
| Online-Shop / Ticketing-System | Nicht implementiert | Hoch |
| Schalter-Modus (offline Ticketing) | Keine separate UI/Workflow | Mittel |
| Boot-Modus (Ticketing am Boot) | Keine mobile App für Bootführer | Hoch |
| Live-Kapazitätsanzeige | Nur für Admin/Staff sichtbar | Niedrig |
| Zahlungsabwicklung (EC-Terminals) | Nicht integriert | Sehr Hoch |

#### B. **Bootsführer-Management** (PRIORITÄT: HOCH)
| Anforderung | Gap | Aufwand |
|-------------|-----|---------|
| Mobile App für Bootführer | Nur Web-Interface | Sehr Hoch |
| Dienstpläne / Schichtplanung | Nicht vorhanden | Hoch |
| Visuelle Status-Indikatoren (Bubbles) | "Boot XY fehlt noch Fahrer" | Mittel |
| Schnelle Übersicht: Fahrer-Zuordnung pro Boot | Keine spezielle UI dafür | Mittel |
| Ticketbuchung durch Bootführer | Über Admin-Interface | Mittel |
| EC-Zahlung am Boot einnehmen | Nicht umgesetzt | Hoch |
| Kapazitätseinsicht (Live) | Nur Admin-View | Niedrig |

#### C. **Benutzerfreundlichkeit & UX** (PRIORITÄT: MITTEL)
| Anforderung | Gap | Aufwand |
|-------------|-----|---------|
| Auto-Save für Änderungen | Nur nach Form-Submit | Niedrig |
| Multi-User Bedienung robust | Basis-Authentifizierung vorhanden | Niedrig |
| Nicht zu kompliziert | MVP-UI einfach, aber featurelimited | Niedrig |
| Visuelle Fehler-Indikatoren (Bubbles) | Nicht vorhanden | Mittel |

#### D. **Statistiken & Reporting** (PRIORITÄT: MITTEL)
| Anforderung | Gap | Aufwand |
|-------------|-----|---------|
| Gästezahlen pro Tour/Tag/Monat | Keine Auswertung | Mittel |
| Bootsführer-Stunden (Zeiterfassung) | Nicht modelliert | Mittel |
| Auslastungs-Statistiken | Keine Queries dafür | Mittel |
| Export (CSV, PDF) | Nicht vorhanden | Niedrig |

#### E. **System & Infrastruktur** (PRIORITÄT: NIEDRIG)
| Anforderung | Gap | Aufwand |
|-------------|-----|---------|
| Production-ready Deployment | Docker vorhanden, aber nicht getestet | Niedrig |
| Daten-Backup / Disaster Recovery | Nicht konfiguriert | Mittel |
| Monitoring & Logging | Nur basic logging | Mittel |

---

## 2. Gap-Analyse: Detailliert

### A. Datenmodell-Erweiterungen

**Derzeit:**
- Boat, Captain, Booking, User

**Benötigt:**
```
Booking erweitern:
  - type: ENUM (GRUPPENTOUR | ÖFFENTLICHE_RUNDFAHRT)
  - variant: STRING (z.B. "Standard", "Premium", "Family")
  - status: ENUM (..., TICKETING_PENDING, PAYMENT_PENDING)
  
neue Tabellen:
  - BookingVariant (name, description, price, ...)
  - Ticket (booking_id, customer_name, paid, payment_method, ...)
  - ShiftSchedule (captain_id, boat_id, date, start_time, end_time, ...)
  - Payment (amount, method, timestamp, status, ...)
```

### B. API-Erweiterungen

**Benötigte neue Endpoints:**
```
POST   /api/bookings/variants              - Liste Varianten
POST   /api/bookings/{id}/tickets          - Tickets für Buchung
POST   /api/bookings/{id}/payment          - Zahlungsabwicklung
GET    /api/boats/{id}/availability        - Live-Kapazität
GET    /api/captains/schedule              - Dienstpläne
POST   /api/captains/schedule              - Dienste eintragen
GET    /api/statistics/guests              - Gäste-Statistiken
GET    /api/statistics/captain-hours       - Bootführer-Stunden
```

### C. Frontend-Erweiterungen

**Neue Pages/Features:**
1. **Öffentlicher Shop** - Ticketing für End-Customers
2. **Schalter-Modus** - Separate UI für Verkauf am Schalter
3. **Bootsführer-App** - Mobile-friendly App für Bootführer
4. **Schichtplanung** - Dienstplan-Manager
5. **Dashboard mit Bubbles** - Status-Übersicht (fehlende Fahrer)
6. **Reports/Statistiken** - Gäste- und Stunden-Auswertungen

### D. Zahlungs-Integration

**Nicht trivial:**
- EC-Terminal Integration (z.B. Ingenico, Worldline)
- PCI-DSS Compliance
- Fehlerbehandlung & Transaktions-Logging
- Abrechnung & Reconciliation

---

## 3. Priorisierung für Phase 2

### **PHASE 2A: Kern-Ticketing (3-4 Wochen)**
1. ✅ Datenmodell erweitern (BookingVariant, Ticket, Payment)
2. ✅ Public Shop UI (einfaches Ticketing)
3. ✅ Schalter-Modus (Staff UI)
4. ✅ Auto-Save für Änderungen
5. ✅ Live-Kapazitäts-API

**Ergebnis:** Tickets können online, am Schalter verkauft werden. Einfaches Zahlungs-Tracking.

### **PHASE 2B: Bootsführer-App (2-3 Wochen)**
1. ✅ Mobile-friendly Bootsführer-UI (oder native App)
2. ✅ Ticket-Einsicht am Boot
3. ✅ Kapazitäts-Live-Update
4. ✅ Einfache Check-in Funktionalität

**Ergebnis:** Bootsführer können Gäste verwalten, Tickets einsehen (ohne EC).

### **PHASE 2C: Schichtplanung & Dashboards (2-3 Wochen)**
1. ✅ ShiftSchedule-Modell & API
2. ✅ Dienstplan-Editor (Drag&Drop oder Form)
3. ✅ Dashboard mit Status-Bubbles ("Boot 1: Fahrer fehlt")
4. ✅ Automatische Warnungen

**Ergebnis:** Schnelle Übersicht über Personalplanung, visuelle Warnungen.

### **PHASE 2D: Statistiken (1-2 Wochen)**
1. ✅ Reporting-Queries schreiben
2. ✅ Report-Page mit Charts (Gäste, Stunden)
3. ✅ CSV/PDF Export

**Ergebnis:** Management kann Zahlen analysieren.

### **PHASE 3: EC-Payment & Erweiterte Features (2-4 Wochen)**
- EC-Terminal Integration
- Erweiterte Fehlerbehandlung
- Backup/Monitoring
- Performance-Optimierung

---

## 4. Geschätzte Gesamtaufwände

| Phase | Features | Entwicklung | Testing | Total |
|-------|----------|-------------|---------|-------|
| **MVP (✅ DONE)** | Basis-Booking, Boote, Skipper | 60 Stunden | 20 Stunden | ~80h |
| **Phase 2A** | Ticketing, Shop, Schalter | 80 Stunden | 20 Stunden | ~100h |
| **Phase 2B** | Bootsführer-App | 60 Stunden | 15 Stunden | ~75h |
| **Phase 2C** | Schichtplanung, Dashboards | 50 Stunden | 10 Stunden | ~60h |
| **Phase 2D** | Statistiken & Reports | 30 Stunden | 10 Stunden | ~40h |
| **Phase 3** | EC-Payment, Production | 80 Stunden | 20 Stunden | ~100h |
| | | | | **~455h** |

**Vereinfacht:** ~3-4 Monate Entwicklung für vollständiges System (ein Developer).

---

## 5. Technische Schulden & Risiken

### Hohe Priorität
- [ ] EC-Payment Integration (externe API, PCI-Compliance)
- [ ] Mobile App für Bootführer (React Native oder PWA?)
- [ ] Performance bei vielen Gästen/Buchungen

### Mittlere Priorität
- [ ] Backup & Disaster Recovery
- [ ] Monitoring (Sentry, DataDog)
- [ ] Load Testing

### Niedrige Priorität
- [ ] Dark Mode
- [ ] Mehrsprachigkeit
- [ ] Advanced Reporting (BI-Integration)

---

## 6. Nächste Schritte (sofort)

### Entscheidungen treffen:
1. **Zahlungs-Partner wählen?** (Stripe, PayPal, lokales EC-Terminal?)
2. **Bootsführer-App: Native oder Web?** (React Native vs. PWA?)
3. **Timeline?** (Alles auf einmal vs. Phasenweise?)
4. **Budget?** (Intern entwickeln vs. externe Agentur?)

### Implementierung (Phase 2A - Ticketing):
- [ ] **Task 1-2**: Datenmodell erweitern (Variant, Ticket, Payment)
- [ ] **Task 3-4**: Public Shop UI (React + API)
- [ ] **Task 5-6**: Schalter-Modus UI
- [ ] **Task 7-8**: Auto-Save & Live-Kapazität
- [ ] **Task 9-10**: Tests & Dokumentation

---

## 7. Vergleich mit "travelmanager"

| Feature | travelmanager | Unser System (MVP) | Unser System (Phase 2) |
|---------|---------------|------------------|----------------------|
| Online-Shop | ✅ | ❌ | ✅ |
| Schalter-Modus | ✅ | ❌ | ✅ |
| Bootsführer-App | ✅ | ❌ | ✅ |
| EC-Zahlung | ✅ | ❌ | ⏳ |
| Dienstpläne | ✅ | ❌ | ✅ |
| Statistiken | ✅ | ❌ | ✅ |
| Benutzerfreundlichkeit | ✅ | ⚠️ | ✅ |
| Kosten | Sehr Hoch | Niedrig (DIY) | Niedrig (DIY) |

**Fazit:** Unser System wird in Phase 2 feature-äquivalent zu travelmanager sein, kostet aber einen Bruchteil (interne Entwicklung vs. Enterprise-Software).

---

**Status:** Ready for Phase 2 Planning  
**Nächste Aktion:** Prioritäten mit Stakeholder klären → Phase 2A starten
