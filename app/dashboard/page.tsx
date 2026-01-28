"use client";

import { useWorkspace } from "@/context/WorkspaceContext";
import { CreateFormModal } from "@/components/CreateFormModal";
import { useState, useEffect } from "react";
import { useSupabase } from "@/lib/supabaseClient";
import Link from "next/link";

export default function Dashboard() {
    const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
    const supabase = useSupabase();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [forms, setForms] = useState<any[]>([]);
    const [loadingForms, setLoadingForms] = useState(false);

    useEffect(() => {
        if (!currentWorkspace) return;

        const fetchForms = async () => {
            setLoadingForms(true);
            const { data, error } = await supabase
                .from("forms")
                .select("*")
                .eq("workspace_id", currentWorkspace.id)
                .order("created_at", { ascending: false });

            if (error) {
                console.error("Error fetching forms:", error);
            } else {
                setForms(data || []);
            }
            setLoadingForms(false);
        };

        fetchForms();
    }, [currentWorkspace, supabase]);

    if (workspaceLoading) {
        return <div className="loading loading-spinner loading-lg"></div>;
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold">
                    Dashboard for {currentWorkspace?.name}
                </h2>
                <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
                    Create Form
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="stat bg-base-100 shadow rounded-box border border-base-200">
                    <div className="stat-title">Total Forms</div>
                    <div className="stat-value">{forms.length}</div>
                    <div className="stat-desc">In current workspace</div>
                </div>
                {/* Placeholder stats */}
                <div className="stat bg-base-100 shadow rounded-box border border-base-200">
                    <div className="stat-title">Total Submissions</div>
                    <div className="stat-value">0</div>
                    <div className="stat-desc">Across all forms</div>
                </div>
            </div>

            <div className="divider my-8"></div>

            <h3 className="text-xl font-bold mb-4">Your Forms</h3>

            {loadingForms ? (
                <div className="loading loading-spinner"></div>
            ) : forms.length === 0 ? (
                <div className="text-center py-10 bg-base-100 rounded-box border border-base-200 border-dashed">
                    <p className="text-gray-500 mb-4">No forms created in this workspace yet.</p>
                    <button className="btn btn-sm btn-outline" onClick={() => setIsModalOpen(true)}>
                        Create your first form
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {forms.map((form) => (
                        <Link
                            href={`/builder/${form.id}`}
                            key={form.id}
                            className="card bg-base-100 shadow hover:shadow-md transition-shadow border border-base-200"
                        >
                            <div className="card-body">
                                <h2 className="card-title">{form.name}</h2>
                                <p className="text-sm text-gray-500 truncate">{form.description || "No description"}</p>
                                <div className="card-actions justify-end mt-4">
                                    <div className={`badge ${form.published ? 'badge-success' : 'badge-ghost'}`}>
                                        {form.published ? "Published" : "Draft"}
                                    </div>
                                </div>
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {isModalOpen && (
                <CreateFormModal onClose={() => setIsModalOpen(false)} />
            )}
        </div>
    );
}
