export default function AppLoading() {
    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 md:py-12 space-y-10 animate-pulse">
            {/* Hero Placeholder */}
            <div className="space-y-4 max-w-3xl">
                <div className="space-y-2.5">
                    <div className="h-10 sm:h-12 bg-[#E5E5EA] rounded-xl w-3/4 max-w-xl" />
                    <div className="h-4 bg-[#E5E5EA]/70 rounded-md w-full max-w-lg" />
                    <div className="h-4 bg-[#E5E5EA]/70 rounded-md w-2/3 max-w-md" />
                </div>
                <div className="flex gap-3 pt-2">
                    <div className="h-9 w-36 bg-[#E5E5EA] rounded-full" />
                    <div className="h-9 w-32 bg-[#E5E5EA]/60 rounded-full" />
                </div>
            </div>

            {/* Metrics Bar Placeholder */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-[#E5E5EA] rounded-xl p-4 space-y-2">
                        <div className="h-3 w-24 bg-[#E5E5EA] rounded" />
                        <div className="h-7 w-12 bg-[#E5E5EA] rounded" />
                    </div>
                ))}
            </div>

            {/* Filter Bar Placeholder */}
            <div className="bg-white border border-[#E5E5EA] rounded-2xl p-3 sm:p-4 space-y-3">
                <div className="h-9 bg-[#F5F5F7] rounded-lg w-full" />
                <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-6 w-16 bg-[#E5E5EA]/60 rounded-full" />
                    ))}
                </div>
            </div>

            {/* Cards Grid Placeholder */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white border border-[#E5E5EA] rounded-2xl overflow-hidden space-y-4 p-4">
                        <div className="aspect-[16/10] bg-[#E5E5EA]/70 rounded-xl" />
                        <div className="space-y-2">
                            <div className="h-3 w-20 bg-[#E5E5EA] rounded" />
                            <div className="h-5 w-4/5 bg-[#E5E5EA] rounded" />
                            <div className="h-3.5 w-full bg-[#E5E5EA]/60 rounded" />
                        </div>
                        <div className="pt-2 border-t border-[#F0F0F2] flex justify-between">
                            <div className="h-4 w-20 bg-[#E5E5EA]/50 rounded" />
                            <div className="h-6 w-12 bg-[#E5E5EA] rounded-full" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
