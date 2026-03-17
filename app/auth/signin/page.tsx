"use client";

import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

function SignInContent() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";
  const error = searchParams.get("error");

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-950 via-navy-900 to-navy-800">
      {/* 背景装飾 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md mx-4">
        {/* ロゴ・タイトル */}
        <div className="text-center mb-8">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-4xl shadow-2xl shadow-indigo-500/30">
            🤖
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">AI秘書</h1>
          <p className="text-gray-400 text-sm">
            GoogleカレンダーとNotionをAIで自然言語操作
          </p>
        </div>

        {/* サインインカード */}
        <div className="glass rounded-2xl p-8 shadow-2xl">
          {error && (
            <div className="mb-6 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm text-center">
              {error === "OAuthSignin"
                ? "Googleサインインに失敗しました。再度お試しください。"
                : error === "OAuthCallback"
                ? "認証コールバックでエラーが発生しました。"
                : "認証エラーが発生しました。"}
            </div>
          )}

          <div className="space-y-4">
            <div className="text-center mb-6">
              <h2 className="text-lg font-semibold text-white mb-1">
                ログインして始める
              </h2>
              <p className="text-gray-400 text-xs">
                Googleアカウントでログインすると、カレンダー連携が有効になります
              </p>
            </div>

            <button
              onClick={() =>
                signIn("google", { callbackUrl })
              }
              className="w-full flex items-center justify-center gap-3 px-6 py-3.5 rounded-xl bg-white hover:bg-gray-50 text-gray-800 font-medium transition-all duration-200 active:scale-98 shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Googleでログイン
            </button>
          </div>

          <div className="mt-6 pt-6 border-t border-white/10">
            <div className="space-y-2">
              <p className="text-xs text-gray-400 text-center font-medium mb-3">
                このアプリが必要とする権限
              </p>
              {[
                { icon: "📅", text: "Googleカレンダーの読み取り・書き込み" },
                { icon: "👤", text: "Googleアカウントの基本情報" },
              ].map((item) => (
                <div
                  key={item.text}
                  className="flex items-center gap-2 text-xs text-gray-400"
                >
                  <span>{item.icon}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-600 mt-6">
          ログインすることで、利用規約とプライバシーポリシーに同意したものとみなします
        </p>
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-navy-950" />}>
      <SignInContent />
    </Suspense>
  );
}
