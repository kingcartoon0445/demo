import React from "react";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface EditTagDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onSave: (name: string, color: string) => Promise<void>;
    initialName: string;
    initialColor: string;
    isSaving: boolean;
}

const colors = [
    { name: "Gray", value: "#6b7280" },
    { name: "Red", value: "#ef4444" },
    { name: "Green", value: "#22c55e" },
    { name: "Yellow", value: "#eab308" },
    { name: "Blue", value: "#3b82f6" },
    { name: "Purple", value: "#a855f7" },
];

export function EditTagDialog({
    isOpen,
    onClose,
    onSave,
    initialName,
    initialColor,
    isSaving,
}: EditTagDialogProps) {
    const [name, setName] = React.useState(initialName);
    const [color, setColor] = React.useState(initialColor);

    React.useEffect(() => {
        if (isOpen) {
            setName(initialName);
            setColor(initialColor);
        }
    }, [isOpen, initialName, initialColor]);

    const handleSave = async () => {
        if (!name.trim()) return;
        await onSave(name.trim(), color);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Chỉnh sửa nhãn</DialogTitle>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                        <Label htmlFor="name" className="text-right">
                            Tên nhãn
                        </Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="col-span-3"
                            disabled={isSaving}
                        />
                    </div>
                    <div className="grid grid-cols-4 items-start gap-4">
                        <Label className="text-right pt-2">Màu sắc</Label>
                        <div className="col-span-3 flex flex-wrap gap-2">
                            {colors.map((c) => (
                                <button
                                    key={c.value}
                                    type="button"
                                    className={cn(
                                        "w-6 h-6 rounded-full transition-all ring-offset-2 ring-offset-white",
                                        color === c.value
                                            ? "ring-2 ring-gray-400 scale-110"
                                            : "hover:scale-110"
                                    )}
                                    style={{ backgroundColor: c.value }}
                                    onClick={() => setColor(c.value)}
                                    title={c.name}
                                    disabled={isSaving}
                                />
                            ))}
                            <div className="relative w-6 h-6">
                                <div
                                    className={cn(
                                        "w-6 h-6 rounded-full overflow-hidden cursor-pointer bg-linear-to-br from-red-500 via-green-500 to-blue-500",
                                        !colors.find((c) => c.value === color)
                                            ? "ring-2 ring-gray-400 scale-110"
                                            : "hover:scale-110"
                                    )}
                                    title="Custom Color"
                                >
                                    <input
                                        type="color"
                                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                                        value={color}
                                        onChange={(e) =>
                                            setColor(e.target.value)
                                        }
                                        disabled={isSaving}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
                <DialogFooter>
                    <Button
                        type="button"
                        variant="secondary"
                        onClick={onClose}
                        disabled={isSaving}
                    >
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={isSaving || !name.trim()}
                    >
                        {isSaving && (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        )}
                        Lưu thay đổi
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
