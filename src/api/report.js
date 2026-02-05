import paths from "@/lib/authConstants";
import qs from "qs";

export async function getSummaryData(
    orgId,
    workspaceId,
    startDate,
    endDate,
    profileIds,
    teamIds
) {
    try {
        const res = await fetch(
            `${paths.reportSummary}?${qs.stringify({
                workspaceId,
                startDate,
                endDate,
                profileIds,
                teamIds,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getStatisticsByUtmSource(
    orgId,
    workspaceId,
    startDate,
    endDate,
    profileIds,
    teamIds
) {
    try {
        const res = await fetch(
            `${paths.statisticsByUtmSource}?${qs.stringify({
                workspaceId,
                startDate,
                endDate,
                profileIds,
                teamIds,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}
export async function getStatisticsByDataSource(
    orgId,
    workspaceId,
    startDate,
    endDate,
    profileIds,
    teamIds
) {
    try {
        const res = await fetch(
            `${paths.statisticsByDataSource}?${qs.stringify({
                workspaceId,
                startDate,
                endDate,
                profileIds,
                teamIds,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}
export async function getStatisticsByTag(
    orgId,
    workspaceId,
    startDate,
    endDate,
    profileIds,
    teamIds
) {
    try {
        const res = await fetch(
            `${paths.statisticsByTag}?${qs.stringify({
                workspaceId,
                startDate,
                endDate,
                profileIds,
                teamIds,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}
export async function getChartByOverTime(
    orgId,
    workspaceId,
    startDate,
    endDate,
    type,
    profileIds,
    teamIds
) {
    try {
        const res = await fetch(
            `${paths.customerChartByOvertime}?${qs.stringify({
                workspaceId,
                startDate,
                endDate,
                type,
                profileIds,
                teamIds,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}
export async function getChartByRating(
    orgId,
    workspaceId,
    startDate,
    endDate,
    profileIds,
    teamIds
) {
    try {
        const res = await fetch(
            `${paths.customerChartByRating}?${qs.stringify({
                workspaceId,
                startDate,
                endDate,
                profileIds,
                teamIds,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}
export async function getStatisticsByUser(
    orgId,
    workspaceId,
    startDate,
    endDate,
    profileIds,
    teamIds
) {
    try {
        const res = await fetch(
            `${paths.statisticsByUser}?${qs.stringify({
                workspaceId,
                startDate,
                endDate,
                profileIds,
                teamIds,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getStatisticsByStageGroup(
    orgId,
    workspaceId,
    searchText,
    stageGroupId,
    startDate,
    endDate,
    categoryList,
    sourceList,
    rating,
    stage,
    tags,
    assignTo,
    teamId
) {
    try {
        const res = await fetch(
            `${paths.statisticsByStageGroup}?${qs.stringify({
                workspaceId,
                searchText,
                stageGroupId,
                startDate,
                endDate,
                categoryList,
                sourceList,
                rating,
                stage,
                tags,
                assignTo,
                teamId,
                limit: 9999,
            })}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.log(error);
    }
}

export async function getCustomStatistics(
    orgId,
    workspaceId,
    startDate,
    endDate,
    searchText,
    assignTo,
    stageGroupId,
    categoryList,
    sourceList,
    rating,
    stage,
    tags,
    teamId
) {
    try {
        const params = {
            workspaceId,
            StartDate: startDate,
            EndDate: endDate,
            SearchText: searchText,
            assignTo,
            stageGroupId,
            categoryList,
            sourceList,
            rating,
            stage,
            tags,
            teamId,
        };

        const res = await fetch(
            `${
                paths.apiBase
            }/api/v1/report/contact/getcustomstatistics?${qs.stringify(
                params
            )}`,
            {
                headers: {
                    organizationId: orgId,
                    workspaceId: workspaceId,
                    accept: "*/*",
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${localStorage.getItem(
                        "accessToken"
                    )}`,
                },
            }
        );
        const dataJson = await res.json();
        return dataJson;
    } catch (error) {
        console.error("Lỗi khi lấy dữ liệu thống kê tùy chỉnh:", error);
        throw error;
    }
}
