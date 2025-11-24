# Deploy FoodRescue to Vercel + Railway

**This is the FASTEST & BEST way to deploy your app.**

- **Vercel** = Frontend (React app)
- **Railway** = Backend (Node.js server + PostgreSQL database)

Estimated time: **10-15 minutes**

---

## ✅ STEP 1: PREPARE YOUR CODE

### 1.1 Push to GitHub
```bash
# Make sure your code is in GitHub
git add .
git commit -m "Final version ready for deployment"
git push origin main
```

### 1.2 Verify package.json
Your `package.json` should have:
```json
{
  "type": "module",
  "scripts": {
    "dev": "NODE_ENV=development tsx server/index-dev.ts",
    "build": "npm run db:push && vite build && esbuild server/index-prod.ts --bundle --outfile=dist/index.js --external:express --external:socket.io",
    "start": "node dist/index.js",
    "db:push": "drizzle-kit push:pg"
  }
}
```

---

## 🚂 STEP 2: DEPLOY TO RAILWAY (Backend + Database)

### 2.1 Create Railway Account
1. Go to **https://railway.app**
2. Click **"Start Project"**
3. Sign up with GitHub (easiest)

### 2.2 Create New Project
1. Click **"New Project"**
2. Select **"Deploy from GitHub"**
3. Find your **foodrescue** repository
4. Click **"Deploy"**

**Railway will auto-detect Node.js and start building!**

### 2.3 Add PostgreSQL Database
1. In Railway dashboard, click **"+ Add"**
2. Select **"Database"** → **"PostgreSQL"**
3. Click **"Create"**

**Railway automatically creates the database and sets DATABASE_URL!**

### 2.4 Set Environment Variables in Railway
1. Go to your Railway project
2. Click on the **Node.js service** (your app)
3. Click **"Variables"** tab
4. Add these variables:
   ```
   JWT_SECRET=your-random-secret-key-here
   SESSION_SECRET=your-random-session-secret-here
   NODE_ENV=production
   PORT=3000
   ```

**To generate random secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

**Copy the output and use it for JWT_SECRET and SESSION_SECRET**

### 2.5 Get Your Backend URL
1. In Railway, click the **Node.js service**
2. Look for **"Public URL"** or **"Domain"**
3. It will look like: `https://your-app-xyz.railway.app`
4. **Copy this URL - you'll need it for Vercel!**

### 2.6 Verify Database Connection
1. In Railway, click the **PostgreSQL service**
2. Click **"Connect"**
3. Copy the **DATABASE_URL**
4. It's automatically set in your Node.js app

**Railway auto-runs migrations! Your database is ready.**

---

## ⚡ STEP 3: DEPLOY TO VERCEL (Frontend)

### 3.1 Create Vercel Account
1. Go to **https://vercel.com**
2. Click **"Sign Up"**
3. Sign up with GitHub (easiest)

### 3.2 Import Your Repository
1. Click **"Add New..."** → **"Project"**
2. Click **"Import Git Repository"**
3. Find your **foodrescue** repository
4. Click **"Import"**

### 3.3 Configure Build Settings
When Vercel asks about build settings:

**Framework Preset:** Leave blank (it's a custom setup)

**Build Command:**
```
npm run build
```

**Output Directory:**
```
dist
```

**Install Command:**
```
npm install
```

### 3.4 Set Environment Variables
Before deploying, add environment variables:

1. In Vercel project settings, click **"Environment Variables"**
2. Add this variable:
   ```
   VITE_API_URL=https://your-app-xyz.railway.app
   ```
   Replace `your-app-xyz.railway.app` with your **actual Railway backend URL** from Step 2.5

3. Click **"Save"**

### 3.5 Deploy
1. Click **"Deploy"**
2. Wait 2-3 minutes for Vercel to build and deploy
3. Once done, you'll see a **"Visit"** button
4. Click it to see your live app!

---

## 🔗 STEP 4: CONNECT FRONTEND TO BACKEND

Your frontend is now deployed to Vercel, and your backend is on Railway. They need to talk to each other!

### 4.1 Check Frontend Code
The frontend automatically uses the `VITE_API_URL` environment variable you set in Vercel.

Look at `client/src/lib/queryClient.ts`:
```typescript
const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
```

This automatically uses your Railway backend URL in production! ✅

### 4.2 Verify Connection
1. Open your Vercel app
2. Try to log in with test credentials:
   - Email: `donor1@foodrescue.test`
   - Password: `password123`

3. If login works, everything is connected! ✅

---

## 📱 STEP 5: TEST YOUR DEPLOYED APP

### 5.1 Complete Workflow Test
1. **Log in as Donor** (donor1@foodrescue.test / password123)
   - Create a new donation
   - See it appear on the map

2. **Log out, Log in as NGO** (ngo1@foodrescue.test / password123)
   - See the donor's donation in "Available Donations"
   - Accept the donation
   - See donation status change to "50% Complete"

3. **Log out, Log in as Volunteer** (volunteer1@foodrescue.test / password123)
   - See the delivery task assigned
   - Accept the task
   - See donation status change to "75% Complete"
   - Mark as delivered
   - See donation status change to "100% Complete"

4. **Log out, Log in as NGO** (ngo1@foodrescue.test / password123)
   - Go to "My Accepted Donations"
   - Click **"Rate This Donor"**
   - Give 1-5 stars and submit
   - See the feedback saved

### 5.2 Admin Dashboard
1. **Log in as Admin** (admin@foodrescue.com / admin123)
2. See all users and donation statistics
3. View all donations and tasks

---

## 🔧 TROUBLESHOOTING

### Problem: Login fails with "Connection error"
**Solution:**
1. In Vercel dashboard, go to your project
2. Click **"Environment Variables"**
3. Make sure `VITE_API_URL` is set to your Railway backend URL
4. Redeploy: Click **"Deployments"** → **"..."** → **"Redeploy"**

### Problem: Database error on Railway
**Solution:**
1. Go to Railway dashboard
2. Click **PostgreSQL service**
3. Click **"Connect"** tab
4. Copy the **DATABASE_URL**
5. Click **Node.js service**
6. Go to **"Variables"**
7. Make sure **DATABASE_URL** is there (Railway sets it automatically)

### Problem: App is blank/white screen
**Solution:**
1. Open browser DevTools (F12)
2. Go to **Console** tab
3. Look for red error messages
4. In Vercel dashboard, click **"Deployments"** → your latest deployment
5. Click **"Logs"** to see build/runtime errors

### Problem: Can't upload donations (files not working)
**Note:** File uploads work but are stored as base64 in the database. This is by design for MVP.

---

## 🎉 YOU'RE LIVE!

Your FoodRescue app is now running on:
- **Frontend (Vercel):** `https://your-project.vercel.app`
- **Backend (Railway):** `https://your-app-xyz.railway.app`
- **Database (Railway PostgreSQL):** Managed automatically

---

## 📊 COSTS

**Vercel:** Free tier available (unlimited deployments)
**Railway:** $5/month minimum (covers everything: Node.js, PostgreSQL, bandwidth)

**Total:** Free (Vercel) + $5/month (Railway) = $5/month!

---

## 🚀 NEXT STEPS

### Add Custom Domain (Optional)
**Vercel:**
1. Go to project settings → **Domains**
2. Add your domain
3. Follow DNS instructions

**Railway:**
1. Go to Node.js service → **Settings**
2. Add custom domain for your backend

### Enable Monitoring (Optional)
**Vercel:** Built-in analytics available
**Railway:** Built-in logs available

### Database Backups (Optional)
**Railway PostgreSQL:** Daily automatic backups included

---

## 💡 QUICK REFERENCE

| Step | Action | Time |
|------|--------|------|
| 1 | Push to GitHub | 1 min |
| 2 | Create Railway project | 2 min |
| 3 | Add PostgreSQL | 1 min |
| 4 | Set env vars (Railway) | 2 min |
| 5 | Create Vercel project | 2 min |
| 6 | Set env vars (Vercel) | 1 min |
| 7 | Deploy & test | 5 min |

**Total: ~15 minutes**

---

## 🆘 STILL HAVING ISSUES?

### Check Railway Logs
1. Go to Railway dashboard
2. Click **Node.js service**
3. Click **"Logs"** tab
4. Look for red ERROR messages

### Check Vercel Logs
1. Go to Vercel dashboard
2. Click **"Deployments"**
3. Click your latest deployment
4. Click **"Runtime Logs"** tab

### Common Errors & Fixes

**Error: "Cannot find module 'express'"**
- Solution: Run `npm install` locally, commit, and redeploy

**Error: "DATABASE_URL is not set"**
- Solution: In Railway, click PostgreSQL → copy DATABASE_URL → add to Node.js Variables

**Error: "PORT is already in use"**
- Solution: Railway sets PORT=3000 automatically, no action needed

---

## 📞 GET HELP

- **Railway Docs:** https://docs.railway.app
- **Vercel Docs:** https://vercel.com/docs
- **Replit Docs:** https://docs.replit.com

---

**Your app is now LIVE! 🎉 Share the Vercel URL with friends and test the complete workflow.**

---

## QUICK COPY-PASTE COMMANDS

### Generate secrets (run locally):
```bash
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex')); console.log('SESSION_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

### Test database connection (optional):
```bash
npm run db:push
```

### Build locally before deploying (optional):
```bash
npm run build
npm start
```

---

**You're all set! Your FoodRescue app is production-ready on Vercel + Railway! 🚀**
