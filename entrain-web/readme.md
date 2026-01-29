# Entrain Web

Web application for generating meditation tracks with binaural beats and spoken affirmations.

## Architecture

- **Frontend**: Next.js 15 with App Router, Auth.js, Tailwind CSS
- **Backend**: FastAPI with SQLAlchemy, RQ for job processing
- **Database**: PostgreSQL
- **Queue**: Redis with RQ
- **TTS**: ElevenLabs API

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker and Docker Compose
- ElevenLabs API key
- Google OAuth credentials

### 1. Start Infrastructure

```bash
cd entrain-web
docker compose up -d
```

This starts PostgreSQL and Redis.

### 2. Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Copy and configure environment
cp .env.example .env
# Edit .env with your ELEVENLABS_API_KEY

# Run the API server
uvicorn app.main:app --reload --port 8000
```

### 3. Worker Setup (separate terminal)

```bash
cd backend
source .venv/bin/activate

# Run the worker
python -m worker.run_worker
```

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy and configure environment
cp .env.example .env.local
# Edit .env.local with:
# - AUTH_SECRET (run: openssl rand -base64 32)
# - AUTH_GOOGLE_ID and AUTH_GOOGLE_SECRET from Google Cloud Console

# Generate Prisma client and push schema
npm run db:generate
npm run db:push

# Run the dev server
npm run dev
```

### 5. Access the App

Open http://localhost:3000

## Google OAuth Setup

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Enable the Google+ API
4. Go to Credentials > Create Credentials > OAuth Client ID
5. Application type: Web application
6. Add authorized redirect URI: `http://localhost:3000/api/auth/callback/google`
7. Copy the Client ID and Client Secret to your `.env.local`

## Project Structure

```
entrain-web/
├── frontend/                 # Next.js 15 application
│   ├── app/                 # App Router pages
│   ├── components/          # React components
│   ├── lib/                 # Utilities and API client
│   └── prisma/              # Database schema
├── backend/                  # FastAPI application
│   ├── app/                 # API code
│   │   ├── routers/        # API endpoints
│   │   ├── models/         # SQLAlchemy models
│   │   ├── schemas/        # Pydantic schemas
│   │   └── services/       # Business logic
│   └── worker/              # RQ worker
│       ├── generator.py    # Audio generation logic
│       └── tasks.py        # RQ task definitions
└── docker-compose.yml       # PostgreSQL + Redis
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /api/users/sync | Sync user from Auth.js |
| GET | /api/users/me | Get current user profile |
| POST | /api/jobs | Create generation job |
| GET | /api/jobs | List user's jobs |
| GET | /api/jobs/{id}/status | Poll job progress |
| GET | /api/files/{job_id} | Download completed file |

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://entrain:entrain_dev@localhost:5432/entrain
REDIS_URL=redis://localhost:6379
ELEVENLABS_API_KEY=your_key_here
FRONTEND_URL=http://localhost:3000
SECRET_KEY=change_me
```

### Frontend (.env.local)

```
AUTH_SECRET=generate_with_openssl
AUTH_GOOGLE_ID=your_google_client_id
AUTH_GOOGLE_SECRET=your_google_secret
DATABASE_URL=postgresql://entrain:entrain_dev@localhost:5432/entrain
NEXT_PUBLIC_API_URL=http://localhost:8000
```

## Development

### Running Tests

```bash
# Backend
cd backend
pytest

# Frontend
cd frontend
npm test
```

### Database Migrations

The backend uses SQLAlchemy with auto-creation. For the frontend (Prisma):

```bash
cd frontend
npm run db:push  # Push schema changes
npm run db:generate  # Regenerate client
```

## Deployment

See the deployment guide for instructions on deploying to Render with PostgreSQL and Redis.
