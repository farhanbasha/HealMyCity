import { redirect } from "next/navigation"
import { createServerSupabaseClient } from "@/lib/supabaseServer"

export default async function HomePage() {
  const supabase = await createServerSupabaseClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/login")
  } else {
    // Check user role
    const { data: userData } = await supabase
      .from("users")
      .select("role")
      .eq("id", user.id)
      .single()

    if (userData?.role === "admin") {
      redirect("/dashboard")
    } else {
      redirect("/feed")
    }
  }
}
