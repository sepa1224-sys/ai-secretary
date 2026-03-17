import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const SYSTEM_PROMPT = `あなたは「AI秘書」です。ユーザーの日常業務を効率化するスマートアシスタントです。

## あなたの役割
- Googleカレンダーの予定管理（読み取り・追加）
- Notionのタスク管理（一覧取得・追加・更新）
- 自然言語でのスケジュール調整と提案
- 丁寧で親しみやすい日本語でのコミュニケーション

## カレンダー登録ルール（重要）
予定を追加する際は、**必ずユーザーに確認してから登録**してください。

| カテゴリ | 動作 |
|---------|------|
| 👤 プライベート | sepa1224@gmail.com のカレンダーに登録 |
| 🏢 仕事 | sepa1224@gmail.com に登録 + kiai.english.kiai@gmail.com にインビテーション送付 |
| 👨‍👩‍👧 ファミリー | ファミリーカレンダーに登録 |

## ツールの使い方
- get_calendar_events: 予定の取得（今日・今週・指定期間）
- create_calendar_event: 予定の作成（必ず確認後）
- get_notion_tasks: Notionタスクの取得
- create_notion_task: Notionタスクの作成
- search_notion: Notionページの検索

## コミュニケーションスタイル
- 丁寧で親しみやすいトーン
- 絵文字を適度に使用（📅 🗓️ ✅ 📝 など）
- 予定追加前は必ず「〇〇を△△カレンダーに登録してよろしいですか？」と確認
- 長い情報はリスト形式で整理して表示
- 日時は「3月17日（月）14:00〜15:00」のような読みやすい形式で表示

## 現在の設定
- プライベートカレンダー: sepa1224@gmail.com
- 仕事用メール: kiai.english.kiai@gmail.com
- タイムゾーン: Asia/Tokyo（日本時間）

今日の日付と時刻を常に把握し、相対的な表現（「今日」「明日」「今週」）を正確に解釈してください。`;

export const CALENDAR_TOOLS: Anthropic.Tool[] = [
  {
    name: "get_calendar_events",
    description:
      "Googleカレンダーから予定を取得します。今日・今週・指定期間の予定を取得できます。",
    input_schema: {
      type: "object",
      properties: {
        timeMin: {
          type: "string",
          description:
            "取得開始日時（ISO 8601形式、例: 2024-01-01T00:00:00+09:00）",
        },
        timeMax: {
          type: "string",
          description:
            "取得終了日時（ISO 8601形式、例: 2024-01-07T23:59:59+09:00）",
        },
      },
      required: ["timeMin", "timeMax"],
    },
  },
  {
    name: "create_calendar_event",
    description:
      "Googleカレンダーに予定を追加します。必ずユーザーの確認を取ってから呼び出してください。",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "予定のタイトル",
        },
        start: {
          type: "string",
          description:
            "開始日時（ISO 8601形式、例: 2024-01-15T14:00:00+09:00）",
        },
        end: {
          type: "string",
          description:
            "終了日時（ISO 8601形式、例: 2024-01-15T15:00:00+09:00）",
        },
        description: {
          type: "string",
          description: "予定の詳細・メモ（任意）",
        },
        location: {
          type: "string",
          description: "場所（任意）",
        },
        category: {
          type: "string",
          enum: ["private", "work", "family"],
          description:
            "カテゴリ: private（プライベート）/ work（仕事）/ family（ファミリー）",
        },
      },
      required: ["title", "start", "end", "category"],
    },
  },
  {
    name: "get_notion_tasks",
    description: "Notionデータベースからタスク一覧を取得します。",
    input_schema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description:
            "NotionデータベースのID（省略時はデフォルトデータベースを使用）",
        },
      },
      required: [],
    },
  },
  {
    name: "create_notion_task",
    description: "Notionデータベースに新しいタスクを作成します。",
    input_schema: {
      type: "object",
      properties: {
        title: {
          type: "string",
          description: "タスクのタイトル",
        },
        status: {
          type: "string",
          description: "ステータス（例: Not started, In progress）",
        },
        priority: {
          type: "string",
          description: "優先度（例: High, Medium, Low）",
        },
        dueDate: {
          type: "string",
          description: "期限（YYYY-MM-DD形式）",
        },
        notes: {
          type: "string",
          description: "メモ・詳細（任意）",
        },
        databaseId: {
          type: "string",
          description:
            "NotionデータベースのID（省略時はデフォルトデータベースを使用）",
        },
      },
      required: ["title"],
    },
  },
  {
    name: "search_notion",
    description: "Notionのページやデータベースを検索します。",
    input_schema: {
      type: "object",
      properties: {
        query: {
          type: "string",
          description: "検索クエリ",
        },
      },
      required: ["query"],
    },
  },
];
