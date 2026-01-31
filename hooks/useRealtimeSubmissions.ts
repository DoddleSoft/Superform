"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient, SupabaseClient, RealtimeChannel } from "@supabase/supabase-js";
import { FormSubmission } from "@/types/submission";

// Create a singleton Supabase client for realtime to avoid multiple instances
let realtimeClient: SupabaseClient | null = null;

function getRealtimeClient(): SupabaseClient {
    if (!realtimeClient) {
        realtimeClient = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
                realtime: {
                    params: {
                        eventsPerSecond: 10,
                    },
                },
            }
        );
    }
    return realtimeClient;
}

export function useRealtimeSubmissions(
    formId: string,
    initialSubmissions: FormSubmission[]
) {
    const [submissions, setSubmissions] = useState<FormSubmission[]>(initialSubmissions);
    const [isConnected, setIsConnected] = useState(false);
    const channelRef = useRef<RealtimeChannel | null>(null);
    const formIdRef = useRef(formId);

    // Keep formId ref up to date
    useEffect(() => {
        formIdRef.current = formId;
    }, [formId]);

    // Update submissions when initialSubmissions changes (e.g., page refresh)
    useEffect(() => {
        setSubmissions(initialSubmissions);
    }, [initialSubmissions]);

    // Handle realtime payload
    const handleRealtimePayload = useCallback((payload: any) => {
        console.log('[Realtime] Received payload:', payload);
        
        const { eventType, new: newRecord, old: oldRecord } = payload;
        const currentFormId = formIdRef.current;

        if (eventType === 'INSERT') {
            const newSubmission = newRecord as FormSubmission;
            // Filter by form_id since we're listening to all changes
            if (newSubmission.form_id !== currentFormId) {
                console.log('[Realtime] Ignoring INSERT for different form:', newSubmission.form_id);
                return;
            }
            console.log('[Realtime] Processing INSERT:', newSubmission.id);
            setSubmissions((prev) => {
                // Check if already exists (avoid duplicates)
                if (prev.some((s) => s.id === newSubmission.id)) {
                    return prev;
                }
                // Add to the beginning (newest first)
                return [newSubmission, ...prev];
            });
        } else if (eventType === 'UPDATE') {
            const updatedSubmission = newRecord as FormSubmission;
            if (updatedSubmission.form_id !== currentFormId) {
                return;
            }
            console.log('[Realtime] Processing UPDATE:', updatedSubmission.id);
            setSubmissions((prev) =>
                prev.map((s) =>
                    s.id === updatedSubmission.id ? updatedSubmission : s
                )
            );
        } else if (eventType === 'DELETE') {
            const deletedId = (oldRecord as { id: string })?.id;
            if (deletedId) {
                console.log('[Realtime] Processing DELETE:', deletedId);
                setSubmissions((prev) => prev.filter((s) => s.id !== deletedId));
            }
        }
    }, []);

    useEffect(() => {
        // Don't setup realtime if formId is empty
        if (!formId) {
            console.log('[Realtime] No formId, skipping setup');
            return;
        }

        // If we already have a channel for this formId, don't recreate
        if (channelRef.current) {
            console.log('[Realtime] Channel already exists, skipping setup');
            return;
        }

        console.log('[Realtime] Setting up subscription for formId:', formId);

        const supabase = getRealtimeClient();
        const channelName = `form_submissions_${formId}_${Date.now()}`;

        // Setup realtime subscription
        const channel = supabase
            .channel(channelName)
            .on(
                'postgres_changes' as any,
                {
                    event: '*',
                    schema: 'public',
                    table: 'form_submissions',
                },
                handleRealtimePayload
            )
            .subscribe((status, err) => {
                console.log('[Realtime] Subscription status:', status, err || '');
                setIsConnected(status === 'SUBSCRIBED');
            });

        channelRef.current = channel;

        // Cleanup on unmount
        return () => {
            console.log('[Realtime] Cleaning up subscription');
            if (channelRef.current) {
                supabase.removeChannel(channelRef.current);
                channelRef.current = null;
            }
            setIsConnected(false);
        };
    }, [formId, handleRealtimePayload]);

    return { submissions, isConnected };
}
