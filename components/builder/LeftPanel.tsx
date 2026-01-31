"use client";

import { useState } from "react";
import { Sidebar } from "./Sidebar";
import { AIChatSidebar } from "./AIChatSidebar";
import { useAIChat } from "@/context/AIChatContext";
import { motion, AnimatePresence } from "@/lib/animations";
import { BsStars } from "react-icons/bs";
import { LuLayoutGrid, LuSparkles } from "react-icons/lu";

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
            <div className="p-3 border-b border-base-200 shrink-0">
                <div className="flex items-center bg-base-200/80 rounded-full p-1 gap-0.5">
                    <button
                        onClick={() => handleTabChange("components")}
                        className={`
                            flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium
                            rounded-full transition-all duration-200
                            ${activePanel === "components"
                                ? "bg-base-100 text-base-content shadow-sm"
                                : "text-base-content/50 hover:text-base-content"
                            }
                        `}
                    >
                        <LuLayoutGrid className="w-3.5 h-3.5" />
                        <span>Components</span>
                    </button>
                    <button
                        onClick={() => handleTabChange("ai")}
                        className={`
                            flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium
                            rounded-full transition-all duration-200
                            ${activePanel === "ai"
                                ? "bg-base-100 text-base-content shadow-sm"
                                : "text-base-content/50 hover:text-base-content"
                            }
                        `}
                    >
                        <LuSparkles className="w-3.5 h-3.5" />
                        <span>AI Builder</span>
                    </button>
                </div>
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
