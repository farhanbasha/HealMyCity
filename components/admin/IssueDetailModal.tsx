"use client"

import Image from "next/image"
import { X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { StatusBadge } from "@/components/citizen/StatusBadge"
import { StatusDropdown } from "./StatusDropdown"
import { MapPin } from "lucide-react"

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

interface IssueDetailModalProps {
  issue: Issue
  onClose: () => void
  onStatusUpdate: () => void
}

export function IssueDetailModal({
  issue,
  onClose,
  onStatusUpdate,
}: IssueDetailModalProps) {
  const mapUrl = `https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="relative max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-xl bg-white">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 z-10 rounded-full bg-white p-2 shadow-lg hover:bg-gray-100"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="grid md:grid-cols-2">
          <div className="relative aspect-square w-full bg-gray-100">
            <Image
              src={issue.image_url}
              alt={issue.ai_title}
              fill
              className="object-cover"
            />
          </div>

          <div className="space-y-6 p-6">
            <div>
              <div className="mb-2 flex items-start justify-between gap-4">
                <h2 className="text-2xl font-bold">{issue.ai_title}</h2>
                <StatusBadge status={issue.status} />
              </div>
              <p className="text-gray-600">{issue.ai_description}</p>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Category</span>
                <span className="font-medium capitalize">{issue.ai_category}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Severity Score</span>
                <span className="font-medium">{issue.ai_severity_score}/10</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Upvotes</span>
                <span className="font-medium">{issue.upvote_count}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Urgency Score</span>
                <span className="font-medium">{issue.urgency_score}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Reported</span>
                <span className="font-medium">
                  {new Date(issue.created_at).toLocaleString()}
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <MapPin className="h-4 w-4" />
                <span>
                  {issue.latitude.toFixed(6)}, {issue.longitude.toFixed(6)}
                </span>
              </div>
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="block"
              >
                <Button variant="secondary" className="w-full">
                  View on Map
                </Button>
              </a>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Update Status</label>
              <StatusDropdown
                issueId={issue.id}
                currentStatus={issue.status}
                onUpdate={() => {
                  onStatusUpdate()
                  onClose()
                }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
