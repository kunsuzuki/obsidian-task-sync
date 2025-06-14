# Obsidian Task Sync

Obsidianと同期するタスク管理Webアプリケーションです。File System Access APIを使用して、Obsidianの保管庫内のマークダウンファイルとタスクを同期します。

## 機能

- **タスク管理**: タスクの作成、編集、削除、ステータス管理（未着手、進行中、完了）
- **Obsidian同期**: File System Access APIを使用して保管庫のマークダウンファイルと同期
- **差分同期**: 手動同期ボタン、起動時同期、フォーカス時同期、定期的な自動同期
- **デイリーノート同期**: タスクをデイリーノートの特定セクションに同期
- **ノート作成**: タスクに関連するノートの作成とリンク
- **カスタマイズ可能な設定**: 保管庫パス、フォルダ構造、同期間隔などの設定

## 使い方

### インストールと起動

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev
```

### 初期設定

1. アプリを起動し、「設定」タブに移動します
2. 「Obsidian保管庫」の「選択」ボタンをクリックして、Obsidianの保管庫フォルダを選択します
3. タスクの保存先フォルダ、ノートの保存先フォルダ、デイリーノートの設定などを必要に応じて変更します
4. 「今すぐ同期」ボタンをクリックして初回同期を実行します

### タスク管理

1. 「タスク管理」タブで「新しいタスク」ボタンをクリックしてタスクを作成します
2. タスク名、ステータス、納期、タグ、ノートリンクを入力します
3. タスクはObsidianの保管庫内に保存され、設定に応じて自動的に同期されます

## 技術スタック

- **フロントエンド**: Next.js、React、TypeScript、Tailwind CSS
- **ファイルアクセス**: File System Access API
- **状態管理**: React Context API
- **マークダウン処理**: marked
- **UI/UX**: Tailwind CSS（Notion風テーマ）

## ブラウザ対応

File System Access APIを使用しているため、以下のブラウザでのみ動作します：

- Google Chrome (バージョン86以降)
- Microsoft Edge (バージョン86以降)
- Opera (バージョン72以降)

Firefox、Safari、iOS/Androidのモバイルブラウザでは現在サポートされていません。

## 注意事項

- このアプリはローカルファイルにアクセスするため、HTTPSまたはlocalhost環境で実行する必要があります
- 初回アクセス時にファイルシステムへのアクセス許可を求められます
- 大量のファイルを含む保管庫では同期に時間がかかる場合があります

## 準備が必要なこと

1. Obsidianがインストールされていること
2. 対応ブラウザ（Chrome、Edge、Operaの最新版）を使用すること
3. ローカル環境でアプリを実行すること（`npm run dev`）

## ライセンス

MIT
