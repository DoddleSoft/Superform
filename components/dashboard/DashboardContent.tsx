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
import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { WorkspaceSettingsModal } from "./WorkspaceSettingsModal";
import { AnimatePresence, motion } from "framer-motion";
import { FiPlus, FiSearch, FiChevronLeft, FiChevronRight, FiChevronDown, FiMoreVertical, FiFolder } from "react-icons/fi";
import type { FormWithStats, PaginatedResponse } from "@/types/form-builder";

const PAGE_SIZE = 12;

type SortOption = "name-asc" | "name-desc" | "date-asc" | "date-desc" | "responses-desc";

export function DashboardContent() {
    const { currentWorkspace, workspaces, setCurrentWorkspace, loading: workspaceLoading } = useWorkspace();
    const { user } = useUser();
    const { success, error } = useToast();

    // Data state
    const [formsData, setFormsData] = useState<PaginatedResponse<FormWithStats> | null>(null);
    const [stats, setStats] = useState<{ totalForms: number; totalSubmissions: number } | null>(null);
    const [loading, setLoading] = useState(true);

    // Pagination, search & sort
    const [page, setPage] = useState(1);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [showSearch, setShowSearch] = useState(false);
    const [sortBy, setSortBy] = useState<SortOption>("name-asc");

    // Modal state
    const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
    const [isWorkspaceModalOpen, setIsWorkspaceModalOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
    const [editingForm, setEditingForm] = useState<FormWithStats | null>(null);
    const [deletingForm, setDeletingForm] = useState<FormWithStats | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
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

    // Sort forms
    const sortForms = (forms: FormWithStats[]) => {
        const sorted = [...forms];
        switch (sortBy) {
            case "name-asc":
                return sorted.sort((a, b) => a.name.localeCompare(b.name));
            case "name-desc":
                return sorted.sort((a, b) => b.name.localeCompare(a.name));
            case "date-asc":
                return sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
            case "date-desc":
                return sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
            case "responses-desc":
                return sorted.sort((a, b) => b.submission_count - a.submission_count);
            default:
                return sorted;
        }
    };

    const getSortLabel = () => {
        switch (sortBy) {
            case "name-asc": return "Name (A → Z)";
            case "name-desc": return "Name (Z → A)";
            case "date-asc": return "Oldest first";
            case "date-desc": return "Newest first";
            case "responses-desc": return "Most responses";
            default: return "Sort";
        }
    };

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
    const sortedForms = sortForms(forms);
    const totalPages = formsData?.totalPages || 1;

    return (
        <div className="space-y-4">
            {/* Workspace Bar */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 py-2">
                <div className="flex items-center gap-3">
                    {/* Workspace Dropdown */}
                    <div className="dropdown">
                        <label tabIndex={0} className="btn btn-ghost gap-2 pl-2 pr-3 font-medium">
                            <FiFolder className="w-5 h-5 text-base-content/70" />
                            {currentWorkspace?.name || "Select Workspace"}
                            <FiChevronDown className="w-4 h-4 opacity-50" />
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-56 border border-base-200">
                            {workspaces.map((ws) => (
                                <li key={ws.id}>
                                    <button
                                        className={ws.id === currentWorkspace?.id ? "active" : ""}
                                        onClick={() => {
                                            setCurrentWorkspace(ws);
                                            const elem = document.activeElement as HTMLElement;
                                            if (elem) elem.blur();
                                        }}
                                    >
                                        <FiFolder className="w-4 h-4" />
                                        {ws.name}
                                        {ws.is_default && <span className="badge badge-xs badge-ghost ml-auto">Default</span>}
                                    </button>
                                </li>
                            ))}
                            <div className="divider my-1"></div>
                            <li>
                                <button onClick={() => setIsWorkspaceModalOpen(true)}>
                                    <FiPlus className="w-4 h-4" />
                                    Create Workspace
                                </button>
                            </li>
                        </ul>
                    </div>



                    {/* Workspace Menu */}
                    <div className="dropdown">
                        <label tabIndex={0} className="btn btn-ghost btn-sm btn-square">
                            <FiMoreVertical className="w-4 h-4" />
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-48 border border-base-200">
                            <li>
                                <button onClick={() => setIsSettingsModalOpen(true)}>
                                    Workspace Settings
                                </button>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Right side controls */}
                <div className="flex items-center gap-2 w-full sm:w-auto">
                    {/* Search */}
                    {showSearch ? (
                        <div className="relative flex-1 sm:w-64">
                            <FiSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
                            <input
                                type="text"
                                placeholder="Search forms..."
                                className="input input-bordered input-sm w-full pl-9"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                autoFocus
                                onBlur={() => {
                                    if (!search) setShowSearch(false);
                                }}
                            />
                        </div>
                    ) : (
                        <button
                            className="btn btn-ghost btn-sm btn-square"
                            onClick={() => setShowSearch(true)}
                        >
                            <FiSearch className="w-5 h-5" />
                        </button>
                    )}

                    {/* Sort Dropdown */}
                    <div className="dropdown dropdown-end">
                        <label tabIndex={0} className="btn btn-ghost btn-sm gap-2 font-normal border border-base-300">
                            {getSortLabel()}
                            <FiChevronDown className="w-4 h-4 opacity-50" />
                        </label>
                        <ul tabIndex={0} className="dropdown-content z-[1] menu p-2 shadow-lg bg-base-100 rounded-box w-48 border border-base-200">
                            <li><button className={sortBy === "name-asc" ? "active" : ""} onClick={() => setSortBy("name-asc")}>Name (A → Z)</button></li>
                            <li><button className={sortBy === "name-desc" ? "active" : ""} onClick={() => setSortBy("name-desc")}>Name (Z → A)</button></li>
                            <li><button className={sortBy === "date-desc" ? "active" : ""} onClick={() => setSortBy("date-desc")}>Newest first</button></li>
                            <li><button className={sortBy === "date-asc" ? "active" : ""} onClick={() => setSortBy("date-asc")}>Oldest first</button></li>
                            <li><button className={sortBy === "responses-desc" ? "active" : ""} onClick={() => setSortBy("responses-desc")}>Most responses</button></li>
                        </ul>
                    </div>

                    {/* New Form Button */}
                    <button
                        className="btn btn-primary btn-sm gap-2"
                        onClick={() => setIsCreateModalOpen(true)}
                    >
                        <FiPlus className="w-4 h-4" />
                        New Form
                    </button>
                </div>
            </div>

            {/* Forms Grid */}
            {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pt-4">
                    {[...Array(8)].map((_, i) => (
                        <div key={i} className="aspect-[4/3] rounded-xl skeleton"></div>
                    ))}
                </div>
            ) : sortedForms.length === 0 ? (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-20"
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
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 pt-4">
                        <AnimatePresence mode="popLayout">
                            {sortedForms.map((form, index) => (
                                <FormCard
                                    key={form.id}
                                    form={form}
                                    index={index}
                                    onEdit={setEditingForm}
                                    onDuplicate={handleDuplicate}
                                    onDelete={setDeletingForm}
                                />
                            ))}
                        </AnimatePresence>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-8">
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
                                        className={`join-item btn btn-sm ${page === i + 1 ? "btn-primary" : ""
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

            {/* Modals */}
            {isCreateModalOpen && (
                <CreateFormModal onClose={() => setIsCreateModalOpen(false)} />
            )}

            {isWorkspaceModalOpen && (
                <CreateWorkspaceModal onClose={() => setIsWorkspaceModalOpen(false)} />
            )}

            {isSettingsModalOpen && (
                <WorkspaceSettingsModal onClose={() => setIsSettingsModalOpen(false)} />
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
