# Entrain Web - Deployment Guide

## Overview

This guide walks you through deploying Entrain for the first time.

**Architecture:**
- Frontend (Next.js) → Vercel
- Backend (FastAPI) → Render
- Worker (RQ) → Render
- Database (Postgres) → Render
- Queue (Redis) → Render
- File Storage (R2) → Cloudflare

---

## Prerequisites

Before starting, create accounts at:
1. **Vercel** - https://vercel.com (sign in with GitHub)
2. **Render** - https://render.com (sign in with GitHub)
3. **Cloudflare** - for R2 file storage

---

## Part 1: Set Up File Storage

### Option A: AWS S3 (most common)

1. Go to AWS Console → S3
2. Create a new bucket:
   - Name: `entrain-audio-files` (must be globally unique)
   - Region: Choose closest to your users
   - Block all public access: **OFF** (we need public download links)
   - Enable versioning: Optional
3. Create an IAM user for programmatic access:
   - Go to IAM → Users → Add user
   - User name: `entrain-s3-user`
   - Access type: Programmatic access
   - Attach policy: `AmazonS3FullAccess` (or create custom policy)
   - Save the Access Key ID and Secret Access Key
4. Configure CORS on your bucket:
   - Go to bucket → Permissions → CORS
   - Add this configuration:
   ```json
   [
     {
       "AllowedHeaders": ["*"],
       "AllowedMethods": ["GET", "HEAD"],
       "AllowedOrigins": ["*"],
       "ExposeHeaders": []
     }
   ]
   ```

**Note down these values:**
- `AWS_ACCESS_KEY_ID`
- `AWS_SECRET_ACCESS_KEY`
- `AWS_S3_BUCKET_NAME`
- `AWS_REGION`

### Option B: Cloudflare R2 (cheaper, no egress fees)

1. Go to Cloudflare Dashboard → R2
2. Create a new bucket: `entrain-audio-files`
3. Create API token:
   - Go to R2 → Manage R2 API Tokens
   - Create API Token with Edit permissions
   - Save the Access Key ID and Secret Access Key
4. Enable public access:
   - Go to bucket settings → Public access → Allow

**Note down these values:**
- `R2_ACCESS_KEY_ID`
- `R2_SECRET_ACCESS_KEY`
- `R2_BUCKET_NAME`
- `R2_ACCOUNT_ID`

---

## Part 2: Deploy Backend to Render

### Step 1: Create PostgreSQL Database

1. Go to https://render.com/dashboard
2. Click **"New +"** → **"PostgreSQL"**
3. Configure:
   - **Name**: `entrain-postgres`
   - **Database**: `entrain` (or leave default)
   - **User**: `entrain` (or leave default)
   - **Region**: Choose closest to your users
   - **Plan**: **Free** (or Starter if you need production performance)
4. Click **"Create Database"**
5. Wait for it to provision (~2 minutes)
6. Once ready, click on the database and find **"Internal Database URL"**
7. **SAVE THIS URL** - you'll need it for all services

### Step 2: Create Redis Instance

1. Click **"New +"** → **"Redis"**
2. Configure:
   - **Name**: `entrain-redis`
   - **Region**: Same as your Postgres (important for low latency)
   - **Plan**: **Free** (or paid if you need always-on)
3. Click **"Create Redis"**
4. Once ready, find the **"Internal Redis URL"** (looks like `redis://red-xxx:6379`)
5. **SAVE THIS URL**

### Step 3: Create Backend API Service

1. Click **"New +"** → **"Web Service"**
2. Connect your GitHub repository
3. Configure:
   - **Name**: `entrain-backend-api`
   - **Region**: Same as Postgres/Redis
   - **Branch**: `main` (or your default branch)
   - **Root Directory**: `entrain-web/backend`
   - **Runtime**: **Python 3**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: **Free** (or Starter $7/mo for no cold starts)

4. Click **"Advanced"** and add **Environment Variables**:
   ```
   DATABASE_URL=<paste your Internal Database URL from Step 1>
   REDIS_URL=<paste your Internal Redis URL from Step 2>
   ELEVENLABS_API_KEY=<your-elevenlabs-key>
   STORAGE_TYPE=r2
   R2_ACCOUNT_ID=<from Cloudflare>
   R2_ACCESS_KEY_ID=<from Cloudflare>
   R2_SECRET_ACCESS_KEY=<from Cloudflare>
   R2_BUCKET_NAME=entrain-audio-files
   FRONTEND_URL=https://placeholder.vercel.app
   SECRET_KEY=<generate with: openssl rand -hex 32>
   AUTH_SECRET=<generate with: openssl rand -base64 32>
   AUTH_GOOGLE_ID=<from Google Console>
   AUTH_GOOGLE_SECRET=<from Google Console>
   ```

5. Click **"Create Web Service"**
6. Wait for the first deploy to complete (~3-5 minutes)
7. Once deployed, copy your service URL (e.g., `https://entrain-backend-api.onrender.com`)
8. **SAVE THIS URL** - you'll need it for the frontend

### Step 4: Create RQ Worker Service

1. Click **"New +"** → **"Background Worker"**
2. Connect your GitHub repository (same as backend)
3. Configure:
   - **Name**: `entrain-worker`
   - **Region**: Same as others
   - **Branch**: `main`
   - **Root Directory**: `entrain-web/backend`
   - **Runtime**: **Python 3**
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python worker/run_worker.py`
   - **Plan**: **Free** (or Starter for always-on)

4. Add **Environment Variables** (same as backend):
   ```
   DATABASE_URL=<paste your Internal Database URL>
   REDIS_URL=<paste your Internal Redis URL>
   ELEVENLABS_API_KEY=<your-elevenlabs-key>
   STORAGE_TYPE=r2
   R2_ACCOUNT_ID=<from Cloudflare>
   R2_ACCESS_KEY_ID=<from Cloudflare>
   R2_SECRET_ACCESS_KEY=<from Cloudflare>
   R2_BUCKET_NAME=entrain-audio-files
   ```

5. Click **"Create Background Worker"**
6. Wait for it to deploy

### Step 5: Run Database Migrations

After the backend is deployed, run Prisma migrations:

**Option A - Locally:**
```bash
cd entrain-web/frontend
DATABASE_URL="<your-render-postgres-url>" npx prisma db push
```

**Option B - Using Render Shell:**
1. Go to your backend service in Render
2. Click **"Shell"** tab
3. Run:
   ```bash
   cd /entrain-web/frontend
   npx prisma db push
   ```

### Step 6: Verify Services Are Running

Check that all services show **"Live"** status in Render dashboard:
- ✅ entrain-postgres
- ✅ entrain-redis
- ✅ entrain-backend-api
- ✅ entrain-worker

If any failed, check the logs for errors.

---

## Part 3: Deploy Frontend to Vercel

### Step 1: Create Vercel Project

1. Go to https://vercel.com
2. Click "Add New" → "Project"
3. Import your GitHub repository
4. Configure the project:
   - **Framework Preset**: Next.js
   - **Root Directory**: `entrain-web/frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`

### Step 2: Environment Variables

Add these in Vercel project settings → Environment Variables:

```
# Database (Vercel needs direct connection for Prisma)
DATABASE_URL=<your-render-postgres-url>

# Auth
AUTH_SECRET=<same as backend>
NEXTAUTH_URL=<your-vercel-url>  # Vercel will provide this after first deploy

# Google OAuth
AUTH_GOOGLE_ID=<your-google-client-id>
AUTH_GOOGLE_SECRET=<your-google-client-secret>

# Backend API URL
NEXT_PUBLIC_API_URL=<your-render-backend-url>
```

### Step 3: Deploy

1. Click "Deploy"
2. Vercel will build and deploy your frontend
3. After deployment, get your URL (e.g., `https://entrain.vercel.app`)

### Step 4: Update Auth URLs

1. Go back to Render → entrain-backend-api → Environment
2. Update `FRONTEND_URL` to your Vercel URL
3. Click **"Save Changes"** (Render will auto-redeploy)

---

## Part 4: Configure Google OAuth

You need to add your production URLs to Google Cloud Console:

1. Go to https://console.cloud.google.com
2. Navigate to your OAuth app
3. Add authorized redirect URIs:
   - `https://<your-vercel-url>/api/auth/callback/google`
4. Save changes

---

## Part 5: Test Your Deployment

1. Visit your Vercel frontend URL
2. Try signing in with Google
3. Create a new audio generation job
4. Check Render logs to see:
   - Backend API receiving the request
   - RQ worker processing the job
   - File uploaded to R2

---

## Troubleshooting

### Backend won't start
- Check Render logs (click on service → "Logs" tab)
- Verify all environment variables are set correctly
- Ensure `DATABASE_URL` and `REDIS_URL` are the **Internal URLs** from Render

### Worker not processing jobs
- Check worker logs in Render
- Verify `REDIS_URL` is identical between backend and worker
- Ensure worker service shows "Live" status (not crashed)
- Check if you're on free tier - services spin down after 15 min inactivity

### Database connection issues
- Use Render's Internal Database URL (not External)
- Check if database is "Available" in Render dashboard
- Verify connection string format is correct

### File uploads failing
- Verify S3/R2 credentials are correct
- Check bucket CORS configuration
- Ensure bucket has public read access for download URLs

### OAuth not working
- Verify callback URLs in Google Console
- Check `NEXTAUTH_URL` matches your Vercel URL
- Ensure `NEXTAUTH_SECRET` is the same across all services

---

## Costs

**Free Tier (with limitations):**
- Vercel: Free (hobby plan, generous limits)
- Render: FREE for all services
  - Postgres: 90 days free, then $7/month
  - Redis: Free with 25MB limit
  - Web Service: Free (spins down after 15 min inactivity)
  - Background Worker: Free (spins down after 15 min inactivity)
- R2: ~$0.01-1/month (~$0.015/GB storage, $0 transfer)
- ElevenLabs: Variable ($0.30/1k characters)

**Total free tier: ~$0-5/month** (just R2 + ElevenLabs usage)

**Production Tier (no cold starts):**
- Vercel: Free (still free!)
- Render:
  - Postgres: $7/month (Starter plan)
  - Redis: $10/month (for always-on with more storage)
  - Web Service: $7/month (Starter plan, no spin down)
  - Background Worker: $7/month (Starter plan, no spin down)
- R2: ~$0.01-1/month
- ElevenLabs: Variable

**Total production: ~$31-40/month**

**Note:** Free tier is great for testing/low usage. Upgrade to paid tier when you need always-on reliability.

---

## Next Steps

After successful deployment:

1. **Monitor**: Check Render dashboard for service health
2. **Logs**: Render has built-in log streaming
3. **Database backups**: Render auto-backs up Postgres on paid plans
4. **Performance**: Monitor cold starts on free tier - upgrade if needed
5. **Scaling**: Render auto-scales horizontally on paid plans

---

## Phase 3 Preview (Monetization)

Once Phase 2 is stable, you can add:
- Stripe for payments
- Usage tracking and credit system
- Premium features
- Better error handling and notifications
