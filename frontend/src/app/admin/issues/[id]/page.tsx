import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
    ArrowLeft,
    MapPin,
    Clock,
    AlertTriangle,
    ExternalLink,
    Map as MapIcon,
    Shield,
    Flame,
    Users,
    TrendingUp,
    Sparkles,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { rankIssues, calculatePriorityMetrics } from "@/lib/priority";
import AdminStatusControl from "@/components/admin/AdminStatusControl";

export default async function AdminIssueDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();

    // 1. Fetch the target issue
    const { data: issue } = await supabase
        .from("issues")
        .select("*")
        .eq("id", id)
        .single();

    if (!issue) {
        notFound();
    }

    // 2. Fetch all active issues to compute the global queue ranking
    const { data: activeIssues } = await supabase
        .from("issues")
        .select("*")
        .in("status", ["open", "in_progress"]);

    const rankedQueue = rankIssues(activeIssues || []);
    const queueIndex = rankedQueue.findIndex((i) => i.id === issue.id);

    // Compute metrics
    const metrics = calculatePriorityMetrics(
        issue.ai_severity_score,
        issue.upvote_count
    );

    const rankNumber = queueIndex !== -1 ? queueIndex + 1 : null;
    const totalActive = rankedQueue.length;
    const severity = issue.ai_severity_score ?? 5;
    const isCritical = severity >= 8;

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            {/* Navigation Header */}
            <div className="flex items-center justify-between gap-3">
                <Link
                    href="/admin"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] text-xs font-medium text-[#1D1D1F] transition-colors shadow-2xs"
                >
                    <ArrowLeft size={13} />
                    <span>Back to Triage</span>
                </Link>

                {issue.latitude && issue.longitude && (
                    <Link
                        href={`/admin/map?focus=${issue.id}`}
                        prefetch={true}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-white text-xs font-semibold transition-colors shadow-xs"
                    >
                        <MapIcon size={13} />
                        <span>Focus on Admin Map</span>
                    </Link>
                )}
            </div>

            {/* Main Issue Card */}
            <article className="apple-card overflow-hidden bg-white">
                {/* Photo Display */}
                {issue.image_url ? (
                    <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] bg-[#F5F5F7] overflow-hidden border-b border-[#F0F0F2]">
                        <Image
                            src={issue.image_url}
                            alt={issue.ai_title || "Civic hazard"}
                            fill
                            priority
                            unoptimized
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 896px"
                        />

                        {/* Top Overlay Badges */}
                        <div className="absolute top-4 inset-x-4 flex items-center justify-between pointer-events-none">
                            <span
                                className={`px-3 py-1 rounded-full text-xs font-semibold backdrop-blur-md shadow-xs ${
                                    issue.status === "resolved"
                                        ? "bg-[#EDF8F0]/90 text-[#1D7D3B]"
                                        : issue.status === "in_progress"
                                        ? "bg-[#FDF5EB]/90 text-[#9A5B00]"
                                        : "bg-[#FDEDEC]/90 text-[#C02820]"
                                }`}
                            >
                                {issue.status.replace("_", " ").toUpperCase()}
                            </span>

                            {rankNumber ? (
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#1D1D1F]/90 backdrop-blur-md text-white shadow-xs">
                                    Priority Rank #{rankNumber}
                                </span>
                            ) : (
                                <span className="px-3 py-1 rounded-full text-xs font-medium bg-black/70 backdrop-blur-md text-white shadow-xs">
                                    Resolved Issue
                                </span>
                            )}
                        </div>
                    </div>
                ) : null}

                {/* Body Content */}
                <div className="p-6 sm:p-8 space-y-6">
                    {/* Header info */}
                    <div className="space-y-2">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-[#F5F5F7] text-[#6E6E73] uppercase tracking-wide">
                                {issue.ai_category || "General"}
                            </span>

                            {issue.created_at && (
                                <span className="inline-flex items-center gap-1 text-xs text-[#86868B]">
                                    <Clock size={12} />
                                    <span>
                                        Reported{" "}
                                        {formatDistanceToNow(new Date(issue.created_at), {
                                            addSuffix: true,
                                        })}
                                    </span>
                                </span>
                            )}
                        </div>

                        <h1 className="text-2xl sm:text-3xl font-bold text-[#1D1D1F] tracking-tight leading-tight">
                            {issue.ai_title || "Untitled Civic Issue"}
                        </h1>
                    </div>

                    {/* PRIORITY RANKING & ALGORITHM INTELLIGENCE CARD (Admin Exclusive) */}
                    <div className="rounded-2xl border border-[#E5E5EA] bg-[#FBFBFD] p-5 sm:p-6 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#E5E5EA]">
                            <div className="flex items-center gap-2">
                                <div className="w-7 h-7 rounded-lg bg-[#1D1D1F] text-white flex items-center justify-center shrink-0">
                                    <Sparkles size={14} />
                                </div>
                                <div>
                                    <h2 className="text-sm font-semibold text-[#1D1D1F]">
                                        Algorithmic Dispatch Priority
                                    </h2>
                                    <p className="text-xs text-[#86868B]">
                                        Synthesized from AI physical hazard and citizen demand saturation
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2">
                                <span
                                    className={`px-3 py-1 rounded-full text-xs font-bold border ${metrics.tierColor.bg} ${metrics.tierColor.text} ${metrics.tierColor.border}`}
                                >
                                    {metrics.tier}
                                </span>

                                {rankNumber && (
                                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#1D1D1F] text-white">
                                        Rank #{rankNumber} of {totalActive}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Metrics Breakdown Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <div className="bg-white p-3.5 rounded-xl border border-[#E5E5EA]">
                                <div className="text-[11px] font-medium text-[#86868B] uppercase">
                                    Priority Score
                                </div>
                                <div className="text-2xl font-bold text-[#1D1D1F] mt-0.5">
                                    {metrics.score.toFixed(1)}
                                    <span className="text-xs font-normal text-[#86868B]"> / 100</span>
                                </div>
                                <div className="text-[10px] text-[#86868B] mt-1">
                                    Weighted triage composite
                                </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-[#E5E5EA]">
                                <div className="text-[11px] font-medium text-[#86868B] uppercase flex items-center gap-1">
                                    <AlertTriangle size={11} className={isCritical ? "text-[#C02820]" : "text-[#9A5B00]"} />
                                    <span>AI Severity</span>
                                </div>
                                <div className={`text-2xl font-bold mt-0.5 ${isCritical ? "text-[#C02820]" : "text-[#1D1D1F]"}`}>
                                    {severity}/10
                                </div>
                                <div className="text-[10px] text-[#86868B] mt-1">
                                    Normalized: {metrics.severityNormalized}% base
                                </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-[#E5E5EA]">
                                <div className="text-[11px] font-medium text-[#86868B] uppercase flex items-center gap-1">
                                    <Users size={11} className="text-[#007AFF]" />
                                    <span>Upvotes</span>
                                </div>
                                <div className="text-2xl font-bold text-[#1D1D1F] mt-0.5">
                                    {issue.upvote_count}
                                </div>
                                <div className="text-[10px] text-[#86868B] mt-1">
                                    Saturation: {metrics.upvotesNormalized}%
                                </div>
                            </div>

                            <div className="bg-white p-3.5 rounded-xl border border-[#E5E5EA]">
                                <div className="text-[11px] font-medium text-[#86868B] uppercase flex items-center gap-1">
                                    <TrendingUp size={11} className="text-[#10B981]" />
                                    <span>Synergy</span>
                                </div>
                                <div className="text-2xl font-bold text-[#1D1D1F] mt-0.5">
                                    {((metrics.severityNormalized * metrics.upvotesNormalized) / 100).toFixed(1)}
                                </div>
                                <div className="text-[10px] text-[#86868B] mt-1">
                                    Compound urgency boost
                                </div>
                            </div>
                        </div>

                        {/* Dispatch Recommendation */}
                        <div className="p-3 bg-white rounded-xl border border-[#E5E5EA] text-xs text-[#48484A]">
                            <strong className="text-[#1D1D1F]">Triage Assessment: </strong>
                            {metrics.tier === "P1 Critical"
                                ? "Critical municipal emergency. Immediate dispatch crew required due to combined high physical hazard and strong community validation."
                                : metrics.tier === "P2 High"
                                ? "Elevated priority dispatch. Significant infrastructure impairment impacting neighborhood access."
                                : metrics.tier === "P3 Medium"
                                ? "Standard priority queue. Schedule for routine municipal repair batch."
                                : "Normal maintenance queue. Monitored for additional citizen reports."}
                        </div>
                    </div>

                    {/* AI Assessment & Description */}
                    <div className="bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl p-4 sm:p-5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F]">
                            <Shield size={14} className="text-[#007AFF]" />
                            <span>AI Municipal Inspector Notes</span>
                        </div>
                        <p className="text-sm text-[#48484A] leading-relaxed">
                            {issue.ai_description ||
                                "Infrastructure hazard reported by citizen contributor. Awaiting municipal dispatch."}
                        </p>
                    </div>

                    {/* Interactive Status Management Component */}
                    <AdminStatusControl
                        issueId={issue.id}
                        initialStatus={issue.status}
                    />

                    {/* Location Information & Actions */}
                    {issue.latitude && issue.longitude && (
                        <div className="pt-4 border-t border-[#F0F0F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="flex items-center gap-2 text-xs text-[#6E6E73]">
                                <MapPin size={15} className="text-[#007AFF] shrink-0" />
                                <span>
                                    GPS Coordinates: <strong>{issue.latitude.toFixed(5)}, {issue.longitude.toFixed(5)}</strong>
                                </span>
                            </div>

                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/admin/map?focus=${issue.id}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-xs font-semibold border border-[#E5E5EA] transition-all"
                                >
                                    <MapIcon size={13} />
                                    <span>Focus on Admin Map</span>
                                </Link>

                                <a
                                    href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-white hover:bg-[#F5F5F7] text-[#007AFF] text-xs font-semibold border border-[#E5E5EA] transition-all"
                                >
                                    <span>Google Maps</span>
                                    <ExternalLink size={12} />
                                </a>
                            </div>
                        </div>
                    )}
                </div>
            </article>
        </div>
    );
}
