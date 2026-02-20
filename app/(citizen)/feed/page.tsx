'use client'

import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { IssueCard } from "@/components/citizen/IssueCard"
import { Button } from "@/components/ui/button"
import { Camera, LogOut } from "lucide-react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { toast } from "sonner"

interface Issue {
  id: string
  image_url: string
  ai_title: string
  ai_description: string
  ai_category: string
  status: "open" | "in_progress" | "resolved"
  upvote_count: number
  latitude: number
  longitude: number
  created_at: string
}

export default function FeedPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const [userVotes, setUserVotes] = useState<Set<string>>(new Set())
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    loadIssues()
  }, [])

  const checkAuth = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }
  }

  const loadIssues = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

      // Fetch issues sorted by upvotes and recency
      const { data: issuesData, error: issuesError } = await supabase
        .from("issues")
        .select("*")
        .order("upvote_count", { ascending: false })
        .order("created_at", { ascending: false })
        .limit(50)

      if (issuesError) throw issuesError

      // Fetch user's votes
      if (user) {
        const { data: votesData } = await supabase
          .from("votes")
          .select("issue_id")
          .eq("user_id", user.id)

        if (votesData) {
          setUserVotes(new Set(votesData.map((v) => v.issue_id)))
        }
      }

      setIssues(issuesData || [])
    } catch (error: any) {
      toast.error("Failed to load issues")
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/login")
    router.refresh()
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="mx-auto max-w-2xl space-y-4">
          {[...Array(3)].map((_, i) => (
            <div
              key={i}
              className="h-64 animate-pulse rounded-xl bg-gray-200"
            />
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center justify-between">
          <h1 className="text-2xl font-bold">HealMyCity</h1>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
      </header>

      {/* Feed */}
      <main className="mx-auto max-w-2xl space-y-4 p-4">
        {issues.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="mb-4 text-gray-500">No issues reported yet</p>
            <Link href="/report">
              <Button size="lg">
                <Camera className="mr-2 h-5 w-5" />
                Report First Issue
              </Button>
            </Link>
          </div>
        ) : (
          issues.map((issue) => (
            <IssueCard
              key={issue.id}
              issue={issue}
              userVoted={userVotes.has(issue.id)}
              onVoteChange={loadIssues}
            />
          ))
        )}
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 border-t bg-white">
        <div className="mx-auto flex max-w-2xl items-center justify-around px-4 py-2">
          <Link href="/feed" className="flex flex-col items-center gap-1 p-2">
            <div className="h-6 w-6 rounded-full bg-black" />
            <span className="text-xs font-medium">Feed</span>
          </Link>
          <Link
            href="/report"
            className="flex flex-col items-center gap-1 rounded-full bg-black p-4 text-white"
          >
            <Camera className="h-6 w-6" />
          </Link>
          <button className="flex flex-col items-center gap-1 p-2 text-gray-400">
            <div className="h-6 w-6 rounded-full border-2 border-gray-300" />
            <span className="text-xs">Profile</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
