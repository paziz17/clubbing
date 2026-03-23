#!/usr/bin/env bash
# הרצת המערכת מקומית: PostgreSQL ב-Docker + Next.js
set -e
cd "$(dirname "$0")/.."

export DATABASE_URL="${DATABASE_URL:-postgresql://clubing:clubing_local@localhost:5432/clubing}"

echo "→ מפעיל PostgreSQL (Docker)..."
docker compose up -d
sleep 2

echo "→ מסנכרן סכימה (Prisma)..."
npx prisma db push

echo "→ מפעיל Next.js על http://localhost:3000"
exec npm run dev
