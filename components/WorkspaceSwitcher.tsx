"use client";

import { useState } from "react";
import { useWorkspace } from "@/context/WorkspaceContext";
import { CreateWorkspaceModal } from "./CreateWorkspaceModal";

export function WorkspaceSwitcher() {
    const { workspaces, currentWorkspace, setCurrentWorkspace, loading } = useWorkspace();
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (loading) {
        return <div className="skeleton w-32 h-10 rounded-lg"></div>;
    }

    if (!currentWorkspace) return null;

    return (
        <>
            <div className="dropdown dropdown-end">
                <div tabIndex={0} role="button" className="btn btn-ghost m-1">
                    {currentWorkspace.name}
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    >
                        <path d="m6 9 6 6 6-6" />
                    </svg>
                </div>
                <ul
                    tabIndex={0}
                    className="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-52"
                >
                    {workspaces.map((ws) => (
                        <li key={ws.id}>
                            <button
                                className={ws.id === currentWorkspace.id ? "active" : ""}
                                onClick={() => {
                                    setCurrentWorkspace(ws);
                                    // Close dropdown by blurring active element safely if needed, 
                                    // or just let DaisyUI CSS handle hover/focus.
                                    // For click, we might need to remove focus manually to close it:
                                    const elem = document.activeElement as HTMLElement;
                                    if (elem) elem.blur();
                                }}
                            >
                                {ws.name}
                                {ws.is_default && <span className="badge badge-xs badge-ghost ml-2">Default</span>}
                            </button>
                        </li>
                    ))}
                    <div className="divider my-1"></div>
                    <li>
                        <button onClick={() => setIsModalOpen(true)}>
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                width="16"
                                height="16"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M5 12h14" />
                                <path d="M12 5v14" />
                            </svg>
                            Create Workspace
                        </button>
                    </li>
                </ul>
            </div>

            {isModalOpen && (
                <CreateWorkspaceModal onClose={() => setIsModalOpen(false)} />
            )}
        </>
    );
}
