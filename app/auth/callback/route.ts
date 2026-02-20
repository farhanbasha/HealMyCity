import { createServerSupabaseClient } from "@/lib/supabaseServer"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get("code")

  if (code) {
    const supabase = await createServerSupabaseClient()
    await supabase.auth.exchangeCodeForSession(code)
  }

  // Redirect to feed after successful auth
  return NextResponse.redirect(new URL("/feed", request.url))
}
