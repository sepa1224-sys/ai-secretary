"use client";

interface QuickAction {
  label: string;
  message: string;
  icon: string;
}

const QUICK_ACTIONS: QuickAction[] = [
  {
    label: "今日の予定",
    message: "今日の予定を教えてください",
    icon: "📅",
  },
  {
    label: "今週の予定",
    message: "今週の予定を一覧で見せてください",
    icon: "🗓️",
  },
  {
    label: "タスク確認",
    message: "Notionのタスク一覧を見せてください",
    icon: "✅",
  },
  {
    label: "予定追加",
    message: "新しい予定を追加したいです",
    icon: "➕",
  },
];

interface QuickActionsProps {
  onAction: (message: string) => void;
  disabled?: boolean;
}

export function QuickActions({ onAction, disabled }: QuickActionsProps) {
  return (
    <div className="flex flex-wrap gap-2 px-4 py-2">
      {QUICK_ACTIONS.map((action) => (
        <button
          key={action.label}
          onClick={() => onAction(action.message)}
          disabled={disabled}
          className={`
            flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium
            transition-all duration-200
            ${
              disabled
                ? "bg-white/5 text-gray-500 cursor-not-allowed"
                : "bg-white/10 hover:bg-white/20 text-gray-200 hover:text-white border border-white/10 hover:border-white/20 cursor-pointer active:scale-95"
            }
          `}
        >
          <span>{action.icon}</span>
          <span>{action.label}</span>
        </button>
      ))}
    </div>
  );
}
