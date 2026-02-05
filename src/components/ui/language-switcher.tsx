"use client";

import React, { useState, useRef, useEffect } from "react";
import { Button } from "./button";
import { useLanguage } from "@/contexts/LanguageContext";
import { Languages } from "lucide-react";

export function LanguageSwitcher() {
    const { language, setLanguage } = useLanguage();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (
                dropdownRef.current &&
                !dropdownRef.current.contains(event.target as Node)
            ) {
                setIsOpen(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () =>
            document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const handleLanguageChange = (lang: "vi" | "en") => {
        setLanguage(lang);
        setIsOpen(false);
    };

    return (
        <div className="relative" ref={dropdownRef}>
            <Button
                variant="outline"
                size="sm"
                className="flex items-center justify-start gap-2 w-full border-none shadow-none rounded-none hover:bg-[oklch(0.65_0.28_276_/_0.1)] !px-4 !py-2"
                onClick={() => setIsOpen(!isOpen)}
            >
                <Languages className="w-full" />
                {language === "vi" ? "Tiếng Việt" : "English"}
            </Button>

            {isOpen && (
                <div className="absolute w-full left-0 top-full mt-1 w-40 bg-white border rounded-lg py-1 z-50">
                    <button
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                            language === "vi" ? "bg-blue-50 text-blue-600" : ""
                        }`}
                        onClick={() => handleLanguageChange("vi")}
                    >
                        🇻🇳 Tiếng Việt
                    </button>
                    <button
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 ${
                            language === "en" ? "bg-blue-50 text-blue-600" : ""
                        }`}
                        onClick={() => handleLanguageChange("en")}
                    >
                        🇺🇸 English
                    </button>
                </div>
            )}
        </div>
    );
}
