"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, Map, PlusCircle, User, FileText } from "lucide-react";

export default function BottomNav() {
    const pathname = usePathname();

    return (
        <nav className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-white/90 backdrop-blur-xl border-t border-black/[0.08]">
            <div className="flex items-center justify-around h-14 max-w-md mx-auto px-2" style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}>
                {/* Feed */}
                <Link
                    href="/"
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                        pathname === "/"
                            ? "text-[#1D1D1F] font-semibold"
                            : "text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                >
                    <LayoutGrid size={18} strokeWidth={pathname === "/" ? 2.4 : 1.8} />
                    <span className="text-[10px]">Feed</span>
                </Link>

                {/* Live Map */}
                <Link
                    href="/map"
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                        pathname === "/map"
                            ? "text-[#1D1D1F] font-semibold"
                            : "text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                >
                    <Map size={18} strokeWidth={pathname === "/map" ? 2.4 : 1.8} />
                    <span className="text-[10px]">Map</span>
                </Link>

                {/* Report Center */}
                <Link
                    href="/report"
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                        pathname === "/report"
                            ? "text-[#1D1D1F] font-semibold"
                            : "text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                >
                    <PlusCircle size={19} strokeWidth={pathname === "/report" ? 2.4 : 1.8} />
                    <span className="text-[10px]">Report</span>
                </Link>

                {/* My Reports */}
                <Link
                    href="/my-reports"
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                        pathname === "/my-reports"
                            ? "text-[#1D1D1F] font-semibold"
                            : "text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                >
                    <FileText size={18} strokeWidth={pathname === "/my-reports" ? 2.4 : 1.8} />
                    <span className="text-[10px]">My Reports</span>
                </Link>

                {/* Profile */}
                <Link
                    href="/profile"
                    className={`flex flex-col items-center gap-0.5 px-2 py-1 transition-colors ${
                        pathname === "/profile"
                            ? "text-[#1D1D1F] font-semibold"
                            : "text-[#86868B] hover:text-[#1D1D1F]"
                    }`}
                >
                    <User size={18} strokeWidth={pathname === "/profile" ? 2.4 : 1.8} />
                    <span className="text-[10px]">Profile</span>
                </Link>
            </div>
        </nav>
    );
}
