export default function AdminIssueLoading() {
    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
            <div className="flex items-center justify-between">
                <div className="h-7 w-28 bg-[#E5E5EA] rounded-full" />
                <div className="h-7 w-36 bg-[#E5E5EA] rounded-full" />
            </div>

            <div className="apple-card overflow-hidden bg-white space-y-6">
                <div className="w-full aspect-[21/9] bg-[#E5E5EA]" />
                <div className="p-6 sm:p-8 space-y-6">
                    <div className="space-y-2">
                        <div className="h-4 w-24 bg-[#E5E5EA] rounded" />
                        <div className="h-8 w-3/4 bg-[#E5E5EA] rounded-lg" />
                    </div>

                    <div className="h-36 bg-[#F5F5F7] rounded-2xl" />

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="h-20 bg-[#F5F5F7] rounded-xl" />
                        ))}
                    </div>

                    <div className="h-28 bg-[#F5F5F7] rounded-xl" />
                </div>
            </div>
        </div>
    );
}
