import { getEmailById } from "@/api/email";
import ReminderList from "@/app/org/[orgId]/reminders/components/ReminderList";
import { useGetInfiniteTaskJourney } from "@/hooks/useBusinessProcess";
import { useInfiniteJourney } from "@/hooks/useJourney";
import { CustomerInfo, TaskJourney } from "@/interfaces/businessProcess";
import { getRelativeTime } from "@/lib/dateUtils";
import { Lead, ProductApiResponse } from "@/lib/interface";
import {
    AssignTimelineInfo,
    EmailTimelineInfo,
    isConversationUnlinked,
    JourneyEvent,
    JourneyResponse,
    transformAssignToTimeline,
    transformAttachmentToTimeline,
    transformCreateNote,
    transformJourneyToTimeline,
    transformUpdateStage,
} from "@/lib/journeyUtils";
import ProfilePopover from "@/components/ProfilePopover";

import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    useDeleteTaskNote,
    useEditTaskNote,
} from "@/hooks/useBusinessProcessDetail";
import { useDeleteNote, useEditNote } from "@/hooks/useCustomerV2";
import { DotIcon, MoreHorizontal, RefreshCcw, StarIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "../ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../ui/dialog";
import ConfirmDialog from "./ConfirmDialog";
import EditNoteDialog from "./EditNoteDialog";
import EmailPreviewDialog from "./EmailPreviewDialog";
import JourneyIcon from "./JourneyIcon";
import Loading from "./Loading";
import JourneyLoading from "./JourneyLoading";
import { useLanguage } from "@/contexts/LanguageContext";
import Image from "next/image";
import { getIconPath } from "@/lib/utils";
import { MdEmail } from "react-icons/md";

interface CustomerJourneyProps {
    taskId: string | null;
    customer: Lead | CustomerInfo | null;
    orgId: string;
    workspaceId: string | null;
    provider: string;
    refreshStage?: () => void;
}
export default function CustomerJourney({
    taskId,
    customer,
    orgId,
    workspaceId,
    provider,
    refreshStage,
}: CustomerJourneyProps) {
    console.log("customer", customer);
    const { t } = useLanguage();
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
    const [selectedNote, setSelectedNote] = useState<{
        id: string;
        content: string;
    } | null>(null);
    const [editedNote, setEditedNote] = useState("");
    const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState(false);
    const [emailPreview, setEmailPreview] = useState<{
        open: boolean;
        loading: boolean;
        data: any | null;
        error: string | null;
    }>({
        open: false,
        loading: false,
        data: null,
        error: null,
    });
    const [emailPreviewDialog, setEmailPreviewDialog] = useState<{
        open: boolean;
        emailId: string | null;
        loading: boolean;
        data: any | null;
        error: string | null;
    }>({
        open: false,
        emailId: null,
        loading: false,
        data: null,
        error: null,
    });
    const observerRef = useRef<IntersectionObserver | null>(null);
    const router = useRouter();
    // Fetch journey data with a single unified hook to keep hook order stable
    const selectedJourneyHook = useInfiniteJourney(
        provider === "bpt" ? "bpt" : provider === "lead" ? "lead" : "customer",
        orgId || "",
        provider === "bpt" ? taskId || "" : customer?.id || "",
        20,
        "",
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
    } = selectedJourneyHook;

    // Flatten all pages data và transform
    const transformedEvents = (() => {
        if (!journeyData?.pages) return [];

        if (provider === "bpt") {
            // Lấy tất cả các pages và nối dữ liệu lại với nhau
            const allTaskJourneys = journeyData.pages.flatMap(
                (page: unknown) => {
                    const typedPage =
                        page as unknown as ProductApiResponse<TaskJourney>;
                    return typedPage.data || [];
                },
            );

            return allTaskJourneys.map(
                (taskJourney: TaskJourney) =>
                    ({
                        id: taskJourney.id,
                        summary: taskJourney.summary,
                        type: taskJourney.type,
                        icon: taskJourney.icon,
                        createdByName: taskJourney.createdByName,
                        createdDate: taskJourney.createdDate,
                        oldValue: taskJourney.oldValue,
                        newValue: taskJourney.newValue,
                    }) as JourneyEvent,
            );
        } else {
            return journeyData.pages.flatMap(
                (page: JourneyResponse) => page.content,
            ) as JourneyEvent[];
        }
    })();
    //const timelineEvents = transformJourneyArrayToTimeline(transformedEvents);
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
                            (provider !== "bpt" && customer?.id))
                    ) {
                        fetchNextPage();
                    }
                },
                {
                    root: null,
                    rootMargin: "200px",
                    threshold: 0.1,
                },
            );

            // Quan trọng: Gọi observe trên node
            observerRef.current.observe(node);
        },
        [
            isLoading,
            hasNextPage,
            isFetchingNextPage,
            fetchNextPage,
            customer?.id,
            taskId,
            orgId,
            provider,
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
    // Helper function to convert URLs in text to clickable links
    const renderTextWithLinks = (text: string) => {
        if (!text || typeof text !== "string") return text;

        // Regex to match http:// or https:// URLs
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        const parts = text.split(urlRegex);

        return (
            <>
                {parts.map((part, index) => {
                    // Check if part is a URL by testing if it matches the pattern
                    const isUrl = /^https?:\/\/[^\s]+$/.test(part);
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

    const formatRecipientsForDisplay = (value: unknown) => {
        if (!value || value === "null") return "—";
        if (Array.isArray(value)) {
            return value.map((item) => String(item).trim()).join(", ");
        }
        if (typeof value === "string") {
            const trimmed = value.trim();
            if (!trimmed) return "—";
            try {
                const parsed = JSON.parse(trimmed);
                if (Array.isArray(parsed)) {
                    return parsed.map((item) => String(item).trim()).join(", ");
                }
            } catch {}
            return trimmed;
        }
        return String(value);
    };

    const handleOpenEmailDetail = useCallback(
        async (emailId?: string) => {
            if (!emailId || !orgId) return;
            setEmailPreview({
                open: true,
                loading: true,
                data: null,
                error: null,
            });
            try {
                const response = (await getEmailById(orgId, emailId)) as {
                    content?: any;
                };
                setEmailPreview({
                    open: true,
                    loading: false,
                    data: response?.content || null,
                    error: null,
                });
            } catch (error) {
                const message =
                    (error as any)?.response?.data?.message ||
                    (error as Error)?.message ||
                    "Không thể tải nội dung email, vui lòng thử lại";
                setEmailPreview({
                    open: true,
                    loading: false,
                    data: null,
                    error: message,
                });
            }
        },
        [orgId],
    );

    const handleOpenEmailPreview = useCallback(
        async (emailId: string) => {
            if (!emailId || !orgId) return;

            // Mở dialog và bắt đầu load email
            setEmailPreviewDialog({
                open: true,
                emailId,
                loading: true,
                data: null,
                error: null,
            });

            try {
                const response = (await getEmailById(orgId, emailId)) as {
                    content?: any;
                };
                setEmailPreviewDialog({
                    open: true,
                    emailId,
                    loading: false,
                    data: response?.content || null,
                    error: null,
                });
            } catch (error) {
                const message =
                    (error as any)?.response?.data?.message ||
                    (error as Error)?.message ||
                    "Không thể tải nội dung email, vui lòng thử lại";
                setEmailPreviewDialog({
                    open: true,
                    emailId,
                    loading: false,
                    data: null,
                    error: message,
                });
            }
        },
        [orgId],
    );

    const handleCloseEmailDialog = useCallback(() => {
        setEmailPreview({
            open: false,
            loading: false,
            data: null,
            error: null,
        });
    }, []);

    const renderRating = (event: JourneyEvent, idx: number) => {
        const match = event.summary.match(/^(.*?):?\s*(\d+)$/);
        const title = match ? match[1] : event.summary;
        const rating = match ? parseInt(match[2]) : 0;

        return (
            <div key={idx} className="">
                <span className="text-sm font-medium text-foreground leading-tight block">
                    {title}
                </span>
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

    // Prepare both delete mutations to keep hook order stable, choose at runtime
    const deleteTaskNoteMutation = useDeleteTaskNote(
        orgId,
        taskId || "",
        selectedNote?.id || "",
    );
    const deleteLeadNoteMutation = useDeleteNote(
        orgId,
        customer?.id || "",
        selectedNote?.id || "",
    );
    const { mutate: deleteNote, isPending: isDeleting } = taskId
        ? deleteTaskNoteMutation
        : deleteLeadNoteMutation;

    const { mutate: editNote, isPending: isEditing } = useEditNote(
        orgId,
        customer?.id || "",
        selectedNote?.id || "",
    );

    const { mutate: editTaskNote, isPending: isEditingTask } = useEditTaskNote(
        orgId,
        taskId || "",
        selectedNote?.id || "",
    );
    const handleSaveEdit = () => {
        if (editedNote.trim() && selectedNote) {
            // Chỉ gửi nội dung người dùng nhập vào, không kèm prefix
            if (taskId) {
                editTaskNote({ content: editedNote });
            } else {
                editNote({ note: editedNote });
            }
            setIsEditDialogOpen(false);
        }
    };

    return (
        <>
            <div className="flex-1 overflow-y-auto p-4 pb-40 h-full w-full">
                <ReminderList
                    customerId={customer?.id || ""}
                    customerName={
                        customer?.fullName ||
                        (customer as Lead)?.customer ||
                        (customer as CustomerInfo)?.fullName
                    }
                    orgId={orgId}
                    taskId={taskId || ""}
                    workspaceId={workspaceId}
                    provider={provider}
                    refreshStage={refreshStage}
                />
                <div className="space-y-3 w-full">
                    <div className="flex justify-between items-center w-full">
                        <h4 className="text-md font-semibold">
                            {t("common.history")}
                        </h4>
                        <button
                            onClick={() => {
                                refetch();
                            }}
                            className="text-xs text-blue-500 hover:text-blue-700 flex items-center gap-1"
                        >
                            <RefreshCcw className="w-3 h-3" />
                            {t("common.refresh")}
                        </button>
                    </div>

                    {/* Loading state */}
                    {isLoading && <JourneyLoading />}

                    {/* Error state */}
                    {isError && (
                        <div className="flex items-center justify-center py-8 text-red-500">
                            <span className="text-sm">
                                {t("error.loadTimeline")}: {error?.message}
                            </span>
                        </div>
                    )}

                    {/* No customer selected */}
                    {!customer && !isLoading && (
                        <div className="flex items-center justify-center py-8 text-muted-foreground">
                            <span className="text-sm">
                                {t("error.selectCustomer")}
                            </span>
                        </div>
                    )}

                    {/* Timeline events */}
                    {!isLoading && !isError && customer && (
                        <div
                            className={`space-y-3  ${
                                provider === "customer"
                                    ? "w-full"
                                    : "max-w-[700px]"
                            }`}
                        >
                            {transformedEvents.length === 0 ? (
                                <div className="flex items-center justify-center py-8 text-muted-foreground">
                                    <span className="text-sm">
                                        {t("error.noActivity")}
                                    </span>
                                </div>
                            ) : (
                                <>
                                    {transformedEvents.map(
                                        (
                                            event: JourneyEvent,
                                            index: number,
                                        ) => {
                                            // Determine icon based on event type
                                            const iconPath = getIconPath(
                                                event.type || "",
                                                (customer as any)?.source ||
                                                    (customer as any)
                                                        ?.sourceName ||
                                                    "",
                                                event.createdByName,
                                            );
                                            return (
                                                <div
                                                    key={event.id}
                                                    ref={
                                                        index ===
                                                        transformedEvents.length -
                                                            1
                                                            ? lastElementRef
                                                            : null
                                                    }
                                                    className="relative flex gap-4 px-3 hover:bg-muted/30 rounded-lg transition-colors w-full mb-3"
                                                >
                                                    {/* Timeline connector */}
                                                    <div className="relative flex flex-col">
                                                        {/* Icon */}
                                                        {event.type ===
                                                        "EMAIL" ? (
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
                                                                    src={
                                                                        iconPath
                                                                    }
                                                                    width={40}
                                                                    height={40}
                                                                    className="object-contain"
                                                                />
                                                            </div>
                                                        )}

                                                        {/* Connector line */}
                                                        {index <
                                                            transformedEvents.length -
                                                                1 && (
                                                            <div className="absolute top-8 left-1/2 transform -translate-x-1/2 w-0.5 h-full bg-gray-200 border-l-2 border-dashed border-gray-300"></div>
                                                        )}
                                                    </div>

                                                    {/* Content */}
                                                    <div className="flex-1 min-w-0 pt-1 pb-6 break-words">
                                                        <div className="flex items-center gap-2 justify-between">
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

                                                        <div className="mb-1">
                                                            {event.summary &&
                                                            event.summary
                                                                .toLowerCase()
                                                                .includes(
                                                                    "đánh giá",
                                                                ) ? (
                                                                renderRating(
                                                                    event,
                                                                    index,
                                                                )
                                                            ) : (
                                                                <p className="text-sm font-medium text-foreground leading-tight break-words whitespace-pre-wrap">
                                                                    {event.type ===
                                                                    "ATTACHMENT"
                                                                        ? (() => {
                                                                              const attachmentInfo =
                                                                                  transformAttachmentToTimeline(
                                                                                      event.jsonSummary ||
                                                                                          event.summary,
                                                                                  );
                                                                              if (
                                                                                  typeof attachmentInfo ===
                                                                                      "object" &&
                                                                                  attachmentInfo.type ===
                                                                                      "attachment"
                                                                              ) {
                                                                                  return (
                                                                                      <>
                                                                                          {t(
                                                                                              "common.attachment",
                                                                                          )}

                                                                                          :{" "}
                                                                                          <a
                                                                                              href={
                                                                                                  attachmentInfo.filePath
                                                                                              }
                                                                                              target="_blank"
                                                                                              rel="noopener noreferrer"
                                                                                              className="text-blue-600 hover:underline"
                                                                                          >
                                                                                              {
                                                                                                  attachmentInfo.fileName
                                                                                              }
                                                                                          </a>
                                                                                      </>
                                                                                  );
                                                                              }
                                                                              return typeof attachmentInfo ===
                                                                                  "string"
                                                                                  ? renderTextWithLinks(
                                                                                        attachmentInfo,
                                                                                    )
                                                                                  : attachmentInfo;
                                                                          })()
                                                                        : event.type ===
                                                                            "LINK_CONVERSATION"
                                                                          ? (() => {
                                                                                const linkInfo =
                                                                                    transformJourneyToTimeline(
                                                                                        event.jsonSummary ||
                                                                                            "",
                                                                                        event.type,
                                                                                    );
                                                                                if (
                                                                                    typeof linkInfo ===
                                                                                        "object" &&
                                                                                    linkInfo.type ===
                                                                                        "link_conversation"
                                                                                ) {
                                                                                    // Kiểm tra xem conversation có bị unlink không
                                                                                    const isUnlinked =
                                                                                        isConversationUnlinked(
                                                                                            linkInfo.conversationId,
                                                                                            transformedEvents,
                                                                                            index,
                                                                                        );

                                                                                    return (
                                                                                        <>
                                                                                            {
                                                                                                linkInfo.displayText.split(
                                                                                                    ": ",
                                                                                                )[0]
                                                                                            }

                                                                                            :{" "}
                                                                                            {isUnlinked ? (
                                                                                                <span>
                                                                                                    {
                                                                                                        linkInfo.personName
                                                                                                    }
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span
                                                                                                    onClick={() => {
                                                                                                        router.push(
                                                                                                            `?cid=${linkInfo.conversationId}&source=messenger`,
                                                                                                        );
                                                                                                    }}
                                                                                                    className="text-blue-600 hover:underline cursor-pointer"
                                                                                                >
                                                                                                    {
                                                                                                        linkInfo.personName
                                                                                                    }
                                                                                                </span>
                                                                                            )}
                                                                                        </>
                                                                                    );
                                                                                }
                                                                                return typeof linkInfo ===
                                                                                    "string"
                                                                                    ? renderTextWithLinks(
                                                                                          linkInfo ||
                                                                                              event.summary,
                                                                                      )
                                                                                    : linkInfo ||
                                                                                          renderTextWithLinks(
                                                                                              event.summary,
                                                                                          );
                                                                            })()
                                                                          : event.type ===
                                                                              "UNLINK_CONVERSATION"
                                                                            ? (() => {
                                                                                  // UNLINK_CONVERSATION sử dụng previousJsonSummary
                                                                                  const unlinkInfo =
                                                                                      transformJourneyToTimeline(
                                                                                          event.previousJsonSummary ||
                                                                                              event.jsonSummary ||
                                                                                              "",
                                                                                          event.type,
                                                                                      );
                                                                                  if (
                                                                                      typeof unlinkInfo ===
                                                                                          "object" &&
                                                                                      unlinkInfo.type ===
                                                                                          "unlink_conversation"
                                                                                  ) {
                                                                                      return (
                                                                                          <>
                                                                                              {
                                                                                                  unlinkInfo.displayText.split(
                                                                                                      ": ",
                                                                                                  )[0]
                                                                                              }

                                                                                              :{" "}
                                                                                              <span>
                                                                                                  {
                                                                                                      unlinkInfo.personName
                                                                                                  }
                                                                                              </span>
                                                                                          </>
                                                                                      );
                                                                                  }
                                                                                  return typeof unlinkInfo ===
                                                                                      "string"
                                                                                      ? renderTextWithLinks(
                                                                                            unlinkInfo ||
                                                                                                event.summary,
                                                                                        )
                                                                                      : unlinkInfo ||
                                                                                            renderTextWithLinks(
                                                                                                event.summary,
                                                                                            );
                                                                              })()
                                                                            : event.type ===
                                                                                "EMAIL"
                                                                              ? (() => {
                                                                                    const emailInfo =
                                                                                        transformJourneyToTimeline(
                                                                                            event.jsonSummary ||
                                                                                                "",
                                                                                            event.type,
                                                                                        );
                                                                                    if (
                                                                                        typeof emailInfo ===
                                                                                            "object" &&
                                                                                        emailInfo &&
                                                                                        (
                                                                                            emailInfo as EmailTimelineInfo
                                                                                        )
                                                                                            .type ===
                                                                                            "email_info"
                                                                                    ) {
                                                                                        const info =
                                                                                            emailInfo as EmailTimelineInfo;
                                                                                        return (
                                                                                            <div className="text-sm space-y-1">
                                                                                                <div className="font-medium">
                                                                                                    {
                                                                                                        info.summary
                                                                                                    }
                                                                                                </div>
                                                                                                {info.to &&
                                                                                                    info.to !==
                                                                                                        "—" && (
                                                                                                        <div>
                                                                                                            Email:{" "}
                                                                                                            <span className="font-semibold">
                                                                                                                {
                                                                                                                    info.to
                                                                                                                }
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                {info.cc &&
                                                                                                    info.cc !==
                                                                                                        "—" && (
                                                                                                        <div>
                                                                                                            CC:{" "}
                                                                                                            <span className="font-semibold">
                                                                                                                {
                                                                                                                    info.cc
                                                                                                                }
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                {info.bcc &&
                                                                                                    info.bcc !==
                                                                                                        "—" && (
                                                                                                        <div>
                                                                                                            BCC:{" "}
                                                                                                            <span className="font-semibold">
                                                                                                                {
                                                                                                                    info.bcc
                                                                                                                }
                                                                                                            </span>
                                                                                                        </div>
                                                                                                    )}
                                                                                                {info.emailId && (
                                                                                                    <button
                                                                                                        type="button"
                                                                                                        className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:underline mt-1"
                                                                                                        onClick={() =>
                                                                                                            handleOpenEmailPreview(
                                                                                                                info.emailId!,
                                                                                                            )
                                                                                                        }
                                                                                                    >
                                                                                                        Xem
                                                                                                        nội
                                                                                                        dung
                                                                                                    </button>
                                                                                                )}
                                                                                            </div>
                                                                                        );
                                                                                    }
                                                                                    return renderTextWithLinks(
                                                                                        event.summary,
                                                                                    );
                                                                                })()
                                                                              : event.type ===
                                                                                      "UPDATE_ASSIGNTO" ||
                                                                                  event.type ===
                                                                                      "UPDATE_ASSIGNTEAM" ||
                                                                                  event.type ===
                                                                                      "ASSIGNTO"
                                                                                ? (() => {
                                                                                      const assignInfo =
                                                                                          transformJourneyToTimeline(
                                                                                              event.jsonSummary ||
                                                                                                  event.newValue ||
                                                                                                  "",
                                                                                              event.type,
                                                                                              event.title,
                                                                                          ) as AssignTimelineInfo;
                                                                                      if (
                                                                                          assignInfo &&
                                                                                          assignInfo.type ===
                                                                                              "assign_info"
                                                                                      ) {
                                                                                          return (
                                                                                              <div className="text-sm">
                                                                                                  <div className="font-medium">
                                                                                                      {
                                                                                                          assignInfo.title
                                                                                                      }
                                                                                                  </div>
                                                                                                  {(assignInfo.userName ||
                                                                                                      assignInfo.teamName) && (
                                                                                                      <div className="mt-1">
                                                                                                          {assignInfo.userName ? (
                                                                                                              <>
                                                                                                                  Sang:{" "}
                                                                                                                  {assignInfo.userProfileId ? (
                                                                                                                      <ProfilePopover
                                                                                                                          profileId={
                                                                                                                              assignInfo.userProfileId
                                                                                                                          }
                                                                                                                      >
                                                                                                                          <span className="font-bold text-primary cursor-pointer hover:underline">
                                                                                                                              {
                                                                                                                                  assignInfo.userName
                                                                                                                              }
                                                                                                                          </span>
                                                                                                                      </ProfilePopover>
                                                                                                                  ) : (
                                                                                                                      <span className="font-bold text-primary">
                                                                                                                          {
                                                                                                                              assignInfo.userName
                                                                                                                          }
                                                                                                                      </span>
                                                                                                                  )}
                                                                                                                  {assignInfo.teamName &&
                                                                                                                      ", "}
                                                                                                              </>
                                                                                                          ) : null}
                                                                                                          {assignInfo.teamName ? (
                                                                                                              <>
                                                                                                                  đội
                                                                                                                  sale{" "}
                                                                                                                  {assignInfo.teamId ? (
                                                                                                                      <a
                                                                                                                          href={`/org/${orgId}/teams?teamId=${assignInfo.teamId}`}
                                                                                                                          className="font-bold text-primary text-blue-600 hover:underline cursor-pointer"
                                                                                                                          onClick={(
                                                                                                                              e,
                                                                                                                          ) => {
                                                                                                                              e.preventDefault();
                                                                                                                              router.push(
                                                                                                                                  `/org/${orgId}/teams?teamId=${assignInfo.teamId}`,
                                                                                                                              );
                                                                                                                          }}
                                                                                                                      >
                                                                                                                          {
                                                                                                                              assignInfo.teamName
                                                                                                                          }
                                                                                                                      </a>
                                                                                                                  ) : (
                                                                                                                      <span className="font-bold text-primary">
                                                                                                                          {
                                                                                                                              assignInfo.teamName
                                                                                                                          }
                                                                                                                      </span>
                                                                                                                  )}
                                                                                                              </>
                                                                                                          ) : null}
                                                                                                      </div>
                                                                                                  )}
                                                                                              </div>
                                                                                          );
                                                                                      }
                                                                                      return renderTextWithLinks(
                                                                                          event.summary,
                                                                                      );
                                                                                  })()
                                                                                : event.type ===
                                                                                        "UPDATE_FIELD" ||
                                                                                    event.type ===
                                                                                        "SOURCE"
                                                                                  ? (() => {
                                                                                        const info =
                                                                                            transformJourneyToTimeline(
                                                                                                event.jsonSummary ||
                                                                                                    "",
                                                                                                event.type ||
                                                                                                    "",
                                                                                                event.title,
                                                                                                event.oldValue,
                                                                                                event.newValue,
                                                                                            );
                                                                                        if (
                                                                                            typeof info ===
                                                                                                "object" &&
                                                                                            info &&
                                                                                            (
                                                                                                info as any
                                                                                            )
                                                                                                .type ===
                                                                                                "source_html"
                                                                                        ) {
                                                                                            return (
                                                                                                info as any
                                                                                            )
                                                                                                .node;
                                                                                        }
                                                                                        if (
                                                                                            typeof info ===
                                                                                            "string"
                                                                                        ) {
                                                                                            return renderTextWithLinks(
                                                                                                info ||
                                                                                                    event.summary,
                                                                                            );
                                                                                        }
                                                                                        return renderTextWithLinks(
                                                                                            event.summary,
                                                                                        );
                                                                                    })()
                                                                                  : event.type ===
                                                                                      "UPDATE_INFO"
                                                                                    ? event.title
                                                                                    : event.type ===
                                                                                        "UPDATE_STAGE"
                                                                                      ? transformUpdateStage(
                                                                                            event.oldValue ||
                                                                                                "",
                                                                                            event.newValue ||
                                                                                                "",
                                                                                            event.summary,
                                                                                        )
                                                                                      : event.type ===
                                                                                          "CREATE_NOTE"
                                                                                        ? transformCreateNote(
                                                                                              event.newValue ||
                                                                                                  "",
                                                                                              event.summary,
                                                                                          )
                                                                                        : renderTextWithLinks(
                                                                                              event.summary,
                                                                                          )}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        },
                                    )}

                                    {/* Loading indicator cho infinite scroll */}
                                    {isFetchingNextPage && <JourneyLoading />}
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
            <EditNoteDialog
                open={isEditDialogOpen}
                onOpenChange={setIsEditDialogOpen}
                editedNote={editedNote}
                setEditedNote={(value) => setEditedNote(value)}
                onSave={handleSaveEdit}
                isSaving={isEditing || isEditingTask}
                onCancel={() => setIsEditDialogOpen(false)}
            />

            <ConfirmDialog
                isOpen={isConfirmDialogOpen}
                onClose={() => setIsConfirmDialogOpen(false)}
                onConfirm={() => deleteNote()}
                title="Xác nhận"
                description="Bạn có chắc chắn muốn xóa ghi chú này?"
            />
            <EmailPreviewDialog
                open={emailPreview.open}
                onOpenChange={(open) => {
                    if (!open) {
                        handleCloseEmailDialog();
                    }
                }}
                subject={emailPreview.data?.subject}
                emailContent={emailPreview.data?.body}
                loading={emailPreview.loading}
                error={emailPreview.error}
            />
            <EmailPreviewDialog
                open={emailPreviewDialog.open}
                onOpenChange={(open) => {
                    setEmailPreviewDialog((prev) => ({
                        ...prev,
                        open,
                    }));
                }}
                subject={emailPreviewDialog.data?.subject}
                emailContent={emailPreviewDialog.data?.body}
                loading={emailPreviewDialog.loading}
                error={emailPreviewDialog.error}
            />
        </>
    );
}
