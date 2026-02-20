'use client'

import { useState } from "react"
import { createClient } from "@/lib/supabaseClient"
import { toast } from "sonner"
import { ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

interface StatusDropdownProps {
  issueId: string
  currentStatus: "open" | "in_progress" | "resolved"
  onUpdate: () => void
}

export function StatusDropdown({
  issueId,
  currentStatus,
  onUpdate,
}: StatusDropdownProps) {
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  const handleStatusChange = async (newStatus: "open" | "in_progress" | "resolved") => {
    if (newStatus === currentStatus) return

    setLoading(true)

    try {
      const { error } = await supabase
        .from("issues")
        .update({ status: newStatus })
        .eq("id", issueId)

      if (error) throw error

      toast.success(`Status updated to ${newStatus.replace("_", " ")}`)
      onUpdate()
    } catch (error: any) {
      toast.error(error.message || "Failed to update status")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative">
      <select
        value={currentStatus}
        onChange={(e) =>
          handleStatusChange(e.target.value as "open" | "in_progress" | "resolved")
        }
        disabled={loading}
        className="appearance-none rounded-lg border border-gray-200 bg-white px-3 py-2 pr-8 text-sm focus:outline-none focus:ring-2 focus:ring-black disabled:opacity-50"
      >
        <option value="open">Open</option>
        <option value="in_progress">In Progress</option>
        <option value="resolved">Resolved</option>
      </select>
      <ChevronDown className="pointer-events-none absolute right-2 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
    </div>
  )
}
