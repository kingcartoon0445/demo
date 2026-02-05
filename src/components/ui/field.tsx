"use client";

import { cva } from "class-variance-authority";
import {
    FieldError as AriaFieldError,
    FieldErrorProps as AriaFieldErrorProps,
    Group as AriaGroup,
    GroupProps as AriaGroupProps,
    Label as AriaLabel,
    LabelProps as AriaLabelProps,
    Text as AriaText,
    TextProps as AriaTextProps,
    composeRenderProps,
} from "react-aria-components";

import { cn } from "@/lib/utils";

const labelVariants = cva([
    "text-sm font-medium leading-none",
    /* Disabled */
    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-70",
    /* Invalid */
    "group-data-[invalid]:text-destructive",
]);

const Label = ({ className, ...props }: AriaLabelProps) => (
    <AriaLabel className={cn(labelVariants(), className)} {...props} />
);

function FormDescription({ className, ...props }: AriaTextProps) {
    return (
        <AriaText
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
            slot="description"
        />
    );
}

function FieldError({ className, ...props }: AriaFieldErrorProps) {
    return (
        <AriaFieldError
            className={cn("text-sm font-medium text-destructive", className)}
            {...props}
        />
    );
}

const fieldGroupVariants = cva("", {
    variants: {
        variant: {
            default: [
                "relative flex h-10 w-full items-center overflow-hidden rounded-md border border-input bg-background px-3 py-2 text-sm ring-0",
                /* Focus Within */
                "data-[focus-within]:outline-none data-[focus-within]:ring-0 data-[focus-within]:ring-none",
                /* Disabled */
                "data-[disabled]:opacity-50",
            ],
            ghost: "",
        },
    },
    defaultVariants: {
        variant: "default",
    },
});

function FieldGroup({
    className,
    variant,
    ...props
}: AriaGroupProps & { variant: "default" | "ghost" }) {
    return (
        <AriaGroup
            className={composeRenderProps(className, (className) =>
                cn(fieldGroupVariants({ variant }), className)
            )}
            {...props}
        />
    );
}

export {
    Label,
    labelVariants,
    FieldGroup,
    fieldGroupVariants,
    FieldError,
    FormDescription,
};
