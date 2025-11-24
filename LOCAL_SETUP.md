# FoodRescue - Local Development Setup Guide

## Prerequisites
- Node.js 18+ installed
- PostgreSQL 14+ installed locally
- Git

## Step 1: Clone the Project
```bash
git clone <repository-url>
cd foodrescue
```

## Step 2: Install Dependencies
```bash
npm install
```

## Step 3: Set Up PostgreSQL Locally

### macOS (using Homebrew)
```bash
brew install postgresql
brew services start postgresql
```

### Windows
- Download and install from: https://www.postgresql.org/download/windows/
- During installation, remember your password for the `postgres` user
- PostgreSQL will start automatically

### Linux (Ubuntu/Debian)
```bash
sudo apt-get install postgresql postgresql-contrib
sudo systemctl start postgresql
```

## Step 4: Create a Local Database

Open PostgreSQL command line:
```bash
psql -U postgres
```

Then run these commands:
```sql
CREATE DATABASE foodrescue;
\q
```

## Step 5: Configure Environment Variables

Copy the example environment file and update it with your local PostgreSQL credentials:

```bash
cp .env.example .env
```

Edit `.env` file with your PostgreSQL details:
```
DATABASE_URL=postgresql://postgres:yourPassword@localhost:5432/foodrescue
JWT_SECRET=your-dev-secret-key
SESSION_SECRET=your-dev-session-secret
PORT=5000
NODE_ENV=development
```

**Important:** Replace `yourPassword` with the password you set during PostgreSQL installation.

## Step 6: Run Database Migrations

This will automatically create all tables and seed test data:
```bash
npm run db:push
```

## Step 7: Start the Application

```bash
npm run dev
```

The application will start on `http://localhost:5000`

## Step 8: Login with Test Credentials

The database is automatically seeded with test users. Use these to log in:

### Donors
- Email: `donor1@foodrescue.test` | Password: `password123`
- Email: `donor2@foodrescue.test` | Password: `password123`
- Email: `donor3@foodrescue.test` | Password: `password123`

### NGOs
- Email: `ngo1@foodrescue.test` | Password: `password123`
- Email: `ngo2@foodrescue.test` | Password: `password123`
- Email: `ngo3@foodrescue.test` | Password: `password123`

### Volunteers
- Email: `volunteer1@foodrescue.test` | Password: `password123`
- Email: `volunteer2@foodrescue.test` | Password: `password123`
- Email: `volunteer3@foodrescue.test` | Password: `password123`
- Email: `volunteer4@foodrescue.test` | Password: `password123`

### Admin
- Email: `admin@foodrescue.com` | Password: `admin123`

## Step 9: Data Persistence

All data is now persisted in PostgreSQL. Your donations, tasks, ratings, and user accounts will remain saved even after closing the application.

## Troubleshooting

### PostgreSQL Connection Error
If you get `ECONNREFUSED` errors:
1. Verify PostgreSQL is running: `psql -U postgres`
2. Check DATABASE_URL in `.env` matches your credentials
3. Ensure the database `foodrescue` exists: `psql -U postgres -l`

### Database Migration Failed
If `npm run db:push` fails:
1. Drop and recreate the database:
   ```bash
   psql -U postgres
   DROP DATABASE foodrescue;
   CREATE DATABASE foodrescue;
   \q
   ```
2. Re-run: `npm run db:push`

### Port Already in Use
If port 5000 is already in use:
1. Change PORT in `.env` to another port (e.g., 3000)
2. Restart the app: `npm run dev`

## Development Commands

```bash
# Start development server
npm run dev

# Push database schema changes
npm run db:push

# Force push database schema (if needed)
npm run db:push --force

# Generate database types
npm run db:generate

# Build for production
npm run build
```

## Environment Variables Reference

| Variable | Example | Description |
|----------|---------|-------------|
| `DATABASE_URL` | `postgresql://user:pass@localhost:5432/foodrescue` | PostgreSQL connection string |
| `JWT_SECRET` | `your-secret-key` | Secret key for JWT token signing |
| `SESSION_SECRET` | `session-secret-key` | Secret key for session management |
| `PORT` | `5000` | Server port |
| `NODE_ENV` | `development` | Environment mode |

## Architecture Overview

- **Frontend**: React + TypeScript with Vite
- **Backend**: Express.js with Node.js
- **Database**: PostgreSQL with Drizzle ORM
- **Real-time**: Socket.IO for live notifications
- **UI**: Shadcn/ui components with Tailwind CSS

## Features Ready to Test

✅ User authentication (multi-role: Donor, NGO, Volunteer, Admin)
✅ Donation creation and tracking
✅ Task management with 50% → 75% → 100% completion tracking
✅ Real-time Socket.IO notifications
✅ Donor rating system (1-5 stars)
✅ Geographic location features with maps
✅ Database persistence with PostgreSQL

## Next Steps

1. Familiarize yourself with the test users
2. Create a donation as a donor
3. Accept it as an NGO
4. Accept the task as a volunteer
5. Mark as delivered to see the full workflow
6. Rate the donor to test the rating system

Happy developing! 🚀
