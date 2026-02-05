import { memo } from "react";
import { Label } from "./ui/label";

export const FormField = memo(
    ({ label, children }: { label: string; children: React.ReactNode }) => (
        <div>
            <Label className="block text-sm font-medium mb-1">{label}</Label>
            {children}
        </div>
    )
);
