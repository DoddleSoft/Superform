"use client";

import { FormBuilderProvider } from "@/context/FormBuilderContext";
import { ToastProvider } from "@/context/ToastContext";

export default function BuilderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ToastProvider>
            <FormBuilderProvider>{children}</FormBuilderProvider>
        </ToastProvider>
    );
}

