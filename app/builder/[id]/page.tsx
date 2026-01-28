import { Sidebar } from "@/components/builder/Sidebar";
import { Canvas } from "@/components/builder/Canvas";
import { PropertiesPanel } from "@/components/builder/PropertiesPanel";

export default async function BuilderPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    return (
        <div className="flex h-[calc(100vh-theme(spacing.16))] w-full">
            <Sidebar />
            <Canvas />
            <PropertiesPanel />
        </div>
    );
}
