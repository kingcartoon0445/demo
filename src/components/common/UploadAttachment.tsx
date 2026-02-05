import { useGetInfiniteTaskJourney } from "@/hooks/useBusinessProcess";
import {
    useDeleteAttachment,
    useUploadAttachment,
    useUploadAttachmentCustomer,
} from "@/hooks/useCustomerV2";
import {
    useInfiniteCustomerJourney,
    useInfiniteLeadJourney,
} from "@/hooks/useJourney";
import { TaskJourney } from "@/interfaces/businessProcess";
import { getRelativeTime } from "@/lib/dateUtils";
import { ProductApiResponse } from "@/lib/interface";
import { JourneyEvent, JourneyResponse } from "@/lib/journeyUtils";
import { transformAttachmentToTimeline } from "@/lib/journeyUtils";
import { DotIcon, MoreHorizontal, Upload } from "lucide-react";
import { useCallback, useRef, useState } from "react";
import Loading from "../common/Loading";
import { Button } from "../ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { ScrollArea } from "../ui/scroll-area";
import JourneyIcon from "./JourneyIcon";
import ConfirmDialog from "./ConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";

export default function UploadAttachment({
    orgId,
    leadId,
    taskId,
    provider,
}: {
    orgId: string;
    leadId: string;
    taskId: string;
    provider: string;
}) {
    const { t } = useLanguage();
    // const MAX_FILE_SIZE = 1024 * 1024; // 1MB
    const [fileError, setFileError] = useState<string | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [isDragging, setIsDragging] = useState(false);
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<JourneyEvent | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { mutate: uploadAttachment } =
        provider === "lead"
            ? useUploadAttachment(orgId, leadId)
            : useUploadAttachmentCustomer(orgId, leadId);

    const observerRef = useRef<IntersectionObserver | null>(null);
    // Fetch journey data với infinite scroll
    const journeyHook =
        provider === "bpt"
            ? useGetInfiniteTaskJourney(orgId || "", taskId || "", "ATTACHMENT")
            : provider === "lead"
            ? useInfiniteLeadJourney(
                  orgId || "",
                  leadId || "",
                  20,
                  "ATTACHMENT"
              )
            : provider === "customer"
            ? useInfiniteCustomerJourney(
                  orgId || "",
                  leadId || "",
                  20,
                  "ATTACHMENT"
              )
            : useInfiniteLeadJourney(
                  orgId || "",
                  leadId || "",
                  20,
                  "ATTACHMENT"
              );

    const {
        data: journeyData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
        refetch,
    } = journeyHook;

    // Flatten all pages data và transform
    const transformedEvents = (() => {
        if (!journeyData?.pages) return [];

        if (provider === "bpt") {
            // Lấy tất cả các pages và nối dữ liệu lại với nhau
            const allTaskJourneys = journeyData.pages.flatMap((page) => {
                const typedPage =
                    page as unknown as ProductApiResponse<TaskJourney>;
                return typedPage.data || [];
            });

            return allTaskJourneys.map(
                (taskJourney) =>
                    ({
                        id: taskJourney.id,
                        summary: taskJourney.summary,
                        type: taskJourney.type,
                        icon: taskJourney.icon,
                        createdByName: taskJourney.createdByName,
                        createdDate: taskJourney.createdDate,
                    } as JourneyEvent)
            );
        } else {
            return journeyData.pages.flatMap(
                (page) => (page as JourneyResponse).content
            ) as JourneyEvent[];
        }
    })();

    const { mutate: deleteAttachment } = useDeleteAttachment(
        orgId,
        leadId,
        selectedNote?.id || ""
    );
    //const timelineEvents = transformJourneyArrayToTimeline(transformedEvents);
    const handleDeleteClick = (event: JourneyEvent) => {
        setSelectedNote({
            id: event.id,
            summary: event.summary,
            icon: event.icon,
            createdByName: event.createdByName,
            createdDate: event.createdDate,
        });
        setIsConfirmDialogOpen(true);
    };
    // Intersection Observer để load more data
    const lastElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading || !node) return;
            if (observerRef.current) observerRef.current.disconnect();

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];
                    if (
                        entry.isIntersecting &&
                        hasNextPage &&
                        !isFetchingNextPage &&
                        orgId &&
                        ((provider === "bpt" && taskId) ||
                            (provider !== "bpt" && leadId))
                    ) {
                        fetchNextPage();
                    }
                },
                {
                    root: null,
                    rootMargin: "200px",
                    threshold: 0.1,
                }
            );

            // Quan trọng: Gọi observe trên node
            observerRef.current.observe(node);
        },
        [
            isLoading,
            hasNextPage,
            isFetchingNextPage,
            fetchNextPage,
            orgId,
            provider,
            leadId,
            taskId,
        ]
    );
    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];

            // Reset previous errors
            setFileError(null);

            // Validate file size
            // if (file.size > MAX_FILE_SIZE) {
            //     setFileError(
            //         "Kích thước tệp quá lớn. Vui lòng chọn tệp nhỏ hơn hoặc bằng 1MB."
            //     );
            //     return;
            // }

            try {
                setIsUploading(true);

                // Create FormData object
                const formData = new FormData();
                formData.append("request", file);

                // Call the API to upload the image
                await uploadAttachment(formData);

                // Refetch data after successful upload
                refetch();

                // Clear any errors
                setFileError(null);
            } catch (error) {
                console.error("Failed to upload image");
                setFileError(
                    "Không thể tải lên hình ảnh. Vui lòng thử lại sau."
                );
            } finally {
                setIsUploading(false);
            }
        }
    };

    const handleFileUpload = useCallback(() => {
        if (fileInputRef.current) {
            fileInputRef.current.click();
        }
    }, []);

    const handleDragEnter = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(true);
        },
        []
    );

    const handleDragLeave = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);
        },
        []
    );

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        e.stopPropagation();
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent<HTMLDivElement>) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragging(false);

            if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                const file = e.dataTransfer.files[0];

                // Create a synthetic event to reuse the existing handleFileChange function
                const syntheticEvent = {
                    target: {
                        files: e.dataTransfer.files,
                    },
                } as React.ChangeEvent<HTMLInputElement>;

                handleFileChange(syntheticEvent);
            }
        },
        [handleFileChange]
    );
    return (
        <div className="space-y-4 p-4 h-full pb-16">
            {/* File Upload Area */}
            <div
                className={`border-2 border-dashed ${
                    isDragging
                        ? "border-sidebar-primary bg-sidebar-primary/5"
                        : "border-gray-300"
                } rounded-lg p-8 text-center cursor-pointer transition-colors`}
                onClick={handleFileUpload}
                onDragEnter={handleDragEnter}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
            >
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    onChange={handleFileChange}
                    accept="*"
                />
                <div className="w-12 h-12 mx-auto bg-sidebar-primary/10 rounded-lg flex items-center justify-center mb-3">
                    <Upload size={24} className="text-sidebar-primary" />
                </div>
                <div className="text-sm font-medium text-gray-900 mb-1">
                    {t("common.attachmentUpload")}
                </div>
                <div className="text-xs text-gray-500 mb-3">
                    {t("common.attachmentUploadDescription")}
                </div>
                <button
                    className="px-4 py-2 bg-sidebar-primary text-sidebar-primary-foreground text-sm rounded-lg hover:bg-sidebar-primary/90"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleFileUpload();
                    }}
                >
                    {t("common.attachmentUpload")}
                </button>
            </div>

            <ScrollArea className="space-y-3 h-full pb-64">
                {/* Loading state */}
                {isLoading && <Loading />}

                {/* Error state */}
                {isError && (
                    <div className="flex items-center justify-center py-8 text-red-500">
                        <span className="text-sm">
                            {t("error.loadTimeline")}: {error?.message}
                        </span>
                    </div>
                )}

                {/* No customer selected */}
                {!leadId && !isLoading && (
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <span className="text-sm">
                            {t("common.selectCustomerToViewTimeline")}
                        </span>
                    </div>
                )}

                {/* Timeline events */}
                {!isLoading && !isError && leadId && (
                    <div className="space-y-3">
                        {transformedEvents.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <span className="text-sm">
                                    {t("error.noActivity")}
                                </span>
                            </div>
                        ) : (
                            <>
                                {transformedEvents.map((event, index) => {
                                    let filePath = "";
                                    let fileName = "";
                                    if (event.type === "ATTACHMENT") {
                                        const attachmentInfo =
                                            transformAttachmentToTimeline(
                                                event.jsonSummary ||
                                                    event.summary
                                            );
                                        if (
                                            typeof attachmentInfo ===
                                                "object" &&
                                            attachmentInfo?.type ===
                                                "attachment"
                                        ) {
                                            fileName =
                                                attachmentInfo.fileName || "";
                                            filePath =
                                                attachmentInfo.filePath || "";
                                        } else if (
                                            typeof attachmentInfo === "string"
                                        ) {
                                            fileName = attachmentInfo;
                                        }
                                    }

                                    return (
                                        <div
                                            key={event.id}
                                            ref={
                                                index ===
                                                transformedEvents.length - 1
                                                    ? lastElementRef
                                                    : null
                                            }
                                            className="relative flex gap-4 px-3  hover:bg-muted/30 rounded-lg transition-colors"
                                        >
                                            {/* Timeline connector */}
                                            <div className="relative flex flex-col">
                                                {/* Icon */}
                                                <div className="relative z-10">
                                                    <JourneyIcon
                                                        summary={event.summary}
                                                    />
                                                </div>

                                                {/* Connector line */}
                                                {index <
                                                    transformedEvents.length -
                                                        1 && (
                                                    <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-200 border-l-2 border-dashed border-gray-300"></div>
                                                )}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 pt-1 pb-6 break-words">
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-xs text-muted-foreground shrink-0">
                                                            {getRelativeTime(
                                                                event.createdDate ||
                                                                    "",
                                                                t
                                                            )}
                                                        </span>
                                                        <span className="text-xs text-muted-foreground shrink-0">
                                                            <DotIcon className="size-3" />
                                                        </span>
                                                        <span className="text-xs text-muted-foreground shrink-0">
                                                            {
                                                                event.createdByName
                                                            }
                                                        </span>
                                                    </div>

                                                    {event.type?.toLowerCase() ===
                                                        "attachment" && (
                                                        <DropdownMenu>
                                                            <DropdownMenuTrigger
                                                                asChild
                                                            >
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    className="h-8 w-8 p-0"
                                                                >
                                                                    <MoreHorizontal className="h-4 w-4" />
                                                                </Button>
                                                            </DropdownMenuTrigger>
                                                            <DropdownMenuContent align="end">
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDeleteClick(
                                                                            event
                                                                        )
                                                                    }
                                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                                >
                                                                    {/* <Trash2 className="mr-2 h-4 w-4" /> */}
                                                                    {t(
                                                                        "common.deleteAttachment"
                                                                    )}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>

                                                <div className="mb-1">
                                                    <p className="text-sm font-medium text-foreground leading-tight break-words whitespace-pre-wrap">
                                                        {event.type ===
                                                        "ATTACHMENT" ? (
                                                            <>
                                                                {t(
                                                                    "common.attachment"
                                                                )}
                                                                :{" "}
                                                                <a
                                                                    href={
                                                                        filePath
                                                                    }
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="text-blue-600 hover:underline"
                                                                >
                                                                    {fileName}
                                                                </a>
                                                            </>
                                                        ) : (
                                                            event.summary
                                                        )}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Loading indicator cho infinite scroll */}
                                {isFetchingNextPage && <Loading />}
                            </>
                        )}
                    </div>
                )}
            </ScrollArea>
            {isConfirmDialogOpen && (
                <ConfirmDialog
                    isOpen={isConfirmDialogOpen}
                    onClose={() => setIsConfirmDialogOpen(false)}
                    onConfirm={() => deleteAttachment()}
                    title={t("common.confirmDelete")}
                    description={t("confirm.deleteAttachment")}
                />
            )}
        </div>
    );
}
