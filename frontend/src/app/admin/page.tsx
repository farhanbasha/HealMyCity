import { createClient } from "@/lib/supabase/server";
import IssueTable from "@/components/admin/IssueTable";
import Link from "next/link";
import { MapPin, ArrowRight, Flame, AlertTriangle, Users } from "lucide-react";
import { rankIssues } from "@/lib/priority";

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    const { data: issues } = await supabase
        .from("issues")
        .select("*")
        .in("status", ["open", "in_progress"]);

    const processedIssues = rankIssues(issues || []);

    const criticalCount = processedIssues.filter((i) => i.priorityTier === "P1 Critical").length;
    const highCount = processedIssues.filter((i) => i.priorityTier === "P2 High").length;
    const totalVotes = processedIssues.reduce((acc, curr) => acc + (curr.upvote_count || 0), 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                        Issue Triage & Priority Ranking
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6E6E73]">
                        Algorithmic priority dispatch balancing AI physical severity and citizen community upvotes.
                    </p>
                </div>

                <Link
                    href="/admin/map"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] border border-[#E5E5EA] text-xs font-medium text-[#1D1D1F] transition-colors w-fit"
                >
                    <MapPin size={13} className="text-[#6E6E73]" />
                    <span>View Map</span>
                    <ArrowRight size={12} className="text-[#86868B]" />
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="apple-card p-4">
                    <div className="text-xs text-[#86868B] font-medium">Active Queue</div>
                    <div className="text-2xl font-semibold text-[#1D1D1F] mt-1">
                        {processedIssues.length}
                    </div>
                    <div className="text-[11px] text-[#86868B] mt-0.5">Awaiting triage</div>
                </div>

                <div className="apple-card p-4">
                    <div className="text-xs text-[#86868B] font-medium flex items-center gap-1">
                        <Flame size={12} className="text-[#C02820]" />
                        <span>P1 Critical</span>
                    </div>
                    <div className="text-2xl font-semibold text-[#C02820] mt-1">
                        {criticalCount}
                    </div>
                    <div className="text-[11px] text-[#C02820]/80 mt-0.5">Urgent dispatch</div>
                </div>

                <div className="apple-card p-4">
                    <div className="text-xs text-[#86868B] font-medium flex items-center gap-1">
                        <AlertTriangle size={12} className="text-[#9A5B00]" />
                        <span>P2 High</span>
                    </div>
                    <div className="text-2xl font-semibold text-[#9A5B00] mt-1">
                        {highCount}
                    </div>
                    <div className="text-[11px] text-[#9A5B00]/80 mt-0.5">Elevated priority</div>
                </div>

                <div className="apple-card p-4">
                    <div className="text-xs text-[#86868B] font-medium flex items-center gap-1">
                        <Users size={12} className="text-[#007AFF]" />
                        <span>Total Upvotes</span>
                    </div>
                    <div className="text-2xl font-semibold text-[#1D1D1F] mt-1">
                        {totalVotes}
                    </div>
                    <div className="text-[11px] text-[#86868B] mt-0.5">Citizen engagement</div>
                </div>
            </div>

            {/* Table Card */}
            <div className="apple-card overflow-hidden">
                <IssueTable initialIssues={processedIssues} />
            </div>
        </div>
    );
}
