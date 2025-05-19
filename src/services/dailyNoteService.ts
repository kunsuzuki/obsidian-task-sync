/**
 * デイリーノート関連のサービス
 */
import { Task } from '../types';
import { detectTaskStatusChangesFromDailyNote, updateDailyNoteWithTasks } from '../utils/dailyNoteUtils';
import { getUncompletedTasks } from './taskService';

/**
 * デイリーノートを更新する
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param tasks タスクリスト
 * @param dailyNoteFolderPath デイリーノートフォルダのパス
 * @param dailyNoteFormat デイリーノートの日付フォーマット
 * @param dailyNoteTemplate デイリーノートのテンプレート
 * @returns 成功したかどうか
 */
export const updateDailyNote = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  tasks: Task[],
  dailyNoteFolderPath: string,
  dailyNoteFormat: string = 'YYYY-MM-DD',
  dailyNoteTemplate?: string
): Promise<boolean> => {
  try {
    // 未完了タスク（未着手・進行中）を取得
    const uncompletedTasks = getUncompletedTasks(tasks);

    // デイリーノートの設定を保存
    localStorage.setItem('obsidian-task-sync-settings', JSON.stringify({
      dailyNoteFolderPath,
      dailyNoteFormat,
      dailyNoteTemplate
    }));
    
    // デイリーノートを更新
    await updateDailyNoteWithTasks(
      vaultDirHandle,
      uncompletedTasks
    );

    console.log('デイリーノートを更新しました');
    return true;
  } catch (error) {
    console.error('デイリーノートの更新中にエラーが発生しました:', error);
    return false;
  }
};

/**
 * デイリーノートからタスクのステータス変更を検出する
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param tasks タスクリスト
 * @param dailyNoteFolderPath デイリーノートフォルダのパス
 * @param dailyNoteFormat デイリーノートの日付フォーマット
 * @returns ステータスが変更されたタスク
 */
export const detectTaskStatusChanges = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  tasks: Task[],
  dailyNoteFolderPath: string,
  dailyNoteFormat: string = 'YYYY-MM-DD'
): Promise<Task[]> => {
  try {
    // デイリーノートからステータス変更を検出
    const updatedTasks = await detectTaskStatusChangesFromDailyNote(
      vaultDirHandle,
      dailyNoteFolderPath,
      dailyNoteFormat,
      tasks
    );

    if (updatedTasks.length > 0) {
      console.log(`デイリーノートから${updatedTasks.length}件のタスクステータス変更を検出しました`);
    }

    return updatedTasks;
  } catch (error) {
    console.error('デイリーノートからのステータス変更検出中にエラーが発生しました:', error);
    return [];
  }
};
