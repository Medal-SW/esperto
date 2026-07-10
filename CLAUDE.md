# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@design.md

## Project Overview

**Esperto** — Game ranking platform for a friend group that plays 3 daily word games: **Conexo**, **Letroso**, **Expresso**. Users register how many attempts they needed to solve each game daily. The system determines winners, daily champions, and maintains leaderboards.

## Commands

Most commands available via `make`. Run `make <target>` from the project root.

### Dev
```bash
make dev              # docker compose up --build (foreground)
make dev-d            # same, detached
make down             # stop dev containers
make logs             # tail all logs
make logs-back        # tail backend only
make logs-front       # tail frontend only
```
- Frontend: http://localhost:5173
- Backend API: http://localhost:8000/api
- API docs: http://localhost:8000/docs

### Production
```bash
make prod             # build & start prod (nginx + gunicorn, port 80)
make down-prod        # stop prod containers
```

### Database & migrations
```bash
make migrate          # alembic upgrade head
make migration        # create new migration (prompts for message)
make seed             # seed dev data
```
Seed creates admin user (`admin`/`admin123`), 7 sample players (password `1234`), and ~45 days of score history.

### Other
```bash
make typecheck        # frontend tsc --noEmit
make shell-back       # bash into backend container
make shell-front      # sh into frontend container
make clean            # down + remove volumes & local images
```

## Architecture

**Stack**: Python 3.12 FastAPI + React 19 TypeScript + PostgreSQL 16, all in Docker.

### Backend (`backend/app/`)

Entity-based module structure with repository pattern:

```
app/
├── main.py              # FastAPI app, mounts all routers under /api
├── config.py            # Settings (env-based), MANAUS_TZ, today_manaus()
├── database.py          # SQLAlchemy engine, SessionLocal, Base, get_db()
├── enums.py             # GameName enum (conexo, letroso, expresso)
├── exceptions.py        # Domain exceptions (NotFoundError, ForbiddenError)
├── models.py            # Re-exports User and Score for Alembic discovery
├── auth/                # signup, login, JWT, avatar upload/delete
│   ├── dependencies.py  # get_current_user, get_admin_user (Depends)
│   ├── service.py       # hash_password, verify_password, JWT encode/decode
│   └── router.py        # /auth/* endpoints
├── users/               # User model, repository, schemas
├── scores/              # Score model, repository, service (upsert + edit window), router
├── ranking/             # Aggregation logic: victories, champions, streaks, records, compare
├── dashboard/           # Dashboard endpoint: triad, highlights, champion, friend activity
└── admin/               # Admin-only score editing and user deletion
```

**Pattern**: Router → Service → Repository → Model. Services contain business logic; repositories handle DB queries.

**Alembic**: `alembic/env.py` imports `app.models` to register all models with `Base.metadata`. The `sqlalchemy.url` in `alembic.ini` is overridden by `settings.database_url` in env.py.

### Frontend (`frontend/src/`)

```
src/
├── main.tsx             # React root: QueryClient, BrowserRouter, ThemeProvider, ToastProvider, AuthProvider
├── App.tsx              # Routes: /login, /dashboard, /submit, /ranking, /history, /profile
├── api/
│   ├── client.ts        # Axios instance with JWT interceptor, auto-redirect on 401
│   └── hooks.ts         # TanStack Query hooks (all API calls go through here)
├── context/
│   ├── AuthContext.tsx   # Auth state, login/signup/logout/refreshUser
│   ├── ThemeContext.tsx  # Dark/light theme toggle (data-theme attribute)
│   └── ToastContext.tsx  # Global toast notifications
├── components/          # Avatar, AvatarCropModal, Card, CompareModal, Confetti, ErrorBoundary, GameDot, Layout, Skeleton
├── pages/               # Dashboard, Submit, Ranking, History, Login, Profile (each with .module.css)
├── types/index.ts       # All TypeScript interfaces and enums
└── styles/global.css    # CSS variables (dark theme), reset
```

**State management**: TanStack Query for server state, React Context for auth and toasts. No Redux/Zustand.

**Styling**: CSS Modules (`.module.css` per component/page) with CSS custom properties defined in `global.css`. Dark/light theme via CSS custom properties and `data-theme` attribute.

**Routing**: react-router-dom v7. `Layout` component wraps authenticated routes (topbar nav on desktop + bottom tab bar on mobile).

## Business Rules

These are critical invariants — do not change without explicit user approval:

1. **Victory per game**: Lowest attempts wins. Ties = shared victory (all tied players win).
2. **Daily champion**: Most game victories among players who completed all 3 games (triad). Tiebreak: lowest total attempts. Persistent tie = shared championship.
3. **Score registration**: Users register only their own scores, only for the current day (America/Manaus timezone). Editable until midnight Manaus. No backfill.
4. **Timezone**: All day boundaries use `America/Manaus` (UTC-4, no DST). Never use server local time or UTC for day calculations.
5. **Win streak**: Consecutive days where user won at least 1 individual game (not daily champion).
6. **Play streak**: Consecutive days where user registered at least 1 score.
7. **`played_date`**: Always set server-side via `today_manaus()`, never from client input.

## Key Conventions

- Backend uses SQLAlchemy 2.0 `Mapped` columns (not legacy `Column()`).
- All API routes are prefixed with `/api` in `main.py`.
- Frontend proxy: Vite proxies `/api` and `/uploads` to the backend container.
- Avatar files stored in Docker volume at `/app/uploads/avatars/`, served via FastAPI `StaticFiles`.
- UI text is in Brazilian Portuguese.
- The `app/models.py` file exists solely to re-export models for Alembic — add new models there.
