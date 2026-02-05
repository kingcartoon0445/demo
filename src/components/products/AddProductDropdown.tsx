import { ChevronDown, Download, ImportIcon, PlusIcon } from "lucide-react";
import { useRef, useState } from "react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipProvider } from "../ui/tooltip";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "../ui/button";

interface AddProductDropdownProps {
    setIsOpen: (isOpen: boolean) => void;
    onExport: () => void;
    onImport: () => void;
}

export default function AddProductDropdown({
    setIsOpen,
    onExport,
    onImport,
}: AddProductDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();
    return (
        <div className="relative h-full" ref={dropdownRef}>
            {/* Main Button */}
            <div className="flex h-full">
                {/* Thêm mới button */}
                <TooltipProvider>
                    <Tooltip content={t("common.add")}>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={() => setIsOpen(true)}
                                className="rounded-l-lg rounded-r-none border-r-0"
                            >
                                <PlusIcon className="size-4" />
                                <span>Thêm mới</span>
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
                            <span>Import dữ liệu</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={onExport}>
                            <Download className="size-4" />
                            <span>Export dữ liệu</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
