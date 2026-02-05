"use client";

import React, { useState, useEffect } from "react";
import { Tooltip, TooltipProvider } from "../ui/tooltip";

import { Button } from "../ui/button";
import { TooltipTrigger } from "@radix-ui/react-tooltip";
import {
    getEmailList,
    createEmail,
    updateEmailAccount,
    deleteEmailAccount,
    testEmailConnection,
    testEmailConnectionWithConfig,
} from "@/api/mail-box";
import {
    Mail,
    Plus,
    Edit2,
    Trash2,
    Check,
    X,
    Loader2,
    ArrowLeft,
    PlusIcon,
} from "lucide-react";
import toast from "react-hot-toast";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmailAccount {
    id: string;
    email: string;
    accountName?: string;
    host: string;
    port: number;
    useSsl: boolean;
    username: string;
}

interface EmailAccountsManagerProps {
    orgId: string;
    onBack?: () => void;
    onSuccess?: () => void;
}

export function EmailAccountsManager({
    orgId,
    onBack,
    onSuccess,
}: EmailAccountsManagerProps) {
    const { t } = useLanguage();
    const [accounts, setAccounts] = useState<EmailAccount[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingAccount, setEditingAccount] = useState<EmailAccount | null>(
        null,
    );

    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [accountToDelete, setAccountToDelete] = useState<string | null>(null);

    console.log("duy accounts", accounts);
    useEffect(() => {
        if (orgId) {
            loadAccounts();
        }
    }, [orgId]);

    const loadAccounts = async () => {
        setIsLoading(true);
        try {
            const response = await getEmailList(orgId, {});
            setAccounts(response?.content! || []);
        } catch (error) {
            console.error("Error loading accounts:", error);
            toast.error(t("error.common"));
        } finally {
            setIsLoading(false);
        }
    };

    const handleDeleteClick = (accountId: string) => {
        setAccountToDelete(accountId);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!accountToDelete) return;

        try {
            await deleteEmailAccount(orgId, accountToDelete);
            toast.success(t("mail.account.deletedSuccess"));
            loadAccounts();
            onSuccess?.();
        } catch (error) {
            console.error("Delete error:", error);
            toast.error(t("error.common"));
        } finally {
            setDeleteDialogOpen(false);
            setAccountToDelete(null);
        }
    };

    const handleEdit = (account: EmailAccount) => {
        setEditingAccount(account);
        setIsModalOpen(true);
    };

    const handleAdd = () => {
        setEditingAccount(null);
        setIsModalOpen(true);
    };

    return (
        <div className="flex-1 h-full overflow-y-auto bg-gray-50/50 p-6">
            {/* Header */}
            <div className="mb-6">
                {onBack && (
                    <button
                        onClick={onBack}
                        className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors"
                    >
                        <ArrowLeft className="w-4 h-4 mr-1" />
                        {t("mail.settings.backToMailbox")}
                    </button>
                )}
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold">
                            {t("mail.settings.title")}
                        </h1>
                        <p className="text-sm text-gray-600 mt-1">
                            {t("mail.settings.description")}
                        </p>
                    </div>

                    <Button size="sm" onClick={handleAdd}>
                        <Plus className="h-4 w-4" />
                        {t("mail.settings.addAccount")}
                    </Button>
                </div>
            </div>

            {/* Accounts List */}
            {isLoading ? (
                <div className="flex items-center justify-center h-64">
                    <Loader2 className="w-8 h-8 animate-spin text-[#5c46e6]" />
                </div>
            ) : accounts.length === 0 ? (
                <div className="text-center py-16 bg-white rounded-xl border border-dashed border-gray-300">
                    <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Mail className="w-8 h-8 text-gray-400" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {t("mail.settings.noAccounts")}
                    </h3>
                    <p className="text-gray-600 mb-6 max-w-sm mx-auto">
                        {t("mail.settings.connectPrompt")}
                    </p>

                    <button
                        onClick={handleAdd}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-[#5c46e6] text-white rounded-lg hover:bg-[#4a38b8] transition-colors shadow-sm"
                    >
                        <Plus className="w-4 h-4" />
                        {t("mail.settings.addAccount")}
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {accounts.map((account) => (
                        <AccountCard
                            key={account.id}
                            account={account}
                            onEdit={() => handleEdit(account)}
                            onDelete={() => handleDeleteClick(account.id)}
                        />
                    ))}
                </div>
            )}

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <AccountModal
                    orgId={orgId}
                    account={editingAccount}
                    onClose={() => {
                        setIsModalOpen(false);
                        setEditingAccount(null);
                    }}
                    onSuccess={() => {
                        setIsModalOpen(false);
                        setEditingAccount(null);
                        loadAccounts();
                        onSuccess?.();
                    }}
                />
            )}

            <ConfirmDialog
                isOpen={deleteDialogOpen}
                onClose={() => {
                    setDeleteDialogOpen(false);
                    setAccountToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                title={t("mail.account.deleteConfirmTitle")}
                description={t("mail.account.deleteConfirmMessage")}
                confirmText={t("mail.delete")}
                cancelText={t("mail.cancel")}
                variant="destructive"
            />
        </div>
    );
}

// Account Card Component
function AccountCard({
    account,
    onEdit,
    onDelete,
}: {
    account: EmailAccount;
    onEdit: () => void;
    onDelete: () => void;
}) {
    const { t } = useLanguage();
    console.log(account);
    return (
        <div className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-all duration-300 group flex flex-col h-full">
            <div className="flex items-start justify-between mb-4 flex-1">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-gradient-to-br from-[#5c46e6]/10 to-[#5c46e6]/5 rounded-xl flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Mail className="w-6 h-6 text-[#5c46e6]" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900 text-lg">
                            {account.accountName ||
                                (account as any).displayName ||
                                "Email Config"}
                        </h3>
                        <p className="text-sm text-gray-500 font-medium">
                            {account.email ||
                                (account as any).Email ||
                                account.username ||
                                (account as any).Username}
                        </p>
                    </div>
                </div>
            </div>

            <div className="flex gap-3">
                <button
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-gray-200 text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 transition-all text-sm font-medium"
                >
                    <Edit2 className="w-4 h-4" />
                    {t("mail.edit")}
                </button>
                <button
                    onClick={onDelete}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 border border-red-100 text-red-600 rounded-lg hover:bg-red-50 hover:border-red-200 transition-all text-sm font-medium"
                >
                    <Trash2 className="w-4 h-4" />
                    {t("mail.delete")}
                </button>
            </div>
        </div>
    );
}

// Account Modal Component
function AccountModal({
    orgId,
    account,
    onClose,
    onSuccess,
}: {
    orgId: string;
    account: EmailAccount | null;
    onClose: () => void;
    onSuccess: () => void;
}) {
    const { t } = useLanguage();
    const [formData, setFormData] = useState({
        email: "",
        accountName: "",
        password: "",
        host: "",
        port: 993,
        useSsl: true,
        username: "",
        smtpServer: "",
        smtpPort: 465,
    });

    useEffect(() => {
        if (account) {
            setFormData({
                email:
                    account.email ||
                    (account as any).Email ||
                    account.username ||
                    (account as any).Username ||
                    "",
                accountName:
                    account.accountName ||
                    (account as any).AccountName ||
                    (account as any).account_name ||
                    (account as any).displayName ||
                    (account as any).display_name ||
                    (account as any).Name ||
                    (account as any).name ||
                    "",
                password: "",
                host:
                    account.host ||
                    (account as any).server ||
                    (account as any).imapHost ||
                    (account as any).ImapHost ||
                    (account as any).imap_host ||
                    (account as any).incomingHost ||
                    (account as any).IncomingHost ||
                    "",
                port:
                    account.port ||
                    (account as any).Port ||
                    (account as any).imapPort ||
                    (account as any).ImapPort ||
                    (account as any).imap_port ||
                    (account as any).incomingPort ||
                    (account as any).IncomingPort ||
                    993,
                useSsl:
                    account.useSsl ??
                    (account as any).UseSsl ??
                    (account as any).use_ssl ??
                    true,
                username:
                    account.username ||
                    (account as any).Username ||
                    (account as any).user_name ||
                    "",
                smtpServer:
                    (account as any).smtpServer ||
                    (account as any).SmtpServer ||
                    (account as any).smtp_server ||
                    "",
                smtpPort:
                    (account as any).smtpPort ||
                    (account as any).SmtpPort ||
                    (account as any).smtp_port ||
                    465,
            });
        } else {
            setFormData({
                email: "",
                accountName: "",
                password: "",
                host: "",
                port: 993,
                useSsl: true,
                username: "",
                smtpServer: "",
                smtpPort: 465,
            });
        }
    }, [account]);
    const [isSaving, setIsSaving] = useState(false);
    const [isTesting, setIsTesting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            if (account) {
                // Update - different payload format
                const updatePayload = {
                    displayName: formData.accountName,
                    server: formData.host,
                    port: formData.port,
                    password: formData.password || undefined, // Only send if changed
                    useSsl: formData.useSsl,
                    isActive: true,
                    smtpServer: formData.smtpServer,
                    smtpPort: formData.smtpPort,
                };
                await updateEmailAccount(orgId, account.id, updatePayload);
                toast.success(t("mail.account.savedSuccess"));
            } else {
                // Create - full payload
                const createPayload = {
                    emailAddress: formData.email,
                    displayName: formData.accountName,
                    accountType: "IMAP",
                    server: formData.host,
                    port: formData.port,
                    username: formData.username || formData.email,
                    password: formData.password,
                    useSsl: formData.useSsl,
                    smtpServer: formData.smtpServer,
                    smtpPort: formData.smtpPort,
                };
                await createEmail(orgId, createPayload);
                toast.success(t("mail.account.savedSuccess"));
            }
            onSuccess();
        } catch (error) {
            console.error("Save error:", error);
            toast.error(t("error.common"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleTest = async () => {
        setIsTesting(true);
        try {
            if (account) {
                const result = await testEmailConnection(orgId, account.id);
                if (result?.content?.success) {
                    toast.success(t("mail.account.connectionSuccess"));
                } else {
                    toast.error(t("mail.account.connectionFailed"));
                }
            } else {
                // Test with form data
                const result = await testEmailConnectionWithConfig(orgId, {
                    emailAddress: formData.email,
                    displayName: formData.accountName,
                    accountType: "IMAP",
                    server: formData.host,
                    port: formData.port,
                    username: formData.username || formData.email,
                    password: formData.password,
                    useSsl: formData.useSsl,
                    smtpServer: formData.smtpServer,
                    smtpPort: formData.smtpPort,
                });

                if (result?.content?.success || result?.code === 0) {
                    toast.success(t("mail.account.connectionSuccess"));
                } else {
                    toast.error(t("mail.account.connectionFailed"));
                }
            }
        } catch (error) {
            toast.error(t("mail.account.connectionFailed"));
        } finally {
            setIsTesting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <div>
                        <h2 className="text-lg leading-none font-semibold">
                            {account
                                ? t("mail.account.updateTitle")
                                : t("mail.account.addTitle")}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                            {t("mail.account.imapPrompt")}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-gray-400 hover:text-gray-600 p-2 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="overflow-y-auto p-6">
                    {/* DEBUG INFO - REMOVE LATER */}
                    {/* <div className="mb-4 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-40">
                        <pre>{JSON.stringify(account, null, 2)}</pre>
                    </div> */}
                    <form
                        id="account-form"
                        onSubmit={handleSubmit}
                        className="space-y-6"
                    >
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t("mail.account.displayName")}
                                </label>
                                <input
                                    type="text"
                                    value={formData.accountName}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            accountName: e.target.value,
                                        })
                                    }
                                    className="w-full px-3 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c46e6]/20 focus:border-[#5c46e6] transition-all text-sm"
                                    placeholder={t(
                                        "mail.account.displayNamePlaceholder",
                                    )}
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t("mail.account.email")}{" "}
                                    {!account ? (
                                        <span className="text-red-500">*</span>
                                    ) : (
                                        <div></div>
                                    )}
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                        <Mail className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type="email"
                                        required
                                        value={formData.email}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                email: e.target.value,
                                            })
                                        }
                                        disabled={!!account}
                                        className="w-full pl-10 pr-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c46e6]/20 focus:border-[#5c46e6] transition-all text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                        placeholder={t(
                                            "mail.account.emailPlaceholder",
                                        )}
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t("mail.account.username")}
                                </label>
                                <input
                                    type="text"
                                    value={formData.username}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            username: e.target.value,
                                        })
                                    }
                                    disabled={!!account}
                                    className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c46e6]/20 focus:border-[#5c46e6] transition-all text-sm disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                                    placeholder={t(
                                        "mail.account.usernamePlaceholder",
                                    )}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t("mail.account.password")}{" "}
                                    {!account && (
                                        <span className="text-red-500">*</span>
                                    )}
                                </label>
                                <input
                                    type="password"
                                    required={!account}
                                    value={formData.password}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            password: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c46e6]/20 focus:border-[#5c46e6] transition-all text-sm"
                                    placeholder={
                                        account
                                            ? "••••••••"
                                            : t(
                                                  "mail.account.passwordPlaceholder",
                                              )
                                    }
                                />
                                {account && (
                                    <p className="mt-1 text-xs text-gray-500">
                                        {t("mail.account.passwordHint")}
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t("mail.account.imapHost")}{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    required
                                    value={formData.host}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            host: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c46e6]/20 focus:border-[#5c46e6] transition-all font-mono text-sm"
                                    placeholder="imap.gmail.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t("mail.account.imapPort")}{" "}
                                    <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="number"
                                    required
                                    value={formData.port}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            port: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c46e6]/20 focus:border-[#5c46e6] transition-all font-mono text-sm"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t("mail.account.smtpServer")}
                                </label>
                                <input
                                    type="text"
                                    value={formData.smtpServer}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            smtpServer: e.target.value,
                                        })
                                    }
                                    className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c46e6]/20 focus:border-[#5c46e6] transition-all font-mono text-sm"
                                    placeholder="smtp.gmail.com"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                                    {t("mail.account.smtpPort")}
                                </label>
                                <input
                                    type="number"
                                    value={formData.smtpPort}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            smtpPort: parseInt(e.target.value),
                                        })
                                    }
                                    className="w-full px-4 py-1.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#5c46e6]/20 focus:border-[#5c46e6] transition-all font-mono text-sm"
                                />
                            </div>

                            <div className="col-span-1 md:col-span-2">
                                <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
                                    <input
                                        type="checkbox"
                                        checked={formData.useSsl}
                                        onChange={(e) =>
                                            setFormData({
                                                ...formData,
                                                useSsl: e.target.checked,
                                            })
                                        }
                                        className="w-4 h-4 rounded border-gray-300 text-[#5c46e6] focus:ring-[#5c46e6]"
                                    />
                                    <span className="text-sm font-medium text-gray-700">
                                        {t("mail.account.useSsl")}
                                    </span>
                                </label>
                            </div>
                        </div>
                    </form>
                </div>

                <div className="p-6 border-t border-gray-100 bg-gray-50/50 flex justify-between gap-3">
                    {
                        <button
                            type="button"
                            onClick={handleTest}
                            disabled={isTesting}
                            className="px-4 py-1.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-50 flex items-center gap-2 font-medium transition-all text-sm"
                        >
                            {isTesting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Check className="w-4 h-4 text-green-600" />
                            )}
                            {t("mail.account.checkConnection")}
                        </button>
                    }
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-1.5 text-gray-600 hover:text-gray-800 font-medium transition-colors text-sm"
                        >
                            {t("mail.cancel")}
                        </button>
                        <button
                            form="account-form"
                            type="submit"
                            disabled={isSaving}
                            className="px-6 py-1.5 bg-[#5c46e6] text-white rounded-lg hover:bg-[#4a38b8] disabled:opacity-50 flex items-center justify-center gap-2 font-medium shadow-sm hover:shadow transition-all text-sm"
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                    Đang lưu...
                                </>
                            ) : (
                                t("mail.account.saveSettings")
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
