/**
 * 同期に関するサービス
 */
import { Task } from '../types';
import { readTasksFile, writeTasksFile } from '../utils/fileSystemUtils';
import { mergeTasks } from './taskService';

/**
 * タスクを保管庫と同期する
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param taskFolderPath タスクフォルダのパス
 * @param localTasks ローカルのタスク
 * @param isFirstSync 初回同期かどうか
 * @returns 同期後のタスクと変更有無
 */
export const syncTasksWithVault = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  taskFolderPath: string,
  localTasks: Task[],
  isFirstSync: boolean = false
): Promise<{ mergedTasks: Task[], hasChanges: boolean }> => {
  // 保管庫からタスクを読み込む
  const fileTasks = await readTasksFile(vaultDirHandle, taskFolderPath);
  console.log(`保管庫から読み込んだタスク数: ${fileTasks.length}`);
  console.log(`ローカルのタスク数: ${localTasks.length}`);
  
  let mergedTasks: Task[] = [];
  let hasChanges = false;
  
  // 同期の方向性を決定
  if (isFirstSync) {
    // 初回同期の場合：ファイルからアプリへの同期を優先
    console.log('初回同期: 保管庫ファイルからアプリへの同期を優先します');
    if (fileTasks.length > 0) {
      // ファイルにタスクがある場合は、それを優先
      mergedTasks = [...fileTasks];
    } else if (localTasks.length > 0) {
      // ファイルにタスクがなく、アプリにタスクがある場合は、アプリのタスクをファイルに書き込む
      console.log('保管庫にタスクがないため、アプリのタスクを保管庫に書き込みます');
      mergedTasks = localTasks;
    } else {
      // 両方にタスクがない場合は空の配列
      mergedTasks = [];
    }
  } else {
    // 通常の同期：アプリと保管庫のタスクをマージ
    console.log('タスクのマージを行います');
    const mergeResult = mergeTasks(localTasks, fileTasks);
    mergedTasks = mergeResult.mergedTasks;
    hasChanges = mergeResult.hasChanges;
  }
  
  console.log(`マージ後のタスク数: ${mergedTasks.length}`);
  
  // マージしたタスクを保管庫に書き込む
  await writeTasksFile(mergedTasks, vaultDirHandle, taskFolderPath);
  
  // 初回同期の場合やファイルから読み込んだタスク数が異なる場合は変更ありとみなす
  if (isFirstSync || localTasks.length !== mergedTasks.length) {
    hasChanges = true;
  }
  
  return {
    mergedTasks,
    hasChanges
  };
};

/**
 * デイリーノートからのステータス変更を検出する
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param dailyNoteFolderPath デイリーノートフォルダのパス
 * @param dailyNoteFormat デイリーノートの日付フォーマット
 * @param tasks タスクリスト
 * @returns ステータスが変更されたタスク
 */
export const detectStatusChangesFromDailyNote = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  dailyNoteFolderPath: string,
  dailyNoteFormat: string,
  tasks: Task[]
): Promise<Task[]> => {
  try {
    // ここにデイリーノートからのステータス変更検出ロジックを実装
    // 現在は単純に空の配列を返す
    return [];
  } catch (error) {
    console.error('デイリーノートからのステータス変更検出中にエラーが発生しました:', error);
    return [];
  }
};