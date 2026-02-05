import { useCurrentPageTitle } from "@/hooks/useCurrentPageTitle";
import { Breadcrumb } from "./Breadcrumb";

interface PageHeaderProps {
    showBreadcrumb?: boolean;
    customTitle?: string;
    children?: React.ReactNode;
}

export const PageHeader = ({
    showBreadcrumb = false,
    customTitle,
    children,
}: PageHeaderProps) => {
    const currentPageTitle = useCurrentPageTitle();

    return (
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-200">
            <div className="flex flex-col">
                <h1 className="text-2xl font-bold text-gray-900">
                    {customTitle || currentPageTitle}
                </h1>
                {showBreadcrumb && (
                    <div className="mt-1">
                        <Breadcrumb />
                    </div>
                )}
            </div>
            {children && (
                <div className="flex items-center gap-2">{children}</div>
            )}
        </div>
    );
};
