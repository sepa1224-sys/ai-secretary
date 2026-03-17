import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createCalendarEvent } from "@/lib/google-calendar";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "認証が必要です。" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { title, start, end, description, location, category } = body;

    if (!title || !start || !end || !category) {
      return NextResponse.json(
        { error: "必須パラメータが不足しています。" },
        { status: 400 }
      );
    }

    if (!["private", "work", "family"].includes(category)) {
      return NextResponse.json(
        { error: "カテゴリは private / work / family のいずれかを指定してください。" },
        { status: 400 }
      );
    }

    const event = await createCalendarEvent(session.accessToken, {
      title,
      start,
      end,
      description,
      location,
      category,
    });

    return NextResponse.json({
      success: true,
      event,
      message:
        category === "work"
          ? `予定「${title}」を作成しました。kiai.english.kiai@gmail.com にインビテーションを送付しました。`
          : `予定「${title}」を作成しました。`,
    });
  } catch (error: any) {
    console.error("Calendar create API error:", error);
    return NextResponse.json(
      { error: error.message || "予定の作成中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
