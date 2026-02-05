import Image from "next/image";
import { useState } from "react";

interface ImageDisplayProps {
    src: string;
    alt?: string;
    className?: string;
    width?: number;
    height?: number;
}

export default function ImageDisplay({
    src,
    alt = "Image",
    className = "",
    width = 400,
    height = 300,
}: ImageDisplayProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [hasError, setHasError] = useState(false);

    const handleLoad = () => {
        setIsLoading(false);
    };

    const handleError = () => {
        setIsLoading(false);
        setHasError(true);
    };

    if (hasError) {
        return (
            <div
                className={`flex items-center justify-center bg-gray-100 border-2 border-dashed border-gray-300 rounded-lg ${className}`}
                style={{ width, height }}
            >
                <div className="text-center text-gray-500">
                    <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                    </svg>
                    <p className="mt-2 text-sm">Không thể tải hình ảnh</p>
                </div>
            </div>
        );
    }

    return (
        <div className={`relative ${className}`}>
            {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 rounded-lg">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            )}
            <Image
                src={src}
                alt={alt}
                width={width}
                height={height}
                className="rounded-lg object-cover"
                onLoad={handleLoad}
                onError={handleError}
                unoptimized // For external URLs
            />
        </div>
    );
}
