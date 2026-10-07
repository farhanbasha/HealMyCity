"use client";

import { useState, useMemo, useEffect } from "react";
import "leaflet/dist/leaflet.css";
import {
    MapContainer,
    TileLayer,
    CircleMarker,
    Circle,
    Popup,
    useMap,
} from "react-leaflet";
import L from "leaflet";
import Image from "next/image";
import Link from "next/link";
import { Flame, Layers, ExternalLink, ArrowRight, Sparkles } from "lucide-react";

// Fix for missing default markers in Leaflet + Next.js
const iconRetinaUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png";
const iconUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png";
const shadowUrl = "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png";

if (typeof window !== "undefined") {
    delete (L.Icon.Default.prototype as unknown as { _getIconUrl?: unknown })._getIconUrl;
    L.Icon.Default.mergeOptions({
        iconRetinaUrl,
        iconUrl,
        shadowUrl,
    });
}

export interface MapIssue {
    id: string;
    image_url: string | null;
    ai_title: string | null;
    ai_description?: string | null;
    ai_category: string | null;
    ai_severity_score?: number | null;
    latitude: number;
    longitude: number;
    upvote_count: number;
    status: string;
    created_at?: string;
}

export interface Hotspot {
    id: string;
    title: string;
    latitude: number;
    longitude: number;
    issueCount: number;
    totalUpvotes: number;
    highestSeverity: number;
    primaryCategory: string;
    radiusMeters: number;
    densityScore: number; // 0 to 1 scale
    issues: MapIssue[];
}

// Distance helper using Haversine formula (km)
function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos((lat1 * Math.PI) / 180) *
            Math.cos((lat2 * Math.PI) / 180) *
            Math.sin(dLon / 2) *
            Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

// Polished Apple & Google Maps color palette
export function getCategoryColor(category: string | null): {
    fill: string;
    stroke: string;
    label: string;
    badgeBg: string;
    badgeText: string;
} {
    const cat = (category || "").toLowerCase();
    if (cat.includes("water") || cat.includes("leak") || cat.includes("drainage")) {
        return {
            fill: "#007AFF", // Apple iOS System Blue
            stroke: "#FFFFFF",
            label: "Water",
            badgeBg: "#EBF5FF",
            badgeText: "#007AFF",
        };
    }
    if (cat.includes("road") || cat.includes("pothole") || cat.includes("street")) {
        return {
            fill: "#475569", // Apple Maps Slate / Charcoal
            stroke: "#FFFFFF",
            label: "Roads",
            badgeBg: "#F1F5F9",
            badgeText: "#334155",
        };
    }
    if (cat.includes("trash") || cat.includes("garbage") || cat.includes("sanitation") || cat.includes("waste")) {
        return {
            fill: "#10B981", // Apple & Google Maps Clean Emerald Green
            stroke: "#FFFFFF",
            label: "Waste",
            badgeBg: "#EDFDF5",
            badgeText: "#059669",
        };
    }
    if (cat.includes("power") || cat.includes("light") || cat.includes("lamp") || cat.includes("electricity")) {
        return {
            fill: "#F59E0B", // Apple Maps Warm Gold / Amber
            stroke: "#FFFFFF",
            label: "Lights",
            badgeBg: "#FFFBEB",
            badgeText: "#D97706",
        };
    }
    if (cat.includes("danger") || cat.includes("hazard") || cat.includes("safety")) {
        return {
            fill: "#EF4444", // Apple System Coral Red
            stroke: "#FFFFFF",
            label: "Hazards",
            badgeBg: "#FEF2F2",
            badgeText: "#DC2626",
        };
    }
    return {
        fill: "#6366F1", // Apple System Indigo
        stroke: "#FFFFFF",
        label: "Other",
        badgeBg: "#EEF2FF",
        badgeText: "#4F46E5",
    };
}

// Helper component for smooth panning and zooming
function MapController({
    target,
}: {
    target: { center: [number, number]; zoom: number } | null;
}) {
    const map = useMap();

    useEffect(() => {
        if (target) {
            map.flyTo(target.center, target.zoom, {
                duration: 1.2,
                easeLinearity: 0.25,
            });
        }
    }, [target, map]);

    return null;
}

export default function LiveMapComponent({
    issues,
    focusIssueId,
}: {
    issues: MapIssue[];
    focusIssueId?: string;
}) {
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [viewMode, setViewMode] = useState<"all" | "hotspots">("all");
    const [showHeatmaps, setShowHeatmaps] = useState(true);
    const [activeTarget, setActiveTarget] = useState<{ center: [number, number]; zoom: number } | null>(null);

    // Dynamic CARTO / OpenStreetMap tile resolution with valid ?key= parameter
    const cartoKey = process.env.NEXT_PUBLIC_CARTO_API_KEY?.trim();
    const tileUrl = cartoKey
        ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${cartoKey}`
        : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
    const tileAttribution = cartoKey
        ? '&copy; <a href="https://carto.com/">CARTO</a>'
        : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // If focusIssueId is provided via URL parameter, resolve its target
    const focusedTarget = useMemo<{ center: [number, number]; zoom: number } | null>(() => {
        if (!focusIssueId) return null;
        const match = issues.find((i) => i.id === focusIssueId);
        if (match && typeof match.latitude === "number" && typeof match.longitude === "number") {
            return {
                center: [match.latitude, match.longitude],
                zoom: 16,
            };
        }
        return null;
    }, [focusIssueId, issues]);

    const currentTarget = activeTarget || focusedTarget;

    // Compute Hotspots dynamically from issue proximity (clustering within ~1.0 km)
    const hotspots = useMemo<Hotspot[]>(() => {
        const validIssues = issues.filter(
            (i) => typeof i.latitude === "number" && typeof i.longitude === "number"
        );
        const clusters: MapIssue[][] = [];
        const visited = new Set<string>();

        for (let i = 0; i < validIssues.length; i++) {
            const current = validIssues[i];
            if (visited.has(current.id)) continue;

            const cluster: MapIssue[] = [current];
            visited.add(current.id);

            // Expand cluster greedily
            for (let j = 0; j < validIssues.length; j++) {
                const candidate = validIssues[j];
                if (visited.has(candidate.id)) continue;

                // Check distance against any issue in this cluster
                const isNear = cluster.some((member) => {
                    const dist = getDistanceKm(
                        member.latitude,
                        member.longitude,
                        candidate.latitude,
                        candidate.longitude
                    );
                    return dist <= 1.0; // 1.0 km cluster threshold
                });

                if (isNear) {
                    cluster.push(candidate);
                    visited.add(candidate.id);
                }
            }

            clusters.push(cluster);
        }

        // Form hotspot list from clusters
        const detectedHotspots: Hotspot[] = [];

        clusters.forEach((cluster, idx) => {
            // A cluster qualifies as a hotspot if it has >= 2 issues, OR a single issue with high severity (>=8)
            const hasMultiple = cluster.length >= 2;
            const hasCritical = cluster.some((i) => (i.ai_severity_score || 0) >= 8);

            if (hasMultiple || hasCritical) {
                const totalLat = cluster.reduce((sum, item) => sum + item.latitude, 0);
                const totalLng = cluster.reduce((sum, item) => sum + item.longitude, 0);
                const centerLat = totalLat / cluster.length;
                const centerLng = totalLng / cluster.length;

                // Determine max distance from center to set circle radius in meters
                let maxDistKm = 0;
                cluster.forEach((item) => {
                    const d = getDistanceKm(centerLat, centerLng, item.latitude, item.longitude);
                    if (d > maxDistKm) maxDistKm = d;
                });

                // Compact, realistic neighborhood radius: between 60m and 180m
                const radiusMeters = Math.max(
                    60,
                    Math.min(180, Math.round(maxDistKm * 1000 + 35))
                );

                // Most common category
                const catCounts: Record<string, number> = {};
                cluster.forEach((item) => {
                    const c = item.ai_category || "General";
                    catCounts[c] = (catCounts[c] || 0) + 1;
                });
                const primaryCategory = Object.keys(catCounts).reduce((a, b) =>
                    catCounts[a] > catCounts[b] ? a : b
                );

                const totalUpvotes = cluster.reduce((sum, item) => sum + item.upvote_count, 0);
                const highestSeverity = Math.max(
                    ...cluster.map((item) => item.ai_severity_score || 5)
                );

                // Density score: calculated from issue concentration, severity, and upvote volume
                // Range: 0.2 (light) to 1.0 (very dense)
                const countWeight = Math.min(0.65, (cluster.length - 1) * 0.18 + 0.2);
                const severityWeight = (highestSeverity / 10) * 0.25;
                const votesWeight = Math.min(0.15, (totalUpvotes / 50) * 0.15);
                const densityScore = Math.min(1.0, countWeight + severityWeight + votesWeight);

                detectedHotspots.push({
                    id: `hotspot-${idx + 1}`,
                    title: `${primaryCategory} Cluster`,
                    latitude: centerLat,
                    longitude: centerLng,
                    issueCount: cluster.length,
                    totalUpvotes,
                    highestSeverity,
                    primaryCategory,
                    radiusMeters,
                    densityScore,
                    issues: cluster,
                });
            }
        });

        // Sort by density score descending
        return detectedHotspots.sort((a, b) => b.densityScore - a.densityScore);
    }, [issues]);

    // Filter issues by category
    const filteredIssues = useMemo(() => {
        return issues.filter((issue) => {
            if (selectedCategory === "all") return true;
            const cat = (issue.ai_category || "").toLowerCase();
            return cat.includes(selectedCategory.toLowerCase());
        });
    }, [issues, selectedCategory]);

    // Map default center
    const defaultCenter: [number, number] = useMemo(() => {
        if (issues.length > 0 && issues[0].latitude && issues[0].longitude) {
            return [issues[0].latitude, issues[0].longitude];
        }
        return [12.9716, 77.5946];
    }, [issues]);

    function handleFocusHotspot(hotspot: Hotspot) {
        setActiveTarget({
            center: [hotspot.latitude, hotspot.longitude],
            zoom: 16,
        });
    }

    return (
        <div className="w-full space-y-4">
            {/* Filter and Mode Control Bar */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* View Modes */}
                    <div className="flex items-center gap-1.5 p-1 bg-[#F5F5F7] rounded-xl w-fit">
                        <button
                            onClick={() => setViewMode("all")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                viewMode === "all"
                                    ? "bg-white text-[#1D1D1F] shadow-xs"
                                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                            }`}
                        >
                            <Layers size={13} />
                            <span>All Issues ({filteredIssues.length})</span>
                        </button>

                        <button
                            onClick={() => setViewMode("hotspots")}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                                viewMode === "hotspots"
                                    ? "bg-white text-[#C02820] shadow-xs"
                                    : "text-[#6E6E73] hover:text-[#1D1D1F]"
                            }`}
                        >
                            <Flame size={13} className="text-[#EF4444]" />
                            <span>Density Hotspots ({hotspots.length})</span>
                        </button>
                    </div>

                    {/* Toggle Colored Heatmaps & Category Filter */}
                    <div className="flex flex-wrap items-center gap-2">
                        <button
                            onClick={() => setShowHeatmaps(!showHeatmaps)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                                showHeatmaps
                                    ? "bg-[#F0FDF4] border-[#BBF7D0] text-[#15803D]"
                                    : "bg-[#F5F5F7] border-transparent text-[#6E6E73] hover:text-[#1D1D1F]"
                            }`}
                            title="Toggle individual category heatmaps"
                        >
                            <Sparkles size={13} />
                            <span>Color Heatmaps {showHeatmaps ? "On" : "Off"}</span>
                        </button>

                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            aria-label="Filter by issue category"
                            className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#EEEEF0] rounded-lg text-xs font-medium text-[#1D1D1F] border border-transparent focus:border-[#D1D1D6] focus:outline-none cursor-pointer"
                        >
                            <option value="all">All Categories</option>
                            <option value="roads">Roads</option>
                            <option value="water">Water & Sanitation</option>
                            <option value="streetlights">Streetlights</option>
                            <option value="sanitation">Waste & Trash</option>
                            <option value="safety">Hazards</option>
                        </select>
                    </div>
                </div>

                {/* Hotspot Quick Jump Bar */}
                {hotspots.length > 0 && (
                    <div className="pt-2 border-t border-[#F0F0F2] flex items-center gap-2 overflow-x-auto no-scrollbar">
                        <span className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider shrink-0 flex items-center gap-1">
                            <Flame size={12} className="text-[#EF4444]" />
                            Hotspots:
                        </span>

                        {hotspots.map((hs) => (
                            <button
                                key={hs.id}
                                onClick={() => handleFocusHotspot(hs)}
                                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-[#F5F5F7] hover:bg-[#FFECEB] hover:text-[#C02820] text-[#1D1D1F] border border-[#E5E5EA] transition-all shrink-0 cursor-pointer"
                            >
                                <span
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{
                                        backgroundColor:
                                            hs.densityScore >= 0.7
                                                ? "#DC2626"
                                                : hs.densityScore >= 0.45
                                                ? "#EA580C"
                                                : "#F59E0B",
                                    }}
                                />
                                <span>{hs.title}</span>
                                <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-white text-[#6E6E73] font-semibold border border-[#E5E5EA]">
                                    {hs.issueCount}
                                </span>
                            </button>
                        ))}
                    </div>
                )}
            </div>

            {/* Map Frame */}
            <div className="apple-card overflow-hidden relative border border-[#E5E5EA] rounded-2xl">
                <div className="w-full h-[580px] sm:h-[640px] z-0 relative overflow-hidden bg-[#FBFBFD]">
                    <MapContainer
                        center={defaultCenter}
                        zoom={13}
                        scrollWheelZoom={true}
                        className="w-full h-full"
                    >
                        <MapController target={currentTarget} />

                        {/* Map Tiles Layer (CARTO Voyager with valid key or OpenStreetMap fallback) */}
                        <TileLayer
                            attribution={tileAttribution}
                            url={tileUrl}
                            subdomains={cartoKey ? "abcd" : "abc"}
                            maxZoom={19}
                        />

                        {/* 1. INDIVIDUAL ISSUE CATEGORY-COLORED GRADIENT HEATMAPS (Apple & Google Style) */}
                        {showHeatmaps &&
                            viewMode === "all" &&
                            filteredIssues.map((issue) => {
                                const catColor = getCategoryColor(issue.ai_category);
                                const sev = issue.ai_severity_score || 5;
                                const votes = issue.upvote_count || 0;

                                // Darkness & Opacity scale: denser/more severe issues become noticeably darker
                                // Range from 0.28 (subtle) to 0.85 (deep, rich intensity)
                                const intensity = Math.min(
                                    0.85,
                                    0.28 + (sev / 10) * 0.38 + Math.min(0.20, (votes / 35) * 0.20)
                                );

                                // Compact, focused localized radius: 30m to 85m based on severity and upvotes
                                const radius = Math.round(
                                    30 + (sev / 10) * 35 + Math.min(20, Math.sqrt(votes) * 2.5)
                                );

                                return (
                                    <div key={`issue-heat-${issue.id}`}>
                                        {/* Layer 1: Outer soft diffuse halo (no outline border) */}
                                        <Circle
                                            center={[issue.latitude, issue.longitude]}
                                            radius={radius}
                                            stroke={false}
                                            pathOptions={{
                                                fillColor: catColor.fill,
                                                fillOpacity: intensity * 0.14,
                                            }}
                                        />

                                        {/* Layer 2: Mid-level gradient ring */}
                                        <Circle
                                            center={[issue.latitude, issue.longitude]}
                                            radius={Math.round(radius * 0.65)}
                                            stroke={false}
                                            pathOptions={{
                                                fillColor: catColor.fill,
                                                fillOpacity: intensity * 0.30,
                                            }}
                                        />

                                        {/* Layer 3: Concentrated heat zone */}
                                        <Circle
                                            center={[issue.latitude, issue.longitude]}
                                            radius={Math.round(radius * 0.38)}
                                            stroke={false}
                                            pathOptions={{
                                                fillColor: catColor.fill,
                                                fillOpacity: intensity * 0.52,
                                            }}
                                        />

                                        {/* Layer 4: Deep epicenter core */}
                                        <Circle
                                            center={[issue.latitude, issue.longitude]}
                                            radius={Math.round(radius * 0.18)}
                                            stroke={false}
                                            pathOptions={{
                                                fillColor: catColor.fill,
                                                fillOpacity: intensity * 0.82,
                                            }}
                                        />
                                    </div>
                                );
                            })}

                        {/* 2. CLUSTER-LEVEL DENSITY HEATMAP OVERLAY (When in Hotspots Mode or high density) */}
                        {showHeatmaps &&
                            viewMode === "hotspots" &&
                            hotspots.map((hs) => {
                                const heatColor =
                                    hs.densityScore >= 0.7
                                        ? "#DC2626"
                                        : hs.densityScore >= 0.45
                                        ? "#EA580C"
                                        : "#F59E0B";

                                const baseOpacity = 0.22 + hs.densityScore * 0.63;
                                const R = hs.radiusMeters;

                                return (
                                    <div key={`hs-gradient-${hs.id}`}>
                                        <Circle
                                            center={[hs.latitude, hs.longitude]}
                                            radius={R}
                                            stroke={false}
                                            pathOptions={{
                                                fillColor: heatColor,
                                                fillOpacity: baseOpacity * 0.12,
                                            }}
                                        />
                                        <Circle
                                            center={[hs.latitude, hs.longitude]}
                                            radius={Math.round(R * 0.72)}
                                            stroke={false}
                                            pathOptions={{
                                                fillColor: heatColor,
                                                fillOpacity: baseOpacity * 0.24,
                                            }}
                                        />
                                        <Circle
                                            center={[hs.latitude, hs.longitude]}
                                            radius={Math.round(R * 0.48)}
                                            stroke={false}
                                            pathOptions={{
                                                fillColor: heatColor,
                                                fillOpacity: baseOpacity * 0.45,
                                            }}
                                        />
                                        <Circle
                                            center={[hs.latitude, hs.longitude]}
                                            radius={Math.round(R * 0.28)}
                                            stroke={false}
                                            pathOptions={{
                                                fillColor: heatColor,
                                                fillOpacity: baseOpacity * 0.70,
                                            }}
                                        />

                                        {/* Epicenter with interactive popup */}
                                        <Circle
                                            center={[hs.latitude, hs.longitude]}
                                            radius={Math.round(R * 0.14)}
                                            stroke={false}
                                            pathOptions={{
                                                fillColor: heatColor,
                                                fillOpacity: Math.min(0.95, baseOpacity * 0.95),
                                            }}
                                        >
                                            <Popup>
                                                <div className="w-60 p-1 space-y-2.5 font-sans">
                                                    <div className="flex items-center gap-1.5 pb-1 border-b border-[#F0F0F2]">
                                                        <Flame size={15} style={{ color: heatColor }} />
                                                        <span className="font-semibold text-xs text-[#1D1D1F]">
                                                            Civic Hotspot Area
                                                        </span>
                                                        <span
                                                            className="ml-auto text-[10px] px-1.5 py-0.2 rounded font-semibold text-white"
                                                            style={{ backgroundColor: heatColor }}
                                                        >
                                                            {hs.densityScore >= 0.7
                                                                ? "High Density"
                                                                : hs.densityScore >= 0.45
                                                                ? "Medium"
                                                                : "Developing"}
                                                        </span>
                                                    </div>

                                                    <div className="space-y-0.5">
                                                        <h4 className="font-bold text-sm text-[#1D1D1F]">
                                                            {hs.title}
                                                        </h4>
                                                        <p className="text-xs text-[#6E6E73]">
                                                            {hs.issueCount} issue{hs.issueCount > 1 ? "s" : ""} clustered within {Math.round(hs.radiusMeters)}m
                                                        </p>
                                                    </div>

                                                    <div className="grid grid-cols-2 gap-2 text-[11px] bg-[#F5F5F7] p-2 rounded-lg">
                                                        <div>
                                                            <span className="text-[#86868B] block text-[10px]">Peak Severity</span>
                                                            <span className="font-semibold text-[#C02820]">
                                                                {hs.highestSeverity}/10
                                                            </span>
                                                        </div>
                                                        <div>
                                                            <span className="text-[#86868B] block text-[10px]">Total Votes</span>
                                                            <span className="font-semibold text-[#1D1D1F]">
                                                                {hs.totalUpvotes} upvotes
                                                            </span>
                                                        </div>
                                                    </div>

                                                    {/* Issues in hotspot list with direct navigation links */}
                                                    <div className="space-y-1.5 max-h-36 overflow-y-auto pt-1">
                                                        <span className="text-[10px] font-semibold text-[#86868B] uppercase">
                                                            Included Reports:
                                                        </span>
                                                        {hs.issues.map((issue) => (
                                                            <Link
                                                                key={issue.id}
                                                                href={`/issues/${issue.id}`}
                                                                className="flex items-center justify-between text-xs py-1.5 px-1 rounded-md hover:bg-[#F5F5F7] transition-colors group"
                                                            >
                                                                <span className="text-[#1D1D1F] group-hover:text-[#007AFF] truncate pr-2 font-medium">
                                                                    {issue.ai_title || "Reported Issue"}
                                                                </span>
                                                                <span className="text-[10px] text-[#86868B] group-hover:text-[#007AFF] shrink-0 font-semibold flex items-center gap-0.5">
                                                                    <span>View</span>
                                                                    <ArrowRight size={10} />
                                                                </span>
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </div>
                                            </Popup>
                                        </Circle>
                                    </div>
                                );
                            })}

                        {/* 3. POLISHED APPLE & GOOGLE MAPS ISSUE PINS */}
                        {viewMode === "all" &&
                            filteredIssues.map((issue) => {
                                const catColor = getCategoryColor(issue.ai_category);
                                const radius = Math.min(13, 7 + Math.sqrt(issue.upvote_count) * 0.9);

                                return (
                                    <CircleMarker
                                        key={issue.id}
                                        center={[issue.latitude, issue.longitude]}
                                        pathOptions={{
                                            color: catColor.stroke,
                                            fillColor: catColor.fill,
                                            fillOpacity: 0.95,
                                            weight: 2,
                                        }}
                                        radius={radius}
                                    >
                                        <Popup>
                                            <div className="w-60 p-1 space-y-2.5 font-sans">
                                                {issue.image_url ? (
                                                    <div className="relative w-full h-28 bg-[#F5F5F7] rounded-lg overflow-hidden border border-[#E5E5EA]">
                                                        <Image
                                                            src={issue.image_url}
                                                            alt={issue.ai_title || "Civic Issue"}
                                                            fill
                                                            unoptimized
                                                            className="object-cover"
                                                            sizes="240px"
                                                        />
                                                    </div>
                                                ) : null}

                                                {/* Category & Read-Only Status */}
                                                <div className="flex items-center justify-between gap-1 text-[11px]">
                                                    <span
                                                        className="font-bold text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-md"
                                                        style={{
                                                            backgroundColor: catColor.badgeBg,
                                                            color: catColor.badgeText,
                                                        }}
                                                    >
                                                        {catColor.label}
                                                    </span>

                                                    {/* Purely Read-Only Status Badge */}
                                                    <span
                                                        className={`px-2 py-0.5 rounded-full font-medium text-[10px] capitalize ${
                                                            issue.status === "resolved"
                                                                ? "bg-[#EDF8F0] text-[#1D7D3B]"
                                                                : issue.status === "in_progress"
                                                                ? "bg-[#FDF5EB] text-[#9A5B00]"
                                                                : "bg-[#FDEDEC] text-[#C02820]"
                                                        }`}
                                                    >
                                                        {issue.status.replace("_", " ")}
                                                    </span>
                                                </div>

                                                <div className="space-y-1">
                                                    <h4 className="font-semibold text-xs text-[#1D1D1F] leading-snug line-clamp-2">
                                                        {issue.ai_title || "Reported Civic Issue"}
                                                    </h4>

                                                    {issue.ai_description && (
                                                        <p className="text-[11px] text-[#6E6E73] line-clamp-2 leading-relaxed">
                                                            {issue.ai_description}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Metrics */}
                                                <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#F0F0F2] text-[#86868B]">
                                                    <span>
                                                        <strong className="text-[#1D1D1F]">{issue.upvote_count}</strong> upvotes
                                                    </span>

                                                    {issue.ai_severity_score && (
                                                        <span>
                                                            Severity: <strong className="text-[#1D1D1F]">{issue.ai_severity_score}/10</strong>
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Actions Row: Go to this post/issue & Directions */}
                                                <div className="pt-2 border-t border-[#F0F0F2] flex items-center gap-2">
                                                    <Link
                                                        href={`/issues/${issue.id}`}
                                                        className="flex-1 inline-flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-lg bg-[#1D1D1F] hover:bg-[#333336] text-white text-xs font-semibold shadow-xs transition-colors"
                                                    >
                                                        <span>Go to this issue</span>
                                                        <ArrowRight size={13} />
                                                    </Link>

                                                    <a
                                                        href={`https://www.google.com/maps?q=${issue.latitude},${issue.longitude}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="p-1.5 rounded-lg border border-[#E5E5EA] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                                                        title="Open in Google Maps"
                                                    >
                                                        <ExternalLink size={13} />
                                                    </a>
                                                </div>
                                            </div>
                                        </Popup>
                                    </CircleMarker>
                                );
                            })}
                    </MapContainer>

                    {/* Bottom Status / Legend Bar inside Map */}
                    <div className="absolute bottom-4 left-4 right-4 z-1000 pointer-events-none flex items-center justify-between gap-2">
                        <div className="bg-white/95 backdrop-blur-md border border-[#E5E5EA] rounded-xl px-3 py-2 shadow-xs pointer-events-auto flex items-center gap-3 text-[11px] text-[#6E6E73]">
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#007AFF] border border-white" />
                                <span>Water</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#475569] border border-white" />
                                <span>Roads</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#10B981] border border-white" />
                                <span>Waste</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#F59E0B] border border-white" />
                                <span>Lights</span>
                            </div>
                            <div className="flex items-center gap-1.5">
                                <span className="w-2.5 h-2.5 rounded-full bg-[#EF4444] border border-white" />
                                <span>Hazards</span>
                            </div>
                        </div>

                        <div className="bg-white/95 backdrop-blur-md border border-[#E5E5EA] rounded-xl px-3 py-2 shadow-xs pointer-events-auto text-[11px] font-medium text-[#1D1D1F]">
                            {filteredIssues.length} active pins • {hotspots.length} hotspots
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
