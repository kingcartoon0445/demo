import React from "react";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { Construction } from "lucide-react";

interface FeatureUnderDevelopmentDialogProps {
    isOpen: boolean;
    onClose: () => void;
}

const FeatureUnderDevelopmentDialog: React.FC<
    FeatureUnderDevelopmentDialogProps
> = ({ isOpen, onClose }) => {
    return (
        <AlertDialog open={isOpen} onOpenChange={onClose}>
            <AlertDialogContent>
                <AlertDialogHeader>
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                        <Construction className="h-6 w-6" />
                        <AlertDialogTitle>
                            Tính năng đang phát triển
                        </AlertDialogTitle>
                    </div>
                    <AlertDialogDescription>
                        Tính năng này đang được phát triển và sẽ sớm ra mắt. Vui
                        lòng quay lại sau!
                    </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                    <AlertDialogAction
                        onClick={onClose}
                        className="bg-[#5c46e6] hover:bg-[#4836b8]"
                    >
                        Đóng
                    </AlertDialogAction>
                </AlertDialogFooter>
            </AlertDialogContent>
        </AlertDialog>
    );
};

export default FeatureUnderDevelopmentDialog;
