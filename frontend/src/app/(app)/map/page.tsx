import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import LiveMapWrapper from "@/components/map/LiveMapWrapper";
import Link from "next/link";
import { Plus, Building2, Flame, MapPin } from "lucide-react";
import type { MapIssue } from "@/components/map/LiveMapComponent";

export default async function LiveMapPage({
    searchParams,
}: {
    searchParams?: Promise<{ focus?: string }>;
}) {
    const sp = searchParams ? await searchParams : {};
    const focusIssueId = sp.focus;
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user profile to verify role
    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    const isAdmin = profile?.role === "admin";

    // Fetch active issues with geographic coordinates
    const { data: rawIssues } = await supabase
        .from("issues")
        .select("*")
        .in("status", ["open", "in_progress"])
        .not("latitude", "is", null)
        .not("longitude", "is", null)
        .order("created_at", { ascending: false });

    const issues: MapIssue[] = (rawIssues as MapIssue[]) || [];

    const criticalCount = issues.filter((i) => (i.ai_severity_score || 0) >= 8).length;
    const totalVotes = issues.reduce((acc, curr) => acc + (curr.upvote_count || 0), 0);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#1D1D1F] text-white flex items-center justify-center">
                            <MapPin size={13} />
                        </div>
                        <h1 className="text-2xl sm:text-3xl font-semibold text-[#1D1D1F] tracking-tight">
                            Live Infrastructure Map
                        </h1>
                    </div>
                    <p className="text-xs sm:text-sm text-[#6E6E73]">
                        Real-time view of civic issues and concentrated problem hotspots reported across the city.
                    </p>
                </div>

                {/* Role-based actions */}
                <div className="flex items-center gap-2">
                    {isAdmin && (
                        <Link
                            href="/admin"
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1D1D1F] text-white text-xs font-medium hover:bg-[#333336] transition-colors"
                        >
                            <Building2 size={13} />
                            <span>City Admin Portal</span>
                        </Link>
                    )}

                    <Link
                        href="/report"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-xs font-medium border border-[#E5E5EA] transition-colors"
                    >
                        <Plus size={14} />
                        <span>Report an Issue</span>
                    </Link>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
                <div className="bg-white border border-[#E5E5EA] rounded-xl p-3.5 shadow-xs">
                    <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wide">
                        Active Issues
                    </div>
                    <div className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] mt-0.5">
                        {issues.length}
                    </div>
                </div>

                <div className="bg-white border border-[#E5E5EA] rounded-xl p-3.5 shadow-xs">
                    <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wide flex items-center gap-1">
                        <Flame size={12} className="text-[#FF3B30]" />
                        <span>Critical Severity</span>
                    </div>
                    <div className="text-xl sm:text-2xl font-semibold text-[#C02820] mt-0.5">
                        {criticalCount}
                    </div>
                </div>

                <div className="bg-white border border-[#E5E5EA] rounded-xl p-3.5 shadow-xs">
                    <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wide">
                        Community Upvotes
                    </div>
                    <div className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] mt-0.5">
                        {totalVotes}
                    </div>
                </div>
            </div>

            {/* Interactive Live Map Component */}
            <LiveMapWrapper issues={issues} focusIssueId={focusIssueId} />
        </div>
    );
}
