import { FileText, MoreHorizontal } from "lucide-react";
import NoteInput from "./NoteInput";
import CustomerNoteList from "./CustomerNoteList";

export default function CustomerNote({
    orgId,
    customerId,
    provider,
    taskId,
}: {
    orgId: string;
    customerId: string;
    provider: string;
    taskId: string;
}) {
    return (
        <div className="space-y-4 p-4 h-full">
            {/* Rich Text Editor */}
            <NoteInput
                taskId={taskId}
                orgId={orgId}
                customerId={customerId}
                provider={provider}
            />

            {/* Existing Notes */}
            <CustomerNoteList
                orgId={orgId}
                customerId={customerId}
                provider={provider}
                taskId={taskId}
            />
        </div>
    );
}
