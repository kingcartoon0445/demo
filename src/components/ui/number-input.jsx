import NumberFlow from "@number-flow/react";
import clsx from "clsx";
import { Minus, Plus } from "lucide-react";
import * as React from "react";

export function Input({
    value = 0,
    min = -Infinity,
    max = Infinity,
    onChange,
    size = "default",
}) {
    const defaultValue = React.useRef(value);
    const inputRef = React.useRef(null);
    const [animated, setAnimated] = React.useState(true);
    // Hide the caret during transitions so you can't see it shifting around:
    const [showCaret, setShowCaret] = React.useState(true);
    const handleInput = ({ currentTarget: el }) => {
        setAnimated(false);
        if (el.value === "") {
            onChange?.(defaultValue.current);
            return;
        }
        const num = parseInt(el.value);
        if (
            isNaN(num) ||
            (min != null && num < min) ||
            (max != null && num > max)
        ) {
            // Revert input's value:
            el.value = String(value);
        } else {
            // Manually update value in case they e.g. start with a "0" or end with a "."
            // which won't trigger a DOM update (because the number is the same):
            el.value = String(num);
            onChange?.(num);
        }
    };
    const handlePointerDown = (diff) => (event) => {
        setAnimated(true);
        if (event.pointerType === "mouse") {
            event?.preventDefault();
            inputRef.current?.focus();
        }
        const newVal = Math.min(Math.max(value + diff, min), max);
        onChange?.(newVal);
    };
    return (
        <div
            className={clsx(
                "group flex items-stretch rounded-md font-semibold ring ring-zinc-200 transition-[box-shadow] focus-within:ring-1 focus-within:ring-blue-500 dark:ring-zinc-800",
                {
                    "text-2xl": size === "default",
                    "text-xl": size === "medium",
                    "text-base": size === "small",
                }
            )}
        >
            <button
                aria-hidden
                tabIndex={-1}
                className="flex items-center pl-[.5em] pr-[.325em]"
                disabled={min != null && value <= min}
                onPointerDown={handlePointerDown(-1)}
            >
                <Minus
                    className={clsx({
                        "size-4": size === "default",
                        "size-3.5": size === "medium",
                        "size-3": size === "small",
                    })}
                    absoluteStrokeWidth
                    strokeWidth={3.5}
                />
            </button>
            <div className="relative grid items-center justify-items-center text-center [grid-template-areas:'overlap'] *:[grid-area:overlap]">
                <input
                    ref={inputRef}
                    className={clsx(
                        showCaret ? "caret-primary" : "caret-transparent",
                        "w-[1.2em] bg-transparent py-2 text-center font-[inherit] text-transparent outline-none [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none [-moz-appearance:textfield]"
                    )}
                    // Make sure to disable kerning, to match NumberFlow:
                    style={{ fontKerning: "none" }}
                    type="number"
                    min={min}
                    step={1}
                    autoComplete="off"
                    inputMode="numeric"
                    max={max}
                    value={value}
                    onInput={handleInput}
                />
                <NumberFlow
                    value={value}
                    format={{ useGrouping: false }}
                    aria-hidden
                    animated={animated}
                    onAnimationsStart={() => setShowCaret(false)}
                    onAnimationsFinish={() => setShowCaret(true)}
                    className="pointer-events-none"
                    willChange
                />
            </div>
            <button
                aria-hidden
                tabIndex={-1}
                className="flex items-center pl-[.325em] pr-[.5em]"
                disabled={max != null && value >= max}
                onPointerDown={handlePointerDown(1)}
            >
                <Plus
                    className={clsx({
                        "size-4": size === "default",
                        "size-3.5": size === "medium",
                        "size-3": size === "small",
                    })}
                    absoluteStrokeWidth
                    strokeWidth={3.5}
                />
            </button>
        </div>
    );
}

export default { Input };
