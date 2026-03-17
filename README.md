# AI秘書 - スマートアシスタント

Google CalendarとNotionをAIで自然言語操作できるWebアプリです。

## 技術スタック

- **フレームワーク**: Next.js 14 (App Router)
- **言語**: TypeScript
- **スタイル**: Tailwind CSS
- **AI**: Claude API (claude-sonnet-4-5)
- **認証**: NextAuth.js + Google OAuth
- **カレンダー**: Google Calendar API
- **タスク管理**: Notion API
- **ホスティング**: Vercel

## セットアップ手順

### 1. リポジトリのクローン

```bash
git clone https://github.com/YOUR_USERNAME/ai-secretary.git
cd ai-secretary
npm install
```

### 2. 環境変数の設定

`.env.local.example` をコピーして `.env.local` を作成し、各値を設定します。

```bash
cp .env.local.example .env.local
```

### 3. Google Cloud Console の設定

1. [Google Cloud Console](https://console.cloud.google.com) にアクセス
2. 新しいプロジェクトを作成（または既存のプロジェクトを選択）
3. **APIとサービス** → **ライブラリ** から以下を有効化:
   - Google Calendar API
4. **APIとサービス** → **認証情報** → **認証情報を作成** → **OAuth 2.0 クライアントID**
5. アプリケーションの種類: **ウェブアプリケーション**
6. 承認済みリダイレクトURIに追加:
   - `http://localhost:3000/api/auth/callback/google`（開発環境）
   - `https://YOUR_DOMAIN.vercel.app/api/auth/callback/google`（本番環境）
7. クライアントIDとクライアントシークレットをコピー

### 4. Notion API の設定

1. [Notion Integrations](https://www.notion.so/my-integrations) にアクセス
2. **New integration** をクリック
3. インテグレーション名を入力（例: AI秘書）
4. APIキーをコピー
5. 連携したいNotionデータベースのページを開く
6. 右上の「...」→「接続」→ 作成したインテグレーションを選択
7. データベースIDをURLからコピー（`https://www.notion.so/DATABASE_ID?v=...`）

### 5. Anthropic API の設定

1. [Anthropic Console](https://console.anthropic.com) にアクセス
2. APIキーを作成してコピー

### 6. NEXTAUTH_SECRET の生成

```bash
openssl rand -base64 32
```

### 7. 開発サーバーの起動

```bash
npm run dev
```

## Vercel デプロイ

### 環境変数の設定

Vercelダッシュボードで以下の環境変数を設定してください:

| 変数名 | 説明 |
|--------|------|
| `ANTHROPIC_API_KEY` | Anthropic APIキー |
| `GOOGLE_CLIENT_ID` | Google OAuth クライアントID |
| `GOOGLE_CLIENT_SECRET` | Google OAuth クライアントシークレット |
| `NEXTAUTH_SECRET` | NextAuth シークレット（ランダム文字列） |
| `NEXTAUTH_URL` | デプロイされたURL（例: https://your-app.vercel.app） |
| `NOTION_API_KEY` | Notion APIキー |
| `NOTION_DATABASE_ID` | NotionデータベースID |
| `PRIVATE_CALENDAR_ID` | プライベートカレンダーID（メールアドレス） |
| `WORK_EMAIL` | 仕事用メールアドレス（インビテーション送付先） |

## 機能

### チャットUI
- LINEライクなチャット画面
- クイックアクションボタン（今日の予定・今週の予定・タスク確認・予定追加）
- タイピングインジケーター

### Google Calendar 連携
- 予定の読み取り（今日・今週・指定期間）
- 予定の追加（プライベート / 仕事 / ファミリー）
- 仕事の予定は自動でインビテーション送付

### Notion 連携
- タスク一覧の取得・表示
- タスクの追加
- ページの検索

## カレンダー登録ルール

| カテゴリ | 動作 |
|---------|------|
| 👤 プライベート | メインカレンダーに登録 |
| 🏢 仕事 | メインカレンダーに登録 + 仕事用メールにインビテーション |
| 👨‍👩‍👧 ファミリー | ファミリーカレンダーに登録 |

> 予定を追加する際は必ずユーザーに確認してから登録します。
