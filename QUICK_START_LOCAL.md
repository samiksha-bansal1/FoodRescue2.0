# Quick Start - Local Development (5 minutes)

## TL;DR Setup

```bash
# 1. Ensure PostgreSQL is running locally
# macOS: brew services start postgresql
# Windows/Linux: Check your installation

# 2. Clone & install
git clone <repo>
cd foodrescue
npm install

# 3. Configure database
cp .env.example .env
# Edit .env - change DATABASE_URL to:
# postgresql://postgres:yourPassword@localhost:5432/foodrescue

# 4. Create database
psql -U postgres -c "CREATE DATABASE foodrescue;"

# 5. Push schema & seed data
npm run db:push

# 6. Start app
npm run dev

# 7. Open http://localhost:5000
```

## Test Login (after step 6)

- **Donor**: donor1@foodrescue.test / password123
- **NGO**: ngo1@foodrescue.test / password123
- **Volunteer**: volunteer1@foodrescue.test / password123
- **Admin**: admin@foodrescue.com / admin123

## What Happens on npm run db:push?

✅ Creates all database tables in PostgreSQL
✅ Automatically seeds 10 test users
✅ Sets up relationships between tables
✅ Data persists even after closing the app

## Common Issues & Fixes

| Issue | Solution |
|-------|----------|
| `ECONNREFUSED` | PostgreSQL not running or wrong DATABASE_URL |
| `database "foodrescue" does not exist` | Run: `psql -U postgres -c "CREATE DATABASE foodrescue;"` |
| Port 5000 in use | Change PORT in .env to 3000, restart app |
| `npm run db:push` fails | Drop DB: `psql -U postgres -c "DROP DATABASE foodrescue;"` then recreate and retry |

## Full Setup Guide

See **LOCAL_SETUP.md** for detailed instructions with OS-specific steps.

## Key Files

- `.env.example` - Copy to `.env` and configure
- `LOCAL_SETUP.md` - Complete setup guide
- `drizzle.config.ts` - Database configuration
- `server/db.ts` - PostgreSQL connection
- `server/db-storage.ts` - Database queries using Drizzle ORM
