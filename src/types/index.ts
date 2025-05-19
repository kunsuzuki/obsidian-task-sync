// タスクのステータス定義
// 1: 未着手, 2: 進行中, 3: 完了
export type TaskStatus = 1 | 2 | 3;

// ステータスの定数定義
export const TASK_STATUS = {
  NOT_STARTED: 1 as TaskStatus,
  IN_PROGRESS: 2 as TaskStatus,
  COMPLETED: 3 as TaskStatus
};

// ステータスの表示名
export const TASK_STATUS_LABELS = {
  [TASK_STATUS.NOT_STARTED]: '未着手',
  [TASK_STATUS.IN_PROGRESS]: '進行中',
  [TASK_STATUS.COMPLETED]: '完了'
};

// タスクの型定義
export interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  dueDate?: string | null; // YYYY-MM-DD形式
  linkedNote?: string | null; // リンクされたノートの名前
  createdAt: string;
  updatedAt: string;
  completedAt?: string | null;
}

// タグの型定義
export interface Tag {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

// タスクとタグの関連付けの型定義
export interface TaskTag {
  id: string;
  taskId: string;
  tagId: string;
  createdAt: string;
}

// ノートの型定義
export interface Note {
  id: string;
  title: string;
  content: string;
  linkedTaskId?: string;
  createdAt: string;
  updatedAt: string;
}

// アプリケーション設定の型定義
export interface AppSettings {
  vaultPath: string; // Obsidian保管庫のパス
  taskFolderPath: string; // タスクファイルの保存先フォルダ
  noteFolderPath: string; // ノートファイルの保存先フォルダ
  dailyNoteEnabled: boolean; // デイリーノート機能を有効にするか
  dailyNoteFolderPath: string; // デイリーノートのフォルダパス
  dailyNoteFormat: string; // デイリーノートのファイル名フォーマット（例: 'YYYY-MM-DD'）
  dailyNoteTaskSection: string; // デイリーノートのタスクセクション（例: '### Tasks'）
  dailyNoteTemplate: string; // デイリーノートのテンプレート
  syncInterval: number; // 自動同期の間隔（秒）
  syncOnStartup: boolean; // 起動時に同期するか
  syncOnFocus: boolean; // フォーカス時に同期するか
  syncAllTasksToDailyNote: boolean; // 全てのタスクをデイリーノートに同期するか（falseの場合は今日のタスクのみ）
  noteTemplate: string; // ノートのテンプレート
  autoSync: boolean; // 自動同期を有効にするか
}

// ファイルハンドルの型定義
export interface FileHandleCache {
  [path: string]: FileSystemFileHandle;
}

// ディレクトリハンドルの型定義
export interface DirectoryHandleCache {
  [path: string]: FileSystemDirectoryHandle;
}

// 同期状態の型定義
export interface SyncState {
  lastSynced: string | null;
  isSyncing: boolean;
  error: string | null;
}