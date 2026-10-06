"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Search } from "lucide-react";

type AdminIssue = {
    id: string;
    image_url: string | null;
    ai_title: string | null;
    ai_category: string | null;
    ai_severity_score: number | null;
    upvote_count: number;
    status: string;
    created_at: string;
    urgencyScore: number;
};

export default function IssueTable({
    initialIssues,
}: {
    initialIssues: AdminIssue[];
}) {
    const [issues, setIssues] = useState<AdminIssue[]>(initialIssues);
    const [searchQuery, setSearchQuery] = useState("");
    const [statusFilter, setStatusFilter] = useState("all");

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

    const filteredIssues = useMemo(() => {
        return issues.filter((issue) => {
            if (statusFilter !== "all" && issue.status !== statusFilter) {
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
    }, [issues, statusFilter, searchQuery]);

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
            <div className="p-3.5 border-b border-[#F0F0F2] flex items-center justify-between gap-3">
                <div className="relative flex-1 max-w-xs">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
                    <input
                        type="text"
                        placeholder="Filter issues..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 bg-[#F5F5F7] border border-transparent focus:border-[#D1D1D6] focus:bg-white rounded-lg text-xs text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none transition-all"
                    />
                </div>

                <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 bg-[#F5F5F7] border border-transparent rounded-lg text-xs font-medium text-[#1D1D1F] cursor-pointer"
                >
                    <option value="all">All statuses</option>
                    <option value="open">Open</option>
                    <option value="in_progress">In progress</option>
                </select>
            </div>

            {/* Table */}
            <div className="w-full overflow-x-auto">
                <table className="w-full text-left border-collapse">
                    <thead>
                        <tr className="border-b border-[#F0F0F2] text-[11px] font-semibold text-[#86868B] uppercase tracking-wider bg-[#FBFBFD]">
                            <th className="px-5 py-3">Issue</th>
                            <th className="px-5 py-3">Category</th>
                            <th className="px-5 py-3">Reported</th>
                            <th className="px-5 py-3 text-center">Urgency</th>
                            <th className="px-5 py-3 text-right">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0F0F2] text-xs">
                        {filteredIssues.map((issue) => {
                            const isCritical = issue.urgencyScore >= 70;
                            const isModerate = issue.urgencyScore >= 40 && issue.urgencyScore < 70;

                            return (
                                <tr
                                    key={issue.id}
                                    className="hover:bg-[#FBFBFD] transition-colors"
                                >
                                    <td className="px-5 py-3.5">
                                        <div className="flex items-center gap-3">
                                            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-[#F5F5F7] flex-shrink-0 border border-[#E5E5EA]">
                                                {issue.image_url ? (
                                                    <Image
                                                        src={issue.image_url}
                                                        alt="Thumbnail"
                                                        fill
                                                        className="object-cover"
                                                        sizes="40px"
                                                    />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[9px] text-[#86868B]">
                                                        No photo
                                                    </div>
                                                )}
                                            </div>
                                            <div className="min-w-0 max-w-xs sm:max-w-md">
                                                <p className="font-medium text-xs text-[#1D1D1F] truncate">
                                                    {issue.ai_title || "Untitled"}
                                                </p>
                                                <p className="text-[11px] text-[#86868B] truncate mt-0.5">
                                                    Upvotes: {issue.upvote_count}
                                                </p>
                                            </div>
                                        </div>
                                    </td>

                                    <td className="px-5 py-3.5 whitespace-nowrap">
                                        <span className="px-2 py-0.5 rounded text-[11px] font-medium bg-[#F5F5F7] text-[#6E6E73]">
                                            {issue.ai_category || "Unassigned"}
                                        </span>
                                    </td>

                                    <td className="px-5 py-3.5 whitespace-nowrap text-[#86868B]">
                                        {formatDistanceToNow(new Date(issue.created_at), {
                                            addSuffix: true,
                                        })}
                                    </td>

                                    <td className="px-5 py-3.5 text-center whitespace-nowrap">
                                        <span
                                            className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                                                isCritical
                                                    ? "bg-[#FDEDEC] text-[#C02820]"
                                                    : isModerate
                                                    ? "bg-[#FDF5EB] text-[#9A5B00]"
                                                    : "bg-[#EDF8F0] text-[#1D7D3B]"
                                            }`}
                                        >
                                            {issue.urgencyScore}
                                        </span>
                                    </td>

                                    <td className="px-5 py-3.5 text-right whitespace-nowrap">
                                        <select
                                            value={issue.status}
                                            onChange={(e) => handleStatusChange(issue.id, e.target.value)}
                                            className="bg-[#F5F5F7] hover:bg-[#EEEEF0] border-transparent text-xs font-medium rounded-lg px-2.5 py-1 text-[#1D1D1F] focus:outline-none cursor-pointer"
                                        >
                                            <option value="open">Open</option>
                                            <option value="in_progress">In Progress</option>
                                            <option value="resolved">Resolved</option>
                                        </select>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
