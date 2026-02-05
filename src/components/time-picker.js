"use client"

import React from "react";
import { TimeField } from "./time-field";

const TimePicker = React.forwardRef((props, forwardedRef) => {
    return <TimeField {...props} ref={forwardedRef} />;
});

TimePicker.displayName = "TimePicker";

export { TimePicker };
