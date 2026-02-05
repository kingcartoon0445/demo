"use client";

import { useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";
import { uploadFile } from "@/api/org";
import toast from "react-hot-toast";

// ⚡ Đường dẫn local script (phải trỏ đúng public path)
const TINYMCE_SRC = "/tinymce/tinymce.min.js";

type Props = {
    id?: string;
    initialValue: string;
    onReady?: (editor: any) => void;
    onChange?: (value: string) => void;
    orgId?: string; // Organization ID để upload file
};

export default function ({
    id,
    initialValue,
    onReady,
    onChange,
    orgId,
}: Props) {
    const editorRef = useRef<any>(null);
    const debounceRef = useRef<any>(null);

    useEffect(() => {
        if (editorRef.current && onReady) onReady(editorRef.current);
    }, [editorRef.current]);

    return (
        <Editor
            id={id}
            // ⚡ Quan trọng: ép load script local thay vì CDN (self-hosted)
            tinymceScriptSrc={TINYMCE_SRC}
            licenseKey="gpl"
            onInit={(_evt, editor) => {
                editorRef.current = editor;
                if (onReady) onReady(editor);
            }}
            initialValue={initialValue}
            onEditorChange={(content) => {
                if (debounceRef.current) clearTimeout(debounceRef.current);
                debounceRef.current = setTimeout(() => {
                    onChange?.(content);
                }, 200);
            }}
            init={{
                // Ẩn banner quảng bá
                promotion: false,
                // height: "100%", // Remove fixed height
                min_height: 400,
                autoresize_bottom_margin: 20,
                resize: false,
                menubar: false,
                plugins: [
                    "lists",
                    "advlist",
                    "link",
                    "code",
                    "table",
                    "paste",
                    "autolink",
                    "emoticons",
                    "autolink",
                    "emoticons",
                    "image",
                    "autoresize",
                ],
                toolbar:
                    "undo redo | blocks fontselect fontsizeselect | bold italic underline forecolor backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | link image table | code removeformat",
                // Image upload handler
                images_upload_handler: async (blobInfo, progress) => {
                    return new Promise(async (resolve, reject) => {
                        if (!orgId) {
                            toast.error("Không tìm thấy organization ID");
                            reject("Organization ID is required");
                            return;
                        }

                        try {
                            // Convert blob to File
                            const file = new File(
                                [blobInfo.blob()],
                                blobInfo.filename() ||
                                    `image_${Date.now()}.jpg`,
                                { type: blobInfo.blob().type }
                            );

                            // Upload file using API
                            const response = await uploadFile(orgId, file);

                            // Check response structure
                            if (response?.code === 0 && response?.content) {
                                // Return the URL from response
                                resolve(response.content);
                            } else {
                                toast.error("Upload hình ảnh thất bại");
                                reject("Upload failed");
                            }
                        } catch (error: any) {
                            console.error("Error uploading image:", error);
                            toast.error(
                                error?.response?.data?.message ||
                                    "Có lỗi xảy ra khi upload hình ảnh"
                            );
                            reject(error);
                        }
                    });
                },
                // Image options
                image_advtab: true,
                image_caption: true,
                image_title: true,
                automatic_uploads: true,
                file_picker_types: "image",
                branding: false,
                font_family_formats:
                    "Arial=arial,helvetica,sans-serif;" +
                    "Helvetica=helvetica,arial,sans-serif;" +
                    "Georgia=georgia,palatino;" +
                    "Times New Roman='Times New Roman',times;" +
                    "Courier New='Courier New',courier;" +
                    "Roboto=Roboto,Arial,Helvetica,sans-serif",
                fontsize_formats:
                    "10px 12px 14px 16px 18px 20px 24px 28px 32px 36px",
                verify_html: false,
                cleanup: false,
                valid_elements: "*[*]",
                extended_valid_elements: "*[*]",
                valid_children: "+*[*]",
                forced_root_block: "",
                keep_styles: true,
                convert_fonts_to_spans: true,
                remove_trailing_brs: false,
                table_default_attributes: {
                    border: "0",
                    cellpadding: "0",
                    cellspacing: "0",
                },
                table_default_styles: {
                    width: "100%",
                    borderCollapse: "collapse",
                },
                content_style:
                    "html,body{height:100%;background:transparent;} body{font-family:Arial,Helvetica,sans-serif;font-size:14px}",
                base_url: "/tinymce",
                suffix: ".min",
            }}
        />
    );
}
