# Repository Guidelines

## Project Structure & Module Organization

This repository contains a Vite React frontend and a FastAPI backend. Frontend source lives in `src/`: pages in `src/pages`, layout in `src/components/layout`, domain components in `src/components/boats`, `src/components/calendar`, and `src/components/captains`, shadcn UI primitives in `src/components/ui`, hooks in `src/hooks`, types in `src/types`, and styles in `src/styles`. Static assets are in `public`.

Backend code is under `bootstrap-manager-backend/app`, organized by `api/routes`, `services`, `repositories`, `models`, `domain`, `middleware`, and `db`. Tests live in `bootstrap-manager-backend/tests`; planning docs are in `docs`.

## Build, Test, and Development Commands

- `npm i`: install frontend dependencies.
- `npm run dev`: start the Vite development server.
- `npm run build`: create the production frontend build in `dist`.
- `npm run lint`: run ESLint over TypeScript and TSX files.
- `cd bootstrap-manager-backend && pip install -r requirements.txt`: install backend dependencies.
- `cd bootstrap-manager-backend && uvicorn app.main:app --reload`: run the API locally on port 8000.
- `cd bootstrap-manager-backend && pytest`: run backend tests.
- `cd bootstrap-manager-backend && docker compose up --build`: start Postgres and the API together.

## Coding Style & Naming Conventions

Use TypeScript, React function components, and existing shadcn/Radix patterns. Name exported component files in `PascalCase`, such as `BoatModal.tsx`; hooks use `use-*` or `useSomething`; utility modules use lower camel case, such as `dataService.ts`. Prefer Tailwind utilities and `src/lib/utils.ts` for class composition. ESLint enforces recommended JS/TypeScript, React Hooks, and React Refresh rules.

For Python, keep route modules thin, put business logic in services, and persistence in repositories. Use `snake_case` for Python files, functions, and variables.

## Testing Guidelines

Backend tests use pytest with discovery configured in `bootstrap-manager-backend/pytest.ini`: files named `test_*.py`, classes named `Test*`, and functions named `test_*`. Add tests in `bootstrap-manager-backend/tests`. Tests use SQLite via `DATABASE_URL=sqlite:///./test_temp.db`. There is no frontend test script, so use `npm run lint` and `npm run build` for frontend verification.

## Commit & Pull Request Guidelines

Recent history uses Conventional Commit prefixes such as `feat:`, `docs:`, and `chore:`. Keep commits focused and written in the imperative mood, for example `feat: add booking conflict validation`.

Pull requests should include a short summary, testing performed, linked issue or task when available, and screenshots for UI changes. Note configuration changes, especially updates to `.env.example`, Docker, or API settings.

## Security & Configuration Tips

Backend settings are loaded from environment variables and `.env`. Do not commit real secrets. Use `.env.example` for documented defaults and set a production `JWT_SECRET_KEY` outside source control.
