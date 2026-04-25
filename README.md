# WP2Astro

WordPressからモダンな静的サイトへの移行を、最短経路で実現するパッケージ。

| | |
|---|---|
| **フロント** | Astro 5 + TypeScript + Tailwind CSS v4 |
| **CMS** | Sanity（無料枠でモデル数無制限・コンテンツ10,000件・ユーザー20人） |
| **ホスティング** | Cloudflare Pages（完全無料・商用OK・帯域無制限） |
| **メール送信** | Resend（無料枠 月3,000通）+ Cloudflare Pages Functions |
| **移行ツール** | WordPress WXR → Sanity 自動移行CLI |

## 構成

```
WP2Astro/
├── packages/
│   ├── starter/      # Astro + Tailwind + Sanity + Resend (Cloudflare Pages デプロイ)
│   └── migrator/     # WXR -> Sanity 移行CLI
├── docs/
└── .github/workflows/
```

## クイックスタート

### 1. インストール

```bash
pnpm install
```

### 2. Sanityプロジェクト作成

[manage.sanity.io](https://www.sanity.io/manage) で新規プロジェクトを作成し、`projectId` を控える。

### 3. 環境変数

```bash
cp packages/starter/.env.example packages/starter/.env
cp packages/starter/.dev.vars.example packages/starter/.dev.vars
# 値を入力
```

### 4. 開発サーバー

```bash
pnpm dev                            # Astro
pnpm --filter @wp2astro/starter studio   # Sanity Studio (http://localhost:3333)
```

### 5. WordPressから移行

```bash
# WP管理画面 -> ツール -> エクスポート で取得した XML を配置
mkdir wxr-input && cp ~/Downloads/site.WordPress.YYYY-MM-DD.xml wxr-input/site.xml

# ドライラン（パース確認）
pnpm migrate -- migrate -i ./wxr-input/site.xml --dry-run

# 本番移行
pnpm migrate -- migrate \
  -i ./wxr-input/site.xml \
  -p <SANITY_PROJECT_ID> \
  -t <SANITY_TOKEN>
```

詳細は [packages/migrator/README.md](packages/migrator/README.md) を参照。

### 6. デプロイ

[docs/deploy-cloudflare.md](docs/deploy-cloudflare.md) 参照。

## 技術選定の理由

### なぜAstro？
- コンテンツ重視サイトに最適化（JSペイロードが極小）
- Markdown/MDX/Sanity等とのインテグレーションが豊富
- Islands Architectureで部分的な動的化も可能
- Cloudflare/Vercel/Netlify全てに公式アダプター

### なぜSanity？
- **無料プランで content type 数が無制限**（microCMS=5、Contentful=25）
- スキーマをコードで定義 → Git管理・バージョニング可能
- TypeScript型生成サポート
- 画像CDN・Imgproxy相当の変換が標準装備
- Studio（管理UI）はsanity.ioに無料ホスト or セルフホスト選択可

### なぜCloudflare Pages？
- 完全無料・商用利用OK・帯域無制限
- ビルド500回/月、同時ビルド5、グローバルCDN
- Pages Functions（Workers）でエッジコンピューティング
- D1, R2, KV等の無料枠拡張も豊富

### なぜResend？
- モダンな開発者向けメールAPI
- 無料枠 100通/日、3,000通/月
- React Emailテンプレート対応
- DNS設定もシンプル

## ライセンス

MIT
