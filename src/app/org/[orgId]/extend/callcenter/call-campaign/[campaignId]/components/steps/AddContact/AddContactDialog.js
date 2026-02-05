import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MdAdd, MdClose, MdOutlinePersonOutline } from "react-icons/md";
import { useState, useRef } from "react";
import { IoIosArrowForward, IoIosArrowRoundBack } from "react-icons/io";
import { BsCloudArrowUp } from "react-icons/bs";
import CreateContactForm from "./CreateContactForm";
import ImportContactForm from "./ImportContactForm";
import BulkUploadForm from "./BulkUploadForm";

export default function AddContactDialog({ open, setOpen, onAddContact }) {
    const [selectedOption, setSelectedOption] = useState(null);
    const [isCustomerList, setIsCustomerList] = useState(false);
    const importFormBackRef = useRef(null);
    const createFormRef = useRef(null);
    const importFormRef = useRef(null);

    const handleBack = () => {
        if (selectedOption === "import" && isCustomerList) {
            importFormBackRef.current?.();
            setIsCustomerList(false);
            return;
        }
        setSelectedOption(null);
        setIsCustomerList(false);
    };

    const handleSave = () => {
        if (selectedOption === "create") {
            const success = createFormRef.current?.submitForm();
            if (success) {
                setOpen(false);
            }
        } else if (selectedOption === "import") {
            const success = importFormRef.current?.submitSelected();
            if (success) {
                setOpen(false);
            }
        } else if (selectedOption === "download") {
            return;
        }
    };

    const renderContent = () => {
        switch (selectedOption) {
            case "create":
                return (
                    <div className="p-4">
                        <CreateContactForm
                            ref={createFormRef}
                            onSubmit={onAddContact}
                        />
                    </div>
                );
            case "import":
                return (
                    <div className="p-0">
                        <ImportContactForm
                            ref={importFormRef}
                            setIsCustomerList={setIsCustomerList}
                            handleBack={importFormBackRef}
                            onAddContacts={onAddContact}
                        />
                    </div>
                );
            case "download":
                return (
                    <div className="p-4">
                        <BulkUploadForm
                            onAddContacts={(contacts) => {
                                onAddContact(contacts);
                                setOpen(false);
                            }}
                        />
                    </div>
                );
            default:
                return (
                    <div className="flex flex-col gap-4 p-4 text-sm font-medium">
                        <div
                            className="px-4 py-2 cursor-pointer border hover:bg-accent rounded-xl flex items-center justify-between"
                            onClick={() => setSelectedOption("create")}
                        >
                            <div className="flex items-center gap-2">
                                <MdAdd className="text-lg" />
                                <span>Tạo mới khách hàng</span>
                            </div>
                            <IoIosArrowForward />
                        </div>
                        <div
                            className="px-4 py-2 cursor-pointer border hover:bg-accent rounded-xl flex items-center justify-between"
                            onClick={() => setSelectedOption("import")}
                        >
                            <div className="flex items-center gap-2">
                                <MdOutlinePersonOutline className="text-lg" />
                                <span>Thêm từ danh sách khách hàng</span>
                            </div>
                            <IoIosArrowForward />
                        </div>
                        <div
                            className="px-4 py-2 cursor-pointer border hover:bg-accent rounded-xl flex items-center justify-between"
                            onClick={() => setSelectedOption("download")}
                        >
                            <div className="flex items-center gap-2">
                                <BsCloudArrowUp className="text-lg" />
                                <span>Tải lên hàng loạt</span>
                            </div>
                            <IoIosArrowForward />
                        </div>
                    </div>
                );
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[600px] min-h-[500px] p-0 flex flex-col gap-0">
                <DialogHeader>
                    <DialogTitle className="p-4 border-b-[1px] font-medium text-title text-[18px] flex items-center justify-between">
                        {selectedOption ? (
                            <div className="flex items-center gap-2">
                                <button
                                    className="hover:bg-accent rounded-xl flex items-center gap-1"
                                    onClick={handleBack}
                                >
                                    <IoIosArrowRoundBack className="text-2xl" />
                                </button>
                                <span>
                                    {selectedOption === "create" &&
                                        "Tạo mới khách hàng"}
                                    {selectedOption === "import" &&
                                        "Thêm từ danh sách"}
                                    {selectedOption === "download" &&
                                        "Tải lên hàng loạt"}
                                </span>
                            </div>
                        ) : (
                            "Thêm khách hàng"
                        )}
                    </DialogTitle>
                </DialogHeader>
                <ScrollArea className="flex flex-col flex-1">
                    {renderContent()}
                </ScrollArea>
                <DialogFooter className={"mt-auto p-4 border-t-[1px]"}>
                    <Button variant="outline" onClick={() => setOpen(false)}>
                        Hủy
                    </Button>
                    <Button onClick={handleSave}>Lưu</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
