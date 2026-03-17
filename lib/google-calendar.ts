import { google } from "googleapis";

export interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  category?: "private" | "work" | "family";
  attendees?: string[];
}

export interface CreateEventParams {
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
  category: "private" | "work" | "family";
}

function getOAuth2Client(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  );
  oauth2Client.setCredentials({ access_token: accessToken });
  return oauth2Client;
}

export async function getCalendarEvents(
  accessToken: string,
  timeMin: string,
  timeMax: string
): Promise<CalendarEvent[]> {
  const auth = getOAuth2Client(accessToken);
  const calendar = google.calendar({ version: "v3", auth });

  const calendarIds = [
    process.env.PRIVATE_CALENDAR_ID || "primary",
  ];

  const allEvents: CalendarEvent[] = [];

  for (const calendarId of calendarIds) {
    try {
      const response = await calendar.events.list({
        calendarId,
        timeMin,
        timeMax,
        singleEvents: true,
        orderBy: "startTime",
        maxResults: 50,
      });

      const events = response.data.items || [];
      for (const event of events) {
        allEvents.push({
          id: event.id || "",
          title: event.summary || "（タイトルなし）",
          start: event.start?.dateTime || event.start?.date || "",
          end: event.end?.dateTime || event.end?.date || "",
          description: event.description || undefined,
          location: event.location || undefined,
          attendees: event.attendees?.map((a) => a.email || "").filter(Boolean),
        });
      }
    } catch (error) {
      console.error(`Failed to fetch events for calendar ${calendarId}:`, error);
    }
  }

  // 重複除去と時刻順ソート
  const uniqueEvents = allEvents.filter(
    (event, index, self) => index === self.findIndex((e) => e.id === event.id)
  );
  uniqueEvents.sort(
    (a, b) => new Date(a.start).getTime() - new Date(b.start).getTime()
  );

  return uniqueEvents;
}

export async function createCalendarEvent(
  accessToken: string,
  params: CreateEventParams
): Promise<CalendarEvent> {
  const auth = getOAuth2Client(accessToken);
  const calendar = google.calendar({ version: "v3", auth });

  const workEmail = process.env.WORK_EMAIL || "kiai.english.kiai@gmail.com";

  // カテゴリに応じてカレンダーIDと出席者を設定
  let calendarId = process.env.PRIVATE_CALENDAR_ID || "primary";
  const attendees: { email: string }[] = [];

  if (params.category === "work") {
    // 仕事の予定: メインカレンダーに登録 + 仕事用メールにインビテーション
    attendees.push({ email: workEmail });
  } else if (params.category === "family") {
    // ファミリーカレンダー（存在する場合）
    calendarId = "family";
  }

  const eventBody: any = {
    summary: params.title,
    description: params.description,
    location: params.location,
    start: {
      dateTime: params.start,
      timeZone: "Asia/Tokyo",
    },
    end: {
      dateTime: params.end,
      timeZone: "Asia/Tokyo",
    },
  };

  if (attendees.length > 0) {
    eventBody.attendees = attendees;
    eventBody.guestsCanModifyEvent = false;
    eventBody.guestsCanInviteOthers = false;
  }

  const response = await calendar.events.insert({
    calendarId,
    requestBody: eventBody,
    sendUpdates: attendees.length > 0 ? "all" : "none",
  });

  return {
    id: response.data.id || "",
    title: response.data.summary || "",
    start: response.data.start?.dateTime || response.data.start?.date || "",
    end: response.data.end?.dateTime || response.data.end?.date || "",
    description: response.data.description || undefined,
    location: response.data.location || undefined,
    category: params.category,
    attendees: response.data.attendees?.map((a) => a.email || ""),
  };
}

export function formatEventForDisplay(event: CalendarEvent): string {
  const start = new Date(event.start);
  const end = new Date(event.end);

  const formatDate = (date: Date) => {
    return date.toLocaleDateString("ja-JP", {
      month: "long",
      day: "numeric",
      weekday: "short",
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const isAllDay = event.start.length === 10; // YYYY-MM-DD format

  if (isAllDay) {
    return `📅 ${formatDate(start)} - ${event.title}（終日）`;
  }

  return `📅 ${formatDate(start)} ${formatTime(start)}〜${formatTime(end)} - ${event.title}`;
}
