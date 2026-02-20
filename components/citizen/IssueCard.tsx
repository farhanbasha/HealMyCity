"use client"

import Image from "next/image"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { StatusBadge } from "./StatusBadge"
import { UpvoteButton } from "./UpvoteButton"
import { MapPin } from "lucide-react"

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

interface IssueCardProps {
  issue: Issue
  userVoted?: boolean
  onVoteChange?: () => void
}

export function IssueCard({ issue, userVoted = false, onVoteChange }: IssueCardProps) {
  return (
    <Card className="overflow-hidden">
      <div className="relative aspect-video w-full overflow-hidden bg-gray-100">
        <Image
          src={issue.image_url}
          alt={issue.ai_title}
          fill
          className="object-cover"
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
        />
      </div>
      <CardContent className="p-4">
        <div className="mb-2 flex items-start justify-between gap-2">
          <h3 className="font-semibold text-lg leading-tight line-clamp-2">
            {issue.ai_title}
          </h3>
          <StatusBadge status={issue.status} />
        </div>
        <p className="mb-3 text-sm text-gray-600 line-clamp-2">
          {issue.ai_description}
        </p>
        <div className="flex items-center gap-2 text-xs text-gray-500">
          <MapPin className="h-3 w-3" />
          <span className="capitalize">{issue.ai_category}</span>
        </div>
      </CardContent>
      <CardFooter className="flex items-center justify-between border-t p-4">
        <UpvoteButton
          issueId={issue.id}
          initialUpvotes={issue.upvote_count}
          userVoted={userVoted}
          onVoteChange={onVoteChange}
        />
        <span className="text-xs text-gray-500">
          {new Date(issue.created_at).toLocaleDateString()}
        </span>
      </CardFooter>
    </Card>
  )
}
