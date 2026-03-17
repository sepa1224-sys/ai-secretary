"use client";

import { useEffect, useRef } from "react";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const isUser = message.role === "user";

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString("ja-JP", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // マークダウンライクなテキストを簡易レンダリング
  const renderContent = (content: string) => {
    const lines = content.split("\n");
    const elements: React.ReactNode[] = [];
    let inTable = false;
    let tableRows: string[][] = [];
    let tableHeaders: string[] = [];

    const processInlineMarkdown = (text: string, key: number): React.ReactNode => {
      // **bold**
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return (
        <span key={key}>
          {parts.map((part, i) => {
            if (part.startsWith("**") && part.endsWith("**")) {
              return <strong key={i} className="font-semibold">{part.slice(2, -2)}</strong>;
            }
            return part;
          })}
        </span>
      );
    };

    lines.forEach((line, index) => {
      // テーブル処理
      if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
        const cells = line
          .trim()
          .slice(1, -1)
          .split("|")
          .map((c) => c.trim());

        if (!inTable) {
          inTable = true;
          tableHeaders = cells;
          tableRows = [];
        } else if (cells.every((c) => /^[-:]+$/.test(c))) {
          // セパレーター行をスキップ
        } else {
          tableRows.push(cells);
        }
        return;
      } else if (inTable) {
        // テーブル終了
        elements.push(
          <div key={`table-${index}`} className="overflow-x-auto my-2">
            <table className="min-w-full text-sm">
              <thead>
                <tr>
                  {tableHeaders.map((h, i) => (
                    <th
                      key={i}
                      className="px-3 py-1.5 text-left font-semibold border-b border-white/20 text-indigo-300"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableRows.map((row, ri) => (
                  <tr key={ri} className={ri % 2 === 0 ? "bg-white/5" : ""}>
                    {row.map((cell, ci) => (
                      <td key={ci} className="px-3 py-1.5 border-b border-white/10">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
        inTable = false;
        tableRows = [];
        tableHeaders = [];
      }

      // 見出し
      if (line.startsWith("## ")) {
        elements.push(
          <h3 key={index} className="text-base font-bold mt-3 mb-1 text-indigo-300">
            {line.slice(3)}
          </h3>
        );
      } else if (line.startsWith("# ")) {
        elements.push(
          <h2 key={index} className="text-lg font-bold mt-3 mb-1 text-indigo-200">
            {line.slice(2)}
          </h2>
        );
      }
      // リスト項目
      else if (line.startsWith("- ") || line.startsWith("• ")) {
        elements.push(
          <div key={index} className="flex items-start gap-2 my-0.5">
            <span className="mt-1 text-indigo-400 flex-shrink-0">•</span>
            <span>{processInlineMarkdown(line.slice(2), index)}</span>
          </div>
        );
      }
      // 番号付きリスト
      else if (/^\d+\.\s/.test(line)) {
        const match = line.match(/^(\d+)\.\s(.+)/);
        if (match) {
          elements.push(
            <div key={index} className="flex items-start gap-2 my-0.5">
              <span className="mt-0 text-indigo-400 flex-shrink-0 font-mono text-sm">
                {match[1]}.
              </span>
              <span>{processInlineMarkdown(match[2], index)}</span>
            </div>
          );
        }
      }
      // 空行
      else if (line.trim() === "") {
        elements.push(<div key={index} className="h-2" />);
      }
      // 通常テキスト
      else {
        elements.push(
          <p key={index} className="my-0.5 leading-relaxed">
            {processInlineMarkdown(line, index)}
          </p>
        );
      }
    });

    // テーブルが最後に残っている場合
    if (inTable && tableHeaders.length > 0) {
      elements.push(
        <div key="table-final" className="overflow-x-auto my-2">
          <table className="min-w-full text-sm">
            <thead>
              <tr>
                {tableHeaders.map((h, i) => (
                  <th
                    key={i}
                    className="px-3 py-1.5 text-left font-semibold border-b border-white/20 text-indigo-300"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {tableRows.map((row, ri) => (
                <tr key={ri} className={ri % 2 === 0 ? "bg-white/5" : ""}>
                  {row.map((cell, ci) => (
                    <td key={ci} className="px-3 py-1.5 border-b border-white/10">
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }

    return elements;
  };

  return (
    <div
      className={`flex items-end gap-2 message-animate ${
        isUser ? "flex-row-reverse" : "flex-row"
      }`}
    >
      {/* アバター */}
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm shadow-lg">
          🤖
        </div>
      )}

      {/* バブル */}
      <div
        className={`max-w-[80%] md:max-w-[70%] rounded-2xl px-4 py-3 shadow-md ${
          isUser
            ? "bg-gradient-to-br from-indigo-600 to-indigo-700 text-white rounded-br-sm"
            : "bg-white/10 backdrop-blur-sm border border-white/10 text-gray-100 rounded-bl-sm"
        }`}
      >
        <div className="text-sm leading-relaxed">
          {renderContent(message.content)}
        </div>
        <div
          className={`text-xs mt-1.5 ${
            isUser ? "text-indigo-200 text-right" : "text-gray-400"
          }`}
        >
          {formatTime(message.timestamp)}
        </div>
      </div>

      {/* ユーザーアバター */}
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-sm shadow-lg">
          👤
        </div>
      )}
    </div>
  );
}

export function TypingIndicator() {
  return (
    <div className="flex items-end gap-2 message-animate">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-sm shadow-lg">
        🤖
      </div>
      <div className="bg-white/10 backdrop-blur-sm border border-white/10 rounded-2xl rounded-bl-sm px-4 py-3 shadow-md">
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" />
          <div className="w-2 h-2 rounded-full bg-indigo-400 typing-dot" />
        </div>
      </div>
    </div>
  );
}
