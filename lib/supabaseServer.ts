import { createClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function createSupabaseServerClient() {
    const { getToken } = await auth();
    // The client implementation uses getToken() without a template.
    // We should match that here. If a template is needed in the future, it should be added to both.
    const token = await getToken();

    // Fallback to anon key if no token (e.g. public access?), but usually we need auth.
    // However, for public form viewing, we might assume anonymous access?
    // Actually, getFormContentByUrl should probably work without auth if published.
    // So we might need two clients: one potentially authenticated, one anon.

    const headers: Record<string, string> = {};
    if (token) {
        headers["Authorization"] = `Bearer ${token}`;
    }

    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            global: {
                headers,
            },
        }
    );
}

// For actions that must act as admin or bypass RLS, we would need SERVICE_ROLE_KEY, 
// but sticking to RLS with Clerk token is safer.
