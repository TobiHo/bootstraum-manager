# Bootstour Manager

Ein modernes Buchungssystem für Bootstouren der VVV Nordhorn. Verwalten Sie Boote, Bootsführer, Buchungen und Benutzer mit einer benutzerfreundlichen Web-Oberfläche.

## Features

- 📅 **Interaktiver Kalender** – Monatliche, wöchentliche und tägliche Ansichten
- 🚤 **Bootverwaltung** – Erstellen, bearbeiten und verwalten Sie Ihre Flotte
- 👥 **Bootsführer-Management** – Verwalten Sie qualifizierte Operatoren und deren Boot-Zuweisungen
- 📦 **Buchungsverwaltung** – Ganz-/ Tagestouren mit Verfügbarkeitsprüfung
- 🔐 **Rollenbasierte Zugriffskontrolle** – Admin, Staff, und Kundenzugriff
- 👤 **Benutzerverwaltung** – Admin-Interface zur Benutzerverwaltung
- 🎨 **Responsive Design** – Optimiert für Desktop und Mobile

## Tech Stack

### Frontend
- React 18 + TypeScript
- Vite (Build-Tool)
- TanStack Query (Datenabruf)
- React Router (Navigation)
- Tailwind CSS (Styling)
- shadcn/ui (Komponenten)
- React Big Calendar (Kalender)

### Backend
- FastAPI (Python)
- PostgreSQL (Datenbank)
- SQLAlchemy ORM
- Pydantic (Datenvalidierung)
- JWT-Authentifizierung

## Getting Started

### Voraussetzungen
- Node.js 18+ (Frontend)
- Python 3.9+ (Backend)
- Docker & Docker Compose (PostgreSQL)

### Installation

**1. Repository klonen**
```bash
git clone <repository-url>
cd bootstraum-manager
```

**2. Backend einrichten**
```bash
cd bootstrap-manager-backend
python -m venv venv
source venv/bin/activate  # macOS/Linux
# oder: venv\Scripts\activate  # Windows

pip install -r requirements.txt
```

**3. Datenbank starten**
```bash
docker compose up -d postgres
```

**4. Backend starten**
```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Backend läuft auf: http://localhost:8000

**5. Frontend einrichten & starten**
```bash
cd ../
npm install
npm run dev
```

Frontend läuft auf: http://localhost:8080

### Admin-Benutzer erstellen

Ersten Admin-User via API registrieren:
```bash
curl -X POST http://localhost:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@example.com",
    "password": "securepassword",
    "name": "Administrator",
    "role": "admin"
  }'
```

Dann im Frontend anmelden unter: http://localhost:8080/login

## API Dokumentation

Swagger UI: http://localhost:8000/docs

## Projekt-Struktur

```
bootstraum-manager/
├── bootstrap-manager-backend/   # FastAPI Backend
│   ├── app/
│   │   ├── main.py             # App-Einstiegspunkt
│   │   ├── models/             # SQLAlchemy ORM & Pydantic Schemas
│   │   ├── api/routes/         # API-Endpoints
│   │   ├── services/           # Business Logic
│   │   └── repositories/       # Datenzugriff
│   ├── .env                    # Umgebungsvariablen
│   ├── requirements.txt        # Python-Dependencies
│   └── docker-compose.yml      # PostgreSQL-Setup
│
├── src/                        # React Frontend
│   ├── components/             # React-Komponenten
│   │   ├── calendar/          # Kalender-Logik
│   │   ├── layout/            # Layout-Komponenten
│   │   └── ui/                # shadcn/ui Komponenten
│   ├── pages/                 # Seiten (Boote, Bootsführer, Benutzer, etc.)
│   ├── contexts/              # React Contexts (Auth)
│   ├── lib/                   # Hilfsfunktionen (API-Client)
│   ├── styles/                # CSS & Tailwind
│   └── main.tsx               # App-Einstiegspunkt
│
├── index.html                 # HTML-Vorlage
├── vite.config.ts             # Vite-Konfiguration
├── tailwind.config.ts         # Tailwind-Konfiguration
└── package.json               # Node-Dependencies
```

## Lizenz

Intern – VVV Nordhorn

## Support

Bei Fragen oder Problemen wenden Sie sich an den Projektverantwortlichen.
