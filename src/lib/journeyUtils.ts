import React from "react";
import { extractFileInfo, extractAssignInfo } from "./utils";

// Interface cho journey data từ API
export interface JourneyEvent {
    id: string;
    summary: string;
    type?: string;
    icon: string;
    createdByName: string;
    createdDate?: string;
    jsonSummary?: string;
    previousJsonSummary?: string;
    title?: string;
    oldValue?: string;
    newValue?: string;
}

export interface JourneyResponse {
    code: number;
    content: JourneyEvent[];
    metadata: {
        total: number;
        count: number;
        offset: number;
        limit: number;
    };
}

// Interface cho timeline event đã được transform
export interface TimelineEvent {
    id: string;
    type: "note" | "rating" | "email" | "source" | "care";
    title: string;
    description?: string;
    time: string;
    icon: React.ReactNode;
    iconColor: string;
    rawData?: JourneyEvent;
}

export interface EmailTimelineInfo {
    type: "email_info";
    summary: string;
    from: string;
    to: string;
    cc: string;
    bcc: string;
    subject?: string;
    emailId?: string;
}

export interface AssignTimelineInfo {
    type: "assign_info";
    title: string;
    userName: string | null;
    userProfileId: string | null;
    teamName: string | null;
    teamId: string | null;
    displayText: string;
}

export function transformJourneyToTimeline(
    jsonSummary: string,
    type: string,
    title?: string,
    oldValue?: string,
    newValue?: string,
) {
    try {
        let parsed;
        if (jsonSummary != "") {
            parsed = JSON.parse(jsonSummary);
        }
        if (type === "SOURCE") {
            let website;
            if (parsed.Website) {
                try {
                    const raw = String(parsed.Website);
                    website = raw.includes("://")
                        ? raw.split("://")[1].split("/")[0]
                        : raw.split("/")[0];
                } catch {}
            }
            const time = String(parsed.CreatedDate || "").split(".")[0] || "";

            const fullName = parsed.FullName || "Khách hàng";
            const utmCampaign = parsed.UtmCampaign || "—";
            const phone = parsed.Phone || "—";
            const sourceHost = parsed.Website || "—";
            const notes = parsed.Note || "—";

            const displayText = `Khách hàng ${fullName} đã để lại thông tin trong chiến dịch ${utmCampaign} từ ${sourceHost}. Ghi nhận vào lúc ${time}, Số điện thoại: ${phone}`;

            const nodeChildren: any[] = [
                React.createElement("div", { className: "", key: "l1" }, [
                    React.createElement(
                        "span",
                        { className: "font-bold text-primary", key: "n1" },
                        fullName,
                    ),
                    React.createElement(
                        "span",
                        { className: "", key: "n2" },
                        " đã để lại thông tin",
                    ),
                ]),
            ];

            // Chỉ hiển thị nếu có ít nhất một trong hai giá trị không phải "—"
            if (utmCampaign !== "—" || sourceHost !== "—") {
                const campaignAndSource: any[] = [];

                if (utmCampaign !== "—") {
                    campaignAndSource.push("Từ Chiến dịch: ");
                    campaignAndSource.push(
                        React.createElement(
                            "span",
                            {
                                className: "font-bold text-primary",
                                key: "c",
                            },
                            utmCampaign,
                        ),
                    );
                }

                if (sourceHost !== "—") {
                    if (campaignAndSource.length > 0) {
                        campaignAndSource.push(" Nguồn: ");
                    } else {
                        campaignAndSource.push("Nguồn: ");
                    }
                    // Kiểm tra nếu sourceHost là URL thì tạo thẻ <a>, ngược lại tạo <span>
                    const isUrl = /^https?:\/\//.test(String(sourceHost));
                    if (isUrl) {
                        const fullUrl = String(sourceHost);
                        let displayText = fullUrl;

                        // Tách URL để lấy base URL (không có query params) cho text hiển thị
                        try {
                            const urlObj = new URL(fullUrl);
                            displayText = `${urlObj.protocol}//${urlObj.host}${urlObj.pathname}`;
                        } catch (e) {
                            // Nếu không parse được URL, fallback về full URL
                            displayText = fullUrl;
                        }

                        campaignAndSource.push(
                            React.createElement(
                                "a",
                                {
                                    href: fullUrl, // Giữ nguyên full URL với params cho href
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                    className:
                                        "font-bold text-primary text-blue-600 hover:underline",
                                    key: "s",
                                },
                                displayText, // Chỉ hiển thị base URL không có params
                            ),
                        );
                    } else {
                        campaignAndSource.push(
                            React.createElement(
                                "span",
                                {
                                    className: "font-bold text-primary",
                                    key: "s",
                                },
                                sourceHost,
                            ),
                        );
                    }
                }

                if (campaignAndSource.length > 0) {
                    nodeChildren.push(
                        React.createElement(
                            "div",
                            {
                                className: "mt-1",
                                key: "l2",
                            },
                            campaignAndSource,
                        ),
                    );
                }
            }

            // Chỉ hiển thị số điện thoại nếu không phải "—"
            if (phone !== "—") {
                nodeChildren.push(
                    React.createElement(
                        "div",
                        {
                            className: "mt-1",
                            key: "l3",
                        },
                        [
                            "Số điện thoại: ",
                            React.createElement(
                                "span",
                                {
                                    className: "font-bold text-primary",
                                    key: "p",
                                },
                                phone,
                            ),
                        ],
                    ),
                );
            }

            if (notes !== "—") {
                nodeChildren.push(
                    React.createElement(
                        "div",
                        { className: "mt-1", key: "l5" },
                        [
                            "Ghi chú: ",
                            React.createElement(
                                "span",
                                {
                                    className: "font-bold text-primary",
                                    key: "p3",
                                },
                                notes,
                            ),
                        ],
                    ),
                );
            }

            // Chỉ hiển thị thời gian nếu có giá trị
            if (time && time !== "—") {
                nodeChildren.push(
                    React.createElement(
                        "div",
                        {
                            className: "mt-1",
                            key: "l4",
                        },
                        [
                            "Thời gian: ",
                            React.createElement(
                                "span",
                                {
                                    className: "font-bold text-primary",
                                    key: "p2",
                                },
                                time,
                            ),
                        ],
                    ),
                );
            }

            const node = React.createElement(
                "div",
                { className: "text-sm" },
                nodeChildren,
            );

            return { type: "source_html", displayText, node } as const;
        }
        if (type === "EMAIL") {
            const formatRecipients = (value: unknown) => {
                if (!value || value === "null") return "—";
                if (Array.isArray(value)) {
                    return value.map((item) => String(item).trim()).join(", ");
                }
                if (typeof value === "string") {
                    const trimmed = value.trim();
                    if (!trimmed) return "—";
                    try {
                        const maybeArray = JSON.parse(trimmed);
                        if (Array.isArray(maybeArray)) {
                            return maybeArray
                                .map((item) => String(item).trim())
                                .join(", ");
                        }
                    } catch {}
                    return trimmed;
                }
                return String(value);
            };

            const emailInfo: EmailTimelineInfo = {
                type: "email_info",
                summary: "Đã gửi mail tới",
                from: parsed.From || "—",
                to: formatRecipients(parsed.To),
                cc: formatRecipients(parsed.CC),
                bcc: formatRecipients(parsed.BCC),
                subject: parsed.Subject || "",
                emailId: parsed.Id || parsed.id || "",
            };

            return emailInfo;
        }
        if (type === "UPDATE_FIELD") {
            if (parsed != undefined) {
                return transformUpdateField(
                    parsed,
                    oldValue || "",
                    newValue || "",
                );
            } else {
                return transformUpdateField("", oldValue || "", newValue || "");
            }
        }
        if (type === "LINK_CONVERSATION") {
            return transformLinkConversation(parsed);
        }
        if (type === "UNLINK_CONVERSATION") {
            return transformUnlinkConversation(parsed);
        }
        if (
            type === "UPDATE_ASSIGNTO" ||
            type === "UPDATE_ASSIGNTEAM" ||
            type === "ASSIGNTO"
        ) {
            return transformAssignInfo(parsed, title || "");
        }
        return parsed;
    } catch (error) {
        return "";
    }
}

export function transformCreateNote(json: any, summary: string) {
    try {
        const parsed = typeof json === "string" ? JSON.parse(json) : json || {};
        const content = parsed?.Note ?? parsed?.Value ?? "";
        return `Cập nhật thông tin chăm sóc\nNội dung: ${content}`;
    } catch {
        let split = summary.split("Thêm ghi chú: ");
        if (split.length > 1) {
            return `Cập nhật thông tin chăm sóc\nNội dung: ${split[1]}`;
        } else {
            return `Cập nhật thông tin chăm sóc\n${summary}`;
        }
    }
}

export function transformUpdateStage(
    oldValue: string,
    newValue: string,
    summary: string,
) {
    let oldValueParsed;
    if (oldValue !== "") {
        oldValueParsed = JSON.parse(oldValue);
    }
    let newValueParsed;
    if (newValue !== "") {
        newValueParsed = JSON.parse(newValue);
    }
    if (oldValueParsed && newValueParsed) {
        return `Chuyển từ giai đoạn "${oldValueParsed.Name}" sang giai đoạn "${newValueParsed.Name}"`;
    }
    return summary;
}

export function transformUpdateField(
    json: any,
    oldValue: string,
    newValue: string,
) {
    if (json == "") {
        return `Cập nhật thông tin`;
    }
    if (json.FieldId === "fullName") {
        return `Cập nhật thông tin tên khách hàng: ${json.Value}`;
    }
    if (json.FieldId === "phone") {
        return `Cập nhật thông tin số điện thoại: ${json.Value}`;
    }
    if (json.FieldId === "email") {
        return `Cập nhật thông tin email: ${json.Value}`;
    }
    if (json.FieldId === "physicalId") {
        return `Cập nhật thông tin CCCD: ${json.Value}`;
    }
    if (json.FieldId === "dob") {
        return `Cập nhật thông tin ngày sinh: ${json.Value.split(" ")[0]}`;
    }
    if (json.FieldId === "gender") {
        return `Cập nhật thông tin giới tính: ${
            json.Value === "Male"
                ? "Nam"
                : json.Value === "Female"
                  ? "Nữ"
                  : "Không xác định"
        }`;
    }
    if (json.FieldId === "address") {
        return `Cập nhật thông tin địa chỉ: ${json.Value}`;
    }
    if (json.FieldId === "work") {
        return `Cập nhật thông tin công việc: ${json.Value}`;
    }
    if (json.FieldId === "title") {
        return `Cập nhật thông tin tiêu đề: ${json.Value}`;
    }
}

export function transformAttachmentToTimeline(summary: string) {
    const fileInfo = extractFileInfo(summary);

    if (!fileInfo) {
        return summary;
    }

    return {
        type: "attachment",
        fileName: fileInfo.name,
        filePath: fileInfo.path,
        originalSummary: summary,
    };
}

export function transformAssignToTimeline(summary: string) {
    if (!summary) return "";

    const trimmed = String(summary).trim();

    const prefixes = [
        { label: "Thu hồi phụ trách khách hàng" },
        { label: "Thêm phụ trách khách hàng" },
        { label: "Thu hồi theo dõi khách hàng" },
        { label: "Thêm theo dõi khách hàng" },
        { label: "Chuyển phụ trách khách hàng tự động" },
        { label: "Chuyển phụ trách khách hàng" },
    ];

    const prefix = prefixes.find((p) => trimmed.startsWith(p.label));

    // Hàm helper để parse JSON array từ string
    const parseJsonArray = (str: string): any[] | null => {
        const firstBracket = str.indexOf("[");
        const lastBracket = str.lastIndexOf("]");
        if (
            firstBracket === -1 ||
            lastBracket === -1 ||
            lastBracket <= firstBracket
        ) {
            return null;
        }
        const jsonArrayStr = str.slice(firstBracket, lastBracket + 1);
        try {
            const parsed = JSON.parse(jsonArrayStr);
            if (Array.isArray(parsed)) {
                return parsed.map((x: any) => ({
                    teamId: x?.TeamId ?? null,
                    teamName: x?.TeamName ?? null,
                    profileId: x?.ProfileId ?? null,
                    profileName: x?.ProfileName ?? null,
                }));
            }
        } catch (e) {
            console.error("parseJsonArray failed", e);
        }
        return null;
    };

    let items: any[] | null = null;

    if (prefix) {
        // Nếu có prefix, thử dùng extractAssignInfo trước
        items = extractAssignInfo(trimmed) || null;

        // Nếu extractAssignInfo không parse được (do không có prefix trong danh sách của nó),
        // tự parse JSON array
        if (!items || !Array.isArray(items) || items.length === 0) {
            items = parseJsonArray(trimmed);
        }
    } else {
        // Không có prefix, thử parse như JSON array thuần
        items = parseJsonArray(trimmed);
        if (!items || !Array.isArray(items) || items.length === 0) {
            // Thử dùng extractAssignInfo như fallback
            items = extractAssignInfo(trimmed) || null;
        }
    }

    if (!items || !Array.isArray(items) || items.length === 0) {
        return summary;
    }

    // Xác định conjunction và prefix text dựa trên prefix
    let conjunction = "cho";
    let prefixText = prefix?.label || "Chuyển phụ trách khách hàng";

    if (prefix) {
        if (prefix.label.startsWith("Thu hồi")) {
            conjunction = "từ";
        } else if (prefix.label.startsWith("Chuyển")) {
            conjunction = "cho";
        }
    } else {
        // Không có prefix nhưng có items, dùng text mặc định
        prefixText = "Chuyển phụ trách khách hàng";
        conjunction = "cho";
    }

    const nodes: React.ReactNode[] = [];
    nodes.push(prefixText + " " + conjunction + " ");
    items.forEach((x: any, idx: number) => {
        if (idx > 0) nodes.push(", ");
        if (x.profileName) {
            nodes.push(
                React.createElement(
                    "span",
                    { className: "text-primary", key: `p-${idx}` },
                    x.profileName,
                ),
            );
        } else if (x.teamName) {
            nodes.push("đội sale ");
            nodes.push(
                React.createElement(
                    "span",
                    { className: "text-primary", key: `t-${idx}` },
                    x.teamName,
                ),
            );
        }
    });

    return React.createElement("span", null, ...nodes);
}

export function transformLinkConversation(json: any) {
    if (json.Id && json.PersonName) {
        return {
            type: "link_conversation",
            conversationId: json.Id,
            personName: json.PersonName,
            displayText: `Liên kết hộp thư thoại: ${json.PersonName}`,
        };
    }
    return null;
}

export function transformUnlinkConversation(json: any) {
    if (json.Id && json.PersonName) {
        return {
            type: "unlink_conversation",
            conversationId: json.Id,
            personName: json.PersonName,
            displayText: `Hủy liên kết hộp thư thoại: ${json.PersonName}`,
        };
    }
    return null;
}

export function isConversationUnlinked(
    conversationId: string,
    events: any[],
    currentIndex: number,
): boolean {
    // Chỉ active link mới nhất: duyệt từ đầu danh sách (mới nhất) đến ngay trước currentIndex
    // Nếu gặp UNLINK_CONVERSATION hoặc LINK_CONVERSATION cho cùng conversationId ở phía trên
    // thì link tại currentIndex sẽ bị vô hiệu (không clickable)
    for (let i = 0; i < currentIndex; i++) {
        const event = events[i];
        if (event.type === "UNLINK_CONVERSATION") {
            try {
                // UNLINK_CONVERSATION sử dụng previousJsonSummary thay vì jsonSummary
                const unlinkData = JSON.parse(
                    event.previousJsonSummary || event.jsonSummary || "{}",
                );
                if (unlinkData.Id === conversationId) {
                    return true;
                }
            } catch (error) {
                // Ignore parsing errors
            }
        }
        // Nếu gặp một LINK_CONVERSATION cho cùng conversationId ở phía trên
        // thì LINK tại currentIndex không phải là mới nhất => disable
        if (event.type === "LINK_CONVERSATION") {
            try {
                const linkData = JSON.parse(event.jsonSummary || "{}");
                if (linkData.Id === conversationId) {
                    return true;
                }
            } catch (error) {
                // Ignore parsing errors
            }
        }
    }
    return false;
}

export function transformAssignInfo(
    json: any,
    title: string,
): AssignTimelineInfo {
    try {
        const user = json.User;
        const team = json.Team;
        const userName =
            user?.FullName ||
            json?.[0]?.ProfileName ||
            json?.Users?.[0]?.FullName;
        const userProfileId =
            user?.ProfileId ||
            json?.[0]?.ProfileId ||
            json?.Users?.[0]?.ProfileId;
        const teamName =
            team?.Name || json?.[0]?.TeamName || json?.Users?.[0]?.TeamName;
        const teamId =
            team?.TeamId || json?.[0]?.TeamId || json?.Users?.[0]?.TeamId;
        // Tạo displayText
        let displayText = title || "Chuyển người phụ trách tự động";
        if (userName) {
            displayText += `\nSang: ${userName}`;
        }
        if (teamName) {
            displayText += `\nĐội sale: ${teamName}`;
        }

        return {
            type: "assign_info",
            title: title || "Chuyển người phụ trách tự động",
            userName,
            userProfileId,
            teamName,
            teamId,
            displayText,
        };
    } catch (error) {
        console.error("transformAssignInfo failed", error);
        return {
            type: "assign_info",
            title: title || "Chuyển người phụ trách tự động",
            userName: "",
            userProfileId: "",
            teamName: "",
            teamId: "",
            displayText: "",
        };
    }
}
