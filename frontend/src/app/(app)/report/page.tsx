"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import dynamic from "next/dynamic";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Camera,
    ImagePlus,
    X,
    MapPin,
    Navigation,
    Search,
    RefreshCw,
    Check,
    ChevronDown,
    ChevronUp,
    Sliders,
} from "lucide-react";
import Image from "next/image";
import { extractExifGps, getIpLocation } from "@/lib/location";

// Dynamically import Leaflet Map Picker to prevent SSR errors
const LocationPickerMap = dynamic(
    () => import("@/components/map/LocationPickerMap"),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-56 rounded-xl bg-[#F5F5F7] animate-pulse flex items-center justify-center text-xs text-[#86868B]">
                Loading interactive map...
            </div>
        ),
    }
);

interface AnalysisResult {
    is_civic_issue: boolean;
    category: string;
    severity_score: number;
    title: string;
    description: string;
}

type Step = "upload" | "analyzing" | "confirm";

const CITY_PRESETS = [
    { name: "Bengaluru", lat: 12.9716, lng: 77.5946 },
    { name: "Mumbai", lat: 19.076, lng: 72.8777 },
    { name: "Delhi NCR", lat: 28.6139, lng: 77.209 },
    { name: "Hyderabad", lat: 17.385, lng: 78.4867 },
    { name: "Chennai", lat: 13.0827, lng: 80.2707 },
    { name: "Pune", lat: 18.5204, lng: 73.8567 },
    { name: "Kolkata", lat: 22.5726, lng: 88.3639 },
];

export default function ReportPage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const galleryInputRef = useRef<HTMLInputElement>(null);

    // Flow State
    const [step, setStep] = useState<Step>("upload");
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Location State
    const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
    const coordsRef = useRef<{ lat: number; lng: number } | null>(null);
    coordsRef.current = coords;

    const [locationAddress, setLocationAddress] = useState<string>("");
    const [locationSource, setLocationSource] = useState<"exif" | "gps" | "ip" | "manual" | "preset">("gps");
    const [isDetectingLocation, setIsDetectingLocation] = useState(false);
    const [showManualPicker, setShowManualPicker] = useState(false);

    // Search query within manual picker
    const [searchQuery, setSearchQuery] = useState("");
    const [isSearchingLocation, setIsSearchingLocation] = useState(false);
    const [searchResults, setSearchResults] = useState<Array<{ display_name: string; lat: string; lon: string }>>([]);

    // Editable fields from AI analysis
    const [editTitle, setEditTitle] = useState("");
    const [editDesc, setEditDesc] = useState("");
    const [editCategory, setEditCategory] = useState("Roads");
    const [editSeverity, setEditSeverity] = useState(5);

    /* ── Reverse Geocode Coordinates to Human Address ──────── */
    const reverseGeocode = useCallback(async (lat: number, lng: number) => {
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&zoom=17`,
                { headers: { "Accept-Language": "en" } }
            );
            if (res.ok) {
                const data = await res.json();
                if (data.display_name) {
                    const parts = data.display_name.split(", ");
                    const clean = parts.slice(0, 3).join(", ");
                    setLocationAddress(clean || data.display_name);
                    return;
                }
            }
        } catch {
            // Geocoding failure non-fatal
        }
        setLocationAddress(`${lat.toFixed(4)}°, ${lng.toFixed(4)}°`);
    }, []);

    /* ── Robust Multi-Stage Geolocation Acquisition ───────── */
    const acquireLocation = useCallback(
        async (isManualTrigger = false) => {
            setIsDetectingLocation(true);

            const tryPosition = (options: PositionOptions): Promise<GeolocationPosition> =>
                new Promise((resolve, reject) => {
                    navigator.geolocation.getCurrentPosition(resolve, reject, options);
                });

            // If browser supports Geolocation, attempt GPS / Wi-Fi positioning
            if (typeof navigator !== "undefined" && navigator.geolocation) {
                try {
                    // Stage 1: Try high accuracy (satellite / mobile GPS / Wi-Fi scanning)
                    // maximumAge: 0 forces fresh real-time coordinates, bypassing cached Windows location
                    const pos = await tryPosition({
                        enableHighAccuracy: true,
                        timeout: 7000,
                        maximumAge: 0,
                    });
                    const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                    setCoords(loc);
                    setLocationSource("gps");
                    reverseGeocode(loc.lat, loc.lng);

                    // Check accuracy: if > 1500 meters, it's likely a Windows desktop default / coarse estimate
                    if (pos.coords.accuracy > 1500) {
                        toast.info(
                            `Coarse location (~${Math.round(pos.coords.accuracy / 1000)}km radius). You can adjust the pin on the map.`
                        );
                    } else if (isManualTrigger) {
                        toast.success("Precise GPS location acquired");
                    }
                    setIsDetectingLocation(false);
                    return;
                } catch {
                    try {
                        // Stage 2: Fallback to standard/network accuracy
                        const pos = await tryPosition({
                            enableHighAccuracy: false,
                            timeout: 6000,
                            maximumAge: 0,
                        });
                        const loc = { lat: pos.coords.latitude, lng: pos.coords.longitude };
                        setCoords(loc);
                        setLocationSource("gps");
                        reverseGeocode(loc.lat, loc.lng);

                        if (pos.coords.accuracy > 2000) {
                            toast.info("Approximate location captured. You can adjust the pin on the map.");
                        } else if (isManualTrigger) {
                            toast.success("Location acquired");
                        }
                        setIsDetectingLocation(false);
                        return;
                    } catch {
                        // Geolocation failed or user denied permission
                    }
                }
            } else if (isManualTrigger) {
                toast.error("Geolocation is not supported by your browser");
            }

            // Stage 3: IP-Based Geolocation Fallback
            // If GPS is blocked or desktop lacks Wi-Fi triangulation, estimate from public IP
            try {
                const ipLoc = await getIpLocation();
                if (ipLoc) {
                    setCoords({ lat: ipLoc.lat, lng: ipLoc.lng });
                    setLocationSource("ip");
                    reverseGeocode(ipLoc.lat, ipLoc.lng);
                    if (isManualTrigger) {
                        toast.info(`Located near ${ipLoc.cityName || "your network"}. Adjust pin on map if needed.`);
                    }
                    setIsDetectingLocation(false);
                    return;
                }
            } catch {
                // Ignore IP failure
            }

            // Stage 4: Preset fallback if no previous coords exist
            if (isManualTrigger) {
                toast.error("Could not capture GPS. Select your city or adjust manually.");
            }
            if (!coordsRef.current) {
                const fallback = CITY_PRESETS[0]; // Bengaluru
                setCoords({ lat: fallback.lat, lng: fallback.lng });
                setLocationSource("preset");
                reverseGeocode(fallback.lat, fallback.lng);
            }
            setIsDetectingLocation(false);
        },
        [reverseGeocode]
    );

    // Proactively acquire location once when entering page
    useEffect(() => {
        acquireLocation(false);
    }, [acquireLocation]);

    /* ── Manual Location Search ────────────────────────────── */
    async function handleAddressSearch(e?: React.FormEvent) {
        if (e) e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsSearchingLocation(true);
        try {
            const res = await fetch(
                `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
                    searchQuery
                )}&limit=5`,
                { headers: { "Accept-Language": "en" } }
            );
            if (res.ok) {
                const data = await res.json();
                setSearchResults(data);
                if (data.length === 0) {
                    toast.info("No matching locations found. Try another city or neighborhood.");
                }
            }
        } catch {
            toast.error("Location search timed out. Try again.");
        } finally {
            setIsSearchingLocation(false);
        }
    }

    function selectSearchedLocation(item: { display_name: string; lat: string; lon: string }) {
        const lat = parseFloat(item.lat);
        const lng = parseFloat(item.lon);
        setCoords({ lat, lng });
        const parts = item.display_name.split(", ");
        setLocationAddress(parts.slice(0, 3).join(", "));
        setLocationSource("manual");
        setSearchResults([]);
        setSearchQuery("");
        toast.success("Location updated");
    }

    function selectPresetCity(city: (typeof CITY_PRESETS)[0]) {
        setCoords({ lat: city.lat, lng: city.lng });
        setLocationAddress(city.name);
        setLocationSource("preset");
        toast.success(`Location set to ${city.name}`);
    }

    function handleMapPinChange(newCoords: { lat: number; lng: number }) {
        setCoords(newCoords);
        setLocationSource("manual");
        reverseGeocode(newCoords.lat, newCoords.lng);
    }

    /* ── Handle Image Selection ──────────────────────────── */
    async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;

        const url = URL.createObjectURL(file);
        setSelectedFile(file);
        setPreviewUrl(url);

        // 1. Prioritize real satellite GPS extracted directly from photo EXIF metadata
        let hasExifLocation = false;
        try {
            const exifCoords = await extractExifGps(file);
            if (exifCoords) {
                setCoords({ lat: exifCoords.lat, lng: exifCoords.lng });
                setLocationSource("exif");
                reverseGeocode(exifCoords.lat, exifCoords.lng);
                toast.success("Real-time GPS extracted from photo metadata!");
                hasExifLocation = true;
            }
        } catch {
            // Non-fatal if EXIF is absent
        }

        // 2. Fall back to device/network geolocation if photo has no embedded GPS
        if (!hasExifLocation && !coordsRef.current) {
            acquireLocation(false);
        }

        setStep("analyzing");
        await runAnalysis(file);
    }

    /* ── Image Analysis with Graceful Fallback ────────────── */
    async function runAnalysis(file: File) {
        try {
            const formData = new FormData();
            formData.append("file", file);

            const apiUrl = process.env.NEXT_PUBLIC_API_URL || "";
            const res = await fetch(`${apiUrl}/api/analyze-issue/`, {
                method: "POST",
                body: formData,
            });

            if (!res.ok) {
                throw new Error("Local analysis service unavailable");
            }

            const data: AnalysisResult = await res.json();

            if (!data.is_civic_issue) {
                toast.error("No civic issue detected. Please provide an infrastructure photo.");
                resetForm();
                return;
            }

            setAnalysis(data);
            setEditTitle(data.title);
            setEditDesc(data.description);
            setEditCategory(data.category);
            setEditSeverity(data.severity_score);
            setStep("confirm");
        } catch {
            // Graceful diagnostic fallback: allow user to inspect and edit details directly
            const fallbackResult: AnalysisResult = {
                is_civic_issue: true,
                category: "Roads",
                severity_score: 6,
                title: "Reported Infrastructure Issue",
                description: "Civic issue recorded for municipal triage and inspection.",
            };

            setAnalysis(fallbackResult);
            setEditTitle(fallbackResult.title);
            setEditDesc(fallbackResult.description);
            setEditCategory(fallbackResult.category);
            setEditSeverity(fallbackResult.severity_score);
            setStep("confirm");
        }
    }

    /* ── Final Submit Handler ────────────────────────────── */
    async function handleFinalSubmit() {
        if (!selectedFile) return;

        if (!coords) {
            toast.error("Please pick or detect a location for this issue.");
            return;
        }

        setIsSubmitting(true);

        try {
            const supabase = createClient();
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                toast.error("Please sign in to submit a report");
                setIsSubmitting(false);
                return;
            }

            const fileExt = selectedFile.name.split(".").pop() || "jpg";
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from("issues-images")
                .upload(fileName, selectedFile, {
                    contentType: selectedFile.type,
                    upsert: false,
                });

            let finalImageUrl = previewUrl;

            if (!uploadError) {
                const {
                    data: { publicUrl },
                } = supabase.storage.from("issues-images").getPublicUrl(fileName);
                finalImageUrl = publicUrl;
            }

            const { error: insertError } = await supabase.from("issues").insert({
                user_id: user.id,
                image_url: finalImageUrl,
                ai_title: editTitle.trim() || "Reported Civic Issue",
                ai_description: editDesc.trim(),
                ai_category: editCategory,
                ai_severity_score: editSeverity,
                latitude: coords.lat,
                longitude: coords.lng,
                status: "open",
            });

            if (insertError) {
                throw new Error(`Database error: ${insertError.message}`);
            }

            toast.success("Issue submitted successfully!");
            router.push("/my-reports");
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Submission failed";
            toast.error(message);
        }

        setIsSubmitting(false);
    }

    function resetForm() {
        setStep("upload");
        setSelectedFile(null);
        setPreviewUrl(null);
        setAnalysis(null);
        setEditTitle("");
        setEditDesc("");
        setEditCategory("Roads");
        setEditSeverity(5);
        setShowManualPicker(false);
        setSearchResults([]);
        if (fileInputRef.current) fileInputRef.current.value = "";
        if (galleryInputRef.current) galleryInputRef.current.value = "";
    }

    return (
        <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                    Report an issue
                </h1>
                <p className="text-sm text-[#6E6E73]">
                    Snap a photo to automatically categorize the issue and pinpoint its exact location.
                </p>
            </div>

            {/* Step 1: Upload */}
            {step === "upload" && (
                <div className="apple-card p-6 space-y-4">
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        onChange={handleFileChange}
                        className="hidden"
                        id="camera-capture"
                    />
                    <input
                        ref={galleryInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="gallery-upload"
                    />

                    {/* Camera Capture Box */}
                    <div
                        onClick={() => fileInputRef.current?.click()}
                        className="aspect-[4/3] rounded-xl border border-dashed border-[#D1D1D6] hover:border-[#1D1D1F] bg-[#F5F5F7] hover:bg-[#EFEFF2] transition-colors flex flex-col items-center justify-center gap-3 cursor-pointer p-6 text-center"
                    >
                        <div className="w-12 h-12 rounded-full bg-white shadow-sm flex items-center justify-center text-[#1D1D1F]">
                            <Camera size={22} strokeWidth={2} />
                        </div>
                        <div className="space-y-0.5">
                            <p className="font-semibold text-sm text-[#1D1D1F]">
                                Take a photo
                            </p>
                            <p className="text-xs text-[#86868B]">
                                Position the infrastructure issue clearly in the frame
                            </p>
                        </div>
                    </div>

                    {/* Choose from gallery button */}
                    <button
                        type="button"
                        onClick={() => galleryInputRef.current?.click()}
                        className="w-full py-2.5 px-4 rounded-xl bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] text-[#1D1D1F] text-xs sm:text-sm font-medium transition-colors flex items-center justify-center gap-2 cursor-pointer"
                    >
                        <ImagePlus size={16} className="text-[#86868B]" />
                        <span>Choose from photo library</span>
                    </button>

                    {/* Location status preview */}
                    <div className="pt-2 flex items-center justify-between text-xs text-[#86868B] border-t border-[#F0F0F2]">
                        <div className="flex items-center gap-1.5">
                            <MapPin size={13} className="text-[#0071E3]" />
                            <span>
                                {isDetectingLocation
                                    ? "Acquiring GPS location..."
                                    : coords
                                    ? `Location: ${locationAddress || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}`
                                    : "Location ready to capture"}
                            </span>
                        </div>
                        <button
                            type="button"
                            onClick={() => acquireLocation(true)}
                            disabled={isDetectingLocation}
                            className="text-[#0071E3] hover:underline flex items-center gap-1 font-medium cursor-pointer"
                        >
                            <RefreshCw size={11} className={isDetectingLocation ? "animate-spin" : ""} />
                            <span>Refresh</span>
                        </button>
                    </div>
                </div>
            )}

            {/* Step 2: Analyzing */}
            {step === "analyzing" && previewUrl && (
                <div className="apple-card p-6 space-y-5">
                    <div className="relative aspect-[16/10] rounded-xl overflow-hidden bg-[#F5F5F7]">
                        <Image
                            src={previewUrl}
                            alt="Analyzing issue"
                            fill
                            className="object-cover"
                        />
                    </div>

                    <div className="flex items-center gap-3 p-4 bg-[#F5F5F7] rounded-xl">
                        <div className="w-6 h-6 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin shrink-0" />
                        <div className="space-y-0.5">
                            <p className="text-sm font-semibold text-[#1D1D1F]">
                                Analyzing photo with AI...
                            </p>
                            <p className="text-xs text-[#86868B]">
                                Classifying category, evaluating severity, and pinning coordinates
                            </p>
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={resetForm}
                        className="w-full py-2 text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                    >
                        Cancel
                    </button>
                </div>
            )}

            {/* Step 3: Confirmation */}
            {step === "confirm" && previewUrl && analysis && (
                <div className="apple-card p-6 space-y-6">
                    {/* Media Preview */}
                    <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-[#F5F5F7]">
                        <Image
                            src={previewUrl}
                            alt="Issue confirmation"
                            fill
                            className="object-cover"
                        />

                        <button
                            type="button"
                            onClick={resetForm}
                            title="Discard and restart"
                            className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/90 hover:bg-white shadow-sm flex items-center justify-center text-[#1D1D1F] transition-colors cursor-pointer"
                        >
                            <X size={14} />
                        </button>

                        {coords && (
                            <div className="absolute bottom-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-[11px] font-medium text-[#1D1D1F] flex items-center gap-1.5 shadow-sm">
                                <span
                                    className={`w-2 h-2 rounded-full ${
                                        locationSource === "exif" || locationSource === "gps"
                                            ? "bg-emerald-500"
                                            : locationSource === "ip"
                                            ? "bg-amber-500"
                                            : "bg-blue-500"
                                    }`}
                                />
                                <span className="font-semibold truncate max-w-[200px]">
                                    {locationAddress || `${coords.lat.toFixed(4)}, ${coords.lng.toFixed(4)}`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* ── Location Capture & Manual Override Section ── */}
                    <div className="p-4 rounded-xl bg-[#F5F5F7] border border-[#E5E5EA] space-y-3">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <MapPin size={16} className="text-[#0071E3]" />
                                <span className="text-xs font-semibold text-[#1D1D1F]">
                                    Issue Location
                                </span>
                                <span
                                    className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${
                                        locationSource === "exif"
                                            ? "bg-purple-100 text-purple-800"
                                            : locationSource === "gps"
                                            ? "bg-emerald-100 text-emerald-800"
                                            : locationSource === "ip"
                                            ? "bg-amber-100 text-amber-800"
                                            : locationSource === "preset"
                                            ? "bg-slate-100 text-slate-800"
                                            : "bg-blue-100 text-blue-800"
                                    }`}
                                >
                                    {locationSource === "exif"
                                        ? "Photo GPS"
                                        : locationSource === "gps"
                                        ? "Device GPS"
                                        : locationSource === "ip"
                                        ? "Network/IP"
                                        : locationSource === "preset"
                                        ? "Preset City"
                                        : "Manual Pin"}
                                </span>
                            </div>

                            <div className="flex items-center gap-1.5">
                                <button
                                    type="button"
                                    onClick={() => acquireLocation(true)}
                                    disabled={isDetectingLocation}
                                    title="Auto-detect current GPS"
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFEFF2] text-[#1D1D1F] text-xs font-medium border border-[#E5E5EA] flex items-center gap-1 transition-colors cursor-pointer disabled:opacity-50"
                                >
                                    <Navigation size={12} className={isDetectingLocation ? "animate-spin text-[#0071E3]" : ""} />
                                    <span>{isDetectingLocation ? "Locating..." : "Auto GPS"}</span>
                                </button>

                                <button
                                    type="button"
                                    onClick={() => setShowManualPicker((prev) => !prev)}
                                    className="px-2.5 py-1 rounded-lg bg-white hover:bg-[#EFEFF2] text-[#1D1D1F] text-xs font-medium border border-[#E5E5EA] flex items-center gap-1 transition-colors cursor-pointer"
                                >
                                    <Sliders size={12} />
                                    <span>{showManualPicker ? "Close Map" : "Change"}</span>
                                    {showManualPicker ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                                </button>
                            </div>
                        </div>

                        {/* Location Description */}
                        <div className="text-xs text-[#48484A] font-medium bg-white/70 px-3 py-2 rounded-lg border border-[#E5E5EA]/50 flex items-center justify-between">
                            <div className="truncate mr-2">
                                <span className="text-[#86868B]">Address: </span>
                                <span>{locationAddress || "Locating coordinates..."}</span>
                            </div>
                            {coords && (
                                <span className="font-mono text-[10px] text-[#86868B] shrink-0">
                                    {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
                                </span>
                            )}
                        </div>

                        {/* Expanded Manual Location Controller */}
                        {showManualPicker && (
                            <div className="pt-3 border-t border-[#E5E5EA] space-y-3">
                                {/* City Presets */}
                                <div>
                                    <p className="text-[11px] font-semibold text-[#86868B] mb-1.5">
                                        Quick City Presets
                                    </p>
                                    <div className="flex flex-wrap gap-1.5">
                                        {CITY_PRESETS.map((city) => (
                                            <button
                                                key={city.name}
                                                type="button"
                                                onClick={() => selectPresetCity(city)}
                                                className="px-2.5 py-1 rounded-lg text-xs font-medium bg-white hover:bg-[#E8E8ED] border border-[#E5E5EA] text-[#1D1D1F] transition-colors cursor-pointer"
                                            >
                                                {city.name}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                {/* Address Search */}
                                <div>
                                    <p className="text-[11px] font-semibold text-[#86868B] mb-1.5">
                                        Search Landmark or Street
                                    </p>
                                    <form onSubmit={handleAddressSearch} className="flex gap-2">
                                        <div className="relative flex-1">
                                            <Search
                                                size={14}
                                                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[#86868B]"
                                            />
                                            <input
                                                type="text"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                placeholder="e.g., MG Road, Indiranagar, Whitefield..."
                                                className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#D1D1D6] rounded-lg text-xs text-[#1D1D1F] focus:outline-none focus:border-[#1D1D1F]"
                                            />
                                        </div>
                                        <button
                                            type="submit"
                                            disabled={isSearchingLocation}
                                            className="px-3 py-1.5 bg-[#1D1D1F] text-white text-xs font-medium rounded-lg hover:bg-[#333336] transition-colors cursor-pointer disabled:opacity-50 shrink-0"
                                        >
                                            {isSearchingLocation ? "Searching..." : "Search"}
                                        </button>
                                    </form>

                                    {/* Search Results Dropdown */}
                                    {searchResults.length > 0 && (
                                        <div className="mt-2 bg-white rounded-lg border border-[#E5E5EA] shadow-sm divide-y divide-[#F0F0F2] max-h-40 overflow-y-auto">
                                            {searchResults.map((item, idx) => (
                                                <div
                                                    key={idx}
                                                    onClick={() => selectSearchedLocation(item)}
                                                    className="px-3 py-2 text-xs text-[#1D1D1F] hover:bg-[#F5F5F7] cursor-pointer flex items-center justify-between"
                                                >
                                                    <span className="truncate pr-2">{item.display_name}</span>
                                                    <Check size={12} className="text-[#0071E3] shrink-0" />
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {/* Leaflet Interactive Map Pin Picker */}
                                <div>
                                    <p className="text-[11px] font-semibold text-[#86868B] mb-1.5">
                                        Adjust Pin on Map (Drag or click to reposition)
                                    </p>
                                    {coords && (
                                        <LocationPickerMap
                                            coords={coords}
                                            onChange={handleMapPinChange}
                                        />
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Form Fields */}
                    <div className="space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#1D1D1F]">
                                Issue title
                            </label>
                            <input
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                className="w-full px-3.5 py-2 bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#D1D1D6] rounded-lg text-sm text-[#1D1D1F] focus:outline-none transition-colors"
                            />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-semibold text-[#1D1D1F]">
                                    Category
                                </label>
                                <select
                                    value={editCategory}
                                    onChange={(e) => setEditCategory(e.target.value)}
                                    className="w-full px-3.5 py-2 bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#D1D1D6] rounded-lg text-sm text-[#1D1D1F] focus:outline-none transition-colors cursor-pointer"
                                >
                                    <option value="Roads">Roads & Potholes</option>
                                    <option value="Streetlights">Streetlights</option>
                                    <option value="Sanitation">Sanitation & Trash</option>
                                    <option value="Water">Water & Drainage</option>
                                    <option value="Safety">Safety Hazards</option>
                                </select>
                            </div>

                            <div className="space-y-1">
                                <div className="flex items-center justify-between text-xs font-semibold text-[#1D1D1F]">
                                    <span>Severity</span>
                                    <span className="text-[#86868B]">{editSeverity}/10</span>
                                </div>
                                <input
                                    type="range"
                                    min={1}
                                    max={10}
                                    value={editSeverity}
                                    onChange={(e) => setEditSeverity(Number(e.target.value))}
                                    className="w-full accent-[#1D1D1F] cursor-pointer mt-2"
                                />
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-semibold text-[#1D1D1F]">
                                Description
                            </label>
                            <textarea
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                rows={3}
                                className="w-full px-3.5 py-2 bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#D1D1D6] rounded-lg text-sm text-[#1D1D1F] focus:outline-none transition-colors resize-none leading-relaxed"
                            />
                        </div>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="button"
                        onClick={handleFinalSubmit}
                        disabled={isSubmitting}
                        className="w-full py-2.5 px-4 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50"
                    >
                        {isSubmitting ? "Submitting report..." : "Submit report"}
                    </button>

                    <button
                        type="button"
                        onClick={resetForm}
                        className="w-full py-1 text-xs text-[#86868B] hover:text-[#1D1D1F] transition-colors"
                    >
                        Discard and start over
                    </button>
                </div>
            )}
        </div>
    );
}
