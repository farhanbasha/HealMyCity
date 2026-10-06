import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import TopNav from "@/components/navigation/TopNav";
import BottomNav from "@/components/navigation/BottomNav";

export default async function AppLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    return (
        <div className="min-h-screen bg-[#FBFBFD] flex flex-col">
            <TopNav userEmail={user.email || ""} userRole={profile?.role || "citizen"} />
            <main className="flex-1 w-full pb-safe md:pb-12">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
