"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { ToastProvider } from "@/context/ToastContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WorkspaceSettingsModal } from "@/components/dashboard";
import Link from "next/link";
import { FiMenu, FiX, FiSettings, FiHome, FiBell } from "react-icons/fi";

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
                <div className="min-h-screen bg-base-100">
                    {/* Top Header Bar */}
                    <header className="navbar bg-base-100 border-b border-base-200 sticky top-0 z-40 px-4 lg:px-6">
                        <div className="navbar-start gap-3">
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

                            {/* Logo Icon */}
                            <Link href="/dashboard" className="flex items-center gap-2">
                                <div className="w-9 h-9 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
                                    <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                </div>
                            </Link>


                        </div>

                        <div className="navbar-end gap-2">


                            {/* Buy PRO Button */}
                            <button className="btn btn-sm btn-primary px-4">
                                Try PRO
                            </button>



                            {/* Notifications */}
                            <button className="btn btn-ghost btn-sm btn-circle relative">
                                <FiBell className="w-5 h-5" />
                                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full"></span>
                            </button>

                            <ThemeToggle />

                            {/* User Info */}
                            <div className="hidden sm:flex items-center gap-2">
                                <span className="text-sm text-base-content/70">Hi, N</span>
                                <UserButton afterSignOutUrl="/" />
                            </div>
                            <div className="sm:hidden">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </div>
                    </header>

                    {/* Mobile menu drawer */}
                    {isMobileMenuOpen && (
                        <div className="lg:hidden fixed inset-0 z-30 bg-base-100">
                            <div className="p-4 pt-20">
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
                    <main className="px-4 md:px-6 lg:px-8 py-4 max-w-7xl mx-auto">
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
