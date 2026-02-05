import { Loader2 } from "lucide-react";
import { Button } from "../ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "../ui/dialog";
import { Textarea } from "../ui/textarea";
import { useLanguage } from "@/contexts/LanguageContext";

export default function EditNoteDialog({
    open,
    onOpenChange,
    editedNote,
    setEditedNote,
    onSave,
    isSaving,
    onCancel,
}: {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    editedNote: string;
    setEditedNote: (value: string) => void;
    onSave: () => void;
    isSaving: boolean;
    onCancel: () => void;
}) {
    const { t } = useLanguage();
    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t("common.editNote")}</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                    <Textarea
                        value={editedNote}
                        onChange={(e) => setEditedNote(e.target.value)}
                        placeholder={t("common.enterNote")}
                        className="min-h-[120px]"
                    />
                </div>
                <DialogFooter className="sm:justify-end">
                    <Button type="button" variant="outline" onClick={onCancel}>
                        {t("common.cancel")}
                    </Button>
                    <Button
                        type="button"
                        onClick={onSave}
                        disabled={isSaving || !editedNote.trim()}
                    >
                        {isSaving ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                {t("common.saving")}
                            </>
                        ) : (
                            t("common.save")
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
