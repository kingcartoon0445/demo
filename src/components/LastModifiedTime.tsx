import { Tooltip, TooltipProvider } from "@/components/ui/tooltip";
import { formatDistance } from "date-fns";
import { vi } from "date-fns/locale";

export default function LastModifiedTime({
    lastModifiedDate,
}: {
    lastModifiedDate: string;
}) {
    return (
        <span className="text-[10px] text-muted-foreground/70">
            <TooltipProvider>
                <Tooltip
                    content={
                        <span>
                            {new Date(lastModifiedDate).toLocaleString("vi-VN")}
                        </span>
                    }
                >
                    <div className="text-text2 text-[10px]">
                        {formatDistance(
                            new Date(lastModifiedDate),
                            new Date(),
                            {
                                addSuffix: true,
                                locale: vi,
                            }
                        )
                            .replace("nữa", "")
                            .replace("khoảng", "")
                            .replace("dưới", "")}
                    </div>
                </Tooltip>
            </TooltipProvider>
        </span>
    );
}
