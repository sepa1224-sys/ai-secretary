import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { deleteCalendarEvent } from "@/lib/google-calendar";

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email || !session.accessToken) {
      return Response.json(
        { error: "認証が必要です" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { eventId, calendarId = "primary" } = body;

    if (!eventId) {
      return Response.json(
        { error: "eventIdが必要です" },
        { status: 400 }
      );
    }

    await deleteCalendarEvent(session.accessToken as string, eventId, calendarId);

    return Response.json({
      success: true,
      message: `予定（ID: ${eventId}）を削除しました`,
    });
  } catch (error: any) {
    console.error("Calendar delete error:", error);
    return Response.json(
      { error: error.message || "予定の削除に失敗しました" },
      { status: 500 }
    );
  }
}
