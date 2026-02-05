export type WithId = { id?: string | number };

export interface PostPayload {
    title: string;
    type: string;
    content: string;
    scheduledTime?: string;
    channelId?: string;
    externalMediaData?: { url: string; type: "image" | "video" }[];
    ideaId?: string;
    campaignId?: string;
    labelIds?: string | string[];
    hashtags?: string | string[];
    status?: number;
}

export interface PostListItem extends PostPayload, WithId {}

export interface CampaignPayload {
    name: string;
    description?: string;
    startDate?: string;
    endDate?: string;
    status?: number;
}

export interface CampaignItem extends CampaignPayload, WithId {}

export interface ChannelPayload {
    name: string;
    type: string;
    pageId?: string;
    config?: string;
    isActive?: boolean;
    status?: number;
}

export interface ChannelItem extends ChannelPayload, WithId {}

export interface IdeaPayload {
    topic: string;
    content?: string;
    isUsed?: boolean;
    status?: number;
}

export interface IdeaItem extends IdeaPayload, WithId {}

export interface LabelPayload {
    name: string;
    color?: string;
    status?: number;
}

export interface LabelItem extends LabelPayload, WithId {}

export interface HashtagPayload {
    tag: string;
    status?: number;
}

export interface HashtagItem extends HashtagPayload, WithId {}

export interface PaginationResponse<T> {
    content?: T[];
    data?: T[];
    items?: T[];
    pagination?: {
        TotalRecords?: number;
    };
    total?: number;
    totalRecords?: number;
}
