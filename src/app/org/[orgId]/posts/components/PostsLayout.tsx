"use client";

import { PostsSubmenu, PostsSubmenuKey } from "./PostsSubmenu";

interface PostsLayoutProps {
    activeKey: PostsSubmenuKey;
    children: React.ReactNode;
}

export function PostsLayout({ activeKey, children }: PostsLayoutProps) {
    return (
        <div className="flex h-full overflow-hidden bg-background-light dark:bg-background-dark">
            {/* Menu phụ bên trái */}
            <aside className="w-64 flex-shrink-0 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 hidden md:flex">
                <PostsSubmenu activeKey={activeKey} />
            </aside>

            {/* Nội dung chính */}
            <main className="flex-1 flex flex-col h-full overflow-hidden">
                {children}
            </main>
        </div>
    );
}


