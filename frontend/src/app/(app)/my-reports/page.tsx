import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus, ShieldCheck, MapPin } from "lucide-react";
import MyReportsClient, { IssueRecord } from "@/components/reports/MyReportsClient";

export const metadata = {
    title: "My Reported Issues — HealMyCity",
    description: "Track the status, civic inspection, and municipal resolution of your reported issues.",
};

export default async function MyReportsPage() {
    const supabase = await createClient();

    // 1. Authenticate user session
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // 2. Fetch user profile for display and role confirmation
    const { data: profile } = await supabase
        .from("users")
        .select("full_name, role")
        .eq("id", user.id)
        .single();

    // 3. Strict RBAC Query: Fetch ONLY issues reported by the authenticated citizen
    const { data: issues, error } = await supabase
        .from("issues")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

    if (error) {
        console.error("Error fetching user reported issues:", error);
    }

    const typedIssues = (issues || []) as IssueRecord[];
    const userName = profile?.full_name || user.email?.split("@")[0] || "Citizen";

    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
            {/* Header with Title, RBAC badge & Action button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                            My Reported Issues
                        </h1>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#6E6E73] border border-[#E5E5EA]">
                            <ShieldCheck size={12} className="text-[#0071E3]" />
                            <span>Citizen Contributor</span>
                        </span>
                    </div>
                    <p className="text-sm text-[#6E6E73]">
                        Track municipal updates, inspection triage, and live status of your reports ({userName}).
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/map"
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-full bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] text-xs font-semibold border border-[#E5E5EA] transition-colors"
                    >
                        <MapPin size={13} className="text-[#0071E3]" />
                        <span>Live Map</span>
                    </Link>

                    <Link
                        href="/report"
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-white text-xs font-semibold transition-all shadow-xs"
                    >
                        <Plus size={14} strokeWidth={2.5} />
                        <span>Report Issue</span>
                    </Link>
                </div>
            </div>

            {/* Interactive Reports Explorer */}
            <MyReportsClient initialIssues={typedIssues} />
        </div>
    );
}
