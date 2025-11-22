# PostgreSQL Database Setup Guide

## Automatic Setup (Replit)

The PostgreSQL integration has been added to your project. Here's what happened:

### 1. Database Created
- A PostgreSQL database instance has been created
- Connection string stored in `DATABASE_URL` environment variable

### 2. Environment Variable Set
Your `.env` file now has:
```
DATABASE_URL=postgresql://user:password@host:port/dbname
```

### 3. Run Migrations

First time setup - create all tables:
```bash
npm run db:migrate
```

Then start the application:
```bash
npm run dev
```

## What Gets Stored in PostgreSQL

All your data now persists:
- ✅ Users (with roles and authentication)
- ✅ Food Donations
- ✅ Volunteer Tasks
- ✅ Ratings & Reviews
- ✅ Notifications
- ✅ User Profiles

## Database Schema

Tables created automatically:
- `users` - User accounts and profiles
- `donations` - Food donations
- `volunteer_tasks` - Delivery tasks
- `ratings` - User ratings and reviews
- `notifications` - User notifications

## Verify Connection

The app will automatically:
1. Read DATABASE_URL from environment
2. Connect to PostgreSQL on startup
3. Create/update tables as needed
4. Store all data persistently

## Data Persistence

Unlike the previous in-memory storage:
- ✅ Data survives server restarts
- ✅ Multiple concurrent users supported
- ✅ Production-ready
- ✅ Scalable

## Commands

```bash
# Start with database
npm run dev

# Run migrations
npm run db:migrate

# Generate migration files
npm run db:generate

# Drop database (caution!)
npm run db:drop
```

## Manual PostgreSQL Setup (if not using Replit)

If you're setting up locally without Replit:

### Install PostgreSQL
- macOS: `brew install postgresql`
- Ubuntu: `sudo apt-get install postgresql`
- Windows: Download from postgresql.org

### Create Database
```bash
createdb foodrescue
```

### Set Environment Variable
```bash
export DATABASE_URL="postgresql://username:password@localhost:5432/foodrescue"
```

### Run Application
```bash
npm install
npm run db:migrate
npm run dev
```

## Troubleshooting

**"DATABASE_URL not found"**
- Replit: PostgreSQL blueprint might not be initialized yet
- Manual: Check your .env file has the connection string

**"Cannot connect to database"**
- Verify PostgreSQL is running
- Check connection string is correct
- Ensure database user has permissions

**"Table does not exist"**
- Run migrations: `npm run db:migrate`
- Check migrations folder has files

## Next Steps

1. ✅ Database is now connected
2. Run migrations: `npm run db:migrate`
3. Start app: `npm run dev`
4. Create a donation - it will now be saved to PostgreSQL!
5. Restart server - donation data persists!

Your FoodRescue app is now production-ready with persistent data! 🎉
