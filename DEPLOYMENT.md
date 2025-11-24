# FoodRescue - Production Deployment Guide

## Deployment Options (Choose ONE)

### Option 1: Replit (EASIEST - Recommended for beginners)
**Pros:** 
- Free tier available
- No configuration needed
- Built-in PostgreSQL
- One-click deployment
- Auto-scaling

**Steps:**
1. Push code to GitHub
2. Go to https://replit.com
3. Click "Import from GitHub"
4. Select your FoodRescue repository
5. Click "Create Replit"
6. Set environment variables in Replit secrets
7. Run `npm run dev`
8. Click "Publish" button

**Cost:** Free (limited) or $7/month (Teams)

---

### Option 2: Vercel (FAST & SCALABLE - Best for Frontend)
**Pros:**
- Fast global CDN
- Serverless functions
- Free tier available
- Great performance

**Setup:**
```bash
# 1. Build the project
npm run build

# 2. Install Vercel CLI
npm i -g vercel

# 3. Deploy
vercel
```

**Steps:**
1. Go to https://vercel.com
2. Sign up with GitHub
3. Click "New Project"
4. Import your GitHub repository
5. Add environment variables:
   - `DATABASE_URL` - Your PostgreSQL connection string
   - `JWT_SECRET` - Generate random string
   - `SESSION_SECRET` - Generate random string
6. Click "Deploy"

**Cost:** Free for hobby projects, paid plans from $20/month

---

### Option 3: Railway (SIMPLE - Recommended for Backend)
**Pros:**
- Simple setup
- Good pricing
- Built-in PostgreSQL
- Git integration

**Setup:**
1. Go to https://railway.app
2. Click "New Project" → "Deploy from GitHub"
3. Select your repository
4. Railway auto-detects Node.js app
5. Add PostgreSQL plugin (2-click install)
6. Set environment variables
7. Deploy automatically

**Cost:** $5/month minimum, pay-as-you-go

---

### Option 4: Heroku (EASY - Classic Choice)
**Pros:**
- Very beginner-friendly
- Simple Git push deployment
- Auto-scaling available

**Setup:**
```bash
# 1. Install Heroku CLI
npm install -g heroku

# 2. Login
heroku login

# 3. Create app
heroku create foodrescue-app

# 4. Add PostgreSQL addon
heroku addons:create heroku-postgresql:hobby-dev

# 5. Set environment variables
heroku config:set JWT_SECRET=your-secret-key
heroku config:set SESSION_SECRET=your-session-secret

# 6. Deploy
git push heroku main
```

**Cost:** Starting $7/month (after free tier deprecation)

---

### Option 5: AWS (MOST SCALABLE - For Enterprise)
**Pros:**
- Maximum scalability
- Advanced features
- Pay-per-use pricing

**Services to use:**
- **EC2** - Node.js server
- **RDS** - Managed PostgreSQL
- **CloudFront** - CDN
- **ElastiCache** - Redis (optional)

**Tools to help:**
- AWS Elastic Beanstalk (auto-scaling)
- AWS Amplify (simplifies deployment)

**Cost:** $15-100+/month depending on usage

---

### Option 6: DigitalOcean (AFFORDABLE - For Small Teams)
**Pros:**
- Affordable VPS
- Simple Dashboard
- Good documentation

**Setup:**
1. Create Droplet ($4-6/month)
2. Install Node.js & PostgreSQL
3. Clone your repository
4. Install dependencies: `npm install`
5. Run migrations: `npm run db:push`
6. Use PM2 to keep app running: `npm i -g pm2 && pm2 start npm -- run dev`
7. Set up Nginx as reverse proxy

**Cost:** $4-6/month for basic setup

---

## Environment Variables for Production

Before deploying, set these variables in your hosting platform:

```
DATABASE_URL=postgresql://user:password@host:5432/foodrescue
JWT_SECRET=generate-a-random-string-here
SESSION_SECRET=generate-another-random-string-here
PORT=5000
NODE_ENV=production
```

**Generate random secrets:**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Step-by-Step for Popular Platforms

### Vercel (Full Stack)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy (follow prompts)
vercel

# Set environment variables in Vercel dashboard
# Then redeploy
vercel --prod
```

### Railway
1. Go to railway.app
2. Select "New Project"
3. Choose "Deploy from GitHub"
4. Select your repo
5. Add PostgreSQL from "Add plugin"
6. Deploy

### Replit
1. Push to GitHub
2. Go to replit.com
3. Click "Import from GitHub"
4. Paste your repo URL
5. Create Replit
6. Configure DATABASE_URL
7. Run and Publish

---

## Production Checklist

- [ ] Environment variables set correctly
- [ ] Database migrations run successfully
- [ ] JWT_SECRET changed from default
- [ ] SESSION_SECRET is random and secure
- [ ] CORS configured for your domain
- [ ] SSL/HTTPS enabled
- [ ] Database backups enabled
- [ ] Error monitoring set up (Sentry, etc.)
- [ ] Monitor performance and logs
- [ ] Rate limiting implemented
- [ ] Security headers configured

---

## Recommended Deployment (Best Overall)

**For beginners:** Replit or Railway
**For speed:** Vercel + Supabase PostgreSQL
**For budget:** DigitalOcean $5/month
**For scaling:** AWS or GCP

---

## Monitoring & Maintenance

### Enable Logging
```bash
# View logs on deployment platform
# Vercel: vercel logs
# Railway: railway logs
# Heroku: heroku logs --tail
```

### Database Backups
- Vercel + Postgres.js: Automatic daily backups
- Railway: Built-in backups
- Heroku: Scheduled backups available

### Monitoring Tools
- Sentry (Error tracking)
- Datadog (Performance)
- New Relic (APM)
- Simple: Check platform dashboards

---

## Scaling Tips

As your app grows:
1. Add caching layer (Redis)
2. Optimize database queries
3. Enable CDN for static assets
4. Implement rate limiting
5. Use load balancing
6. Monitor and profile performance

---

## Troubleshooting Deployment

### Build Fails
- Check Node.js version matches
- Verify all dependencies are listed in package.json
- Run `npm run build` locally first

### Database Connection Error
- Verify DATABASE_URL is correct
- Check PostgreSQL is accessible from server
- Try connection string: `postgresql://user:pass@host:port/dbname`

### App Crashes After Deploy
- Check logs: `vercel logs`, `railway logs`, etc.
- Verify environment variables are set
- Ensure database migrations ran: `npm run db:push`

### Performance Issues
- Check database queries
- Enable caching
- Optimize images
- Monitor memory usage
- Use CDN for static files

---

## Support & Resources

- Replit Docs: https://docs.replit.com
- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Node.js Deployment: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/

---

**QUICK DEPLOY COMMAND:**
```bash
# For Vercel (fastest)
npm run build && vercel --prod

# For Railway (easiest)
git push origin main  # Railway auto-deploys on push

# For Replit (no command needed - just publish)
# Click the Publish button in Replit UI
```
