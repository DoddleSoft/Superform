"use client";

import { useState, useEffect, useCallback } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { useToast } from "@/context/ToastContext";
import { useUser } from "@clerk/nextjs";
import { getForms, getFormStats, deleteForm, duplicateForm } from "@/actions/form";
import { FormCard } from "./FormCard";
import { EditFormModal } from "./EditFormModal";
import { ConfirmModal } from "./ConfirmModal";

import { CreateWorkspaceModal } from "@/components/CreateWorkspaceModal";
import { WorkspaceSettingsModal } from "./WorkspaceSettingsModal";
import { AnimatePresence, motion } from "framer-motion";
import { LuPlus, LuSearch, LuChevronLeft, LuChevronRight, LuChevronDown, LuFolder, LuFileText, LuSparkles, LuArrowUpDown, LuSettings, LuLoader } from "react-icons/lu";
import { useRouter } from "next/navigation";
import { createForm } from "@/actions/form";
import type { FormWithStats, PaginatedResponse } from "@/types/form-builder";

const PAGE_SIZE = 12;

type SortOption = "name-asc" | "name-desc" | "date-asc" | "date-desc" | "responses-desc";
const STORAGE_KEY = "superform-dashboard-sort";

export function DashboardContent() {
    const { currentWorkspace, workspaces, setCurrentWorkspace, loading: workspaceLoading } = useWorkspace();
    const { user } = useUser();
    const { success, error } = useToast();
    const router = useRouter();

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

    // Load sort preference
    useEffect(() => {
        const savedSort = localStorage.getItem(STORAGE_KEY);
        if (savedSort) {
            // Simple validation could be added here
            setSortBy(savedSort as SortOption);
        }
    }, []);

    const handleSortChange = (option: SortOption) => {
        setSortBy(option);
        localStorage.setItem(STORAGE_KEY, option);
        const elem = document.activeElement as HTMLElement;
        if (elem) {
            elem.blur();
        }
    };

    // Modal state
    const [isCreating, setIsCreating] = useState(false);
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
            
            // Handle case where current page is now empty but forms exist on other pages
            // (e.g., after deleting the last form on page 2)
            if (formsResult.data.length === 0 && formsResult.total > 0 && page > 1) {
                // Calculate the correct page to navigate to
                const lastValidPage = Math.ceil(formsResult.total / PAGE_SIZE);
                setPage(Math.min(page - 1, lastValidPage));
                return; // The page change will trigger a new fetch
            }
            
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

    const handleCreateForm = async () => {
        if (!user || !currentWorkspace) return;

        setIsCreating(true);
        try {
            const newForm = await createForm(
                currentWorkspace.id,
                user.id,
                "Untitled Form"
            );

            // Navigate to builder with new flag
            router.push(`/builder/${newForm.id}?new=true`);
        } catch (err: any) {
            console.error("Error creating form:", err);
            error(err.message || "Failed to create form");
            setIsCreating(false);
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
                <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    const forms = formsData?.data || [];
    const sortedForms = sortForms(forms);
    const totalPages = formsData?.totalPages || 1;

    return (
        <div className="space-y-6">
            {/* Workspace Bar */}
            <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 p-4">
                    <div className="flex items-center gap-2">
                        {/* Workspace Dropdown */}
                        <div className="dropdown">
                            <label tabIndex={0} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-200/60 hover:bg-base-200 cursor-pointer transition-colors">
                                <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
                                    <LuFolder className="w-4 h-4 text-primary" />
                                </div>
                                <span className="font-medium text-sm">{currentWorkspace?.name || "Select Workspace"}</span>
                                <LuChevronDown className="w-4 h-4 text-base-content/40" />
                            </label>
                            <ul tabIndex={0} className="dropdown-content z-[1] mt-2 p-1.5 shadow-lg bg-base-100 rounded-xl w-56 border border-base-200">
                                {workspaces.map((ws) => (
                                    <li key={ws.id}>
                                        <button
                                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${ws.id === currentWorkspace?.id ? "bg-primary/10 text-primary" : "hover:bg-base-200 text-base-content"
                                                }`}
                                            onClick={() => {
                                                setCurrentWorkspace(ws);
                                                const elem = document.activeElement as HTMLElement;
                                                if (elem) elem.blur();
                                            }}
                                        >
                                            <LuFolder className="w-4 h-4" />
                                            <span className="flex-1 text-left">{ws.name}</span>
                                            {ws.is_default && (
                                                <span className="text-xs text-base-content/40 bg-base-200 px-1.5 py-0.5 rounded">Default</span>
                                            )}
                                        </button>
                                    </li>
                                ))}
                                <li className="my-1 border-t border-base-200"></li>
                                <li>
                                    <button
                                        className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-primary hover:bg-primary/10 transition-colors"
                                        onClick={() => setIsWorkspaceModalOpen(true)}
                                    >
                                        <LuPlus className="w-4 h-4" />
                                        Create Workspace
                                    </button>
                                </li>
                            </ul>
                        </div>

                        {/* Workspace Menu */}
                        <button
                            className="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
                            onClick={() => setIsSettingsModalOpen(true)}
                            title="Workspace settings"
                        >
                            <LuSettings className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Right side controls */}
                    <div className="flex items-center gap-2 w-full sm:w-auto">
                        {/* Search */}
                        {showSearch ? (
                            <div className="relative flex-1 sm:w-64">
                                <LuSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-base-content/40 w-4 h-4" />
                                <input
                                    type="text"
                                    placeholder="Search forms..."
                                    className="w-full pl-9 pr-4 py-2 bg-base-200/60 border-0 rounded-xl text-sm placeholder:text-base-content/40 focus:outline-none focus:ring-2 focus:ring-primary/20"
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
                                className="p-2 rounded-lg text-base-content/50 hover:text-base-content hover:bg-base-200 transition-colors"
                                onClick={() => setShowSearch(true)}
                            >
                                <LuSearch className="w-4 h-4" />
                            </button>
                        )}

                        {/* Sort Dropdown */}
                        <div className="dropdown dropdown-end">
                            <label tabIndex={0} className="flex items-center gap-2 px-3 py-2 rounded-xl bg-base-200/60 hover:bg-base-200 cursor-pointer text-sm transition-colors">
                                <LuArrowUpDown className="w-3.5 h-3.5 text-base-content/50" />
                                <span className="hidden sm:inline">{getSortLabel()}</span>
                                <LuChevronDown className="w-3.5 h-3.5 text-base-content/40" />
                            </label>
                            <ul tabIndex={0} className="dropdown-content z-[1] mt-2 p-1.5 shadow-lg bg-base-100 rounded-xl w-48 border border-base-200">
                                {[
                                    { value: "name-asc", label: "Name (A → Z)" },
                                    { value: "name-desc", label: "Name (Z → A)" },
                                    { value: "date-desc", label: "Newest first" },
                                    { value: "date-asc", label: "Oldest first" },
                                    { value: "responses-desc", label: "Most responses" },
                                ].map((option) => (
                                    <li key={option.value}>
                                        <button
                                            className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${sortBy === option.value ? "bg-primary/10 text-primary" : "hover:bg-base-200 text-base-content"
                                                }`}
                                            onClick={() => handleSortChange(option.value as SortOption)}
                                        >
                                            {option.label}
                                        </button>
                                    </li>
                                ))}
                            </ul>
                        </div>

                        {/* New Form Button */}
                        <button
                            className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-content text-sm font-medium rounded-xl shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-70 disabled:cursor-wait"
                            onClick={handleCreateForm}
                            disabled={isCreating}
                        >
                            {isCreating ? (
                                <LuLoader className="w-4 h-4 animate-spin" />
                            ) : (
                                <LuPlus className="w-4 h-4" />
                            )}
                            <span className="hidden sm:inline">{isCreating ? "Creating..." : "New Form"}</span>
                        </button>
                    </div>
                </div>
            </div>

            {/* Forms Grid */}
            {
                loading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                        {[...Array(8)].map((_, i) => (
                            <div key={i} className="aspect-[4/3] rounded-2xl bg-base-100 border border-base-200 animate-pulse"></div>
                        ))}
                    </div>
                ) : sortedForms.length === 0 ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="flex items-center justify-center py-16"
                    >
                        <div className="bg-base-100 rounded-2xl border border-base-200 shadow-sm p-8 text-center max-w-md">
                            {debouncedSearch ? (
                                <>
                                    <div className="w-14 h-14 bg-gradient-to-br from-base-200 to-base-300 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                        <LuSearch className="w-7 h-7 text-base-content/40" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-base-content mb-2">No forms found</h3>
                                    <p className="text-sm text-base-content/60 mb-6">
                                        No forms match &quot;{debouncedSearch}&quot;
                                    </p>
                                    <button
                                        className="px-4 py-2 rounded-lg text-sm font-medium text-base-content/70 hover:text-base-content hover:bg-base-200 transition-colors"
                                        onClick={() => setSearch("")}
                                    >
                                        Clear search
                                    </button>
                                </>
                            ) : (
                                <>
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mx-auto mb-5">
                                        <LuFileText className="w-7 h-7 text-primary" />
                                    </div>
                                    <h3 className="text-lg font-semibold text-base-content mb-2">No forms yet</h3>
                                    <p className="text-sm text-base-content/60 mb-6">
                                        Create your first form to start collecting responses
                                    </p>
                                    <button
                                        className="flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-content text-sm font-medium rounded-xl shadow-sm hover:bg-primary/90 transition-colors mx-auto disabled:opacity-70 disabled:cursor-wait"
                                        onClick={handleCreateForm}
                                        disabled={isCreating}
                                    >
                                        {isCreating ? (
                                            <LuLoader className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <LuPlus className="w-4 h-4" />
                                        )}
                                        {isCreating ? "Creating..." : "Create Form"}
                                    </button>
                                </>
                            )}
                        </div>
                    </motion.div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
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
                            <div className="flex justify-center items-center gap-1 mt-8">
                                <button
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === 1
                                        ? "text-base-content/30 cursor-not-allowed"
                                        : "text-base-content/70 hover:text-base-content hover:bg-base-100"
                                        }`}
                                    disabled={page === 1}
                                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                                >
                                    <LuChevronLeft className="w-4 h-4" />
                                    Previous
                                </button>

                                <div className="flex items-center gap-1 mx-2">
                                    {[...Array(totalPages)].map((_, i) => (
                                        <button
                                            key={i + 1}
                                            className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${page === i + 1
                                                ? "bg-primary text-primary-content"
                                                : "text-base-content/60 hover:bg-base-100"
                                                }`}
                                            onClick={() => setPage(i + 1)}
                                        >
                                            {i + 1}
                                        </button>
                                    ))}
                                </div>

                                <button
                                    className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${page === totalPages
                                        ? "text-base-content/30 cursor-not-allowed"
                                        : "text-base-content/70 hover:text-base-content hover:bg-base-100"
                                        }`}
                                    disabled={page === totalPages}
                                    onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                >
                                    Next
                                    <LuChevronRight className="w-4 h-4" />
                                </button>
                            </div>
                        )}
                    </>
                )
            }

            {/* Modals */}


            {
                isWorkspaceModalOpen && (
                    <CreateWorkspaceModal onClose={() => setIsWorkspaceModalOpen(false)} />
                )
            }

            {
                isSettingsModalOpen && (
                    <WorkspaceSettingsModal onClose={() => setIsSettingsModalOpen(false)} />
                )
            }

            {
                editingForm && (
                    <EditFormModal
                        form={editingForm}
                        onClose={() => setEditingForm(null)}
                        onSuccess={handleEditSuccess}
                    />
                )
            }

            {
                deletingForm && (
                    <ConfirmModal
                        title="Delete Form"
                        message={`Are you sure you want to delete "${deletingForm.name}"? This will permanently remove all submissions and cannot be undone.`}
                        confirmLabel="Delete"
                        variant="danger"
                        onConfirm={handleDelete}
                        onClose={() => setDeletingForm(null)}
                    />
                )
            }
        </div >
    );
}
