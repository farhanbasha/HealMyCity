import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { cache } from "react";

export async function createClient() {
    const cookieStore = await cookies();

    return createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );
}

/**
 * Deduplicated Auth user fetch within the same request lifecycle.
 * Prevents layout and page from making multiple remote auth calls to Supabase.
 */
export const getCachedAuthUser = cache(async () => {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    return user;
});

/**
 * Deduplicated user profile fetch within the same request lifecycle.
 */
export const getCachedUserProfile = cache(async (userId: string) => {
    if (!userId) return null;
    const supabase = await createClient();
    const { data: profile } = await supabase
        .from("users")
        .select("*")
        .eq("id", userId)
        .single();
    return profile;
});

