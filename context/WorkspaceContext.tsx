"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react";
import { useSupabase } from "@/lib/supabaseClient";
import { useUser } from "@clerk/nextjs";

type Workspace = {
    id: string;
    user_id: string;
    name: string;
    is_default: boolean;
    created_at: string;
};

type WorkspaceContextType = {
    workspaces: Workspace[];
    currentWorkspace: Workspace | null;
    setCurrentWorkspace: (workspace: Workspace) => void;
    createWorkspace: (name: string) => Promise<void>;
    deleteWorkspace: (id: string) => Promise<void>;
    loading: boolean;
};

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
    const { user, isLoaded } = useUser();
    const supabase = useSupabase();
    const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
    const [currentWorkspace, setCurrentWorkspace] = useState<Workspace | null>(null);
    const [loading, setLoading] = useState(true);

    const initialized = useRef(false);

    useEffect(() => {
        if (!isLoaded || !user || initialized.current) return;
        initialized.current = true;

        const fetchWorkspaces = async () => {
            setLoading(true);
            try {
                const { data, error } = await supabase
                    .from("workspaces")
                    .select("*")
                    .order("created_at", { ascending: true });

                if (error) {
                    console.error("Error fetching workspaces:", error);
                    setLoading(false);
                    return;
                }

                if (data && data.length > 0) {
                    setWorkspaces(data);
                    setCurrentWorkspace(data[0]);
                } else {
                    await createDefaultWorkspace();
                }
            } catch (err) {
                console.error("Unexpected error:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchWorkspaces();
    }, [isLoaded, user]);

    const createDefaultWorkspace = async () => {
        if (!user) return;
        console.log("Creating default workspace for user:", user.id);

        const { data, error } = await supabase
            .from("workspaces")
            .insert([
                {
                    user_id: user.id,
                    name: "My Workspace",
                    is_default: true,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Error creating default workspace:", error);
            // Silent error - user will see empty workspace and can create one manually
        } else if (data) {
            console.log("Default workspace created:", data);
            setWorkspaces([data]);
            setCurrentWorkspace(data);
        }
    };

    const createWorkspace = async (name: string) => {
        if (!user) return;
        const { data, error } = await supabase
            .from("workspaces")
            .insert([
                {
                    user_id: user.id,
                    name: name,
                    is_default: false,
                },
            ])
            .select()
            .single();

        if (error) {
            console.error("Error creating workspace:", error);
            throw error;
        } else if (data) {
            setWorkspaces((prev) => [...prev, data]);
            setCurrentWorkspace(data); // Switch to new workspace
        }
    };

    const deleteWorkspace = async (id: string) => {
        const { error } = await supabase.from("workspaces").delete().eq("id", id);
        if (error) {
            console.error("Error deleting workspace:", error);
            throw error;
        }
        setWorkspaces((prev) => prev.filter((w) => w.id !== id));
        if (currentWorkspace?.id === id) {
            // If deleted current, switch to first available (or default logic)
            // Since we prevent deleting default, valid workspaces should remain.
            const remaining = workspaces.filter((w) => w.id !== id);
            if (remaining.length > 0) setCurrentWorkspace(remaining[0]);
        }
    };

    return (
        <WorkspaceContext.Provider
            value={{
                workspaces,
                currentWorkspace,
                setCurrentWorkspace,
                createWorkspace,
                deleteWorkspace,
                loading,
            }}
        >
            {children}
        </WorkspaceContext.Provider>
    );
}

export const useWorkspace = () => {
    const context = useContext(WorkspaceContext);
    if (context === undefined) {
        throw new Error("useWorkspace must be used within a WorkspaceProvider");
    }
    return context;
};
