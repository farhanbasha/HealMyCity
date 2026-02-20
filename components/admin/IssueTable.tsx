"use client"

import { useState } from "react"
import Image from "next/image"
import { StatusBadge } from "@/components/citizen/StatusBadge"
import { StatusDropdown } from "./StatusDropdown"
import { IssueDetailModal } from "./IssueDetailModal"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"

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

interface IssueTableProps {
  issues: Issue[]
  onStatusUpdate: () => void
}

type SortField = "urgency_score" | "created_at" | "upvote_count"
type SortDirection = "asc" | "desc"

export function IssueTable({ issues, onStatusUpdate }: IssueTableProps) {
  const [sortField, setSortField] = useState<SortField>("urgency_score")
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc")
  const [selectedIssue, setSelectedIssue] = useState<Issue | null>(null)
  const [searchQuery, setSearchQuery] = useState("")

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDirection("desc")
    }
  }

  const sortedIssues = [...issues].sort((a, b) => {
    let aValue: number | string = a[sortField]
    let bValue: number | string = b[sortField]

    if (sortField === "created_at") {
      aValue = new Date(a.created_at).getTime()
      bValue = new Date(b.created_at).getTime()
    }

    if (sortDirection === "asc") {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })

  const filteredIssues = sortedIssues.filter((issue) =>
    issue.ai_title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    issue.ai_description.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortField !== field) {
      return <ArrowUpDown className="ml-1 h-4 w-4" />
    }
    return sortDirection === "asc" ? (
      <ArrowUp className="ml-1 h-4 w-4" />
    ) : (
      <ArrowDown className="ml-1 h-4 w-4" />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Issues ({filteredIssues.length})</h2>
        <input
          type="text"
          placeholder="Search issues..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="h-10 rounded-lg border border-gray-200 px-4 focus:outline-none focus:ring-2 focus:ring-black"
        />
      </div>

      <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Image
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Title
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Category
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("urgency_score")}
                  className="h-auto p-0 font-medium"
                >
                  Urgency Score
                  <SortIcon field="urgency_score" />
                </Button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("upvote_count")}
                  className="h-auto p-0 font-medium"
                >
                  Upvotes
                  <SortIcon field="upvote_count" />
                </Button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Status
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleSort("created_at")}
                  className="h-auto p-0 font-medium"
                >
                  Created
                  <SortIcon field="created_at" />
                </Button>
              </th>
              <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 bg-white">
            {filteredIssues.map((issue) => (
              <tr
                key={issue.id}
                className="hover:bg-gray-50 cursor-pointer"
                onClick={() => setSelectedIssue(issue)}
              >
                <td className="whitespace-nowrap px-4 py-3">
                  <div className="relative h-16 w-16 overflow-hidden rounded-lg">
                    <Image
                      src={issue.image_url}
                      alt={issue.ai_title}
                      fill
                      className="object-cover"
                    />
                  </div>
                </td>
                <td className="px-4 py-3">
                  <div className="max-w-xs truncate font-medium">{issue.ai_title}</div>
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500 capitalize">
                  {issue.ai_category}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm font-medium">
                  {issue.urgency_score}
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {issue.upvote_count}
                </td>
                <td className="whitespace-nowrap px-4 py-3">
                  <StatusBadge status={issue.status} />
                </td>
                <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-500">
                  {new Date(issue.created_at).toLocaleDateString()}
                </td>
                <td className="whitespace-nowrap px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <StatusDropdown
                    issueId={issue.id}
                    currentStatus={issue.status}
                    onUpdate={onStatusUpdate}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {selectedIssue && (
        <IssueDetailModal
          issue={selectedIssue}
          onClose={() => setSelectedIssue(null)}
          onStatusUpdate={onStatusUpdate}
        />
      )}
    </div>
  )
}
