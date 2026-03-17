"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export function CalendarPreview() {
  const { data: session } = useSession();
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchTodayEvents();
    }
  }, [session]);

  const fetchTodayEvents = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/calendar/events?range=today");
      if (!response.ok) throw new Error("予定の取得に失敗しました");
      const data = await response.json();
      setEvents(data.events || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateStr: string) => {
    if (dateStr.length === 10) return "終日";
    const date = new Date(dateStr);
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const today = new Date().toLocaleDateString("ja-JP", {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-1.5">
          <span>📅</span>
          <span>今日の予定</span>
        </h3>
        <span className="text-xs text-gray-400">{today}</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <p className="text-xs text-red-400 py-2">{error}</p>
      ) : events.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 text-center">
          今日の予定はありません
        </p>
      ) : (
        <div className="space-y-2">
          {events.map((event) => (
            <div
              key={event.id}
              className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
            >
              <div className="flex-shrink-0 w-1 h-full min-h-[2rem] rounded-full bg-indigo-500 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-200 truncate">
                  {event.title}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatTime(event.start)}
                  {event.end && event.start.length > 10
                    ? ` 〜 ${formatTime(event.end)}`
                    : ""}
                </p>
                {event.location && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    📍 {event.location}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <button
        onClick={fetchTodayEvents}
        className="mt-3 w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1"
      >
        更新
      </button>
    </div>
  );
}
