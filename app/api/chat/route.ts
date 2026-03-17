import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { anthropic, SYSTEM_PROMPT, CALENDAR_TOOLS } from "@/lib/claude";
import {
  getCalendarEvents,
  createCalendarEvent,
  deleteCalendarEvent,
} from "@/lib/google-calendar";
import {
  getNotionTasks,
  createNotionTask,
  searchNotionPages,
  saveAIMemory,
  getAIMemories,
} from "@/lib/notion";

export const maxDuration = 60;

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.accessToken) {
      return NextResponse.json(
        { error: "認証が必要です。Googleアカウントでログインしてください。" },
        { status: 401 }
      );
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "メッセージが不正です。" },
        { status: 400 }
      );
    }

    // 現在の日時情報をシステムプロンプトに追加
    const now = new Date();
    const jstNow = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Tokyo" }));
    const dateInfo = `\n\n## 現在の日時情報\n現在の日時: ${jstNow.toLocaleString("ja-JP", {
      year: "numeric",
      month: "long",
      day: "numeric",
      weekday: "long",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Tokyo",
    })}（日本時間）`;

    const systemPromptWithDate = SYSTEM_PROMPT + dateInfo;

    // Claude APIを呼び出し（ツール使用対応）
    let response = await anthropic.messages.create({
      model: "claude-sonnet-4-5",
      max_tokens: 4096,
      system: systemPromptWithDate,
      tools: CALENDAR_TOOLS,
      messages: messages,
    });

    // ツール呼び出しのループ処理
    const toolResults: any[] = [];
    let finalResponse = response;

    while (response.stop_reason === "tool_use") {
      const toolUseBlocks = response.content.filter(
        (block) => block.type === "tool_use"
      );

      const toolResultContents: any[] = [];

      for (const toolUse of toolUseBlocks) {
        if (toolUse.type !== "tool_use") continue;

        let toolResult: any;

        try {
          switch (toolUse.name) {
            case "get_calendar_events": {
              const input = toolUse.input as {
                timeMin: string;
                timeMax: string;
              };
              const events = await getCalendarEvents(
                session.accessToken!,
                input.timeMin,
                input.timeMax
              );
              toolResult = {
                success: true,
                events,
                count: events.length,
              };
              break;
            }

            case "create_calendar_event": {
              const input = toolUse.input as {
                title: string;
                start: string;
                end: string;
                description?: string;
                location?: string;
                category: "private" | "work" | "family";
              };
              const event = await createCalendarEvent(
                session.accessToken!,
                input
              );
              toolResult = {
                success: true,
                event,
                message:
                  input.category === "work"
                    ? `予定を作成しました。kiai.english.kiai@gmail.com にインビテーションを送付しました。`
                    : `予定を作成しました。`,
              };
              break;
            }

            case "get_notion_tasks": {
              const input = toolUse.input as { databaseId?: string };
              const databaseId =
                input.databaseId || process.env.NOTION_DATABASE_ID || "";

              if (!databaseId) {
                toolResult = {
                  success: false,
                  error:
                    "Notion データベースIDが設定されていません。NOTION_DATABASE_ID環境変数を設定してください。",
                };
              } else {
                const tasks = await getNotionTasks(databaseId);
                toolResult = {
                  success: true,
                  tasks,
                  count: tasks.length,
                };
              }
              break;
            }

            case "create_notion_task": {
              const input = toolUse.input as {
                title: string;
                status?: string;
                priority?: string;
                dueDate?: string;
                notes?: string;
                databaseId?: string;
              };
              const databaseId =
                input.databaseId || process.env.NOTION_DATABASE_ID || "";

              if (!databaseId) {
                toolResult = {
                  success: false,
                  error:
                    "Notion データベースIDが設定されていません。",
                };
              } else {
                const task = await createNotionTask({
                  ...input,
                  databaseId,
                });
                toolResult = {
                  success: true,
                  task,
                  message: `タスク「${input.title}」をNotionに追加しました。`,
                };
              }
              break;
            }

            case "search_notion": {
              const input = toolUse.input as { query: string };
              const pages = await searchNotionPages(input.query);
              toolResult = {
                success: true,
                pages,
                count: pages.length,
              };
              break;
            }

            case "delete_calendar_event": {
              const input = toolUse.input as {
                eventId: string;
                calendarId?: string;
              };
              const result = await deleteCalendarEvent(
                session.accessToken!,
                input.eventId,
                input.calendarId
              );
              toolResult = {
                success: true,
                message: "予定を削除しました。",
              };
              break;
            }

            case "save_ai_memory": {
              const input = toolUse.input as {
                content: string;
                category?: string;
                databaseId?: string;
              };
              const databaseId =
                input.databaseId || process.env.NOTION_DATABASE_ID || "";

              if (!databaseId) {
                toolResult = {
                  success: false,
                  error: "Notion データベースIDが設定されていません。",
                };
              } else {
                const memory = await saveAIMemory(
                  databaseId,
                  input.content,
                  input.category || "learning"
                );
                toolResult = {
                  success: true,
                  memory,
                  message: "情報を記憶に保存しました。",
                };
              }
              break;
            }

            case "get_ai_memories": {
              const input = toolUse.input as {
                databaseId?: string;
                limit?: number;
              };
              const databaseId =
                input.databaseId || process.env.NOTION_DATABASE_ID || "";

              if (!databaseId) {
                toolResult = {
                  success: false,
                  error: "Notion データベースIDが設定されていません。",
                };
              } else {
                const memories = await getAIMemories(
                  databaseId,
                  input.limit || 10
                );
                toolResult = {
                  success: true,
                  memories,
                  count: memories.length,
                };
              }
              break;
            }

            default:
              toolResult = {
                success: false,
                error: `不明なツール: ${toolUse.name}`,
              };
          }
        } catch (error: any) {
          console.error(`Tool error (${toolUse.name}):`, error);
          toolResult = {
            success: false,
            error: error.message || "ツールの実行中にエラーが発生しました。",
          };
        }

        toolResultContents.push({
          type: "tool_result",
          tool_use_id: toolUse.id,
          content: JSON.stringify(toolResult),
        });
      }

      // ツール結果を含めて再度Claudeに問い合わせ
      const updatedMessages = [
        ...messages,
        { role: "assistant", content: response.content },
        { role: "user", content: toolResultContents },
      ];

      response = await anthropic.messages.create({
        model: "claude-sonnet-4-5",
        max_tokens: 4096,
        system: systemPromptWithDate,
        tools: CALENDAR_TOOLS,
        messages: updatedMessages,
      });

      finalResponse = response;
    }

    // テキストレスポンスを抽出
    const textContent = finalResponse.content
      .filter((block) => block.type === "text")
      .map((block) => (block as any).text)
      .join("\n");

    return NextResponse.json({
      message: textContent,
      usage: finalResponse.usage,
    });
  } catch (error: any) {
    console.error("Chat API error:", error);

    if (error.status === 401) {
      return NextResponse.json(
        { error: "APIキーが無効です。" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        error:
          error.message ||
          "AIとの通信中にエラーが発生しました。しばらく後でお試しください。",
      },
      { status: 500 }
    );
  }
}
