#!/bin/bash
# Run this after setting up your Neon database URL in .env.local
# Usage: bash scripts/setup-db.sh

echo "🔄 Pushing schema to PostgreSQL..."
npx prisma db push --accept-data-loss

echo "🔄 Generating Prisma Client..."
npx prisma generate

echo "✅ Database setup complete!"
echo ""
echo "To open Prisma Studio locally:"
echo "  npx prisma studio"
echo ""
echo "To seed the admin user:"
echo "  curl -X POST http://localhost:3001/api/admin/setup"
