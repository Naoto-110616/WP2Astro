# @wp2astro/migrator

WordPressのエクスポートXML（WXR）からSanityへ、コンテンツ・画像・著者・カテゴリを移行するCLI。

## 使い方

### 1. WordPressからエクスポート

WP管理画面 → ツール → エクスポート → 「すべてのコンテンツ」 → XMLをダウンロード。

### 2. Sanity APIトークンを作成

[manage.sanity.io](https://www.sanity.io/manage) → プロジェクト → API → Tokens → 「Editor」権限のトークンを発行。

### 3. ドライラン（XMLパース確認のみ）

```bash
pnpm --filter @wp2astro/migrator start migrate \
  --input ./wxr-input/site.xml \
  --dry-run
```

`migrator-output/parsed.json` に解析結果が出力されます。

### 4. 本番移行

```bash
pnpm --filter @wp2astro/migrator start migrate \
  --input ./wxr-input/site.xml \
  --project-id <SANITY_PROJECT_ID> \
  --dataset production \
  --token <SANITY_TOKEN>
```

または環境変数で:

```bash
export SANITY_PROJECT_ID=xxx
export SANITY_TOKEN=xxx
pnpm --filter @wp2astro/migrator start migrate -i ./wxr-input/site.xml
```

## オプション

| フラグ | 説明 | デフォルト |
|---|---|---|
| `-i, --input` | WXR XMLパス | (必須) |
| `-p, --project-id` | Sanity Project ID | `$SANITY_PROJECT_ID` |
| `-d, --dataset` | Sanity Dataset | `production` |
| `-t, --token` | Sanity APIトークン | `$SANITY_TOKEN` |
| `--post-type` | `post` / `page` / `all` | `post` |
| `--skip-images` | 画像移行をスキップ | `false` |
| `--concurrency` | 画像並列ダウンロード数 | `4` |
| `--dry-run` | パースのみ・書き込みなし | `false` |

## 動作

1. WXRをパース（fast-xml-parser）
2. 著者・カテゴリをSanityに `createOrReplace` で投入（IDは安定キーを使用）
3. 本文中の画像URLを抽出してSanity Assetにアップロード
4. WordPressのHTMLをPortable Textに変換（`@sanity/block-tools` + `jsdom`）
5. 投稿・ページをSanityに投入

## 制限・注意

- **冪等性**: 同じWordPress IDの投稿は `createOrReplace` で上書きされます。再実行可能。
- **HTML変換の限界**: WPのGutenbergブロック特殊シンタックスは除去のみ。複雑なshortcodeは手動修正が必要な場合あり。
- **画像**: 認証必要なURLは取得できません。事前にWPメディアを公開しておいてください。
- **大規模移行**: 数千記事規模では `--concurrency` を上げる前にSanityレート制限に注意。

## トラブルシューティング

- `Failed to download xxx`: 画像URLが404 → 元WPの記事から画像URLを直接確認
- `htmlToBlocks` 警告: 未知のHTMLタグ → 安全に無視されます
- 文字化け: WXRがUTF-8でない場合は事前に変換してください
