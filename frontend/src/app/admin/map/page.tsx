import { createClient } from "@/lib/supabase/server";
import LiveMapWrapper from "@/components/map/LiveMapWrapper";
import Link from "next/link";
import { ArrowLeft, Flame, ShieldAlert } from "lucide-react";
import type { MapIssue } from "@/components/map/LiveMapComponent";

export default async function AdminMapPage() {
    const supabase = await createClient();

    const { data: rawIssues } = await supabase
        .from("issues")
        .select("*")
        .in("status", ["open", "in_progress"])
        .not("latitude", "is", null)
        .not("longitude", "is", null);

    const issues: MapIssue[] = (rawIssues as MapIssue[]) || [];

    const criticalCount = issues.filter((i) => (i.ai_severity_score || 0) >= 8).length;

    return (
        <div className="max-w-6xl mx-auto space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                    <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                        City Geospatial Map & Hotspots
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6E6E73]">
                        Geospatial distribution of active infrastructure issues, cluster hot-zones, and community upvotes.
                    </p>
                </div>

                <div className="flex items-center gap-2">
                    <Link
                        href="/admin"
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1D1D1F] text-white text-xs font-medium hover:bg-[#333336] transition-colors w-fit"
                    >
                        <ArrowLeft size={13} />
                        <span>Back to Triage</span>
                    </Link>
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="apple-card p-3.5">
                    <div className="text-[11px] font-medium text-[#86868B] uppercase">Active Map Pins</div>
                    <div className="text-xl font-semibold text-[#1D1D1F] mt-0.5">{issues.length}</div>
                </div>

                <div className="apple-card p-3.5">
                    <div className="text-[11px] font-medium text-[#86868B] uppercase flex items-center gap-1">
                        <Flame size={12} className="text-[#FF3B30]" />
                        <span>Critical Issues</span>
                    </div>
                    <div className="text-xl font-semibold text-[#C02820] mt-0.5">{criticalCount}</div>
                </div>

                <div className="apple-card p-3.5 col-span-2 sm:col-span-1">
                    <div className="text-[11px] font-medium text-[#86868B] uppercase flex items-center gap-1">
                        <ShieldAlert size={12} className="text-[#0071E3]" />
                        <span>Admin Privileges</span>
                    </div>
                    <div className="text-xs text-[#6E6E73] mt-1 font-medium">
                        Status updates managed exclusively in Triage Table
                    </div>
                </div>
            </div>

            {/* Live Map Component */}
            <LiveMapWrapper issues={issues} />
        </div>
    );
}
