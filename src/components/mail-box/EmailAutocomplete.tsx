"use client";

import React, { useState, useRef, useEffect } from "react";
import {
    Command,
    CommandGroup,
    CommandItem,
    CommandList,
    CommandInput,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
    PopoverAnchor,
} from "@/components/ui/popover";
import { searchEmailAddresses } from "@/api/mail-box";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface EmailAutocompleteProps {
    value: string;
    onChange: (value: string) => void;
    placeholder?: string;
    className?: string;
    orgId: string;
}

export function EmailAutocomplete({
    value,
    onChange,
    placeholder,
    className,
    orgId,
}: EmailAutocompleteProps) {
    const { t } = useLanguage();
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<any[]>([]);
    const [loading, setLoading] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [cursorPosition, setCursorPosition] = useState<number | null>(null);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(async () => {
            if (searchTerm.trim().length > 2) {
                setLoading(true);
                try {
                    const res = (await searchEmailAddresses(
                        orgId,
                        searchTerm,
                    )) as any;
                    if (res?.code === 0 && Array.isArray(res.content)) {
                        setSuggestions(res.content);
                        setOpen(true);
                    } else {
                        setSuggestions([]);
                        setOpen(false);
                    }
                } catch (error) {
                    console.error("Error searching emails:", error);
                } finally {
                    setLoading(false);
                }
            } else {
                setSuggestions([]);
                setOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [searchTerm, orgId]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        onChange(newValue);

        // Calculate current search term based on cursor position
        const cursorValues = getSearchTermAtCursor(
            newValue,
            e.target.selectionStart || 0,
        );
        setSearchTerm(cursorValues.term);
        setCursorPosition(e.target.selectionStart);
    };

    const getSearchTermAtCursor = (text: string, cursor: number) => {
        // Handle comma separated emails
        // Find the start and end of the current term being edited
        const textBeforeCursor = text.slice(0, cursor);
        const lastCommaIndex = textBeforeCursor.lastIndexOf(",");

        const termStart = lastCommaIndex + 1;

        // We only care about the term *before* the cursor for searching
        // But for replacing, we need to know where the term ends too if we were to support editing middle terms better
        // For now, let's keep it simple: we search based on what's being typed at the end or after a comma

        const currentTerm = textBeforeCursor.slice(termStart).trim();
        return { term: currentTerm, start: termStart };
    };

    const handleSelect = (email: string) => {
        // Replace the current search term with the selected email
        if (cursorPosition === null) return;

        const textBeforeCursor = value.slice(0, cursorPosition);
        const textAfterCursor = value.slice(cursorPosition);

        const lastCommaIndex = textBeforeCursor.lastIndexOf(",");
        const prefix = textBeforeCursor.slice(0, lastCommaIndex + 1);

        // We also want to consume any part of the email user might have typed *after* cursor if they are in middle
        // But usually autocomplete is at end. Let's assume appending for now or replacing the current "word"

        // Simple strategy: Replace everything after the last comma with the selected email + comma
        const newValue = prefix + (prefix ? " " : "") + email + ", ";

        onChange(newValue);
        setOpen(false);
        setSuggestions([]);
        setSearchTerm("");

        // Focus back to input
        setTimeout(() => {
            if (inputRef.current) {
                inputRef.current.focus();
            }
        }, 10);
    };

    return (
        <div className="relative w-full">
            <input
                ref={inputRef}
                className={cn(
                    "w-full h-8 px-0 text-sm border-0 focus:outline-none focus:ring-0 bg-transparent placeholder:text-gray-300",
                    className,
                )}
                placeholder={placeholder}
                value={value}
                onChange={handleInputChange}
                onFocus={() => {
                    if (searchTerm.trim().length > 2) {
                        setOpen(true);
                    }
                }}
                onKeyDown={(e) => {
                    if (e.key === "Escape") {
                        if (open) {
                            setOpen(false);
                            e.stopPropagation();
                            e.preventDefault();
                        }
                    }
                }}
                autoComplete="off"
            />
            <Popover
                open={open}
                onOpenChange={(newOpen) => {
                    // Only allow opening if we have a valid search term
                    if (newOpen && searchTerm.trim().length <= 2) {
                        return;
                    }
                    setOpen(newOpen);
                }}
            >
                <PopoverAnchor className="absolute top-full left-0 w-full h-0" />
                <PopoverContent
                    className="p-0 w-[400px]"
                    align="start"
                    onOpenAutoFocus={(e) => e.preventDefault()}
                >
                    <Command shouldFilter={false}>
                        {/* We mimic CommandInput behavior but don't use it directly as we use the main input */}
                        <div className="hidden">
                            <CommandInput
                                placeholder="Search..."
                                value={searchTerm}
                            />
                        </div>
                        <CommandList>
                            <CommandGroup>
                                {suggestions.map((item) => (
                                    <CommandItem
                                        key={item.id || item.email}
                                        value={item.email}
                                        onSelect={() =>
                                            handleSelect(item.email)
                                        }
                                        className="flex flex-col items-start gap-1 cursor-pointer"
                                    >
                                        <div className="font-medium">
                                            {item.name || item.email}
                                        </div>
                                        {item.name &&
                                            item.email !== item.name && (
                                                <div className="text-xs text-gray-500">
                                                    {item.email}
                                                </div>
                                            )}
                                    </CommandItem>
                                ))}
                            </CommandGroup>
                            {suggestions.length === 0 && !loading && (
                                <div className="py-6 text-center text-sm text-gray-500">
                                    {t("mail.noResultsFound")}
                                </div>
                            )}
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    );
}
