"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Upload,
    FileSpreadsheet,
    AlertCircle,
    CheckCircle,
    Download,
    ExternalLink,
} from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import * as XLSX from "xlsx";

interface ImportProductModalProps {
    isOpen: boolean;
    onClose: () => void;
    onImport: (products: any[]) => void;
    isLoading?: boolean;
}

interface ProductImportData {
    code: string;
    name: string;
    price: number;
    tax: number;
    description: string;
}

export default function ImportProductModal({
    isOpen,
    onClose,
    onImport,
    isLoading = false,
}: ImportProductModalProps) {
    const { t } = useLanguage();
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewData, setPreviewData] = useState<ProductImportData[]>([]);
    const [error, setError] = useState<string>("");
    const [isProcessing, setIsProcessing] = useState(false);
    const [rowErrors, setRowErrors] = useState<string[]>([]); // NEW
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;
        // Reset state trước khi xử lý file mới
        setSelectedFile(null);
        setPreviewData([]);
        setError("");
        setRowErrors([]);
        setSelectedFile(file);
        processFile(file);
        // Reset input value để có thể chọn lại cùng file
        if (fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const processFile = async (file: File) => {
        try {
            setIsProcessing(true);
            setRowErrors([]);
            const arrayBuffer = await file.arrayBuffer();
            const workbook = XLSX.read(arrayBuffer, { type: "array" });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
            const headerRow = jsonData[0] as string[];
            const expectedHeaders = [
                "mã sản phẩm",
                "tên sản phẩm",
                "giá",
                "thuế",
                "mô tả",
            ];
            if (!headerRow || headerRow.length < 5) {
                setError(
                    "File không đúng định dạng. Vui lòng sử dụng file mẫu."
                );
                setSelectedFile(null);
                setPreviewData([]);
                setRowErrors([]);
                return;
            }
            const isValidHeader = expectedHeaders.every(
                (expected, index) =>
                    headerRow[index]?.toString().toLowerCase().trim() ===
                    expected
            );
            if (!isValidHeader) {
                setError(
                    "Cột header không đúng định dạng. Vui lòng sử dụng file mẫu."
                );
                setSelectedFile(null);
                setPreviewData([]);
                setRowErrors([]);
                return;
            }
            const dataRows = jsonData.slice(1) as any[][];
            const processedData: ProductImportData[] = [];
            const errors: string[] = [];
            dataRows.forEach((row, index) => {
                // Bỏ qua dòng hoàn toàn trống (không có giá trị nào)
                if (
                    !row ||
                    row.every(
                        (cell) =>
                            cell === undefined || cell === null || cell === ""
                    )
                ) {
                    return;
                }
                const [code, name, price, tax, description] = row;
                const rowNumber = index + 2;
                const missingFields = [];
                if (!name) missingFields.push("Tên sản phẩm");
                if (!price) missingFields.push("Giá");
                if (tax === undefined || tax === null || tax === "")
                    missingFields.push("Thuế");
                if (missingFields.length > 0) {
                    errors.push(
                        `Dòng ${rowNumber}: Thiếu trường bắt buộc (${missingFields.join(
                            ", "
                        )})`
                    );
                    return;
                }
                processedData.push({
                    code: String(code || ""),
                    name: String(name || ""),
                    price: parseFloat(price) || 0,
                    tax: parseFloat(tax) || 0,
                    description: String(description || ""),
                });
            });
            setPreviewData(processedData);
            setRowErrors(errors);
            if (processedData.length === 0) {
                setError(
                    "Không tìm thấy dữ liệu hợp lệ trong file. Vui lòng kiểm tra lại."
                );
                setSelectedFile(null);
                setPreviewData([]);
                setRowErrors(errors);
            } else if (errors.length > 0) {
                setError(
                    "Một số dòng có lỗi, vui lòng kiểm tra chi tiết bên dưới."
                );
            } else {
                setError("");
            }
        } catch (error) {
            console.error("Error processing file:", error);
            setError(
                "Không thể đọc file. Vui lòng kiểm tra định dạng file và thử lại."
            );
            setSelectedFile(null);
            setPreviewData([]);
            setRowErrors([]);
        } finally {
            setIsProcessing(false);
        }
    };

    const handleImport = () => {
        if (previewData.length === 0) {
            setError("Không có dữ liệu để import");
            return;
        }

        // Transform data to match API format
        const productsToImport = previewData.map((product) => ({
            code: product.code,
            name: product.name,
            price: product.price,
            tax: product.tax,
            description: product.description,
            status: 1, // Default active status
        }));

        onImport(productsToImport);
    };

    const handleClose = () => {
        setSelectedFile(null);
        setPreviewData([]);
        setError("");
        setRowErrors([]);
        onClose();
    };

    const handleDrop = (event: React.DragEvent) => {
        event.preventDefault();
        const file = event.dataTransfer.files[0];
        if (file) {
            setSelectedFile(null);
            setPreviewData([]);
            setError("");
            setRowErrors([]);
            setSelectedFile(file);
            processFile(file);
            // Reset input value để có thể chọn lại cùng file
            if (fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        }
    };

    const handleDragOver = (event: React.DragEvent) => {
        event.preventDefault();
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent className="min-w-[800px] max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileSpreadsheet className="h-5 w-5" />
                        Import sản phẩm từ file Excel
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-6">
                    {/* File Upload Section */}
                    <div className="space-y-4">
                        <Label>Chọn file Excel</Label>
                        <div
                            className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-gray-400 transition-colors cursor-pointer"
                            onDrop={handleDrop}
                            onDragOver={handleDragOver}
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="h-8 w-8 mx-auto mb-4 text-gray-400" />
                            <p className="text-sm text-gray-600 mb-2">
                                Kéo thả file Excel vào đây hoặc click để chọn
                                file
                            </p>
                            <p className="text-xs text-gray-500">
                                Hỗ trợ định dạng: .xlsx, .xls
                            </p>
                            <Input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls"
                                onChange={handleFileSelect}
                                className="hidden"
                            />
                        </div>

                        {selectedFile && (
                            <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                Đã chọn: {selectedFile.name}
                            </div>
                        )}

                        {error && (
                            <div className="flex items-center gap-2 text-sm text-red-600">
                                <AlertCircle className="h-4 w-4" />
                                {error}
                            </div>
                        )}
                        {rowErrors.length > 0 && (
                            <div className="bg-red-50 border border-red-200 rounded p-2 mt-2 text-xs text-red-700">
                                <div className="font-semibold mb-1">
                                    Chi tiết lỗi:
                                </div>
                                <ul className="list-disc pl-5">
                                    {rowErrors.map((err, idx) => (
                                        <li key={idx}>{err}</li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>

                    {/* Preview Section */}
                    {previewData.length > 0 && (
                        <div className="space-y-4">
                            <Label>
                                Xem trước dữ liệu ({previewData.length} sản
                                phẩm)
                            </Label>
                            <div className="border rounded-lg overflow-hidden">
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left">
                                                    Mã SP
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Tên SP
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Giá
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Thuế (%)
                                                </th>
                                                <th className="px-4 py-2 text-left">
                                                    Mô tả
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {previewData
                                                .slice(0, 10)
                                                .map((product, index) => (
                                                    <tr
                                                        key={index}
                                                        className="border-t"
                                                    >
                                                        <td className="px-4 py-2">
                                                            {product.code}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {product.name}
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {product.price.toLocaleString(
                                                                "vi-VN"
                                                            )}{" "}
                                                            ₫
                                                        </td>
                                                        <td className="px-4 py-2">
                                                            {product.tax}%
                                                        </td>
                                                        <td className="px-4 py-2 max-w-xs truncate">
                                                            {
                                                                product.description
                                                            }
                                                        </td>
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                </div>
                                {previewData.length > 10 && (
                                    <div className="px-4 py-2 text-sm text-gray-500 bg-gray-50">
                                        ... và {previewData.length - 10} sản
                                        phẩm khác
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Format Instructions */}
                    <div className="space-y-4">
                        <Label>Hướng dẫn định dạng file</Label>
                        <div className="bg-gray-50 p-4 rounded-lg space-y-3">
                            <p className="text-sm text-gray-600">
                                File Excel cần có các cột theo thứ tự:
                            </p>
                            <div className="grid grid-cols-5 gap-2 text-xs">
                                <div className="font-medium">
                                    A: Mã Sản Phẩm
                                </div>
                                <div className="font-medium text-red-600">
                                    B: Tên Sản Phẩm *
                                </div>
                                <div className="font-medium text-red-600">
                                    C: Giá (số) *
                                </div>
                                <div className="font-medium text-red-600">
                                    D: Thuế (%) *
                                </div>
                                <div className="font-medium">E: Mô tả</div>
                            </div>
                            <p className="text-xs text-red-600 mt-2">
                                * Các trường bắt buộc: Tên sản phẩm, Giá, Thuế
                            </p>

                            <div className="flex items-center gap-2 pt-2 border-t border-gray-200">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() =>
                                        window.open(
                                            "https://docs.google.com/spreadsheets/d/1d3jCygaiM7IHpqsoCMADEE9i-_NFAA_l/edit?usp=drive_link&ouid=109185361428637581426&rtpof=true&sd=true",
                                            "_blank"
                                        )
                                    }
                                    className="flex items-center gap-1"
                                >
                                    <ExternalLink className="h-3 w-3" />
                                    Xem file mẫu
                                </Button>
                                <span className="text-xs text-gray-500">
                                    Hoặc tải về để tham khảo định dạng
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex justify-end gap-2">
                        <Button
                            variant="outline"
                            onClick={handleClose}
                            disabled={isLoading}
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleImport}
                            disabled={
                                isLoading ||
                                isProcessing ||
                                previewData.length === 0
                            }
                        >
                            {isLoading
                                ? "Đang import..."
                                : `Import ${previewData.length} sản phẩm`}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
