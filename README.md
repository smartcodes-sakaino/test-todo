# 日報帳

Todoタスクを管理し、今日完了したタスクをもとに日報の文面を作成できる個人用アプリ。Cloudflare Pages(静的フロントエンド + Pages Functions)+ Cloudflare D1で構成する。

設計の詳細は [`../設計書/`](../設計書/) を参照。

## セットアップ

```bash
npm install
```

初回のみ、Cloudflareアカウントでログインし、D1データベースを作成する。

```bash
npx wrangler login
npx wrangler d1 create nippouchou-db
```

表示された `database_id` を `wrangler.jsonc` の `REPLACE_WITH_REAL_DATABASE_ID` に貼り付ける。

## ローカル開発

```bash
npm run db:migrate:local   # ローカルDBにテーブルを作成
npm run dev                # http://127.0.0.1:8788 で起動
```

## テスト

```bash
npm test
```

## デプロイ

```bash
npm run db:migrate:remote  # 本番D1にテーブルを作成(初回のみ)
npm run deploy
```
