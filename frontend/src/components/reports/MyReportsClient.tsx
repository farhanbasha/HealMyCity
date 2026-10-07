"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
    MapPin,
    Calendar,
    ChevronRight,
    Search,
    ExternalLink,
    Clock,
    CheckCircle2,
    AlertCircle,
    ArrowUpCircle,
    Plus,
} from "lucide-react";

export interface IssueRecord {
    id: string;
    user_id: string;
    image_url: string | null;
    ai_title: string | null;
    ai_description: string | null;
    ai_category: string | null;
    ai_severity_score: number | null;
    latitude: number | null;
    longitude: number | null;
    status: "open" | "in_progress" | "resolved";
    upvote_count: number;
    created_at: string;
}

interface MyReportsClientProps {
    initialIssues: IssueRecord[];
}

export default function MyReportsClient({ initialIssues }: MyReportsClientProps) {
    const [selectedStatus, setSelectedStatus] = useState<string>("all");
    const [searchQuery, setSearchQuery] = useState("");

    // Counts for tabs
    const counts = useMemo(() => {
        return {
            all: initialIssues.length,
            open: initialIssues.filter((i) => i.status === "open").length,
            in_progress: initialIssues.filter((i) => i.status === "in_progress").length,
            resolved: initialIssues.filter((i) => i.status === "resolved").length,
            upvotes: initialIssues.reduce((acc, curr) => acc + (curr.upvote_count || 0), 0),
        };
    }, [initialIssues]);

    // Filtered issues
    const filteredIssues = useMemo(() => {
        return initialIssues.filter((issue) => {
            const matchesStatus =
                selectedStatus === "all" || issue.status === selectedStatus;
            const q = searchQuery.toLowerCase().trim();
            const matchesQuery =
                !q ||
                (issue.ai_title && issue.ai_title.toLowerCase().includes(q)) ||
                (issue.ai_category && issue.ai_category.toLowerCase().includes(q)) ||
                (issue.ai_description && issue.ai_description.toLowerCase().includes(q));

            return matchesStatus && matchesQuery;
        });
    }, [initialIssues, selectedStatus, searchQuery]);

    const getStatusBadge = (status: IssueRecord["status"]) => {
        switch (status) {
            case "open":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200/60">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                        Under Review
                    </span>
                );
            case "in_progress":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-800 border border-blue-200/60">
                        <Clock size={12} className="text-blue-600" />
                        In Progress
                    </span>
                );
            case "resolved":
                return (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200/60">
                        <CheckCircle2 size={12} className="text-emerald-600" />
                        Resolved
                    </span>
                );
        }
    };

    const getSeverityDetails = (score: number | null) => {
        const val = score || 5;
        if (val >= 8) {
            return {
                text: "High Priority",
                bgColor: "bg-red-50 text-red-700 border-red-200",
                barColor: "bg-red-500",
            };
        }
        if (val >= 5) {
            return {
                text: "Moderate",
                bgColor: "bg-amber-50 text-amber-700 border-amber-200",
                barColor: "bg-amber-500",
            };
        }
        return {
            text: "Minor",
            bgColor: "bg-emerald-50 text-emerald-700 border-emerald-200",
            barColor: "bg-emerald-500",
        };
    };

    return (
        <div className="space-y-6">
            {/* Metric Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="apple-card p-4 space-y-1">
                    <p className="text-xs font-medium text-[#86868B]">Total Reports</p>
                    <p className="text-2xl font-semibold text-[#1D1D1F]">{counts.all}</p>
                    <p className="text-[11px] text-[#6E6E73]">Submitted by you</p>
                </div>

                <div className="apple-card p-4 space-y-1">
                    <p className="text-xs font-medium text-amber-700">Under Review</p>
                    <p className="text-2xl font-semibold text-[#1D1D1F]">{counts.open}</p>
                    <p className="text-[11px] text-[#6E6E73]">Awaiting inspection</p>
                </div>

                <div className="apple-card p-4 space-y-1">
                    <p className="text-xs font-medium text-blue-700">In Progress</p>
                    <p className="text-2xl font-semibold text-[#1D1D1F]">{counts.in_progress}</p>
                    <p className="text-[11px] text-[#6E6E73]">Being repaired</p>
                </div>

                <div className="apple-card p-4 space-y-1">
                    <p className="text-xs font-medium text-emerald-700">Resolved</p>
                    <p className="text-2xl font-semibold text-[#1D1D1F]">{counts.resolved}</p>
                    <p className="text-[11px] text-[#6E6E73]">Successfully fixed</p>
                </div>
            </div>

            {/* Filter Controls & Search */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pt-2">
                {/* Status Segmented Tabs */}
                <div className="inline-flex p-1 bg-[#F5F5F7] rounded-xl border border-[#E5E5EA]/80 self-start sm:self-auto overflow-x-auto max-w-full">
                    {[
                        { id: "all", label: `All (${counts.all})` },
                        { id: "open", label: `Review (${counts.open})` },
                        { id: "in_progress", label: `In Progress (${counts.in_progress})` },
                        { id: "resolved", label: `Resolved (${counts.resolved})` },
                    ].map((tab) => {
                        const isActive = selectedStatus === tab.id;
                        return (
                            <button
                                key={tab.id}
                                type="button"
                                onClick={() => setSelectedStatus(tab.id)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                                    isActive
                                        ? "bg-white text-[#1D1D1F] shadow-xs"
                                        : "text-[#6E6E73] hover:text-[#1D1D1F]"
                                }`}
                            >
                                {tab.label}
                            </button>
                        );
                    })}
                </div>

                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <Search
                        size={14}
                        className="absolute left-3 top-1/2 -translate-y-1/2 text-[#86868B]"
                    />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search your reports..."
                        className="w-full pl-8 pr-3 py-1.5 bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#D1D1D6] rounded-xl text-xs text-[#1D1D1F] focus:outline-none transition-colors"
                    />
                </div>
            </div>

            {/* Issues List */}
            {filteredIssues.length === 0 ? (
                <div className="apple-card p-12 text-center space-y-4">
                    <div className="w-14 h-14 mx-auto rounded-full bg-[#F5F5F7] flex items-center justify-center text-[#86868B]">
                        <AlertCircle size={24} />
                    </div>
                    <div className="space-y-1 max-w-sm mx-auto">
                        <h3 className="font-semibold text-base text-[#1D1D1F]">
                            {initialIssues.length === 0
                                ? "No reported issues yet"
                                : "No issues match your filter"}
                        </h3>
                        <p className="text-xs text-[#86868B] leading-relaxed">
                            {initialIssues.length === 0
                                ? "You haven't submitted any civic issues. When you report potholes, broken lights, or sanitation issues, they will appear here."
                                : "Try clearing your search query or switching to another status tab."}
                        </p>
                    </div>
                    {initialIssues.length === 0 && (
                        <Link
                            href="/report"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] text-white text-xs font-semibold hover:bg-[#333336] transition-colors"
                        >
                            <Plus size={14} />
                            <span>Report your first issue</span>
                        </Link>
                    )}
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredIssues.map((issue) => {
                        const sev = getSeverityDetails(issue.ai_severity_score);
                        const formattedDate = new Date(issue.created_at).toLocaleDateString(
                            "en-US",
                            {
                                month: "short",
                                day: "numeric",
                                year: "numeric",
                            }
                        );

                        return (
                            <div
                                key={issue.id}
                                className="apple-card p-4 sm:p-5 hover:border-[#D1D1D6] transition-all flex flex-col sm:flex-row gap-4 items-start"
                            >
                                {/* Media Thumbnail */}
                                {issue.image_url ? (
                                    <div className="relative w-full sm:w-40 aspect-[4/3] rounded-xl overflow-hidden bg-[#F5F5F7] shrink-0 border border-[#E5E5EA]/60">
                                        <Image
                                            src={issue.image_url}
                                            alt={issue.ai_title || "Report photo"}
                                            fill
                                            unoptimized
                                            className="object-cover"
                                        />
                                    </div>
                                ) : (
                                    <div className="w-full sm:w-40 aspect-[4/3] rounded-xl bg-[#F5F5F7] border border-[#E5E5EA]/60 flex items-center justify-center text-[#86868B] text-xs shrink-0">
                                        No Image
                                    </div>
                                )}

                                {/* Content Details */}
                                <div className="flex-1 min-w-0 space-y-2.5 w-full">
                                    <div className="flex flex-wrap items-center justify-between gap-2">
                                        <div className="flex items-center gap-2">
                                            {getStatusBadge(issue.status)}
                                            {issue.ai_category && (
                                                <span className="px-2 py-0.5 rounded-full text-[11px] font-medium bg-[#F5F5F7] text-[#6E6E73] border border-[#E5E5EA]/50">
                                                    {issue.ai_category}
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex items-center gap-3 text-xs text-[#86868B]">
                                            <div className="flex items-center gap-1 font-medium text-[#1D1D1F]">
                                                <ArrowUpCircle size={14} className="text-[#0071E3]" />
                                                <span>{issue.upvote_count} upvotes</span>
                                            </div>
                                            <div className="flex items-center gap-1">
                                                <Calendar size={12} />
                                                <span>{formattedDate}</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title & Description */}
                                    <div>
                                        <h4 className="font-semibold text-sm sm:text-base text-[#1D1D1F] line-clamp-1">
                                            {issue.ai_title || "Civic Issue Report"}
                                        </h4>
                                        <p className="text-xs text-[#6E6E73] line-clamp-2 mt-0.5 leading-relaxed">
                                            {issue.ai_description || "No additional description provided."}
                                        </p>
                                    </div>

                                    {/* Severity & Location Metadata */}
                                    <div className="flex flex-wrap items-center gap-4 pt-1 text-xs">
                                        {/* Severity Bar */}
                                        <div className="flex items-center gap-2">
                                            <span className="text-[#86868B] text-[11px]">Severity:</span>
                                            <div className="w-16 h-2 rounded-full bg-[#E5E5EA] overflow-hidden">
                                                <div
                                                    className={`h-full ${sev.barColor}`}
                                                    style={{
                                                        width: `${((issue.ai_severity_score || 5) / 10) * 100}%`,
                                                    }}
                                                />
                                            </div>
                                            <span className="font-semibold text-[#1D1D1F] text-[11px]">
                                                {issue.ai_severity_score || 5}/10
                                            </span>
                                        </div>

                                        {/* Coordinates / Map Pin */}
                                        {issue.latitude !== null && issue.longitude !== null && (
                                            <div className="flex items-center gap-1 text-[#86868B] text-[11px]">
                                                <MapPin size={12} />
                                                <span>
                                                    {issue.latitude.toFixed(4)}, {issue.longitude.toFixed(4)}
                                                </span>
                                            </div>
                                        )}
                                    </div>

                                    {/* Action Links */}
                                    <div className="pt-2 border-t border-[#F0F0F2] flex items-center justify-end gap-2">
                                        {issue.latitude !== null && issue.longitude !== null && (
                                            <Link
                                                href={`/map?focus=${issue.id}`}
                                                className="px-3 py-1.5 rounded-lg text-xs font-medium text-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#E8E8ED] flex items-center gap-1 transition-colors"
                                            >
                                                <MapPin size={12} className="text-[#0071E3]" />
                                                <span>View on Map</span>
                                            </Link>
                                        )}

                                        <Link
                                            href={`/issues/${issue.id}`}
                                            className="px-3 py-1.5 rounded-lg text-xs font-medium text-white bg-[#1D1D1F] hover:bg-[#333336] flex items-center gap-1 transition-colors"
                                        >
                                            <span>Full Details</span>
                                            <ChevronRight size={12} />
                                        </Link>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}
