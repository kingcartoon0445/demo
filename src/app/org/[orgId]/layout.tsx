import PermissionGuard from "@/components/auth/PermissionGuard";

export default function OrgLayout({ children }: { children: React.ReactNode }) {
    return <PermissionGuard>{children}</PermissionGuard>;
}
