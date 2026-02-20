# HealMyCity Setup Guide

## Quick Start

### 1. Database Setup (Supabase)

1. Create a new Supabase project at https://supabase.com
2. Go to SQL Editor and run the migrations:
   - Run `supabase/migrations/001_initial_schema.sql`
   - Run `supabase/migrations/002_rls_policies.sql`
3. Go to Storage and create a bucket:
   - Name: `issue-images`
   - Public: Yes
   - Authenticated users can upload
4. Configure Google OAuth in Supabase:
   - Go to Authentication → Providers
   - Enable Google provider
   - Add your Google OAuth credentials

### 2. Frontend Setup

```bash
cd frontend
npm install
cp .env.local.example .env.local
# Edit .env.local with your Supabase credentials
npm run dev
```

### 3. Backend Setup

```bash
cd backend
python -m venv venv
# On Windows:
venv\Scripts\activate
# On Mac/Linux:
source venv/bin/activate

pip install -r requirements.txt
cp .env.example .env
# Edit .env with your Gemini API key (already provided)
uvicorn app.main:app --reload --port 8000
```

### 4. Create Admin User

After signing up, you need to manually set a user as admin in Supabase:

```sql
UPDATE public.users
SET role = 'admin'
WHERE email = 'your-admin-email@example.com';
```

## Environment Variables

### Frontend (.env.local)
```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

### Backend (.env)
```
GEMINI_API_KEY=AIzaSyBRhATfm7rkly6r3RumARPoCkwHtdCsp-I
CORS_ORIGINS=http://localhost:3000
PORT=8000
```

## Running the Application

1. Start the backend: `cd backend && uvicorn app.main:app --reload`
2. Start the frontend: `cd frontend && npm run dev`
3. Open http://localhost:3000

## Features

- ✅ User authentication (Email/Password + Google OAuth)
- ✅ Mobile-first citizen app
- ✅ AI-powered issue analysis (Gemini Vision API)
- ✅ Geolocation capture
- ✅ Issue upvoting
- ✅ Admin dashboard with prioritization
- ✅ Status management (Open → In Progress → Resolved)
- ✅ Responsive design

## Troubleshooting

- **Images not loading**: Check Supabase Storage bucket permissions
- **AI analysis failing**: Verify Gemini API key is correct
- **Auth not working**: Check Supabase URL and keys
- **Admin access denied**: Make sure user role is set to 'admin' in database
