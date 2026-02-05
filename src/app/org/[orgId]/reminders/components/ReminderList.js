import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCustomerList } from "@/hooks/customers_data";
import { PlusIcon } from "lucide-react";
import { useParams, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import AddReminderDialog from "./AddReminderDialog";
import { ReminderListContent } from "./ReminderListContent";
import { useReminders } from "./useReminder";
import { useLanguage } from "@/contexts/LanguageContext";

// Component chính
export default function ReminderList({
    customerId,
    customerName,
    orgId,
    workspaceId,
    provider,
    taskId,
    refreshStage,
}) {
    const { t } = useLanguage();
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [currentReminder, setCurrentReminder] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [reminderToDelete, setReminderToDelete] = useState(null);
    const [shouldRefresh, setShouldRefresh] = useState(false);
    // Lấy thông tin khách hàng hiện tại từ context
    const { customerSelected } = useCustomerList();
    const searchParams = useSearchParams();
    const cid = searchParams.get("cid");
    // Sử dụng custom hook để xử lý logic nhắc hẹn
    const {
        reminderList,
        isLoading,
        fetchReminders,
        handleDeleteReminder,
        handleToggleDone,
    } = useReminders(orgId, workspaceId, customerId, provider);

    // Chuẩn bị dữ liệu khách hàng để truyền vào dialog
    const customerData = {
        id: customerId,
        name: customerName,
        organizationId: orgId,
        workspaceId: workspaceId,
    };
    // Chỉ refresh khi cần thiết
    useEffect(() => {
        if (shouldRefresh) {
            fetchReminders();
            setShouldRefresh(false);
        }
    }, [shouldRefresh, fetchReminders]);

    const handleAddNew = () => {
        setCurrentReminder(null);
        setShowAddDialog(true);
    };

    const handleEdit = (reminder) => {
        setCurrentReminder(reminder);
        setShowAddDialog(true);
    };

    const confirmDelete = (reminder) => {
        setReminderToDelete(reminder);
        setDeleteAlert(true);
    };

    const handleDelete = async () => {
        if (!reminderToDelete?.Id) return;

        await handleDeleteReminder(reminderToDelete.Id);
        setReminderToDelete(null);
        setShouldRefresh(true);
        refreshStage?.();
    };

    const handleDialogClose = (didSave) => {
        setShowAddDialog(false);
        if (didSave) {
            setShouldRefresh(true);
        }
    };

    return (
        <>
            <Card className="w-full mb-4 bg-transparent border-none shadow-none py-0">
                <CardHeader className="pb-2 flex flex-row items-center justify-between p-0">
                    <CardTitle className="text-md font-semibold">
                        {t("common.activity")}
                    </CardTitle>
                    <Button
                        variant="link"
                        size="sm"
                        className="text-primary hover:text-primary/80 font-medium"
                        onClick={handleAddNew}
                    >
                        <PlusIcon className="h-4 w-4 mr-1" />
                        {t("common.addActivity")}
                    </Button>
                </CardHeader>
                <CardContent className="p-0 pt-2">
                    <ReminderListContent
                        reminderList={reminderList}
                        isLoading={isLoading}
                        onEdit={handleEdit}
                        onDelete={confirmDelete}
                        onToggleDone={handleToggleDone}
                    />
                </CardContent>
            </Card>

            {showAddDialog && (
                <AddReminderDialog
                    open={showAddDialog}
                    setOpen={handleDialogClose}
                    customerData={customerData}
                    reminderToEdit={currentReminder}
                    taskId={taskId || ""}
                    provider={provider}
                    refreshStage={refreshStage}
                />
            )}

            <CustomerAlertDialog
                open={deleteAlert}
                setOpen={setDeleteAlert}
                title={t("common.deleteReminder")}
                subtitle={t("common.deleteReminderDescription")}
                onSubmit={handleDelete}
            />
        </>
    );
}
