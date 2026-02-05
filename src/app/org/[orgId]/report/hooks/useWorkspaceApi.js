"use client";

import { useState, useCallback } from "react";
import { getWorkspaceList, getWorkspaceDetail } from "@/api/workspace";
import toast from "react-hot-toast";

export function useWorkspaceApi(orgId) {
  const [isLoading, setIsLoading] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);

  // Lấy danh sách workspace
  const fetchWorkspaceList = useCallback(async () => {
    if (!orgId) return [];

    try {
      setIsLoading(true);
      const response = await getWorkspaceList(orgId);
      setIsLoading(false);

      if (response?.code !== 0) {
        console.error("Error fetching workspace list:", response?.message);
        return [];
      }

      const workspaceList = response?.content || [];
      setWorkspaces(workspaceList);
      return workspaceList;
    } catch (error) {
      console.error("Error fetching workspace list:", error);
      setIsLoading(false);
      return [];
    }
  }, [orgId]);

  // Lấy thông tin chi tiết của một workspace
  const fetchWorkspaceDetail = useCallback(
    async (workspaceId) => {
      if (!orgId || !workspaceId) return null;

      try {
        setIsLoading(true);
        const response = await getWorkspaceDetail(orgId, workspaceId);
        setIsLoading(false);

        if (response?.code !== 0) {
          console.error("Error fetching workspace detail:", response?.message);
          return null;
        }

        return response.content;
      } catch (error) {
        console.error("Error fetching workspace detail:", error);
        setIsLoading(false);
        return null;
      }
    },
    [orgId]
  );

  // Lấy thông tin chi tiết cho nhiều workspace
  const fetchWorkspaceDetails = useCallback(
    async (workspaceIds) => {
      if (!orgId || !workspaceIds || workspaceIds.length === 0) return [];

      try {
        setIsLoading(true);

        // Lấy danh sách workspace nếu chưa có
        const currentWorkspaces =
          workspaces.length > 0 ? workspaces : await fetchWorkspaceList();

        // Tìm các workspace đã có trong danh sách
        const foundWorkspaces = workspaceIds.map(
          (id) => currentWorkspaces.find((ws) => ws.id === id) || { id }
        );

        // Tìm các workspace chưa có thông tin chi tiết
        const missingWorkspaceIds = foundWorkspaces
          .filter((ws) => Object.keys(ws).length <= 1)
          .map((ws) => ws.id);

        // Lấy thông tin chi tiết cho các workspace còn thiếu
        const detailPromises = missingWorkspaceIds.map((id) =>
          fetchWorkspaceDetail(id)
        );

        const details = await Promise.all(detailPromises);

        // Kết hợp kết quả
        const result = foundWorkspaces.map((ws) => {
          if (Object.keys(ws).length > 1) return ws;

          const detail = details.find((d) => d && d.id === ws.id);
          return (
            detail || { id: ws.id, name: `Workspace ${ws.id.substring(0, 8)}` }
          );
        });

        setIsLoading(false);
        return result;
      } catch (error) {
        console.error("Error fetching workspace details:", error);
        setIsLoading(false);
        return workspaceIds.map((id) => ({
          id,
          name: `Workspace ${id.substring(0, 8)}`,
        }));
      }
    },
    [orgId, workspaces, fetchWorkspaceList, fetchWorkspaceDetail]
  );

  return {
    isLoading,
    workspaces,
    fetchWorkspaceList,
    fetchWorkspaceDetail,
    fetchWorkspaceDetails,
  };
}
