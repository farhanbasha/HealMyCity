'use client'

import { useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { ThumbsUp } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"

interface UpvoteButtonProps {
  issueId: string
  initialUpvotes: number
  userVoted: boolean
  onVoteChange?: () => void
}

export function UpvoteButton({
  issueId,
  initialUpvotes,
  userVoted: initialUserVoted,
  onVoteChange,
}: UpvoteButtonProps) {
  const [upvotes, setUpvotes] = useState(initialUpvotes)
  const [userVoted, setUserVoted] = useState(initialUserVoted)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleVote = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      toast.error("Please sign in to vote")
      return
    }

    setLoading(true)

    try {
      if (userVoted) {
        // Remove vote
        const { error } = await supabase
          .from("votes")
          .delete()
          .eq("user_id", user.id)
          .eq("issue_id", issueId)

        if (error) throw error

        setUpvotes((prev) => prev - 1)
        setUserVoted(false)
        toast.success("Vote removed")
      } else {
        // Add vote
        const { error } = await supabase.from("votes").insert({
          user_id: user.id,
          issue_id: issueId,
        })

        if (error) throw error

        setUpvotes((prev) => prev + 1)
        setUserVoted(true)
        toast.success("Voted!")
      }

      onVoteChange?.()
    } catch (error: any) {
      toast.error(error.message || "Failed to vote")

      // #region agent log
      fetch('http://127.0.0.1:7703/ingest/49497212-d9ff-40e6-9523-4492d1b417db', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Debug-Session-Id': 'c8d1ba',
        },
        body: JSON.stringify({
          sessionId: 'c8d1ba',
          runId: 'pre-fix',
          hypothesisId: 'H_votes_insert',
          location: 'components/citizen/UpvoteButton.tsx:handleVote',
          message: 'Error while voting on issue',
          data: {
            errorMessage: error?.message ?? null,
            errorName: error?.name ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
    } finally {
      setLoading(false)
    }
  }

  return (
    <Button
      variant={userVoted ? "primary" : "ghost"}
      size="sm"
      onClick={handleVote}
      disabled={loading}
      className="gap-2"
    >
      <ThumbsUp className={`h-4 w-4 ${userVoted ? "fill-current" : ""}`} />
      <span>{upvotes}</span>
    </Button>
  )
}
