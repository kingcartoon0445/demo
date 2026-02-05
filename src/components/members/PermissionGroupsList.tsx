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
        group.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const organizationGroups = filteredGroups.filter(
        (g) => g.scope === "ORGANIZATION"
    );
    const workspaceGroups = filteredGroups.filter(
        (g) => g.scope === "WORKSPACE"
    );

    const [activeTab, setActiveTab] = useState("organization");

    const renderGroupItem = (group: PermissionGroup, color: string) => (
        <div
            key={group.id}
            className={`p-2 cursor-pointer transition-all duration-200 hover:bg-blue-50/50 ${
                selectedGroupId === group.id
                    ? "bg-blue-50 border-r-4 border-r-blue-500"
                    : ""
            }`}
            onClick={() => onGroupSelect(group.id)}
        >
            <div className="flex items-center gap-3">
                <div
                    className={`w-10 h-10 ${color} rounded-lg flex items-center justify-center`}
                >
                    <Users className="w-5 h-5 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-gray-900 truncate">
                        {group.name}
                    </h5>
                    <div className="flex items-center gap-4 mt-1">
                        <span className="text-sm text-gray-500">
                            {group.totalMembers} {t("member.count")}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );

    return (
        <div className="flex flex-col h-full bg-gray-50/50">
            {/* Header */}
            <div className="border-b border-gray-200/60 p-2">
                <div className="flex items-center">
                    <div
                        className="relative transition-all duration-300"
                        style={{
                            width: showSearch ? 220 : 0,
                            marginRight: showSearch ? "8px" : "0px",
                        }}
                    >
                        {showSearch && (
                            <>
                                <Input
                                    ref={inputRef}
                                    placeholder={t(
                                        "permission.searchPlaceholder"
                                    )}
                                    className="pl-9 pr-8 bg-white border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent h-9"
                                    value={searchQuery}
                                    onChange={(e) =>
                                        onSearchChange(e.target.value)
                                    }
                                />
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
                                <X
                                    className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 cursor-pointer hover:text-gray-600 transition-colors"
                                    onClick={() => {
                                        onSearchChange("");
                                        setShowSearch(false);
                                    }}
                                />
                            </>
                        )}
                    </div>

                    {!showSearch && (
                        <Tooltip content={t("permission.search")}>
                            <Button
                                variant="outline"
                                size="icon"
                                className="text-gray-600 hover:text-gray-800 mr-2"
                                onClick={() => setShowSearch(true)}
                            >
                                <Search className="w-5 h-5" />
                            </Button>
                        </Tooltip>
                    )}
                    {(currentOrg.type === "OWNER" ||
                        currentOrg.type === "ADMIN") && (
                        <Tooltip content={t("permission.addNew")}>
                            <Button
                                onClick={onAddPermission}
                                size="sm"
                                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white hover:shadow-lg transition-all duration-300 hover:scale-105"
                            >
                                <Plus className="w-5 h-5" />
                            </Button>
                        </Tooltip>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="organization" className="flex flex-col h-full">
                <TabsList className="bg-muted mb-2 flex rounded-none p-0">
                    <TabsTrigger
                        value="organization"
                        className={`flex-1 px-6 py-3 text-sm font-medium rounded-none ${
                            activeTab === "organization"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t("permission.organization")}
                    </TabsTrigger>
                    <TabsTrigger
                        value="workspace"
                        className={`flex-1 px-6 py-3 text-sm font-medium rounded-none ${
                            activeTab === "workspace"
                                ? "text-blue-600 border-b-2 border-blue-600"
                                : "text-gray-500 hover:text-gray-700"
                        }`}
                    >
                        {t("permission.workspace")}
                    </TabsTrigger>
                </TabsList>

                <TabsContent
                    value="organization"
                    className="flex-1 rounded-none mt-0"
                >
                    {organizationGroups.length > 0 ? (
                        <ScrollArea className=" divide-y divide-gray-100 border">
                            {organizationGroups.map((group) =>
                                renderGroupItem(
                                    group,
                                    "bg-gradient-to-br from-orange-500 to-red-500"
                                )
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
                    className="flex-1 rounded-none mt-0"
                >
                    {workspaceGroups.length > 0 ? (
                        <ScrollArea className=" divide-y divide-gray-100 border">
                            {workspaceGroups.map((group) =>
                                renderGroupItem(
                                    group,
                                    "bg-gradient-to-br from-blue-500 to-indigo-500"
                                )
                            )}
                        </ScrollArea>
                    ) : (
                        <div className="p-6 text-center text-sm text-gray-500">
                            {t("permission.noWorkspaceGroups")}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Empty State */}
            {filteredGroups.length === 0 && (
                <div className="p-8 text-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
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
