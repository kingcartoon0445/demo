import { ChevronDown, PlusIcon, TrendingUp } from "lucide-react";
import { useRef } from "react";
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

interface AddOpportunityDropdownProps {
    onAddOpportunity: () => void;
    onAddDeal: () => void;
}

export default function AddOpportunityDropdown({
    onAddOpportunity,
    onAddDeal,
}: AddOpportunityDropdownProps) {
    const dropdownRef = useRef<HTMLDivElement>(null);
    const { t } = useLanguage();

    return (
        <div className="relative h-full" ref={dropdownRef}>
            {/* Main Button */}
            <div className="flex h-full">
                {/* Thêm cơ hội button */}
                <TooltipProvider>
                    <Tooltip content={t("common.add")}>
                        <TooltipTrigger asChild>
                            <Button
                                onClick={onAddOpportunity}
                                className="rounded-l-lg rounded-r-none border-r-0"
                                size="sm"
                            >
                                <PlusIcon className="size-4" />
                                <span>Cơ hội</span>
                            </Button>
                        </TooltipTrigger>
                    </Tooltip>
                </TooltipProvider>

                {/* Dropdown trigger */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button
                            className="rounded-l-none rounded-r-lg border-l-0"
                            size="sm"
                        >
                            <ChevronDown className="size-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                        <DropdownMenuItem onClick={onAddDeal}>
                            {/* <TrendingUp className="size-4" /> */}
                            <span>Giao dịch</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </div>
    );
}
