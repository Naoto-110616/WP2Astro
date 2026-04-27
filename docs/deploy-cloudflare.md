# Cloudflare Pages デプロイ手順

## 前提

- GitHubリポジトリにコードがpushされていること
- Cloudflareアカウント（無料）

## 手順

### 1. Cloudflare Pages プロジェクト作成

1. [Cloudflare Dashboard](https://dash.cloudflare.com/) → Workers & Pages → Create → Pages
2. 「Connect to Git」を選択
3. GitHubアカウントを連携、`WP2Astro` リポジトリを選択

### 2. ビルド設定

| 項目 | 値 |
|---|---|
| Framework preset | `Astro` |
| Build command | `npx pnpm@10 install --frozen-lockfile && npx pnpm@10 --filter @wp2astro/starter build` |
| Build output directory | `packages/starter/dist` |
| Root directory | `/` (空欄) |
| Node version | `22` (環境変数 `NODE_VERSION=22` で指定) |

### 3. 環境変数

「Settings → Environment variables」で以下を設定（Production / Preview両方）:

| 変数名 | 値 | 暗号化 |
|---|---|---|
| `NODE_VERSION` | `22` | — |
| `PUBLIC_SANITY_PROJECT_ID` | (Sanity Project ID) | — |
| `PUBLIC_SANITY_DATASET` | `production` | — |
| `PUBLIC_SITE_URL` | `https://your-domain.com` | — |
| `RESEND_API_KEY` | (Resend APIキー) | ✅ 暗号化 |
| `CONTACT_TO_EMAIL` | 受信したいメールアドレス | — |
| `CONTACT_FROM_EMAIL` | Resendで認証済みドメインのアドレス | — |

### 4. デプロイ実行

「Save and Deploy」をクリック。初回ビルドが走る。

### 5. カスタムドメイン

「Custom domains → Set up a custom domain」でドメインを追加し、CloudflareネームサーバーまたはCNAMEで切替。

## ローカルプレビュー

Pages Functions込みでローカル確認:

```bash
pnpm --filter @wp2astro/starter build
pnpm --filter @wp2astro/starter preview:cf
```

`http://localhost:8788` でアクセス可能。`packages/starter/.dev.vars` がローカルの環境変数として読まれる。

## Resend 設定

1. [resend.com](https://resend.com) でアカウント作成
2. ドメインを追加（DNS TXT/MX/CNAMEレコードを設定）
3. 認証完了後、APIキーを発行
4. Cloudflare Pages の `RESEND_API_KEY` に設定
5. `CONTACT_FROM_EMAIL` は認証済みドメインのアドレスに（例: `noreply@your-domain.com`）

## トラブルシューティング

### `pnpm: command not found`
Build commandの先頭に `npx pnpm@10` を使うか、`packageManager` フィールドが `package.json` に設定されていれば自動検出される。

### Sanityデータが取得できない
- `PUBLIC_SANITY_PROJECT_ID` が正しいか確認
- Sanity管理画面 → API → CORS で `https://*.pages.dev` と本番ドメインを許可

### Pages Function が404
- `packages/starter/functions/` に `api/contact.ts` が存在するか
- Cloudflare Pages の Build output directory が `packages/starter/dist` か（functions ディレクトリは Build output と同じプロジェクトルート直下から検出される）
