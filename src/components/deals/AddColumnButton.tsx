import { Plus } from "lucide-react";

interface AddColumnButtonProps {
    onClick: () => void;
    isEditMode: boolean;
}

export function AddColumnButton({ onClick, isEditMode }: AddColumnButtonProps) {
    if (!isEditMode) return null;

    return (
        <div className="relative self-stretch flex flex-col justify-center -mx-3">
            <button
                onClick={onClick}
                className="size-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 flex items-center justify-center transition-colors border-2 border-white dark:border-gray-950"
                title="Thêm stage"
            >
                <Plus size={16} />
            </button>
        </div>
    );
}
