export default function LiveMapLoading() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-md bg-[#E5E5EA]" />
                        <div className="h-8 w-60 bg-[#E5E5EA] rounded-lg" />
                    </div>
                    <div className="h-4 w-80 bg-[#E5E5EA]/70 rounded" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-28 bg-[#E5E5EA] rounded-full" />
                    <div className="h-8 w-32 bg-[#E5E5EA]/60 rounded-full" />
                </div>
            </div>

            {/* Quick Metrics Bar */}
            <div className="grid grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-[#E5E5EA] rounded-xl p-3.5 space-y-2">
                        <div className="h-3 w-20 bg-[#E5E5EA] rounded" />
                        <div className="h-7 w-12 bg-[#E5E5EA] rounded" />
                    </div>
                ))}
            </div>

            {/* Interactive Map Container Skeleton */}
            <div className="w-full h-[580px] sm:h-[640px] bg-white border border-[#E5E5EA] rounded-2xl flex flex-col items-center justify-center gap-3">
                <div className="w-8 h-8 rounded-full border-2 border-[#1D1D1F] border-t-transparent animate-spin" />
                <span className="text-xs font-medium text-[#86868B]">Preparing geospatial infrastructure layers...</span>
            </div>
        </div>
    );
}
