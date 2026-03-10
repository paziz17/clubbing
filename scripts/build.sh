#!/bin/bash
set -e
prisma generate
if [ -n "$DATABASE_URL" ] && [[ "$DATABASE_URL" == postgres* ]]; then
  prisma migrate deploy
fi
next build
