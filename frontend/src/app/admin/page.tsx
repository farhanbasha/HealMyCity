import { createClient } from "@/lib/supabase/server";
import IssueTable from "@/components/admin/IssueTable";
import Link from "next/link";
import { MapPin, ArrowRight } from "lucide-react";

export default async function AdminDashboardPage() {
    const supabase = await createClient();

    const { data: issues } = await supabase
        .from("issues")
        .select("*")
        .in("status", ["open", "in_progress"]);

    const processedIssues = (issues || []).map((issue) => {
        const sev = issue.ai_severity_score || 0;
        const votes = issue.upvote_count || 0;
        const urgencyScore = sev * 10 + votes;

        return {
            ...issue,
            urgencyScore,
        };
    });

    processedIssues.sort((a, b) => b.urgencyScore - a.urgencyScore);

    const criticalCount = processedIssues.filter((i) => (i.ai_severity_score || 0) >= 8).length;
    const totalVotes = processedIssues.reduce((acc, curr) => acc + (curr.upvote_count || 0), 0);

    return (
        <div className="max-w-6xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                        Issue Triage
                    </h1>
                    <p className="text-xs sm:text-sm text-[#6E6E73]">
                        Prioritize active infrastructure reports based on severity and citizen upvotes.
                    </p>
                </div>

                <Link
                    href="/admin/map"
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] border border-[#E5E5EA] text-xs font-medium text-[#1D1D1F] transition-colors w-fit"
                >
                    <MapPin size={13} className="text-[#6E6E73]" />
                    <span>View Map</span>
                    <ArrowRight size={12} className="text-[#86868B]" />
                </Link>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-3 gap-3">
                <div className="apple-card p-4">
                    <div className="text-xs text-[#86868B]">Active Queue</div>
                    <div className="text-2xl font-semibold text-[#1D1D1F] mt-1">
                        {processedIssues.length}
                    </div>
                </div>

                <div className="apple-card p-4">
                    <div className="text-xs text-[#86868B]">Critical Severity (≥8)</div>
                    <div className="text-2xl font-semibold text-[#C02820] mt-1">
                        {criticalCount}
                    </div>
                </div>

                <div className="apple-card p-4">
                    <div className="text-xs text-[#86868B]">Citizen Upvotes</div>
                    <div className="text-2xl font-semibold text-[#1D1D1F] mt-1">
                        {totalVotes}
                    </div>
                </div>
            </div>

            {/* Table Card */}
            <div className="apple-card overflow-hidden">
                <IssueTable initialIssues={processedIssues} />
            </div>
        </div>
    );
}
