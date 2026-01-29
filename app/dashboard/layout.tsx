"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { ToastProvider } from "@/context/ToastContext";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WorkspaceSettingsModal } from "@/components/dashboard";
import Link from "next/link";
import { FiMenu, FiX, FiSettings, FiHome, FiFileText } from "react-icons/fi";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    return (
        <WorkspaceProvider>
            <ToastProvider>
                <div className="min-h-screen bg-base-200/30">
                    {/* Navbar */}
                    <header className="navbar bg-base-100 shadow-sm border-b border-base-200 sticky top-0 z-40">
                        <div className="navbar-start">
                            {/* Mobile menu button */}
                            <button
                                className="btn btn-ghost btn-square lg:hidden"
                                onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            >
                                {isMobileMenuOpen ? (
                                    <FiX className="w-5 h-5" />
                                ) : (
                                    <FiMenu className="w-5 h-5" />
                                )}
                            </button>
                            
                            {/* Logo */}
                            <Link href="/dashboard" className="btn btn-ghost text-xl font-bold">
                                <span className="text-primary">Super</span>form
                            </Link>
                        </div>

                        {/* Desktop nav */}
                        <div className="navbar-center hidden lg:flex">
                            <ul className="menu menu-horizontal px-1 gap-1">
                                <li>
                                    <Link href="/dashboard" className="flex items-center gap-2">
                                        <FiHome className="w-4 h-4" />
                                        Dashboard
                                    </Link>
                                </li>
                            </ul>
                        </div>

                        <div className="navbar-end gap-2">
                            {/* Workspace Switcher - Hidden on mobile */}
                            <div className="hidden sm:block">
                                <WorkspaceSwitcher />
                            </div>
                            
                            {/* Workspace Settings */}
                            <button
                                className="btn btn-ghost btn-sm btn-square"
                                onClick={() => setIsSettingsModalOpen(true)}
                                title="Workspace Settings"
                            >
                                <FiSettings className="w-4 h-4" />
                            </button>
                            
                            <ThemeToggle />
                            <UserButton afterSignOutUrl="/" />
                        </div>
                    </header>

                    {/* Mobile menu drawer */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden fixed inset-0 z-30 bg-base-100">
                            <div className="p-4 pt-20">
                                {/* Mobile Workspace Switcher */}
                                <div className="mb-4">
                                    <p className="text-sm text-base-content/60 mb-2">Workspace</p>
                                    <WorkspaceSwitcher />
                                </div>
                                
                                <ul className="menu w-full gap-2">
                                    <li>
                                        <Link
                                            href="/dashboard"
                                            className="flex items-center gap-3 py-3"
                                            onClick={() => setIsMobileMenuOpen(false)}
                                        >
                                            <FiHome className="w-5 h-5" />
                                            Dashboard
                                        </Link>
                                    </li>
                                    <li>
                                        <button
                                            className="flex items-center gap-3 py-3"
                                            onClick={() => {
                                                setIsMobileMenuOpen(false);
                                                setIsSettingsModalOpen(true);
                                            }}
                                        >
                                            <FiSettings className="w-5 h-5" />
                                            Workspace Settings
                                        </button>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    )}

                    {/* Main content */}
                    <main className="p-4 md:p-6 lg:p-8 max-w-7xl mx-auto">
                        {children}
                    </main>

                    {/* Modals */}
                    {isSettingsModalOpen && (
                        <WorkspaceSettingsModal
                            onClose={() => setIsSettingsModalOpen(false)}
                        />
                    )}
                </div>
            </ToastProvider>
        </WorkspaceProvider>
    );
}
