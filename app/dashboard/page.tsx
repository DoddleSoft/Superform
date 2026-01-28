"use client";

import { useWorkspace } from "@/context/WorkspaceContext";

export default function Dashboard() {
    const { currentWorkspace, loading } = useWorkspace();

    if (loading) {
        return <div className="loading loading-spinner loading-lg"></div>;
    }

    return (
        <div>
            <h2 className="text-2xl font-bold mb-4">
                Dashboard for {currentWorkspace?.name}
            </h2>
            <div className="stats shadow">
                <div className="stat">
                    <div className="stat-title">Forms</div>
                    <div className="stat-value">0</div>
                    <div className="stat-desc">Create your first form</div>
                </div>
            </div>
        </div>
    );
}
