'use client'

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabaseClient"
import { IssueTable } from "@/components/admin/IssueTable"
import { Button } from "@/components/ui/button"
import { LogOut, Home } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

interface Issue {
  id: string
  image_url: string
  ai_title: string
  ai_description: string
  ai_category: string
  ai_severity_score: number
  upvote_count: number
  status: "open" | "in_progress" | "resolved"
  latitude: number
  longitude: number
  created_at: string
  urgency_score: number
}

export default function AdminDashboardPage() {
  const [issues, setIssues] = useState<Issue[]>([])
  const [loading, setLoading] = useState(true)
  const router = useRouter()
  const supabase = createClient()

  useEffect(() => {
    checkAdminAccess()
    loadIssues()
  }, [])

  const checkAdminAccess = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      router.push("/login")
      return
    }

    // Check if user is admin
    const { data: userData, error } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (error || !userData || userData.role !== "admin") {
      toast.error("Access denied. Admin only.")
      router.push("/feed")
      return
    }
  }

  const loadIssues = async () => {
    try {
      const { data: issuesData, error } = await supabase
        .from("issues")
        .select("*")
        .order("created_at", { ascending: false })

      if (error) throw error

      // Calculate urgency score (upvotes + severity_score)
      const issuesWithUrgency = (issuesData || []).map((issue) => ({
        ...issue,
        urgency_score: issue.upvote_count + issue.ai_severity_score,
      }))

      setIssues(issuesWithUrgency)
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
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-black" />
          <p className="text-gray-600">Loading dashboard...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 h-full w-64 border-r bg-white">
        <div className="flex h-full flex-col p-6">
          <div className="mb-8">
            <h1 className="text-2xl font-bold">HealMyCity</h1>
            <p className="text-sm text-gray-500">Admin Dashboard</p>
          </div>

          <nav className="flex-1 space-y-2">
            <Link
              href="/dashboard"
              className="flex items-center gap-3 rounded-lg bg-black px-4 py-3 text-white"
            >
              <Home className="h-5 w-5" />
              <span>Dashboard</span>
            </Link>
          </nav>

          <Button
            variant="ghost"
            className="w-full justify-start"
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 p-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8">
            <h2 className="text-3xl font-bold">Issue Management</h2>
            <p className="text-gray-600">
              Manage and prioritize civic issues reported by citizens
            </p>
          </div>

          <IssueTable issues={issues} onStatusUpdate={loadIssues} />
        </div>
      </main>
    </div>
  )
}
