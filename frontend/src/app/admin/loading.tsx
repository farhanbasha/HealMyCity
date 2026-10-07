export default function AdminLoading() {
    return (
        <div className="max-w-6xl mx-auto space-y-6 animate-pulse">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-44 bg-[#E5E5EA] rounded-lg" />
                    <div className="h-4 w-72 bg-[#E5E5EA]/70 rounded" />
                </div>
                <div className="h-8 w-28 bg-[#E5E5EA] rounded-full" />
            </div>

            {/* KPI Cards Skeleton */}
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="apple-card p-4 bg-white space-y-2">
                        <div className="h-3 w-24 bg-[#E5E5EA] rounded" />
                        <div className="h-7 w-12 bg-[#E5E5EA] rounded" />
                    </div>
                ))}
            </div>

            {/* Table Skeleton */}
            <div className="apple-card p-6 bg-white space-y-4">
                <div className="h-6 w-32 bg-[#E5E5EA] rounded" />
                <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-12 bg-[#F5F5F7] rounded-xl w-full" />
                    ))}
                </div>
            </div>
        </div>
    );
}
