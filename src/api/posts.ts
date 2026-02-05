import { socialPaths } from "@/lib/authConstants";
import { createApiCall } from "@/lib/api";
import type {
    PostPayload,
    CampaignPayload,
    ChannelPayload,
    IdeaPayload,
    LabelPayload,
    HashtagPayload,
    PaginationResponse,
} from "@/interfaces/post";

// Payload cho cấu hình đồng bộ Facebook
// Payload cho cấu hình đồng bộ Facebook
export interface FacebookSyncConfigPayload {
    channelIds: string[];
    isActive: boolean;
    syncIntervalMinutes?: number;
}

export const postsApi = {
    getPosts: async (
        orgId: string,
        params: {
            page?: number;
            pageSize?: number;
            channelId?: string;
            status?: number;
            searchText?: string;
            startDate?: string;
            endDate?: string;
            isList?: boolean;
        } = {}
    ): Promise<PaginationResponse<PostPayload>> => {
        const api = createApiCall(orgId);
        const response = await api.get<PaginationResponse<PostPayload>>(
            socialPaths.postsList,
            {
                params,
            }
        );
        return response.data;
    },
    getPost: async (orgId: string, postId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.postsDetail.replace("{id}", postId)
        );
        return response.data;
    },
    createPost: async (orgId: string, post: PostPayload) => {
        const api = createApiCall(orgId);
        const response = await api.post(socialPaths.postsCreate, post);
        return response.data;
    },
    updatePost: async (orgId: string, postId: string, post: PostPayload) => {
        const api = createApiCall(orgId);
        const response = await api.put(
            socialPaths.postsUpdate.replace("{id}", postId),
            post
        );
        return response.data;
    },
    deletePost: async (orgId: string, postId: string) => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.postsDelete.replace("{id}", postId)
        );
        return response.data;
    },
    getPostAutoComments: async (orgId: string, postId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.postsAutoComments.replace("{id}", postId)
        );
        return response.data;
    },
    getPostComments: async (orgId: string, postId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.postsComments.replace("{id}", postId)
        );
        return response.data;
    },
    getPostVersions: async (orgId: string, postId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.postsVersions.replace("{id}", postId)
        );
        return response.data;
    },
    createPostAutoComments: async (
        orgId: string,
        postId: string,
        autoComments: any
    ) => {
        const api = createApiCall(orgId);
        const response = await api.post(
            socialPaths.postsAutoComments.replace("{id}", postId),
            autoComments
        );
        return response.data;
    },
    createPostComments: async (
        orgId: string,
        postId: string,
        comments: any
    ) => {
        const api = createApiCall(orgId);
        const response = await api.post(
            socialPaths.postsComments.replace("{id}", postId),
            comments
        );
        return response.data;
    },
    createPostVersions: async (
        orgId: string,
        postId: string,
        versions: any
    ) => {
        const api = createApiCall(orgId);
        const response = await api.post(
            socialPaths.postsVersions.replace("{id}", postId),
            versions
        );
        return response.data;
    },
    deletePostAutoComments: async (orgId: string, postId: string) => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.postsAutoComments.replace("{id}", postId)
        );
        return response.data;
    },
    deletePostComments: async (orgId: string, postId: string) => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.postsComments.replace("{id}", postId)
        );
        return response.data;
    },
    deletePostVersions: async (orgId: string, postId: string) => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.postsVersions.replace("{id}", postId)
        );
        return response.data;
    },
    getCampaigns: async (
        orgId: string,
        params: { page?: number; pageSize?: number } = {}
    ): Promise<PaginationResponse<CampaignPayload>> => {
        const api = createApiCall(orgId);
        const response = await api.get<PaginationResponse<CampaignPayload>>(
            socialPaths.campaignsList,
            {
                params,
            }
        );
        return response.data;
    },
    getCampaign: async (orgId: string, campaignId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.campaignsDetail.replace("{id}", campaignId)
        );
        return response.data;
    },
    createCampaign: async (orgId: string, campaign: CampaignPayload) => {
        const api = createApiCall(orgId);
        const response = await api.post(socialPaths.campaignsCreate, campaign);
        return response.data;
    },
    updateCampaign: async (
        orgId: string,
        campaignId: string,
        campaign: CampaignPayload
    ) => {
        const api = createApiCall(orgId);
        const response = await api.put(
            socialPaths.campaignsUpdate.replace("{id}", campaignId),
            campaign
        );
        return response.data;
    },
    deleteCampaign: async (orgId: string, campaignId: string) => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.campaignsDelete.replace("{id}", campaignId)
        );
        return response.data;
    },
    getChannels: async (
        orgId: string,
        params: { page?: number; pageSize?: number } = {}
    ): Promise<PaginationResponse<ChannelPayload>> => {
        const api = createApiCall(orgId);
        const response = await api.get<PaginationResponse<ChannelPayload>>(
            socialPaths.channelsList,
            {
                params,
            }
        );
        return response.data;
    },
    getChannel: async (orgId: string, channelId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.channelsDetail.replace("{id}", channelId)
        );
        return response.data;
    },
    createChannel: async (orgId: string, channel: ChannelPayload) => {
        const api = createApiCall(orgId);
        const response = await api.post(socialPaths.channelsCreate, channel);
        return response.data;
    },
    updateChannel: async (
        orgId: string,
        channelId: string,
        channel: ChannelPayload
    ) => {
        const api = createApiCall(orgId);
        const response = await api.put(
            socialPaths.channelsUpdate.replace("{id}", channelId),
            channel
        );
        return response.data;
    },
    deleteChannel: async (orgId: string, channelId: string) => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.channelsDelete.replace("{id}", channelId)
        );
        return response.data;
    },
    getIdeas: async (
        orgId: string,
        params: { page?: number; pageSize?: number } = {}
    ): Promise<PaginationResponse<IdeaPayload>> => {
        const api = createApiCall(orgId);
        const response = await api.get<PaginationResponse<IdeaPayload>>(
            socialPaths.ideasList,
            {
                params,
            }
        );
        return response.data;
    },
    getIdea: async (orgId: string, ideaId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.ideasDetail.replace("{id}", ideaId)
        );
        return response.data;
    },
    createIdea: async (orgId: string, idea: IdeaPayload) => {
        const api = createApiCall(orgId);
        const response = await api.post(socialPaths.ideasCreate, idea);
        return response.data;
    },
    updateIdea: async (orgId: string, ideaId: string, idea: IdeaPayload) => {
        const api = createApiCall(orgId);
        const response = await api.put(
            socialPaths.ideasUpdate.replace("{id}", ideaId),
            idea
        );
        return response.data;
    },
    deleteIdea: async (orgId: string, ideaId: string) => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.ideasDelete.replace("{id}", ideaId)
        );
        return response.data;
    },
    getLabels: async (
        orgId: string,
        params: { page?: number; pageSize?: number } = {}
    ): Promise<PaginationResponse<LabelPayload>> => {
        const api = createApiCall(orgId);
        const response = await api.get<PaginationResponse<LabelPayload>>(
            socialPaths.labelsList,
            {
                params,
            }
        );
        return response.data;
    },
    getLabel: async (orgId: string, labelId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.labelsDetail.replace("{id}", labelId)
        );
        return response.data;
    },
    createLabel: async (orgId: string, label: LabelPayload) => {
        const api = createApiCall(orgId);
        const response = await api.post(socialPaths.labelsCreate, label);
        return response.data;
    },
    updateLabel: async (
        orgId: string,
        labelId: string,
        label: LabelPayload
    ) => {
        const api = createApiCall(orgId);
        const response = await api.put(
            socialPaths.labelsUpdate.replace("{id}", labelId),
            label
        );
        return response.data;
    },
    deleteLabel: async (orgId: string, labelId: string) => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.labelsDelete.replace("{id}", labelId)
        );
        return response.data;
    },
    getHashtags: async (
        orgId: string,
        params: { page?: number; pageSize?: number } = {}
    ): Promise<PaginationResponse<HashtagPayload>> => {
        const api = createApiCall(orgId);
        const response = await api.get<PaginationResponse<HashtagPayload>>(
            socialPaths.hashtagsList,
            {
                params,
            }
        );
        return response.data;
    },
    getHashtag: async (orgId: string, hashtagId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.hashtagsDetail.replace("{id}", hashtagId)
        );
        return response.data;
    },
    createHashtag: async (orgId: string, hashtag: HashtagPayload) => {
        const api = createApiCall(orgId);
        const response = await api.post(socialPaths.hashtagsCreate, hashtag);
        return response.data;
    },
    updateHashtag: async (
        orgId: string,
        hashtagId: string,
        hashtag: HashtagPayload
    ) => {
        const api = createApiCall(orgId);
        const response = await api.put(
            socialPaths.hashtagsUpdate.replace("{id}", hashtagId),
            hashtag
        );
        return response.data;
    },
    deleteHashtag: async (orgId: string, hashtagId: string) => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.hashtagsDelete.replace("{id}", hashtagId)
        );
        return response.data;
    },
    getFacebookSyncConfig: async (orgId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(socialPaths.getFacebookSyncConfig);
        return response.data;
    },
    createFacebookSyncConfig: async (
        orgId: string,
        facebookSyncConfig: FacebookSyncConfigPayload
    ) => {
        const api = createApiCall(orgId);
        const response = await api.post(
            socialPaths.createFacebookSyncConfig,
            facebookSyncConfig
        );
        return response.data;
    },
    updateFacebookSyncConfig: async (
        orgId: string,
        facebookSyncConfigId: string,
        facebookSyncConfig: FacebookSyncConfigPayload
    ) => {
        const api = createApiCall(orgId);
        const response = await api.put(
            socialPaths.updateFacebookSyncConfig.replace(
                "{id}",
                facebookSyncConfigId
            ),
            facebookSyncConfig
        );
        return response.data;
    },
    activeFacebookSyncConfig: async (
        orgId: string,
        facebookSyncConfigId: string,
        payload: { isActive: boolean }
    ) => {
        const api = createApiCall(orgId);
        const response = await api.patch(
            socialPaths.activeFacebookSyncConfig.replace(
                "{id}",
                facebookSyncConfigId
            ),
            payload
        );
        return response.data;
    },
    replyComment: async (orgId: string, payload: any) => {
        const api = createApiCall(orgId);
        const response = await api.post(socialPaths.replyComment, payload);
        return response.data;
    },
    getStatistics: async (orgId: string, params: any): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.get(socialPaths.getStatistics, { params });
        return response.data;
    },
    createAutoComment: async (orgId: string, payload: any) => {
        const api = createApiCall(orgId);
        const response = await api.post(socialPaths.createAutoComment, payload);
        return response.data;
    },
    getAutoCommentList: async (orgId: string, params: any): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.get(socialPaths.getAutoCommentList, {
            params,
        });
        return response.data;
    },
    getAutoCommentDetail: async (orgId: string, id: string): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.getAutoCommentDetail.replace("{id}", id)
        );
        return response.data;
    },
    updateAutoComment: async (
        orgId: string,
        id: string,
        payload: any
    ): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.put(
            socialPaths.updateAutoComment.replace("{id}", id),
            payload
        );
        return response.data;
    },
    getAutoCommentStats: async (orgId: string, params: any): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.get(socialPaths.getAutoCommentStats, {
            params,
        });
        return response.data;
    },
    syncPost: async (orgId: string, id: string) => {
        const api = createApiCall(orgId);
        const response = await api.post(
            socialPaths.syncPost.replace("{id}", id),
            {}
        );
        return response.data;
    },
    postToday: async (orgId: string) => {
        const api = createApiCall(orgId);
        const response = await api.get(socialPaths.postToday);
        return response.data;
    },
    postStatisticsMonthly: async (orgId: string, params: any): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.get(socialPaths.postStatisticsMonthly, {
            params,
        });
        return response.data;
    },
    getPostPermission: async (orgId: string): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.get(socialPaths.getPostPermission);
        return response.data;
    },
    getUserPostPermission: async (
        orgId: string,
        userId: string
    ): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.get(
            socialPaths.getUserPostPermission.replace("{userId}", userId)
        );
        return response.data;
    },
    createPostPermission: async (orgId: string, payload: any): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.post(
            socialPaths.createPostPermission,
            payload
        );
        return response.data;
    },
    updatePostPermission: async (
        orgId: string,
        id: string,
        payload: any
    ): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.put(
            socialPaths.updatePostPermission.replace("{id}", id),
            payload
        );
        return response.data;
    },
    updateUserPostPermissionRole: async (
        orgId: string,
        userId: string,
        payload: any
    ): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.patch(
            socialPaths.updateUserPostPermissionRole.replace(
                "{userId}",
                userId
            ),
            payload
        );
        return response.data;
    },
    updateUserPostPermissionChannel: async (
        orgId: string,
        userId: string,
        payload: any
    ): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.patch(
            socialPaths.updateUserPostPermissionChannel.replace(
                "{userId}",
                userId
            ),
            payload
        );
        return response.data;
    },
    deleteUserPostPermission: async (
        orgId: string,
        userId: string
    ): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.delete(
            socialPaths.deleteUserPostPermission.replace("{userId}", userId)
        );
        return response.data;
    },
    getPostPermissionRoles: async (orgId: string): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.get(socialPaths.getPostPermissionRoles);
        return response.data;
    },
    checkPermissionPost: async (orgId: string, params: any): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.get(socialPaths.checkPermissionPost, {
            params,
        });
        return response.data;
    },
    postToFacebook: async (orgId: string, postId: string): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.post(
            socialPaths.postToFacebook.replace("{postId}", postId)
        );
        return response.data;
    },
    checkPagePermission: async (orgId: string, body: any): Promise<any> => {
        const api = createApiCall(orgId);
        const response = await api.post(socialPaths.checkPagePermission, body);
        return response.data;
    },
};
