import { Skeleton } from "../ui/skeleton";

export function TableLoading({
    rows = 5,
    columns = 4,
}: {
    rows?: number;
    columns?: number;
}) {
    return (
        <>
            {Array.from({ length: rows }).map((_, rowIndex) => (
                <div key={rowIndex} className="flex gap-2 mb-2">
                    {Array.from({ length: columns }).map((_, columnIndex) => (
                        <Skeleton
                            key={columnIndex}
                            className="h-[50px] w-full"
                        />
                    ))}
                </div>
            ))}
        </>
    );
}
