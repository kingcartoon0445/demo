export const Field = ({
    label,
    children,
}: {
    label: string;
    children: React.ReactNode;
}) => (
    <div className="space-y-1">
        <div className="text-sm font-medium text-foreground">{label}</div>
        {children}
    </div>
);

export const Section = ({ children }: { children: React.ReactNode }) => (
    <div className="space-y-4">{children}</div>
);
