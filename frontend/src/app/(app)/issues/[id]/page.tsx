import { createClient, getCachedAuthUser } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
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
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { MapIssue } from "@/components/map/LiveMapComponent";

export default async function IssueDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const user = await getCachedAuthUser();

    if (!user) {
        redirect("/login");
    }

    const supabase = await createClient();

    // Fetch from database
    const { data: dbIssue } = await supabase
        .from("issues")
        .select("*")
        .eq("id", id)
        .single();

    if (!dbIssue) {
        notFound();
    }

    const issue = dbIssue as MapIssue;

    const severity = issue.ai_severity_score ?? 5;
    const isCritical = severity >= 8;

    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6">
            {/* Top Navigation Bar */}
            <div className="flex items-center justify-between">
                <Link
                    href="/"
                    prefetch={true}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] text-xs font-medium text-[#1D1D1F] transition-colors"
                >
                    <ArrowLeft size={13} />
                    <span>Back to Feed</span>
                </Link>

                {issue.latitude && issue.longitude && (
                    <Link
                        href={`/map?focus=${issue.id}`}
                        prefetch={true}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-white text-xs font-medium transition-colors"
                    >
                        <MapIcon size={13} />
                        <span>View on Live Map</span>
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
                            alt={issue.ai_title || "Civic issue photo"}
                            fill
                            priority
                            className="object-cover"
                            sizes="(max-width: 1024px) 100vw, 896px"
                        />

                        {/* Badges on Image */}
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

                            <span className="px-3 py-1 rounded-full text-xs font-semibold bg-black/70 backdrop-blur-md text-white shadow-xs">
                                Severity {severity}/10
                            </span>
                        </div>
                    </div>
                ) : null}

                {/* Content Section */}
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

                    {/* AI Assessment & Description */}
                    <div className="bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl p-4 sm:p-5 space-y-2">
                        <div className="flex items-center gap-1.5 text-xs font-semibold text-[#1D1D1F]">
                            <Shield size={14} className="text-[#007AFF]" />
                            <span>AI Municipal Inspector Analysis</span>
                        </div>
                        <p className="text-sm text-[#48484A] leading-relaxed">
                            {issue.ai_description ||
                                "Infrastructure hazard reported by citizen contributor. Awaiting municipal dispatch."}
                        </p>
                    </div>

                    {/* Severity and Impact Metric Cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 rounded-xl bg-[#F5F5F7]">
                            <div className="text-xs text-[#86868B] font-medium">Community Upvotes</div>
                            <div className="text-2xl font-bold text-[#1D1D1F] mt-1">
                                {issue.upvote_count}
                            </div>
                            <p className="text-[11px] text-[#86868B] mt-0.5">Citizens confirmed this report</p>
                        </div>

                        <div className="p-4 rounded-xl bg-[#F5F5F7]">
                            <div className="text-xs text-[#86868B] font-medium flex items-center gap-1">
                                <AlertTriangle size={13} className={isCritical ? "text-[#C02820]" : "text-[#9A5B00]"} />
                                <span>Severity Level</span>
                            </div>
                            <div className={`text-2xl font-bold mt-1 ${isCritical ? "text-[#C02820]" : "text-[#1D1D1F]"}`}>
                                {severity}/10
                            </div>
                            <p className="text-[11px] text-[#86868B] mt-0.5">
                                {isCritical ? "Immediate hazard priority" : "Standard municipal queue"}
                            </p>
                        </div>

                        <div className="p-4 rounded-xl bg-[#F5F5F7]">
                            <div className="text-xs text-[#86868B] font-medium">Current Status</div>
                            <div className="text-2xl font-bold text-[#1D1D1F] mt-1 capitalize">
                                {issue.status.replace("_", " ")}
                            </div>
                            <p className="text-[11px] text-[#86868B] mt-0.5">Municipal review status</p>
                        </div>
                    </div>

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
                                    href={`/map?focus=${issue.id}`}
                                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-xs font-semibold border border-[#E5E5EA] transition-all"
                                >
                                    <MapIcon size={13} />
                                    <span>Focus on Live Map</span>
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
