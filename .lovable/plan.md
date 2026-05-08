# Plan: Webshop & erweiterte Verwaltung

Aufbau eines öffentlichen Buchungs-Webshops (Vorbild: giethoorntickets.nl) auf Basis des bestehenden Stacks (FastAPI-Backend + React/Vite-Frontend), inkl. Rollensystem, automatischer Bootsführer-Zuordnung, Abwesenheitsverwaltung und Paddle-Bezahlung.

## 1. Backend-Erweiterungen (FastAPI)

### Rollen
- `UserRole` erweitern: `ADMIN`, `STAFF`, `CAPTAIN`, `CUSTOMER`
- Captain-Konto an `User` koppeln (`captain.user_id` FK, optional)
- Route-Guards in `middleware/auth.py`: `require_admin`, `require_staff`, `require_captain`, `require_customer_or_above`

### Neue Modelle / Tabellen
- `tour_type`: Stammdaten für öffentliche Fahrten (Name, Dauer, Beschreibung, Preis pro Ticket, min/max Personen, Bild)
- `public_tour` (Slot): `tour_type_id`, `start_date`, `end_date`, `boat_id`, `captain_id?`, `seats_total`, `seats_booked`, `status`
- `ticket`: `public_tour_id`, `booking_id`, `quantity`, `price_total`
- `captain_absence`: `captain_id`, `start_date`, `end_date`, `reason` (`vacation`/`permanent`/`sick`), `recurring` (z.B. "jeden Mo")
- `payment`: `booking_id`, `provider` (`paddle`), `paddle_transaction_id`, `status`, `amount`, `currency`
- `booking` erweitern: `type` (`charter`|`public`), `total_price`, `payment_status`

### Neue Endpoints
- `GET/POST/PUT/DELETE /api/tour-types` (Admin/Staff)
- `GET /api/public-tours?from&to` (öffentlich) – verfügbare Slots
- `POST /api/public-tours` (Admin) – Slot anlegen, automatische Bootsführer-Zuordnung
- `POST /api/public-tours/{id}/tickets` (öffentlich/Kunde) – Tickets buchen
- `POST /api/bookings/charter` (öffentlich/Kunde) – private Charter-Anfrage
- `GET/POST/DELETE /api/captains/{id}/absences` (Captain für sich, Admin für alle)
- `POST /api/payments/paddle/checkout` – Checkout-Session erstellen
- `POST /api/payments/paddle/webhook` – Zahlungsstatus aktualisieren

### Auto-Zuordnung Bootsführer
Service `captain_assignment_service.assign(boat_id, start, end)`:
1. Kandidaten = Captains mit `boat_id` in `available_boats`
2. Filter: keine Überschneidung mit `booking` oder `captain_absence`
3. Sortiere nach Zahl der Bookings im aktuellen Monat (gleichverteilt)
4. Gib ersten zurück; nichts gefunden → `null` (Slot bleibt unzugeordnet, Admin-Hinweis)
Aufruf bei Slot-Erstellung und bei Charter-Bestätigung.

## 2. Frontend – öffentlicher Webshop

Neue Routes (öffentlich, kein Login nötig; Login optional für „Meine Buchungen"):
- `/` – Landingpage im VVV-Nordhorn-CD: Hero, USPs, Touren-Highlights, CTA
- `/touren` – Übersicht aller Tour-Typen (Karten-Grid mit Bild, Preis, Dauer)
- `/touren/:slug` – Detail + Termin-/Slot-Auswahl + Ticket-Anzahl + Checkout
- `/charter` – Formular für private Komplett-Buchung (analog aktuelles Modal, aber öffentlich)
- `/checkout/erfolg` und `/checkout/abbruch`
- `/meine-buchungen` – Kunde sieht eigene Buchungen (Login)

Komponenten: `PublicLayout` (eigene Navi/Footer im Nordhorn-CD), `TourCard`, `SlotPicker`, `TicketCounter`, `CheckoutSummary`.

## 3. Frontend – interner Bereich (bestehend erweitern)

- `AppLayout` Navigation rollenbasiert
- `/admin/tour-types` neue Stammdaten-Seite (CRUD)
- `/admin/public-tours` Kalender zum Anlegen/Pflegen öffentlicher Slots, zeigt Buchungsstand
- `/captain/abwesenheiten` Captain-Self-Service (Urlaub eintragen, dauerhafte Sperrtage)
- `/admin/captains` zeigt zusätzlich Abwesenheiten + Auslastung
- Bestehender Buchungskalender bleibt für Charter, zeigt jetzt auch öffentliche Slots farblich getrennt

## 4. Paddle-Integration

- `payments--enable_paddle_payments` (eligibility check zuerst via `recommend_payment_provider`)
- Tour-Typen → Paddle Products + Prices via `batch_create_product` (1 Price pro Tour-Typ; Charter als Custom Price)
- Checkout: Webshop ruft `/api/payments/paddle/checkout` → Paddle Checkout-Overlay → Webhook bestätigt → Buchung auf `confirmed`

## 5. Corporate Design

Bestehende Tokens in `index.css`/`tailwind.config.ts` an vvv-nordhorn.de anpassen (Blau/Weiß, klare Sans-Serif, Bilder von Wasser/Booten). Eigenes `PublicLayout` mit Top-Bar, Hauptnavi, Footer mit Kontakt/Impressum-Stub.

## 6. Reihenfolge der Umsetzung

1. Backend: User-Rolle CAPTAIN, Modelle (tour_type, public_tour, ticket, captain_absence, payment), Migrationen
2. Backend: Auto-Zuordnungs-Service + Endpoints
3. Frontend intern: tour-types CRUD, public-tours Verwaltung, Captain-Abwesenheiten
4. Frontend öffentlich: PublicLayout + Landing + Touren-Übersicht + Detail/Slot-Buchung + Charter-Formular
5. Paddle aktivieren, Produkte anlegen, Checkout + Webhook verdrahten
6. CD-Feinschliff, Smoke-Test

## Hinweise
- Großes Vorhaben – Umsetzung in mehreren Schritten, nach Punkt 1+2 erste Sichtprüfung empfohlen.
- Paddle-Aktivierung erfordert eine separate Bestätigung von dir im Lovable-UI.
- Bestehende SQLite-Tests werden für neue Modelle ergänzt.
