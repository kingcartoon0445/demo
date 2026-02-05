import {
    EditIcon,
    PlusIcon,
    MailIcon,
    RefreshCcw,
    StarIcon,
    PaperclipIcon,
} from "lucide-react";

export default function JourneyIcon({ summary }: { summary: string }) {
    const getEventIcon = (summary: string) => {
        if (summary?.includes("email") || summary?.includes("mail")) {
            return (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <MailIcon className="size-4 text-gray-600" />
                </div>
            );
        } else if (
            summary &&
            (summary.toLowerCase().includes("đã để lại") ||
                summary.toLowerCase().includes("thêm"))
        ) {
            return (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <PlusIcon className="size-4 text-gray-600" />
                </div>
            );
        } else if (summary && summary.toLowerCase().includes("đính kèm")) {
            return (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <PaperclipIcon className="size-4 text-gray-600" />
                </div>
            );
        } else if (summary?.includes("call") || summary?.includes("gọi")) {
            return (
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                    <svg
                        className="w-4 h-4 text-orange-600"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                    >
                        <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                </div>
            );
        } else if (
            summary &&
            summary.toLowerCase().includes("chuyển trạng thái")
        ) {
            return (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <EditIcon className="size-4 text-gray-600" />
                </div>
            );
        } else if (
            summary &&
            summary.toLowerCase().includes("gán người phụ trách")
        ) {
            return (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <RefreshCcw className="size-4 " />
                </div>
            );
        } else {
            return (
                <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                    <StarIcon className="size-4 text-gray-600" />
                </div>
            );
        }
    };
    return getEventIcon(summary);
}
