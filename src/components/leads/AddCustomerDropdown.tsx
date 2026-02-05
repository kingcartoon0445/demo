import { ChevronDown, Download, ImportIcon, PlusIcon } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { exportCustomersToExcel } from "@/api/customer";
import { useLeadsFilter } from "@/hooks/leads_data";
import toast from "react-hot-toast";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { Button } from "../ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
interface AddCustomerDropdownProps {
    onAddNew: () => void;
    onImport: () => void;
}

export default function AddCustomerDropdown({
    onAddNew,
    onImport,
}: AddCustomerDropdownProps) {
    const { t } = useLanguage();
    const params = useParams();
    const orgId = params.orgId as string;
    const searchParams = useSearchParams();
    const { filter } = useLeadsFilter();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []); 

    const handleAddNew = () => {
        onAddNew();
    };

    const handleImport = () => {
        onImport();
    };

    const handleExport = async () => {
        setIsOpen(false);
        try {
            const searchText = searchParams.get("SearchText") || "";
            let filterBody = filter.filterBody;

            if (!filterBody) {
                filterBody = { limit: 20 };
                const startDate = searchParams.get("StartDate");
                const endDate = searchParams.get("EndDate");
                const tags = searchParams.getAll("Tags");
                const sourceIds = searchParams.getAll("SourceIds");
                const assignees = searchParams.getAll("Assignees");

                if (startDate) filterBody.startDate = startDate;
                if (endDate) filterBody.endDate = endDate;
                if (tags.length > 0) filterBody.tags = tags;
                if (sourceIds.length > 0) filterBody.sourceIds = sourceIds;
                if (assignees.length > 0) filterBody.assignees = assignees;
            }
            // Add channel filter based on source parameter if viewMode logic applies,
            // but here we are inside AddCustomerDropdown which might not know about viewMode directly.
            // However, CustomerList logic handles 'source' param.
            // Users usually export what they see.
            const sourceParam = searchParams.get("source");
            let channels: string[] | undefined = undefined;
            if (sourceParam === "chance") {
                channels = ["LEAD"];
            } else if (sourceParam === "messenger") {
                channels = ["FACEBOOK"];
            } else if (sourceParam === "zalo") {
                channels = ["ZALO"];
            }

            // Note: exportCustomersToExcel signature provided by user:
            // orgId, workspaceId, searchText, stageGroupId, startDate, endDate, categoryList, sourceList, rating, stage, tags, profileIds, teamIds

            // Mapping filterBody to arguments
            await exportCustomersToExcel(
                orgId,
                "default", // workspaceId
                searchText,
                filter.stageGroupId, // stageGroupId
                filterBody.startDate,
                filterBody.endDate,
                filterBody.categoryIds, // categoryList - assuming key
                filterBody.sourceIds, // sourceList
                filterBody.rating, // rating
                filterBody.stage, // stage
                filterBody.tags, // tags
                filterBody.assignees, // profileIds
                filterBody.teamIds, // teamIds
                channels,
            ).then((blob: any) => {
                const url = window.URL.createObjectURL(new Blob([blob]));
                const link = document.createElement("a");
                link.href = url;
                link.setAttribute(
                    "download",
                    `customers_export_${new Date().toISOString()}.xlsx`,
                );
                document.body.appendChild(link);
                link.click();
                link.remove();
            });

            toast.success(t("common.exportSuccess") || "Export successful");
        } catch (error) {
            console.error(error);
            toast.error(t("common.exportFailed") || "Export failed");
        }
    };

    return (
        <div className="relative">
            {/* Main Button */}
            <div className="flex">
                {/* Thêm mới button */}
                <TooltipProvider>
                    <Tooltip content={t("common.add")}>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={handleAddNew}
                                className="rounded-l-lg rounded-r-none border-r-0"
                            >
                                <PlusIcon className="size-4" />
                                <span>{t("common.add")}</span>
                            </Button>
                        </TooltipTrigger>
                    </Tooltip>
                </TooltipProvider>

                {/* Dropdown trigger */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button className="rounded-l-none rounded-r-lg border-l-0">
                            <ChevronDown className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={onImport}>
                            <ImportIcon className="size-4" />
                            <span>{t("common.import")}</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={handleExport}>
                            <Download className="size-4" />
                            <span>{t("common.export")}</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
