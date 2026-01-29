"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { AIChatSidebar } from "./AIChatSidebar";
import { useAIChat } from "@/context/AIChatContext";
import { motion, AnimatePresence } from "@/lib/animations";
import { BsStars } from "react-icons/bs";
import { LuLayoutGrid } from "react-icons/lu";

export type LeftPanelTab = "components" | "ai";

export function LeftPanel() {
    const { isSidebarOpen, openSidebar, closeSidebar } = useAIChat();
    const [activePanel, setActivePanel] = useState<LeftPanelTab>("components");

    const handleTabChange = (tab: LeftPanelTab) => {
        setActivePanel(tab);
        if (tab === "ai") {
            openSidebar();
        } else {
            closeSidebar();
        }
    };

    return (
        <div className="h-full flex flex-col bg-base-100 border-r border-base-200 overflow-hidden">
            {/* Tab Switcher */}
            <div className="flex border-b border-base-200 shrink-0">
                <button
                    onClick={() => handleTabChange("components")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all ${
                        activePanel === "components"
                            ? "bg-base-100 text-primary border-b-2 border-primary"
                            : "bg-base-200/50 text-base-content/60 hover:text-base-content hover:bg-base-200"
                    }`}
                >
                    <LuLayoutGrid className="w-4 h-4" />
                    <span>Components</span>
                </button>
                <button
                    onClick={() => handleTabChange("ai")}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 px-4 text-sm font-medium transition-all ${
                        activePanel === "ai"
                            ? "bg-base-100 text-primary border-b-2 border-primary"
                            : "bg-base-200/50 text-base-content/60 hover:text-base-content hover:bg-base-200"
                    }`}
                >
                    <BsStars className="w-4 h-4" />
                    <span>AI Builder</span>
                </button>
            </div>

            {/* Panel Content */}
            <div className="flex-1 overflow-hidden relative">
                <AnimatePresence mode="wait">
                    {activePanel === "components" && (
                        <motion.div
                            key="components"
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0"
                        >
                            <Sidebar />
                        </motion.div>
                    )}
                    {activePanel === "ai" && (
                        <motion.div
                            key="ai"
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 10 }}
                            transition={{ duration: 0.2 }}
                            className="absolute inset-0"
                        >
                            <AIChatSidebar />
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}
