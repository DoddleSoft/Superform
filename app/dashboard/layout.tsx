"use client";

import { UserButton } from "@clerk/nextjs";
import { WorkspaceProvider } from "@/context/WorkspaceContext";
import { WorkspaceSwitcher } from "@/components/WorkspaceSwitcher";
import { ThemeToggle } from "@/components/ThemeToggle";
import Link from "next/link";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <WorkspaceProvider>
            <div className="min-h-screen bg-base-100">
                <header className="navbar bg-base-100 shadow-sm border-b border-base-200 px-4">
                    <div className="flex-1">
                        <Link href="/dashboard" className="btn btn-ghost text-xl">
                            Superform
                        </Link>
                    </div>
                    <div className="flex-none gap-4">
                        <WorkspaceSwitcher />
                        <ThemeToggle />
                        <UserButton />
                    </div>
                </header>
                <main className="p-8">{children}</main>
            </div>
        </WorkspaceProvider>
    );
}
