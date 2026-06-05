# AnonymBox

Anonymous Q&A with live voting — a Telegram Mini App for speakers and event hosts.

## Features

- Audience submits anonymous questions (no author shown)
- One-vote-per-user upvoting (enforced server-side via hashed fingerprint)
- Speaker sees live leaderboard updated in real-time via WebSocket
- Session auto-closes at `closes_at`; organizer can reopen manually
- QR code + deep link share screen
- Railway-ready deploy for all three services

## Project Structure

```
anonymbox/
├── bot/          # Telegraf bot (Telegram bot entry point)
├── backend/      # Fastify REST API + WebSocket
├── frontend/     # React + TMA Mini App
└── docker-compose.yml
```

## Local Setup

### Prerequisites

- Docker + Docker Compose
- Node 20+ (for local dev without Docker)
- A Telegram bot token from [@BotFather](https://t.me/BotFather)

### 1. Clone & configure

```bash
cp .env.example .env
# Edit .env — set BOT_TOKEN at minimum
```

### 2. Run with Docker Compose

```bash
docker-compose up --build
```

Services:
| Service  | URL                   |
|----------|-----------------------|
| Frontend | http://localhost:5173 |
| Backend  | http://localhost:3001 |
| Postgres | localhost:5432        |
| Redis    | localhost:6379        |

### 3. Local dev (without Docker)

Start Postgres and Redis first (or use the compose file for just those):

```bash
docker-compose up -d postgres redis
```

Then in three terminals:

```bash
# Backend
cd backend && npm install && npm run dev

# Bot
cd bot && npm install && npm run dev

# Frontend
cd frontend && npm install && npm run dev
```

## Environment Variables

| Variable       | Description                                      |
|----------------|--------------------------------------------------|
| `BOT_TOKEN`    | Telegram bot token from BotFather               |
| `DATABASE_URL` | PostgreSQL connection string                    |
| `REDIS_URL`    | Redis connection string                         |
| `FRONTEND_URL` | Public URL of the frontend (for bot deep links) |
| `BACKEND_URL`  | Public URL of the backend                       |
| `JWT_SECRET`   | Secret used to salt anonymous fingerprints      |

Frontend also reads:
| Variable             | Description                          |
|----------------------|--------------------------------------|
| `VITE_BACKEND_URL`   | Backend URL (defaults to `/api`)     |
| `VITE_BOT_USERNAME`  | Bot username for deep links          |

## Deploy to Railway

Each subdirectory (`backend/`, `bot/`, `frontend/`) is an independent Railway service with its own `railway.toml` and `Dockerfile`.

1. Create a Railway project
2. Add services from the repo subdirectories
3. Add Postgres and Redis plugins
4. Set env vars on each service
5. Set `FRONTEND_URL` and `BACKEND_URL` after first deploy

## API Reference

| Method | Path | Description |
|--------|------|-------------|
| POST | `/sessions` | Create session |
| GET | `/sessions?telegramUserId=` | List user's sessions |
| GET | `/sessions/:id` | Get session |
| PATCH | `/sessions/:id/toggle` | Open/close session |
| POST | `/sessions/:id/questions` | Submit question |
| GET | `/sessions/:id/questions` | List questions |
| POST | `/sessions/:id/questions/:qid/vote` | Toggle vote |
| PATCH | `/sessions/:id/questions/:qid/answered` | Mark answered |
| PATCH | `/sessions/:id/questions/:qid/hide` | Hide question |
| WS | `/ws/:sessionId` | Real-time updates |

## Anonymity Model

- Questions have no stored author
- Votes are tracked by `sha256(telegramUserId + sessionId + JWT_SECRET)` — one-way, non-reversible
- Even the server cannot link a vote back to a user identity
