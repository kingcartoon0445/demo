import { Mail } from "lucide-react";

type EmailHistoryItem = {
    id: string;
    time: string;
    author: string;
    message: string;
    status?: "sent" | "delivered" | "read";
};

type EmailHistoryProps = {
    items?: EmailHistoryItem[];
};

const defaultItems: EmailHistoryItem[] = [
    {
        id: "1",
        time: "Hôm nay lúc 13:30",
        author: "Trungnamdao",
        message: "Email đã được gửi đến khách hàng",
        status: "sent",
    },
    {
        id: "2",
        time: "Hôm nay lúc 13:30",
        author: "Trungnamdao",
        message: "Email đã được gửi đến khách hàng",
        status: "delivered",
    },
];

export default function EmailHistory({ items = defaultItems }: EmailHistoryProps) {
    const getStatusColor = (status?: string) => {
        switch (status) {
            case "sent":
                return "bg-blue-100 text-blue-600";
            case "delivered":
                return "bg-green-100 text-green-600";
            case "read":
                return "bg-purple-100 text-purple-600";
            default:
                return "bg-gray-100 text-gray-600";
        }
    };

    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div
                    key={item.id}
                    className="flex items-center gap-2 p-3 border rounded-lg"
                >
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(
                            item.status
                        )}`}
                    >
                        <Mail size={16} />
                    </div>
                    <div className="flex-1">
                        <div className="text-sm font-medium">
                            {item.time} • {item.author}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            {item.message}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

