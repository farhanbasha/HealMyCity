"use client";

import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import L from "leaflet";
import Image from "next/image";

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

type MapIssue = {
    id: string;
    image_url: string | null;
    ai_title: string | null;
    ai_category: string | null;
    latitude: number;
    longitude: number;
    upvote_count: number;
};

// Apple / Google system category colors
function getCategoryColor(category: string | null): string {
    const cat = (category || "").toLowerCase();
    if (cat.includes("water") || cat.includes("leak") || cat.includes("drainage")) return "#0071E3";
    if (cat.includes("road") || cat.includes("pothole") || cat.includes("street")) return "#8E8E93";
    if (cat.includes("trash") || cat.includes("garbage") || cat.includes("sanitation")) return "#34C759";
    if (cat.includes("power") || cat.includes("light") || cat.includes("lamp")) return "#FF9500";
    if (cat.includes("danger") || cat.includes("hazard")) return "#FF3B30";
    return "#5856D6";
}

export default function MapComponent({ issues }: { issues: MapIssue[] }) {
    const defaultCenter: [number, number] = issues.length > 0
        ? [issues[0].latitude, issues[0].longitude]
        : [12.9716, 77.5946];

    return (
        <div className="w-full h-[580px] z-0 relative overflow-hidden bg-[#FBFBFD]">
            <MapContainer
                center={defaultCenter}
                zoom={13}
                scrollWheelZoom={true}
                className="w-full h-full"
            >
                {/* Map Tiles: Default to OpenStreetMap (free, no API key/watermark needed). If CARTO key is provided, use CARTO. */}
                <TileLayer
                    attribution={
                        process.env.NEXT_PUBLIC_CARTO_API_KEY
                            ? '&copy; <a href="https://carto.com/">CARTO</a>'
                            : '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    }
                    url={
                        process.env.NEXT_PUBLIC_CARTO_API_KEY
                            ? `https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png?key=${process.env.NEXT_PUBLIC_CARTO_API_KEY.trim()}`
                            : "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    }
                    subdomains={process.env.NEXT_PUBLIC_CARTO_API_KEY ? "abcd" : "abc"}
                    maxZoom={19}
                />

                {issues.map((issue) => {
                    const radius = Math.min(22, 7 + (issue.upvote_count * 1.2));
                    const color = getCategoryColor(issue.ai_category);

                    return (
                        <CircleMarker
                            key={issue.id}
                            center={[issue.latitude, issue.longitude]}
                            pathOptions={{
                                color: color,
                                fillColor: color,
                                fillOpacity: 0.6,
                                weight: 2,
                            }}
                            radius={radius}
                        >
                            <Popup>
                                <div className="w-52 p-0.5 space-y-2">
                                    {issue.image_url ? (
                                        <div className="relative w-full h-24 bg-[#F5F5F7] rounded-lg overflow-hidden border border-[#E5E5EA]">
                                            <Image
                                                src={issue.image_url}
                                                alt={issue.ai_title || "Issue"}
                                                fill
                                                className="object-cover"
                                                sizes="208px"
                                            />
                                        </div>
                                    ) : null}

                                    <h4 className="font-semibold text-xs text-[#1D1D1F] leading-snug line-clamp-2">
                                        {issue.ai_title || "Reported Issue"}
                                    </h4>

                                    <div className="flex items-center justify-between text-[11px] pt-1 border-t border-[#F0F0F2]">
                                        <span className="text-[#86868B]">
                                            {issue.ai_category || "Unassigned"}
                                        </span>
                                        <span className="font-semibold text-[#1D1D1F]">
                                            {issue.upvote_count} upvotes
                                        </span>
                                    </div>
                                </div>
                            </Popup>
                        </CircleMarker>
                    );
                })}
            </MapContainer>
        </div>
    );
}
