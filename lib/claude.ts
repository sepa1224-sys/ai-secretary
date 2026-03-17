import Anthropic from "@anthropic-ai/sdk";

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const SYSTEM_PROMPT = `あなたは「AI秘書」です。ユーザーの日常業務を効率化するスマートアシスタントです。

## あなたの役割
- Googleカレンダーの予定管理（読み取り・追加・削除）
- Notionのタスク管理（一覧取得・追加・更新）
- 自然言語でのスケジュール調整と提案
- LINEやメールからコピーされた断片的なテキストからの自動抽出
- 会話から学んだ情報の記憶と参照
- 丁寧で親しみやすい日本語でのコミュニケーション

## カレンダー登録ルール（重要）
予定を追加・削除する際は、**必ずユーザーに確認してから実行**してください。

| カテゴリ | 動作 |
|---------|------|
| 👤 プライベート | sepa1224@gmail.com のカレンダーに登録 |
| 🏢 仕事 | sepa1224@gmail.com に登録 + kiai.english.kiai@gmail.com にインビテーション送付 |
| 👨‍👩‍👧 ファミリー | ファミリーカレンダーに登録 |

## ツールの使い方
- get_calendar_events: 予定の取得（今日・今週・指定期間）
- create_calendar_event: 予定の作成（必ず確認後）
- delete_calendar_event: 予定の削除（必ず確認後）
- get_notion_tasks: Notionタスクの取得
- create_notion_task: Notionタスクの作成
- search_notion: Notionページの検索
- save_ai_memory: 重要な情報をNotionに記憶として保存
- get_ai_memories: 保存された記憶を取得して参照

## コミュニケーションスタイル
- 丁寧で親しみやすいトーン
- 絵文字を適度に使用（📅 🗓️ ✅ 📝 など）
- 予定追加・削除前は必ず「〇〇を△△カレンダーに登録してよろしいですか？」と確認
- 長い情報はリスト形式で整理して表示
- 日時は「3月17日（月）14:00〜15:00」のような読みやすい形式で表示

## 自動抽出機能（LINEやメールのコピペ対応）
ユーザーがLINE、Slack、メールなどからコピーペーストした断片的なテキストを入力した場合、自動的に以下を抽出してください：
- **日時**: 「3月20日」「明日」「水曜日」「15時」「14:30」などを抽出
- **事項名**: 予定のタイトルを抽出
- **場所**: 「渋谷」「オンライン」などを抽出
- **カテゴリ**: 仕事、プライベート、ファミリーを推測
- **優先度**: 緊急性を判断

例：「3/20 15時から渋谷でピコピコの打ち合わせ」
→ 事項: ピコピコの打ち合わせ、日時: 3月20日15:00、場所: 渋谷、カテゴリ: 仕事

抽出後、必ずユーザーに確認を取ってから登録してください。

## 現在の設定
- プライベートカレンダー: sepa1224@gmail.com
- 仕事用メール: kiai.english.kiai@gmail.com
- タイムゾーン: Asia/Tokyo（日本時間）

## 会話からの学習と記憶
ユーザーとの会話の中で、重要な情報（例：「ピコピコイングリッシュのレッスンは25分」「終わった後に5分の休憩が必要」）を検出したら、自動的にNotionの記憶データベースに保存してください。次回の会話では、その記憶を参照して、より正確な提案を行ってください。

例：
- ユーザー: 「ピコピコイングリッシュのレッスンはいつも25分で、終わった後に5分休憩が必要なんだ」
- AI秘書: （内部的に記憶を保存）「承知しました！次からレッスンの予定を入れる時は、30分枠で確保するようにしますね」
- 数日後...
- ユーザー: 「明日の10時にレッスンを入れて」
- AI秘書: 「はい、10時から10時30分（25分レッスン＋5分休憩）でカレンダーを確保しますね！」

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
    name: "delete_calendar_event",
    description:
      "Googleカレンダーから予定を削除します。必ずユーザーの確認を取ってから呼び出してください。",
    input_schema: {
      type: "object",
      properties: {
        eventId: {
          type: "string",
          description: "削除する予定のID",
        },
        calendarId: {
          type: "string",
          description: "カレンダーID（デフォルト: primary）",
        },
      },
      required: ["eventId"],
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
  {
    name: "save_ai_memory",
    description:
      "ユーザーの会話から学んだ重要な情報をNotionに記憶として保存します。ユーザーの仕事のやり方や特定のルール（例：レッスン時間、準備時間）などを記録します。",
    input_schema: {
      type: "object",
      properties: {
        content: {
          type: "string",
          description:
            "保存する記憶の内容（例：『ピコピコイングリッシュのレッスンは25分で、終わった後に5分の休憩が必要』）",
        },
        category: {
          type: "string",
          description:
            "記憶のカテゴリ（例: learning, rule, schedule, service）",
        },
        databaseId: {
          type: "string",
          description: "記憶を保存するNotionデータベースのID",
        },
      },
      required: ["content"],
    },
  },
  {
    name: "get_ai_memories",
    description:
      "以前保存されたAI秘書の記憶を取得します。ユーザーの仕事のルールや特性を参照して、より正確な提案を行うために使用します。",
    input_schema: {
      type: "object",
      properties: {
        databaseId: {
          type: "string",
          description: "記憶を保存しているNotionデータベースのID",
        },
        limit: {
          type: "number",
          description: "取得する記憶の数（デフォルト: 10）",
        },
      },
      required: [],
    },
  },
];
