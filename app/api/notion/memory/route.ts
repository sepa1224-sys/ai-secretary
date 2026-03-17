import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { saveAIMemory, getAIMemories } from "@/lib/notion";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const databaseId = searchParams.get("databaseId");
    const limit = parseInt(searchParams.get("limit") || "10");

    if (!databaseId) {
      return Response.json(
        { error: "databaseIdが必要です" },
        { status: 400 }
      );
    }

    const memories = await getAIMemories(databaseId, limit);

    return Response.json({
      success: true,
      memories,
    });
  } catch (error: any) {
    console.error("Memory fetch error:", error);
    return Response.json(
      { error: error.message || "記憶の取得に失敗しました" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return Response.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { databaseId, content, category = "learning" } = body;

    if (!databaseId || !content) {
      return Response.json(
        { error: "databaseIdとcontentが必要です" },
        { status: 400 }
      );
    }

    const memory = await saveAIMemory(databaseId, content, category);

    return Response.json({
      success: true,
      memory,
    });
  } catch (error: any) {
    console.error("Memory save error:", error);
    return Response.json(
      { error: error.message || "記憶の保存に失敗しました" },
      { status: 500 }
    );
  }
}
