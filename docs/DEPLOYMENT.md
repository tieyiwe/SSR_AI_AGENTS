# Deployment Guide

## Prerequisites

- Docker & Docker Compose (local)
- Vercel account (frontend)
- Railway or Render account (backend)
- Supabase project
- Anthropic API key
- Twilio account with phone number
- Bland.ai account

---

## Local Development

```bash
# 1. Clone and configure
cp .env.example .env
# Fill in .env with your credentials

# 2. Start all services
docker-compose up --build

# 3. Apply schema and seed data
docker-compose exec backend python scripts/seed_data.py

# 4. Access
# Frontend: http://localhost:3000
# Backend API: http://localhost:8000
# API docs: http://localhost:8000/docs
```

---

## Production Deployment

### Frontend → Vercel

```bash
cd frontend
vercel --prod
```

Set environment variables in Vercel dashboard:
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### Backend → Railway

```bash
railway init
railway up
```

Set environment variables in Railway dashboard — all vars from `.env.example`.

### Database → Supabase

1. Create a Supabase project
2. Run schema in SQL editor: `database/schema.sql`
3. Run migrations: `database/migrations/001_initial_schema.sql`
4. Enable Row Level Security as needed
5. Copy connection string to `DATABASE_URL`

---

## Twilio Configuration

1. Purchase a Mauritius phone number (+230 6038XX)
2. Set Voice webhook: `https://api.ssr-ai.tiblogics.com/api/v1/voice/incoming`
3. Set Status callback: `https://api.ssr-ai.tiblogics.com/api/v1/voice/status`
4. For WhatsApp: register WhatsApp Business number
5. Set WhatsApp webhook: `https://api.ssr-ai.tiblogics.com/api/v1/whatsapp/incoming`

---

## Bland.ai Configuration

1. Create account at bland.ai
2. Get API key → set `BLAND_AI_API_KEY`
3. Set webhook URL: `https://api.ssr-ai.tiblogics.com/api/v1/voice/bland-webhook`

---

## Environment Checklist

- [ ] `ANTHROPIC_API_KEY` set
- [ ] `BLAND_AI_API_KEY` set
- [ ] `TWILIO_ACCOUNT_SID` / `TWILIO_AUTH_TOKEN` set
- [ ] `DATABASE_URL` pointing to production Supabase
- [ ] `REDIS_URL` set (Railway Redis or Upstash)
- [ ] `API_BASE_URL` set to production backend URL
- [ ] `FRONTEND_URL` set to production frontend URL
- [ ] `SECRET_KEY` set to a strong random string
- [ ] `SENTRY_DSN` set for error tracking
