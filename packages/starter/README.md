# @wp2astro/starter

Astro 5 + Tailwind CSS v4 + Sanity + Cloudflare Pages のスターター。
完全静的化（SSG）で配信し、お問い合わせフォームのみ Cloudflare Pages Functions + Resend で動的化します。

## セットアップ

### 1. Sanityプロジェクト作成

[manage.sanity.io](https://www.sanity.io/manage) でプロジェクトを作成し、`projectId` を控えます。

### 2. 環境変数

```bash
cp .env.example .env
cp .dev.vars.example .dev.vars
```

`.env` に `PUBLIC_SANITY_PROJECT_ID` を設定。
`.dev.vars` には Resend のAPIキーと送信元/送信先メールを設定（ローカル `wrangler pages dev` 用）。

### 3. 依存インストール

リポジトリのルートで:

```bash
pnpm install
```

### 4. 開発サーバー

```bash
# Astro dev (Sanityから読み取って表示)
pnpm dev

# Sanity Studio（コンテンツ編集UI）
pnpm studio

# Cloudflare Pages Functions込みでプレビュー
pnpm build && pnpm preview:cf
```

## デプロイ（Cloudflare Pages）

1. GitHubと連携し、本リポジトリを Cloudflare Pages にインポート
2. ビルド設定:
   - Framework preset: `Astro`
   - Build command: `pnpm install --frozen-lockfile && pnpm --filter @wp2astro/starter build`
   - Build output directory: `packages/starter/dist`
   - Root directory: `/`
3. 環境変数（Production / Preview両方に設定）:
   - `PUBLIC_SANITY_PROJECT_ID`
   - `PUBLIC_SANITY_DATASET`
   - `PUBLIC_SITE_URL`
   - `RESEND_API_KEY`（暗号化）
   - `CONTACT_TO_EMAIL`
   - `CONTACT_FROM_EMAIL`

## Sanity Studio の運用

- ローカル: `pnpm studio`（http://localhost:3333）
- 本番: `pnpm studio:deploy` で `<projectName>.sanity.studio` に無料ホスト

## ファイル構成

```
packages/starter/
├── astro.config.mjs
├── sanity.config.ts          # Sanity Studioスキーマ統合
├── functions/
│   └── api/contact.ts        # Cloudflare Pages Function
├── public/
└── src/
    ├── components/
    ├── layouts/
    ├── pages/
    ├── sanity/
    │   ├── client.ts
    │   ├── queries.ts        # GROQクエリ
    │   ├── schemas/          # コンテンツモデル定義
    │   └── types.ts
    └── styles/
```
