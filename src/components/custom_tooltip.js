import { useState } from "react";
import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";

export function CustomTooltip({ children, label }) {
    const [open, setOpen] = useState(false);
    return (
        <TooltipProvider>
            <Tooltip content={label}>
                <div>{children}</div>
            </Tooltip>
        </TooltipProvider>
    );
}
