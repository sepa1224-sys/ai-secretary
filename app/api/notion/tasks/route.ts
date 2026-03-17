import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNotionTasks, getNotionDatabases } from "@/lib/notion";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json(
        { error: "認証が必要です。" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const databaseId =
      searchParams.get("databaseId") || process.env.NOTION_DATABASE_ID;

    if (!databaseId) {
      // データベースIDが未設定の場合、利用可能なデータベース一覧を返す
      const databases = await getNotionDatabases();
      return NextResponse.json({
        databases,
        message:
          "NOTION_DATABASE_ID が設定されていません。上記のデータベースIDを環境変数に設定してください。",
      });
    }

    const tasks = await getNotionTasks(databaseId);
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Notion tasks API error:", error);
    return NextResponse.json(
      { error: error.message || "タスクの取得中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
