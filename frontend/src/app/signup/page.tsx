"use client";

import { useState } from "react";
import { signUpWithEmail } from "@/app/actions/auth";
import { toast } from "sonner";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function SignupPage() {
    const [isLoading, setIsLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const password = formData.get("password") as string;
        const confirmPassword = formData.get("confirmPassword") as string;

        if (password !== confirmPassword) {
            toast.error("Passwords do not match");
            setIsLoading(false);
            return;
        }

        if (password.length < 6) {
            toast.error("Password must be at least 6 characters");
            setIsLoading(false);
            return;
        }

        const result = await signUpWithEmail(formData);

        if (result?.error) {
            toast.error(result.error);
        } else if (result?.success) {
            toast.success(result.success);
        }

        setIsLoading(false);
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD] px-4 py-12">
            <div className="w-full max-w-sm space-y-6">
                {/* Brand */}
                <div className="text-center space-y-2">
                    <div className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-[#1D1D1F] text-white shadow-sm mb-1">
                        <MapPin size={20} strokeWidth={2.2} />
                    </div>
                    <h1 className="text-2xl font-semibold tracking-tight text-[#1D1D1F]">
                        Create an account
                    </h1>
                    <p className="text-xs text-[#6E6E73]">
                        Join HealMyCity to report and track neighborhood issues
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-3.5">
                        <div className="space-y-1">
                            <label
                                htmlFor="fullName"
                                className="text-xs font-semibold text-[#1D1D1F]"
                            >
                                Full name
                            </label>
                            <input
                                id="fullName"
                                name="fullName"
                                type="text"
                                required
                                autoComplete="name"
                                placeholder="Alex Mercer"
                                className="w-full px-3.5 py-2 bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#D1D1D6] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="email"
                                className="text-xs font-semibold text-[#1D1D1F]"
                            >
                                Email address
                            </label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                required
                                autoComplete="email"
                                placeholder="name@example.com"
                                className="w-full px-3.5 py-2 bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#D1D1D6] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="password"
                                className="text-xs font-semibold text-[#1D1D1F]"
                            >
                                Password
                            </label>
                            <input
                                id="password"
                                name="password"
                                type="password"
                                required
                                autoComplete="new-password"
                                placeholder="••••••••••••"
                                className="w-full px-3.5 py-2 bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#D1D1D6] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none transition-all"
                            />
                        </div>

                        <div className="space-y-1">
                            <label
                                htmlFor="confirmPassword"
                                className="text-xs font-semibold text-[#1D1D1F]"
                            >
                                Confirm password
                            </label>
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type="password"
                                required
                                autoComplete="new-password"
                                placeholder="••••••••••••"
                                className="w-full px-3.5 py-2 bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#D1D1D6] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 mt-1"
                        >
                            {isLoading ? "Creating account..." : "Create account"}
                        </button>
                    </form>

                    <p className="text-center text-xs text-[#6E6E73] pt-2 border-t border-[#F0F0F2]">
                        Already have an account?{" "}
                        <Link
                            href="/login"
                            className="text-[#1D1D1F] font-semibold hover:underline"
                        >
                            Sign in
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
