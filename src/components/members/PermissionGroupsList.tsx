"use client";

import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/contexts/LanguageContext";
import { PermissionGroup } from "@/lib/interface";
import { Plus, Search, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import { Tooltip } from "../ui/tooltip";

interface PermissionGroupsListProps {
    currentOrg: any | null;
    permissionGroups: PermissionGroup[];
    selectedGroupId: string | null;
    onGroupSelect: (groupId: string) => void;
    searchQuery: string;
    onSearchChange: (query: string) => void;
    onAddPermission: () => void;
}

export default function PermissionGroupsList({
    currentOrg,
    permissionGroups,
    selectedGroupId,
    onGroupSelect,
    searchQuery,
    onSearchChange,
    onAddPermission,
}: PermissionGroupsListProps) {
    const [showSearch, setShowSearch] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const { t } = useLanguage();

    useEffect(() => {
        if (showSearch && inputRef.current) {
            inputRef.current.focus();
        }
    }, [showSearch]);

    const filteredGroups = permissionGroups.filter((group) =>
        group.name.toLowerCase().includes(searchQuery.toLowerCase()),
    );

    const organizationGroups = filteredGroups.filter(
        (g) => g.scope === "ORGANIZATION",
    );
    const workspaceGroups = filteredGroups.filter(
        (g) => g.scope === "WORKSPACE",
    );

    const [activeTab, setActiveTab] = useState("organization");

    const renderGroupItem = (group: PermissionGroup, color: string) => (
        <div
            key={group.id}
            className={`p-4 border-b border-gray-100 cursor-pointer transition-all duration-200 relative group last:border-0 ${
                selectedGroupId === group.id
                    ? "bg-blue-50/50"
                    : "hover:bg-gray-50/50 bg-transparent"
            }`}
            onClick={() => onGroupSelect(group.id)}
        >
            {/* Active Indicator Line */}
            {selectedGroupId === group.id && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-600 rounded-r"></div>
            )}

            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center shadow-sm`}
                >
                    <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h5 className="font-bold text-gray-900 truncate text-[15px]">
                        {group.name}
                    </h5>
                    <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-gray-500 font-medium">
                            {group.totalMembers} {t("member.count")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-transparent">
            {/* Tabs */}
            <Tabs defaultValue="organization" className="flex flex-col h-full">
                <div className="flex items-center justify-between px-4 pb-2 border-b border-gray-200/30">
                    <TabsList className="bg-transparent p-0 gap-6">
                        <TabsTrigger
                            value="organization"
                            className={`px-0 py-2 text-sm font-semibold bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none transition-all ${"data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 text-gray-500 hover:text-gray-800"}`}
                        >
                            {t("permission.organization")}
                        </TabsTrigger>
                        <TabsTrigger
                            value="workspace"
                            className={`px-0 py-2 text-sm font-semibold bg-transparent data-[state=active]:bg-transparent data-[state=active]:shadow-none rounded-none transition-all ${"data-[state=active]:text-blue-600 data-[state=active]:border-b-2 data-[state=active]:border-blue-600 text-gray-500 hover:text-gray-800"}`}
                        >
                            {t("permission.workspace")}
                        </TabsTrigger>
                    </TabsList>

                    {(currentOrg.type === "OWNER" ||
                        currentOrg.type === "ADMIN") && (
                        <Tooltip content={t("permission.addNew")}>
                            <Button
                                onClick={onAddPermission}
                                size="sm"
                                variant="ghost"
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50/50 p-2 h-auto"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </Tooltip>
                    )}
                </div>

                <div className="flex-1 overflow-hidden relative mt-2">
                    <TabsContent
                        value="organization"
                        className="h-full mt-0 data-[state=inactive]:hidden"
                    >
                        {organizationGroups.length > 0 ? (
                            <ScrollArea className="h-full">
                                {organizationGroups.map((group) =>
                                    renderGroupItem(
                                        group,
                                        "bg-gradient-to-br from-orange-500 to-red-500",
                                    ),
                                )}
                            </ScrollArea>
                        ) : (
                            <div className="p-6 text-center text-sm text-gray-500">
                                {t("permission.noOrgGroups")}
                            </div>
                        )}
                    </TabsContent>

                    <TabsContent
                        value="workspace"
                        className="h-full mt-0 data-[state=inactive]:hidden"
                    >
                        {workspaceGroups.length > 0 ? (
                            <ScrollArea className="h-full">
                                {workspaceGroups.map((group) =>
                                    renderGroupItem(
                                        group,
                                        "bg-gradient-to-br from-blue-500 to-indigo-500",
                                    ),
                                )}
                            </ScrollArea>
                        ) : (
                            <div className="p-6 text-center text-sm text-gray-500">
                                {t("permission.noWorkspaceGroups")}
                            </div>
                        )}
                    </TabsContent>
                </div>
            </Tabs>

            {/* Empty State */}
            {filteredGroups.length === 0 && (
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100/50 rounded-full flex items-center justify-center mx-auto mb-4 backdrop-blur-sm">
                        <Search className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {searchQuery
                            ? t("permission.noResults")
                            : t("permission.noGroups")}
                    </h3>
                    <p className="text-gray-500">
                        {searchQuery
                            ? t("common.tryOtherKeywords")
                            : t("permission.createFirst")}
                    </p>
                </div>
            )}
        </div>
    );
}
