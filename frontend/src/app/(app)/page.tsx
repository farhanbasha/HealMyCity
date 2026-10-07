import { createClient, getCachedAuthUser } from "@/lib/supabase/server";
import HomeFeed from "@/components/feed/HomeFeed";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, Map } from "lucide-react";

export default async function HomePage({
    searchParams,
}: {
    searchParams?: Promise<{ code?: string }>;
}) {
    const sp = searchParams ? await searchParams : {};
    if (sp.code) {
        redirect(`/auth/callback?code=${encodeURIComponent(sp.code)}`);
    }

    const user = await getCachedAuthUser();
    const supabase = await createClient();

    // Fetch issues and user votes in parallel
    const [issuesRes, votesRes] = await Promise.all([
        supabase
            .from("issues")
            .select("*")
            .order("created_at", { ascending: false }),
        user
            ? supabase
                  .from("votes")
                  .select("issue_id")
                  .eq("user_id", user.id)
            : Promise.resolve({ data: [] }),
    ]);

    const issues = issuesRes.data || [];
    const userVotes = (votesRes.data || []).map((v: { issue_id: string }) => v.issue_id);

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10">
            {/* Apple-style Clean Hero */}
            <section className="space-y-4 max-w-3xl">
                <div className="space-y-2">
                    <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold tracking-tight text-[#1D1D1F] leading-[1.15]">
                        Civic infrastructure, reported and resolved.
                    </h1>
                    <p className="text-sm sm:text-base text-[#6E6E73] leading-relaxed max-w-xl">
                        Help improve your community. Snap a photo of potholes, broken streetlights, or water leaks, and track real-time municipal updates.
                    </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 pt-2">
                    <Link
                        href="/report"
                        prefetch={true}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#1D1D1F] text-white text-sm font-medium hover:bg-[#333336] active:scale-[0.98] transition-all"
                    >
                        <Plus size={16} strokeWidth={2.4} />
                        <span>Report an issue</span>
                    </Link>

                    <Link
                        href="/map"
                        prefetch={true}
                        className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-[#F5F5F7] hover:bg-[#E8E8ED] text-[#1D1D1F] text-sm font-medium border border-[#E5E5EA] transition-all"
                    >
                        <Map size={15} className="text-[#6E6E73]" />
                        <span>View live map</span>
                    </Link>
                </div>
            </section>

            {/* Feed Section */}
            <HomeFeed
                issues={issues}
                userVotes={userVotes}
                userId={user?.id || ""}
            />
        </div>
    );
}
