
# Admin-Erweiterungen

Ziel: Admin/Backoffice bekommt saubere, getrennte Verwaltungs­ansichten für öffentliche Rundfahrten und Events, vollständige Editier­barkeit, Serien­termine, einen funktionierenden Kalender und deutlich erweiterte Berichte.

## 1. Öffentliche Termine aufteilen

- Reiter "Öffentliche Termine" zeigt **nur** Rundfahrten (Tour-Typ-Kategorie `rundfahrt`).
- Neuer Reiter "Events / Sondertouren" für alle übrigen Tour-Typen (Cliquentouren, Themen­fahrten, …).
- In beiden Listen statt `captainId` und `boatId` die **Namen** anzeigen.
- Beide Listen oben mit Filtern: Zeitraum (von/bis), Boot, Bootsführer, Tour-Typ, Status.
- Jeder Termin bearbeitbar (Boot, Bootsführer, Start/Ende, Plätze, Status) per Edit-Dialog. Auto-Zuweisung des Bootsführers bleibt Default, ist aber überschreibbar.

## 2. Serientermine

- Im "Neuer Termin"-Dialog Option "Serie" mit:
  - Wiederholung: täglich / wöchentlich (gewählte Wochentage).
  - Anzahl Termine pro Tag (z. B. 2 für Sommer, 1 für Übergang).
  - Zeitraum von/bis.
  - Uhrzeiten je Termin.
- Backend bekommt Endpoint `POST /public-tours/series`, der die Einzeltermine erzeugt und Bootsführer pro Termin zuweist.
- Einzeltermine können **abgesagt** werden mit Pflichtfeld "Begründung" (z. B. Wetter). In Listen und Kalender als "Abgesagt – {Grund}" rot markiert.

## 3. Kalender

- Aktuell zeigt der Kalender nur private Buchungen. Erweitern, sodass auch alle öffentlichen Touren (Rundfahrten + Events) als Events erscheinen, farblich unterschieden:
  - Privatcharter, Rundfahrt, Event, Abgesagt.
- Titel zeigt Tour-Typ, Boot-Name, Auslastung (z. B. "Rundfahrt · Vechtesonne · 12/20").
- Klick öffnet die passende Detail/Edit-Ansicht.

## 4. Berichte mit Unterseiten

Neue Tab-Struktur unter `/reports`:

1. **Finanzen** (bestehende Kostensicht erweitert)
   - Umsatz nach Zeitraum, Tour-Typ, Boot, Zahlungsart (online vs. vor Ort).
   - Kosten vs. Umsatz, Deckungsbeitrag.
2. **Events / Touren**
   - Welcher Tour-Typ wie oft gebucht, Auslastung %, Umsatz, Stornoquote.
   - Top-Events Ranking.
3. **Personal (Bootsführer)**
   - Anzahl Einsätze pro Bootsführer, Stunden, Auslastung, Abwesenheiten.
4. **Boote**
   - Einsätze pro Boot, Auslastung (gefahrene vs. mögliche Slots), Sitz­auslastung Ø, Wartung/Verfügbarkeit.
5. **Kunden** (optional, sinnvoll)
   - Wiederkehrende Kunden, Top-Kunden nach Umsatz.

Alle Unterseiten mit dynamischen Filtern: Zeitraum, Boot, Bootsführer, Tour-Typ, Zahlungsart.

## Technische Details

### Backend (`bootstrap-manager-backend/`)

- `models/db.py` / `schemas.py`:
  - `TourType` bekommt Feld `category: "rundfahrt" | "event"`.
  - `PublicTour` bekommt `cancellation_reason: str | None`, Status-Enum erweitert um `cancelled_weather` o. ä. (oder einfach `status=cancelled` + reason).
- Routen `public_tours.py`:
  - `GET /public-tours` mit Query-Filtern `from`, `to`, `boat_id`, `captain_id`, `tour_type_id`, `category`, `status`.
  - `PATCH /public-tours/{id}` für Editieren (Boot, Captain, Zeiten, Plätze).
  - `POST /public-tours/{id}/cancel` mit `reason`.
  - `POST /public-tours/series` für Serien­anlage.
- Neue Aggregations-Endpoints unter `routes/reports.py`:
  - `/reports/finance`, `/reports/tours`, `/reports/captains`, `/reports/boats`, `/reports/customers` mit gleichen Filtern.

### Frontend (`src/`)

- `pages/admin/PublicTours.tsx` → split in
  - `pages/admin/PublicTours.tsx` (Rundfahrten),
  - `pages/admin/PublicEvents.tsx` (Events),
  - geteilte Komponente `components/admin/PublicTourTable.tsx` mit Filterleiste, Edit-Dialog, Cancel-Dialog, Serien-Dialog.
- Navigation um Eintrag "Events" ergänzen.
- `lib/api.ts`: neue Methoden `updatePublicTour`, `cancelPublicTourWithReason`, `createPublicTourSeries`, Reports-Endpoints.
- `components/calendar/BookingCalendar.tsx`: zusätzlich `api.listPublicTours()` laden und in Events mappen, Farbcodes pro Typ.
- `pages/Reports.tsx` → Tabs (Finanzen / Events / Personal / Boote / Kunden), jede Tab-Komponente mit Filterleiste + Charts/Tabellen (recharts ist bereits vorhanden).

## Reihenfolge der Umsetzung

1. Backend-Schema + Endpoints (Filter, Patch, Cancel, Series, Reports).
2. Frontend Admin-Tour-Verwaltung (Split, Filter, Edit, Cancel, Serie, Namen statt IDs).
3. Kalender mit allen Terminen.
4. Berichte mit Unterseiten und Filtern.
5. Navigation / Routing aufräumen.

## Offene Frage

Soll ich **alle 5 Bereiche** in einem Rutsch umsetzen (großer Patch), oder bevorzugst du, dass ich Schritt 1+2 (Admin-Touren/Events inkl. Serie & Cancel) zuerst liefere und Kalender + Berichte danach in einer zweiten Runde? Bei "alles auf einmal" wird die Antwort entsprechend groß und braucht länger pro Iteration.
