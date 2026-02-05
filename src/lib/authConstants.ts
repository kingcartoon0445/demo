// Remove unused import

export const isDev = () => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        return hostname === "180.93.182.196" || hostname === "localhost";
    }
    return false;
};
const getApiBase = () => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (
            hostname === "180.93.182.196" ||
            hostname === "localhost" ||
            hostname === "192.168.1.20" ||
            hostname === "beta.coka.ai" ||
            hostname === "192.168.10.109" ||
            hostname === "alpha.coka.ai"
        ) {
            return "https://api.alpha.coka.ai";
        }
        if (hostname === "app2.coka.ai") {
            return "https://api.app2.coka.ai";
        }
    }
    return "https://api.app2.coka.ai";
};

const getProductApiBase = () => {
    if (typeof window !== "undefined") {
        const hostname = window.location.hostname;
        if (
            hostname === "localhost" ||
            hostname === "192.168.10.109" ||
            hostname === "alpha.coka.ai"
        ) {
            return "https://api.alpha.products.coka.ai";
            return "http://localhost:5138";
        }
    }
    return "https://api.products.coka.ai";
};

export const apiBase = getApiBase();
export const productApiBase = getProductApiBase();
export const n8nApiBase = "https://n8n.coka.ai";
export const inventoryApiBase =
    process.env.NEXT_PUBLIC_INVENTORY_API_BASE ||
    "https://api.inventory.coka.ai";
export const paymentApiBase =
    process.env.NEXT_PUBLIC_PAYMENT_API_BASE || "https://payment.coka.ai";
export const callcenterApiBase =
    process.env.NEXT_PUBLIC_CALLENCENTER_API_BASE ||
    "https://callcenter.coka.ai";
export const emailApiBase =
    process.env.NEXT_PUBLIC_EMAIL_API_BASE || "https://api.email.coka.ai";
const paths = {
    // Xác thực và tài khoản
    workspaceDelete: "/api/v1/organization/workspace/{workspaceId}",
    getAllMember: "/api/v1/organization/member/all",

    unJoinedWorkspace:
        "/api/v1/settings/permission/user/{profileId}/roles/workspace/unjoined/getall",
    login: "/api/v1/auth/login",
    socialLogin: "/api/v1/auth/social/login",
    verifyOtp: "/api/v1/otp/verify",
    resendOtp: "/api/v1/otp/resend",
    refreshToken: "/api/v1/account/refreshtoken",
    getProfile: "/api/v1/user/profile/getdetail",
    getProfileById: "/api/v1/user/profile/",
    getUserProfile: "/api/v1/user/profile",
    updateUserProfile: "/api/v1/user/profile/update",
    getUserWorkspaceRoles:
        "/api/v1/settings/permission/user/{profileId}/roles/workspace/getall",
    getUserWorkspaceRolesV2:
        "/api/v1/settings/permission/user/roles/workspace/getall",
    // Tổ chức
    orgList: "/api/v2/organization/getlistpaging",
    orgDetail: "/api/v2/organization/getdetail/",
    orgMembers: "/api/v1/organization/member/getlistpaging",
    orgMemberDetail: "/api/v1/user/profile/",
    orgSearchToInv: "/api/v2/organization/member/searchprofile",
    orgInvMember: "/api/v2/organization/member/invite",
    orgCreate: "/api/v2/organization/create",
    orgUpdate: "/api/v2/organization",
    orgUpdateAvatar: "/api/v2/organization/updateavatar",
    orgUsagestatistics: "/api/v1/workspace/report/getusagestatistics",
    searchOrgToJoin: "/api/v2/organization/member/request/searchorganization",
    joinOrg: "/api/v2/organization/member/request/requestinvite",
    acceptCancelOrg: "/api/v2/organization/member/request/accept",
    cancelRequestJoinOrg: "/api/v2/organization/member/request/cancel",
    acceptCancelRequestOrg: "/api/v2/organization/member/invite/accept",
    cancelMemberInviteOrg: "/api/v2/organization/member/invite/cancel/",
    getOrgInvitedList: "/api/v2/organization/member/request/getlistpaging",
    getOrgRequestList: "/api/v2/organization/member/invite/getlistpaging",
    orgChangeRole: "/api/v2/organization/member/grantrole",
    orgPermissionGetAllMember:
        "/api/v1/settings/permission/organization/getallmember",
    orgRemoveMember: "/api/v2/organization/members/{profileId}",
    orgLeave: "/api/v1/organization/member/leave",
    orgLeaveWorkspace: "/api/v1/organization/workspace/user/leave",
    // Thông báo
    notifyList: "/api/v1/notify/getlistpaging",
    notifyUnreadCount: "/api/v1/notify/countunread",
    notifySetIsRead: "/api/v1/notify/updatestatus/notifyid",
    notifySetReadAll: "/api/v1/notify/readall",
    updateFCMTokenApi: "/api/v1/user/fcm",
    notifySettingList: "/api/v2/setting/notifications/getlist",
    notifySettingUpdate: "/api/v2/setting/notifications/{id}/toggle",

    // Workspace
    workspaceList: "/api/v1/organization/workspace/getlistpaging",
    workspaceDetail: "/api/v1/organization/workspace/getdetail/",
    workspaceUpdate: "/api/v1/organization/workspace/update/",
    workspaceCreate: "/api/v1/organization/workspace/create",
    getSourceList: `/api/v1/crm/category/source/getlistpaging`,
    getTagList: `/api/v1/crm/category/tags/getlistpaging`,
    getTagPaging: `/api/v1/crm/category/tags/getpaging`,
    createTag: `/api/v1/crm/category/tags/create`,
    updateTag: `/api/v1/crm/category/tags/`,
    deleteTag: `/api/v1/crm/category/tags/`,
    getStageGroupList: `/api/v1/crm/category/stage/group/getlistpaging`,
    createStageGroup: `/api/v1/crm/category/stage/group/create`,
    updateStageGroup: `/api/v1/crm/category/stage/group/`,
    deleteStageGroup: `/api/v1/crm/category/stage/group/`,
    getStageList: `/api/v1/crm/category/stage/getlistpaging`,
    createStage: `/api/v1/crm/category/stage/create`,
    updateStage: `/api/v1/crm/category/stage/`,
    deleteStage: `/api/v1/crm/category/stage/`,
    workspaceMemberList: `/api/v1/organization/workspace/user/getlistpaging`,
    workspaceAddMember: `/api/v1/organization/workspace/user`,
    workspaceRemoveMember: `/api/v1/organization/workspace/user/`,
    workspaceMemberGrantRole: `/api/v1/organization/workspace/grantrole`,
    workspaceLeave: `/api/v1/organization/workspace/leave`,

    getUtmSourceList: `/api/v1/crm/category/utmsource/getlistpaging`,
    createUtmSource: `/api/v1/crm/category/utmsource/create`,
    updateUtmSource: `/api/v1/crm/category/utmsource/`,
    deleteUtmSource: `/api/v1/crm/category/utmsource/`,

    // Khách hàng và CRM
    customersList: "/api/v1/crm/contact/getlistpaging",
    customerDetail: "/api/v1/crm/contact/getdetail",
    customerCreate: "/api/v1/crm/contact/create",
    customerApi: "/api/v1/crm/",
    customerExportExcel: "/api/v1/export/contact/byworkspace",
    customerUserCurrentManagerList: "/api/v1/crm/team/user/current-managers",
    customerJourneyList: "/api/v1/crm/contact/",
    teamApi: "/api/v1/crm/team",

    // Tự động hóa và định tuyến
    getRecallDetail: "/api/v1/automation/eviction/getdetail",
    routingApi: "/api/v1/routing",
    automation: "/api/v1/automation",

    // Báo cáo và thống kê
    reportSummary: "/api/v1/workspace/report/summary",
    statisticsByUtmSource: "/api/v1/crm/report/getstatisticsbyutmsource",
    statisticsByDataSource: "/api/v1/crm/report/getstatisticsbydatasource",
    statisticsByTag: "/api/v1/crm/report/getstatisticsbytag",
    statisticsByUser: "/api/v1/crm/report/getstatisticsbyuser",
    customerChartByOvertime: "/api/v1/crm/report/getstatisticsovertime",
    customerChartByRating: "/api/v1/crm/report/getstatisticsbyrating",
    statisticsByStageGroup: "/api/v1/crm/report/getstatisticsbystagegroup",
    customStatistics: "/api/v1/report/contact/getcustomstatistics",
    orgCustomStatistics: "/api/v1/report/organization/getcustomstatistics",

    // Tích hợp mạng xã hội
    connectFB: "/api/v1/auth/facebook/message",
    getSubscriptionsApi: "/api/v2/auth/zalo/message/connections",
    updateSubscriptionsApi: "/api/v1/integration/omnichannel/updatestatus/",
    conversationList: "/api/v1/omni/conversation/getlistpaging",
    chatList: "/api/v1/social/message/getlistpaging",
    sendFbMessage: "/api/v1/social/message/sendmessage",
    conversationAssign: "/api/v1/omni/conversation/",
    convertToLead: "/api/v1/omni/conversation/",
    conversationDetail: "/api/v1/integration/omni/conversation/",
    deleteConversationApi:
        "/api/v1/integration/omnichannel/{integrationAuth}/delete",

    // Quản lý lead
    getLeadListApi: "/api/v2/auth/facebook/lead/connections",
    autoMappingZaloApi: "/api/v2/lead/integration/zalo/mappinggenerator",
    getWebformListApi: "/api/v2/lead/integration/website/getlistpaging",
    deleteWebformApi: "/api/v2/lead/integration/website/{websiteId}",
    getZaloformListApi: "/api/v2/lead/integration/zalo/getlistpaging",
    updateStatusZaloformApi: "/api/v2/lead/integration/zalo/{formId}/status",
    connectZaloformApi: "/api/v2/lead/integration/zalo/connect",
    deleteZaloformApi: "/api/v1/integration/zalo/form/delete/",
    addWebformApi: "/api/v2/lead/integration/website/create",
    verifyWebformApi: "/api/v2/lead/integration/website/{websiteId}/verify",
    updateStatusWebformApi:
        "/api/v2/lead/integration/website/{websiteId}/status",
    fbLeadConnectApi: "/api/v2/public/integration/auth/facebook/lead",
    zaloLeadConnectApi: "/api/v2/public/integration/auth/zalo/lead",
    updateLeadStatusApi: "/api/v1/integration/lead/updatestatus/",
    deleteLeadApi: "/api/v1/integration/",
    fbConnectPageApi: "/api/v1/auth/facebook/lead/manual",

    // Tiktok Form
    tiktokLeadAuthApi: "/api/v1/integration/tiktok/auth/lead",
    getTiktokFormListApi: "/api/v2/lead/integration/tiktok/getlist",
    getTiktokFormListConnectedApi:
        "/api/v2/lead/integration/tiktok/getlistconnected",
    getTiktokFormDetailApi: "/api/v2/lead/integration/tiktok/{id}",
    createTiktokFormApi: "/api/v2/lead/integration/tiktok/create",
    updateTiktokFormApi: "/api/v1/integration/tiktok/form/",
    updateTiktokFormStatusApi:
        "/api/v2/lead/integration/tiktok/{formId}/status",
    deleteTiktokFormApi: "/api/v2/lead/integration/tiktok/{formId}",

    // Webhook
    webhookApi: "/api/v2/lead/integration/webhook/",

    // Chatbot
    createChatBotApi: "/api/v1/omni/chatbot/create",
    updateChatBotApi: "/api/v1/omni/chatbot/update/",
    updateStatusChatbotApi: "/api/v1/omni/chatbot/updatestatus/",
    updateStatusChatbotConvApi:
        "/api/v1/omni/conversation/updatechatbotstatus/",
    getChatBotListApi: "/api/v1/omni/chatbot/getlistpaging",

    // Quản lý kho hàng
    inventoryList: `/api/v1/inventory/getlist`,
    inventoryDetail: `/api/v1/inventory/`,
    inventoryCreate: `/api/v1/inventory/create`,
    inventoryUpdate: `/api/v1/inventory/`,
    inventoryUpdateStatus: `/api/v1/inventory/`,
    inventoryUpdateAvatar: `/api/v1/inventory/`,
    inventoryDelete: `/api/v1/inventory/`,

    // Quản lý block
    blockList: `/api/v1/inventory/`,
    blockDetail: `/api/v1/inventory/`,
    blockCreate: `/api/v1/inventory/`,
    blockUpdate: `/api/v1/inventory/`,
    blockUpdateStatus: `/api/v1/inventory/`,
    blockDelete: `/api/v1/inventory/`,
    blockUpdateProduct: `/api/v1/inventory/`,

    // Quản lý sản phẩm
    productList: `/api/v1/inventory/`,
    productDetail: `/api/v1/inventory/`,
    productCreate: `/api/v1/inventory/`,
    productUpdate: `/api/v1/inventory/`,
    productUpdateStatus: `/api/v1/inventory/`,
    productUpdateBlock: `/api/v1/inventory/`,
    productDelete: `/api/v1/inventory/`,

    // Custom Report
    customReport: "/api/v1/report/custom",

    // PHÂN QUYỀN - NHÓM
    permissionGroupGetAll: "/api/v1/settings/permission/groups/getall",
    permissionGroupCreate: "/api/v1/settings/permission/groups/create",
    permissionGroupUpdate: "/api/v1/settings/permission/groups/",
    permissionGroupUpdateStatus: "/api/v1/settings/permission/groups/",
    permissionGroupGetDetail: "/api/v1/settings/permission/groups/",
    permissionGroupDelete: "/api/v1/settings/permission/groups/",
    permissionGroupRolesGetAll: "/api/v1/settings/permission/groups/",
    permissionGroupRolesGrant: "/api/v1/settings/permission/groups/",
    permissionGroupDetailRoles:
        "/api/v1/settings/permission/groups/{groupId}/roles/getall",
    permissionGroupRolesGrantMultiple:
        "/api/v1/settings/permission/groups/{groupId}/roles/grant/multiple",
    permissionGroupUpdateName:
        "/api/v1/settings/permission/groups/{groupId}/update",

    // QUẢN LÝ WORKSPACE VÀ QUYỀN
    getAllWorkspaces:
        "/api/v1/settings/permission/organization/getallworkspace",
    grantUserRoles: "/api/v1/settings/permission/user/{profileId}/roles/grant",
    grantUserRolesMultiple:
        "/api/v1/settings/permission/user/{profileId}/roles/grant/multiple",
    grantUserTeamRolesMultiple:
        "/api/v1/settings/permission/user/{profileId}/workspace/{workspaceId}/team/roles/grant/multiple",
    // PHÂN QUYỀN - THÀNH VIÊN TRONG NHÓM
    permissionGroupUserGetAll: "/api/v1/settings/permission/groups/",
    permissionGroupUserCreateOrUpdate: "/api/v1/settings/permission/groups/",
    permissionGroupUserAdd: "/api/v1/settings/permission/groups/",
    permissionGroupUserGetDetail: "/api/v1/settings/permission/groups/",
    permissionGroupUserDelete: "/api/v1/settings/permission/groups/",
    permissionGroupUserRemove:
        "/api/v1/settings/permission/user/{profileId}/roles/revoke",
    permissionGroupRemove: "/api/v1/settings/permission/groups/{groupId}",

    // PHÂN QUYỀN - THÀNH VIÊN
    permissionUserRolesGetAll: "/api/v1/settings/permission/user/",
    permissionUserRolesGrant: "/api/v1/settings/permission/user/",

    // LẤY DANH SÁCH MODULE QUYỀN
    permissionModuleGetAll: "/api/v1/settings/permission/module/getall",

    // LẤY DANH SÁCH THÀNH VIÊN THEO NHÓM QUYỀN
    permissionGroupMemberList:
        "/api/v1/settings/permission/groups/{groupId}/member/getlist",

    // LẤY DANH SÁCH WORKSPACE THEO NHÓM QUYỀN
    permissionGroupWorkspaceList:
        "/api/v1/settings/permission/groups/{groupId}/workspace/getlist",

    detailOrg: "/api/v2/organization/{orgId}",
    getInviteMemberQRCode: "/api/v2/organization/{orgId}/qrcode",
    uploadFile: "/api/v2/organization/file/upload",
    sendEmailInviteMember:
        "/api/v2/organization/members/invitations/send-email",
    googlesheetMappingGenerate:
        "/api/v2/lead/import/googlesheet/mappinggenerator",
    googlesheetImport: "/api/v2/lead/import/googlesheet/import",
    exportLeads: "/api/v2/lead/export",
};

// Thêm các đường dẫn mới cho payment và wallet
const paymentPaths = {
    //data-enrichment
    getFillDataList: "/api/v1/data-enrichment/getlist",
    fillDataUpdateStatus: "/api/v1/data-enrichment/",

    // Gói nạp coin
    creditPackages: "/api/v1/packages/credit/getlistpaging",
    creditPackageDetail: "/api/v1/packages/credit/",
    creditOrder: "/api/v1/transaction/credit/order",
    creditOrderDetail: "/api/v1/transaction/credit/getorder/",
    creditPayment: "/api/v1/transaction/credit/order/",
    creditOrderAndPayment: "/api/v1/transaction/credit/orderandpayment",
    creditHistory: "/api/v1/transaction/credithistory",

    // Gói chức năng
    featurePackages: "/api/v1/packages/feature/getlistpaging",
    featurePackageDetail: "/api/v1/packages/feature/",

    // Gói thuê bao
    subscriptionPackages: "/api/v1/packages/subscription/getlistpaging",
    subscriptionPackageDetail: "/api/v1/packages/subscription/",
    subscriptionUpgradeInfo: "/api/v1/subscription/upgrade/info",
    subscriptionUpgrade: "/api/v1/subscription/upgrade",
    subscriptionRenewInfo: "/api/v1/subscription/renew/info",
    subscriptionRenew: "/api/v1/subscription/renew",
    subscriptionIntro: "/api/v1/subscription/intro",
    subscriptionBuyMemberCheck: "/api/v1/subscription/user/buy/check",
    subscriptionBuyMember: "/api/v1/subscription/user/buy",

    // Gói chức năng và thuê bao chung
    packageOrder: "/api/v1/transaction/package/order",
    packagePayment: "/api/v1/transaction/package/order/",
    packageOrderAndPayment: "/api/v1/transaction/package/orderandpayment",

    // Ví
    walletHistory: "/api/v1/wallet/history",
    transactionHistory: "/api/v1/wallet/transaction",
    walletDetail: "/api/v1/wallet/getdetail",
    transactionDetail: `/api/v1/wallet/transaction/`,
    confirmTransaction: "/napas/",

    //callcenter
    callcenterPackage: "/api/v1/callcenter/active/info",
    callcenterActivePackage: "/api/v1/callcenter/active",
    callcenterUsageStatistics: "/api/v1/callcenter/getusagestatistics",
    callcenterRenewPackage: "/api/v1/callcenter/renew",
    callcenterRenewInfo: "/api/v1/callcenter/renew/info",
    callcenterSlotBuy: "/api/v1/callcenter/user/buy",
    callcenterSlotBuyCheck: "/api/v1/callcenter/user/buy/check",

    //function package
    functionPackage: "/api/v1/usage/package/getlist",
    functionPackageDetail: "/api/v1/usage/package/getdetail",

    orgWorkspaceCreate: "/api/v1/workspace/create",

    subscriptionDowngradeInfo: "/api/v1/subscription/downgrade/free/info",
    confirmSubscriptionDowngrade: "/api/v1/subscription/downgrade/free/confirm",
};

const callcenterPaths = {
    callcenterUsageStatistics: "/api/v1/package/getusagestatistics",
    callcenterMembers: "/api/v1/package/",
    callcenterTracking: "/api/v1/calltracking/int",
    callcenterUserLine: "/api/v1/user/line",
    callcenterLineList: "/api/v1/package/getlistline",
    //report
    callcenterReportHistory: "/api/v1/report/history",
    callcenterReportByDate: "/api/v1/report/calldurationsbydate",
    callcenterReportByDirection: "/api/v1/report/call/direction",
    callcenterReportByCredit: "/api/v1/report/call/credit",
    callcenterReportByProvider: "/api/v1/report/call/provider",
    callcenterRankByCredit: "/api/v1/report/user/rank/credit",
    callcenterRankByDuration: "/api/v1/report/user/rank/duration",
    callcenterRankByAnswer: "/api/v1/report/user/rank/answer",

    //callcampaign
    callcampaignList: "/api/v1/campaign/getlistpaging",
    callcampaignDetail: "/api/v1/campaign/",
    callcampaignCreate: "/api/v1/campaign/createv2",
    callcampaignUpdate: "/api/v1/campaign/",
    callcampaignUpdateStatus: "/api/v1/campaign/",
    callcampaignGetNextPhone: "/api/v1/campaign/",
    callcampaignUpdateContent: "/api/v1/campaign/",

    //report
    callcampaignReport: "/api/v1/report/campaign/",

    //contact
    callcampaignContact: "/api/v1/campaign/",
};

const pathsV2 = {
    //customer
    customersList: "/api/v2/customer/getlistpaging",
    leadsList: "/api/v2/lead/getlistpaging",
    leadsListV2: "/api/v2/lead/getlistpagingv2",
    dealsList: "/api/v2/deal/getlistpaging",
    customerDetail: "/api/v2/customer/{customerId}",
    customerJourneyList: "/api/v2/customer/{customerId}/journey/getlistpaging",
    leadJourneyList: "/api/v2/lead/{customerId}/journey/getlistpaging",
    readConversation: "/api/v2/chat/conversation/{conversationId}/read",
    leadDetail: "/api/v2/lead/{contactId}",
    dealDetail: "/api/v2/deal/{contactId}",
    customerRating: "/api/v2/lead/{customerId}/rating",
    categoryUtmSource: "/api/v2/category/utmsource/getlistpaging",
    customerTags: "/api/v2/category/tags/getlistpaging",
    customerCreate: "/api/v2/customer/create",
    leadCreate: "/api/v2/lead/create",
    dealStages: "/api/v2/category/stage/getall",
    convertToDeal: "/api/v2/lead/{id}/converttodeal",
    updateCustomerStage: "/api/v2/customer/{customerId}/stage",
    noteCustomer: "/api/v2/customer/{customerId}/journey/note",
    noteLead: "/api/v2/lead/{leadId}/journey/note",
    updateFlowStep: "/api/v2/deal/{id}/flow/step/update",
    rollbackFlowStep: "/api/v2/lead/{leadId}/flow/step/rollback",
    updateStage: "/api/v2/category/stage/{id}",
    updateStageIndex: "/api/v2/category/stage/index",
    createDeal: "/api/v2/deal/create",
    archiveCustomer: "/api/v2/customer/{customerId}/archive",
    archiveRestoreCustomer: "/api/v2/customer/{customerId}/archive/restore",
    deleteCustomer: "/api/v2/customer/{customerId}",
    archiveLead: "/api/v2/lead/{customerId}/archive",
    archiveRestoreLead: "/api/v2/lead/{customerId}/archive/restore",
    deleteLead: "/api/v2/lead/{customerId}",
    uploadAttachment: "/api/v2/lead/{leadId}/journey/attachments",
    uploadAttachmentCustomer:
        "/api/v2/customer/{customerId}/journey/attachments",
    editNote: "/api/v2/lead/{leadId}/journey/{journeyId}/note",
    deleteNote: "/api/v2/lead/{leadId}/journey/{journeyId}/note",
    customerDeleteNote:
        "/api/v2/customer/{customerId}/journey/{journeyId}/note",
    customerEditNote: "/api/v2/customer/{customerId}/journey/{journeyId}/note",
    channelStatus: "/api/v2/chat/channel-status",
    linkToLead: "/api/v2/chat/conversation/{conversationId}/link-to-lead",
    linkToCustomer:
        "/api/v2/chat/conversation/{conversationId}/link-to-customer",
    assignLead: "/api/v2/lead/{leadId}/assignto",
    assignCustomer: "/api/v2/customer/{customerId}/assignto",
    updateLeadField: "/api/v2/lead/{leadId}/update-field",
    updateCustomerField: "/api/v2/customer/{customerId}/update-field",
    updateLeadTags: "/api/v2/lead/{leadId}/tags",
    getUtmSourceList: `/api/v2/category/utmsource/getlistpaging`,
    createUtmSource: `/api/v2/category/utmsource`,
    getStageList: `/api/v2/category/stage/getall`,
    getDetailConversation: "/api/v2/chat/conversation/{conversationId}",
    updateLeadStep: "/api/v2/lead/{leadId}/flow/step/update",
    linkLeadToCustomer: "/api/v2/lead/{leadId}/customer-link",
    unlinkToCustomer:
        "/api/v2/chat/conversation/{conversationId}/unlink-customer",
    unlinkToLead: "/api/v2/chat/conversation/{conversationId}/unlink-lead",
    unlinkLeadToCustomer: "/api/v2/lead/{leadId}/unlink-customer",
    deleteZaloformApi: "/api/v2/lead/integration/zalo/{formId}",
    getFacebookMessageConnectionApi:
        "/api/v2/auth/facebook/messages/connections",
    connectFacebookMessageApi: "/api/v2/integration/auth/facebook/message",
    connectFacebookLeadApi: "/api/v2/integration/auth/facebook/lead",
    getTiktokAccountsApi: "/api/v2/auth/tiktok/lead/connections",
    deleteAttachment: "/api/v2/lead/{leadId}/journey/{journeyId}/attachment",
    updateLeadAvatar: "/api/v2/lead/{leadId}/avatar",
    createTag: "/api/v2/category/tags/create",
    updateLeadAssignee: "/api/v2/lead/{leadId}/assignto",
    updateLeadFollower: "/api/v2/lead/{leadId}/follow",
    bulkArchiveLead: "/api/v2/lead/archive",
    bulkArchiveRestoreLead: "/api/v2/lead/archive/restore",
    bulkDeleteLead: "/api/v2/lead/bulk",
    sendEmail: "/api/v2/email/send",
    deleteTag: "/api/v2/category/tags/{id}",
};

const connectionPaths = {
    getZaloMessageConnectionApi: "/api/v2/auth/zalo/message/connections",
    deleteZaloformApi: "/api/v2/lead/integration/zalo/{formId}",
    connectZaloformApi: "/api/v2/lead/integration/zalo/connect",
    getFacebookMessageConnectionApi:
        "/api/v2/auth/facebook/messages/connections",
    connectFacebookMessageApi: "/api/v2/integration/auth/facebook/message",
    connectFacebookLeadApi: "/api/v2/integration/auth/facebook/lead",
    connectFacebookFeedApi: "/api/v2/integration/auth/facebook/feed",
    getTiktokAccountsApi: "/api/v2/auth/tiktok/lead/connections",
    getLeadListApi: "/api/v2/auth/facebook/lead/connections",
    getFacebookFeedListApi: "/api/v2/auth/facebook/feed/connections",
    autoMappingZaloApi: "/api/v2/lead/integration/zalo/mappinggenerator",
    getWebformListApi: "/api/v2/lead/integration/website/getlistpaging",
    deleteWebformApi: "/api/v2/lead/integration/website/{websiteId}",
    getZaloformListApi: "/api/v2/lead/integration/zalo/getlistpaging",
    updateStatusZaloformApi: "/api/v2/lead/integration/zalo/{formId}/status",
    addWebformApi: "/api/v2/lead/integration/website/create",
    verifyWebformApi: "/api/v2/lead/integration/website/{websiteId}/verify",
    updateStatusWebformApi:
        "/api/v2/lead/integration/website/{websiteId}/status",
    fbLeadConnectApi: "/api/v2/public/integration/auth/facebook/lead",
    zaloLeadConnectApi: "/api/v2/public/integration/auth/zalo/lead",
    updateLeadStatusApi: "/api/v2/lead/integration/{connectionId}/status",
    deleteLeadApi: "/api/v2/lead/integration/{connectionId}",
    fbConnectPageApi: "/api/v1/auth/facebook/lead/manual",

    // Tiktok Form
    tiktokLeadAuthApi: "/api/v1/integration/tiktok/auth/lead",
    getTiktokFormListApi: "/api/v2/lead/integration/tiktok/getlist",
    getTiktokFormListConnectedApi:
        "/api/v2/lead/integration/tiktok/getlistconnected",
    getTiktokFormDetailApi: "/api/v2/lead/integration/tiktok/{id}",
    createTiktokFormApi: "/api/v2/lead/integration/tiktok/create",
    updateTiktokFormApi: "/api/v1/integration/tiktok/form/",
    updateTiktokFormStatusApi:
        "/api/v2/lead/integration/tiktok/{formId}/status",
    deleteTiktokFormApi: "/api/v2/lead/integration/tiktok/{formId}",

    // Webhook
    webhookApi: "/api/v2/lead/integration/webhook/",
    updateFacebookConnectStatus:
        "/api/v2/auth/facebook/connections/{connectionId}/status",
    deleteFacebookConnect: "/api/v2/auth/facebook/connections/{connectionId}",
    chatList:
        "/api/v2/chat/conversation/{conversationId}/message/getlistpaging",
    sendFbMessage: "/api/v2/chat/conversation/{conversationId}/message/send",
    deleteZaloMessageConnection: "/api/v2/auth/zalo/connections/{connectionId}",
    updateZaloMessageConnection:
        "/api/v2/auth/zalo/connections/{connectionId}/status",
    getAllLeadConnectionApi: "/api/v2/lead/integration/connections",
    getZaloLeadConnectionApi: "/api/v2/auth/zalo/lead/connections",
    getDetailZaloFormApi: "/api/v2/lead/integration/zalo/{formId}",
    updateZaloFormApi: "/api/v2/lead/integration/zalo/{formId}",
    getChatBotListApi: "/api/v2/integration/chatbot/getlistpaging",
    updateStatusChatbotApi: "/api/v2/integration/chatbot/{chatbotId}/status",
    updateChatBotApi: "/api/v2/integration/chatbot/{chatbotId}",
    createChatBotApi: "/api/v2/integration/chatbot/create",
    deleteChatBotApi: "/api/v2/integration/chatbot/{chatbotId}",
};

const teamPathsV2 = {
    getTeamMemberships: "/api/v2/team/{teamId}/memberships",
    getTeams: "/api/v2/team/getlistpaging",
    getAllTeams: "/api/v2/organization/member/teams/all",
    getTeamList: "/api/v2/team/treeview",
    createTeam: "/api/v2/team/create",
    deleteTeam: "/api/v2/team/{teamId}",
    updateTeam: "/api/v2/team/{teamId}",
    getMember: "/api/v2/crm/team/{teamId}/members",
    getAvailableMembers: "/api/v2/team/{teamId}/available-members",
    addMemberToTeam: "/api/v2/team/{teamId}/member/add",
    deleteManagerFromTeam: "/api/v2/team/{teamId}/manager/{profileId}",
    deleteMemberFromTeam: "/api/v2/team/{teamId}/member/{profileId}",
    updateTeamMemberRole: "/api/v2/team/{teamId}/member/{profileId}/role",
    updateManagerInTeam: "/api/v2/team/{teamId}/manager/add",
};

const productPaths = {
    product: "/api/v1/product",
    customerProduct: "/api/v1/customerProduct",
    order: "/api/v1/order",
    getOrderDetailWithProduct: "/api/v1/order/getOrderDetailWithProduct/{id}",
    category: "/api/v1/category",
};

const customSidebarMenuPaths = {
    getTree: "/api/CustomSidebarMenu/tree",
    updateTree: "/api/CustomSidebarMenu/quick-update-batch",
    resetToDefault: "/api/CustomSidebarMenu/reset-to-defaults",
};

const configPaths = {
    config: "/api/v1/Config",
};

const businessProcessPaths = {
    businessProcessStage: "/api/v1/businessprocessstage",
    getBusinessProcessStage:
        "/api/v1/BusinessProcessStage/workspace/{workspaceId}",
    createBusinessProcessStageFromTemplate:
        "/api/v1/BusinessProcessStage/workspace/{workspaceId}/create-stages",
    businessProcessTask: "/api/v1/businessprocesstask",
    businessProcessTemplate: "/api/v1/businessprocesstemplate",
    linkOrder: "/api/v1/businessprocesstask/{taskId}/link-order",
    businessProcess: "/api/v1/businessprocess",
    createBusinessProcessWos: "/api/v1/BusinessProcess/wos",
    businessProcessTaskById: "/api/v1/BusinessProcessTask/{taskId}",
    moveBusinessProcessTask: "/api/v1/BusinessProcessTask/{taskId}/move",
    updateBusinessProcessStageName:
        "/api/v1/BusinessProcessStage/{stageId}/name",
    updateBusinessProcessStageIndex:
        "/api/v1/BusinessProcessStage/workspace/{workspaceId}/order-by-index",
    deleteBusinessProcessStage: "/api/v1/BusinessProcessStage/{stageId}/delete",
    getTaskJourney: "/api/v1/BusinessProcessTask/{taskId}/notes-simple",
    createNote: "/api/v1/BusinessProcessTask/{taskId}/journeys",
    updateBusinessProcessTaskStatus:
        "/api/v1/BusinessProcessTask/{taskId}/status",
    rollbackBusinessProcessTask:
        "/api/v1/BusinessProcessTask/{taskId}/rollback",
    getBusinessProcessTags: "/api/v1/BusinessProcessTag",
    createBusinessProcessTag: "/api/v1/BusinessProcessTag",
    deleteBusinessProcessTag: "/api/v1/BusinessProcessTag/{tagId}",
    updateBusinessProcessTaskTags: "/api/v1/TaskTag/{taskId}/tags",
    updateBusinessProcessTaskAssignees:
        "/api/v1/BusinessProcessTask/{taskId}/assignee",
    archieveBusinessProcessTask: "/api/v1/BusinessProcessTask/{taskId}/archive",
    unarchieveBusinessProcessTask:
        "/api/v1/BusinessProcessTask/{taskId}/unarchive",
    duplicateBusinessProcessTask:
        "/api/v1/BusinessProcessTask/{taskId}/duplicate",
    deleteBusinessProcessTask: "/api/v1/BusinessProcessTask/{taskId}",
    partialUpdateBusinessProcessTask: "/api/v1/BusinessProcessTask/{taskId}",
    searchTask: "/api/v1/BusinessProcessTask/search",
    linkConversationToTask: "/api/v1/BusinessProcessTask/link-conversation",
    batchMoveStage: "/api/v1/BusinessProcessTask/batch/move",
    batchArchiveTask: "/api/v1/BusinessProcessTask/batch/archive",
    batchUnarchiveTask: "/api/v1/BusinessProcessTask/batch/unarchive",
    batchDeleteTask: "/api/v1/BusinessProcessTask/batch/delete",
    getTasksAdvanced: "/api/v1/BusinessProcessTask/advanced",
    editNote: "/api/v1/BusinessProcessTask/{taskId}/journeys/{journeyId}",
    deleteNote: "/api/v1/BusinessProcessTask/{taskId}/journeys/{journeyId}",
    createBatchStage:
        "/api/v1/BusinessProcessStage/workspace/{workspaceId}/batch-create",
    deleteBatchStage:
        "/api/v1/BusinessProcessStage/workspace/{workspaceId}/batch-delete",
    updateBatchStageName:
        "/api/v1/BusinessProcessStage/workspace/{workspaceId}/batch-name",
    updateBatchStageColor:
        "/api/v1/BusinessProcessStage/workspace/{workspaceId}/color",
};

const memberPathsV2 = {
    //MỜI THÀNH VIÊN - V2
    searchMembers: "/api/v2/organization/members/search",
    acceptRequest: "/api/v2/organization/members/requests/{requestId}/accept",
    rejectRequest: "/api/v2/organization/members/requests/{requestId}/reject",
    getInvitationList: "/api/v2/organization/members/invitations",
    inviteMembers: "/api/v2/organization/members/invitations",
    cancelInvitation: "/api/v2/organization/members/invitations/{inviteId}/",

    //GỬI YÊU CẦU XIN GIA NHẬP TỔ CHỨC - V2
    searchOrganization: "/api/v2/organization/search",
    acceptInvitation:
        "/api/v2/organization/members/invitations/{inviteId}/accept",
    rejectInvitation:
        "/api/v2/organization/members/invitations/{inviteId}/reject",
    getRequestList: "/api/v2/organization/members/join-requests",
    sendRequest: "/api/v2/organization/members/join-requests",
    cancelRequest: "/api/v2/organization/members/join-requests/{requestId}",
};

const automationPathsV2 = {
    createEvictionRule: "/api/v2/automation/eviction-rules/create",
    getEvictionRuleList: "/api/v2/automation/eviction-rules/getlistpaging",
    updateEvictionRule: "/api/v2/automation/eviction-rules/{ruleId}",
    deleteEvictionRule: "/api/v2/automation/eviction-rules/{ruleId}",
    updateStatusEvictionRule:
        "/api/v2/automation/eviction-rules/{ruleId}/status",
    getDetailEvictionRule: "/api/v2/automation/eviction-rules/{ruleId}",

    getAssignRatioList: "/api/v2/automation/routing-rules/getlistpaging",
    createAssignRatio: "/api/v2/automation/routing-rules/create",
    updateAssignRatio: "/api/v2/automation/routing-rules/{ruleId}",
    deleteAssignRatio: "/api/v2/automation/routing-rules/{ruleId}",
    getDetailAssignRatio: "/api/v2/automation/routing-rules/{ruleId}",
    updateStatusAssignRatio: "/api/v2/automation/routing-rules/{ruleId}/status",

    updateDistributionTarget:
        "/api/v2/automation/routing-rules/{routingId}/targets/bulk",
    getAllRules: "/api/v2/automation/rules/all",
};

const emailPaths = {
    updateEmail: "/api/v2/integration/email/{configId}/update",
    getEmailList: "/api/v2/integration/email",
    getEmailDetail: "/api/v2/integration/email/{configId}",
    deleteEmail: "/api/v2/integration/email/{configId}",
    createEmail: "/api/v2/integration/email/create",
    // createEmail: "/api/integration/email/create",
    getEmailTemplateList: "/api/v2/integration/email/templates",
    getEmailTemplateDetail: "/api/v2/integration/email/template/{templateId}",
    createEmailTemplate: "/api/v2/integration/email/template/create",
    updateEmailTemplate:
        "/api/v2/integration/email/template/{templateId}/update",
    updateStatusEmailTemplate:
        "/api/v2/integration/email/template/{templateId}/status",
    deleteEmailTemplate: "/api/v2/integration/email/template/{templateId}",
    updateEmailTemplateBody:
        "/api/v2/integration/email/template/{templateId}/body",
    updateEmailTemplateSubject:
        "/api/v2/integration/email/template/{templateId}/subject",
    sendEmail: "/api/v2/email/send",
    getRealVariable: "/api/v2/email/variable",
    getTemplateIncludeVariable: "/api/v2/email/template/{templateId}/generate",
    getEmailById: "/api/v2/email/view/{id}",
    getEmailVariablesWithValue: "/api/v2/email/variables",
};

const n8nPaths = {
    rewriteEmail: "/webhook/rewrite-email-use-ai",
    writeWithAI: "/webhook/write-with-ai",
    summaryEmailByAi: "/webhook/summary-email-by-ai",
};

const variablePaths = {
    leadVariables: "/json/lead.json",
    customerVariables: "/json/contact.json",
};

const socialPaths = {
    postsCreate: "/api/v1/Post",
    postsList: "/api/v1/Post",
    postsDetail: "/api/v1/Post/{id}",
    postsUpdate: "/api/v1/Post/{id}",
    postsDelete: "/api/v1/Post/{id}",
    postsAutoComments: "/api/v1/Post/{id}/auto-comments",
    postsComments: "/api/v1/Post/{id}/comments",
    postsVersions: "/api/v1/Post/{id}/versions",
    campaignsCreate: "/api/v1/Campaign",
    campaignsList: "/api/v1/Campaign",
    campaignsDetail: "/api/v1/Campaign/{id}",
    campaignsUpdate: "/api/v1/Campaign/{id}",
    campaignsDelete: "/api/v1/Campaign/{id}",
    channelsCreate: "/api/v1/Channel",
    channelsList: "/api/v1/Channel",
    channelsDetail: "/api/v1/Channel/{id}",
    channelsUpdate: "/api/v1/Channel/{id}",
    channelsDelete: "/api/v1/Channel/{id}",
    ideasCreate: "/api/v1/Idea",
    ideasList: "/api/v1/Idea",
    ideasDetail: "/api/v1/Idea/{id}",
    ideasUpdate: "/api/v1/Idea/{id}",
    ideasDelete: "/api/v1/Idea/{id}",
    labelsCreate: "/api/v1/Label",
    labelsList: "/api/v1/Label",
    labelsDetail: "/api/v1/Label/{id}",
    labelsUpdate: "/api/v1/Label/{id}",
    labelsDelete: "/api/v1/Label/{id}",
    hashtagsList: "/api/v1/Hashtag",
    hashtagsCreate: "/api/v1/Hashtag",
    hashtagsDetail: "/api/v1/Hashtag/{id}",
    hashtagsUpdate: "/api/v1/Hashtag/{id}",
    hashtagsDelete: "/api/v1/Hashtag/{id}",
    getFacebookSyncConfig: "/api/v1/FacebookSyncConfig",
    createFacebookSyncConfig: "/api/v1/FacebookSyncConfig",
    updateFacebookSyncConfig: "/api/v1/FacebookSyncConfig/{id}",
    activeFacebookSyncConfig: "/api/v1/FacebookSyncConfig/{id}/active",
    replyComment: "/api/v1/Post/reply-comment",
    getStatistics: "/api/v1/Post/statistics",
    createAutoComment: "/api/v1/auto-comments",
    getAutoCommentList: "/api/v1/auto-comments",
    getAutoCommentDetail: "/api/v1/auto-comments/{id}",
    updateAutoComment: "/api/v1/auto-comments/{id}",
    deleteAutoComment: "/api/v1/auto-comments/{id}",
    getAutoCommentStats: "/api/v1/auto-comments/stats",
    syncPost: "/api/v1/FacebookSyncConfig/{id}/sync-posts",
    postToday: "/api/v1/post/today-scheduled",
    postStatisticsMonthly: "/api/v1/post/statistics/monthly-weekly",
    getPostPermission: "/api/v1/post-permissions",
    getUserPostPermission: "/api/v1/post-permissions/user/{userId}",
    createPostPermission: "/api/v1/post-permissions",
    updatePostPermission: "/api/v1/post-permissions/{id}",
    updateUserPostPermissionRole: "/api/v1/post-permissions/user/{userId}/role",
    updateUserPostPermissionChannel:
        "/api/v1/post-permissions/user/{userId}/channels",
    deleteUserPostPermission: "/api/v1/post-permissions/user/{userId}",
    getPostPermissionRoles: "/api/v1/post-permissions/roles",
    checkPermissionPost: "/api/v1/post-permissions/check",
    postToFacebook: "/api/v1/Facebook/publish/{postId}",
    checkPagePermission: "/api/v1/FacebookPermission/check-permissions",
};

const capiPaths = {
    getAllDataset: "/api/v2/facebook-capi/dataset/all",
    getDetailDataset: "/api/v2/facebook-capi/dataset/{datasetId}",
    getDatasetEvent: "/api/v2/facebook-capi/events",
    createDataset: "/api/v2/facebook-capi/dataset",
    updateDataset: "/api/v2/facebook-capi/dataset/{datasetId}",
    updateDatasetAccessToken:
        "/api/v2/facebook-capi/dataset/{datasetId}/accesstoken",
    deleteDataset: "/api/v2/facebook-capi/dataset/{datasetId}",
    updateDatasetStatus: "/api/v2/facebook-capi/dataset/{datasetId}/status",
    activateDatasetOnDeal:
        "/api/v2/facebook-capi/dataset/{datasetId}/deal/status",
    activateDatasetOnLead:
        "/api/v2/facebook-capi/dataset/{datasetId}/lead/status",
    getWorkspaceConfigDetail:
        "/api/v2/facebook-capi/dataset/{datasetId}/workspace/{workspaceId}",
    deleteWorkspaceConfig:
        "/api/v2/facebook-capi/dataset/{datasetId}/workspace/{workspaceId}",
    getDatasetWorkspaces:
        "/api/v2/facebook-capi/dataset/{datasetId}/workspaces",
    createWorkspaceConfig: "/api/v2/facebook-capi/dataset/workspace",
    mappingDatasetEvents: "/api/v2/facebook-capi/dataset/events",
    deleteMappingDatasetEvents: "/api/v2/facebook-capi/events/{eventId}",
    getMappingDatasetEvents: "/api/v2/facebook-capi/events/{eventId}",
    datasetForWorkspace: "/api/v2/facebook-capi/dataset/{datasetId}/workspaces",
    getAllDatasetEvents: "/api/v2/facebook-capi/dataset/workspaces/getall",
    deleteEvent:
        "/api/v2/facebook-capi/dataset/{datasetId}/workspace/{workspaceId}/events/{eventId}",
    deleteAllEvents:
        "/api/v2/facebook-capi/dataset/{datasetId}/workspace/{workspaceId}/events/delete-all",
    resetEvents:
        "/api/v2/facebook-capi/dataset/{datasetId}/workspace/{workspaceId}/events/reset",
};

// Type definition for path objects
type PathsObject = Record<string, string>;

// Chỉ áp dụng apiBase cho các đường dẫn không phải inventory
for (const path in paths) {
    if (
        !path.startsWith("inventory") &&
        !path.startsWith("block") &&
        !path.startsWith("product")
    ) {
        (paths as PathsObject)[path] = apiBase + (paths as PathsObject)[path];
    } else {
        (paths as PathsObject)[path] =
            inventoryApiBase + (paths as PathsObject)[path];
    }
}
for (const path in callcenterPaths) {
    (callcenterPaths as PathsObject)[path] =
        callcenterApiBase + (callcenterPaths as PathsObject)[path];
}

for (const path in paymentPaths) {
    (paymentPaths as PathsObject)[path] =
        paymentApiBase + (paymentPaths as PathsObject)[path];
}
for (const path in productPaths) {
    (productPaths as PathsObject)[path] =
        productApiBase + (productPaths as PathsObject)[path];
}
for (const path in pathsV2) {
    (pathsV2 as PathsObject)[path] = apiBase + (pathsV2 as PathsObject)[path];
}
for (const path in businessProcessPaths) {
    (businessProcessPaths as PathsObject)[path] =
        productApiBase + (businessProcessPaths as PathsObject)[path];
}
for (const path in configPaths) {
    (configPaths as PathsObject)[path] =
        productApiBase + (configPaths as PathsObject)[path];
}
for (const path in connectionPaths) {
    (connectionPaths as PathsObject)[path] =
        apiBase + (connectionPaths as PathsObject)[path];
}
for (const path in memberPathsV2) {
    (memberPathsV2 as PathsObject)[path] =
        apiBase + (memberPathsV2 as PathsObject)[path];
}
for (const path in customSidebarMenuPaths) {
    (customSidebarMenuPaths as PathsObject)[path] =
        productApiBase + (customSidebarMenuPaths as PathsObject)[path];
}
for (const path in teamPathsV2) {
    (teamPathsV2 as PathsObject)[path] =
        apiBase + (teamPathsV2 as PathsObject)[path];
}
for (const path in automationPathsV2) {
    (automationPathsV2 as PathsObject)[path] =
        apiBase + (automationPathsV2 as PathsObject)[path];
}
for (const path in emailPaths) {
    (emailPaths as PathsObject)[path] =
        apiBase + (emailPaths as PathsObject)[path];
}

for (const path in n8nPaths) {
    (n8nPaths as PathsObject)[path] =
        n8nApiBase + (n8nPaths as PathsObject)[path];
}

for (const path in variablePaths) {
    (variablePaths as PathsObject)[path] =
        apiBase + (variablePaths as PathsObject)[path];
}

for (const path in socialPaths) {
    (socialPaths as PathsObject)[path] =
        productApiBase + (socialPaths as PathsObject)[path];
}

for (const path in capiPaths) {
    (capiPaths as PathsObject)[path] =
        apiBase + (capiPaths as PathsObject)[path];
}

export {
    paymentPaths,
    callcenterPaths,
    pathsV2,
    paths,
    productPaths,
    businessProcessPaths,
    configPaths,
    connectionPaths,
    memberPathsV2,
    customSidebarMenuPaths,
    teamPathsV2,
    automationPathsV2,
    emailPaths,
    n8nPaths,
    variablePaths,
    socialPaths,
    capiPaths,
};
export default paths;
