"use client";

import { useState, useMemo } from "react";
import IssueCard, { Issue } from "./IssueCard";
import { Search, Plus, MapPin, Navigation, X, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";
import { getIpLocation } from "@/lib/location";

interface HomeFeedProps {
    issues: Issue[];
    userVotes: string[];
    userId: string;
}

const CATEGORIES = [
    "All",
    "Roads",
    "Streetlights",
    "Water",
    "Sanitation",
    "Safety",
];

// Major city coordinates presets
const CITY_PRESETS: { name: string; lat: number; lng: number }[] = [
    { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    { name: "Mumbai", lat: 19.0760, lng: 72.8777 },
    { name: "Delhi NCR", lat: 28.6139, lng: 77.2090 },
    { name: "Hyderabad", lat: 17.3850, lng: 78.4867 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
    { name: "New York", lat: 40.7128, lng: -74.0060 },
];

const RADIUS_OPTIONS = [
    { label: "All distances", value: 0 },
    { label: "Within 10 km", value: 10 },
    { label: "Within 20 km", value: 20 },
    { label: "Within 30 km", value: 30 },
    { label: "Within 50 km", value: 50 },
    { label: "Within 100 km", value: 100 },
];

// Distance calculation using Haversine formula (km)
function calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
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

export default function HomeFeed({ issues, userVotes, userId }: HomeFeedProps) {
    const [issueList, setIssueList] = useState<Issue[]>(issues);
    const [votedIds, setVotedIds] = useState<Set<string>>(new Set(userVotes));
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [searchQuery, setSearchQuery] = useState("");
    const [sortBy, setSortBy] = useState<"newest" | "upvotes" | "urgency" | "distance">("newest");
    const [statusFilter, setStatusFilter] = useState<"all" | "open" | "in_progress" | "resolved">("all");

    // Location & Radius Filtering State
    const [selectedCity, setSelectedCity] = useState<string>("all");
    const [userCoords, setUserCoords] = useState<{ lat: number; lng: number; name: string } | null>(null);
    const [radiusKm, setRadiusKm] = useState<number>(0); // 0 means all distances
    const [isLocating, setIsLocating] = useState<boolean>(false);
    const [showLocationPanel, setShowLocationPanel] = useState<boolean>(false);

    function handleVoteToggle(issueId: string, newCount: number, voted: boolean) {
        setIssueList((prev) =>
            prev.map((issue) =>
                issue.id === issueId
                    ? { ...issue, upvote_count: newCount }
                    : issue
            )
        );
        setVotedIds((prev) => {
            const next = new Set(prev);
            if (voted) {
                next.add(issueId);
            } else {
                next.delete(issueId);
            }
            return next;
        });
    }

    // Auto GPS Location Acquisition with IP Fallback
    async function handleDetectGps() {
        setIsLocating(true);

        if (typeof navigator !== "undefined" && navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    const lat = pos.coords.latitude;
                    const lng = pos.coords.longitude;
                    setUserCoords({
                        lat,
                        lng,
                        name: "My Real-Time Location",
                    });
                    setSelectedCity("gps");
                    if (radiusKm === 0) setRadiusKm(50); // Default to 50 km
                    setSortBy("distance");
                    setIsLocating(false);

                    if (pos.coords.accuracy > 1500) {
                        toast.info(`Coarse location (~${Math.round(pos.coords.accuracy / 1000)}km radius). Showing nearby issues.`);
                    } else {
                        toast.success("Location acquired! Showing nearby issues");
                    }
                },
                async () => {
                    // Browser GPS failed or was denied: try IP location
                    try {
                        const ipLoc = await getIpLocation();
                        if (ipLoc) {
                            setUserCoords({
                                lat: ipLoc.lat,
                                lng: ipLoc.lng,
                                name: ipLoc.cityName ? `Near ${ipLoc.cityName}` : "Network Location",
                            });
                            setSelectedCity("gps");
                            if (radiusKm === 0) setRadiusKm(50);
                            setSortBy("distance");
                            setIsLocating(false);
                            toast.info(`Located near ${ipLoc.cityName || "your network"}. Showing nearby issues.`);
                            return;
                        }
                    } catch {
                        // Ignore IP error
                    }

                    setIsLocating(false);
                    toast.error("Could not acquire location. You can select a city manually.");
                },
                { enableHighAccuracy: true, timeout: 8000, maximumAge: 0 }
            );
            return;
        }

        // If navigator.geolocation is not supported, attempt IP location
        try {
            const ipLoc = await getIpLocation();
            if (ipLoc) {
                setUserCoords({
                    lat: ipLoc.lat,
                    lng: ipLoc.lng,
                    name: ipLoc.cityName ? `Near ${ipLoc.cityName}` : "Network Location",
                });
                setSelectedCity("gps");
                if (radiusKm === 0) setRadiusKm(50);
                setSortBy("distance");
                setIsLocating(false);
                toast.info(`Located near ${ipLoc.cityName || "your network"}. Showing nearby issues.`);
                return;
            }
        } catch {
            // Ignore IP error
        }

        setIsLocating(false);
        toast.error("Geolocation not supported by your browser. Please select a city manually.");
    }

    // Handle Manual City Preset Change
    function handleCityChange(cityName: string) {
        setSelectedCity(cityName);
        if (cityName === "all") {
            setUserCoords(null);
            setRadiusKm(0);
            if (sortBy === "distance") setSortBy("newest");
        } else if (cityName === "gps") {
            handleDetectGps();
        } else {
            const found = CITY_PRESETS.find((c) => c.name === cityName);
            if (found) {
                setUserCoords({ lat: found.lat, lng: found.lng, name: found.name });
                if (radiusKm === 0) setRadiusKm(50); // Default to 50 km when city picked
                setSortBy("distance");
                toast.info(`Set location to ${found.name}`);
            }
        }
    }

    function clearLocationFilter() {
        setSelectedCity("all");
        setUserCoords(null);
        setRadiusKm(0);
        if (sortBy === "distance") setSortBy("newest");
    }

    // Filter and Sort Pipeline
    const filteredIssues = useMemo(() => {
        return issueList
            .map((issue) => {
                // Compute distance if location is active
                let distance: number | undefined = undefined;
                if (userCoords && typeof issue.latitude === "number" && typeof issue.longitude === "number") {
                    distance = calculateDistanceKm(
                        userCoords.lat,
                        userCoords.lng,
                        issue.latitude,
                        issue.longitude
                    );
                }
                return { ...issue, distanceKm: distance };
            })
            .filter((issue) => {
                // Category Filter
                if (selectedCategory !== "All") {
                    const catLower = (issue.ai_category || "").toLowerCase();
                    const filterLower = selectedCategory.toLowerCase();
                    if (!catLower.includes(filterLower)) {
                        return false;
                    }
                }

                // Status Filter
                if (statusFilter !== "all" && issue.status !== statusFilter) {
                    return false;
                }

                // Search Query Filter
                if (searchQuery.trim()) {
                    const q = searchQuery.toLowerCase();
                    const titleMatch = (issue.ai_title || "").toLowerCase().includes(q);
                    const descMatch = (issue.ai_description || "").toLowerCase().includes(q);
                    const catMatch = (issue.ai_category || "").toLowerCase().includes(q);
                    if (!titleMatch && !descMatch && !catMatch) return false;
                }

                // Distance / Radius Filter
                if (radiusKm > 0 && userCoords) {
                    if (issue.distanceKm === undefined || issue.distanceKm > radiusKm) {
                        return false;
                    }
                }

                return true;
            })
            .sort((a, b) => {
                if (sortBy === "distance") {
                    const distA = a.distanceKm ?? Infinity;
                    const distB = b.distanceKm ?? Infinity;
                    return distA - distB;
                }
                if (sortBy === "urgency") {
                    const urgencyA = (a.ai_severity_score || 0) * 10 + a.upvote_count;
                    const urgencyB = (b.ai_severity_score || 0) * 10 + b.upvote_count;
                    return urgencyB - urgencyA;
                }
                if (sortBy === "upvotes") {
                    return b.upvote_count - a.upvote_count;
                }
                return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
            });
    }, [issueList, selectedCategory, statusFilter, searchQuery, sortBy, userCoords, radiusKm]);

    // Metric Calculations (Total, In Progress, Resolved)
    const stats = useMemo(() => {
        const total = issueList.length;
        const resolved = issueList.filter((i) => i.status === "resolved").length;
        const inProgress = issueList.filter((i) => i.status === "in_progress").length;
        return { total, resolved, inProgress };
    }, [issueList]);

    return (
        <section className="space-y-6">
            {/* Minimal Stat Tiles (3 Tiles — Community Upvotes element removed as requested) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="bg-white border border-[#E5E5EA] rounded-xl p-4 shadow-xs">
                    <div className="text-xs text-[#86868B] font-medium">Total Reported Issues</div>
                    <div className="text-2xl font-semibold text-[#1D1D1F] mt-1">{stats.total}</div>
                </div>

                <div className="bg-white border border-[#E5E5EA] rounded-xl p-4 shadow-xs">
                    <div className="text-xs text-[#86868B] font-medium">In Progress</div>
                    <div className="text-2xl font-semibold text-[#9A5B00] mt-1">{stats.inProgress}</div>
                </div>

                <div className="bg-white border border-[#E5E5EA] rounded-xl p-4 shadow-xs">
                    <div className="text-xs text-[#86868B] font-medium">Resolved by City</div>
                    <div className="text-2xl font-semibold text-[#1D7D3B] mt-1">{stats.resolved}</div>
                </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-3 sm:p-4 shadow-xs space-y-3">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    {/* Search */}
                    <div className="relative flex-1">
                        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#86868B] pointer-events-none" />
                        <input
                            type="text"
                            placeholder="Search issues by title, category, or description..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-9 pr-3 py-1.5 bg-[#F5F5F7] border border-transparent focus:border-[#D1D1D6] focus:bg-white rounded-lg text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none transition-all"
                        />
                    </div>

                    {/* Status & Sort Dropdowns + Radius Filter Toggle */}
                    <div className="flex items-center gap-2 flex-wrap">
                        <button
                            type="button"
                            onClick={() => setShowLocationPanel(!showLocationPanel)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                userCoords && radiusKm > 0
                                    ? "bg-[#EBF5FF] border-[#B9E6FE] text-[#007AFF]"
                                    : "bg-[#F5F5F7] border-transparent text-[#1D1D1F] hover:bg-[#E8E8ED]"
                            }`}
                        >
                            <SlidersHorizontal size={13} />
                            <span>
                                {userCoords && radiusKm > 0
                                    ? `${radiusKm} km from ${userCoords.name}`
                                    : "Distance Filter"}
                            </span>
                        </button>

                        <select
                            value={statusFilter}
                            onChange={(e) =>
                                setStatusFilter(
                                    e.target.value as "all" | "open" | "in_progress" | "resolved"
                                )
                            }
                            aria-label="Filter by issue status"
                            className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#EEEEF0] rounded-lg text-xs font-medium text-[#1D1D1F] border border-transparent focus:border-[#D1D1D6] focus:outline-none cursor-pointer"
                        >
                            <option value="all">All statuses</option>
                            <option value="open">Open</option>
                            <option value="in_progress">In progress</option>
                            <option value="resolved">Resolved</option>
                        </select>

                        <select
                            value={sortBy}
                            onChange={(e) =>
                                setSortBy(e.target.value as "newest" | "upvotes" | "urgency" | "distance")
                            }
                            aria-label="Sort issues"
                            className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#EEEEF0] rounded-lg text-xs font-medium text-[#1D1D1F] border border-transparent focus:border-[#D1D1D6] focus:outline-none cursor-pointer"
                        >
                            <option value="newest">Most recent</option>
                            {userCoords && <option value="distance">Closest to me</option>}
                            <option value="upvotes">Most upvoted</option>
                            <option value="urgency">Highest severity</option>
                        </select>
                    </div>
                </div>

                {/* Interactive Distance & Location Filter Panel */}
                {showLocationPanel && (
                    <div className="p-3.5 bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl space-y-3 animate-in fade-in duration-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                            <div className="space-y-0.5">
                                <span className="text-xs font-bold text-[#1D1D1F] flex items-center gap-1.5">
                                    <MapPin size={14} className="text-[#007AFF]" />
                                    <span>Geographic Distance & Radius Filter</span>
                                </span>
                                <p className="text-[11px] text-[#6E6E73]">
                                    Only show issues within a customized kilometer radius of your chosen city or automatic GPS.
                                </p>
                            </div>

                            {userCoords && (
                                <button
                                    onClick={clearLocationFilter}
                                    className="text-xs font-medium text-[#C02820] hover:underline self-start sm:self-auto flex items-center gap-1 cursor-pointer"
                                >
                                    <X size={12} />
                                    <span>Clear distance filter</span>
                                </button>
                            )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                            {/* Option 1: Auto GPS */}
                            <button
                                type="button"
                                onClick={handleDetectGps}
                                disabled={isLocating}
                                className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                                    selectedCity === "gps"
                                        ? "bg-[#1D1D1F] text-white border-[#1D1D1F]"
                                        : "bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border-[#E5E5EA]"
                                } disabled:opacity-50`}
                            >
                                <Navigation size={13} className={isLocating ? "animate-spin" : ""} />
                                <span>{isLocating ? "Detecting GPS..." : "Use My GPS Location"}</span>
                            </button>

                            {/* Option 2: Choose City Presets */}
                            <select
                                value={selectedCity === "gps" ? "" : selectedCity}
                                onChange={(e) => handleCityChange(e.target.value)}
                                className="px-3 py-2 bg-white rounded-lg text-xs font-semibold text-[#1D1D1F] border border-[#E5E5EA] focus:outline-none focus:border-[#007AFF] cursor-pointer"
                            >
                                <option value="all">Choose City (e.g. Bengaluru)...</option>
                                {CITY_PRESETS.map((city) => (
                                    <option key={city.name} value={city.name}>
                                        {city.name}
                                    </option>
                                ))}
                            </select>

                            {/* Option 3: Radius Selector */}
                            <select
                                value={radiusKm}
                                onChange={(e) => setRadiusKm(Number(e.target.value))}
                                disabled={!userCoords}
                                className="px-3 py-2 bg-white rounded-lg text-xs font-semibold text-[#1D1D1F] border border-[#E5E5EA] focus:outline-none focus:border-[#007AFF] cursor-pointer disabled:opacity-50"
                            >
                                {RADIUS_OPTIONS.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        {opt.label}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Active Filter Indicator Badge */}
                        {userCoords && (
                            <div className="flex items-center justify-between text-xs pt-2 border-t border-[#F0F0F2] text-[#48484A]">
                                <span>
                                    Target Center: <strong>{userCoords.name}</strong> ({userCoords.lat.toFixed(3)}, {userCoords.lng.toFixed(3)})
                                </span>
                                <span className="font-semibold text-[#007AFF]">
                                    {radiusKm > 0 ? `Max radius: ${radiusKm} km` : "All distances"}
                                </span>
                            </div>
                        )}
                    </div>
                )}

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                    {CATEGORIES.map((cat) => {
                        const isSelected = selectedCategory === cat;
                        return (
                            <button
                                key={cat}
                                onClick={() => setSelectedCategory(cat)}
                                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors cursor-pointer ${
                                    isSelected
                                        ? "bg-[#1D1D1F] text-white"
                                        : "bg-[#F5F5F7] text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#E8E8ED]"
                                }`}
                            >
                                {cat}
                            </button>
                        );
                    })}
                </div>
            </div>

            {/* Active Distance Filter Pill Bar */}
            {userCoords && radiusKm > 0 && (
                <div className="flex items-center justify-between bg-[#EBF5FF] border border-[#B9E6FE] px-3.5 py-2 rounded-xl text-xs text-[#007AFF]">
                    <span className="font-semibold flex items-center gap-1.5">
                        <MapPin size={13} />
                        <span>Showing issues within {radiusKm} km of {userCoords.name} ({filteredIssues.length} found)</span>
                    </span>
                    <button
                        onClick={clearLocationFilter}
                        className="hover:underline text-[11px] font-bold text-[#0055B3] cursor-pointer"
                    >
                        Reset distance filter
                    </button>
                </div>
            )}

            {/* Grid of Issue Cards */}
            {filteredIssues.length === 0 ? (
                <div className="bg-white border border-[#E5E5EA] rounded-2xl p-12 text-center space-y-3 shadow-xs">
                    <div className="w-12 h-12 rounded-full bg-[#F5F5F7] text-[#86868B] flex items-center justify-center mx-auto">
                        <MapPin size={22} />
                    </div>
                    <h3 className="font-semibold text-base text-[#1D1D1F]">
                        No issues found in this area
                    </h3>
                    <p className="text-xs text-[#86868B] max-w-sm mx-auto leading-relaxed">
                        {userCoords && radiusKm > 0
                            ? `There are currently no civic issues reported within ${radiusKm} km of ${userCoords.name}. Try selecting a larger radius (e.g. 50 km or 100 km) or clear the distance filter.`
                            : "No civic issues match your current filters. Try changing your search query or submit a new report."}
                    </p>
                    <div className="pt-2 flex items-center justify-center gap-2">
                        {userCoords && radiusKm > 0 && (
                            <button
                                onClick={clearLocationFilter}
                                className="inline-flex items-center gap-1 px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-xs font-semibold transition-colors cursor-pointer"
                            >
                                <span>Show all locations</span>
                            </button>
                        )}
                        <Link
                            href="/report"
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] text-white text-xs font-semibold hover:bg-[#333336] transition-colors"
                        >
                            <Plus size={14} />
                            <span>Report an Issue</span>
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                    {filteredIssues.map((issue) => (
                        <IssueCard
                            key={issue.id}
                            issue={issue}
                            isVoted={votedIds.has(issue.id)}
                            userId={userId}
                            distanceKm={issue.distanceKm}
                            onVoteToggle={handleVoteToggle}
                        />
                    ))}
                </div>
            )}
        </section>
    );
}
