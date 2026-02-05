import React from "react";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
    MdExpandMore,
    MdExpandLess,
    MdDelete,
    MdRefresh,
    MdDeleteSweep,
} from "react-icons/md";
import { DatasetResponse, DatasetEventsResponse } from "../types";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

interface EventMappingListProps {
    datasetEvents: DatasetEventsResponse | undefined;
    expandedWorkspaces: Set<string>;
    toggleWorkspace: (id: string) => void;
    onDeleteEvent: (id: string, datasetId: string, workspaceId: string) => void;
    onResetEvents: (workspaceId: string, datasetId: string) => void;
    onDeleteAllEvents: (workspaceId: string, datasetId: string) => void;
}

export const EventMappingList: React.FC<EventMappingListProps> = ({
    datasetEvents,
    expandedWorkspaces,
    toggleWorkspace,
    onDeleteEvent,
    onResetEvents,
    onDeleteAllEvents,
}) => {
    const leads =
        (Array.isArray(datasetEvents?.content) &&
            datasetEvents?.content?.filter((g) => g.category === "LEAD")) ||
        [];
    const deals =
        (Array.isArray(datasetEvents?.content) &&
            datasetEvents?.content?.filter((g) => g.category === "DEAL")) ||
        [];

    const renderGroup = (group: DatasetResponse) => {
        const mappings = group.events || [];
        return (
            <div
                key={group.id}
                className="border border-gray-200 rounded-lg overflow-hidden"
            >
                <div
                    className="bg-gray-50 px-4 py-3 flex items-center justify-between cursor-pointer hover:bg-gray-100 transition-colors"
                    onClick={() => toggleWorkspace(group.id)}
                >
                    <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-700">
                            {group.category === "LEAD"
                                ? "Cơ hội"
                                : group.workspaceName ?? "Không có tên"}
                        </span>
                        <span className="bg-gray-200 text-gray-600 text-xs px-2 py-0.5 rounded-full font-medium">
                            {mappings.length}
                        </span>
                    </div>

                    <div className="flex items-center gap-2">
                        {mappings.length > 0 && (
                            <div className="flex items-center gap-1 mr-2">
                                <TooltipProvider>
                                    <Tooltip content="Reset mặc định">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onResetEvents(
                                                    group.workspaceId,
                                                    mappings[0].datasetId
                                                );
                                            }}
                                        >
                                            <MdRefresh className="w-5 h-5" />
                                        </Button>
                                    </Tooltip>
                                    <Tooltip content="Xóa tất cả">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-500 hover:text-red-600 hover:bg-red-50"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                onDeleteAllEvents(
                                                    group.workspaceId,
                                                    mappings[0].datasetId
                                                );
                                            }}
                                        >
                                            <MdDeleteSweep className="w-5 h-5" />
                                        </Button>
                                    </Tooltip>
                                </TooltipProvider>
                            </div>
                        )}
                        {expandedWorkspaces.has(group.id) ? (
                            <MdExpandLess className="w-5 h-5 text-gray-500" />
                        ) : (
                            <MdExpandMore className="w-5 h-5 text-gray-500" />
                        )}
                    </div>
                </div>

                {expandedWorkspaces.has(group.id) && (
                    <div className="overflow-x-auto">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-gray-100">
                                    <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider w-[30%] pl-6">
                                        Giai đoạn
                                    </TableHead>
                                    <TableHead className="text-gray-500 text-xs font-semibold uppercase tracking-wider text-right w-[20%] pr-6">
                                        Hành động
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {mappings.length === 0 ? (
                                    <TableRow>
                                        <TableCell
                                            colSpan={4}
                                            className="text-center py-6 text-gray-500 text-sm"
                                        >
                                            Chưa có sự kiện nào được ánh xạ
                                            trong nhóm này
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    mappings.map((mapping) => (
                                        <TableRow
                                            key={mapping.id}
                                            className="group hover:bg-gray-50 transition-colors"
                                        >
                                            <TableCell className="py-4 pl-6">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-gray-900 text-sm font-medium">
                                                        {mapping.stageName}
                                                    </span>
                                                </div>
                                            </TableCell>

                                            <TableCell className="py-4 text-right pr-6">
                                                <div className="flex items-center justify-end gap-2">
                                                    <TooltipProvider>
                                                        <Tooltip content="Xóa">
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className="p-2 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50"
                                                                onClick={() =>
                                                                    onDeleteEvent(
                                                                        mapping.id,
                                                                        mapping.datasetId,
                                                                        mapping.workspaceId
                                                                    )
                                                                }
                                                            >
                                                                <MdDelete className="w-5 h-5" />
                                                            </Button>
                                                        </Tooltip>
                                                    </TooltipProvider>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>
        );
    };

    return (
        <div className="flex flex-col gap-6">
            {leads.length > 0 && (
                <div className="flex flex-col gap-3">
                    <div className="flex flex-col gap-4">
                        {leads.map((group: any) => renderGroup(group))}
                    </div>
                </div>
            )}

            {deals.length > 0 && (
                <div className="flex flex-col gap-3">
                    <h5 className="text-gray-800 font-bold text-sm uppercase tracking-wide">
                        Giao dịch
                    </h5>
                    <div className="flex flex-col gap-4">
                        {deals.map((group: any) => renderGroup(group))}
                    </div>
                </div>
            )}

            {leads.length === 0 && deals.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-lg border border-gray-100 border-dashed">
                    <p className="text-gray-500 text-sm">
                        Chưa có sự kiện nào được cấu hình
                    </p>
                </div>
            )}
        </div>
    );
};
