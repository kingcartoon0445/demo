import { NextResponse } from "next/server";
import path from "path";
import * as fs from "fs";
// Secret key dùng để verify token JWT
const JWT_SECRET =
    "xfUVeaKk0rI0So81ies1F3he8i9tLMrAazH83cX04blLjF47HEXk0g250k3F";

// Hàm verify token JWT
const verifyToken = (token) => {
    try {
        const jwt = require("jsonwebtoken");
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error("Token verification failed:", error.message);
        return null;
    }
};

// Đảm bảo thư mục cho database tồn tại
const DB_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DB_DIR)) {
    fs.mkdirSync(DB_DIR, { recursive: true });
}

// Khởi tạo database
async function initializeDB() {
    const sqlite3 = require("sqlite3");
    const { open } = require("sqlite");

    const db = await open({
        filename: path.join(DB_DIR, "stages_visibility.db"),
        driver: sqlite3.Database,
    });

    // Tạo bảng cho hidden stages nếu chưa tồn tại
    await db.exec(`
    CREATE TABLE IF NOT EXISTS hidden_stages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      stage_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(workspace_id, stage_id)
    )
  `);

    // Tạo bảng cho hidden groups nếu chưa tồn tại
    await db.exec(`
    CREATE TABLE IF NOT EXISTS hidden_groups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      workspace_id TEXT NOT NULL,
      group_id TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(workspace_id, group_id)
    )
  `);

    return db;
}

// Xử lý GET request - Lấy danh sách trạng thái và nhóm bị ẩn
export async function GET(request) {
    try {
        // Lấy workspaceId từ query parameters
        const { searchParams } = new URL(request.url);
        const workspaceId = searchParams.get("workspaceId");

        if (!workspaceId) {
            return NextResponse.json(
                { error: "workspaceId is required" },
                { status: 400 }
            );
        }

        // Kiểm tra token từ request headers
        const token = request.headers
            .get("Authorization")
            ?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const db = await initializeDB();

        // Lấy danh sách stages bị ẩn
        const hiddenStages = await db.all(
            "SELECT stage_id FROM hidden_stages WHERE workspace_id = ?",
            [workspaceId]
        );

        // Lấy danh sách groups bị ẩn
        const hiddenGroups = await db.all(
            "SELECT group_id FROM hidden_groups WHERE workspace_id = ?",
            [workspaceId]
        );

        await db.close();

        return NextResponse.json({
            hiddenStages: hiddenStages.map((item) => item.stage_id),
            hiddenGroups: hiddenGroups.map((item) => item.group_id),
        });
    } catch (error) {
        console.error("Error fetching hidden stages and groups:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// Xử lý POST request - Cập nhật trạng thái ẩn hiện
export async function POST(request) {
    try {
        const { workspaceId, hiddenStages, hiddenGroups } =
            await request.json();

        if (!workspaceId) {
            return NextResponse.json(
                { error: "workspaceId is required" },
                { status: 400 }
            );
        }

        // Kiểm tra token từ request headers
        const token = request.headers
            .get("Authorization")
            ?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const db = await initializeDB();

        // Xóa tất cả các bản ghi hiện tại của workspace này
        await db.run("DELETE FROM hidden_stages WHERE workspace_id = ?", [
            workspaceId,
        ]);
        await db.run("DELETE FROM hidden_groups WHERE workspace_id = ?", [
            workspaceId,
        ]);

        // Thêm các stages mới vào danh sách ẩn
        if (hiddenStages && hiddenStages.length > 0) {
            const stageInsertStmt = await db.prepare(
                "INSERT OR REPLACE INTO hidden_stages (workspace_id, stage_id) VALUES (?, ?)"
            );

            for (const stageId of hiddenStages) {
                await stageInsertStmt.run(workspaceId, stageId);
            }

            await stageInsertStmt.finalize();
        }

        // Thêm các groups mới vào danh sách ẩn
        if (hiddenGroups && hiddenGroups.length > 0) {
            const groupInsertStmt = await db.prepare(
                "INSERT OR REPLACE INTO hidden_groups (workspace_id, group_id) VALUES (?, ?)"
            );

            for (const groupId of hiddenGroups) {
                await groupInsertStmt.run(workspaceId, groupId);
            }

            await groupInsertStmt.finalize();
        }

        await db.close();

        return NextResponse.json({
            success: true,
            message: "Visibility settings updated successfully",
        });
    } catch (error) {
        console.error("Error updating visibility settings:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// Xử lý PATCH request - Cập nhật trạng thái ẩn hiện cho một stage hoặc group
export async function PATCH(request) {
    try {
        const { workspaceId, stageId, groupId, isHidden } =
            await request.json();

        if (!workspaceId || (!stageId && !groupId)) {
            return NextResponse.json(
                {
                    error: "workspaceId and either stageId or groupId are required",
                },
                { status: 400 }
            );
        }

        // Kiểm tra token từ request headers
        const token = request.headers
            .get("Authorization")
            ?.replace("Bearer ", "");

        if (!token) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        // Verify token
        const decoded = verifyToken(token);
        if (!decoded) {
            return NextResponse.json(
                { error: "Invalid token" },
                { status: 401 }
            );
        }

        const db = await initializeDB();

        if (stageId) {
            // Cập nhật trạng thái ẩn hiện cho stage
            if (isHidden) {
                // Thêm vào danh sách ẩn
                await db.run(
                    "INSERT OR REPLACE INTO hidden_stages (workspace_id, stage_id) VALUES (?, ?)",
                    [workspaceId, stageId]
                );
            } else {
                // Xóa khỏi danh sách ẩn
                await db.run(
                    "DELETE FROM hidden_stages WHERE workspace_id = ? AND stage_id = ?",
                    [workspaceId, stageId]
                );
            }
        }

        if (groupId) {
            // Cập nhật trạng thái ẩn hiện cho group
            if (isHidden) {
                // Thêm vào danh sách ẩn
                await db.run(
                    "INSERT OR REPLACE INTO hidden_groups (workspace_id, group_id) VALUES (?, ?)",
                    [workspaceId, groupId]
                );
            } else {
                // Xóa khỏi danh sách ẩn
                await db.run(
                    "DELETE FROM hidden_groups WHERE workspace_id = ? AND group_id = ?",
                    [workspaceId, groupId]
                );
            }
        }

        await db.close();

        return NextResponse.json({
            success: true,
            message: "Visibility setting updated successfully",
        });
    } catch (error) {
        console.error("Error updating visibility setting:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
