"use client"

import { Loader2 } from "lucide-react"

export function AIAnalysisLoader() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <div className="relative mb-6">
        <Loader2 className="h-12 w-12 animate-spin text-black" />
      </div>
      <h3 className="mb-2 text-xl font-semibold">AI is analyzing the issue...</h3>
      <p className="text-center text-gray-600">
        Our AI is examining your photo to extract details about the civic issue.
        This may take a few seconds.
      </p>
    </div>
  )
}
