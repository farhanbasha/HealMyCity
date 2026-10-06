import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { LayoutDashboard, Map as MapIcon, LogOut, ArrowLeft, Building2 } from "lucide-react";
import { signOut } from "@/app/actions/auth";

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    const { data: profile } = await supabase
        .from("users")
        .select("role")
        .eq("id", user.id)
        .single();

    if (profile?.role !== "admin") {
        redirect("/");
    }

    return (
        <div className="flex min-h-screen bg-[#FBFBFD] text-[#1D1D1F] font-sans">
            {/* Sidebar */}
            <aside className="w-60 bg-white border-r border-[#E5E5EA] flex-col hidden md:flex shrink-0">
                {/* Brand */}
                <div className="h-14 flex items-center px-5 border-b border-[#F0F0F2]">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#1D1D1F] text-white flex items-center justify-center">
                            <Building2 size={13} />
                        </div>
                        <span className="font-semibold text-sm tracking-tight text-[#1D1D1F]">
                            City Admin
                        </span>
                    </div>
                </div>

                {/* Nav */}
                <nav className="flex-1 px-3 py-4 space-y-1">
                    <Link
                        href="/admin"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                    >
                        <LayoutDashboard size={15} className="text-[#6E6E73]" />
                        <span>Issues Triage</span>
                    </Link>
                    <Link
                        href="/admin/map"
                        className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                    >
                        <MapIcon size={15} className="text-[#6E6E73]" />
                        <span>Live Map</span>
                    </Link>
                </nav>

                {/* Footer */}
                <div className="p-3 border-t border-[#F0F0F2] space-y-1">
                    <Link
                        href="/"
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                    >
                        <ArrowLeft size={13} />
                        <span>Citizen View</span>
                    </Link>
                    <form action={signOut}>
                        <button
                            type="submit"
                            className="w-full flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs text-[#86868B] hover:text-[#C02820] hover:bg-[#FDEDEC] transition-colors cursor-pointer"
                        >
                            <LogOut size={13} />
                            <span>Sign out</span>
                        </button>
                    </form>
                </div>
            </aside>

            {/* Main Area */}
            <div className="flex-1 flex flex-col min-h-screen overflow-x-hidden">
                {/* Mobile Header */}
                <header className="md:hidden h-14 bg-white border-b border-[#E5E5EA] flex items-center px-4 justify-between">
                    <span className="font-semibold text-sm text-[#1D1D1F]">
                        City Admin
                    </span>
                    <div className="flex items-center gap-2">
                        <Link
                            href="/admin"
                            className="text-xs font-medium px-2.5 py-1 rounded bg-[#F5F5F7] text-[#1D1D1F]"
                        >
                            Triage
                        </Link>
                        <Link
                            href="/admin/map"
                            className="text-xs font-medium px-2.5 py-1 rounded text-[#6E6E73]"
                        >
                            Map
                        </Link>
                    </div>
                </header>

                <main className="flex-1 p-5 sm:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
