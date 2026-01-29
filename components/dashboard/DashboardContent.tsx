"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@clerk/nextjs";
import { getForms, getFormStats, deleteForm, duplicateForm } from "@/actions/form";
import { FormCard } from "./FormCard";
import { EditFormModal } from "./EditFormModal";
import { ConfirmModal } from "./ConfirmModal";
import { CreateFormModal } from "@/components/CreateFormModal";
import { AnimatePresence, motion } from "framer-motion";
import { FiPlus, FiSearch, FiChevronLeft, FiChevronRight } from "react-icons/fi";
import type { FormWithStats, PaginatedResponse } from "@/types/form-builder";

const PAGE_SIZE = 9;

export function DashboardContent() {
    const { currentWorkspace, loading: workspaceLoading } = useWorkspace();
    const { user } = useUser();
    const { success, error } = useToast();

    // Data state
    const [formsData, setFormsData] = useState<PaginatedResponse<FormWithStats> | null>(null);
    const [stats, setStats] = useState<{ totalForms: number; totalSubmissions: number } | null>(null);
    const [loading, setLoading] = useState(true);

    // Pagination & search
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<FormWithStats | null>(null);
    const [deletingForm, setDeletingForm] = useState<FormWithStats | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1); // Reset to first page on search
        }, 300);
        return () => clearTimeout(timer);
    }, [search]);

    // Fetch forms
    const fetchForms = useCallback(async () => {
        if (!currentWorkspace) return;

        setLoading(true);
        try {
            const [formsResult, statsResult] = await Promise.all([
                getForms({
                    workspaceId: currentWorkspace.id,
                    page,
                    pageSize: PAGE_SIZE,
                    search: debouncedSearch,
                }),
                getFormStats(currentWorkspace.id),
            ]);
            setFormsData(formsResult);
            setStats(statsResult);
        } catch (err: any) {
            console.error("Error fetching forms:", err);
            error("Failed to load forms");
        } finally {
            setLoading(false);
        }
    }, [currentWorkspace, page, debouncedSearch, error]);

    useEffect(() => {
        fetchForms();
    }, [fetchForms]);

    // Reset page when workspace changes
    useEffect(() => {
        setPage(1);
        setSearch("");
    }, [currentWorkspace?.id]);

    // Handle form actions
    const handleDuplicate = async (form: FormWithStats) => {
        if (!user) return;

        try {
            await duplicateForm(form.id, user.id);
            success(`"${form.name}" duplicated successfully`);
            fetchForms();
        } catch (err: any) {
            console.error("Error duplicating form:", err);
            error(err.message || "Failed to duplicate form");
        }
    };

    const handleDelete = async () => {
        if (!deletingForm) return;

        try {
            await deleteForm(deletingForm.id);
            success(`"${deletingForm.name}" deleted successfully`);
            setDeletingForm(null);
            fetchForms();
        } catch (err: any) {
            console.error("Error deleting form:", err);
            error(err.message || "Failed to delete form");
        }
    };

    const handleEditSuccess = (updatedForm: FormWithStats) => {
        setFormsData((prev) => {
            if (!prev) return prev;
            return {
                ...prev,
                data: prev.data.map((f) =>
                    f.id === updatedForm.id ? updatedForm : f
                ),
            };
        });
    };

    // Loading state
    if (workspaceLoading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <span className="loading loading-spinner loading-lg"></span>
            </div>
        );
    }

    const forms = formsData?.data || [];
    const totalPages = formsData?.totalPages || 1;

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-2xl font-bold">{currentWorkspace?.name}</h1>
                    <p className="text-base-content/60">Manage your forms and responses</p>
                </div>
                <button
                    className="btn btn-primary"
                    onClick={() => setIsCreateModalOpen(true)}
                >
                    <FiPlus className="w-5 h-5" />
                    Create Form
                </button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="stat bg-base-100 shadow rounded-box border border-base-200"
                >
                    <div className="stat-figure text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                    </div>
                    <div className="stat-title">Total Forms</div>
                    <div className="stat-value text-primary">{stats?.totalForms ?? "-"}</div>
                    <div className="stat-desc">In this workspace</div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="stat bg-base-100 shadow rounded-box border border-base-200"
                >
                    <div className="stat-figure text-secondary">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                    </div>
                    <div className="stat-title">Total Responses</div>
                    <div className="stat-value text-secondary">{stats?.totalSubmissions ?? "-"}</div>
                    <div className="stat-desc">Across all forms</div>
                </motion.div>
            </div>

            {/* Search and Forms Section */}
            <div className="space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-xl font-semibold">Your Forms</h2>
                    
                    {/* Search */}
                    <div className="relative w-full sm:w-72">
                        <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40" />
                        <input
                            type="text"
                            placeholder="Search forms..."
                            className="input input-bordered w-full pl-10"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                </div>

                {/* Forms Grid */}
                {loading ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {[...Array(6)].map((_, i) => (
                            <div key={i} className="card bg-base-100 shadow border border-base-200">
                                <div className="card-body">
                                    <div className="skeleton h-6 w-3/4 mb-2"></div>
                                    <div className="skeleton h-4 w-full"></div>
                                    <div className="skeleton h-4 w-2/3"></div>
                                    <div className="flex justify-between mt-4">
                                        <div className="skeleton h-4 w-24"></div>
                                        <div className="skeleton h-6 w-16 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : forms.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-16 bg-base-100 rounded-box border border-base-200 border-dashed"
                    >
                        {debouncedSearch ? (
                            <>
                                <div className="text-6xl mb-4">🔍</div>
                                <h3 className="text-lg font-semibold mb-2">No forms found</h3>
                                <p className="text-base-content/60 mb-4">
                                    No forms match &quot;{debouncedSearch}&quot;
                                </p>
                                <button
                                    className="btn btn-ghost btn-sm"
                                    onClick={() => setSearch("")}
                                >
                                    Clear search
                                </button>
                            </>
                        ) : (
                            <>
                                <div className="text-6xl mb-4">📝</div>
                                <h3 className="text-lg font-semibold mb-2">No forms yet</h3>
                                <p className="text-base-content/60 mb-4">
                                    Create your first form to start collecting responses
                                </p>
                                <button
                                    className="btn btn-primary"
                                    onClick={() => setIsCreateModalOpen(true)}
                                >
                                    <FiPlus className="w-5 h-5" />
                                    Create Form
                                </button>
                            </>
                        )}
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <AnimatePresence mode="popLayout">
                                {forms.map((form) => (
                                    <FormCard
                                        key={form.id}
                                        form={form}
                                        onEdit={setEditingForm}
                                        onDuplicate={handleDuplicate}
                                        onDelete={setDeletingForm}
                                    />
                                ))}
                            </AnimatePresence>
                        </div>

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-2 mt-6">
                                <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    <FiChevronLeft className="w-5 h-5" />
                                    Previous
                                </button>
                                
                                <div className="join">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            className={`join-item btn btn-sm ${
                                                page === i + 1 ? "btn-primary" : ""
                                            }`}
                                            onClick={() => setPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className="btn btn-ghost btn-sm"
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                    <FiChevronRight className="w-5 h-5" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modals */}
            {isCreateModalOpen && (
                <CreateFormModal onClose={() => setIsCreateModalOpen(false)} />
            )}

            {editingForm && (
                <EditFormModal
                    form={editingForm}
                    onClose={() => setEditingForm(null)}
                    onSuccess={handleEditSuccess}
                />
            )}

            {deletingForm && (
                <ConfirmModal
                    title="Delete Form"
                    message={`Are you sure you want to delete "${deletingForm.name}"? This will permanently remove all submissions and cannot be undone.`}
                    confirmLabel="Delete"
                    variant="danger"
                    onConfirm={handleDelete}
                    onClose={() => setDeletingForm(null)}
                />
            )}
        </div>
    );
}
