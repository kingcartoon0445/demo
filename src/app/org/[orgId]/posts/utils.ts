import type { PaginationResponse } from "@/interfaces/post";

export const parseGenericList =
    <T,>() =>
    (res: PaginationResponse<T>) =>
        (res?.content ?? res?.data ?? res?.items ?? res ?? []) as T[];

