"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

interface AdminStatusControlProps {
    issueId: string;
    initialStatus: string;
}

export default function AdminStatusControl({
    issueId,
    initialStatus,
}: AdminStatusControlProps) {
    const [status, setStatus] = useState<string>(initialStatus);
    const [isUpdating, setIsUpdating] = useState<boolean>(false);

    async function handleStatusChange(newStatus: string) {
        if (newStatus === status || isUpdating) return;

        const previousStatus = status;
        setStatus(newStatus);
        setIsUpdating(true);

        const supabase = createClient();
        const { error } = await supabase
            .from("issues")
            .update({ status: newStatus })
            .eq("id", issueId);

        setIsUpdating(false);

        if (error) {
            toast.error("Failed to update status. Reverting change.");
            setStatus(previousStatus);
        } else {
            const formatted = newStatus.replace("_", " ").toUpperCase();
            toast.success(`Issue status updated to ${formatted}`);
        }
    }

    return (
        <div className="bg-white border border-[#E5E5EA] rounded-xl p-4 sm:p-5 space-y-3 shadow-xs">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wide">
                        Municipal Dispatch Status
                    </h3>
                    <p className="text-xs text-[#86868B] mt-0.5">
                        Update resolution workflow stage in real time
                    </p>
                </div>

                <span
                    className={`px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
                        status === "resolved"
                            ? "bg-[#EDF8F0] text-[#1D7D3B]"
                            : status === "in_progress"
                            ? "bg-[#FDF5EB] text-[#9A5B00]"
                            : "bg-[#FDEDEC] text-[#C02820]"
                    }`}
                >
                    {status.replace("_", " ")}
                </span>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
                <button
                    type="button"
                    onClick={() => handleStatusChange("open")}
                    disabled={isUpdating}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        status === "open"
                            ? "bg-[#FDEDEC] text-[#C02820] border border-[#F8D7DA] shadow-xs"
                            : "bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#EEEEF0] hover:text-[#1D1D1F] border border-transparent"
                    }`}
                >
                    <AlertCircle size={13} />
                    <span>Open</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleStatusChange("in_progress")}
                    disabled={isUpdating}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        status === "in_progress"
                            ? "bg-[#FDF5EB] text-[#9A5B00] border border-[#FFE8CC] shadow-xs"
                            : "bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#EEEEF0] hover:text-[#1D1D1F] border border-transparent"
                    }`}
                >
                    <Clock size={13} />
                    <span>In Progress</span>
                </button>

                <button
                    type="button"
                    onClick={() => handleStatusChange("resolved")}
                    disabled={isUpdating}
                    className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                        status === "resolved"
                            ? "bg-[#EDF8F0] text-[#1D7D3B] border border-[#C3E6CB] shadow-xs"
                            : "bg-[#F5F5F7] text-[#6E6E73] hover:bg-[#EEEEF0] hover:text-[#1D1D1F] border border-transparent"
                    }`}
                >
                    <CheckCircle2 size={13} />
                    <span>Resolved</span>
                </button>
            </div>
        </div>
    );
}
