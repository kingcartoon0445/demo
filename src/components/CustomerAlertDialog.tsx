import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import type { ReactNode } from "react";

interface CustomerAlertDialogProps {
    open?: boolean;
    setOpen?: (open: boolean) => void;
    title?: ReactNode;
    subtitle?: ReactNode;
    onSubmit?: () => void;
    onClick?: () => void;
    confirmText?: string;
    isSubmitting?: boolean;
}

export function CustomerAlertDialog({
    open = false,
    setOpen = () => {},
    title = "",
    subtitle = "",
    onSubmit = () => {},
    onClick = () => {},
    confirmText = "Tiếp tục",
    isSubmitting = false,
}: CustomerAlertDialogProps) {
    return (
        <div onClick={onClick}>
            <AlertDialog open={open} onOpenChange={setOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-black">
                            {title}
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-black">
                            {subtitle}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Hủy</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => {
                                if (!isSubmitting) {
                                    onSubmit();
                                }
                            }}
                            disabled={isSubmitting}
                            aria-busy={isSubmitting}
                        >
                            {isSubmitting ? "Đang xử lý..." : confirmText}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
