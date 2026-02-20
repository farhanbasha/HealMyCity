
This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
# HealMyCity - Crowdsourced Civic Issue Reporting Platform

A modern web application for reporting and tracking civic issues in your city. Built with Next.js, Python FastAPI, Supabase, and Google Gemini Vision AI.

## Features

- 📸 **Snap & Report**: Upload photos of civic issues with automatic AI analysis
- 🗺️ **Location Tracking**: Automatic geolocation capture
- 🤖 **AI-Powered Analysis**: Google Gemini Vision API analyzes images and extracts details
- 👍 **Community Voting**: Upvote issues to prioritize them
- 👨‍💼 **Admin Dashboard**: Desktop-optimized dashboard for city officials
- 🔐 **Secure Authentication**: Google OAuth and Email/Password authentication

## Tech Stack

- **Frontend**: Next.js 16 (App Router), React, Tailwind CSS, Lucide Icons
- **Backend**: Python FastAPI
- **Database**: Supabase (PostgreSQL)
- **Storage**: Supabase Storage
- **AI**: Google Gemini Vision API
- **Authentication**: Supabase Auth

## Project Structure

```
Hackathon-Project/
├── frontend/          # Next.js application
├── backend/           # Python FastAPI server
└── supabase/          # Database migrations
```

## Setup Instructions

### Prerequisites

- Node.js 18+ and npm
- Python 3.9+
- Supabase account
- Google Gemini API key

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create `.env.local` file:
```bash
cp .env.local.example .env.local
```

4. Add your Supabase credentials:
```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_API_URL=http://localhost:8000
```

5. Run the development server:
```bash
npm run dev
```

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Create a virtual environment:
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

4. Create `.env` file:
```bash
cp .env.example .env
```

5. Add your Gemini API key:
```
GEMINI_API_KEY=your_gemini_api_key
CORS_ORIGINS=http://localhost:3000
PORT=8000
```

6. Run the FastAPI server:
```bash
uvicorn app.main:app --reload --port 8000
```

### Database Setup

1. Run the migrations in your Supabase project:
   - Go to Supabase Dashboard → SQL Editor
   - Run `001_initial_schema.sql`
   - Run `002_rls_policies.sql`

2. Create a storage bucket named `issue-images`:
   - Go to Storage → Create Bucket
   - Name: `issue-images`
   - Public: Yes
   - Authenticated users can upload

## Usage

1. Start both frontend and backend servers
2. Navigate to `http://localhost:3000`
3. Sign up or log in
4. Report issues by clicking the camera button
5. View and upvote issues in the feed
6. Access admin dashboard at `/dashboard` (admin role required)

## Environment Variables

### Frontend (.env.local)
- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon key
- `NEXT_PUBLIC_API_URL`: FastAPI backend URL

### Backend (.env)
- `GEMINI_API_KEY`: Google Gemini API key
- `CORS_ORIGINS`: Allowed CORS origins (comma-separated)
- `PORT`: Server port (default: 8000)

## License

MIT

