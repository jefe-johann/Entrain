# Entrain Web App Architecture - Explained for Beginners

## Overview: What is Entrain?

Entrain is a meditation audio generation web app. Users log in, configure settings (affirmations, voice, binaural beats), and generate custom meditation tracks. The app processes these requests in the background and delivers downloadable audio files.

---

## The Big Picture: Where Everything Lives

Your app is split across **4 different services**. Each service has a specific job:

```
┌─────────────────────────────────────────────────────────────┐
│                          THE USER                            │
│                    (Browser: www.entrain.app)                │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  VERCEL - Frontend (Next.js)                                 │
│  • Hosts the website UI                                      │
│  • Handles user login (Google OAuth)                         │
│  • Sends generation requests to backend                      │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  RENDER - Backend API (FastAPI)                              │
│  • Receives generation requests                              │
│  • Queues jobs for background processing                     │
│  • Returns job status and download links                     │
│                                                               │
│  RENDER - RQ Worker (Background Job Processor)               │
│  • Runs inside the same service as the API                   │
│  • Generates audio files (binaural beats + TTS)              │
│  • Uploads finished files to R2                              │
└──────────────────────┬──────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  RENDER - PostgreSQL Database                                │
│  • Stores user accounts                                      │
│  • Stores job history and status                             │
│  • Tracks user credits                                       │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  RENDER - Redis (In-Memory Queue)                            │
│  • Holds the job queue for background worker                 │
│  • Fast temporary storage for job status                     │
└──────────────────────────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────┐
│  CLOUDFLARE R2 - File Storage                                │
│  • Stores generated audio files (.flac)                      │
│  • Serves download links to users                            │
└──────────────────────────────────────────────────────────────┘
```

---

## Service #1: Vercel (Frontend Hosting)

### What is Vercel?
A hosting platform specifically designed for **frontend web applications** (like Next.js, React, Vue). Think of it as a specialized web server that automatically builds and deploys your UI.

### What does it do for Entrain?
- **Hosts your Next.js frontend** at `www.entrain.app`
- **Builds your code** every time you push to GitHub
- **Handles SSL/HTTPS** automatically (free secure connections)
- **Serves static files** (HTML, CSS, JavaScript) super fast via CDN
- **Runs Edge Functions** (like your auth middleware)

### What lives on Vercel?
- **Code**: Everything in `/entrain-web/frontend/`
- **Pages**: Landing page, sign-in, dashboard, generate form
- **Auth logic**: Google OAuth sign-in (using Auth.js/NextAuth)
- **API routes**: `/api/auth/*` for authentication

### How users interact with it:
1. User visits `www.entrain.app`
2. Vercel serves the Next.js website
3. User signs in with Google (handled by Vercel + Auth.js)
4. User fills out generation form
5. Frontend sends request to Render backend API

### Key Environment Variables (Set in Vercel Dashboard):
- `DATABASE_URL` - Connection to Render Postgres (for Auth.js to store sessions)
- `AUTH_SECRET` - Secret key for encrypting auth tokens
- `AUTH_GOOGLE_ID` - Google OAuth app credentials
- `AUTH_GOOGLE_SECRET` - Google OAuth app secret
- `NEXT_PUBLIC_API_URL` - Points to your Render backend (`https://entrain-backend-api.onrender.com`)
- `NEXTAUTH_URL` - Your domain (`https://www.entrain.app`)

### Cost:
- **Free tier** (Hobby plan) - Generous limits, perfect for MVP

---

## Service #2: Render (Backend Hosting)

### What is Render?
A cloud platform that hosts **backend services** (APIs, databases, workers). Like Vercel but for server-side code instead of frontends. Similar to Heroku but more modern.

### What does Render host for you?

#### 2a. Web Service (FastAPI Backend + RQ Worker)
**What it does:**
- Runs your Python FastAPI server
- Receives API requests from the frontend
- Manages the job queue (via Redis)
- **Also runs an RQ Worker in the background** (in the same process)
  - The worker continuously checks Redis for new jobs
  - When a job appears, it generates the audio
  - Uploads finished files to Cloudflare R2

**What lives here:**
- Code: `/entrain-web/backend/` (FastAPI app + worker code)
- Endpoints:
  - `POST /api/users/sync` - Create/update user
  - `POST /api/jobs/generate` - Queue new audio generation
  - `GET /api/jobs/{id}` - Check job status
  - `GET /api/jobs/` - List user's jobs
  - `GET /api/files/{job_id}/download` - Get download URL

**How it works:**
1. Frontend sends generation request
2. Backend creates a job record in Postgres
3. Backend adds job to Redis queue
4. **RQ Worker (running in same process) picks up the job**
5. Worker generates audio using your Python code (binaural beats + ElevenLabs TTS)
6. Worker uploads finished file to R2
7. Worker updates job status in Postgres to "completed"

**Key Environment Variables (Set in Render Dashboard):**
- `DATABASE_URL` - Internal connection to Render Postgres (same network, fast)
- `REDIS_URL` - Internal connection to Render Redis
- `FRONTEND_URL` - Your Vercel domain (`https://www.entrain.app`) for CORS
- `ELEVENLABS_API_KEY` - API key for text-to-speech
- `STORAGE_TYPE=r2` - Tells backend to use Cloudflare R2
- `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET_NAME` - Cloudflare credentials
- `SECRET_KEY` - For internal auth tokens
- `AUTH_SECRET` - Matches the one in Vercel

**Cost:**
- **Free tier** - Service spins down after 15min inactivity (30-60s cold start when waking up)
- **Starter ($7/mo)** - Always-on, no cold starts

#### 2b. PostgreSQL Database
**What it does:**
- Stores all your persistent data in tables

**What's stored:**
- `users` table - User accounts (email, name, Google profile pic, credits)
- `accounts` table - OAuth provider links (Google login tokens)
- `sessions` table - User login sessions
- `jobs` table - Audio generation job history (status, config, file paths)
- `verification_tokens` table - Email verification (if you add email login later)

**Connection URLs:**
- **Internal URL**: `postgresql://jeff:...@dpg-xyz/entrain` - Used by backend (fast, same network)
- **External URL**: `postgresql://jeff:...@dpg-xyz.ohio-postgres.render.com/entrain` - Used from your laptop for migrations

**Cost:**
- **Free tier** - 90 days free, then $7/month
- 256MB RAM, 1GB storage (plenty for MVP)

#### 2c. Redis (In-Memory Queue)
**What it does:**
- Acts as a super-fast temporary storage for the job queue
- RQ (Redis Queue) library uses this to manage background jobs

**How it works:**
1. Backend adds job to Redis queue: `LPUSH entrain:queue {job_data}`
2. Worker watches Redis: "Any new jobs?"
3. Worker grabs job from queue: `BRPOP entrain:queue`
4. Worker processes job
5. Worker updates Postgres with final status

**Why not just use Postgres for the queue?**
- Redis is **in-memory** → super fast for real-time queue operations
- Postgres is **disk-based** → better for permanent storage
- Separate concerns: Redis = temporary queue, Postgres = permanent records

**Cost:**
- **Free tier** - 25MB storage (plenty for job queue metadata)
- Spins down after 15min inactivity on free plan

---

## Service #3: Cloudflare R2 (File Storage)

### What is Cloudflare R2?
An **object storage service** - basically a cloud hard drive for files. Like AWS S3 but cheaper (no egress fees). You upload files, get download URLs.

### What does it do for Entrain?
- Stores generated audio files (`.flac` format)
- Serves download links to users
- Handles CORS so browsers can download files

### How it works:
1. Worker generates audio file locally: `/tmp/job_abc123.flac`
2. Worker uploads to R2: `s3_client.upload_file('job_abc123.flac', bucket='entrain-audio-files')`
3. Worker generates a presigned download URL (valid for 1 hour)
4. Frontend shows download button with this URL
5. User clicks → browser downloads directly from R2

### Why not store files on Render?
- Render services are **ephemeral** - files disappear when service restarts
- R2 is **permanent** - files stay forever (or until you delete them)
- R2 is **cheaper** - $0.015/GB storage, $0 transfer fees

### Configuration (Set via Environment Variables on Render):
- `R2_ACCOUNT_ID` - Your Cloudflare account ID
- `R2_ACCESS_KEY_ID` - API key for uploading
- `R2_SECRET_ACCESS_KEY` - API secret
- `R2_BUCKET_NAME=entrain-audio-files` - Bucket name

### Cost:
- **~$0.01-1/month** depending on storage
- $0.015/GB storage
- $0 transfer fees (this is the killer feature vs AWS S3)

---

## Service #4: Porkbun (Domain Registrar)

### What is Porkbun?
A **domain name registrar** - you buy domain names from them. Like GoDaddy or Namecheap but cheaper.

### What does it do for Entrain?
- You own `entrain.app` through Porkbun
- Porkbun manages DNS (Domain Name System) records
- DNS tells browsers "www.entrain.app points to Vercel's servers"

### DNS Records You Set Up:
```
Type    Host              Answer                                     Purpose
────────────────────────────────────────────────────────────────────────────
A       entrain.app       216.198.79.1                               Points root domain to Vercel's IP
CNAME   www.entrain.app   05e26a2f2e6cdd1d.vercel-dns-017.com.       Points www to Vercel
```

**What this means:**
- When someone types `entrain.app` → DNS says "go to 216.198.79.1" (Vercel's server)
- When someone types `www.entrain.app` → DNS says "go to Vercel's CNAME" (also Vercel)
- Vercel receives the request and serves your Next.js site

### Cost:
- **~$10-15/year** depending on the domain

---

## Database Layer: Prisma ORM

### What is Prisma?
Prisma is an **ORM (Object-Relational Mapping)** tool. Think of it as a **translator between your JavaScript/TypeScript code and your PostgreSQL database**. Instead of writing raw SQL queries, you write JavaScript that Prisma converts to SQL automatically.

**Without Prisma (raw SQL):**
```sql
SELECT * FROM users WHERE email = 'jeff@example.com';
INSERT INTO jobs (user_id, status, config) VALUES (123, 'pending', '{}');
```

**With Prisma (JavaScript):**
```typescript
const user = await prisma.user.findUnique({ where: { email: 'jeff@example.com' } });
const job = await prisma.job.create({ data: { userId: 123, status: 'pending', config: {} } });
```

### Where does Prisma live?
**Frontend only** (`/entrain-web/frontend/`). Your backend (FastAPI/Python) uses SQLAlchemy instead, but Prisma is used by:
- **Auth.js** (for managing user sessions and accounts)
- **Next.js API routes** (if you add any custom database queries in the frontend)
- **Database migrations** (creating/updating tables)
- **Prisma Studio** (database GUI tool)

### The Prisma Schema File
Located at: `/entrain-web/frontend/prisma/schema.prisma`

This file defines your **database structure** in a human-readable format:

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  credits       Int       @default(1)
  emailVerified DateTime?
  createdAt     DateTime  @default(now())

  jobs          Job[]
  accounts      Account[]
  sessions      Session[]
}

model Job {
  id         String   @id @default(cuid())
  userId     String
  status     String   // "pending", "processing", "completed", "failed"
  config     Json
  filePath   String?
  createdAt  DateTime @default(now())

  user       User     @relation(fields: [userId], references: [id])
}
```

**What this means:**
- Each `model` becomes a **table** in PostgreSQL
- Each field becomes a **column**
- `@relation` creates **foreign keys** (links between tables)
- When you change this file and run `npx prisma db push`, Prisma updates your database structure

### How Prisma Fits in the Architecture

```
┌─────────────────────────────────────────────────┐
│  Next.js Frontend (TypeScript)                  │
│  ┌───────────────────────────────────────────┐  │
│  │  Auth.js (authentication)                 │  │
│  │  "Need to check if user exists..."        │  │
│  │                                            │  │
│  │  ↓                                         │  │
│  │                                            │  │
│  │  Prisma Client (Auto-generated)           │  │
│  │  prisma.user.findUnique({ ... })          │  │
│  │                                            │  │
│  │  ↓ (Prisma converts to SQL)               │  │
│  │                                            │  │
│  │  SELECT * FROM users WHERE email = '...'  │  │
│  └───────────────────┬───────────────────────┘  │
└────────────────────────┼────────────────────────┘
                         │
                         ↓ (SQL query sent)
         ┌───────────────────────────────┐
         │  PostgreSQL Database (Render)  │
         │  • users table                │
         │  • jobs table                 │
         │  • sessions table             │
         │  • accounts table             │
         └───────────────────────────────┘
```

### Prisma Client: The Magic Auto-Generated Code
When you run `npx prisma generate`, Prisma reads your schema file and creates a **type-safe database client** at `node_modules/.prisma/client`. This client knows about all your tables, columns, and relationships.

**Example queries you can make:**
```typescript
// Find a user by email
const user = await prisma.user.findUnique({
  where: { email: 'jeff@example.com' }
});

// Create a new job
const job = await prisma.job.create({
  data: {
    userId: user.id,
    status: 'pending',
    config: { duration: 40, voice: 'Rachel' }
  }
});

// Get all jobs for a user (with relationship)
const userWithJobs = await prisma.user.findUnique({
  where: { id: '123' },
  include: { jobs: true }  // Include related jobs
});

// Update job status
await prisma.job.update({
  where: { id: 'job_abc' },
  data: { status: 'completed', filePath: 'audio.flac' }
});
```

**TypeScript magic:** Prisma Client is fully typed! Your editor will autocomplete field names and catch typos before you run the code.

### Common Prisma Commands

**1. Update database structure (after changing schema):**
```bash
cd entrain-web/frontend
DATABASE_URL="postgresql://..." npx prisma db push
```
This creates/modifies tables to match your schema. Use this during development.

**2. Generate Prisma Client (after changing schema):**
```bash
npx prisma generate
```
Rebuilds the type-safe client. Usually runs automatically after `db push`.

**3. Open Prisma Studio (database GUI):**
```bash
DATABASE_URL="postgresql://..." npx prisma studio
```
Opens `localhost:5555` in your browser. You can:
- Browse all tables
- Add/edit/delete records manually
- Super helpful for debugging!

**4. Reset database (DANGER: deletes all data):**
```bash
npx prisma db push --force-reset
```
Only use in development when you want a clean slate.

### Why Use Prisma?

**For beginners:**
- ✅ **No SQL knowledge required** - Write JavaScript instead
- ✅ **Type safety** - Editor catches mistakes before runtime
- ✅ **Auto-completion** - Your editor suggests field names
- ✅ **Relationships made easy** - No complex JOIN queries
- ✅ **Database GUI** - Prisma Studio is easier than psql

**Alternative (raw SQL):**
```typescript
// Without Prisma - easy to make mistakes!
const result = await db.query(
  'SELECT * FROM users WHERE emal = $1',  // Typo: "emal" instead of "email"
  ['jeff@example.com']
);
const user = result.rows[0];  // No type checking!
```

**With Prisma:**
```typescript
// Prisma - TypeScript will error if you typo "email"
const user = await prisma.user.findUnique({
  where: { email: 'jeff@example.com' }
});
// ↑ user is fully typed - editor knows it has .id, .email, .name, etc.
```

### Where Prisma is Used in Entrain

**1. Auth.js (user authentication):**
- Checks if user exists in database
- Creates new users on first Google sign-in
- Stores OAuth tokens in `accounts` table
- Manages login sessions in `sessions` table

**2. Database migrations:**
- When you modify `schema.prisma`, Prisma updates PostgreSQL
- Keeps your database structure in sync with your code

**3. Manual database access:**
- Prisma Studio for viewing/editing data during development
- Troubleshooting user accounts or job records

### Prisma vs. SQLAlchemy (Backend)
You might notice the **backend uses SQLAlchemy** (Python ORM) instead of Prisma. Why?

- **Frontend**: Next.js (JavaScript/TypeScript) → uses Prisma
- **Backend**: FastAPI (Python) → uses SQLAlchemy

Both are ORMs, just for different languages. They both talk to the **same PostgreSQL database** but from different parts of your app.

**Key point:** Schema changes should be made in **Prisma schema** (since that's your source of truth), then manually updated in SQLAlchemy models to match.

### Real-World Example: User Sign-In Flow

```typescript
// This happens in Auth.js when user signs in with Google:

// 1. Check if user exists
const existingUser = await prisma.user.findUnique({
  where: { email: googleProfile.email }
});

if (!existingUser) {
  // 2. Create new user if first time signing in
  const newUser = await prisma.user.create({
    data: {
      email: googleProfile.email,
      name: googleProfile.name,
      image: googleProfile.picture,
      credits: 1  // Give 1 free credit
    }
  });

  // 3. Link Google account
  await prisma.account.create({
    data: {
      userId: newUser.id,
      provider: 'google',
      providerAccountId: googleProfile.id,
      accessToken: googleToken.accessToken
    }
  });
}

// 4. Create login session
await prisma.session.create({
  data: {
    userId: existingUser.id,
    sessionToken: randomToken,
    expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)  // 30 days
  }
});
```

Behind the scenes, Prisma converts this to SQL:
```sql
SELECT * FROM users WHERE email = 'jeff@example.com';
INSERT INTO users (id, email, name, image, credits) VALUES (...);
INSERT INTO accounts (user_id, provider, provider_account_id, access_token) VALUES (...);
INSERT INTO sessions (user_id, session_token, expires) VALUES (...);
```

But you never have to write those SQL queries yourself!

### Quick Reference: Prisma Files

| File Path | What It Does |
|-----------|--------------|
| `frontend/prisma/schema.prisma` | Database structure definition (source of truth) |
| `node_modules/.prisma/client/` | Auto-generated type-safe client (don't edit manually) |
| `frontend/lib/prisma.ts` | Prisma Client singleton (reused across app) |

### Troubleshooting Prisma Issues

**"Prisma Client is out of sync with schema"**
- **Solution**: Run `npx prisma generate`

**"Can't connect to database"**
- **Check**: `DATABASE_URL` environment variable is set
- **Check**: Using External URL (with `.ohio-postgres.render.com`) for local development
- **Check**: Database is running in Render dashboard

**"Migration failed"**
- **Cause**: Schema change conflicts with existing data
- **Solution**: In development, use `npx prisma db push --force-reset` (WARNING: deletes all data)
- **Production**: Use Prisma Migrate instead of `db push`

**"Type errors after schema change"**
- **Solution**: Restart your TypeScript server (VS Code: Cmd+Shift+P → "Restart TS Server")
- **Solution**: Delete `node_modules/.prisma` and run `npx prisma generate` again

---

## How a User Request Flows Through the System

### Scenario 1: User Generates Audio

```
1. User fills out form on www.entrain.app (Vercel/Next.js)
   └─> Browser: "I want to generate audio with these settings"

2. Frontend sends POST request to Render backend
   └─> https://entrain-backend-api.onrender.com/api/jobs/generate

3. Render Backend (FastAPI):
   a. Creates job record in Postgres (status: "pending")
   b. Adds job to Redis queue
   c. Returns job_id to frontend

4. Frontend starts polling backend every 2 seconds
   └─> GET /api/jobs/{job_id}

5. RQ Worker (running in background on Render):
   a. Sees new job in Redis queue
   b. Generates binaural beats (using scipy/numpy)
   c. Calls ElevenLabs API for voice affirmations
   d. Mixes audio together
   e. Saves to /tmp/job_{id}.flac
   f. Uploads file to Cloudflare R2
   g. Updates Postgres: status = "completed", file_path = "job_{id}.flac"

6. Next poll from frontend gets status="completed"
   └─> Backend generates R2 presigned download URL
   └─> Frontend shows "Download" button

7. User clicks download
   └─> Browser downloads directly from Cloudflare R2
   └─> No middleman - fast, cheap transfer
```

### Scenario 2: User Signs In

```
1. User clicks "Sign in with Google" on www.entrain.app

2. Vercel (Auth.js) redirects to Google OAuth
   └─> google.com/oauth/authorize?client_id=...

3. User approves on Google

4. Google redirects back to Vercel
   └─> www.entrain.app/api/auth/callback/google?code=xyz

5. Vercel (Auth.js):
   a. Exchanges code for Google user info
   b. Checks Postgres (on Render) for existing user
   c. If new: Creates user in Postgres with 1 free credit
   d. If new: Syncs user to backend via POST /api/users/sync
   e. Creates session in Postgres
   f. Sets encrypted session cookie

6. User is now logged in!
   └─> Frontend shows dashboard with credit count
```

---

## Environment Variables: Where They're Set

### Vercel (Frontend) Environment Variables
Set in: Vercel Dashboard → Project → Settings → Environment Variables

```
DATABASE_URL              = postgresql://jeff:...@dpg-xyz.ohio-postgres.render.com/entrain
AUTH_SECRET               = <random-string-32-chars>
AUTH_GOOGLE_ID            = <google-oauth-client-id>
AUTH_GOOGLE_SECRET        = <google-oauth-secret>
NEXT_PUBLIC_API_URL       = https://entrain-backend-api.onrender.com
NEXTAUTH_URL              = https://www.entrain.app
```

### Render Backend Environment Variables
Set in: Render Dashboard → Service → Environment → Environment Variables

```
DATABASE_URL              = postgresql://jeff:...@dpg-xyz/entrain  (Internal URL!)
REDIS_URL                 = redis://red-xyz:6379  (Internal URL!)
ELEVENLABS_API_KEY        = <your-elevenlabs-api-key>
STORAGE_TYPE              = r2
R2_ACCOUNT_ID             = <cloudflare-account-id>
R2_ACCESS_KEY_ID          = <cloudflare-access-key>
R2_SECRET_ACCESS_KEY      = <cloudflare-secret>
R2_BUCKET_NAME            = entrain-audio-files
FRONTEND_URL              = https://www.entrain.app
SECRET_KEY                = <random-hex-32-bytes>
AUTH_SECRET               = <same-as-vercel>
```

**Important Note:**
- Vercel uses **External Database URL** (includes `.ohio-postgres.render.com`)
- Render uses **Internal Database URL** (just `dpg-xyz`)
- Internal URLs are faster and free (same network)

---

## Common Tasks You'll Do

### Deploy New Code

**Frontend (Vercel):**
1. Push code to GitHub: `git push`
2. Vercel auto-deploys (watches `main` branch)
3. Wait 2-3 minutes for build
4. Check deployment in Vercel dashboard

**Backend (Render):**
1. Push code to GitHub: `git push`
2. Go to Render dashboard → Service
3. Click "Manual Deploy" → "Deploy latest commit"
4. Wait 3-5 minutes for build

### Update Environment Variables

**Vercel:**
1. Dashboard → Settings → Environment Variables
2. Add/Edit variable
3. Click "Save"
4. Redeploy automatically triggered

**Render:**
1. Dashboard → Service → Environment
2. Add/Edit variable
3. Click "Save"
4. Manually click "Manual Deploy" (or changes apply on next deploy)

### Check Logs

**Vercel:**
- Dashboard → Deployments → Click deployment → "Logs" tab
- See build logs and runtime errors

**Render:**
- Dashboard → Service → "Logs" tab
- Real-time streaming logs
- Filter by "Build" or "Deploy" or "App" logs

### Run Database Migration

When you change Prisma schema:
```bash
cd entrain-web/frontend
DATABASE_URL="postgresql://jeff:...@dpg-xyz.ohio-postgres.render.com/entrain" npx prisma db push
```

This updates the database tables to match your schema.

### Access Database Directly

**Option 1: Prisma Studio**
```bash
cd entrain-web/frontend
DATABASE_URL="postgresql://jeff:...@dpg-xyz.ohio-postgres.render.com/entrain" npx prisma studio
```
Opens web UI at localhost:5555 to browse/edit database

**Option 2: psql (PostgreSQL CLI)**
```bash
psql "postgresql://jeff:...@dpg-xyz.ohio-postgres.render.com/entrain"
```

---

## Why This Architecture?

### Why separate frontend and backend?
- **Specialization**: Vercel is optimized for frontends, Render for backends
- **Scaling**: Can scale frontend and backend independently
- **Cost**: Vercel's free tier is generous for frontends
- **Edge delivery**: Vercel serves your UI from CDN (fast globally)

### Why use a background worker?
- Audio generation takes 30-60 seconds
- Can't make user wait that long for HTTP response (timeouts!)
- Worker processes jobs asynchronously
- User can close browser, job keeps running

### Why Redis + Postgres?
- **Redis**: Fast queue operations, temporary data
- **Postgres**: Permanent records, complex queries
- Best of both worlds

### Why Cloudflare R2 instead of AWS S3?
- **Cost**: No egress fees (S3 charges for downloads)
- **Simpler**: Same S3 API, easier pricing
- For an MVP with potentially viral growth, egress fees could get expensive fast

---

## Costs Summary (Monthly)

| Service | Plan | Cost | What You Get |
|---------|------|------|--------------|
| Vercel | Free (Hobby) | $0 | Frontend hosting, unlimited bandwidth |
| Render Web Service | Free | $0 | Backend API + Worker (spins down after 15min) |
| Render Postgres | Free → Paid | $0 (90 days) → $7 | 1GB storage, plenty for MVP |
| Render Redis | Free | $0 | 25MB queue storage |
| Cloudflare R2 | Pay-as-you-go | ~$0.01-1 | File storage, $0 transfer |
| Porkbun Domain | Annual | ~$1.25/mo | Domain name |
| ElevenLabs | Pay-as-you-go | Variable | ~$0.30 per 1k characters |

**Current total: ~$1-3/month**
**After 90 days: ~$8-10/month** (when Postgres free trial ends)

---

## Troubleshooting Common Issues

### "Service Unavailable" on entrain-backend-api.onrender.com
- **Cause**: Free tier spins down after 15min inactivity
- **Solution**: Wait 30-60s for cold start, or upgrade to Starter plan ($7/mo)

### OAuth redirect error
- **Check**: Google Cloud Console has correct redirect URI
- Should be: `https://www.entrain.app/api/auth/callback/google`
- **Check**: `NEXTAUTH_URL` in Vercel matches your domain

### Database connection error
- **Check**: Using correct DATABASE_URL (External for local, Internal for Render)
- **Check**: Database status in Render dashboard (should be "Available")

### Jobs stuck in "pending" status
- **Check**: Render backend logs for worker errors
- **Check**: Redis is running (Render dashboard)
- **Check**: ELEVENLABS_API_KEY is set correctly

### File download fails
- **Check**: R2 credentials are correct
- **Check**: R2 bucket CORS is configured for your domain
- **Check**: Presigned URL hasn't expired (1 hour limit)

---

## Next Steps / Future Improvements

### To eliminate cold starts ($7/month):
- Upgrade Render Web Service to Starter plan
- Service stays always-on, no 30-60s wait

### To add more features:
- **Email notifications**: Use service like SendGrid when jobs complete
- **Stripe payments**: Add paid credits beyond the 1 free credit
- **Custom voices**: Upload voice samples for ElevenLabs voice cloning
- **Scheduling**: Let users schedule meditations for specific times

### To scale beyond free tier:
1. Monitor Render metrics (CPU, memory, response times)
2. If slow: Upgrade Render to bigger instance
3. If lots of traffic: Consider Vercel Pro ($20/mo) for analytics
4. If lots of storage: R2 scales automatically (just pay for what you use)

---

## Glossary

- **CDN (Content Delivery Network)**: Network of servers that cache your website globally for fast access
- **CORS (Cross-Origin Resource Sharing)**: Security rules about which websites can access your API
- **DNS (Domain Name System)**: Phone book of the internet - maps domain names to IP addresses
- **Edge Function**: Code that runs on CDN servers (close to users) instead of your main server
- **Environment Variable**: Secret configuration values (API keys, database URLs) stored separately from code
- **OAuth**: "Sign in with Google" - lets users log in without creating new passwords
- **Presigned URL**: Temporary download link that expires (like a guest pass)
- **Cold Start**: Delay when a service wakes up from sleep (free tier behavior)
- **Internal URL**: Connection string that only works within Render's private network (fast, free)
- **External URL**: Connection string that works from anywhere (slower, but necessary for local access)

---

**Created**: February 2026
**Last Updated**: February 2026

When you come back to this project, start here! This doc should help you remember how everything fits together.
