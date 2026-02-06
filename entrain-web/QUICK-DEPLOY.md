# Quick Deploy Reference

Fast reference for experienced devs. See `DEPLOYMENT-CHECKLIST.md` for detailed walkthrough.

## Architecture

```
Frontend (Next.js) → Vercel
Backend (FastAPI) → Render
Worker (RQ) → Render
Database (Postgres) → Render
Cache (Redis) → Render
Storage (R2) → Cloudflare
```

## Render Setup

### Services to create:
1. PostgreSQL database (`entrain-postgres`)
2. Redis instance (`entrain-redis`)
3. Web Service: `entrain-backend-api` (root: `entrain-web/backend`)
4. Background Worker: `entrain-worker` (root: `entrain-web/backend`)

### Environment variables (backend):
```bash
DATABASE_URL=<Internal Database URL from Render>
REDIS_URL=<Internal Redis URL from Render>
ELEVENLABS_API_KEY=xxx
STORAGE_TYPE=r2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=entrain-audio-files
FRONTEND_URL=https://your-app.vercel.app
SECRET_KEY=$(openssl rand -hex 32)
AUTH_SECRET=$(openssl rand -base64 32)
AUTH_GOOGLE_ID=xxx
AUTH_GOOGLE_SECRET=xxx
```

### Environment variables (worker):
```bash
DATABASE_URL=<same as backend>
REDIS_URL=<same as backend>
ELEVENLABS_API_KEY=xxx
STORAGE_TYPE=r2
R2_ACCOUNT_ID=xxx
R2_ACCESS_KEY_ID=xxx
R2_SECRET_ACCESS_KEY=xxx
R2_BUCKET_NAME=entrain-audio-files
```

## Vercel Setup

### Root directory: `entrain-web/frontend`

### Environment variables:
```bash
AUTH_SECRET=<same as Railway>
AUTH_GOOGLE_ID=xxx
AUTH_GOOGLE_SECRET=xxx
DATABASE_URL=<Railway Postgres URL>
NEXT_PUBLIC_API_URL=https://backend-api-production-xxx.up.railway.app
```

## Cloudflare R2

1. Create bucket: `entrain-audio-files`
2. In R2 section, click "Manage R2 API Tokens"
3. Create **Account** token with "Object Read & Write" permissions
4. Add CORS policy in bucket settings:
```json
[{"AllowedOrigins":["*"],"AllowedMethods":["GET","HEAD"],"AllowedHeaders":["*"]}]
```

## Google OAuth

Add authorized redirect URI:
```
https://<your-vercel-url>/api/auth/callback/google
```

## Database Migration

```bash
cd entrain-web/frontend
DATABASE_URL="<render-internal-db-url>" npx prisma db push
```

Or use Render Shell:
```bash
# In Render backend service → Shell
cd ../frontend && npx prisma db push
```

## Key Files Modified for Deployment

- `backend/app/services/storage.py` - Added R2 upload/download
- `backend/worker/tasks.py` - Upload to R2 after generation
- `backend/app/routers/files.py` - Redirect to R2 presigned URLs
- `backend/requirements.txt` - Added boto3
- `backend/railway.json` - Render config (can ignore, Render auto-detects)

## Test Deployment

1. Sign in with Google
2. Generate test meditation
3. Check Render logs (backend + worker)
4. Download file from R2
5. Verify no errors

## Estimated Costs

**Free tier:**
- Render: Free (90 days Postgres free, then $7/mo)
- Vercel: Free
- R2: ~$0.01-1/mo
- ElevenLabs: Variable ($0.30/1k chars)

**Total: $0-2/mo** (just R2 + usage)
**After 90 days: $7-10/mo**

**Production (no cold starts):**
- Render: ~$31/mo
- Vercel: Free
- R2: ~$0.01-1/mo

**Total: ~$31-40/mo**
