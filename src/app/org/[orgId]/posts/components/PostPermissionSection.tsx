import Avatar from "react-avatar";

interface FacebookPage {
    id: string;
    uid: string;
    title: string;
    name: string;
    avatar: string;
    status: number;
}

interface PostPermission {
    id: string;
    userId: string;
    userName: string;
    userEmail: string;
    userAvatar: string;
    role: number;
    roleName: string;
    roleNameVi: string;
    allowedChannelIds: string[];
    allowedChannels: FacebookPage[];
}

interface PostPermissionSectionProps {
    postPermissions: PostPermission[];
    permissionsLoading: boolean;
    onAddMember: () => void;
    onEditPermission: (permission: PostPermission) => void;
    onDeletePermission: (permission: PostPermission) => void;
}

export function PostPermissionSection({
    postPermissions,
    permissionsLoading,
    onAddMember,
    onEditPermission,
    onDeletePermission,
}: PostPermissionSectionProps) {
    return (
        <section className="bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700">
            <div className="p-6 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <h2 className="text-lg font-semibold flex items-center gap-2">
                    <span className="material-icons-outlined text-primary">
                        admin_panel_settings
                    </span>
                    Phân quyền đăng bài
                </h2>
                <button
                    onClick={onAddMember}
                    className="text-primary font-medium text-sm hover:underline"
                >
                    Thêm thành viên
                </button>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-slate-200 dark:divide-slate-700">
                    <thead className="bg-slate-100 dark:bg-slate-800/60">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Thành viên
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Email
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Vai trò
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Kênh được phép
                            </th>
                            <th className="px-6 py-3 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 dark:divide-slate-700 bg-white dark:bg-slate-900">
                        {permissionsLoading ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-4 text-center text-sm text-slate-500"
                                >
                                    Đang tải dữ liệu...
                                </td>
                            </tr>
                        ) : postPermissions.length === 0 ? (
                            <tr>
                                <td
                                    colSpan={5}
                                    className="px-6 py-4 text-center text-sm text-slate-500"
                                >
                                    Chưa có thành viên nào được phân quyền.
                                </td>
                            </tr>
                        ) : (
                            postPermissions.map((permission) => (
                                <tr key={permission.id}>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            {permission.userAvatar ? (
                                                <img
                                                    src={permission.userAvatar}
                                                    alt={permission.userName}
                                                    className="h-8 w-8 rounded-full object-cover"
                                                />
                                            ) : (
                                                <Avatar
                                                    name={permission.userName}
                                                    size="32"
                                                    round
                                                />
                                            )}
                                            <div className="ml-3">
                                                <div className="text-sm font-medium text-slate-900 dark:text-slate-50">
                                                    {permission.userName}
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                                        {permission.userEmail}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <span
                                            className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                                                permission.role === 3
                                                    ? "bg-red-100 text-red-800"
                                                    : permission.role === 2
                                                    ? "bg-blue-100 text-blue-800"
                                                    : "bg-slate-100 text-slate-800"
                                            }`}
                                        >
                                            {permission.roleNameVi ||
                                                permission.roleName}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        {permission.allowedChannels &&
                                        permission.allowedChannels.length >
                                            0 ? (
                                            <div className="flex -space-x-1 overflow-hidden">
                                                {permission.allowedChannels
                                                    .slice(0, 5)
                                                    .map((channel) => (
                                                        <div
                                                            key={channel.id}
                                                            className="inline-block h-6 w-6 rounded-full ring-2 ring-white dark:ring-slate-900"
                                                            title={channel.name}
                                                        >
                                                            {channel.avatar ? (
                                                                <img
                                                                    src={
                                                                        channel.avatar
                                                                    }
                                                                    alt={
                                                                        channel.name
                                                                    }
                                                                    className="h-full w-full rounded-full object-cover"
                                                                />
                                                            ) : (
                                                                <div className="h-full w-full rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                                                                    {channel.name?.charAt(
                                                                        0
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>
                                                    ))}
                                                {permission.allowedChannels
                                                    .length > 5 && (
                                                    <div className="inline-block h-6 w-6 rounded-full bg-slate-100 flex items-center justify-center ring-2 ring-white dark:ring-slate-900 text-[10px] font-medium text-slate-500">
                                                        +
                                                        {permission
                                                            .allowedChannels
                                                            .length - 5}
                                                    </div>
                                                )}
                                            </div>
                                        ) : (
                                            <span className="text-xs italic text-slate-400">
                                                Không có kênh (Lỗi)
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() =>
                                                    onEditPermission(permission)
                                                }
                                                className="text-slate-500 hover:text-primary"
                                                title="Chỉnh sửa"
                                            >
                                                <span className="material-icons-outlined">
                                                    edit
                                                </span>
                                            </button>
                                            <button
                                                onClick={() =>
                                                    onDeletePermission(
                                                        permission
                                                    )
                                                }
                                                className="text-slate-500 hover:text-red-500"
                                                title="Xóa"
                                            >
                                                <span className="material-icons-outlined">
                                                    delete
                                                </span>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </section>
    );
}
