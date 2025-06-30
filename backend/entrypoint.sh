#!/bin/sh
set -e

echo "==> Fetching data from APIs"
ts-node prisma/test.fetch.ts

echo "==> Pushing Prisma schema"
pnpm exec prisma db push

echo "==> Seeding database"
ts-node prisma/seed.ts

echo "==> Starting backend server"
exec node dist/src/main.js