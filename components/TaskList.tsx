"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

interface NotionTask {
  id: string;
  title: string;
  status: string;
  priority?: string;
  dueDate?: string;
  url: string;
}

const STATUS_COLORS: Record<string, string> = {
  "Not started": "bg-gray-500",
  "In progress": "bg-blue-500",
  "Done": "bg-green-500",
  "未着手": "bg-gray-500",
  "進行中": "bg-blue-500",
  "完了": "bg-green-500",
};

const PRIORITY_COLORS: Record<string, string> = {
  High: "text-red-400",
  Medium: "text-yellow-400",
  Low: "text-green-400",
  高: "text-red-400",
  中: "text-yellow-400",
  低: "text-green-400",
};

export function TaskList() {
  const { data: session } = useSession();
  const [tasks, setTasks] = useState<NotionTask[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      fetchTasks();
    }
  }, [session]);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/notion/tasks");
      if (!response.ok) throw new Error("タスクの取得に失敗しました");
      const data = await response.json();
      if (data.error) throw new Error(data.error);
      setTasks(data.tasks || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDueDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    const diffDays = Math.ceil(
      (date.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays < 0) return { text: `${Math.abs(diffDays)}日超過`, color: "text-red-400" };
    if (diffDays === 0) return { text: "今日", color: "text-orange-400" };
    if (diffDays === 1) return { text: "明日", color: "text-yellow-400" };
    return {
      text: date.toLocaleDateString("ja-JP", { month: "numeric", day: "numeric" }),
      color: "text-gray-400",
    };
  };

  return (
    <div className="glass rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200 flex items-center gap-1.5">
          <span>✅</span>
          <span>タスク</span>
        </h3>
        <span className="text-xs text-gray-400">{tasks.length}件</span>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-4">
          <div className="w-4 h-4 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : error ? (
        <div className="py-2">
          <p className="text-xs text-gray-400 text-center">
            {error.includes("NOTION_DATABASE_ID")
              ? "Notion設定が必要です"
              : error}
          </p>
        </div>
      ) : tasks.length === 0 ? (
        <p className="text-xs text-gray-400 py-2 text-center">
          未完了のタスクはありません
        </p>
      ) : (
        <div className="space-y-2 max-h-64 overflow-y-auto">
          {tasks.slice(0, 8).map((task) => {
            const dueInfo = task.dueDate ? formatDueDate(task.dueDate) : null;
            const statusColor =
              STATUS_COLORS[task.status] || "bg-gray-500";
            const priorityColor = task.priority
              ? PRIORITY_COLORS[task.priority] || "text-gray-400"
              : null;

            return (
              <a
                key={task.id}
                href={task.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-2 p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors block"
              >
                <div
                  className={`flex-shrink-0 w-1.5 h-1.5 rounded-full mt-1.5 ${statusColor}`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-gray-200 truncate">
                    {task.title}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    {priorityColor && task.priority && (
                      <span className={`text-xs ${priorityColor}`}>
                        {task.priority}
                      </span>
                    )}
                    {dueInfo && (
                      <span className={`text-xs ${dueInfo.color}`}>
                        {dueInfo.text}
                      </span>
                    )}
                  </div>
                </div>
              </a>
            );
          })}
          {tasks.length > 8 && (
            <p className="text-xs text-gray-500 text-center py-1">
              他 {tasks.length - 8} 件
            </p>
          )}
        </div>
      )}

      <button
        onClick={fetchTasks}
        className="mt-3 w-full text-xs text-indigo-400 hover:text-indigo-300 transition-colors py-1"
      >
        更新
      </button>
    </div>
  );
}
