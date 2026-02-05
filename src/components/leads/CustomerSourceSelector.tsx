import { cn } from "@/lib/utils";
import {
    ChevronDown,
    ChevronRight,
    SettingsIcon,
    UsersIcon,
} from "lucide-react";

import Image from "next/image";
import React, { useState } from "react";

interface CustomerSource {
    id: string;
    name: string;
    icon?: React.ReactNode;
    count: number;
    color?: string;
    children?: CustomerSource[]; // 👈 submenu support
}

const customerSources: CustomerSource[] = [
    {
        id: "potential",
        name: "Khách hàng tiềm năng",
        icon: <UsersIcon className="size-4" />,
        count: 15,
        color: "text-blue-600",
    },
    {
        id: "messenger",
        name: "Messenger",
        icon: (
            <Image
                src="/icons/messenger.svg"
                alt="Messenger"
                width={16}
                height={16}
            />
        ),
        count: 8,
        color: "text-blue-500",
    },
    {
        id: "zalo",
        name: "Zalo OA",
        icon: <Image src="/icons/zalo.svg" alt="Zalo" width={16} height={16} />,
        count: 5,
        color: "text-blue-400",
    },
    {
        id: "configs",
        name: "Cấu hình",
        icon: <SettingsIcon className="size-4" />,
        count: 5,
        color: "text-blue-400",
        children: [
            {
                id: "config-messenger",
                name: "Messenger",
                icon: (
                    <Image
                        src="/icons/messenger.svg"
                        alt="Messenger"
                        width={16}
                        height={16}
                    />
                ),
                count: 0,
            },
            {
                id: "config-zalo",
                name: "Zalo OA",
                icon: (
                    <Image
                        src="/icons/zalo.svg"
                        alt="Zalo"
                        width={16}
                        height={16}
                    />
                ),
                count: 0,
            },
        ],
    },
];

interface CustomerSourceSelectorProps {
    onSourceChange?: (sourceId: string) => void;
}

export default function CustomerSourceSelector({
    onSourceChange,
}: CustomerSourceSelectorProps) {
    const [selectedSource, setSelectedSource] = useState<string>("potential");
    const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
        {}
    );
    const toggleExpand = (id: string) => {
        setExpandedMenus((prev) => ({
            ...prev,
            [id]: !prev[id],
        }));
    };

    const handleSourceSelect = (sourceId: string) => {
        setSelectedSource(sourceId);
        onSourceChange?.(sourceId);
    };

    return (
        <div className="w-64 border-r bg-background h-full overflow-y-auto">
            <div className="p-3">
                <h3 className="text-sm font-medium text-foreground mb-3">
                    Nguồn khách hàng
                </h3>
                <ul className="space-y-1">
                    {customerSources.map((source) => {
                        const isExpanded = expandedMenus[source.id];
                        const hasChildren = !!source.children?.length;

                        return (
                            <li key={source.id}>
                                <div className="flex flex-col">
                                    <button
                                        onClick={() =>
                                            hasChildren
                                                ? toggleExpand(source.id)
                                                : handleSourceSelect(source.id)
                                        }
                                        className={cn(
                                            "w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm hover:bg-muted transition-colors",
                                            selectedSource === source.id &&
                                                "bg-sidebar-accent/60 dark:bg-sidebar-accent/20"
                                        )}
                                    >
                                        <span
                                            className={cn(
                                                "shrink-0",
                                                source.color
                                            )}
                                        >
                                            {source.icon}
                                        </span>
                                        <span className="flex-1 truncate">
                                            {source.name}
                                        </span>

                                        {hasChildren ? (
                                            isExpanded ? (
                                                <ChevronDown className="w-4 h-4 text-muted-foreground" />
                                            ) : (
                                                <ChevronRight className="w-4 h-4 text-muted-foreground" />
                                            )
                                        ) : (
                                            <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                                                {source.count}
                                            </span>
                                        )}
                                    </button>

                                    {/* Submenu */}
                                    {hasChildren && isExpanded && (
                                        <ul className="ml-6 mt-1 space-y-1">
                                            {source.children!.map((child) => (
                                                <li key={child.id}>
                                                    <button
                                                        onClick={() =>
                                                            handleSourceSelect(
                                                                child.id
                                                            )
                                                        }
                                                        className={cn(
                                                            "w-full text-left text-sm p-2 rounded hover:bg-muted transition-colors",
                                                            selectedSource ===
                                                                child.id &&
                                                                "bg-sidebar-accent/60 dark:bg-sidebar-accent/20"
                                                        )}
                                                    >
                                                        <div className="flex items-center gap-2">
                                                            <span
                                                                className={cn(
                                                                    "shrink-0",
                                                                    child.color
                                                                )}
                                                            >
                                                                {child.icon}
                                                            </span>
                                                            {child.name}
                                                        </div>
                                                    </button>
                                                </li>
                                            ))}
                                        </ul>
                                    )}
                                </div>
                            </li>
                        );
                    })}
                </ul>
            </div>
        </div>
    );
}
