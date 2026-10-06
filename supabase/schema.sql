-- ============================================================
-- HealMyCity — Supabase Database Schema
-- Paste this entire script into the Supabase SQL Editor and run.
-- ============================================================

-- ────────────────────────────────────────────────────────────
-- 1. TABLES
-- ────────────────────────────────────────────────────────────

-- 1a. Public users (mirrors auth.users)
CREATE TABLE public.users (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT UNIQUE NOT NULL,
    full_name   TEXT,
    avatar_url  TEXT,
    role        TEXT NOT NULL DEFAULT 'citizen'
                     CHECK (role IN ('citizen', 'admin')),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'Public profile for every authenticated user.';

-- 1b. Issues reported by citizens
CREATE TABLE public.issues (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    image_url           TEXT,
    ai_title            TEXT,
    ai_description      TEXT,
    ai_category         TEXT,
    ai_severity_score   INTEGER CHECK (ai_severity_score BETWEEN 1 AND 10),
    latitude            DOUBLE PRECISION,
    longitude           DOUBLE PRECISION,
    status              TEXT NOT NULL DEFAULT 'open'
                             CHECK (status IN ('open', 'in_progress', 'resolved')),
    upvote_count        INTEGER NOT NULL DEFAULT 0,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.issues IS 'Civic issues reported and AI-analysed.';

-- 1c. Votes (one per user per issue)
CREATE TABLE public.votes (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    issue_id    UUID NOT NULL REFERENCES public.issues(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT unique_user_issue_vote UNIQUE (user_id, issue_id)
);

COMMENT ON TABLE public.votes IS 'Tracks upvotes; unique constraint prevents duplicates.';


-- ────────────────────────────────────────────────────────────
-- 2. INDEXES
-- ────────────────────────────────────────────────────────────

CREATE INDEX idx_issues_user_id   ON public.issues(user_id);
CREATE INDEX idx_issues_status    ON public.issues(status);
CREATE INDEX idx_issues_category  ON public.issues(ai_category);
CREATE INDEX idx_votes_issue_id   ON public.votes(issue_id);


-- ────────────────────────────────────────────────────────────
-- 3. ROW LEVEL SECURITY (RLS)
-- ────────────────────────────────────────────────────────────

-- 3a. users table
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read all profiles
CREATE POLICY "Users: read all profiles"
    ON public.users FOR SELECT
    TO authenticated
    USING (true);

-- Users can update only their own profile
CREATE POLICY "Users: update own profile"
    ON public.users FOR UPDATE
    TO authenticated
    USING  (auth.uid() = id)
    WITH CHECK (auth.uid() = id);

-- 3b. issues table
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read all issues
CREATE POLICY "Issues: read all"
    ON public.issues FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can create issues (only for themselves)
CREATE POLICY "Issues: insert own"
    ON public.issues FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Only admins can update issue status
CREATE POLICY "Issues: admin update status"
    ON public.issues FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Users can delete their own issues
CREATE POLICY "Issues: delete own"
    ON public.issues FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 3c. votes table
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Authenticated users can read all votes
CREATE POLICY "Votes: read all"
    ON public.votes FOR SELECT
    TO authenticated
    USING (true);

-- Authenticated users can insert their own vote
CREATE POLICY "Votes: insert own"
    ON public.votes FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Users can delete (un-vote) their own vote
CREATE POLICY "Votes: delete own"
    ON public.votes FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);


-- ────────────────────────────────────────────────────────────
-- 4. TRIGGER: Auto-create public.users row on sign-up
-- ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
    INSERT INTO public.users (id, email, full_name, avatar_url)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data ->> 'full_name', ''),
        COALESCE(NEW.raw_user_meta_data ->> 'avatar_url', '')
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();
