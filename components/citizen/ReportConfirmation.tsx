"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Image from "next/image"
import { MapPin, AlertCircle } from "lucide-react"

interface ReportConfirmationProps {
  imagePreview: string
  aiData: {
    title: string
    description: string
    category: string
    severity_score: number
  }
  location: {
    latitude: number
    longitude: number
  }
  onConfirm: (data: {
    title: string
    description: string
    category: string
    severity_score: number
  }) => void
  onCancel: () => void
  loading?: boolean
}

const categories = [
  "road",
  "water",
  "sanitation",
  "infrastructure",
  "safety",
  "other",
]

export function ReportConfirmation({
  imagePreview,
  aiData,
  location,
  onConfirm,
  onCancel,
  loading = false,
}: ReportConfirmationProps) {
  const [title, setTitle] = useState(aiData.title)
  const [description, setDescription] = useState(aiData.description)
  const [category, setCategory] = useState(aiData.category)

  const handleSubmit = () => {
    onConfirm({
      title,
      description,
      category,
      severity_score: aiData.severity_score,
    })
  }

  return (
    <div className="space-y-6">
      <Card>
        <div className="relative aspect-video w-full overflow-hidden rounded-t-xl bg-gray-100">
          <Image
            src={imagePreview}
            alt="Issue preview"
            fill
            className="object-cover"
          />
        </div>
        <CardHeader>
          <CardTitle>Review & Confirm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">Title</label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Issue title"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Issue description"
              className="flex min-h-[100px] w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base transition-colors placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-11 w-full rounded-lg border border-gray-200 bg-white px-4 py-2 text-base transition-colors focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-0"
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat.charAt(0).toUpperCase() + cat.slice(1)}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">Severity Score</label>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-gray-200">
                    <div
                      className="h-full bg-black transition-all"
                      style={{ width: `${(aiData.severity_score / 10) * 100}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium">
                    {aiData.severity_score}/10
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">
            <MapPin className="h-4 w-4" />
            <span>
              Location: {location.latitude.toFixed(6)}, {location.longitude.toFixed(6)}
            </span>
          </div>
        </CardContent>
      </Card>

      <div className="flex gap-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </Button>
        <Button
          className="flex-1"
          onClick={handleSubmit}
          disabled={loading || !title.trim() || !description.trim()}
        >
          {loading ? "Submitting..." : "Submit Issue"}
        </Button>
      </div>
    </div>
  )
}
