-- Enable Row Level Security on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.issues ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;

-- Users policies
-- Users can read all user profiles
CREATE POLICY "Users can read all user profiles"
    ON public.users FOR SELECT
    USING (true);

-- Users can be created via trigger (for signup)
CREATE POLICY "Users can be created via trigger"
    ON public.users FOR INSERT
    WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
    ON public.users FOR UPDATE
    USING (auth.uid() = id);

-- Issues policies
-- Anyone can read all issues
CREATE POLICY "Anyone can read issues"
    ON public.issues FOR SELECT
    USING (true);

-- Users can create their own issues
CREATE POLICY "Users can create their own issues"
    ON public.issues FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can only update their own issues (except status)
CREATE POLICY "Users can update own issues"
    ON public.issues FOR UPDATE
    USING (auth.uid() = user_id AND status = 'open');

-- Admins can update any issue status
CREATE POLICY "Admins can update issue status"
    ON public.issues FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Votes policies
-- Users can read all votes
CREATE POLICY "Users can read all votes"
    ON public.votes FOR SELECT
    USING (true);

-- Authenticated users can create votes
CREATE POLICY "Authenticated users can create votes"
    ON public.votes FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own votes
CREATE POLICY "Users can delete own votes"
    ON public.votes FOR DELETE
    USING (auth.uid() = user_id);
