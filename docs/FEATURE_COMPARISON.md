# Feature-Vergleich: Anforderung vs. Implementierung

**Datum:** 2026-04-30  
**Quelle:** travelmanager-Anforderungen  
**Stand:** Nach MVP (Phase 1)

---

## 1. BOOTE & KAPAZITÄT

### Anforderung
"Wir haben vier Rundfahrboote mit unterschiedlichen Kapazitäten (14, 20, 25, 25 Personen)"

| Feature | Anforderung | MVP | Status |
|---------|-------------|-----|--------|
| Boote verwalten | 4 Boote definieren | ✅ Liste mit 4 Booten | ✅ DONE |
| Kapazität speichern | 14, 20, 25, 25 Personen | ✅ capacity: int | ✅ DONE |
| Kapazität prüfen bei Buchung | "Platz für X Gäste?" | ✅ Validierung im Booking Service | ✅ DONE |
| Boot-Typ definieren | "Ausflugsschiff", "Wassertaxi", etc. | ✅ type: string | ✅ DONE |
| Boot-Beschreibung | Details für Gäste | ✅ description: string | ✅ DONE |
| Verfügbarkeit (an/aus) | Boot zeitweise sperren | ✅ available: bool | ✅ DONE |

**Fazit:** ✅ **100% implementiert**

---

## 2. TOUREN-TYPEN & VARIANTEN

### Anforderung
"Die Boote fahren entweder als exklusive Gruppentour oder als öffentliche Rundfahrt auf der Einzelplätze verkauft werden. Es gibt verschiedene Varianten, die gebucht werden können."

| Feature | Anforderung | MVP | Status |
|---------|-------------|-----|--------|
| Gruppentour buchen | "Ganzes Boot nur für diese Gruppe" | ⚠️ Nur als "Booking" modelliert | ❌ TODO |
| Öffentliche Rundfahrt | "Einzelplätze verkaufen" | ❌ Nicht unterschieden | ❌ TODO |
| Varianten definieren | "Standard", "Premium", "Family" | ❌ Nicht vorhanden | ❌ TODO |
| Varianten-Preise | Jede Variante hat Preis | ❌ Kein Preis-Modell | ❌ TODO |
| Varianten pro Tour | Welche Varianten an diesem Datum? | ❌ Nicht vorhanden | ❌ TODO |

**Fazit:** ❌ **0% implementiert** — Kritisch für Ticketing!

---

## 3. TICKETING & VERKAUFSKANÄLE

### Anforderung
"Es sollen Tickets online, am Schalter und am Boot verkauft werden können. Die Kapazität muss aktuell sein."

| Feature | Anforderung | MVP | Status |
|---------|-------------|-----|--------|
| **Online-Ticket-Shop** | Kunden buchen direkt online | ❌ Keine Shop-UI | ❌ TODO |
| Verfügbarkeit online zeigen | "Noch 5 Plätze frei" | ⚠️ API hat Daten, keine Public UI | ⚠️ PARTIAL |
| **Schalter-Modus** | Staff verkauft Tickets am Schalter | ❌ Keine separate UI | ❌ TODO |
| **Boot-Modus** | Bootsführer verkauft am Boot | ❌ Keine Mobile-App | ❌ TODO |
| Live-Kapazität aktualisieren | Real-time Plätze-Update | ⚠️ API verfügbar, UI fehlt | ⚠️ PARTIAL |
| Kapazität korrekt | "Nicht überbuchbar" | ✅ Constraint in DB | ✅ DONE |

**Fazit:** ⚠️ **30% implementiert** — Backend OK, Frontend fehlt komplett

---

## 4. ZAHLUNGEN

### Anforderung
"Travelmanager hat hier z.B. eine App über die die Bootsführer... auch EC Zahlungen einnehmen können."

| Feature | Anforderung | MVP | Status |
|---------|-------------|-----|--------|
| Zahlungs-Tracking | Welche Buchung bezahlt? | ❌ Nicht modelliert | ❌ TODO |
| Payment-Modell | payment_method, status, amount | ❌ Nicht vorhanden | ❌ TODO |
| EC-Terminal Integration | Ingenico/Worldline APIs | ❌ Nicht vorhanden | ❌ TODO |
| Offline-Zahlungen | Cash, am Schalter | ❌ Nicht vorhanden | ❌ TODO |
| Online-Zahlungen | Stripe, PayPal | ❌ Nicht vorhanden | ❌ TODO |
| Zahlungs-Audit-Log | Wer hat bezahlt wann? | ❌ Nicht vorhanden | ❌ TODO |

**Fazit:** ❌ **0% implementiert** — Muss aufgebaut werden

---

## 5. BOOTSFÜHRER-APP

### Anforderung
"Travelmanager hat... eine App über die die Bootsführer Tickets buchen können, die freien Kapazitäten einsehen können"

| Feature | Anforderung | MVP | Status |
|---------|-------------|-----|--------|
| **Mobile App** | Für Bootsführer | ❌ Nur Web-UI | ❌ TODO |
| Tickets buchen (Skipper) | Bootsführer verkauft Ticket | ❌ Nur über Admin-UI | ❌ TODO |
| Kapazitäts-Einsicht (Live) | "5 Plätze noch frei" | ⚠️ API hat Daten | ⚠️ PARTIAL |
| EC-Zahlungen am Boot | Terminal am Boot | ❌ Nicht vorhanden | ❌ TODO |
| QR-Code Scanning | Check-in mit Ticket-QR | ❌ Nicht vorhanden | ❌ TODO |
| Offline-Modus | App funktioniert ohne Internet | ❌ Web-basiert, online only | ❌ TODO |

**Fazit:** ❌ **10% implementiert** — App fehlt komplett

---

## 6. DIENSTPLÄNE & SCHICHTPLANUNG

### Anforderung
"Es müssen Dienstpläne für die Bootsführer erstellt werden, hier wäre uns wichtig, dass man immer schnell erkennen kann auf welchem Boot noch ein Fahrer fehlt."

| Feature | Anforderung | MVP | Status |
|---------|-------------|-----|--------|
| **Schichtplan-Modell** | Wer fährt wann welches Boot? | ❌ Nicht vorhanden | ❌ TODO |
| Dienstplan-Editor | Drag&Drop oder Form | ❌ Keine UI | ❌ TODO |
| Status-Bubbles | "Boot 1: Skipper fehlt" | ❌ Nicht vorhanden | ❌ TODO |
| Skipper-Verfügbarkeit | "Max 8h pro Tag" | ❌ Nicht vorhanden | ❌ TODO |
| Automatische Warnungen | "Boot übernächste Woche unterbesetzt" | ❌ Nicht vorhanden | ❌ TODO |
| Skipper können ablehnen | Schicht ablehnen → Status aktualisiert | ❌ Nicht vorhanden | ❌ TODO |

**Fazit:** ❌ **0% implementiert** — Muss neu aufgebaut werden

---

## 7. BENUTZERFREUNDLICHKEIT

### Anforderung
"Das Programm wird von vielen Mitarbeitern bedient. Es sollte nicht zu kompliziert sein und es muss automatisch eingetragene Änderungen speichern."

| Feature | Anforderung | MVP | Status |
|---------|-------------|-----|--------|
| Multi-User Support | Mehrere Mitarbeiter gleichzeitig | ✅ JWT Auth, Rollen | ✅ DONE |
| Rollen-System | Admin/Staff/Customer | ✅ RBAC im Code | ✅ DONE |
| Einfache Bedienung | Nicht zu kompliziert | ⚠️ Basis-UI, aber Feature-arm | ⚠️ PARTIAL |
| Auto-Save | Änderungen speichern sich von selbst | ❌ Nur nach Form-Submit | ❌ TODO |
| Offline-Modus | Funktioniert ohne Internet | ❌ Nein, online-only | ❌ TODO |
| Fehler-Anzeigen | Visuelle Indikatoren (rot) | ⚠️ Basis-Fehlerbehandlung | ⚠️ PARTIAL |

**Fazit:** ⚠️ **50% implementiert** — Auto-Save fehlt kritisch

---

## 8. STATISTIKEN & REPORTING

### Anforderung
"Schön wäre, wenn man auch Statistiken ziehen könnte (Gästezahlen, Stunden Bootsführer usw.)"

| Feature | Anforderung | MVP | Status |
|---------|-------------|-----|--------|
| Gästezahlen | Pro Tag, Woche, Monat, Boot | ❌ Keine Auswertung | ❌ TODO |
| Bootsführer-Stunden | Wer hat wie viele Stunden gefahren? | ❌ Nicht getrackt | ❌ TODO |
| Auslastungs-Statistiken | % volle Boote | ❌ Nicht vorhanden | ❌ TODO |
| Revenue-Tracking | Umsatz pro Boot/Variante | ❌ Kein Preis-Modell | ❌ TODO |
| Charts & Grafiken | Visuelle Darstellung | ❌ Nicht vorhanden | ❌ TODO |
| CSV/PDF Export | Daten exportierbar | ❌ Nicht vorhanden | ❌ TODO |

**Fazit:** ❌ **0% implementiert** — Reporting-System muss aufgebaut werden

---

## ZUSAMMENFASSUNG

| Bereich | % Implementiert | Status | Kritikalität |
|---------|-----------------|--------|--------------|
| 1. Boote & Kapazität | **100%** | ✅ DONE | - |
| 2. Touren-Typen & Varianten | **0%** | ❌ TODO | 🔴 KRITISCH |
| 3. Ticketing & Verkaufskanäle | **30%** | ⚠️ PARTIAL | 🔴 KRITISCH |
| 4. Zahlungen | **0%** | ❌ TODO | 🔴 KRITISCH |
| 5. Bootsführer-App | **10%** | ❌ TODO | 🔴 KRITISCH |
| 6. Dienstpläne & Bubbles | **0%** | ❌ TODO | 🟠 HOCH |
| 7. Benutzerfreundlichkeit | **50%** | ⚠️ PARTIAL | 🟠 MITTEL |
| 8. Statistiken | **0%** | ❌ TODO | 🟡 MITTEL |
| | | | |
| **GESAMT** | **23%** | | |

---

## PRIORITÄT FÜR NÄCHSTE PHASE

### 🔴 KRITISCH (Blockers für Betrieb)
1. **Touren-Typen & Varianten** — Ohne das kein realistisches Ticketing
2. **Ticketing-Shop** (Online + Schalter) — Kernfunktion
3. **Bootsführer-App** — Für Boot-Verkauf notwendig
4. **Zahlungs-Modell** — Muss für alle 3 Kanäle funktionieren

### 🟠 HOCH (Arbeitsablauf optimiert)
5. **Schichtplanung + Status-Bubbles** — Schnelle Übersicht fehlt
6. **Auto-Save** — UX-Killer sonst

### 🟡 MITTEL (Nice to have, später)
7. **Statistiken** — Management-Feature
8. **EC-Terminal Integration** — Payment-Komplexität

---

## NÄCHSTE SCHRITTE

1. ✅ Diese Übersicht mit Stakeholder durchgehen
2. ✅ Priorisierung bestätigen
3. ✅ Detaillierte Task-Listen schreiben (siehe TODO_LISTS.md)
4. ✅ Agenten-Plan für Entwicklung (siehe AGENT_PLAN.md)

---

**Status:** Ready for Phase 2 Planning
