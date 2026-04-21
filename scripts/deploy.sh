#!/bin/bash
# SSR Airport AI — Deployment Script

set -e

ENV=${1:-staging}
echo "Deploying to: $ENV"

# Validate environment
if [[ "$ENV" != "staging" && "$ENV" != "production" ]]; then
    echo "Usage: ./deploy.sh [staging|production]"
    exit 1
fi

# Apply DB migrations
echo "Applying database migrations..."
psql "$DATABASE_URL" < database/schema.sql
psql "$DATABASE_URL" < database/migrations/001_initial_schema.sql

if [[ "$ENV" == "staging" ]]; then
    echo "Seeding mock data for staging..."
    psql "$DATABASE_URL" < database/seeds/mock_data.sql
fi

# Deploy backend
echo "Deploying backend..."
cd backend
docker build -t ssr-ai-backend:$ENV .
# Push to registry (update with your registry)
# docker push registry.example.com/ssr-ai-backend:$ENV

# Deploy frontend
echo "Deploying frontend..."
cd ../frontend
npm ci
npm run build

echo "Deployment to $ENV complete!"
