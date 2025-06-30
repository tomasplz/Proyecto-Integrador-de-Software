#!/bin/sh
set -e

echo "🚀 Starting backend application..."

# Esperar a que la base de datos esté disponible
echo "⏳ Waiting for database to be ready..."
until pnpm exec prisma db push --accept-data-loss --skip-generate; do
  echo "Database is unavailable - sleeping"
  sleep 2
done

echo "✅ Database is ready!"

# Ejecutar migraciones
echo "🔄 Running Prisma migrations..."
if pnpm exec prisma migrate deploy; then
  echo "✅ Migrations completed successfully!"
else
  echo "⚠️ Migration failed, trying to reset database..."
  if pnpm exec prisma migrate reset --force --skip-seed; then
    echo "✅ Database reset and migrations completed!"
  else
    echo "❌ Database reset failed! Using db push as fallback..."
    pnpm exec prisma db push --accept-data-loss --force-reset
  fi
fi

# Generar cliente de Prisma (por si acaso)
echo "🔧 Generating Prisma client..."
pnpm exec prisma generate

# Obtener datos de las APIs externas
echo "📥 Fetching data from external APIs..."
if ts-node prisma/test.fetch.ts; then
  echo "✅ Data fetching completed successfully!"
else
  echo "⚠️ Data fetching failed, but continuing..."
fi

# Sincronizar esquema con base de datos
echo "🔄 Synchronizing database schema..."
if pnpm exec prisma db push --accept-data-loss; then
  echo "✅ Database schema synchronized!"
else
  echo "⚠️ Schema synchronization failed, but continuing..."
fi

# Ejecutar seed con los datos descargados
echo "🌱 Running database seed..."
if [ -f "prisma/seed.ts" ]; then
  if ts-node prisma/seed.ts; then
    echo "✅ Database seeding completed successfully!"
  else
    echo "⚠️ Seed failed, but continuing..."
  fi
fi

echo "🎉 All setup completed! Starting NestJS application..."
node dist/src/main.js
