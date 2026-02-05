"use client";
import { Glass } from "@/components/Glass";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Switch } from "@/components/ui/switch";
import { useEffect, useState } from "react";
import { getNotifySettingList, updateNotifySetting } from "@/api/notify";
import { useLanguage } from "@/contexts/LanguageContext";

export default function Page() {
    const { t } = useLanguage();
    const [notiSettingList, setNotiSettingList] = useState([]);

    useEffect(() => {
        const fetchNotifySettings = async () => {
            const data = await getNotifySettingList();
            if (data?.content) {
                setNotiSettingList(data.content);
            }
        };

        fetchNotifySettings();
    }, []);

    const handleToggle = async (id, status) => {
        await updateNotifySetting(id, status === 1 ? 0 : 1);
        setNotiSettingList((prevSettings) =>
            prevSettings.map((setting) =>
                setting.id === id
                    ? { ...setting, status: status === 1 ? 0 : 1 }
                    : setting,
            ),
        );
    };

    const allEnabled =
        notiSettingList.length > 0 &&
        notiSettingList.every((s) => s.status === 1);

    const handleToggleAll = async (nextChecked) => {
        const targetStatus = nextChecked ? 1 : 0;
        const itemsToUpdate = notiSettingList.filter(
            (s) => s.status !== targetStatus,
        );

        // Optimistic update UI
        setNotiSettingList((prev) =>
            prev.map((s) => ({ ...s, status: targetStatus })),
        );

        // Persist changes
        await Promise.allSettled(
            itemsToUpdate.map((s) => updateNotifySetting(s.id, targetStatus)),
        );
    };

    return (
        <div className="h-full p-4">
            <Glass
                intensity="high"
                className="flex flex-col px-6 pt-6 h-full rounded-2xl"
            >
                <div className="flex items-center justify-between mb-6">
                    <div className="font-medium text-xl">
                        {t("common.notifications")}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-text2">
                        <span>{allEnabled ? "Tắt tất cả" : "Bật tất cả"}</span>
                        <Switch
                            checked={allEnabled}
                            onCheckedChange={handleToggleAll}
                            className="scale-75"
                        />
                    </div>
                </div>
                <ScrollArea className="flex flex-col overflow-y-auto">
                    <div className="grid grid-cols-2 gap-6">
                        {Object.values(
                            notiSettingList.reduce((acc, curr) => {
                                const category = curr.category;
                                if (!acc[category]) {
                                    acc[category] = [];
                                }
                                acc[category].push(curr);
                                return acc;
                            }, {}),
                        )
                            .sort((a, b) => {
                                if (a[0].category === "Mặc định") {
                                    return -1;
                                }
                                if (b[0].category === "Mặc định") {
                                    return 1;
                                }
                                return 0;
                            })
                            .map((section, index) => (
                                <div
                                    key={index}
                                    className="border border-gray-200 rounded-2xl p-4"
                                >
                                    <h2 className="font-medium mb-2">
                                        {section[0].category}
                                    </h2>
                                    {section.map((item, itemIndex) => (
                                        <div
                                            key={itemIndex}
                                            className="flex items-center justify-between py-1 font-medium text-text2"
                                        >
                                            <div>
                                                <div className="font-medium text-sm">
                                                    {item.title}
                                                </div>
                                            </div>
                                            <Switch
                                                checked={item.status === 1}
                                                onCheckedChange={() =>
                                                    handleToggle(
                                                        item.id,
                                                        item.status,
                                                    )
                                                }
                                                className="scale-75"
                                            />
                                        </div>
                                    ))}
                                </div>
                            ))}
                    </div>
                </ScrollArea>
            </Glass>
        </div>
    );
}
