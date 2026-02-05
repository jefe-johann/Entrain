# Entrain Web - Dev Status

## Current State: Generation Pipeline Working

### What's Working
- Docker: PostgreSQL (5432) + Redis (6379) running
- Backend API: http://localhost:8000 (FastAPI)
- Frontend: http://localhost:3000 (Next.js 15)
- RQ Worker: Running for job processing
- Google OAuth: Configured and working
- **Job creation and processing: Working**
- User signed in: 69tchami69@gmail.com (1 credit)

### Recent Fixes Applied
1. **Backend .env malformed** - `ELEVENLABS_API_KEY=` prefix was missing (line 8 just had the key value)
2. **macOS fork() crash** - RQ worker crashed with SIGABRT when forking processes that use ElevenLabs HTTP client (Objective-C bindings). Fixed by adding `OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES` to `run_worker.py`
3. **Previous fix**: `updated_at` null error in `backend/app/models/job.py`

### Next Step
- ElevenLabs quota exhausted (7 credits remaining, need 28+). Add more credits to test full generation
- Or test with fewer/shorter affirmations

### Start Commands (if services stopped)
```bash
cd entrain-web

# Docker (if not running)
docker compose up -d

# Backend
cd backend && source .venv/bin/activate
uvicorn app.main:app --reload --port 8000 &

# Worker
python -m worker.run_worker &

# Frontend
cd ../frontend && npm run dev &
```

### Key Files Modified
- `backend/app/models/job.py` - timestamp defaults fix
- `backend/worker/run_worker.py` - macOS fork safety env var
- `backend/.env` - fixed ELEVENLABS_API_KEY format
- `frontend/middleware.ts` - simplified to avoid redirect loops
- `frontend/.env.local` - has Google OAuth creds + AUTH_URL

### Known Issues to Watch
- If CORS errors appear with status 500, check backend logs for actual error
- Worker needs ffmpeg installed for audio conversion
- ElevenLabs quota limits generation length
