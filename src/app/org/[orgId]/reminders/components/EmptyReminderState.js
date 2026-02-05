import { Calendar } from "lucide-react";

/**
 * Component hiển thị khi không có nhắc hẹn nào
 */
const EmptyReminderState = ({ colSpan = 6 }) => {
    return (
        <tr>
            <td colSpan={colSpan} className="py-16 text-center">
                <div className="flex flex-col items-center">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-3">
                        <Calendar className="h-8 w-8 text-gray-400" />
                    </div>
                    <p className="text-lg font-medium text-gray-700 mb-1">
                        Chưa có nhắc hẹn nào
                    </p>
                    <p className="text-gray-500 text-sm">
                        Hãy thêm nhắc hẹn đầu tiên của bạn
                    </p>
                </div>
            </td>
        </tr>
    );
};

export default EmptyReminderState;
