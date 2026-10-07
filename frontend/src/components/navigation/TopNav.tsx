"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { MapPin, Plus, LogOut, Building2 } from "lucide-react";
import { signOut } from "@/app/actions/auth";

interface TopNavProps {
    userEmail?: string;
    userRole?: string;
}

const navItems = [
    { href: "/", label: "Feed" },
    { href: "/map", label: "Live Map" },
    { href: "/my-reports", label: "My Reports" },
    { href: "/report", label: "Report" },
    { href: "/profile", label: "Profile" },
];

export default function TopNav({ userEmail, userRole }: TopNavProps) {
    const pathname = usePathname();

    return (
        <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-xl border-b border-black/[0.06] hidden md:block">
            <nav className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
                {/* Brand */}
                <Link href="/" prefetch={true} className="flex items-center gap-2 group active:scale-95 transition-transform">
                    <div className="w-7 h-7 rounded-lg bg-[#1D1D1F] text-white flex items-center justify-center transition-transform group-hover:scale-95">
                        <MapPin size={15} strokeWidth={2.2} />
                    </div>
                    <span className="font-semibold text-[15px] tracking-tight text-[#1D1D1F]">
                        HealMyCity
                    </span>
                </Link>

                {/* Center Links */}
                <div className="flex items-center gap-1">
                    {navItems.map(({ href, label }) => {
                        const isActive = pathname === href;
                        return (
                            <Link
                                key={href}
                                href={href}
                                prefetch={true}
                                className={`px-3.5 py-1.5 rounded-full text-[13px] font-medium transition-all active:scale-95 ${
                                    isActive
                                        ? "text-[#1D1D1F] bg-[#F5F5F7]"
                                        : "text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]/60"
                                }`}
                            >
                                {label}
                            </Link>
                        );
                    })}
                </div>

                {/* Right Actions */}
                <div className="flex items-center gap-3">
                    {pathname !== "/report" && (
                        <Link
                            href="/report"
                            prefetch={true}
                            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#1D1D1F] text-white text-[13px] font-medium hover:bg-[#333336] active:scale-[0.98] transition-all"
                        >
                            <Plus size={14} strokeWidth={2.5} />
                            <span>Report Issue</span>
                        </Link>
                    )}

                    {userRole === "admin" && (
                        <Link
                            href="/admin"
                            prefetch={true}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-xs font-semibold border border-[#E5E5EA] active:scale-[0.98] transition-all"
                        >
                            <Building2 size={13} className="text-[#1D1D1F]" />
                            <span>City Admin</span>
                        </Link>
                    )}

                    {userEmail && (
                        <div
                            className="w-7 h-7 rounded-full bg-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold flex items-center justify-center select-none"
                            title={userEmail}
                        >
                            {userEmail[0].toUpperCase()}
                        </div>
                    )}

                    <form action={signOut}>
                        <button
                            type="submit"
                            title="Sign Out"
                            className="p-1.5 text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] rounded-full transition-colors cursor-pointer"
                        >
                            <LogOut size={16} />
                        </button>
                    </form>
                </div>
            </nav>
        </header>
    );
}
