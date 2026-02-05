/**
 * Tạo màu ngẫu nhiên cho avatar dựa trên tên
 * @param name - Tên người dùng
 * @returns Object với background và text color
 */
export function generateAvatarColor(name: string): {
    backgroundColor: string;
    color: string;
} {
    // Predefined color palette cho avatar
    const colorPalettes = [
        { bg: "#EF4444", text: "#FFFFFF" }, // Red
        { bg: "#F97316", text: "#FFFFFF" }, // Orange
        { bg: "#EAB308", text: "#FFFFFF" }, // Yellow
        { bg: "#22C55E", text: "#FFFFFF" }, // Green
        { bg: "#06B6D4", text: "#FFFFFF" }, // Cyan
        { bg: "#3B82F6", text: "#FFFFFF" }, // Blue
        { bg: "#8B5CF6", text: "#FFFFFF" }, // Violet
        { bg: "#EC4899", text: "#FFFFFF" }, // Pink
        { bg: "#F59E0B", text: "#FFFFFF" }, // Amber
        { bg: "#10B981", text: "#FFFFFF" }, // Emerald
        { bg: "#6366F1", text: "#FFFFFF" }, // Indigo
        { bg: "#84CC16", text: "#FFFFFF" }, // Lime
        { bg: "#F472B6", text: "#FFFFFF" }, // Pink-400
        { bg: "#A78BFA", text: "#FFFFFF" }, // Violet-400
        { bg: "#34D399", text: "#FFFFFF" }, // Emerald-400
        { bg: "#60A5FA", text: "#FFFFFF" }, // Blue-400
    ];

    // Tạo hash từ tên để đảm bảo consistent color
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
        const char = name.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash; // Convert to 32-bit integer
    }

    // Lấy index dựa trên hash
    const index = Math.abs(hash) % colorPalettes.length;
    const palette = colorPalettes[index];

    return {
        backgroundColor: palette.bg,
        color: palette.text,
    };
}

/**
 * Tạo initials từ tên đầy đủ
 * @param fullName - Tên đầy đủ
 * @returns Initials (tối đa 2 ký tự)
 */
export function generateInitials(fullName: string): string {
    if (!fullName || fullName.trim().length === 0) {
        return "??";
    }

    const words = fullName.trim().split(/\s+/);

    if (words.length === 1) {
        // Nếu chỉ có 1 từ, lấy 2 ký tự đầu
        return words[0].slice(0, 2).toUpperCase();
    }

    // Nếu có nhiều từ, lấy ký tự đầu của 2 từ đầu tiên
    return words
        .slice(0, 2)
        .map((word) => word.charAt(0))
        .join("")
        .toUpperCase();
}

/**
 * Tạo style object cho avatar với màu ngẫu nhiên
 * @param fullName - Tên đầy đủ
 * @returns Object với style và initials
 */
export function generateAvatarProps(fullName: string): {
    initials: string;
    style: React.CSSProperties;
} {
    const initials = generateInitials(fullName);
    const colors = generateAvatarColor(fullName);

    return {
        initials,
        style: {
            backgroundColor: colors.backgroundColor,
            color: colors.color,
        },
    };
}
