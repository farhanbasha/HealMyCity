"use client";

import LiveMapWrapper from "@/components/map/LiveMapWrapper";
import type { MapIssue } from "@/components/map/LiveMapComponent";

export default function MapWrapper({ issues }: { issues: MapIssue[] }) {
    return <LiveMapWrapper issues={issues} />;
}
