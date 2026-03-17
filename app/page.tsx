import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ChatWindow } from "@/components/ChatWindow";
import { CalendarPreview } from "@/components/CalendarPreview";
import { TaskList } from "@/components/TaskList";
import { UserMenu } from "@/components/UserMenu";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/auth/signin");
  }

  return (
    <main className="min-h-screen flex flex-col md:flex-row">
      {/* 背景装飾 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-purple-500/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-3xl" />
      </div>

      {/* サイドバー（PC） */}
      <aside className="hidden md:flex md:flex-col md:w-72 lg:w-80 md:h-screen md:sticky md:top-0 p-4 gap-4 z-10 border-r border-white/5">
        {/* ヘッダー */}
        <div className="flex items-center gap-3 px-2 py-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xl shadow-lg shadow-indigo-500/25">
            🤖
          </div>
          <div>
            <h1 className="text-base font-bold text-white">AI秘書</h1>
            <p className="text-xs text-gray-400">スマートアシスタント</p>
          </div>
        </div>

        {/* ユーザーメニュー */}
        <UserMenu user={session.user} />

        {/* カレンダープレビュー */}
        <CalendarPreview />

        {/* タスクリスト */}
        <TaskList />

        {/* フッター */}
        <div className="mt-auto px-2 py-3">
          <p className="text-xs text-gray-600 text-center">
            Powered by Claude AI
          </p>
        </div>
      </aside>

      {/* チャットエリア */}
      <div className="flex-1 flex flex-col h-screen z-10">
        {/* モバイルヘッダー */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-white/5 glass-dark">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-base">
              🤖
            </div>
            <h1 className="text-base font-bold text-white">AI秘書</h1>
          </div>
          <UserMenu user={session.user} compact />
        </header>

        {/* チャットウィンドウ */}
        <div className="flex-1 overflow-hidden">
          <ChatWindow />
        </div>
      </div>
    </main>
  );
}
