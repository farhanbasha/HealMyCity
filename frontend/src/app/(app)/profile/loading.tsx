export default function ProfileLoading() {
    return (
        <div className="max-w-xl mx-auto px-4 py-8 space-y-6 animate-pulse">
            <div className="space-y-1.5">
                <div className="h-8 w-32 bg-[#E5E5EA] rounded-lg" />
                <div className="h-4 w-64 bg-[#E5E5EA]/70 rounded" />
            </div>

            {/* Apple ID Style Account Card Skeleton */}
            <div className="apple-card p-6 space-y-6 bg-white">
                <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-full bg-[#E5E5EA] shrink-0" />
                    <div className="space-y-2 flex-1">
                        <div className="flex items-center gap-2">
                            <div className="h-5 w-32 bg-[#E5E5EA] rounded" />
                            <div className="h-4 w-14 bg-[#E5E5EA]/60 rounded-full" />
                        </div>
                        <div className="h-3.5 w-48 bg-[#E5E5EA]/70 rounded" />
                    </div>
                </div>

                {/* Minimalist Stats Skeleton */}
                <div className="grid grid-cols-2 gap-3 pt-4 border-t border-[#F0F0F2]">
                    <div className="p-3 bg-[#F5F5F7] rounded-xl flex flex-col items-center justify-center space-y-1">
                        <div className="h-6 w-10 bg-[#E5E5EA] rounded" />
                        <div className="h-3 w-20 bg-[#E5E5EA]/60 rounded" />
                    </div>
                    <div className="p-3 bg-[#F5F5F7] rounded-xl flex flex-col items-center justify-center space-y-1">
                        <div className="h-6 w-10 bg-[#E5E5EA] rounded" />
                        <div className="h-3 w-24 bg-[#E5E5EA]/60 rounded" />
                    </div>
                </div>

                {/* Account Details Skeleton */}
                <div className="space-y-3 pt-4 border-t border-[#F0F0F2]">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="flex items-center justify-between py-1">
                            <div className="h-4 w-20 bg-[#E5E5EA]/60 rounded" />
                            <div className="h-4 w-32 bg-[#E5E5EA] rounded" />
                        </div>
                    ))}
                </div>

                {/* Actions Skeleton */}
                <div className="pt-4 border-t border-[#F0F0F2] flex flex-col sm:flex-row items-center gap-2">
                    <div className="w-full sm:flex-1 h-9 bg-[#E5E5EA] rounded-full" />
                    <div className="w-full sm:w-28 h-9 bg-[#E5E5EA]/70 rounded-full" />
                    <div className="w-full sm:w-24 h-9 bg-[#E5E5EA]/50 rounded-full" />
                </div>
            </div>
        </div>
    );
}
