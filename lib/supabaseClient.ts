import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@clerk/nextjs";
import { useMemo } from "react";

export const useSupabase = () => {
    const { getToken } = useAuth();

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

    return useMemo(() => {
        return createClient(supabaseUrl, supabaseAnonKey, {
            global: {
                fetch: async (url, options = {}) => {
                    const clerkToken = await getToken();
                    const headers = new Headers(options?.headers);
                    headers.set("Authorization", `Bearer ${clerkToken}`);
                    return fetch(url, {
                        ...options,
                        headers,
                    });
                },
            },
        });
    }, [getToken, supabaseUrl, supabaseAnonKey]);
};
