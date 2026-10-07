export default function IssueDetailLoading() {
    return (
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-6 animate-pulse">
            {/* Top Navigation Bar Skeleton */}
            <div className="flex items-center justify-between">
                <div className="h-8 w-28 bg-[#E5E5EA] rounded-full" />
                <div className="h-8 w-36 bg-[#E5E5EA] rounded-full" />
            </div>

            {/* Main Issue Card Skeleton */}
            <article className="apple-card overflow-hidden bg-white">
                {/* Photo Display Placeholder */}
                <div className="w-full aspect-[16/9] sm:aspect-[21/9] bg-[#E5E5EA] border-b border-[#F0F0F2]" />

                {/* Content Section Skeleton */}
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-20 bg-[#E5E5EA]/70 rounded-full" />
                            <div className="h-4 w-24 bg-[#E5E5EA]/60 rounded" />
                        </div>
                        <div className="h-8 w-3/4 bg-[#E5E5EA] rounded-lg" />
                    </div>

                    {/* AI Assessment Skeleton */}
                    <div className="bg-[#FBFBFD] border border-[#E5E5EA] rounded-xl p-4 sm:p-5 space-y-2">
                        <div className="h-4 w-44 bg-[#E5E5EA] rounded" />
                        <div className="h-4 w-full bg-[#E5E5EA]/70 rounded" />
                        <div className="h-4 w-2/3 bg-[#E5E5EA]/70 rounded" />
                    </div>

                    {/* Metric Cards Skeleton */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="p-4 rounded-xl bg-[#F5F5F7] space-y-2">
                                <div className="h-3 w-20 bg-[#E5E5EA] rounded" />
                                <div className="h-7 w-12 bg-[#E5E5EA] rounded" />
                                <div className="h-3 w-32 bg-[#E5E5EA]/60 rounded" />
                            </div>
                        ))}
                    </div>

                    {/* Location Information Skeleton */}
                    <div className="pt-4 border-t border-[#F0F0F2] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="h-4 w-48 bg-[#E5E5EA]/70 rounded" />
                        <div className="flex gap-2">
                            <div className="h-8 w-36 bg-[#E5E5EA] rounded-full" />
                            <div className="h-8 w-28 bg-[#E5E5EA]/70 rounded-full" />
                        </div>
                    </div>
                </div>
            </article>
        </div>
    );
}
