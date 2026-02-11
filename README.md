# FitZone Conquer

FitZone Conquer is a **location-based, gamified fitness platform** where real movement (walk, run, cycle) becomes map progress, XP, and territory control.

Instead of treating workouts as isolated sessions, FitZone turns your city into an interactive game board: you track activity in real time, capture zones, defend them, and use an AI coach to keep momentum and consistency.

---

## Table of Contents

- [Why this project exists](#why-this-project-exists)
- [What problem it solves](#what-problem-it-solves)
- [Core product concept](#core-product-concept)
- [How FitZone works](#how-fitzone-works)
- [Feature breakdown](#feature-breakdown)
- [System architecture](#system-architecture)
- [Data model (Supabase)](#data-model-supabase)
- [Tech stack](#tech-stack)
- [Getting started](#getting-started)
- [Environment variables](#environment-variables)
- [Runbook](#runbook)
- [Testing and quality checks](#testing-and-quality-checks)
- [Deployment notes](#deployment-notes)
- [Comparable products and research landscape](#comparable-products-and-research-landscape)
- [Roadmap ideas](#roadmap-ideas)
- [Ethics, safety, and privacy notes](#ethics-safety-and-privacy-notes)

---

## Why this project exists

Many people struggle with fitness consistency, not because they lack information, but because they lack:

- Immediate feedback
- Emotional engagement
- Social/game motivation
- A sense of visible progress in the real world

FitZone Conquer addresses this by combining:

1. **Geospatial gameplay** (zones on a live map)
2. **Behavioral reinforcement** (XP, levels, streak loops)
3. **Coaching support** (AI-generated guidance + fallback rule-based coach)

---

## What problem it solves

### User pain points

- "Workouts feel repetitive and boring"
- "I start strong, then stop after a week"
- "I don’t know where to train nearby"
- "I need motivation that adapts to my day and energy"

### Product response

FitZone reframes movement as conquest progression:

- Every tracked session contributes to map influence and stats.
- Nearby zones and map points create context-specific micro-goals.
- AI coach guidance can adapt to time-of-day, profile, and progress.
- Streak and XP loops incentivize continuity over perfection.

---

## Core product concept

**“Conquer territory by moving in real life.”**

Players can:

- Track activities (walk / run / cycle)
- See routes and distance in real time
- Earn XP and level up
- Interact with map zones (owned vs rival zones)
- Use AI-assisted zone selection and coaching

This blends fitness tracking, map interaction, and light strategy into one engagement loop.

---

## How FitZone works

1. **User signs in** and completes onboarding (fitness profile + preferences).
2. **Activity tracking starts** using browser geolocation.
3. **Path, distance, calories, loops, and duration** update live.
4. **XP progression updates** based on completed activity.
5. **Map layer shows zones** and nearby places (gym / park / trail style points).
6. **Zone decision service** can recommend the best next zone to target.
7. **AI coach** provides motivational and practical responses based on user context.

---

## Feature breakdown

### 1) Territory map and zone interactions

- OSM-compatible tile rendering
- Toggle-able map layers (standard / terrain / high-contrast style)
- User recentering and zoom controls
- Zone selection and challenge affordances
- Nearby place overlays

### 2) Activity tracker

- Start/pause/resume/stop sessions
- Run/walk/cycle modes
- Live GPS path rendering
- Real-time timing, distance, loop count, and calorie estimates
- Post-session XP summary feedback

### 3) AI coach (modular)

- Frontend service is provider-agnostic
- Primary path: Python backend (`/ai-coach`)
- Secondary path: Supabase edge function
- Final fallback: deterministic rule-based coaching messages
- Prompts emphasize concise, motivational, non-medical coaching

### 4) AI zone recommendation

- Backend endpoint (`/zone-decision`) scores candidate zones
- Uses weighted heuristic features:
  - distance suitability
  - ownership opportunity
  - level matching
  - streak momentum
  - time-of-day bonus
- Optional LLM sentence generation explains *why* a zone is recommended

### 5) Persistent data and auth

- Supabase auth + session persistence
- RLS-secured tables for profile, stats, activities, zones, captures, and coach chat
- Auto profile/stat provisioning trigger on signup

---

## System architecture

### Frontend (React + Vite)

- Routing for public and protected flows
- UI/state driven by hooks and Zustand
- Live geolocation and map rendering
- Fitness stats, zone interactions, and AI coach chat surfaces

### Backend (FastAPI + LangChain + LangGraph)

- `/health` for service health checks
- `/ai-coach` for contextual coach completions
- `/zone-decision` for zone scoring and recommendation explanation
- Gemini model integration via environment variables

### Data layer (Supabase)

- Auth users + application profile model
- Track activity records and zone history
- Store AI coach message history per user
- Enforce row-level security policies

---

## Data model (Supabase)

Main tables:

- `profiles`
- `user_stats`
- `activities`
- `zones`
- `zone_captures`
- `ai_coach_messages`

Key behavior:

- Trigger `handle_new_user` creates profile + baseline stats at signup.
- Trigger `update_updated_at_column` maintains audit timestamps.
- RLS policies isolate personal data while allowing map-wide zone visibility.

---

## Tech stack

### Frontend

- React 18 + TypeScript
- Vite
- Tailwind CSS + shadcn/ui + Radix UI
- Zustand for local app state
- React Query
- Supabase JS SDK

### Backend

- Python + FastAPI
- LangChain + LangGraph
- Google Gemini (via `langchain_google_genai`)
- Uvicorn

### Infra/data

- Supabase (Auth + Postgres + RLS)
- OSM-compatible raster tile providers (or self-hosted map tiles)

---

## Getting started

### Prerequisites

- Node.js 18+
- npm
- (Optional) Python 3.10+ for AI backend
- (Optional) Docker for containerized backend

### 1) Frontend setup

```bash
git clone <your-repo-url>
cd fitzoneconquer
npm install
```

Create `.env` in project root:

```bash
VITE_OSM_TILE_BASE_URL=https://tile.openstreetmap.org
VITE_AI_COACH_URL=http://localhost:8000
```

Run frontend:

```bash
npm run dev
```

### 2) Backend setup (local Python)

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create `backend/.env`:

```bash
GEMINI_API_KEY=your_key_here
GEMINI_MODEL=gemini-2.5-flash
GEMINI_TEMPERATURE=0.6
```

Run API:

```bash
uvicorn main:app --reload --port 8000
```

### 3) Backend setup (Docker)

```bash
cd backend
docker build -t fitzone-ai-coach .
docker run --env-file .env -p 8000:8000 fitzone-ai-coach
```

---

## Environment variables

### Frontend (`.env`)

| Variable | Required | Purpose |
|---|---:|---|
| `VITE_OSM_TILE_BASE_URL` | Recommended | Base URL for raster map tiles (`/{z}/{x}/{y}.png`). |
| `VITE_AI_COACH_URL` | Recommended | Base URL for Python AI backend (`http://localhost:8000` by default). |

### Backend (`backend/.env`)

| Variable | Required | Purpose |
|---|---:|---|
| `GEMINI_API_KEY` | Yes | API key used by `langchain_google_genai`. |
| `GEMINI_MODEL` | No | Gemini model name (`gemini-2.5-flash` default). |
| `GEMINI_TEMPERATURE` | No | Generation temperature (`0.6` default). |

---

## Runbook

### Frontend scripts

```bash
npm run dev        # start dev server
npm run build      # production build
npm run preview    # preview built app
npm run lint       # eslint checks
npm run test       # vitest run
```

### Backend endpoints

- `GET /health` → `{ "status": "ok" }`
- `POST /ai-coach` → contextual coaching response
- `POST /zone-decision` → best-zone recommendation + reason

---

## Testing and quality checks

Recommended local verification:

1. `npm run lint`
2. `npm run test`
3. `npm run build`
4. `curl http://localhost:8000/health` (with backend running)

---

## Deployment notes

### Frontend

- Deploy to Vercel / Netlify / Cloudflare Pages / static hosting.
- Set frontend env vars in your host dashboard.

### Backend

- Deploy container or Python app to Render / Railway / Fly.io / Cloud Run.
- Configure `GEMINI_*` secrets at host level.
- CORS is currently permissive; tighten for production domains.

### Map tiles

For production, prefer paid managed tile services or self-hosted tiles + CDN.
Avoid heavy traffic on public OSM tile servers.

---

## Comparable products and research landscape

> Note: this section is intended for product benchmarking and literature context for the FitZone concept.

### Similar apps / products

- **Strava** (social fitness, segments, leaderboards)
- **Zombies, Run!** (narrative-driven running motivation)
- **Pokémon GO** (location-based game with walking incentives)
- **Ingress** (territory/control map gameplay)
- **Sweatcoin** (movement-to-reward model)
- **Nike Run Club / Adidas Running** (guided training + community + progress loops)

### Useful research themes to reference

- Gamification can improve engagement and adherence in physical activity interventions.
- Location-based games may increase incidental walking/activity.
- Personalized, context-aware coaching can improve habit continuity.

### Example papers/topics worth reviewing further

- Althoff, White, Horvitz (2016), *Influence of Pokémon Go on Physical Activity: Study and Implications*.
- Systematic reviews on **gamification and physical activity outcomes** in digital health.
- Reviews on **AI coaching / conversational agents** for behavior change in fitness and health.

If you plan to publish or validate outcomes, add a formal bibliography and define measurable KPIs (retention, weekly active users, average distance/session, streak survival, etc.).

---

## Roadmap ideas

- Real-time multiplayer zone conflicts
- Guilds/teams and cooperative territory defense
- Anti-cheat detection for GPS spoofing
- Rich seasonal events and quests
- Coach memory with long-term personalized plans
- Wearable integrations (Apple Health, Google Fit, Garmin)
- Geospatial analytics dashboards for city-level engagement trends

---

## Ethics, safety, and privacy notes

- Do **not** treat AI coach output as medical advice.
- Add stronger guardrails for minors or high-risk user states.
- Implement clear geolocation and data retention controls.
- Provide transparent user controls for deleting history and account data.

---

If you’re building on this MVP, a strong next step is to convert current demo zone/place data into full database-backed services and introduce telemetry for retention + behavior-change analytics.
