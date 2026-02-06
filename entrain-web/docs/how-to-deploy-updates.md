# How to Deploy Updates to Production

Quick reference for deploying changes after you've been away from the project.

---

## TL;DR - The Update Workflow

```bash
# 1. Make your changes locally
# 2. Test them
# 3. Commit and push
git add .
git commit -m "Description of changes"
git push

# 4. Deploy frontend (automatic)
# → Vercel auto-deploys when you push to GitHub

# 5. Deploy backend (manual)
# → Go to Render dashboard and click "Manual Deploy"
```

---

## Detailed Steps

### Step 1: Make Changes Locally

Edit whatever you need:
- **Frontend changes**: `/entrain-web/frontend/` (UI, pages, components)
- **Backend changes**: `/entrain-web/backend/` (API, worker, business logic)
- **Shared logic**: Root `/generate.py` (core audio generation)

### Step 2: Test Locally

**Frontend:**
```bash
cd entrain-web/frontend
npm run dev
# Visit http://localhost:3000
```

**Backend + Worker:**
```bash
cd entrain-web/backend
uvicorn app.main:app --reload
# API at http://localhost:8000
# Worker runs automatically in background thread
```

Make sure everything works before deploying!

### Step 3: Commit Your Changes

```bash
git add .
git commit -m "Add feature X / Fix bug Y / Update UI"
git push
```

### Step 4: Deploy Frontend (Vercel - Automatic ✅)

**What happens:**
- Vercel detects your GitHub push
- Automatically starts building
- Deploys to `www.entrain.app`
- Takes ~2-3 minutes

**How to monitor:**
1. Go to https://vercel.com
2. Click your project
3. Watch the deployment progress

**It's done when:** You see green checkmark ✓ in Vercel dashboard

---

### Step 5: Deploy Backend (Render - Manual 🔘)

**Why manual?**
- You're using "Public GitHub" connection (not authenticated GitHub)
- No auto-deploy unless you set up Blueprints
- One extra click, but gives you control over when backend updates

**How to deploy:**

1. **Go to Render dashboard:**
   - https://dashboard.render.com/web/srv-d62k9icoud1c73d04ek0
   - (Or: Render Dashboard → Services → `entrain-backend-api`)

2. **Click "Manual Deploy" button** (top right)

3. **Select "Deploy latest commit"**

4. **Wait for deployment** (~3-5 minutes)
   - Watch the build logs
   - Look for: ✓ Build successful → Service live

5. **Verify it worked:**
   - Check logs for: `✅ FastAPI + RQ Worker started successfully`
   - Test an API endpoint: https://entrain-backend-api.onrender.com/health

---

## Special Cases

### If You Changed the Database Schema

When you modify Prisma schema (`frontend/prisma/schema.prisma`):

**1. Update the production database:**
```bash
cd entrain-web/frontend
DATABASE_URL="postgresql://jeff:tE2PkmqCUKFnHTgMtX25kl8Qy2qUlUrJ@dpg-d62jar1r0fns738otvqg-a.ohio-postgres.render.com/entrain" npx prisma db push
```

**2. Then deploy frontend and backend normally**

**⚠️ Warning:** `prisma db push` immediately changes production database. Test schema changes locally first!

---

### If You Added New Environment Variables

**Vercel (Frontend):**
1. Dashboard → Project → Settings → Environment Variables
2. Add new variable
3. Save → Vercel auto-redeploys with new env var

**Render (Backend):**
1. Dashboard → Service → Environment tab
2. Add new variable
3. Save
4. **Must manually deploy** for changes to take effect
   - Click "Manual Deploy" → "Deploy latest commit"

---

### If You Added New Dependencies

**Frontend:**
- Added to `package.json`?
- Vercel automatically runs `npm install` during build
- No extra steps needed!

**Backend:**
- Added to `requirements.txt`?
- Render automatically runs `pip install` during build
- No extra steps needed!

---

### If Both Frontend and Backend Changed

**Deploy in this order:**

1. **Backend first** (manual deploy on Render)
   - Wait for it to go live
   - This ensures API is ready when frontend expects it

2. **Frontend second** (already auto-deployed by Vercel)
   - If it deployed before backend was ready, just wait
   - Frontend will connect to new backend once it's live

**Why this order matters:**
- Frontend makes API calls to backend
- Better to have new backend ready before new frontend tries to use it
- Prevents brief period where new frontend calls old backend

---

## Troubleshooting Deployments

### Vercel Build Failed

**Where to check:**
- Vercel Dashboard → Deployments → Click failed deployment → Logs tab

**Common causes:**
- TypeScript errors (fix in code, push again)
- Missing environment variables (add in Vercel settings)
- `npm install` failed (check package.json syntax)
- Next.js security vulnerability (upgrade Next.js version)

**Fix and redeploy:**
- Fix the issue locally
- Push again → Vercel auto-deploys

---

### Render Build Failed

**Where to check:**
- Render Dashboard → Service → Logs tab → Filter by "Build"

**Common causes:**
- Missing Python dependency in `requirements.txt`
- Syntax error in Python code
- Missing environment variable
- Database connection failed during build

**Fix and redeploy:**
- Fix the issue locally
- Push to GitHub
- Click "Manual Deploy" again in Render

---

### Backend Works But Jobs Fail

**Check worker logs:**
- Render Dashboard → Service → Logs → Look for worker errors

**Common issues:**
- `ELEVENLABS_API_KEY` missing or invalid
- `R2_*` credentials wrong
- Redis connection failed (check Redis service is running)
- Out of ElevenLabs credits

**How to debug:**
- Check environment variables in Render
- Look for Python tracebacks in logs
- Test ElevenLabs API key manually

---

### Frontend Can't Reach Backend

**Check:**
1. Is backend service live? (Check Render dashboard)
2. Might be cold starting? (Wait 30-60s on free tier)
3. Is `NEXT_PUBLIC_API_URL` set correctly in Vercel?
   - Should be: `https://entrain-backend-api.onrender.com`

**Test backend directly:**
```bash
curl https://entrain-backend-api.onrender.com/health
# Should return: {"status":"healthy"}
```

If curl works but frontend doesn't:
- Check CORS settings in backend `main.py`
- Verify `FRONTEND_URL` env var in Render matches your domain

---

## Quick Reference: Where Things Are

| What | Where to Update | How to Deploy |
|------|----------------|---------------|
| UI/Pages | `frontend/app/`, `frontend/components/` | Push → Vercel auto-deploys |
| API Endpoints | `backend/app/routers/` | Push → Render manual deploy |
| Database Schema | `frontend/prisma/schema.prisma` | Run `prisma db push` then deploy |
| Audio Generation | Root `generate.py` or `backend/worker/generator.py` | Push → Render manual deploy |
| Environment Variables | Vercel/Render dashboards | Add in dashboard → Redeploy |
| Dependencies | `package.json` or `requirements.txt` | Push → Auto-installed during build |

---

## Setting Up Auto-Deploy (Optional)

If you get tired of manual deploys, you can set up Blueprints:

**What it does:** Render auto-deploys on GitHub push (like Vercel does)

**How to set up:**
1. Create `render.yaml` in repo root
2. Define your services in YAML
3. Connect to Render via Blueprints
4. Push → auto-deploy

**Trade-off:** More setup complexity, but saves clicks later

See Render docs: https://render.com/docs/infrastructure-as-code

For now, manual deploys are fine for an MVP!

---

## Rollback If Something Breaks

### Vercel (Frontend)
1. Dashboard → Deployments
2. Find last working deployment (green checkmark)
3. Click "..." menu → "Promote to Production"
4. Instant rollback!

### Render (Backend)
1. Dashboard → Service → Deployments tab
2. Find last successful deploy
3. Click "Redeploy" on that specific deploy
4. Rolls back to that version

**Then:** Fix the bug locally, test, and redeploy the fix

---

## Best Practices

✅ **Test locally before deploying** - Saves debugging time in production

✅ **Deploy backend first** - When both change, backend should be ready first

✅ **Check logs immediately** - Catch errors right after deploy

✅ **Small, frequent deploys** - Easier to debug than giant changes

✅ **Keep staging/production env vars in sync** - Document any differences

✅ **Commit before deploying** - Always have a git history to roll back to

---

**Created**: February 2026
**Last Updated**: February 2026

Remember: Push code → Vercel auto-deploys → Render manual deploy. That's it!
