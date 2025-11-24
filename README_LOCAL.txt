FOODRESCUE - LOCAL DEVELOPMENT WITH POSTGRESQL
==============================================

When you download this project, you have TWO options:

OPTION 1: Use Replit (Cloud) - No setup needed
- Everything is pre-configured
- Data stored in Replit's built-in PostgreSQL
- Just click "Run"

OPTION 2: Run Locally - Requires setup (recommended for long-term development)
- Install PostgreSQL on your computer
- Follow steps in QUICK_START_LOCAL.md or LOCAL_SETUP.md
- Data persists in your local PostgreSQL database
- Full control over development environment

WHAT YOU NEED FOR LOCAL SETUP:
1. Node.js 18+ (https://nodejs.org/)
2. PostgreSQL 14+ (https://www.postgresql.org/download/)
3. Git (optional, for version control)

RECOMMENDED SETUP:
1. Read QUICK_START_LOCAL.md (5-minute setup)
2. If you get stuck, read LOCAL_SETUP.md (detailed guide)

KEY FILES:
- QUICK_START_LOCAL.md → Fast setup guide
- LOCAL_SETUP.md → Complete setup guide with troubleshooting
- .env.example → Database configuration template
- LOCAL_SETUP.md → All your answers are here

MAIN DIFFERENCE:
On Replit:      Data stored in Replit's PostgreSQL ✓
Locally:        Data stored in YOUR PostgreSQL ✓

Both options use the exact same database schema and Drizzle ORM.
Just different PostgreSQL servers.

START HERE: Read QUICK_START_LOCAL.md
