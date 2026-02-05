import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { priorityLevels } from "@/constants";

export default function PrioritySelection({ priority, setPriority }) {
    return (
        <div className="space-y-2">
            <Label htmlFor="priority">Mức độ ưu tiên</Label>
            <Select
                value={priority.toString()}
                onValueChange={(value) => setPriority(Number(value))}
            >
                <SelectTrigger>
                    <SelectValue placeholder="Chọn mức độ ưu tiên">
                        {priority !== undefined && (
                            <div className="flex items-center">
                                <div
                                    className={`h-2 w-2 rounded-full mr-2 ${
                                        priorityLevels.find(
                                            (p) => p.id === priority
                                        )?.color
                                    }`}
                                ></div>
                                {
                                    priorityLevels.find(
                                        (p) => p.id === priority
                                    )?.name
                                }
                            </div>
                        )}
                    </SelectValue>
                </SelectTrigger>
                <SelectContent>
                    {priorityLevels.map((level) => (
                        <SelectItem key={level.id} value={level.id.toString()}>
                            <div className="flex items-center">
                                <div
                                    className={`h-2 w-2 rounded-full mr-2 ${level.color}`}
                                ></div>
                                {level.name}
                            </div>
                        </SelectItem>
                    ))}
                </SelectContent>
            </Select>
        </div>
    );
}
