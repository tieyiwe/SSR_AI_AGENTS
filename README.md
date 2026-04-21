# SSR Airport AI System
## TIBLOGICS AI Implementation for Air Mauritius

**Version:** 1.0 | **Date:** April 2026 | **Client:** SSR International Airport, Mauritius

---

## Overview

AI-powered passenger assistance system for Sir Seewoosagur Ramgoolam (SSR) International Airport, handling 2,300+ daily inquiries across voice, WhatsApp, web chat, and mobile with 70% automation target.

### Key Capabilities

- **Voice AI** — Bland.ai + Twilio for 24/7 phone support
- **WhatsApp** — Automated messaging via Twilio Business API
- **Web Chat** — Real-time chat widget for airmauritius.com
- **Multilingual** — English, French, Mauritian Creole, Hindi
- **Flight Info** — Live FIDS API integration
- **Booking** — PNR lookup and special service requests
- **Analytics** — Real-time dashboard with call transcripts

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 14, TypeScript, Tailwind CSS, shadcn/ui |
| Backend | FastAPI (Python 3.11+) |
| Database | PostgreSQL 15+ (Supabase), Redis |
| AI | Claude Sonnet 4 (Anthropic) |
| Voice | Bland.ai + Twilio Voice |
| WhatsApp | Twilio WhatsApp Business API |

---

## Project Structure

```
ssr-airport-ai/
├── frontend/           # Next.js 14 application
├── backend/            # FastAPI Python application
├── database/           # SQL schema, migrations, seeds
├── scripts/            # Deployment and utility scripts
├── docs/               # API and deployment documentation
├── .github/workflows/  # CI/CD pipelines
├── docker-compose.yml  # Local development stack
└── .env.example        # Environment variable template
```

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker & Docker Compose
- PostgreSQL 15+ or Supabase account

### 1. Clone & Configure

```bash
git clone https://github.com/tieyiwe/ssr_ai_agents.git
cd ssr_ai_agents
cp .env.example .env
# Edit .env with your credentials
```

### 2. Start with Docker

```bash
docker-compose up --build
```

### 3. Manual Setup

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install -r requirements.txt
uvicorn app.main:app --reload --port 8000
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

### 4. Database Setup

```bash
# Apply schema
psql $DATABASE_URL < database/schema.sql

# Apply migrations
psql $DATABASE_URL < database/migrations/001_initial_schema.sql

# Seed mock data (development only)
psql $DATABASE_URL < database/seeds/mock_data.sql
```

---

## Environment Variables

See [`.env.example`](.env.example) for all required environment variables.

**Critical variables:**
- `ANTHROPIC_API_KEY` — Claude AI
- `BLAND_AI_API_KEY` — Voice AI
- `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` — Phone/WhatsApp
- `DATABASE_URL` — PostgreSQL connection
- `SUPABASE_URL` / `SUPABASE_ANON_KEY` — Supabase

---

## API Documentation

Full API docs available at:
- **Development:** http://localhost:8000/docs (Swagger UI)
- **Production:** https://api.ssr-ai.tiblogics.com/docs

See [docs/API.md](docs/API.md) for detailed endpoint reference.

---

## Deployment

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for full deployment guide.

**Quick deploy:**
```bash
chmod +x scripts/deploy.sh
./scripts/deploy.sh production
```

---

## Testing

```bash
# Backend tests
cd backend
pytest tests/ -v

# Frontend tests
cd frontend
npm run test

# Voice integration test
python scripts/test_voice.py
```

See [docs/TESTING.md](docs/TESTING.md) for full testing strategy.

---

## Key Metrics (Targets)

| KPI | Target |
|-----|--------|
| Automation Rate | ≥70% |
| Response Time | <5 seconds |
| Passenger Satisfaction | ≥90% NPS |
| Uptime | ≥99.5% |
| Cost per Conversation | ≤$0.50 |

---

## Support

**TIBLOGICS** — design@tiblogics.com
