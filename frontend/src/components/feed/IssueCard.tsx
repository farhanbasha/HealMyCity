"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { ArrowBigUp, Clock, MapPin } from "lucide-react";
import { toast } from "sonner";
import Image from "next/image";
import Link from "next/link";

export interface Issue {
    id: string;
    user_id: string;
    image_url: string | null;
    ai_title: string | null;
    ai_description: string | null;
    ai_category: string | null;
    ai_severity_score: number | null;
    latitude: number | null;
    longitude: number | null;
    status: string;
    upvote_count: number;
    created_at: string;
}

interface IssueCardProps {
    issue: Issue;
    isVoted: boolean;
    userId: string;
    distanceKm?: number;
    onVoteToggle: (issueId: string, newCount: number, voted: boolean) => void;
}

function timeAgo(dateStr: string): string {
    const now = Date.now();
    const diff = now - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function StatusTag({ status }: { status: string }) {
    if (status === "resolved") {
        return (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#EDF8F0] text-[#1D7D3B]">
                Resolved
            </span>
        );
    }
    if (status === "in_progress") {
        return (
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FDF5EB] text-[#9A5B00]">
                In Progress
            </span>
        );
    }
    return (
        <span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[#FDEDEC] text-[#C02820]">
            Open
        </span>
    );
}

export default function IssueCard({
    issue,
    isVoted,
    distanceKm,
    onVoteToggle,
}: IssueCardProps) {
    const [voting, setVoting] = useState(false);

    async function handleUpvote() {
        if (voting) return;
        setVoting(true);

        const optimisticVoted = !isVoted;
        const optimisticCount = issue.upvote_count + (optimisticVoted ? 1 : -1);
        onVoteToggle(issue.id, optimisticCount, optimisticVoted);

        try {
            const supabase = createClient();
            const { data, error } = await supabase.rpc("toggle_upvote", {
                p_issue_id: issue.id,
            });

            if (error) {
                onVoteToggle(issue.id, issue.upvote_count, isVoted);
                toast.error("Could not update vote");
            } else if (data) {
                onVoteToggle(issue.id, data.upvote_count, data.voted);
            }
        } catch {
            onVoteToggle(issue.id, issue.upvote_count, isVoted);
            toast.error("Network issue");
        }

        setVoting(false);
    }

    const severity = issue.ai_severity_score ?? 5;

    return (
        <article
            id={`issue-${issue.id}`}
            className="apple-card flex flex-col overflow-hidden bg-white group scroll-mt-24"
        >
            {/* Visual Header / Photo */}
            {issue.image_url ? (
                <Link
                    href={`/issues/${issue.id}`}
                    prefetch={true}
                    className="relative w-full aspect-[16/10] bg-[#F5F5F7] overflow-hidden border-b border-[#F0F0F2] block"
                >
                    <Image
                        src={issue.image_url}
                        alt={issue.ai_title || "Civic issue photo"}
                        fill
                        className="object-cover group-hover:scale-[1.02] transition-transform duration-500 ease-out"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />

                    {/* Top Status & Category Badges */}
                    <div className="absolute top-3 inset-x-3 flex items-center justify-between pointer-events-none">
                        <StatusTag status={issue.status} />

                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/60 backdrop-blur-md text-white">
                            Severity {severity}/10
                        </span>
                    </div>
                </Link>
            ) : (
                <div className="p-4 pb-0 flex items-center justify-between">
                    <StatusTag status={issue.status} />
                    <span className="text-[11px] font-medium text-[#86868B]">
                        Severity {severity}/10
                    </span>
                </div>
            )}

            {/* Content Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                <div className="space-y-1.5">
                    {issue.ai_category && (
                        <div className="text-[11px] font-medium text-[#86868B] uppercase tracking-wide">
                            {issue.ai_category}
                        </div>
                    )}
                    <h3 className="font-semibold text-[15px] text-[#1D1D1F] leading-snug line-clamp-2 hover:text-[#007AFF] transition-colors">
                        <Link href={`/issues/${issue.id}`} prefetch={true}>
                            {issue.ai_title || "Untitled Civic Issue"}
                        </Link>
                    </h3>
                    <p className="text-[13px] text-[#6E6E73] leading-relaxed line-clamp-2">
                        {issue.ai_description || "No description provided."}
                    </p>
                </div>

                {/* Footer Metadata & Clean Upvote */}
                <div className="pt-3.5 border-t border-[#F0F0F2] flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 text-xs text-[#86868B] flex-wrap">
                        <span className="flex items-center gap-1">
                            <Clock size={12} className="text-[#86868B]" />
                            {timeAgo(issue.created_at)}
                        </span>

                        {distanceKm !== undefined && isFinite(distanceKm) && (
                            <span className="flex items-center gap-0.5 font-semibold text-[#007AFF] bg-[#EBF5FF] px-2 py-0.5 rounded-full text-[10px]">
                                <MapPin size={10} />
                                <span>
                                    {distanceKm < 1
                                        ? `${Math.round(distanceKm * 1000)}m away`
                                        : `${distanceKm.toFixed(1)} km away`}
                                </span>
                            </span>
                        )}

                        {issue.latitude && issue.longitude && (
                            <Link
                                href={`/map?focus=${issue.id}`}
                                prefetch={true}
                                className="flex items-center gap-1 hover:text-[#1D1D1F] transition-colors"
                                title="View on Live Map"
                            >
                                <MapPin size={12} className="text-[#86868B]" />
                                <span>Map</span>
                            </Link>
                        )}
                    </div>

                    {/* Upvote Pill Button */}
                    <button
                        onClick={handleUpvote}
                        disabled={voting}
                        title={isVoted ? "Remove upvote" : "Upvote this issue"}
                        className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium transition-all duration-200 cursor-pointer active:scale-95 ${
                            isVoted
                                ? "bg-[#1D1D1F] text-white"
                                : "bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F]"
                        } disabled:opacity-50`}
                    >
                        <ArrowBigUp
                            size={15}
                            fill={isVoted ? "currentColor" : "none"}
                            strokeWidth={2}
                        />
                        <span>{issue.upvote_count}</span>
                    </button>
                </div>
            </div>
        </article>
    );
}
