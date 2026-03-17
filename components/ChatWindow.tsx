"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageBubble, TypingIndicator, type Message } from "./MessageBubble";
import { QuickActions } from "./QuickActions";

interface ApiMessage {
  role: "user" | "assistant";
  content: string;
}

export function ChatWindow() {
  const { data: session } = useSession();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `こんにちは！AI秘書です 🤖\n\nGoogleカレンダーの予定確認・追加や、Notionのタスク管理をお手伝いします。\n\n下のボタンからクイックアクションを選ぶか、自由にメッセージを入力してください！`,
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading, scrollToBottom]);

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        role: "user",
        content: content.trim(),
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, userMessage]);
      setInput("");
      setIsLoading(true);

      // テキストエリアの高さをリセット
      if (textareaRef.current) {
        textareaRef.current.style.height = "auto";
      }

      try {
        // 会話履歴をAPI形式に変換（welcomeメッセージを除く）
        const apiMessages: ApiMessage[] = messages
          .filter((m) => m.id !== "welcome")
          .map((m) => ({
            role: m.role,
            content: m.content,
          }));

        apiMessages.push({
          role: "user",
          content: content.trim(),
        });

        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: apiMessages }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "エラーが発生しました");
        }

        const data = await response.json();

        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: data.message || "申し訳ありません、応答を生成できませんでした。",
          timestamp: new Date(),
        };

        setMessages((prev) => [...prev, assistantMessage]);
      } catch (error: any) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `エラーが発生しました: ${error.message}\n\n再度お試しください。`,
          timestamp: new Date(),
        };
        setMessages((prev) => [...prev, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    },
    [messages, isLoading]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // IME確定中（isComposing）はEnterキーを無視する
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  const handleTextareaChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    // 自動高さ調整
    const textarea = e.target;
    textarea.style.height = "auto";
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };

  const handleCompositionStart = () => {
    // IME入力開始時の処理（必要に応じて）
  };

  const handleCompositionEnd = () => {
    // IME入力終了時の処理（必要に応じて）
  };

  return (
    <div className="flex flex-col h-full">
      {/* メッセージエリア */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
        {messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))}
        {isLoading && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* クイックアクション */}
      <QuickActions onAction={sendMessage} disabled={isLoading} />

      {/* 入力エリア */}
      <div className="px-4 pb-4 pt-2">
        <div className="flex items-end gap-2 glass rounded-2xl px-4 py-3">
          <textarea
            ref={textareaRef}
            value={input}
            onChange={handleTextareaChange}
            onKeyDown={handleKeyDown}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder={
              session
                ? "メッセージを入力... (Enter送信 / Shift+Enter改行)"
                : "ログインしてAI秘書を使い始めましょう"
            }
            disabled={isLoading || !session}
            rows={1}
            className="flex-1 bg-transparent text-sm text-gray-100 placeholder-gray-500 resize-none outline-none min-h-[24px] max-h-[120px] leading-6 disabled:opacity-50"
          />
          <button
            onClick={() => sendMessage(input)}
            disabled={isLoading || !input.trim() || !session}
            className={`
              flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center
              transition-all duration-200
              ${
                isLoading || !input.trim() || !session
                  ? "bg-white/10 text-gray-500 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer active:scale-95 shadow-lg shadow-indigo-500/25"
              }
            `}
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </div>
        <p className="text-xs text-gray-600 text-center mt-2">
          AI秘書はミスをすることがあります。重要な予定は必ず確認してください。
        </p>
      </div>
    </div>
  );
}
