"use client";

import dynamic from "next/dynamic";
import type { MapIssue } from "./LiveMapComponent";

const LiveMap = dynamic(() => import("./LiveMapComponent"), {
    ssr: false,
    loading: () => (
        <div className="w-full h-[580px] sm:h-[640px] flex flex-col items-center justify-center bg-[#F5F5F7] border border-[#E5E5EA] rounded-2xl gap-2.5">
            <div className="w-6 h-6 border-2 border-[#1D1D1F] border-t-transparent rounded-full animate-spin" />
            <span className="text-xs font-medium text-[#86868B]">Loading geospatial map and civic hotspots...</span>
        </div>
    ),
});

export default function LiveMapWrapper({
    issues,
    focusIssueId,
}: {
    issues: MapIssue[];
    focusIssueId?: string;
}) {
    return <LiveMap issues={issues} focusIssueId={focusIssueId} />;
}
