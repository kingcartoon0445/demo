import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export const CustomButton = ({ children, onClick, isActive, className }) => (
    <Button
        variant={isActive ? "default" : "outline"}
        onClick={onClick}
        className={cn(
            `p-0 rounded-lg border-none ${
                isActive ? "fill-white bg-primary" : "fill-[#1F2329]"
            }  w-[40px] h-[40px] flex items-center justify-center bg-none`,
            className
        )}
    >
        {children}
    </Button>
);
