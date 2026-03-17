import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createNotionTask } from "@/lib/notion";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です。" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, status, priority, dueDate, notes, databaseId } = body;

    if (!title) {
      return NextResponse.json(
        { error: "タスクのタイトルは必須です。" },
        { status: 400 }
      );
    }

    const resolvedDatabaseId =
      databaseId || process.env.NOTION_DATABASE_ID;

    if (!resolvedDatabaseId) {
      return NextResponse.json(
        {
          error:
            "NOTION_DATABASE_ID が設定されていません。環境変数を設定してください。",
        },
        { status: 500 }
      );
    }

    const task = await createNotionTask({
      title,
      status,
      priority,
      dueDate,
      notes,
      databaseId: resolvedDatabaseId,
    });

    return NextResponse.json({
      success: true,
      task,
      message: `タスク「${title}」をNotionに追加しました。`,
    });
  } catch (error: any) {
    console.error("Notion create API error:", error);
    return NextResponse.json(
      { error: error.message || "タスクの作成中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
