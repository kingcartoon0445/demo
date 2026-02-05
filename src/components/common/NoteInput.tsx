import { useCreateNote } from "@/hooks/useBusinessProcess";
import { useNoteCustomer, useNoteLead } from "@/hooks/useCustomerV2";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";

export default function NoteInput({
    orgId,
    taskId,
    customerId,
    provider,
}: {
    orgId: string;
    taskId: string;
    customerId: string;
    provider: string;
}) {
    const { t } = useLanguage();
    const [note, setNote] = useState("");
    const { mutate: createNote } = useCreateNote(orgId, taskId);
    const { mutate: noteCustomer } = useNoteCustomer(orgId, customerId);
    const { mutate: noteLead } = useNoteLead(orgId, customerId);
    const handleSave = () => {
        const trimmedNote = note.trim();
        if (!trimmedNote) return; // Không save nếu không có nội dung

        if (provider === "bpt") {
            createNote({
                content: trimmedNote,
            });
        } else if (provider === "lead") {
            noteLead({
                note: trimmedNote,
            });
        } else {
            noteCustomer({
                note: trimmedNote,
            });
        }
        setNote("");
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            handleSave();
        }
    };

    return (
        <div className="border rounded-xl p-3 relative bg-white">
            <textarea
                className="w-full p-2 border-0 resize-none min-h-[100px] focus:outline-none text-sm"
                placeholder={t("common.enterNote")}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                onKeyDown={handleKeyDown}
            />
            <div className="flex justify-end mt-2">
                <button
                    onClick={handleSave}
                    disabled={!note.trim()}
                    className={`text-sm ${
                        note.trim()
                            ? "text-violet-600 hover:underline cursor-pointer"
                            : "text-gray-400 cursor-not-allowed"
                    }`}
                >
                    {t("common.save")}
                </button>
            </div>
        </div>
    );
}
