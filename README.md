# 🏙️ HealMyCity

**HealMyCity** is a modern, crowdsourced civic issue reporting platform designed to bridge the gap between citizens and municipal administrators. By leveraging AI image analysis and accurate geolocation, the platform makes it effortless for citizens to report infrastructure issues (like potholes, broken streetlights, or water leaks) while providing administrators with a powerful, triaged dashboard to manage and resolve them.

---

## ✨ Features

### For Citizens
*   **Snap & Report**: Seamlessly report issues by taking a photo or uploading from your gallery.
*   **AI Auto-Categorization**: Uses Google's Gemini 2.5 Flash API to automatically detect the issue's category, generate a descriptive title/description, and assign an initial severity score.
*   **GPS Geolocation**: Captures precise coordinates to plot issues accurately on a map.
*   **Live Community Feed**: View, track, and upvote issues reported by others in your city with fast, optimistic UI updates.

### For Administrators
*   **Secure Admin Portal**: Role-based access control (RBAC) powered by Supabase limits access strictly to authorized administrators.
*   **Urgency Triage Table**: Automatically sorts open issues using a dynamic **Urgency Score** calculated by combining the AI severity score and community upvotes.
*   **Live Interactive Map**: A real-time geospatial dashboard using Leaflet that visualizes issue locations, color-coded by category and sized dynamically by community impact (upvotes).
*   **One-Click Status Updates**: Admins can swiftly change issue statuses from *Open* -> *In Progress* -> *Resolved*.

---

## 🏗️ Tech Stack

### Frontend (User Interface & Civic Experience)
*   **Framework**: [Next.js](https://nextjs.org/) (App Router, Server Components)
*   **Styling**: [Tailwind CSS](https://tailwindcss.com/) with custom glassmorphism, animations, and premium dark/light mode support.
*   **State & Data**: React hooks, optimistic UI patterns, and Server Actions.
*   **Icons**: [Lucide React](https://lucide.dev/)
*   **Mapping**: `leaflet` & `react-leaflet` (dynamically imported to support SSR)

### Backend (AI Processing Pipeline)
*   **Framework**: Python with [FastAPI](https://fastapi.tiangolo.com/) for lightning-fast inference endpoints.
*   **AI Model**: [Google Gemini 2.5 Flash](https://deepmind.google/technologies/gemini/) (via `google-generativeai` SDK).

### Database, Auth & Storage
*   **Provider**: [Supabase](https://supabase.com/)
*   **Database**: PostgreSQL with custom RPC functions (e.g., atomic upvote toggling) and Row Level Security (RLS) policies.
*   **Authentication**: Supabase Auth with Server-Side Rendering (SSR) utilities for robust route protection.
*   **Storage**: Supabase Storage buckets for hosting high-resolution issue imagery.

---

## 🚀 Getting Started

### Prerequisites
*   Node.js (v18+)
*   Python (3.9+)
*   A [Supabase](https://supabase.com) account & project
*   A [Google AI Studio](https://aistudio.google.com/) API Key for Gemini

### 1. Database Setup
1. Open your Supabase project dashboard and navigate to the **SQL Editor**.
2. Copy and paste the contents of `supabase/schema.sql` and run it to construct your tables (`users`, `issues`, `votes`), constraints, and RPC functions.
3. Then, copy and paste the contents of `supabase/storage.sql` and run it to create the `issues-images` storage bucket and configure its public access and upload policies.

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install the necessary dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the `frontend` folder and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   NEXT_PUBLIC_API_URL=http://localhost:8000
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

### 3. Backend (AI Inference) Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Create and activate a Python virtual environment:
   ```bash
   python -m venv .venv
   # Windows:
   .venv\Scripts\activate
   # Mac/Linux:
   source .venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file in the `backend` directory with your Gemini key:
   ```env
   GEMINI_API_KEY=your-gemini-api-key
   ```
5. Run the FastAPI development server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

BLIC_API_URL` variable in Vercel to reflect the live production endpoint.
