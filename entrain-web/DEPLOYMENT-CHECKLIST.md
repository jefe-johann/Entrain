# Entrain Deployment Checklist

Follow this checklist step-by-step to deploy Entrain to production for the first time.

## ✅ Pre-Deployment Preparation

### 1. Set Up Cloudflare R2

- [ ] Sign up for Cloudflare account (if needed)
- [ ] Go to R2 section in Cloudflare dashboard
- [ ] Create a new bucket named `entrain-audio-files`
- [ ] Click "Manage R2 API Tokens" (inside R2 section)
- [ ] Create **Account** API token with "Object Read & Write" permissions
- [ ] Save these values (you'll need them later):
  - `R2_ACCOUNT_ID` (found in R2 dashboard URL: dash.cloudflare.com/{ACCOUNT_ID}/r2)
  - `R2_ACCESS_KEY_ID` (from API token creation)
  - `R2_SECRET_ACCESS_KEY` (from API token creation - save now, can't see again!)
  - `R2_BUCKET_NAME` (entrain-audio-files)
- [ ] In bucket settings, add CORS policy (see deployment-guide.md for JSON)

### 2. Set Up Google OAuth

- [ ] Go to Google Cloud Console: https://console.cloud.google.com
- [ ] Create a new project or select existing
- [ ] Enable Google+ API
- [ ] Go to Credentials → Create Credentials → OAuth 2.0 Client ID
- [ ] Application type: Web application
- [ ] Add authorized redirect URIs (you'll update these later with production URLs):
  - For now, use placeholder: `https://placeholder.com/api/auth/callback/google`
- [ ] Save these values:
  - `GOOGLE_CLIENT_ID`
  - `GOOGLE_CLIENT_SECRET`

### 3. Get ElevenLabs API Key

- [ ] Ensure you have your ElevenLabs API key ready
- [ ] Test it works: https://elevenlabs.io/app

---

## 🎨 Deploy to Render

### 1. Create Render Account

- [ x] Go to https://render.com
- [ x] Sign up with GitHub
- [ x] Connect your Entrain repository

### 2. Create PostgreSQL Database

- [ ] Click "New +" → "PostgreSQL"
- [ ] Name: `entrain-postgres`
- [ ] Database: `entrain`
- [ ] Region: Choose closest to you
- [ ] Plan: **Free** (or Starter for production)
- [ ] Click "Create Database"
- [ ] Once ready, copy **Internal Database URL**
- [ ] **SAVE THIS URL** - you'll need it for all services

### 3. Create Redis Instance

- [ ] Click "New +" → "Redis"
- [ ] Name: `entrain-redis`
- [ ] Region: **Same as Postgres** (important!)
- [ ] Plan: **Free**
- [ ] Click "Create Redis"
- [ ] Copy **Internal Redis URL**
- [ ] **SAVE THIS URL**

### 4. Create Backend API Service

- [ ] Click "New +" → "Web Service"
- [ ] Connect your GitHub repo
- [ ] Name: `entrain-backend-api`
- [ ] Region: Same as Postgres/Redis
- [ ] Branch: `main`
- [ ] Root Directory: `entrain-web/backend`
- [ ] Runtime: **Python 3**
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- [ ] Plan: **Free** (or Starter for no cold starts)
- [ ] Click "Advanced" → Add Environment Variables:

```
DATABASE_URL=<paste Internal Database URL from Step 2>
REDIS_URL=<paste Internal Redis URL from Step 3>
ELEVENLABS_API_KEY=<your-elevenlabs-key>
STORAGE_TYPE=r2
R2_ACCOUNT_ID=<from-cloudflare>
R2_ACCESS_KEY_ID=<from-cloudflare>
R2_SECRET_ACCESS_KEY=<from-cloudflare>
R2_BUCKET_NAME=entrain-audio-files
FRONTEND_URL=https://placeholder.vercel.app
SECRET_KEY=<generate: openssl rand -hex 32>
AUTH_SECRET=<generate: openssl rand -base64 32>
AUTH_GOOGLE_ID=<from-google-console>
AUTH_GOOGLE_SECRET=<from-google-console>
```

- [ ] Click "Create Web Service"
- [ ] Wait for first deploy (~3-5 min)
- [ ] Copy service URL (e.g., `https://entrain-backend-api.onrender.com`)
- [ ] **SAVE THIS URL**

### 5. Create Worker Service

- [ ] Click "New +" → "Background Worker"
- [ ] Connect your GitHub repo (same as backend)
- [ ] Name: `entrain-worker`
- [ ] Region: Same as others
- [ ] Branch: `main`
- [ ] Root Directory: `entrain-web/backend`
- [ ] Runtime: **Python 3**
- [ ] Build Command: `pip install -r requirements.txt`
- [ ] Start Command: `python worker/run_worker.py`
- [ ] Plan: **Free**
- [ ] Add same environment variables as backend (except AUTH_* and FRONTEND_URL):

```
DATABASE_URL=<same as backend>
REDIS_URL=<same as backend>
ELEVENLABS_API_KEY=<same as backend>
STORAGE_TYPE=r2
R2_ACCOUNT_ID=<same as backend>
R2_ACCESS_KEY_ID=<same as backend>
R2_SECRET_ACCESS_KEY=<same as backend>
R2_BUCKET_NAME=entrain-audio-files
```

- [ ] Click "Create Background Worker"
- [ ] Verify all services show "Live" status

---

## ▲ Deploy to Vercel

### 1. Create Vercel Account

- [ ] Go to https://vercel.com
- [ ] Sign up with GitHub

### 2. Import Project

- [ ] Click "Add New" → "Project"
- [ ] Import your Entrain repository
- [ ] Configure project:
  - Framework: Next.js
  - Root Directory: `entrain-web/frontend`
  - Build Command: `npm run build` (default)
  - Output Directory: `.next` (default)

### 3. Add Environment Variables

- [ ] In Vercel project settings → Environment Variables → Add:

```
AUTH_SECRET=<same as backend - openssl rand -base64 32>
AUTH_GOOGLE_ID=<from-google-console>
AUTH_GOOGLE_SECRET=<from-google-console>
DATABASE_URL=<copy from Render Postgres Internal URL>
NEXT_PUBLIC_API_URL=<your-render-backend-url>
```

### 4. Deploy

- [ ] Click "Deploy"
- [ ] Wait for build to complete (~2-3 min)
- [ ] **SAVE YOUR VERCEL URL** (e.g., `https://entrain.vercel.app`)

---

## 🔧 Post-Deployment Configuration

### 1. Update Backend Environment Variables

- [ ] Go to Render → entrain-backend-api → Environment
- [ ] Update `FRONTEND_URL` to your Vercel URL
- [ ] Click "Save Changes" (auto-redeploys)

### 2. Update Google OAuth Redirect URIs

- [ ] Go to Google Cloud Console → Credentials
- [ ] Edit your OAuth 2.0 Client ID
- [ ] Update Authorized redirect URIs to:
  - `https://<your-vercel-url>/api/auth/callback/google`
- [ ] Save changes

### 3. Run Database Migrations

On your local machine:

```bash
cd entrain-web/frontend
DATABASE_URL="<paste-render-postgres-internal-url>" npx prisma db push
```

**Alternative**: Use Render Shell:
- [ ] Go to Render → entrain-backend-api → Shell tab
- [ ] Run: `cd ../frontend && npx prisma db push`

### 4. Skip R2 Public Access (Not Needed)

- [ ] ~~Public access not needed~~ - presigned URLs handle this
- [ ] CORS policy already added in Pre-Deployment step
- [ ] Nothing to do here!

```json
[
  {
    "AllowedOrigins": ["*"],
    "AllowedMethods": ["GET", "HEAD"],
    "AllowedHeaders": ["*"],
    "ExposeHeaders": []
  }
]
```

---

## 🧪 Test Your Deployment

### 1. Test Frontend

- [ ] Visit your Vercel URL
- [ ] Check that the landing page loads
- [ ] Try signing in with Google OAuth

### 2. Test Job Creation

- [ ] Sign in and go to `/generate`
- [ ] Create a test meditation (use minimal settings to save credits)
- [ ] Verify job appears in dashboard
- [ ] Check Render logs:
  - [ ] Go to entrain-backend-api → Logs
  - [ ] Backend API received the request
  - [ ] Go to entrain-worker → Logs
  - [ ] RQ worker picked up the job
  - [ ] No errors in worker logs

### 3. Test File Download

- [ ] Wait for job to complete
- [ ] Click download in dashboard
- [ ] Verify file downloads successfully
- [ ] Check R2 bucket has the file (Cloudflare → R2 → entrain-audio-files)

### 4. Check Render Service Status

- [ ] entrain-backend-api: Shows "Live", no errors
- [ ] entrain-worker: Shows "Live", job processed successfully
- [ ] entrain-postgres: Shows "Available"
- [ ] entrain-redis: Shows "Available"

---

## 🐛 Troubleshooting

### Backend won't start
- Check Render → entrain-backend-api → Logs for Python errors
- Verify all environment variables are set
- Ensure `DATABASE_URL` and `REDIS_URL` are **Internal URLs** from Render

### Worker not processing jobs
- Check if worker shows "Live" (free tier spins down after 15 min inactivity)
- Check entrain-worker → Logs for errors
- Ensure `REDIS_URL` is identical between backend and worker
- If on free tier, first request after spin-down will be slow

### OAuth not working
- Verify `AUTH_SECRET` is identical in backend and frontend
- Check Google Console redirect URIs match exactly (https://{your-url}/api/auth/callback/google)
- Ensure `AUTH_GOOGLE_ID` and `AUTH_GOOGLE_SECRET` are correct

### Database connection errors
- Use Render's **Internal Database URL** (not External)
- Check if Postgres shows "Available" status
- Verify Prisma migrations ran successfully
- Check connection string format

### File upload/download failing
- Verify R2 credentials are correct (check for typos)
- Check R2 bucket CORS settings in Cloudflare
- Check worker logs for upload errors
- Verify `STORAGE_TYPE=r2` is set

### Frontend build failing
- Check Vercel build logs for errors
- Verify all environment variables are set
- Ensure `DATABASE_URL` is accessible from Vercel

### Services spinning down (free tier)
- Free tier services sleep after 15 min inactivity
- First request will be slow (~30-60 seconds)
- Upgrade to paid plan for always-on services

---

## 💰 Expected Costs

**Free Tier (with cold starts):**
- **Render**: FREE for 90 days, then:
  - Postgres: $7/month (after free trial)
  - Redis: Free (25MB limit)
  - Backend API: Free (spins down)
  - Worker: Free (spins down)
- **Vercel**: Free (Hobby plan)
- **Cloudflare R2**: ~$0.01-1/month
  - Storage: $0.015/GB
  - Egress: $0 (no fees!)
- **ElevenLabs**: Variable (~$0.30/1k characters)

**Total FREE: $0-2/month** (just R2 + ElevenLabs)
**After 90 days: $7-10/month** (Postgres becomes paid)

**Production Tier (always-on, no cold starts):**
- **Render**: ~$31/month
  - Postgres Starter: $7
  - Redis: $10
  - Backend API Starter: $7
  - Worker Starter: $7
- **Vercel**: Free
- **R2**: ~$0.01-1/month
- **ElevenLabs**: Variable

**Total PRODUCTION: ~$31-40/month**

---

## 📝 Next Steps After Deployment

- [ ] Set up monitoring (Railway provides basic metrics)
- [ ] Configure database backups (Railway auto-backs up, but consider additional)
- [ ] Add error tracking (Sentry, Rollbar, etc.)
- [ ] Set up custom domain (optional)
- [ ] Add rate limiting for API endpoints
- [ ] Set up email notifications for job completion
- [ ] Configure log aggregation for easier debugging
- [ ] Plan for Phase 3: Monetization (Stripe, usage tracking)

---

## ✨ You're Live!

Congratulations! Your Entrain web app is now deployed and accessible to the world. Share your URL and start generating meditation tracks!

**Support:**
- Railway docs: https://docs.railway.app
- Vercel docs: https://vercel.com/docs
- Cloudflare R2 docs: https://developers.cloudflare.com/r2/

---

**Created:** Phase 2 Deployment
**Last Updated:** 2026-02-05
