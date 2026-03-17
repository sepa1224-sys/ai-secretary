import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCalendarEvents } from "@/lib/google-calendar";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "認証が必要です。" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const range = searchParams.get("range") || "today";

    const now = new Date();
    const jstOffset = 9 * 60 * 60 * 1000;
    const jstNow = new Date(now.getTime() + jstOffset);

    let timeMin: string;
    let timeMax: string;

    if (range === "today") {
      const todayStart = new Date(jstNow);
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(jstNow);
      todayEnd.setHours(23, 59, 59, 999);

      timeMin = new Date(todayStart.getTime() - jstOffset).toISOString();
      timeMax = new Date(todayEnd.getTime() - jstOffset).toISOString();
    } else if (range === "week") {
      const weekStart = new Date(jstNow);
      weekStart.setHours(0, 0, 0, 0);
      const weekEnd = new Date(jstNow);
      weekEnd.setDate(weekEnd.getDate() + 7);
      weekEnd.setHours(23, 59, 59, 999);

      timeMin = new Date(weekStart.getTime() - jstOffset).toISOString();
      timeMax = new Date(weekEnd.getTime() - jstOffset).toISOString();
    } else {
      timeMin = searchParams.get("timeMin") || now.toISOString();
      timeMax = searchParams.get("timeMax") || new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString();
    }

    const events = await getCalendarEvents(
      session.accessToken,
      timeMin,
      timeMax
    );

    return NextResponse.json({ events });
  } catch (error: any) {
    console.error("Calendar events API error:", error);
    return NextResponse.json(
      { error: error.message || "予定の取得中にエラーが発生しました。" },
      { status: 500 }
    );
  }
}
