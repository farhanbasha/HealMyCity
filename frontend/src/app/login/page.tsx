"use client";

import { useState } from "react";
import { signInWithEmail } from "@/app/actions/auth";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import Link from "next/link";
import { MapPin } from "lucide-react";

export default function LoginPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [isGoogleLoading, setIsGoogleLoading] = useState(false);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        setIsLoading(true);

        const formData = new FormData(e.currentTarget);
        const result = await signInWithEmail(formData);

        if (result?.error) {
            toast.error(result.error);
            setIsLoading(false);
        }
    }

    async function handleGoogleLogin() {
        setIsGoogleLoading(true);
        const supabase = createClient();

        const { error } = await supabase.auth.signInWithOAuth({
            provider: "google",
            options: {
                redirectTo: `${window.location.origin}/auth/callback`,
            },
        });

        if (error) {
            toast.error(error.message);
            setIsGoogleLoading(false);
        }
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
                        Sign in to HealMyCity
                    </h1>
                    <p className="text-xs text-[#6E6E73]">
                        Enter your account details to continue
                    </p>
                </div>

                {/* Form Card */}
                <div className="bg-white border border-[#E5E5EA] rounded-2xl p-6 sm:p-7 shadow-sm space-y-4">
                    <form onSubmit={handleSubmit} className="space-y-3.5">
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
                                autoComplete="current-password"
                                placeholder="••••••••••••"
                                className="w-full px-3.5 py-2 bg-[#F5F5F7] focus:bg-white border border-transparent focus:border-[#D1D1D6] rounded-xl text-sm text-[#1D1D1F] placeholder:text-[#86868B] focus:outline-none transition-all"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-2.5 px-4 rounded-full bg-[#1D1D1F] hover:bg-[#333336] text-white font-medium text-sm transition-colors cursor-pointer disabled:opacity-50 mt-1"
                        >
                            {isLoading ? "Signing in..." : "Sign in"}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="relative flex items-center justify-center my-3">
                        <div className="w-full border-t border-[#F0F0F2]" />
                        <span className="absolute px-2.5 bg-white text-[11px] text-[#86868B]">
                            or
                        </span>
                    </div>

                    {/* Google OAuth Button */}
                    <button
                        type="button"
                        onClick={handleGoogleLogin}
                        disabled={isGoogleLoading}
                        className="w-full py-2.5 px-4 bg-white hover:bg-[#F5F5F7] border border-[#E5E5EA] text-[#1D1D1F] font-medium text-xs rounded-full transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                    >
                        <svg className="w-4 h-4" viewBox="0 0 24 24">
                            <path
                                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                                fill="#4285F4"
                            />
                            <path
                                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                                fill="#34A853"
                            />
                            <path
                                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                                fill="#FBBC05"
                            />
                            <path
                                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                                fill="#EA4335"
                            />
                        </svg>
                        <span>Continue with Google</span>
                    </button>

                    <p className="text-center text-xs text-[#6E6E73] pt-2 border-t border-[#F0F0F2]">
                        Don&apos;t have an account?{" "}
                        <Link
                            href="/signup"
                            className="text-[#1D1D1F] font-semibold hover:underline"
                        >
                            Sign up
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
