export default function SkeletonLoader({ viewMode = "table", rows = 8 }) {
    return (
        <div className="bg-white flex flex-col">
            {/* <div className="flex-shrink-0 max-w-7xl mx-auto w-full p-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-3">
                    <div>
                        <div className="h-6 bg-gray-200 rounded w-48 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-gray-200 rounded w-64 animate-pulse"></div>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="h-8 bg-gray-200 rounded w-32 animate-pulse"></div>
                        <div className="h-8 bg-gray-200 rounded w-28 animate-pulse"></div>
                    </div>
                </div>

                <div className="mb-4">
                    <div className="relative max-w-xs">
                        <div className="h-9 bg-gray-200 rounded w-80 animate-pulse"></div>
                    </div>
                </div>
            </div> */}

            {/* Content - phần này là TableView */}
            <div className="flex-1 max-w-7xl mx-auto w-full px-6 pb-6 min-h-0">
                <div className="bg-white rounded-lg border border-gray-200 shadow-sm">
                    <div className="overflow-auto max-h-[calc(100vh-280px)]">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="h-4 bg-gray-200 rounded w-24 animate-pulse"></div>
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                    </th>
                                    <th className="text-left py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="h-4 bg-gray-200 rounded w-20 animate-pulse"></div>
                                    </th>
                                    <th className="text-center py-3 px-4 text-sm font-medium text-gray-500 uppercase tracking-wider">
                                        <div className="h-4 bg-gray-200 rounded w-16 mx-auto animate-pulse"></div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {Array.from({ length: rows }).map(
                                    (_, index) => (
                                        <tr
                                            key={index}
                                            className="border-l-4 border-l-gray-200"
                                        >
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-2">
                                                    <div className="h-5 w-5 bg-gray-200 rounded-full animate-pulse"></div>
                                                    <div className="h-5 w-5 bg-gray-200 rounded animate-pulse"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-32 animate-pulse"></div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-9 w-9 bg-gray-200 rounded-full animate-pulse"></div>
                                                    <div>
                                                        <div className="h-4 bg-gray-200 rounded w-24 mb-1 animate-pulse"></div>
                                                        <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="h-4 bg-gray-200 rounded w-32 mb-1 animate-pulse"></div>
                                                <div className="h-3 bg-gray-200 rounded w-24 animate-pulse"></div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="h-4 bg-gray-200 rounded w-28 mb-1 animate-pulse"></div>
                                                <div className="h-3 bg-gray-200 rounded w-20 animate-pulse"></div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center">
                                                    <div className="h-4 w-4 bg-gray-200 rounded-full mr-1.5 animate-pulse"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <div className="flex items-center">
                                                    <div className="w-3 h-3 bg-gray-200 rounded-full mr-2 animate-pulse"></div>
                                                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse"></div>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <div className="flex justify-center space-x-2">
                                                    <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                                                    <div className="h-7 w-7 bg-gray-200 rounded animate-pulse"></div>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
