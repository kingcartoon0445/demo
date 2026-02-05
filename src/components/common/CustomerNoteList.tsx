import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useGetInfiniteTaskJourney } from "@/hooks/useBusinessProcess";
import {
    useDeleteTaskNote,
    useEditTaskNote,
} from "@/hooks/useBusinessProcessDetail";
import {
    useDeleteCustomerNote,
    useDeleteNote,
    useEditCustomerNote,
    useEditNote,
} from "@/hooks/useCustomerV2";
import {
    useInfiniteCustomerJourney,
    useInfiniteLeadJourney,
} from "@/hooks/useJourney";
import { TaskJourney } from "@/interfaces/businessProcess";
import { getRelativeTime } from "@/lib/dateUtils";
import { ProductApiResponse } from "@/lib/interface";
import {
    JourneyEvent,
    JourneyResponse,
    isConversationUnlinked,
    transformAssignToTimeline,
    transformAttachmentToTimeline,
    transformJourneyToTimeline,
} from "@/lib/journeyUtils";
import { DotIcon, MoreHorizontal, StarIcon } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { ScrollArea } from "../ui/scroll-area";
import ConfirmDialog from "./ConfirmDialog";
import EditNoteDialog from "./EditNoteDialog";
import JourneyIcon from "./JourneyIcon";
import Loading from "./Loading";
import { useLanguage } from "@/contexts/LanguageContext";
import { useRouter } from "next/navigation";
import { getIconPath } from "@/lib/utils";
import Image from "next/image";
import { MdEmail } from "react-icons/md";

export default function CustomerNoteList({
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
    const { t } = useLanguage();
    const router = useRouter();
    const observerRef = useRef<IntersectionObserver | null>(null);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<{
        id: string;
        content: string;
    } | null>(null);
    const [editedNote, setEditedNote] = useState("");
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const { mutate: editNote, isPending: isEditing } = useEditNote(
        orgId,
        customerId,
        selectedNote?.id || "",
    );

    const { mutate: editTaskNote, isPending: isEditingTask } = useEditTaskNote(
        orgId,
        taskId,
        selectedNote?.id || "",
    );

    const { mutate: editNoteCustomer, isPending: isEditingCustomer } =
        useEditCustomerNote(orgId, customerId, selectedNote?.id || "");

    const { mutate: deleteNote, isPending: isDeleting } =
        provider === "bpt"
            ? useDeleteTaskNote(orgId, taskId, selectedNote?.id || "")
            : provider === "lead"
              ? useDeleteNote(orgId, customerId, selectedNote?.id || "")
              : useDeleteCustomerNote(
                    orgId,
                    customerId,
                    selectedNote?.id || "",
                );

    const handleEditClick = (event: JourneyEvent) => {
        // Lấy phần nội dung sau dấu ":"
        const colonIndex = event.summary.indexOf(":");
        const noteContent =
            colonIndex !== -1
                ? event.summary.substring(colonIndex + 1).trim()
                : event.summary;

        setSelectedNote({
            id: event.id,
            content: event.summary,
        });
        setEditedNote(noteContent);
        setIsEditDialogOpen(true);
    };

    const handleDeleteClick = (event: JourneyEvent) => {
        setSelectedNote({
            id: event.id,
            content: event.summary,
        });
        setIsConfirmDialogOpen(true);
    };

    const handleSaveEdit = () => {
        if (editedNote.trim() && selectedNote) {
            // Chỉ gửi nội dung người dùng nhập vào, không kèm prefix
            if (taskId) {
                editTaskNote({ content: editedNote });
            } else if (provider === "lead") {
                editNote({ note: editedNote });
            } else {
                editNoteCustomer({ note: editedNote });
            }
            setIsEditDialogOpen(false);
        }
    };

    const journeyHook =
        provider === "bpt"
            ? useGetInfiniteTaskJourney(orgId || "", taskId, "NOTE")
            : provider === "lead"
              ? useInfiniteLeadJourney(
                    orgId || "",
                    customerId,
                    20,
                    "create_note",
                )
              : useInfiniteCustomerJourney(
                    orgId || "",
                    customerId || "",
                    20,
                    "create_note",
                );

    // Fetch journey data với infinite scroll
    const {
        data: journeyData,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isLoading,
        isError,
        error,
    } = journeyHook;

    // Flatten all pages data và transform
    let allJourneyEvents: JourneyEvent[] = [];
    if (provider === "bpt") {
        const allTaskJourneys = journeyData?.pages.flatMap((page) => {
            const typedPage =
                page as unknown as ProductApiResponse<TaskJourney>;
            return typedPage.data || [];
        });
        allJourneyEvents =
            allTaskJourneys?.map(
                (taskJourney) =>
                    ({
                        id: taskJourney.id,
                        summary: taskJourney.summary,
                        type: taskJourney.type,
                        icon: taskJourney.icon,
                        createdByName: taskJourney.createdByName,
                        createdDate: taskJourney.createdDate,
                    }) as JourneyEvent,
            ) || [];
    } else {
        allJourneyEvents =
            (journeyData?.pages as JourneyResponse[])?.flatMap(
                (page) => page.content,
            ) || [];
    }

    // Intersection Observer để load more data
    const lastElementRef = useCallback(
        (node: HTMLDivElement | null) => {
            if (isLoading) return;
            if (observerRef.current) observerRef.current.disconnect();

            observerRef.current = new IntersectionObserver(
                (entries) => {
                    const entry = entries[0];

                    if (
                        entry.isIntersecting &&
                        hasNextPage &&
                        !isFetchingNextPage &&
                        customerId &&
                        orgId
                    ) {
                        fetchNextPage();
                    }
                },
                {
                    root: null,
                    rootMargin: "100px",
                    threshold: 0.1,
                },
            );
        },
        [
            isLoading,
            hasNextPage,
            isFetchingNextPage,
            fetchNextPage,
            customerId,
            orgId,
        ],
    );

    // Cleanup observer khi component unmount
    useEffect(() => {
        return () => {
            if (observerRef.current) {
                observerRef.current.disconnect();
            }
        };
    }, []);

    const renderRating = (event: JourneyEvent, idx: number) => {
        const match = event.summary.match(/^(.*?):?\s*(\d+)$/);
        const title = match ? match[1] : event.summary;
        const rating = match ? parseInt(match[2]) : 0;

        return (
            <div key={idx} className="">
                <p className="text-sm font-medium text-foreground leading-tight">
                    {title}
                </p>
                <div className="flex mt-1">
                    {[...Array(5)].map((_, i) => (
                        <StarIcon
                            key={i}
                            className={`w-4 h-4 ${
                                i < rating
                                    ? "text-[#FFA500] fill-[#FFA500]"
                                    : "text-gray-300 fill-none"
                            }`}
                        />
                    ))}
                </div>
            </div>
        );
    };

    const renderTextWithLinks = (text: string) => {
        if (!text || typeof text !== "string") return text;

        const urlRegex = /(https?:\/\/[^\s]+)/gi;
        const parts = text.split(urlRegex);

        return (
            <>
                {parts.map((part, index) => {
                    const isUrl = /^https?:\/\/[^\s]+$/i.test(part);
                    if (isUrl) {
                        return (
                            <a
                                key={index}
                                href={part}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:underline"
                            >
                                {part}
                            </a>
                        );
                    }
                    return <span key={index}>{part}</span>;
                })}
            </>
        );
    };

    const renderEventContent = (event: JourneyEvent, index: number) => {
        if (
            event.summary?.toLowerCase().includes("đánh giá") &&
            event.summary &&
            event.summary.length > 0
        ) {
            return renderRating(event, index);
        }

        if (event.type === "ATTACHMENT") {
            const attachmentInfo = transformAttachmentToTimeline(
                event.jsonSummary || event.summary,
            );
            if (
                typeof attachmentInfo === "object" &&
                attachmentInfo?.type === "attachment"
            ) {
                return (
                    <>
                        {t("common.attachment")}:{" "}
                        <a
                            href={attachmentInfo.filePath}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:underline"
                        >
                            {attachmentInfo.fileName}
                        </a>
                    </>
                );
            }
            return renderTextWithLinks(
                typeof attachmentInfo === "string"
                    ? attachmentInfo
                    : event.summary,
            );
        }

        if (event.type === "LINK_CONVERSATION") {
            const linkInfo = transformJourneyToTimeline(
                event.jsonSummary || "",
                event.type,
            );
            if (
                typeof linkInfo === "object" &&
                linkInfo?.type === "link_conversation"
            ) {
                const isUnlinked = isConversationUnlinked(
                    linkInfo.conversationId,
                    allJourneyEvents,
                    index,
                );
                return (
                    <>
                        {linkInfo.displayText.split(": ")[0]}:{" "}
                        {isUnlinked ? (
                            <span>{linkInfo.personName}</span>
                        ) : (
                            <span
                                onClick={() =>
                                    router.push(
                                        `?cid=${linkInfo.conversationId}&source=messenger`,
                                    )
                                }
                                className="text-blue-600 hover:underline cursor-pointer"
                            >
                                {linkInfo.personName}
                            </span>
                        )}
                    </>
                );
            }
            return renderTextWithLinks(
                typeof linkInfo === "string" ? linkInfo : event.summary,
            );
        }

        if (event.type === "UNLINK_CONVERSATION") {
            const unlinkInfo = transformJourneyToTimeline(
                event.previousJsonSummary ||
                    event.jsonSummary ||
                    event.summary ||
                    "",
                event.type,
            );
            if (
                typeof unlinkInfo === "object" &&
                unlinkInfo?.type === "unlink_conversation"
            ) {
                return (
                    <>
                        {unlinkInfo.displayText.split(": ")[0]}:{" "}
                        <span>{unlinkInfo.personName}</span>
                    </>
                );
            }
            return renderTextWithLinks(
                typeof unlinkInfo === "string" ? unlinkInfo : event.summary,
            );
        }

        if (event.type === "ASSIGNTO") {
            const assignInfo = transformAssignToTimeline(event.summary);
            return typeof assignInfo === "string"
                ? renderTextWithLinks(assignInfo)
                : assignInfo;
        }

        if (
            event.type === "UPDATE_FIELD" ||
            event.type === "SOURCE" ||
            event.type === "CARE"
        ) {
            const info = transformJourneyToTimeline(
                event.jsonSummary || "",
                event.type,
            );
            if (
                typeof info === "object" &&
                (info as any)?.type === "source_html"
            ) {
                return (info as any).node;
            }
            if (typeof info === "string" && info) {
                return renderTextWithLinks(info);
            }
        }

        return renderTextWithLinks(event.summary);
    };

    return (
        <>
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

                {/* Timeline events */}
                {!isLoading && !isError && (customerId || taskId) && (
                    <div className="space-y-3">
                        {allJourneyEvents.length === 0 ? (
                            <div className="flex items-center justify-center py-8 text-muted-foreground">
                                <span className="text-sm">
                                    {t("error.noActivity")}
                                </span>
                            </div>
                        ) : (
                            <>
                                {allJourneyEvents.map((event, index) => {
                                    const iconPath = getIconPath(
                                        event.type || "",
                                        "",
                                        event.createdByName,
                                    );
                                    return (
                                        <div
                                            key={event.id}
                                            ref={
                                                index ===
                                                allJourneyEvents.length - 1
                                                    ? lastElementRef
                                                    : null
                                            }
                                            className="relative flex gap-4 px-3 hover:bg-muted/30 rounded-lg transition-colors"
                                        >
                                            {/* Timeline connector */}
                                            <div className="relative flex flex-col">
                                                {/* Icon */}
                                                {event.type === "EMAIL" ? (
                                                    <div className="w-[40px] h-[40px] rounded-full p-2 bg-bg2 flex items-center justify-center">
                                                        <MdEmail
                                                            className="text-primary"
                                                            size={20}
                                                        />
                                                    </div>
                                                ) : (
                                                    <div className="w-[40px] h-[40px] rounded-full p-2 bg-bg2 flex items-center justify-center">
                                                        <Image
                                                            alt="icon"
                                                            src={iconPath}
                                                            width={40}
                                                            height={40}
                                                            className="object-contain"
                                                        />
                                                    </div>
                                                )}

                                                {/* Connector line */}
                                                {index <
                                                    allJourneyEvents.length -
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
                                                                t,
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

                                                    {(event.type?.toLowerCase() ===
                                                        "create_note" ||
                                                        event.type?.toLowerCase() ===
                                                            "note") && (
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
                                                                        handleEditClick(
                                                                            event,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer"
                                                                >
                                                                    {/* <EditIcon className="mr-2 h-4 w-4" /> */}
                                                                    {t(
                                                                        "common.editNote",
                                                                    )}
                                                                </DropdownMenuItem>
                                                                <DropdownMenuItem
                                                                    onClick={() =>
                                                                        handleDeleteClick(
                                                                            event,
                                                                        )
                                                                    }
                                                                    className="cursor-pointer text-destructive focus:text-destructive"
                                                                >
                                                                    {/* <Trash2 className="mr-2 h-4 w-4" /> */}
                                                                    {t(
                                                                        "common.deleteNote",
                                                                    )}
                                                                </DropdownMenuItem>
                                                            </DropdownMenuContent>
                                                        </DropdownMenu>
                                                    )}
                                                </div>

                                                <div className="mb-1 text-sm font-medium text-foreground leading-tight break-words whitespace-pre-wrap">
                                                    {renderEventContent(
                                                        event,
                                                        index,
                                                    )}
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

            {/* Edit Note Dialog */}
            <EditNoteDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editedNote={editedNote}
                setEditedNote={(value) => setEditedNote(value)}
                onSave={handleSaveEdit}
                isSaving={isEditing || isEditingTask || isEditingCustomer}
                onCancel={() => setIsEditDialogOpen(false)}
            />

            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={() => deleteNote()}
                title={t("common.confirmDelete")}
                description={t("common.confirmDeleteNoteDescription")}
            />
        </>
    );
}
