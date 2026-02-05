"use client";

import {
    DateField as AriaDateField,
    DateInput as AriaDateInput,
    DateSegment as AriaDateSegment,
    TimeField as AriaTimeField,
    composeRenderProps,
    Text,
    DateSegmentProps,
    DateInputProps,
    DateFieldProps,
    TimeFieldProps,
    DateValue,
    TimeValue,
} from "react-aria-components";

import { cn } from "@/lib/utils";

import { FieldError, fieldGroupVariants, Label } from "./field";

const DateField = AriaDateField;

const TimeField = AriaTimeField;

function DateSegment({ className, ...props }: DateSegmentProps) {
    return (
        <AriaDateSegment
            className={composeRenderProps(className, (className) =>
                cn(
                    "type-literal:px-0 inline rounded p-0.5 caret-transparent outline outline-0",
                    /* Placeholder */
                    "data-[placeholder]:text-muted-foreground",
                    /* Disabled */
                    "data-[disabled]:cursor-not-allowed data-[disabled]:opacity-50",
                    /* Focused */
                    "data-[focused]:bg-accent data-[focused]:text-accent-foreground",
                    /* Invalid */
                    "data-[invalid]:data-[focused]:bg-destructive data-[invalid]:data-[focused]:data-[placeholder]:text-destructive-foreground data-[invalid]:data-[focused]:text-destructive-foreground data-[invalid]:data-[placeholder]:text-destructive data-[invalid]:text-destructive",
                    className
                )
            )}
            {...props}
        />
    );
}

interface ExtendedDateInputProps extends DateInputProps {
    variant?: "default" | "ghost";
}

function DateInput({ className, variant, ...props }: ExtendedDateInputProps) {
    return (
        <AriaDateInput
            className={composeRenderProps(className, (className) =>
                cn(fieldGroupVariants({ variant }), "text-sm", className)
            )}
            {...props}
        >
            {props.children || ((segment) => <DateSegment segment={segment} />)}
        </AriaDateInput>
    );
}

interface ExtendedDateFieldProps<T extends DateValue>
    extends DateFieldProps<T> {
    label?: React.ReactNode;
    description?: React.ReactNode;
    errorMessage?: React.ReactNode;
}

function JollyDateField<T extends DateValue>({
    label,
    description,
    className,
    errorMessage,
    ...props
}: ExtendedDateFieldProps<T>) {
    return (
        <DateField
            className={composeRenderProps(className, (className) =>
                cn("group flex flex-col gap-2", className)
            )}
            {...props}
        >
            <Label>{label}</Label>
            <DateInput>
                {(segment) => <DateSegment segment={segment} />}
            </DateInput>
            {description && (
                <Text
                    className="text-sm text-muted-foreground"
                    slot="description"
                >
                    {description}
                </Text>
            )}
            <FieldError>{errorMessage}</FieldError>
        </DateField>
    );
}

interface ExtendedTimeFieldProps<T extends TimeValue>
    extends TimeFieldProps<T> {
    label?: React.ReactNode;
    description?: React.ReactNode;
    errorMessage?: React.ReactNode;
}

function JollyTimeField<T extends TimeValue>({
    label,
    description,
    errorMessage,
    className,
    ...props
}: ExtendedTimeFieldProps<T>) {
    return (
        <TimeField
            className={composeRenderProps(className, (className) =>
                cn("group flex flex-col gap-2", className)
            )}
            {...props}
        >
            <Label>{label}</Label>
            <DateInput>
                {(segment) => <DateSegment segment={segment} />}
            </DateInput>
            {description && <Text slot="description">{description}</Text>}
            <FieldError>{errorMessage}</FieldError>
        </TimeField>
    );
}

export {
    DateField,
    DateSegment,
    DateInput,
    TimeField,
    JollyDateField,
    JollyTimeField,
};
