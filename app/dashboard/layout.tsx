"use client";

import { useState } from "react";
import { UserButton } from "@clerk/nextjs";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { ThemeToggle } from "@/components/ThemeToggle";
import { WorkspaceSettingsModal } from "@/components/dashboard";
import Link from "next/link";
import { FiMenu, FiX, FiSettings, FiHome } from "react-icons/fi";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

    return (
        <WorkspaceProvider>
            <div className="min-h-screen bg-base-200">
                {/* Top Header Bar */}
                <header className="bg-base-100 border-b border-base-200 sticky top-0 z-40">
                    <div className="flex items-center justify-between h-14 px-4 lg:px-6 max-w-7xl mx-auto">
                        <div className="flex items-center gap-3">
                            {/* Mobile menu button */}
                            <button
                                className="p-2 rounded-lg text-base-content/60 hover:text-base-content hover:bg-base-200 lg:hidden transition-colors"
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
                                <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center shadow-sm">
                                    <svg className="w-4 h-4 text-primary-content" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                                    </svg>
                                </div>
                            </Link>
                        </div>

                        <div className="flex items-center gap-2">
                            {/* Buy PRO Button */}
                            <button disabled className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-primary to-primary/90 text-primary-content text-sm font-medium rounded-lg shadow-sm hover:shadow transition-shadow disabled:opacity-50 disabled:cursor-not-allowed">
                                Try PRO
                            </button>

                            <ThemeToggle />

                            {/* User Info */}
                            <div className="hidden sm:flex items-center gap-2 pl-2">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                            <div className="sm:hidden">
                                <UserButton afterSignOutUrl="/" />
                            </div>
                        </div>
                    </div>
                </header>

                {/* Mobile menu drawer */}
                {isMobileMenuOpen && (
                    <div className="lg:hidden fixed inset-0 z-30 bg-base-100">
                        <div className="p-4 pt-20">
                            <div className="space-y-1">
                                <Link
                                    href="/dashboard"
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base-content hover:bg-base-200 transition-colors"
                                    onClick={() => setIsMobileMenuOpen(false)}
                                >
                                    <FiHome className="w-5 h-5" />
                                    Dashboard
                                </Link>
                                <button
                                    className="flex items-center gap-3 px-4 py-3 rounded-xl text-base-content hover:bg-base-200 transition-colors w-full"
                                    onClick={() => {
                                        setIsMobileMenuOpen(false);
                                        setIsSettingsModalOpen(true);
                                    }}
                                >
                                    <FiSettings className="w-5 h-5" />
                                    Workspace Settings
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Main content */}
                <main className="px-4 md:px-6 lg:px-8 py-6 max-w-7xl mx-auto">
                    {children}
                </main>

                {/* Modals */}
                {isSettingsModalOpen && (
                    <WorkspaceSettingsModal
                        onClose={() => setIsSettingsModalOpen(false)}
                    />
                )}
            </div>
        </WorkspaceProvider>
    );
}
