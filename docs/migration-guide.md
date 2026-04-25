# WordPress 移行ガイド

WordPressサイトをWP2Astroスタックに移行する手順を、開始から本番リリースまでまとめます。

## 全体フロー

```
[WordPress] ──Export(WXR)──> [migrator] ──API──> [Sanity] ──Build──> [Cloudflare Pages]
                                                              ↑
                                                      [Astro Starter]
```

## ステップ

### 1. WordPress側の準備

1. プラグイン整理（移行対象のコンテンツのみ残す）
2. メディア（画像）が公開URLでアクセス可能であることを確認
3. パーマリンク構造を控える（例: `/blog/%postname%/`）→ リダイレクト設計に使用
4. 管理画面 → ツール → エクスポート → 「すべてのコンテンツ」を選択 → XMLダウンロード

### 2. Sanity側の準備

1. [manage.sanity.io](https://www.sanity.io/manage) でプロジェクト作成
2. `projectId` をメモ
3. API → Tokens → 「Editor」権限で新規トークンを発行
4. API → CORS origins で `http://localhost:*` を許可

### 3. ローカル環境

```bash
git clone <your-fork-url> WP2Astro
cd WP2Astro
pnpm install
cp packages/starter/.env.example packages/starter/.env
# .env を編集: PUBLIC_SANITY_PROJECT_ID 等
```

### 4. スキーマのカスタマイズ（任意）

`packages/starter/src/sanity/schemas/` にあるコンテンツモデルを案件に合わせて調整:

- `post.ts` - ブログ記事
- `page.ts` - 固定ページ
- `category.ts` - カテゴリ
- `author.ts` - 著者
- `siteSettings.ts` - サイト全体設定（ロゴ・ナビ等）

カスタムフィールドが必要なら `defineField` を追加。

### 5. ドライラン（重要）

```bash
mkdir wxr-input
cp ~/Downloads/site.WordPress.YYYY-MM-DD.xml wxr-input/site.xml
pnpm migrate -- migrate -i ./wxr-input/site.xml --dry-run
```

`migrator-output/parsed.json` を確認:
- 記事数・著者数・カテゴリ数が想定通りか
- HTML本文が文字化けしていないか

### 6. 本番移行

```bash
export SANITY_PROJECT_ID=xxx
export SANITY_TOKEN=xxx
pnpm migrate -- migrate -i ./wxr-input/site.xml
```

ログを見て進捗を確認。エラー時は `--skip-images` で画像のみスキップしての試行も可能。

### 7. 動作確認

```bash
pnpm dev
# http://localhost:4321 で表示確認
```

`/blog` に記事一覧、 `/blog/{slug}` で個別ページ。

### 8. リダイレクト設定

WordPressと新サイトでURL構造が変わる場合、`packages/starter/public/_redirects` を作成:

```
# Cloudflare Pages 形式
/old-blog-path/:slug    /blog/:slug    301
/category/:slug         /blog?cat=:slug 301
```

### 9. デプロイ

[deploy-cloudflare.md](./deploy-cloudflare.md) 参照。

### 10. DNS切替

1. Cloudflare Pagesでカスタムドメイン追加・SSL有効化を確認
2. 旧WordPressからのDNS切替（Aレコード or CNAME）
3. 切替後、旧サイトは1〜2週間残してリダイレクト確認

## チェックリスト

- [ ] WordPress XMLエクスポート完了
- [ ] Sanity プロジェクト作成 & APIトークン発行
- [ ] スキーマカスタマイズ
- [ ] ドライラン成功
- [ ] 本番移行成功
- [ ] ローカルで全ページ表示確認
- [ ] リダイレクトルール作成
- [ ] Cloudflare Pages デプロイ
- [ ] Resend ドメイン認証 & 環境変数設定
- [ ] お問い合わせフォーム送信テスト
- [ ] カスタムドメイン設定
- [ ] DNS切替
- [ ] 旧サイトリダイレクト確認

## 移行後のコンテンツ更新

- Sanity Studio (`pnpm --filter @wp2astro/starter studio`) でコンテンツ編集
- 公開後、Cloudflare Pages へ再ビルドを通知（webhook設定推奨、または手動 deploy）
