export default function MyReportsLoading() {
    return (
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <div className="h-8 w-52 bg-[#E5E5EA] rounded-lg" />
                        <div className="h-5 w-28 bg-[#E5E5EA]/70 rounded-full" />
                    </div>
                    <div className="h-4 w-72 bg-[#E5E5EA]/60 rounded" />
                </div>
                <div className="flex items-center gap-2">
                    <div className="h-8 w-24 bg-[#E5E5EA]/60 rounded-full" />
                    <div className="h-8 w-28 bg-[#E5E5EA] rounded-full" />
                </div>
            </div>

            {/* Filter Tabs Shimmer */}
            <div className="flex items-center gap-2 border-b border-[#E5E5EA] pb-3">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-7 w-20 bg-[#E5E5EA]/60 rounded-full" />
                ))}
            </div>

            {/* Reports List Placeholders */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="bg-white border border-[#E5E5EA] rounded-2xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between"
                    >
                        <div className="flex items-start gap-4 flex-1">
                            <div className="w-20 h-20 bg-[#E5E5EA] rounded-xl shrink-0" />
                            <div className="space-y-2 flex-1">
                                <div className="h-3 w-16 bg-[#E5E5EA] rounded" />
                                <div className="h-5 w-3/4 bg-[#E5E5EA] rounded" />
                                <div className="h-3.5 w-1/2 bg-[#E5E5EA]/60 rounded" />
                            </div>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end gap-2 shrink-0">
                            <div className="h-6 w-20 bg-[#E5E5EA]/70 rounded-full" />
                            <div className="h-4 w-16 bg-[#E5E5EA]/50 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
