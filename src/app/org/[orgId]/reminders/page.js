"use client";

import { CustomerAlertDialog } from "@/components/CustomerAlertDialog";
import { Glass } from "@/components/Glass";
import { GlassTabs } from "@/components/common/GlassTabs";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Calendar, List, PlusIcon } from "lucide-react";
import { use, useState } from "react";

// Import separated components
import CalendarView from "./components/CalendarView";
import SkeletonLoader from "./components/SkeletonLoader";
import TableView from "./components/TableView";

// Import custom hooks and utils
import AddReminderDialog from "./components/AddReminderDialog";
import { useReminders } from "./hooks/useReminders";
import {
    getDaysInMonth,
    getRemindersForDay,
    isEveryDayOfWeek,
    weekdayNames,
} from "./utils/reminderUtils";

export default function RemindersPage({ params }) {
    const { orgId } = use(params);

    // State management
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [currentReminder, setCurrentReminder] = useState(null);
    const [deleteAlert, setDeleteAlert] = useState(false);
    const [reminderToDelete, setReminderToDelete] = useState(null);
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [viewMode, setViewMode] = useState("table");

    // Custom hook for reminders data
    const {
        reminderList,
        filteredReminders,
        isLoading,
        searchTerm,
        setSearchTerm,
        fetchReminders,
        handleDelete,
        parseContact,
        handleToggleDone,
    } = useReminders(orgId);

    // Event handlers
    const handleDialogSuccess = () => {
        fetchReminders();
        setShowAddDialog(false);
    };

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

    const handleDeleteConfirm = async () => {
        if (!reminderToDelete?.Id) return;

        try {
            await handleDelete(reminderToDelete.Id);
        } catch (error) {
            console.error("Lỗi khi xóa nhắc hẹn:", error);
        } finally {
            setReminderToDelete(null);
            setDeleteAlert(false);
        }
    };

    // Calendar utility functions
    const getDaysInMonthForCalendar = () => getDaysInMonth(currentMonth);
    const getRemindersForDayInCalendar = (day) =>
        getRemindersForDay(day, reminderList);

    if (isLoading) {
        return <SkeletonLoader viewMode={viewMode} />;
    }

    return (
        <Glass
            intensity="high"
            className="h-screen flex flex-col overflow-hidden p-3 rounded-2xl"
        >
            <div className="flex-shrink-0 w-full max-w-[100vw]">
                {/* Header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                    <div className="min-w-0 flex-1">
                        <h1 className="text-xl font-semibold text-gray-900 truncate">
                            Quản lý nhắc hẹn
                        </h1>
                        <p className="text-sm text-gray-500 truncate">
                            Theo dõi và quản lý các cuộc hẹn của tổ chức
                        </p>
                    </div>

                    <div className="flex items-center gap-3 flex-shrink-0">
                        {/* View Toggle */}
                        <GlassTabs
                            tabs={[
                                {
                                    id: "table",
                                    label: "Danh sách",
                                    icon: <List className="h-4 w-4" />,
                                },
                                {
                                    id: "calendar",
                                    label: "Lịch",
                                    icon: <Calendar className="h-4 w-4" />,
                                },
                            ]}
                            activeTab={viewMode}
                            onChange={setViewMode}
                        />

                        <Button
                            onClick={handleAddNew}
                            className="h-9 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 whitespace-nowrap flex-shrink-0"
                        >
                            <PlusIcon className="h-3.5 w-3.5 mr-1.5" />
                            <span className="hidden sm:inline">Thêm mới</span>
                            <span className="sm:hidden">Thêm</span>
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 w-full max-w-[100vw] overflow-hidden min-h-0">
                <div className={cn("w-full h-full overflow-hidden")}>
                    {viewMode === "table" ? (
                        <TableView
                            reminders={filteredReminders}
                            onEdit={handleEdit}
                            onDelete={confirmDelete}
                            onToggleDone={handleToggleDone}
                            parseContact={parseContact}
                            isEveryDayOfWeek={isEveryDayOfWeek}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                        />
                    ) : (
                        <CalendarView
                            currentMonth={currentMonth}
                            setCurrentMonth={setCurrentMonth}
                            reminderList={reminderList}
                            getDaysInMonth={getDaysInMonthForCalendar}
                            getRemindersForDay={getRemindersForDayInCalendar}
                            weekdayNames={weekdayNames}
                            onEdit={handleEdit}
                            onDelete={confirmDelete}
                            parseContact={parseContact}
                            isEveryDayOfWeek={isEveryDayOfWeek}
                            searchTerm={searchTerm}
                            setSearchTerm={setSearchTerm}
                        />
                    )}
                </div>
            </div>

            {/* Dialogs */}
            {showAddDialog && (
                <AddReminderDialog
                    open={showAddDialog}
                    setOpen={setShowAddDialog}
                    customerData={{
                        organizationId: orgId,
                        hideCustomerField:
                            currentReminder === null ||
                            !currentReminder?.contactData,
                    }}
                    reminderToEdit={currentReminder}
                    onSuccess={handleDialogSuccess}
                />
            )}

            <CustomerAlertDialog
                open={deleteAlert}
                setOpen={setDeleteAlert}
                title="Xóa nhắc hẹn"
                subtitle="Bạn có chắc chắn muốn xóa nhắc hẹn này? Hành động này không thể hoàn tác."
                onSubmit={handleDeleteConfirm}
            />
        </Glass>
    );
}
