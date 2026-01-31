"use client";

import { FormBuilderProvider } from "@/context/FormBuilderContext";

export default function BuilderLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <FormBuilderProvider>{children}</FormBuilderProvider>
    );
}

