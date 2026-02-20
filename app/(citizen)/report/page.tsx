"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabaseClient"
import { ImageUploader } from "@/components/citizen/ImageUploader"
import { AIAnalysisLoader } from "@/components/citizen/AIAnalysisLoader"
import { ReportConfirmation } from "@/components/citizen/ReportConfirmation"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import Link from "next/link"
import { toast } from "sonner"

type Step = "upload" | "analyzing" | "confirm"

export default function ReportPage() {
  const router = useRouter()
  const [step, setStep] = useState<Step>("upload")
  const [selectedImage, setSelectedImage] = useState<File | null>(null)
  const [imagePreview, setImagePreview] = useState<string>("")
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null)
  const [aiData, setAiData] = useState<{
    title: string
    description: string
    category: string
    severity_score: number
  } | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const supabase = createClient()

  useEffect(() => {
    checkAuth()
    getLocation()
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

  const getLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          })
        },
        (error) => {
          console.error("Error getting location:", error)
          toast.error("Could not get your location. Please enable location services.")
        }
      )
    } else {
      toast.error("Geolocation is not supported by your browser")
    }
  }

  const handleImageSelect = (file: File | null) => {
    if (!file) {
      setSelectedImage(null)
      setImagePreview("")
      return
    }

    setSelectedImage(file)
    const reader = new FileReader()
    reader.onloadend = () => {
      setImagePreview(reader.result as string)
    }
    reader.readAsDataURL(file)
  }

  const handleAnalyze = async () => {
    if (!selectedImage || !location) {
      toast.error("Please select an image and allow location access")
      return
    }

    setStep("analyzing")

    try {
      const formData = new FormData()
      formData.append("file", selectedImage)

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
      const response = await fetch(`${apiUrl}/api/analyze-issue`, {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to analyze image")
      }

      const data = await response.json()
      setAiData(data)
      setStep("confirm")
    } catch (error: any) {
      toast.error("Failed to analyze image. Please try again.")
      console.error(error)
      setStep("upload")
    }
  }

  const handleSubmit = async (data: {
    title: string
    description: string
    category: string
    severity_score: number
  }) => {
    if (!selectedImage || !location) {
      toast.error("Missing image or location data")
      return
    }

    setSubmitting(true)

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser()

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
          hypothesisId: 'H_auth_state',
          location: 'app/(citizen)/report/page.tsx:handleSubmit',
          message: 'Auth state before operations',
          data: {
            hasUser: !!user,
            userId: user?.id ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log

      if (!user) {
        throw new Error("Not authenticated")
      }

      // Upload image to Supabase Storage
      const fileExt = selectedImage.name.split(".").pop()
      const fileName = `${user.id}-${Date.now()}.${fileExt}`
      
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
          hypothesisId: 'H_storage_upload',
          location: 'app/(citizen)/report/page.tsx:handleSubmit',
          message: 'About to upload to storage',
          data: {
            fileName: fileName,
            bucket: 'issue-images',
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("issue-images")
        .upload(fileName, selectedImage)

      // #region agent log
      if (uploadError) {
        fetch('http://127.0.0.1:7703/ingest/49497212-d9ff-40e6-9523-4492d1b417db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'c8d1ba',
          },
          body: JSON.stringify({
            sessionId: 'c8d1ba',
            runId: 'pre-fix',
            hypothesisId: 'H_storage_upload',
            location: 'app/(citizen)/report/page.tsx:handleSubmit',
            message: 'Storage upload failed',
            data: {
              errorMessage: uploadError?.message ?? null,
              errorName: uploadError?.name ?? null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion agent log

      if (uploadError) throw uploadError

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("issue-images").getPublicUrl(fileName)

      // Create issue record
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
          hypothesisId: 'H_issues_insert',
          location: 'app/(citizen)/report/page.tsx:handleSubmit',
          message: 'About to insert issue',
          data: {
            userId: user.id,
            hasImageUrl: !!publicUrl,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log

      const { error: insertError } = await supabase.from("issues").insert({
        user_id: user.id,
        image_url: publicUrl,
        ai_title: data.title,
        ai_description: data.description,
        ai_category: data.category,
        ai_severity_score: data.severity_score,
        latitude: location.latitude,
        longitude: location.longitude,
        status: "open",
      })

      // #region agent log
      if (insertError) {
        fetch('http://127.0.0.1:7703/ingest/49497212-d9ff-40e6-9523-4492d1b417db', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-Debug-Session-Id': 'c8d1ba',
          },
          body: JSON.stringify({
            sessionId: 'c8d1ba',
            runId: 'pre-fix',
            hypothesisId: 'H_issues_insert',
            location: 'app/(citizen)/report/page.tsx:handleSubmit',
            message: 'Issue insert failed',
            data: {
              errorMessage: insertError?.message ?? null,
              errorCode: insertError?.code ?? null,
              errorDetails: insertError?.details ?? null,
            },
            timestamp: Date.now(),
          }),
        }).catch(() => {});
      }
      // #endregion agent log

      if (insertError) throw insertError

      toast.success("Issue reported successfully!")
      router.push("/feed")
    } catch (error: any) {
      toast.error(error.message || "Failed to submit issue")
      console.error(error)

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
          hypothesisId: 'H_issues_insert',
          location: 'app/(citizen)/report/page.tsx:handleSubmit',
          message: 'Error while inserting issue',
          data: {
            errorMessage: error?.message ?? null,
            errorName: error?.name ?? null,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => {});
      // #endregion agent log
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-10 border-b bg-white px-4 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-4">
          <Link href="/feed">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <h1 className="text-xl font-bold">Report Issue</h1>
        </div>
      </header>

      {/* Content */}
      <main className="mx-auto max-w-2xl p-4">
        {step === "upload" && (
          <div className="space-y-6">
            <div>
              <h2 className="mb-2 text-2xl font-bold">Snap & Report</h2>
              <p className="text-gray-600">
                Take a photo of a civic issue and our AI will analyze it automatically.
              </p>
            </div>

            <ImageUploader
              onImageSelect={handleImageSelect}
              selectedImage={selectedImage}
            />

            {!location && (
              <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
                Waiting for location access...
              </div>
            )}

            <Button
              className="w-full"
              size="lg"
              onClick={handleAnalyze}
              disabled={!selectedImage || !location}
            >
              Analyze Issue
            </Button>
          </div>
        )}

        {step === "analyzing" && <AIAnalysisLoader />}

        {step === "confirm" && aiData && location && imagePreview && (
          <ReportConfirmation
            imagePreview={imagePreview}
            aiData={aiData}
            location={location}
            onConfirm={handleSubmit}
            onCancel={() => setStep("upload")}
            loading={submitting}
          />
        )}
      </main>
    </div>
  )
}
