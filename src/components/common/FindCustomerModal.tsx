import CustomerSelector from "../componentsWithHook/CustomerSelector";
import * as React from "react";

interface FindCustomerModalProps {
    orgId: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSelect?: (customer: {
        id: string;
        fullName: string;
        phone?: string;
    }) => void;
    conversationId?: string;
    provider?: string;
}

export default function FindCustomerModal({
    orgId,
    open,
    onOpenChange,
    onSelect,
    conversationId,
    provider,
}: FindCustomerModalProps) {
    // Just render the CustomerSelector directly since it already has its own CommandDialog
    return (
        <CustomerSelector
            orgId={orgId}
            open={open}
            onOpenChange={onOpenChange}
            onSelect={onSelect}
            conversationId={conversationId}
            provider={provider}
        />
    );
}
