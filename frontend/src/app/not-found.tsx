import type { Metadata } from "next";
import Link from "next/link";
import {
    MapPin,
    Home,
    Plus,
    Compass,
    ArrowLeft,
    Building2,
    Search,
    ShieldAlert,
} from "lucide-react";

export const metadata: Metadata = {
    title: "404 — Page Not Found | HealMyCity",
    description: "The requested civic page or report could not be found.",
};

export default function NotFound() {
    return (
        <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F] flex flex-col justify-between selection:bg-[#007AFF]/10 selection:text-[#007AFF]">
            {/* Top Minimal Brand Bar */}
            <header className="w-full border-b border-[#F0F0F2] bg-white/80 backdrop-blur-md sticky top-0 z-50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
                    <Link
                        href="/"
                        className="flex items-center gap-2 group transition-opacity hover:opacity-80"
                    >
                        <div className="w-7 h-7 rounded-lg bg-[#1D1D1F] text-white flex items-center justify-center shadow-2xs group-hover:bg-[#007AFF] transition-colors">
                            <Building2 size={15} />
                        </div>
                        <span className="font-semibold text-sm tracking-tight text-[#1D1D1F]">
                            HealMyCity
                        </span>
                    </Link>

                    <div className="flex items-center gap-1.5">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#FDEDEC] text-[#C02820] border border-[#F8D7DA]">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#C02820] animate-pulse" />
                            <span>Error 404</span>
                        </span>
                    </div>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16">
                <div className="max-w-xl w-full text-center space-y-8">
                    {/* Visual Metaphor: Pulsing Geospatial Beacon */}
                    <div className="relative inline-flex items-center justify-center">
                        {/* Soft Outer Radiance Rings */}
                        <div className="absolute w-36 h-36 rounded-full bg-[#007AFF]/10 blur-xl animate-pulse pointer-events-none" />
                        <div className="absolute w-28 h-28 rounded-full border border-[#E5E5EA] animate-ping opacity-25 pointer-events-none" />
                        <div className="absolute w-24 h-24 rounded-full border border-[#007AFF]/20 pointer-events-none" />

                        {/* Central Icon Disc */}
                        <div className="relative w-20 h-20 rounded-2xl bg-white border border-[#E5E5EA] shadow-lg flex items-center justify-center text-[#007AFF]">
                            <Compass size={38} className="text-[#007AFF] stroke-[1.75]" />
                            <span className="absolute -bottom-2 -right-2 w-7 h-7 rounded-full bg-[#1D1D1F] text-white border-2 border-white flex items-center justify-center text-[10px] font-bold shadow-xs">
                                404
                            </span>
                        </div>
                    </div>

                    {/* Headline and Description */}
                    <div className="space-y-3">
                        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#F5F5F7] text-[#6E6E73] border border-[#E5E5EA]">
                            <span>Route Not Found</span>
                        </div>

                        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1D1D1F] tracking-tight leading-tight">
                            Are You Lost?
                        </h1>

                        <p className="text-sm sm:text-base text-[#6E6E73] max-w-md mx-auto leading-relaxed">
                            The address or civic report you are trying to reach doesn’t exist, has been resolved, or was relocated.
                        </p>
                    </div>

                    {/* Primary Actions */}
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                        <Link
                            href="/"
                            prefetch={true}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-white text-xs font-semibold transition-all shadow-xs hover:shadow-md cursor-pointer"
                        >
                            <ArrowLeft size={14} />
                            <span>Return to Feed</span>
                        </Link>

                        <Link
                            href="/map"
                            prefetch={true}
                            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold transition-all shadow-2xs hover:shadow-xs cursor-pointer"
                        >
                            <MapPin size={14} className="text-[#007AFF]" />
                            <span>Explore Live Map</span>
                        </Link>
                    </div>

                    {/* Quick Destinations Bento Grid */}
                    <div className="pt-6 border-t border-[#F0F0F2] text-left">
                        <p className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider mb-3 text-center sm:text-left">
                            Popular Municipal Hubs
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                            <Link
                                href="/"
                                prefetch={true}
                                className="p-3.5 rounded-xl bg-white border border-[#E5E5EA] hover:border-[#D1D1D6] hover:shadow-2xs transition-all group block"
                            >
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
                                    <Home size={14} className="text-[#6E6E73] group-hover:text-[#007AFF] transition-colors shrink-0" />
                                    <span>Home Feed</span>
                                </div>
                                <p className="text-[11px] text-[#86868B] mt-1 leading-snug">
                                    Active neighborhood issues & community upvotes.
                                </p>
                            </Link>

                            <Link
                                href="/map"
                                prefetch={true}
                                className="p-3.5 rounded-xl bg-white border border-[#E5E5EA] hover:border-[#D1D1D6] hover:shadow-2xs transition-all group block"
                            >
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
                                    <MapPin size={14} className="text-[#6E6E73] group-hover:text-[#007AFF] transition-colors shrink-0" />
                                    <span>Geospatial Map</span>
                                </div>
                                <p className="text-[11px] text-[#86868B] mt-1 leading-snug">
                                    Interactive city map with problem density clusters.
                                </p>
                            </Link>

                            <Link
                                href="/report"
                                prefetch={true}
                                className="p-3.5 rounded-xl bg-white border border-[#E5E5EA] hover:border-[#D1D1D6] hover:shadow-2xs transition-all group block"
                            >
                                <div className="flex items-center gap-2 text-xs font-semibold text-[#1D1D1F] group-hover:text-[#007AFF] transition-colors">
                                    <Plus size={14} className="text-[#6E6E73] group-hover:text-[#007AFF] transition-colors shrink-0" />
                                    <span>Submit Report</span>
                                </div>
                                <p className="text-[11px] text-[#86868B] mt-1 leading-snug">
                                    Capture a hazard photo with GPS coordinates.
                                </p>
                            </Link>
                        </div>
                    </div>
                </div>
            </main>

            {/* Minimal Footer */}
            <footer className="w-full border-t border-[#F0F0F2] py-4 bg-white/50">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-[#86868B]">
                    <span>HealMyCity &bull; Municipal Infrastructure Dispatch</span>
                    <span>Designed for clean, transparent community governance</span>
                </div>
            </footer>
        </div>
    );
}
