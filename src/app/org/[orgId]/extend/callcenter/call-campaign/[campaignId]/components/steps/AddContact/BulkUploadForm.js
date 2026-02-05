import { FileUpload } from "@/components/ui/file-upload";
import { useState } from "react";
import toast from "react-hot-toast";
import { FaFileExcel } from "react-icons/fa";
import * as XLSX from 'xlsx';

export default function BulkUploadForm({ onAddContacts }) {
    const [files, setFiles] = useState([]);

    const validateData = (data) => {
        // Kiểm tra có đúng format không
        if (!Array.isArray(data)) return false;

        // Kiểm tra có các cột bắt buộc không
        const requiredColumns = ['name', 'phone'];
        const headers = Object.keys(data[0] || {}).map(key => key.toLowerCase().trim());

        return requiredColumns.every(col => headers.includes(col));
    };

    const handleFileUpload = async (files) => {
        try {
            const file = files[0];
            if (!file) return;

            const reader = new FileReader();
            reader.onload = async (e) => {
                const data = new Uint8Array(e.target.result);
                const workbook = XLSX.read(data, { type: 'array' });
                const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
                const jsonData = XLSX.utils.sheet_to_json(firstSheet);

                if (!validateData(jsonData)) {
                    toast.error("File không đúng định dạng. Vui lòng tải file mẫu và thử lại");
                    return;
                }

                // Chuẩn hóa dữ liệu
                const contacts = jsonData.map(row => ({
                    name: row.name?.toString().trim(),
                    phone: row.phone?.toString().trim()
                })).filter(contact => contact.name && contact.phone);

                if (contacts.length === 0) {
                    toast.error("Không có dữ liệu hợp lệ trong file");
                    return;
                }

                setFiles(files);
                if (onAddContacts) {
                    onAddContacts(contacts);
                }
                // toast.success(`Đã tải lên ${contacts.length} liên hệ thành công`);
            };
            reader.readAsArrayBuffer(file);
        } catch (error) {
            console.error("Error uploading file:", error);
            toast.error("Có lỗi xảy ra khi xử lý file");
        }
    };

    const handleDownloadSample = () => {
        const sampleFileUrl = '/sample_data/Predictivedialeremxple.xlsx';
        const link = document.createElement('a');
        link.href = sampleFileUrl;
        link.download = 'Predictivedialeremxple.xlsx';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <div className="p-4 flex flex-col gap-4">
            <div>
                <div className="font-medium mb-2">Tải xuống file mẫu</div>
                <div
                    className="flex items-center gap-2 text-sm cursor-pointer hover:opacity-80"
                    onClick={handleDownloadSample}
                >
                    <FaFileExcel className="w-4 h-4 text-green-600" />
                    <span className="text-primary">Predictivedialeremxple.xlsx</span>
                </div>
            </div>

            <div className="w-full max-w-4xl mx-auto border border-dashed bg-white dark:bg-black border-neutral-200 dark:border-neutral-800 rounded-lg">
                <FileUpload
                    description="Kéo thả file vào đây hoặc click để chọn file excel"
                    showFileInfo={false}
                    accept="application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                    onChange={handleFileUpload}
                />
            </div>
        </div>
    );
} 