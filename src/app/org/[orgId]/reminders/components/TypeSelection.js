import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { scheduleTypes } from "@/constants";

export default function TypeSelection({ selectedType, setSelectedType }) {
    // Đảm bảo selectedType luôn hợp lệ, nếu không có thì mặc định là "reminder"
    const validType = scheduleTypes.some((t) => t.id === selectedType)
        ? selectedType
        : "reminder";

    return (
        <div className="flex flex-wrap gap-2 mt-2">
            {scheduleTypes.map((type) => (
                <Button
                    key={type.id}
                    type="button"
                    variant={validType === type.id ? "default" : "ghost"}
                    size="icon"
                    className={cn(
                        "h-9 w-9",
                        validType === type.id
                            ? "bg-indigo-600 text-white"
                            : "text-gray-500"
                    )}
                    onClick={() => setSelectedType(type.id)}
                    title={type.name}
                >
                    {type.icon}
                </Button>
            ))}
        </div>
    );
}
