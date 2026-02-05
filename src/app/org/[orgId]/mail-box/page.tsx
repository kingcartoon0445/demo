"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { EmailList } from "@/components/mail-box/EmailList";
import { EmailSidebar } from "@/components/mail-box/EmailSidebar";
import { EmailView } from "@/components/mail-box/EmailView";
import { ComposeEmailModal } from "@/components/mail-box/ComposeEmailModal";
import {
    EmailFilter,
    EmailFilterParams,
} from "@/components/mail-box/EmailFilter";
import { EmailAccountsManager } from "@/components/mail-box/EmailAccountsManager";
import { Glass } from "@/components/Glass";
import {
    getEmailList,
    testEmailConnection,
    syncEmails,
    getEmails,
    getEmailDetailById,
    markEmailAsRead,
    getEmailTags,
    EmailTag,
    getEmailAccountSummaries,
    getEmailFolders,
    deleteEmails,
} from "@/api/mail-box";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";

export default function EmailPage({
    params,
}: {
    params: Promise<{ orgId: string }>;
}) {
    const [orgId, setOrgId] = useState<string>("");
    const [activeFolder, setActiveFolder] = useState("INBOX");
    const [selectedEmailId, setSelectedEmailId] = useState<string | null>(null);
    const [checkedEmailIds, setCheckedEmailIds] = useState<string[]>([]);
    const [emailConfigs, setEmailConfigs] = useState<any[]>([]);
    const [selectedConfigId, setSelectedConfigId] = useState<string>("");
    const [isComposeOpen, setIsComposeOpen] = useState(false);
    const [isSettingsView, setIsSettingsView] = useState(false);
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isSyncing, setIsSyncing] = useState(false);
    const [emails, setEmails] = useState<any[]>([]);
    const [pagination, setPagination] = useState<any>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [isLoadingMore, setIsLoadingMore] = useState(false);
    const [selectedEmailDetail, setSelectedEmailDetail] = useState<any>(null);
    const [isLoadingDetail, setIsLoadingDetail] = useState(false);
    const hasAutoSelectedRef = React.useRef(false);
    const [filters, setFilters] = useState<EmailFilterParams>({});
    const [availableTags, setAvailableTags] = useState<EmailTag[]>([]); // New state params
    const [activeFolderMap, setActiveFolderMap] = useState<
        Record<string, string>
    >({});
    const [folders, setFolders] = useState<any[]>([]); // New state for folders list
    const [deleteId, setDeleteId] = useState<string | null>(null);
    const { t } = useLanguage();

    // Search state
    const [searchTerm, setSearchTerm] = useState(filters.Subject || "");
    const debouncedSearchTerm = useDebounce(searchTerm, 500);

    // Sync filters with search box (e.g. when filters are cleared externally)
    useEffect(() => {
        if (filters.Subject !== undefined && filters.Subject !== searchTerm) {
            setSearchTerm(filters.Subject);
        } else if (filters.Subject === undefined && searchTerm !== "") {
            setSearchTerm("");
        }
    }, [filters.Subject]);

    // Handle debounced search
    useEffect(() => {
        // Only trigger if changes
        if (debouncedSearchTerm !== (filters.Subject || "")) {
            handleFilterChange({
                ...filters,
                Subject: debouncedSearchTerm || undefined,
            });
        }
    }, [debouncedSearchTerm]);

    useEffect(() => {
        const unwrapParams = async () => {
            const resolvedParams = await params;
            setOrgId(resolvedParams.orgId);
        };
        unwrapParams();
    }, [params]);

    useEffect(() => {
        if (!orgId) return;

        const loadEmailData = async () => {
            setIsLoading(true);
            try {
                if (!orgId) return;

                // Step 1: Get email accounts list
                console.log("📧 Step 1: Loading email accounts list...");
                const response = await getEmailList(orgId, {});
                const accounts = response?.content || [];

                if (Array.isArray(accounts) && accounts.length > 0) {
                    setEmailConfigs(accounts);
                    console.log("✅ Loaded", accounts.length, "email accounts");

                    // Auto-select the first account
                    const firstAccount = accounts[0];
                    setSelectedConfigId(firstAccount.id);

                    // Step 2: Get folders for mapping
                    console.log(" Step 2: Loading folders...");
                    const folderMapping = await fetchFolderMapping(
                        firstAccount.id,
                    );
                    const folderToLoad = folderMapping["INBOX"] || "INBOX";

                    // Step 3: Load tags, summaries, and emails in PARALLEL
                    console.log(
                        "🚀 Step 3: Loading tags, summaries, and emails...",
                    );
                    const [tagsRes, summariesRes, emailsResponse] =
                        await Promise.all([
                            getEmailTags(orgId, firstAccount.id),
                            getEmailAccountSummaries(orgId),
                            getEmails(orgId, firstAccount.id, {
                                Page: 1,
                                PageSize: 20,
                                Folder: folderToLoad,
                            }),
                        ]);

                    // Update Tags
                    if (tagsRes?.content && Array.isArray(tagsRes.content)) {
                        setAvailableTags(tagsRes.content);
                    } else if (Array.isArray(tagsRes)) {
                        setAvailableTags(tagsRes);
                    }

                    // Update Summaries (re-update configs with unread counts)
                    const accountSummaries = summariesRes?.content || [];
                    if (
                        Array.isArray(accountSummaries) &&
                        accountSummaries.length > 0
                    ) {
                        setEmailConfigs(accountSummaries);
                    }

                    // Update Emails
                    let emailsData =
                        emailsResponse?.content?.data ||
                        emailsResponse?.data ||
                        [];

                    // Safety check: ensure emailsData is an array
                    if (!Array.isArray(emailsData)) {
                        console.warn(
                            "⚠️ emailsData is not an array:",
                            emailsData,
                        );
                        emailsData = [];
                    }

                    const paginationData =
                        emailsResponse?.content?.pagination ||
                        emailsResponse?.pagination;

                    if (emailsData.length > 0) {
                        setEmails(emailsData);
                        setPagination(paginationData);
                        setCurrentPage(1);
                        console.log("✅ Loaded", emailsData.length, "emails");
                    } else {
                        console.log("⚠️ No emails found in this account");
                        setEmails([]);
                    }

                    // Step 4: Run test connection and sync in BACKGROUND (keep existing logic)
                    console.log("🔄 Step 4: Running background sync...");
                    (async () => {
                        try {
                            const testResult = await testEmailConnection(
                                orgId,
                                firstAccount.id,
                            );
                            const isConnected =
                                testResult?.success === true ||
                                testResult?.content?.success === true;

                            if (isConnected) {
                                await syncEmails(orgId, firstAccount.id);

                                // Step 5: Reload emails after sync
                                console.log(
                                    "📬 Background: Reloading emails after sync...",
                                );
                                const newEmailsResponse = await getEmails(
                                    orgId,
                                    firstAccount.id,
                                    {
                                        Page: 1,
                                        PageSize: 20,
                                        Folder: folderToLoad,
                                    },
                                );
                                let newEmailsData =
                                    newEmailsResponse?.content?.data ||
                                    newEmailsResponse?.data ||
                                    [];

                                if (!Array.isArray(newEmailsData)) {
                                    newEmailsData = [];
                                }

                                if (newEmailsData.length > 0) {
                                    setEmails(newEmailsData);
                                    setPagination(
                                        newEmailsResponse?.content
                                            ?.pagination ||
                                            newEmailsResponse?.pagination,
                                    );
                                }
                            }
                        } catch (bgError) {
                            console.warn("⚠️ Background sync failed:", bgError);
                        }
                    })();
                } else {
                    console.log("⚠️ No email accounts found");
                }
            } catch (error: any) {
                console.error("❌ Error loading email data:", error);
            } finally {
                setIsLoading(false);
            }
        };

        loadEmailData();
    }, [orgId]);

    const fetchFolderMapping = async (accountId: string) => {
        if (!orgId) return {};
        try {
            const response = await getEmailFolders(orgId, accountId);
            const folders = response?.content || [];
            // Update folders state
            setFolders(Array.isArray(folders) ? folders : []);

            const mapping: Record<string, string> = {};
            if (Array.isArray(folders)) {
                // Map sidebar IDs to API folder names based on displayName
                folders.forEach((f: any) => {
                    const displayName = f.displayName;
                    // Standard keys used in Sidebar: Sent, Drafts, Spam, Archived, Trash
                    if (
                        [
                            "Sent",
                            "Drafts",
                            // "Spam",
                            "Archived",
                            "Trash",
                        ].includes(displayName)
                    ) {
                        mapping[displayName] = f.name;
                    }
                    // Handle Inbox casing if needed, though usually INBOX is consistent
                    if (displayName === "Inbox" || displayName === "INBOX") {
                        mapping["INBOX"] = f.name;
                    }
                });
            }
            console.log("📂 Folder Mapping:", mapping);
            setActiveFolderMap(mapping);
            return mapping;
        } catch (error) {
            console.error("❌ Error loading folders:", error);
            return {};
        }
    };

    const handleSelectEmail = React.useCallback(
        async (id: string) => {
            if (!orgId) return;

            setSelectedEmailId(id);
            setIsLoadingDetail(true);

            try {
                console.log("📧 Fetching email detail for ID:", id);
                const response = await getEmailDetailById(orgId, id);

                // New API: response.content or response directly
                const emailDetail = response?.content || response;

                if (emailDetail) {
                    setSelectedEmailDetail(emailDetail);
                    console.log("✅ Email detail loaded:", emailDetail);

                    // Auto mark as read
                    if (emailDetail.isRead === false) {
                        try {
                            await markEmailAsRead(orgId, id, true);
                            console.log("✅ Marked email as read");
                            // Update local state to reflect read status
                            setSelectedEmailDetail((prev: any) => ({
                                ...prev,
                                isRead: true,
                            }));
                            // Update email in list
                            setEmails((prevEmails) =>
                                prevEmails.map((email) =>
                                    email.id === id
                                        ? { ...email, isRead: true }
                                        : email,
                                ),
                            );

                            // Update unread count in sidebar
                            if (selectedConfigId) {
                                setEmailConfigs((prevConfigs) =>
                                    prevConfigs.map((config) =>
                                        config.id === selectedConfigId
                                            ? {
                                                  ...config,
                                                  unreadEmails: Math.max(
                                                      0,
                                                      (config.unreadEmails ||
                                                          0) - 1,
                                                  ),
                                              }
                                            : config,
                                    ),
                                );
                            }
                        } catch (markError) {
                            console.error(
                                "⚠️ Failed to mark as read:",
                                markError,
                            );
                        }
                    }
                } else {
                    console.warn("⚠️ Unexpected response format:", response);
                }
            } catch (error) {
                console.error("❌ Error loading email detail:", error);
            } finally {
                setIsLoadingDetail(false);
            }
        },
        [orgId],
    );

    const handleToggleEmail = (id: string) => {
        setCheckedEmailIds((prev) =>
            prev.includes(id)
                ? prev.filter((emailId) => emailId !== id)
                : [...prev, id],
        );
    };

    const handleSelectAll = (ids: string[]) => {
        setCheckedEmailIds(ids);
    };

    const handleClearSelection = () => {
        setCheckedEmailIds([]);
    };

    const handleDeleteEmail = (id: string, e: React.MouseEvent) => {
        e.stopPropagation();
        setDeleteId(id);
    };

    const confirmDelete = async () => {
        if (!orgId || !deleteId) return;
        const id = deleteId;

        // Optimistic update
        setEmails((prev) => prev.filter((email) => email.id !== id));
        if (selectedEmailId === id) {
            setSelectedEmailId(null);
        }

        try {
            await deleteEmails(orgId, [id]);
            toast.success(t("mail.deleteSuccess"));
            // Reload configs to update counts if needed
            // getEmailAccountSummaries...
        } catch (error) {
            console.error("Failed to delete email:", error);
            toast.error(t("mail.deleteFailed"));
            // Revert changes if needed (complex with optimistic)
        }
    };

    const handleToggleReadStatus = async (
        id: string,
        isRead: boolean,
        e: React.MouseEvent,
    ) => {
        e.stopPropagation();
        if (!orgId) return;

        // Optimistic update
        setEmails((prev) =>
            prev.map((email) =>
                email.id === id ? { ...email, isRead: isRead } : email,
            ),
        );

        // Also update detail view if selected
        if (selectedEmailId === id) {
            setSelectedEmailDetail((prev: any) => ({
                ...prev,
                isRead: isRead,
            }));
        }

        try {
            await markEmailAsRead(orgId, id, isRead);
            // Update sidebar unread counts locally
            if (selectedConfigId) {
                setEmailConfigs((prevConfigs) =>
                    prevConfigs.map((config) =>
                        config.id === selectedConfigId
                            ? {
                                  ...config,
                                  unreadEmails: Math.max(
                                      0,
                                      (config.unreadEmails || 0) +
                                          (isRead ? -1 : 1),
                                  ),
                              }
                            : config,
                    ),
                );
            }
        } catch (error) {
            console.error("Failed to update read status:", error);
            toast.error("Không thể cập nhật trạng thái");
        }
    };

    // Auto-select the first email when emails are loaded
    useEffect(() => {
        if (emails.length > 0 && !hasAutoSelectedRef.current) {
            const firstEmailId = emails[0].id;
            hasAutoSelectedRef.current = true;
            setSelectedEmailId(firstEmailId);
            // Load the detail for first email
            handleSelectEmail(firstEmailId);
        }
    }, [emails, handleSelectEmail]);

    const filtersRef = React.useRef(filters);
    const activeFolderRef = React.useRef(activeFolder);
    const selectedConfigIdRef = React.useRef(selectedConfigId);
    const activeFolderMapRef = React.useRef(activeFolderMap);

    // Update refs when state changes
    useEffect(() => {
        filtersRef.current = filters;
    }, [filters]);

    useEffect(() => {
        activeFolderRef.current = activeFolder;
    }, [activeFolder]);

    useEffect(() => {
        selectedConfigIdRef.current = selectedConfigId;
    }, [selectedConfigId]);

    useEffect(() => {
        activeFolderMapRef.current = activeFolderMap;
    }, [activeFolderMap]);

    // Run background sync - test connection and sync, then reload emails if successful
    const runBackgroundSync = (accountId: string) => {
        if (!orgId) return;

        (async () => {
            setIsSyncing(true);
            try {
                console.log(
                    "🔌 Background: Testing connection for account:",
                    accountId,
                );
                const testResult = await testEmailConnection(orgId, accountId);

                // New API: testResult.success or testResult.content?.success
                const isConnected =
                    testResult?.success === true ||
                    testResult?.content?.success === true;

                if (isConnected) {
                    console.log(
                        "✅ Background: Connection successful, syncing emails...",
                    );
                    await syncEmails(orgId, accountId);
                    console.log("✅ Background: Sync completed");

                    // Check if the user is still on the same account
                    if (selectedConfigIdRef.current !== accountId) {
                        console.log(
                            "⚠️ User switched accounts during sync. Skipping UI update for:",
                            accountId,
                        );
                        return;
                    }

                    // Reload emails after sync to get latest data using CURRENT refs
                    console.log(
                        "📬 Background: Reloading emails after sync with current filters...",
                    );

                    const currentFilters = filtersRef.current;
                    const currentFolder = activeFolderRef.current || "INBOX";

                    // Resolve folder using current map
                    const mappedFolder =
                        activeFolderMapRef.current[currentFolder] ||
                        currentFolder;

                    console.log(
                        `🔄 Background Mapping: "${currentFolder}" -> "${mappedFolder}"`,
                    );

                    const emailsResponse = await getEmails(orgId, accountId, {
                        ...currentFilters,
                        Page: 1,
                        PageSize: 20,
                        Folder: mappedFolder,
                    });

                    const emailsData =
                        emailsResponse?.content?.data ||
                        emailsResponse?.data ||
                        [];
                    const paginationData =
                        emailsResponse?.content?.pagination ||
                        emailsResponse?.pagination;

                    if (emailsData.length > 0) {
                        // Double check account hasn't changed during the fetch
                        if (selectedConfigIdRef.current === accountId) {
                            setEmails(emailsData);
                            setPagination(paginationData);
                            setCurrentPage(1);
                            console.log(
                                "✅ Background: Refreshed with",
                                emailsData.length,
                                "emails",
                            );
                        }
                    }
                } else {
                    console.warn(
                        "⚠️ Background: Connection test returned false, skipping sync",
                    );
                }
            } catch (error) {
                console.warn("⚠️ Background sync failed:", error);
            } finally {
                setIsSyncing(false);
            }
        })();
    };

    // Load emails without test/sync - for filters and pagination
    const loadEmailsForAccount = async (
        accountId: string,
        filterParams?: EmailFilterParams,
        mappingOverride?: Record<string, string>,
    ) => {
        if (!orgId) return;

        setIsLoading(true);
        try {
            console.log("📬 Loading emails for account:", accountId);

            // Determine which folder we want to load (Sidebar ID)
            const requestedFolder =
                filterParams?.Folder || activeFolder || "INBOX";
            // Map it to API Name (e.g. "Sent" -> "Sent Items")
            const mappedFolder =
                (mappingOverride || activeFolderMap)[requestedFolder] ||
                requestedFolder;

            console.log(
                `🔄 Mapping Folder: "${requestedFolder}" -> "${mappedFolder}"`,
            );

            console.log(
                "📂 Loading Folder:",
                mappedFolder,
                "(Requested:",
                requestedFolder,
                ")",
            );

            const emailsResponse = await getEmails(orgId, accountId, {
                ...filterParams,
                Page: 1,
                PageSize: 20,
                Folder: mappedFolder,
            });

            // New API: emailsResponse.content?.data or emailsResponse.data
            const emailsData =
                emailsResponse?.content?.data || emailsResponse?.data || [];
            const paginationData =
                emailsResponse?.content?.pagination ||
                emailsResponse?.pagination;

            setEmails(emailsData);
            setPagination(paginationData);
            setCurrentPage(1);
            console.log("✅ Loaded", emailsData.length, "emails");
        } catch (error) {
            console.error("❌ Error loading emails:", error);
            setEmails([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleLoadMore = async () => {
        if (!orgId || !selectedConfigId || isLoadingMore) return;
        if (pagination && currentPage >= pagination.totalPages) return;

        setIsLoadingMore(true);
        try {
            const nextPage = currentPage + 1;
            console.log("📬 Loading more emails, page:", nextPage);

            const emailsResponse = await getEmails(orgId, selectedConfigId, {
                Page: nextPage,
                PageSize: 20,
                Folder: filters?.Folder || "INBOX",
                ...filters,
            });

            // New API: emailsResponse.content?.data or emailsResponse.data
            let emailsData =
                emailsResponse?.content?.data || emailsResponse?.data || [];

            if (!Array.isArray(emailsData)) {
                emailsData = [];
            }

            const paginationData =
                emailsResponse?.content?.pagination ||
                emailsResponse?.pagination;

            if (emailsData.length > 0) {
                // Append new emails to existing list
                setEmails((prevEmails) => {
                    const safePrev = Array.isArray(prevEmails)
                        ? prevEmails
                        : [];
                    return [...safePrev, ...emailsData];
                });
                setPagination(paginationData);
                setCurrentPage(nextPage);
                console.log("✅ Loaded", emailsData.length, "more emails");
            }
        } catch (error) {
            console.error("❌ Error loading more emails:", error);
        } finally {
            setIsLoadingMore(false);
        }
    };

    const handleConfigSelect = async (configId: string) => {
        setIsLoading(true); // Show loading immediately
        setSelectedConfigId(configId);
        setSelectedEmailId(null);
        setCheckedEmailIds([]);
        setActiveFolder("INBOX"); // Reset to inbox
        setFilters({}); // Reset filters
        setAvailableTags([]); // Clear old tags
        hasAutoSelectedRef.current = false; // Allow auto-select again

        try {
            // Step 0: Fetch folder mapping for the new account & tags in parallel
            const [mapping, tagsRes] = await Promise.all([
                fetchFolderMapping(configId),
                getEmailTags(orgId, configId),
            ]);

            // Update Tags
            if (tagsRes?.content && Array.isArray(tagsRes.content)) {
                setAvailableTags(tagsRes.content);
            } else if (Array.isArray(tagsRes)) {
                setAvailableTags(tagsRes);
            }

            // Step 1: Load emails immediately for fast display
            await loadEmailsForAccount(configId, {}, mapping);

            // Step 2: Run background sync (test -> sync if success -> reload)
            runBackgroundSync(configId);
        } catch (error) {
            console.error("Error switching account:", error);
            setIsLoading(false); // Ensure loading is turned off on error
        }
    };

    const handleFilterChange = (newFilters: EmailFilterParams) => {
        setFilters(newFilters);
        setCurrentPage(1);
        // Reload emails with new filters if account is selected
        if (selectedConfigId) {
            hasAutoSelectedRef.current = false;
            loadEmailsForAccount(selectedConfigId, newFilters);
        }
    };

    const handleApplyFilter = () => {
        // Filter is already applied via handleFilterChange
        console.log("Filter applied");
    };

    const handleSelectLabel = (tagId: string) => {
        // When clicking a label in sidebar, filter by that tag
        // We might want to clear other filters or keep them.
        // For now, let's keep search/folder context if it makes sense,
        // but typically clicking a label acts like "show me emails with this label".
        // It's often mutually exclusive with Folder if treated as a View.
        // Or it's a filter on top of "All Mail".
        // Let's assume it filters on top of current view or switches to All Mail + Tag.
        // Safest UX: Clear Folder to "All Mail" (empty) or keep active folder and apply tag?
        // Let's just set the TagIds filter.

        const newFilters = {
            ...filters,
            TagIds: [tagId],
        };
        setFilters(newFilters);
        setCurrentPage(1);

        if (selectedConfigId) {
            hasAutoSelectedRef.current = false;
            loadEmailsForAccount(selectedConfigId, newFilters);
        }
    };

    const handleFolderSelect = (folderId: string) => {
        setActiveFolder(folderId);
        setSelectedEmailId(null);
        setCheckedEmailIds([]);
        setCurrentPage(1);
        setIsSettingsView(false);

        // Reset filters when switching folders, but keep the folder
        const newFilters = { Folder: folderId };
        setFilters(newFilters);

        if (selectedConfigId) {
            hasAutoSelectedRef.current = false;
            loadEmailsForAccount(selectedConfigId, newFilters);
        }
    };

    const handleReloadConfigs = async () => {
        if (!orgId) return;
        setIsLoading(true);
        try {
            const response = await getEmailAccountSummaries(orgId);
            const accounts = response?.content || [];
            if (Array.isArray(accounts) && accounts.length > 0) {
                setEmailConfigs(accounts);

                // If no config selected or need to select first one
                const accountToSelect = selectedConfigId
                    ? accounts.find((a: any) => a.id === selectedConfigId) ||
                      accounts[0]
                    : accounts[0];

                setSelectedConfigId(accountToSelect.id);
                setAvailableTags([]); // Clear old tags

                // Fetch folder mapping & tags
                const [mapping, tagsRes] = await Promise.all([
                    fetchFolderMapping(accountToSelect.id),
                    getEmailTags(orgId, accountToSelect.id),
                ]);

                // Update Tags
                if (tagsRes?.content && Array.isArray(tagsRes.content)) {
                    setAvailableTags(tagsRes.content);
                } else if (Array.isArray(tagsRes)) {
                    setAvailableTags(tagsRes);
                }

                // Step 1: Load emails immediately
                const mappedFolder =
                    (mapping || activeFolderMap)[activeFolder] || activeFolder;
                const folderToLoad = filters?.Folder || mappedFolder || "INBOX";

                console.log(
                    "📬 Loading emails for account:",
                    accountToSelect.id,
                    "Folder:",
                    folderToLoad,
                    "Filters:",
                    filters,
                );

                const emailsResponse = await getEmails(
                    orgId,
                    accountToSelect.id,
                    {
                        ...filters,
                        Page: 1,
                        PageSize: 20,
                        Folder: folderToLoad,
                    },
                );

                let emailsData =
                    emailsResponse?.content?.data || emailsResponse?.data || [];

                if (!Array.isArray(emailsData)) {
                    emailsData = [];
                }

                const paginationData =
                    emailsResponse?.content?.pagination ||
                    emailsResponse?.pagination;

                setEmails(emailsData);
                setPagination(paginationData);
                setCurrentPage(1);
                console.log("✅ Loaded", emailsData.length, "emails");

                // Step 2: Run background sync
                runBackgroundSync(accountToSelect.id);
            } else {
                // No accounts left
                setEmailConfigs([]);
                setEmails([]);
                setSelectedConfigId("");
                setPagination(null);
                setCurrentPage(1);
            }
        } catch (error) {
            console.error("Error reloading email configs:", error);
        } finally {
            setIsLoading(false);
        }
    };

    // Use real emails from API instead of mock data
    const displayEmails = emails;

    const [composeData, setComposeData] = useState<{
        to?: string;
        subject?: string;
        content?: string;
        cc?: string;
        bcc?: string;
        replyToEmailId?: string;
        replyAll?: boolean;
    } | null>(null);

    const handleCompose = (data?: {
        to?: string;
        subject?: string;
        content?: string;
        cc?: string;
        bcc?: string;
        replyToEmailId?: string;
        replyAll?: boolean;
    }) => {
        setComposeData(data || null);
        setIsComposeOpen(true);
    };

    const handleMarkAsRead = async (ids: string[], isRead: boolean) => {
        if (!orgId) return;
        try {
            await Promise.all(
                ids.map((id) => markEmailAsRead(orgId, id, isRead)),
            );

            // Update local state
            setEmails((prev) =>
                prev.map((email) =>
                    ids.includes(email.id) ? { ...email, isRead } : email,
                ),
            );

            // Silently update sidebar counts
            const response = await getEmailAccountSummaries(orgId);
            if (response?.content) {
                setEmailConfigs(response.content);
            }
            // Clear selection after action? User might want to do more actions.
            // But usually bulk action implies "done".
            // Let's keep selection for now or clear it? The user didn't specify.
            // Usually "Mark as read" keeps selection. "Delete" clears it (because they are gone).
        } catch (error) {
            console.error("Error marking emails:", error);
        }
    };

    const handleDraftSaved = (updatedEmail: any) => {
        // Valid updatedEmail?
        if (!updatedEmail || !updatedEmail.id) return;

        // Force update timestamp to now if not provided, ensuring it bumps to top visually
        const now = new Date().toISOString();
        if (!updatedEmail.lastModifiedDate) updatedEmail.lastModifiedDate = now;
        if (!updatedEmail.dateSent)
            updatedEmail.dateSent = updatedEmail.lastModifiedDate;

        // Ensure snippet
        const bodyText = updatedEmail.bodyText || updatedEmail.content || "";
        if (!updatedEmail.snippet && bodyText) {
            // Strip HTML if content is HTML (rude check)
            const text = bodyText.replace(/<[^>]*>?/gm, " ");
            updatedEmail.snippet = text
                .substring(0, 100)
                .replace(/\s+/g, " ")
                .trim();
        }

        // Update list
        setEmails((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];

            // Check if it was already in the list
            const exists = safePrev.some((e) => e.id === updatedEmail.id);

            // Filter it out (remove from old position)
            const otherEmails = safePrev.filter(
                (e) => e.id !== updatedEmail.id,
            );

            // Add to top if it existed or we are in a relevant folder
            if (
                exists ||
                activeFolder === "Drafts" ||
                activeFolder === "INBOX"
            ) {
                return [updatedEmail, ...otherEmails];
            }

            return safePrev;
        });

        // Update detail if selected
        if (selectedEmailId === updatedEmail.id) {
            setSelectedEmailDetail((prev: any) => ({
                ...prev,
                ...updatedEmail,
            }));
        }
    };

    const handleDraftDeleted = (deletedId: string) => {
        // Remove from list
        setEmails((prev) => {
            const safePrev = Array.isArray(prev) ? prev : [];
            return safePrev.filter((e) => e.id !== deletedId);
        });

        // Clear selection if needed
        if (selectedEmailId === deletedId) {
            setSelectedEmailId(null);
            setSelectedEmailDetail(null);
        }
    };

    return (
        <div className="h-full w-full flex gap-3">
            {/* Grouped Sidebar and Email List/Settings */}
            <Glass
                intensity="medium"
                border={true}
                className={cn(
                    "flex rounded-xl overflow-hidden shrink-0",
                    isSettingsView ? "w-full" : "",
                )}
            >
                {/* Sidebar Section */}
                <Glass
                    intensity="medium"
                    border={true}
                    className="flex rounded-l-xl overflow-hidden border-r shrink-0"
                >
                    <div className="w-[260px] flex flex-col border-r border-gray-100/50">
                        <EmailSidebar
                            activeFolder={activeFolder}
                            onFolderSelect={handleFolderSelect}
                            onComposeClick={() => handleCompose()}
                            emailConfigs={emailConfigs}
                            selectedConfigId={selectedConfigId}
                            onConfigSelect={handleConfigSelect}
                            onAddAccountClick={() => setIsSettingsView(true)}
                            onCollapse={() => setIsSettingsView(false)}
                            onSettingsClick={() => setIsSettingsView(true)}
                            onSelectLabel={handleSelectLabel}
                            orgId={orgId}
                            isSettingsOpen={isSettingsView}
                            availableTags={availableTags}
                            onTagsUpdate={(refreshEmails = true) => {
                                if (!orgId || !selectedConfigId) return;
                                getEmailTags(orgId, selectedConfigId).then(
                                    (result) => {
                                        if (
                                            result?.content &&
                                            Array.isArray(result.content)
                                        ) {
                                            setAvailableTags(result.content);
                                        } else if (Array.isArray(result)) {
                                            setAvailableTags(result);
                                        }
                                    },
                                );
                                if (refreshEmails) {
                                    setIsLoading(true);
                                    getEmails(orgId, selectedConfigId, {
                                        Page: 1,
                                        PageSize: 20,
                                        Folder:
                                            activeFolder === "Inbox"
                                                ? undefined
                                                : activeFolderMap[
                                                      activeFolder
                                                  ] || activeFolder,
                                    }).then((result) => {
                                        let emailsData =
                                            result?.content?.data ||
                                            result?.data ||
                                            [];
                                        if (!Array.isArray(emailsData))
                                            emailsData = [];
                                        const paginationData =
                                            result?.content?.pagination ||
                                            result?.pagination;
                                        setEmails(emailsData);
                                        setPagination(paginationData);
                                        setIsLoading(false);
                                    });
                                }
                            }}
                            folders={folders}
                        />
                    </div>
                </Glass>
                {isSettingsView ? (
                    <div className="flex-1 flex flex-col min-w-[350px]">
                        <EmailAccountsManager
                            orgId={orgId}
                            onBack={() => setIsSettingsView(false)}
                            onSuccess={handleReloadConfigs}
                        />
                    </div>
                ) : (
                    /* Email List Section */
                    <div className="w-[350px] flex flex-col">
                        <EmailList
                            emails={displayEmails}
                            activeFolder={activeFolder}
                            selectedEmailId={selectedEmailId}
                            onSelectEmail={handleSelectEmail}
                            checkedEmailIds={checkedEmailIds}
                            onToggleEmail={handleToggleEmail}
                            onSelectAll={handleSelectAll}
                            onClearSelection={handleClearSelection}
                            isLoading={isLoading}
                            isSyncing={isSyncing}
                            onLoadMore={handleLoadMore}
                            isLoadingMore={isLoadingMore}
                            hasMore={
                                pagination
                                    ? currentPage < pagination.totalPages
                                    : false
                            }
                            onReload={handleReloadConfigs}
                            filterButton={
                                <EmailFilter
                                    filters={filters}
                                    onFilterChange={handleFilterChange}
                                    onApply={handleApplyFilter}
                                    availableTags={availableTags}
                                />
                            }
                            searchValue={searchTerm}
                            onSearchChange={setSearchTerm}
                            onDelete={handleDeleteEmail}
                            onToggleRead={handleToggleReadStatus}
                        />
                    </div>
                )}
            </Glass>

            {/* Column 3: Email View (Fluid) */}
            <Glass
                intensity="high"
                border={true}
                className="flex-1 flex flex-col min-w-0 rounded-xl overflow-hidden"
            >
                {orgId && (
                    <EmailView
                        selectedEmailId={selectedEmailId}
                        selectedEmailDetail={selectedEmailDetail}
                        isLoadingDetail={isLoadingDetail}
                        checkedEmailIds={checkedEmailIds}
                        orgId={orgId}
                        defaultConfigId={selectedConfigId}
                        onCompose={handleCompose}
                        emails={displayEmails}
                        onMarkAsRead={handleMarkAsRead}
                        availableTags={availableTags}
                        isDraft={
                            activeFolder === "Drafts" ||
                            selectedEmailDetail?.folder === "Drafts"
                        }
                        onEmailDeleted={(deletedIds: string | string[]) => {
                            // Remove deleted emails from list
                            setEmails((prev) => {
                                const safePrev = Array.isArray(prev)
                                    ? prev
                                    : [];
                                return safePrev.filter(
                                    (e) => !deletedIds.includes(e.id),
                                );
                            });
                            // Clear selection
                            setCheckedEmailIds((prev) =>
                                prev.filter((id) => !deletedIds.includes(id)),
                            );
                            // If current selected email was deleted, clear it
                            if (
                                selectedEmailId &&
                                deletedIds.includes(selectedEmailId)
                            ) {
                                setSelectedEmailId(null);
                                setSelectedEmailDetail(null);
                            }
                        }}
                        onEmailUpdated={(updatedEmail: { id: any }) => {
                            setEmails((prev) => {
                                const safePrev = Array.isArray(prev)
                                    ? prev
                                    : [];
                                return safePrev.map((email) =>
                                    email.id === updatedEmail.id
                                        ? { ...email, ...updatedEmail }
                                        : email,
                                );
                            });
                        }}
                    />
                )}
            </Glass>

            {orgId && (
                <ComposeEmailModal
                    isOpen={isComposeOpen}
                    onClose={() => {
                        setIsComposeOpen(false);
                        setComposeData(null);
                    }}
                    orgId={orgId}
                    defaultConfigId={selectedConfigId}
                    initialData={composeData}
                    replyToEmailId={composeData?.replyToEmailId}
                    replyAll={composeData?.replyAll}
                    onDraftSaved={handleDraftSaved}
                    onDraftDeleted={handleDraftDeleted}
                />
            )}

            <ConfirmDialog
                isOpen={!!deleteId}
                onClose={() => setDeleteId(null)}
                onConfirm={confirmDelete}
                title={t("mail.deleteConfirmTitle")}
                description={t("mail.deleteConfirmMessage")}
                confirmText={t("mail.delete")}
                cancelText={t("mail.cancel")}
                variant="destructive"
            />
        </div>
    );
}
