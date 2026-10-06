-- ============================================================
-- HealMyCity — Upvote RPC Function
-- Run this in the Supabase SQL Editor
-- ============================================================

-- Toggle upvote: inserts a vote if not exists, or deletes it if already voted.
-- Also updates the upvote_count on the issues table atomically.
CREATE OR REPLACE FUNCTION public.toggle_upvote(p_issue_id UUID)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_exists  BOOLEAN;
    v_new_count INTEGER;
BEGIN
    -- Check if the user has already voted
    SELECT EXISTS (
        SELECT 1 FROM public.votes
        WHERE user_id = v_user_id AND issue_id = p_issue_id
    ) INTO v_exists;

    IF v_exists THEN
        -- Remove the vote
        DELETE FROM public.votes
        WHERE user_id = v_user_id AND issue_id = p_issue_id;

        -- Decrement upvote count
        UPDATE public.issues
        SET upvote_count = GREATEST(upvote_count - 1, 0)
        WHERE id = p_issue_id
        RETURNING upvote_count INTO v_new_count;

        RETURN json_build_object('voted', false, 'upvote_count', v_new_count);
    ELSE
        -- Insert the vote
        INSERT INTO public.votes (user_id, issue_id)
        VALUES (v_user_id, p_issue_id);

        -- Increment upvote count
        UPDATE public.issues
        SET upvote_count = upvote_count + 1
        WHERE id = p_issue_id
        RETURNING upvote_count INTO v_new_count;

        RETURN json_build_object('voted', true, 'upvote_count', v_new_count);
    END IF;
END;
$$;
