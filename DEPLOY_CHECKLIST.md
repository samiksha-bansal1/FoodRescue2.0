# FoodRescue Deployment Checklist

## Before Deploying to Vercel + Railway

### ✅ Code Ready
- [ ] All files committed to GitHub
- [ ] Latest version pushed to main branch
- [ ] No uncommitted changes

### ✅ Environment Prepared
- [ ] Generated JWT_SECRET (random string)
- [ ] Generated SESSION_SECRET (random string)
- [ ] Have your GitHub account ready
- [ ] Have Vercel account (sign up with GitHub)
- [ ] Have Railway account (sign up with GitHub)

### ✅ Test Data Ready
- [ ] 10 test users pre-loaded:
  - 3 donors
  - 3 NGOs
  - 4 volunteers
  - 1 admin
- [ ] All passwords: `password123`
- [ ] Admin password: `admin123`

## Railway Deployment Steps
1. Create project from GitHub
2. Add PostgreSQL database
3. Set environment variables (JWT_SECRET, SESSION_SECRET)
4. Copy backend URL from Railway

## Vercel Deployment Steps
1. Import GitHub repository
2. Set VITE_API_URL to Railway backend URL
3. Deploy
4. Test login

## Post-Deployment Testing
- [ ] Frontend loads at Vercel URL
- [ ] Backend responds at Railway URL
- [ ] Login works with test credentials
- [ ] Can create donation (donor)
- [ ] Can accept donation (NGO)
- [ ] Can accept task (volunteer)
- [ ] Can mark delivered
- [ ] Can rate donor (NGO)

## You're Done! 🎉
Share your Vercel URL and start rescuing food!

---
**Total time: 15 minutes**
**Cost: $5/month (Railway only)**
**Uptime: 99.9%**
