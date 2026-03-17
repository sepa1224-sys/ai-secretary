import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getNotionTasks, getNotionDatabases, findTaskDatabase } from "@/lib/notion";

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
    let databaseId =
      searchParams.get("databaseId") || process.env.NOTION_DATABASE_ID;

    // データベースIDが未設定の場合、自動特定を試みる
    if (!databaseId) {
      console.log("Database ID not set, attempting to auto-detect...");
      databaseId = await findTaskDatabase();
      
      if (!databaseId) {
        // 自動特定に失敗した場合、利用可能なデータベース一覧を返す
        const databases = await getNotionDatabases();
        return NextResponse.json({
          databases,
          message:
            "タスクデータベースが見つかりません。NOTION_DATABASE_ID を環境変数に設定するか、Notionでタスク関連のデータベースを作成してください。",
        });
      }
    }

    const tasks = await getNotionTasks(databaseId);
    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("Notion tasks API error:", error);
    
    // 404エラーの場合、自動特定を試みる
    if (error.status === 404) {
      console.log("Database not found, attempting auto-detection...");
      try {
        const autoDetectedId = await findTaskDatabase();
        if (autoDetectedId) {
          console.log(`Auto-detected database: ${autoDetectedId}`);
          const tasks = await getNotionTasks(autoDetectedId);
          return NextResponse.json({ tasks });
        }
      } catch (autoDetectError) {
        console.error("Auto-detection failed:", autoDetectError);
      }
      
      return NextResponse.json(
        { 
          error: "Notionデータベースが見つかりません。インテグレーションがデータベースに接続されているか確認してください。",
          details: error.message
        },
        { status: 404 }
      );
    }
    
    if (error.status === 403) {
      return NextResponse.json(
        { 
          error: "Notionへのアクセス権限がありません。インテグレーションがデータベースに接続されているか確認してください。",
          details: error.message
        },
        { status: 403 }
      );
    }
    
    return NextResponse.json(
      { 
        error: error.message || "タスクの取得中にエラーが発生しました。",
        status: error.status
      },
      { status: 500 }
    );
  }
}
