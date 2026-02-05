"use client";
import { startOfDay, endOfDay, addDays, format, startOfYear } from "date-fns";
import { vi } from "date-fns/locale";

// Chuyển đổi dateSelect sang định dạng server
export const dateSelectToServerFormat = (dateSelect) => {
  if (!dateSelect) return null;

  switch (dateSelect) {
    case "0":
      return "TODAY";
    case "-1":
      return "YESTERDAY";
    case "-7":
      return "LAST7DAYS";
    case "-30":
      return "LAST30DAYS";
    case "thisyear":
      return "THISYEAR";
    default:
      return null;
  }
};

// Chuyển đổi định dạng server sang dateSelect
export const serverFormatToDateSelect = (serverFormat) => {
  if (!serverFormat) return null;

  switch (serverFormat) {
    case "TODAY":
      return "0";
    case "YESTERDAY":
      return "-1";
    case "LAST7DAYS":
      return "-7";
    case "LAST30DAYS":
      return "-30";
    case "THISYEAR":
      return "thisyear";
    default:
      return null;
  }
};

// Tạo đối tượng date từ dateSelect
export const dateSelectToDateObject = (dateSelect) => {
  if (!dateSelect) return null;

  switch (dateSelect) {
    case "0":
      return {
        from: startOfDay(new Date()),
        to: endOfDay(new Date()),
      };
    case "-1":
      return {
        from: startOfDay(addDays(new Date(), -1)),
        to: endOfDay(addDays(new Date(), -1)),
      };
    case "-7":
      return {
        from: startOfDay(addDays(new Date(), -7)),
        to: endOfDay(new Date()),
      };
    case "-30":
      return {
        from: startOfDay(addDays(new Date(), -30)),
        to: endOfDay(new Date()),
      };
    case "thisyear":
      return {
        from: startOfYear(new Date()),
        to: endOfDay(new Date()),
      };
    default:
      if (dateSelect.match(/^-\d+$/)) {
        // Nếu là số âm (vd: -14, -60, v.v.)
        const days = parseInt(dateSelect);
        return {
          from: startOfDay(addDays(new Date(), days)),
          to: endOfDay(new Date()),
        };
      }
      return null;
  }
};

// Định dạng ngày tháng theo locale Việt Nam
export const formatDateVN = (date) => {
  if (!date) return "";
  return format(new Date(date), "dd/MM/yyyy", { locale: vi });
};

// Định dạng ngày tháng cho API
export const formatDateForApi = (date) => {
  if (!date) return "";
  return format(new Date(date), "yyyy-MM-dd");
};

// Trích xuất điều kiện thời gian từ cấu hình báo cáo
export const extractTimeConditionsFromConfig = (reportConfig) => {
  if (
    !reportConfig ||
    !reportConfig.condition ||
    !reportConfig.condition.conditions
  ) {
    return [];
  }

  const dateConditions = [];

  reportConfig.condition.conditions.forEach((mainCondition) => {
    if (mainCondition.conditions) {
      const conditions = mainCondition.conditions.filter(
        (c) => c.columnName === "CreatedDate"
      );
      if (conditions.length > 0) {
        dateConditions.push(...conditions);
      }
    }
  });

  return dateConditions;
};

// Cập nhật điều kiện thời gian trong cấu hình báo cáo
export const updateTimeConditionsInConfig = (reportConfig, timeConditions) => {
  if (
    !reportConfig ||
    !reportConfig.condition ||
    !reportConfig.condition.conditions
  ) {
    return reportConfig;
  }

  const updatedConfig = { ...reportConfig };

  updatedConfig.condition.conditions.forEach((mainCondition) => {
    if (mainCondition.conditions) {
      // Xóa các điều kiện thời gian cũ
      const dateConditionIndices = [];
      mainCondition.conditions.forEach((cond, idx) => {
        if (cond.columnName === "CreatedDate") {
          dateConditionIndices.unshift(idx);
        }
      });

      dateConditionIndices.forEach((idx) => {
        mainCondition.conditions.splice(idx, 1);
      });

      // Thêm các điều kiện thời gian mới
      if (timeConditions && timeConditions.length > 0) {
        mainCondition.conditions.push(...timeConditions);
      }
    }
  });

  return updatedConfig;
};

// Kiểm tra nếu hai điều kiện thời gian giống nhau
export const areTimeConditionsEqual = (conditions1, conditions2) => {
  if (!conditions1 || !conditions2) return false;
  if (conditions1.length !== conditions2.length) return false;

  // Sắp xếp để đảm bảo thứ tự không ảnh hưởng đến kết quả so sánh
  const sorted1 = [...conditions1].sort((a, b) =>
    `${a.columnName}${a.operator}${a.value}`.localeCompare(
      `${b.columnName}${b.operator}${b.value}`
    )
  );

  const sorted2 = [...conditions2].sort((a, b) =>
    `${a.columnName}${a.operator}${a.value}`.localeCompare(
      `${b.columnName}${b.operator}${b.value}`
    )
  );

  return JSON.stringify(sorted1) === JSON.stringify(sorted2);
};

// Map cho các component báo cáo
export const CARD_COMPONENTS = {
  ReportCard0: "ReportCard0",
  ReportCard1: "ReportCard1",
  ReportCard2: "ReportCard2",
  ReportCard3: "ReportCard3",
  ReportCard5: "ReportCard5",
  ReportCard6: "ReportCard6",
};

// Tạo bố cục mặc định
export const DEFAULT_REPORT_LAYOUT = [
  { id: "card0", name: "Thông tin tổng quan", component: "ReportCard0" },
  { id: "card2", name: "Phân loại khách hàng", component: "ReportCard2" },
  { id: "card6", name: "Đánh giá khách hàng", component: "ReportCard6" },
  { id: "card3", name: "Biểu đồ trạng thái khách hàng", component: "ReportCard3" },
  { id: "card1", name: "Trạng thái khách hàng", component: "ReportCard1" },
  { id: "card5", name: "Bảng xếp hạng nhân viên kinh doanh", component: "ReportCard5" },
  { id: "pivot", name: "Biểu đồ Pivot", component: "PivotCard" },
];

export const DEFAULT_REPORT_CONFIG = {
  title: "Báo cáo tổng hợp",
  dataSource: "CONTACT",
  columnName: [],
  condition: {
    conjunction: "or",
    conditions: [
      {
        conjunction: "and",
        conditions: [
          {
            columnName: "CreatedDate",
            operator: ">=",
            value: "LAST30DAYS",
            extendValues: [],
          },
          {
            columnName: "CreatedDate",
            operator: "<=",
            value: "TODAY",
            extendValues: [],
          },
        ],
      },
    ],
  },
  isGroupBy: false,
};

// Trích xuất điều kiện không gian làm việc từ cấu hình báo cáo
export const extractWorkspaceConditionFromConfig = (reportConfig) => {
  if (
    !reportConfig ||
    !reportConfig.condition ||
    !reportConfig.condition.conditions
  ) {
    return {
      columnName: "WorkspaceId",
      operator: "IN",
      value: "",
      extendValues: [],
    };
  }

  // Tìm điều kiện không gian làm việc
  for (const mainCondition of reportConfig.condition.conditions) {
    if (mainCondition.conditions) {
      const workspaceCondition = mainCondition.conditions.find(
        (c) => c.columnName === "WorkspaceId" && c.operator === "IN"
      );
      if (workspaceCondition) {
        // Đảm bảo extendValues luôn là mảng
        return {
          ...workspaceCondition,
          extendValues: workspaceCondition.extendValues || [],
        };
      }
    }
  }

  // Trả về đối tượng mặc định nếu không tìm thấy
  return {
    columnName: "WorkspaceId",
    operator: "IN",
    value: "",
    extendValues: [],
  };
};

// Cập nhật hoặc thêm mới điều kiện không gian làm việc vào cấu hình báo cáo
export const updateWorkspaceConditionInConfig = (
  reportConfig,
  workspaceIds
) => {
  if (
    !reportConfig ||
    !reportConfig.condition ||
    !reportConfig.condition.conditions ||
    !reportConfig.condition.conditions[0] ||
    !reportConfig.condition.conditions[0].conditions
  ) {
    return reportConfig;
  }

  const updatedConfig = { ...reportConfig };
  const mainConditions = updatedConfig.condition.conditions;

  // Tìm điều kiện không gian làm việc
  const mainCondition = mainConditions[0];
  const workspaceConditionIndex = mainCondition.conditions.findIndex(
    (c) => c.columnName === "WorkspaceId" && c.operator === "IN"
  );

  // Nếu không có workspaceIds hoặc mảng rỗng, xóa điều kiện nếu có
  if (!workspaceIds || workspaceIds.length === 0) {
    if (workspaceConditionIndex !== -1) {
      mainCondition.conditions.splice(workspaceConditionIndex, 1);
    }
    return updatedConfig;
  }

  // Tạo điều kiện không gian làm việc mới
  const newWorkspaceCondition = {
    columnName: "WorkspaceId",
    operator: "IN",
    value: "",
    extendValues: workspaceIds,
  };

  // Nếu đã có điều kiện, cập nhật; nếu chưa có, thêm mới
  if (workspaceConditionIndex !== -1) {
    mainCondition.conditions[workspaceConditionIndex] = newWorkspaceCondition;
  } else {
    mainCondition.conditions.push(newWorkspaceCondition);
  }

  return updatedConfig;
};

// Trích xuất điều kiện người phụ trách từ cấu hình báo cáo
export const extractAssigneeConditionFromConfig = (reportConfig) => {
  if (
    !reportConfig ||
    !reportConfig.condition ||
    !reportConfig.condition.conditions
  ) {
    return {
      columnName: "AssignTo",
      operator: "IN",
      value: "",
      extendValues: [],
    };
  }

  // Tìm điều kiện người phụ trách
  for (const mainCondition of reportConfig.condition.conditions) {
    if (mainCondition.conditions) {
      const assigneeCondition = mainCondition.conditions.find(
        (c) => c.columnName === "AssignTo" && c.operator === "IN"
      );
      if (assigneeCondition) {
        // Đảm bảo extendValues luôn là mảng
        return {
          ...assigneeCondition,
          extendValues: assigneeCondition.extendValues || [],
        };
      }
    }
  }

  // Trả về đối tượng mặc định nếu không tìm thấy
  return {
    columnName: "AssignTo",
    operator: "IN",
    value: "",
    extendValues: [],
  };
};

// Cập nhật hoặc thêm mới điều kiện người phụ trách vào cấu hình báo cáo
export const updateAssigneeConditionInConfig = (reportConfig, assigneeIds) => {
  if (
    !reportConfig ||
    !reportConfig.condition ||
    !reportConfig.condition.conditions ||
    !reportConfig.condition.conditions[0] ||
    !reportConfig.condition.conditions[0].conditions
  ) {
    return reportConfig;
  }

  const updatedConfig = { ...reportConfig };
  const mainConditions = updatedConfig.condition.conditions;

  // Tìm điều kiện người phụ trách
  const mainCondition = mainConditions[0];
  const assigneeConditionIndex = mainCondition.conditions.findIndex(
    (c) => c.columnName === "AssignTo" && c.operator === "IN"
  );

  // Nếu không có assigneeIds hoặc mảng rỗng, xóa điều kiện nếu có
  if (!assigneeIds || assigneeIds.length === 0) {
    if (assigneeConditionIndex !== -1) {
      mainCondition.conditions.splice(assigneeConditionIndex, 1);
    }
    return updatedConfig;
  }

  // Tạo điều kiện người phụ trách mới
  const newAssigneeCondition = {
    columnName: "AssignTo",
    operator: "IN",
    value: "",
    extendValues: assigneeIds,
  };

  // Nếu đã có điều kiện, cập nhật; nếu chưa có, thêm mới
  if (assigneeConditionIndex !== -1) {
    mainCondition.conditions[assigneeConditionIndex] = newAssigneeCondition;
  } else {
    mainCondition.conditions.push(newAssigneeCondition);
  }

  return updatedConfig;
};
