"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Search, ArrowUpDown, Filter, Sparkles } from "lucide-react";
import { rankIssues, PriorityMetrics } from "@/lib/priority";

export type AdminIssue = {
    id: string;
    image_url: string | null;
    ai_title: string | null;
    ai_category: string | null;
    ai_severity_score: number | null;
    upvote_count: number;
    status: string;
    created_at: string;
    urgencyScore: number;
    priorityScore?: number;
    priorityRank?: number;
    priorityTier?: PriorityMetrics["tier"];
    tierColor?: PriorityMetrics["tierColor"];
};

export default function IssueTable({
    initialIssues,
}: {
    initialIssues: AdminIssue[];
}) {
    const [issues, setIssues] = useState<AdminIssue[]>(initialIssues);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");
    const [tierFilter, setTierFilter] = useState("all");
    const [sortBy, setSortBy] = useState("rank");

    async function handleStatusChange(issueId: string, newStatus: string) {
        const previousIssues = [...issues];

        setIssues((prev) =>
            prev.map((issue) =>
                issue.id === issueId ? { ...issue, status: newStatus } : issue
            )
        );

        const supabase = createClient();
        const { error } = await supabase
            .from("issues")
            .update({ status: newStatus })
            .eq("id", issueId);

        if (error) {
            toast.error("Failed to update status");
            setIssues(previousIssues);
        } else {
            toast.success(`Status updated to ${newStatus.replace("_", " ")}`);
        }
    }

    // Always recompute rankings dynamically so ranks stay deterministic and accurate
    const rankedIssues = useMemo(() => {
        return rankIssues(issues);
    }, [issues]);

    const filteredIssues = useMemo(() => {
        const filtered = rankedIssues.filter((issue) => {
            if (statusFilter !== "all" && issue.status !== statusFilter) {
                return false;
            }
            if (tierFilter !== "all" && issue.priorityTier !== tierFilter) {
                return false;
            }
            if (searchQuery.trim()) {
                const q = searchQuery.toLowerCase();
                const titleMatch = (issue.ai_title || "").toLowerCase().includes(q);
                const catMatch = (issue.ai_category || "").toLowerCase().includes(q);
                return titleMatch || catMatch;
            }
            return true;
        });

        // Multi-mode sorting
        return filtered.sort((a, b) => {
            if (sortBy === "rank") {
                return a.priorityRank - b.priorityRank;
            }
            if (sortBy === "upvotes") {
                return (b.upvote_count || 0) - (a.upvote_count || 0);
            }
            if (sortBy === "severity") {
                return (b.ai_severity_score || 0) - (a.ai_severity_score || 0);
            }
            if (sortBy === "newest") {
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            }
            return a.priorityRank - b.priorityRank;
        });
    }, [rankedIssues, statusFilter, tierFilter, searchQuery, sortBy]);

    if (issues.length === 0) {
        return (
            <div className="p-12 text-center space-y-2">
                <p className="font-semibold text-sm text-[#1D1D1F]">
                    No active issues
                </p>
                <p className="text-xs text-[#86868B]">
                    All reported civic issues have been resolved.
                </p>
            </div>
        );
    }

    return (
        <div className="w-full flex flex-col bg-white">
            {/* Table Search & Filter Bar */}
            <div className="p-3.5 border-b border-[#F0F0F2] flex flex-col md:flex-row md:items-center justify-between gap-3">
                <div className="relative flex-1 max-w-sm">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Filter by title or category..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-[#F5F5F7] border border-transparent focus:border-[#D1D1D6] focus:bg-white rounded-lg text-xs text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none transition-all"
                    />
                </div>

                <div className="flex flex-wrap items-center gap-2">
                    {/* Sort By Dropdown */}
                    <div className="flex items-center gap-1.5 bg-[#F5F5F7] px-2.5 py-1.5 rounded-lg border border-transparent">
                        <ArrowUpDown size={12} className="text-[#86868B]" />
                        <select
                            value={sortBy}
                            onChange={(e) => setSortBy(e.target.value)}
                            className="bg-transparent text-xs font-medium text-[#1D1D1F] cursor-pointer focus:outline-none"
                            aria-label="Sort issues"
                        >
                            <option value="rank">Sort: Priority Rank</option>
                            <option value="upvotes">Sort: Most Upvotes</option>
                            <option value="severity">Sort: Highest Severity</option>
                            <option value="newest">Sort: Newest First</option>
                        </select>
                    </div>

                    {/* Tier Filter Dropdown */}
                    <div className="flex items-center gap-1.5 bg-[#F5F5F7] px-2.5 py-1.5 rounded-lg border border-transparent">
                        <Filter size={12} className="text-[#86868B]" />
                        <select
                            value={tierFilter}
                            onChange={(e) => setTierFilter(e.target.value)}
                            className="bg-transparent text-xs font-medium text-[#1D1D1F] cursor-pointer focus:outline-none"
                            aria-label="Filter by priority tier"
                        >
                            <option value="all">All Priorities</option>
                            <option value="P1 Critical">P1 Critical</option>
                            <option value="P2 High">P2 High</option>
                            <option value="P3 Medium">P3 Medium</option>
                            <option value="P4 Normal">P4 Normal</option>
                        </select>
                    </div>

                    {/* Status Filter Dropdown */}
                    <select
                        value={statusFilter}
                        onChange={(e) => setStatusFilter(e.target.value)}
                        className="px-2.5 py-1.5 bg-[#F5F5F7] border border-transparent rounded-lg text-xs font-medium text-[#1D1D1F] cursor-pointer focus:outline-none"
                        aria-label="Filter by status"
                    >
                        <option value="all">All Statuses</option>
                        <option value="open">Open</option>
                        <option value="in_progress">In progress</option>
                    </select>
                </div>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#F0F0F2] text-[11px] font-semibold text-[#86868B] uppercase tracking-wider bg-[#FBFBFD]">
                            <th className="px-4 py-3 text-center w-16">Rank</th>
                            <th className="px-5 py-3">Issue & Civic Signal</th>
                            <th className="px-4 py-3">Category</th>
                            <th className="px-5 py-3">Priority Score</th>
                            <th className="px-4 py-3">Reported</th>
                            <th className="px-5 py-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F2] text-xs">
                        {filteredIssues.length === 0 ? (
                            <tr>
                                <td colSpan={6} className="px-5 py-10 text-center text-xs text-[#86868B]">
                                    No issues found matching your current filter criteria.
                                </td>
                            </tr>
                        ) : (
                            filteredIssues.map((issue) => {
                                const sev = issue.ai_severity_score ?? 5;
                                const isSevHigh = sev >= 8;
                                const isSevMed = sev >= 5;

                                return (
                                    <tr
                                        key={issue.id}
                                        className="hover:bg-[#FBFBFD] transition-colors"
                                    >
                                        {/* Priority Rank */}
                                        <td className="px-4 py-3.5 text-center whitespace-nowrap">
                                            <span
                                                className={`inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-xs font-bold ${
                                                    issue.priorityRank === 1
                                                        ? "bg-[#1D1D1F] text-white shadow-xs"
                                                        : issue.priorityRank === 2
                                                        ? "bg-[#E5E5EA] text-[#1D1D1F]"
                                                        : issue.priorityRank === 3
                                                        ? "bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5EA]"
                                                        : "text-[#86868B] font-semibold"
                                                }`}
                                            >
                                                #{issue.priorityRank}
                                            </span>
                                        </td>

                                        {/* Issue Info + Severity & Upvotes */}
                                        <td className="px-5 py-3.5">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-11 h-11 rounded-lg overflow-hidden bg-[#F5F5F7] flex-shrink-0 border border-[#E5E5EA]">
                                                    {issue.image_url ? (
                                                        <Image
                                                            src={issue.image_url}
                                                            alt="Thumbnail"
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                            sizes="44px"
                                                        />
                                                    ) : (
                                                        <div className="w-full h-full flex items-center justify-center text-[9px] text-[#86868B]">
                                                            No photo
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="min-w-0 max-w-xs sm:max-w-md">
                                                    <p className="font-semibold text-xs text-[#1D1D1F] truncate">
                                                        {issue.ai_title || "Untitled"}
                                                    </p>
                                                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                                                        {/* Severity signal pill */}
                                                        <span
                                                            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium ${
                                                                isSevHigh
                                                                    ? "bg-[#FDEDEC] text-[#C02820]"
                                                                    : isSevMed
                                                                    ? "bg-[#FDF5EB] text-[#9A5B00]"
                                                                    : "bg-[#EDF8F0] text-[#1D7D3B]"
                                                            }`}
                                                        >
                                                            Sev {sev}/10
                                                        </span>

                                                        {/* Upvotes signal pill */}
                                                        <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#F5F5F7] text-[#48484A]">
                                                            ▲ {issue.upvote_count} {issue.upvote_count === 1 ? "vote" : "votes"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </td>

                                        {/* Category */}
                                        <td className="px-4 py-3.5 whitespace-nowrap">
                                            <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F5F5F7] text-[#6E6E73]">
                                                {issue.ai_category || "Unassigned"}
                                            </span>
                                        </td>

                                        {/* Priority Score & Tier */}
                                        <td className="px-5 py-3.5 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span
                                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold border ${
                                                        issue.tierColor
                                                            ? `${issue.tierColor.bg} ${issue.tierColor.text} ${issue.tierColor.border}`
                                                            : "bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5EA]"
                                                    }`}
                                                >
                                                    {issue.priorityTier}
                                                </span>
                                                <span className="text-xs font-semibold text-[#1D1D1F]">
                                                    {issue.priorityScore?.toFixed(1) ?? issue.urgencyScore}
                                                </span>
                                            </div>
                                        </td>

                                        {/* Reported */}
                                        <td className="px-4 py-3.5 whitespace-nowrap text-[#86868B]">
                                            {formatDistanceToNow(new Date(issue.created_at), {
                                                addSuffix: true,
                                            })}
                                        </td>

                                        {/* Status */}
                                        <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                            <select
                                                value={issue.status}
                                                onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                                className="bg-[#F5F5F7] hover:bg-[#EEEEF0] border border-transparent text-xs font-medium rounded-lg px-2.5 py-1 text-[#1D1D1F] focus:outline-none cursor-pointer transition-colors"
                                            >
                                                <option value="open">Open</option>
                                                <option value="in_progress">In Progress</option>
                                                <option value="resolved">Resolved</option>
                                            </select>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
