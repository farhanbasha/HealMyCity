import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signOut } from "@/app/actions/auth";
import { Mail, Calendar, Shield, Plus, LogOut } from "lucide-react";
import Link from "next/link";

export default async function ProfilePage() {
    const supabase = await createClient();

    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        redirect("/login");
    }

    // Fetch user profile
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", user.id)
        .single();

    // Count user's issues
    const { count: issueCount } = await supabase
        .from("issues")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);

    // Fetch user's submitted issues to compute total upvotes received
    const { data: userIssues } = await supabase
        .from("issues")
        .select("upvote_count")
        .eq("user_id", user.id);

    const totalUpvotes = (userIssues || []).reduce(
        (sum, item) => sum + (item.upvote_count || 0),
        0
    );

    const memberName = profile?.full_name || user.email?.split("@")[0] || "Citizen";
    const initial = (memberName[0] || "C").toUpperCase();
    const userRole = profile?.role || "Citizen";

    return (
        <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
            <div className="space-y-1">
                <h1 className="text-2xl font-semibold text-[#1D1D1F] tracking-tight">
                    Account
                </h1>
                <p className="text-sm text-[#6E6E73]">
                    Manage your civic contributor profile and tracked reports.
                </p>
            </div>

            {/* Apple ID Style Account Card */}
            <div className="apple-card p-6 space-y-6">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#F5F5F7] border border-[#E5E5EA] flex items-center justify-center font-semibold text-lg text-[#1D1D1F] shrink-0">
                        {initial}
                    </div>

                    <div className="space-y-0.5 min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-base text-[#1D1D1F] truncate">
                                {memberName}
                            </h2>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-[#F5F5F7] text-[#6E6E73] capitalize">
                                {userRole}
                            </span>
                        </div>
                        <p className="text-xs text-[#86868B] truncate">
                            {user.email}
                        </p>
                    </div>
                </div>

                {/* Minimalist Stats */}
                {/* Minimalist Stats */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#F0F0F2]">
                    <Link
                        href="/my-reports"
                        className="p-3 bg-[#F5F5F7] hover:bg-[#EAEAEA] rounded-xl text-center transition-all group cursor-pointer block"
                        title="Click to view all your reported issues"
                    >
                        <div className="text-xl font-semibold text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">
                            {issueCount || 0}
                        </div>
                        <div className="text-xs text-[#86868B] mt-0.5 flex items-center justify-center gap-1 group-hover:text-[#1D1D1F]">
                            <span>Issues reported</span>
                            <span className="text-[#0071E3] font-bold">→</span>
                        </div>
                    </Link>

                    <div className="p-3 bg-[#F5F5F7] rounded-xl text-center">
                        <div className="text-xl font-semibold text-[#1D1D1F]">
                            {totalUpvotes}
                        </div>
                        <div className="text-xs text-[#86868B] mt-0.5">Upvotes received</div>
                    </div>
                </div>

                {/* Account Details */}
                <div className="space-y-2.5 pt-4 border-t border-[#F0F0F2] text-xs">
                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2 text-[#86868B]">
                            <Mail size={14} />
                            <span>Email</span>
                        </div>
                        <span className="text-[#1D1D1F] font-medium">{user.email}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2 text-[#86868B]">
                            <Shield size={14} />
                            <span>Role</span>
                        </div>
                        <span className="text-[#1D1D1F] font-medium capitalize">{userRole}</span>
                    </div>

                    <div className="flex items-center justify-between py-1">
                        <div className="flex items-center gap-2 text-[#86868B]">
                            <Calendar size={14} />
                            <span>Member since</span>
                        </div>
                        <span className="text-[#1D1D1F] font-medium">
                            {new Date(user.created_at).toLocaleDateString("en-US", {
                                month: "short",
                                year: "numeric",
                            })}
                        </span>
                    </div>
                </div>

                {/* Actions */}
                <div className="pt-4 border-t border-[#F0F0F2] flex flex-col sm:flex-row items-center gap-2">
                    <Link
                        href="/my-reports"
                        className="w-full sm:flex-1 py-2 px-4 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-white text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <span>View my reports</span>
                    </Link>

                    <Link
                        href="/report"
                        className="w-full sm:w-auto py-2 px-4 rounded-full bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] text-[#1D1D1F] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors"
                    >
                        <Plus size={14} />
                        <span>New Report</span>
                    </Link>

                    <form action={signOut} className="w-full sm:w-auto">
                        <button
                            type="submit"
                            className="w-full sm:w-auto py-2 px-4 rounded-full bg-[#F5F5F7] hover:bg-[#FDEDEC] text-[#6E6E73] hover:text-[#C02820] text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                        >
                            <LogOut size={14} />
                            <span>Sign out</span>
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}
