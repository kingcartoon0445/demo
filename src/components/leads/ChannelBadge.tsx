export default function ChannelBadge({ channel }: { channel: string }) {
    return (
        <div className="flex items-center gap-2 bg-sidebar-accent rounded-lg px-2 py-1 text-xs">
            <span className="text-primary capitalize">
                {channel.toLowerCase()}
            </span>
        </div>
    );
}
