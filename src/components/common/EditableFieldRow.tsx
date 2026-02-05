"use client";

import {
    createContext,
    useContext,
    useState,
    ReactNode,
    Dispatch,
    SetStateAction,
} from "react";
import { PencilIcon, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";

// Context để share editing state giữa label và editable component
interface EditableFieldContextType {
    isEditing: boolean;
    setIsEditing: Dispatch<SetStateAction<boolean>>;
}

const EditableFieldContext = createContext<
    EditableFieldContextType | undefined
>(undefined);

export function useEditableField() {
    const context = useContext(EditableFieldContext);
    if (!context) {
        throw new Error(
            "useEditableField must be used within EditableFieldRow",
        );
    }
    return context;
}

interface EditableFieldRowProps {
    icon: ReactNode;
    label: string;
    children: ReactNode;
    value?: ReactNode;
    onSave?: () => void | Promise<void>;
    onCancel?: () => void;
    isSaving?: boolean;
    isDisplayButton?: boolean;
}

export function EditableFieldRow({
    icon,
    label,
    children,
    value,
    onSave,
    onCancel,
    isSaving = false,
    isDisplayButton = true,
}: EditableFieldRowProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isHovered, setIsHovered] = useState(false);

    const handleRowClick = () => {
        if (!isEditing) {
            setIsEditing(true);
        }
    };

    const handleSave = async () => {
        if (onSave) {
            await onSave();
        }
        setIsEditing(false);
    };

    const handleCancel = () => {
        if (onCancel) {
            onCancel();
        }
        setIsEditing(false);
    };

    return (
        <EditableFieldContext.Provider value={{ isEditing, setIsEditing }}>
            <div
                className="flex items-center justify-between group cursor-pointer hover:bg-gray-50 rounded-md transition-colors"
                onMouseEnter={() => setIsHovered(true)}
                onMouseLeave={() => setIsHovered(false)}
                onClick={handleRowClick}
            >
                <div
                    className={`flex items-center gap-3 transition-all duration-200 ${
                        isEditing
                            ? "flex-none opacity-0 w-0 overflow-hidden"
                            : "flex-none"
                    }`}
                >
                    <div className="w-5 h-5 flex items-center justify-center">
                        {icon}
                    </div>
                    <span className="text-[14px] text-gray-900 whitespace-nowrap">
                        {label}
                    </span>
                </div>
                <div
                    className={`transition-all duration-200 flex justify-end items-center gap-2 ${
                        isEditing ? "flex-1" : "flex-1"
                    }`}
                    onClick={(e) => {
                        if (isEditing) {
                            e.stopPropagation(); // Prevent row click when in editing mode
                        }
                    }}
                >
                    {!isEditing ? (
                        <>
                            <div className="flex-1 min-w-0 flex justify-end">
                                {value || children}
                            </div>
                            {isHovered && (
                                <div className="opacity-60 hover:opacity-100 transition-opacity ml-3 flex-shrink-0">
                                    <PencilIcon className="w-4 h-4 text-gray-500" />
                                </div>
                            )}
                        </>
                    ) : (
                        <>
                            {children}
                            {(onSave || onCancel) && isDisplayButton && (
                                <div className="flex gap-2">
                                    {onSave && (
                                        <Button
                                            size="sm"
                                            onClick={handleSave}
                                            disabled={isSaving}
                                            className="text-green-600 hover:bg-green-100 rounded h-8 w-8 p-0"
                                            variant="ghost"
                                        >
                                            <Check className="w-4 h-4 " />
                                        </Button>
                                    )}
                                    {onCancel && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={handleCancel}
                                            className="h-8 w-8 p-0"
                                        >
                                            <X className="w-4 h-4" />
                                        </Button>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </EditableFieldContext.Provider>
    );
}
