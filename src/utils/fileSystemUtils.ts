/**
 * ファイルシステム関連の拡張ユーティリティ
 * 新しいデータ構造（CSV形式）に対応するためのファイル操作関数
 */

import { Task, Tag, TaskTag } from '../types';
import { 
  getOrCreateDirectoryByPath, 
  getOrCreateFileHandle, 
  readFile, 
  writeFile 
} from './fileSystem';
import { 
  DATA_FILES, 
  tasksToCSV, 
  csvToTasks, 
  tagsToCSV, 
  csvToTags, 
  taskTagsToCSV, 
  csvToTaskTags 
} from './dataUtils';

/**
 * タスクデータファイルを読み込む
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param taskFolderPath タスクフォルダのパス
 * @returns タスクの配列
 */
export const readTasksFile = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  taskFolderPath: string
): Promise<Task[]> => {
  try {
    // タスクフォルダのハンドルを取得
    const taskDirHandle = await getOrCreateDirectoryByPath(vaultDirHandle, taskFolderPath);
    if (!taskDirHandle) {
      throw new Error(`タスクフォルダ ${taskFolderPath} が見つかりません`);
    }

    // タスクファイルのハンドルを取得
    const fileHandle = await getOrCreateFileHandle(taskDirHandle, DATA_FILES.TASKS);
    
    // ファイルの内容を読み込む
    let content = '';
    try {
      content = await readFile(fileHandle);
    } catch (error) {
      console.log('タスクファイルが存在しないか、読み込めません。新規作成します。');
      return [];
    }
    
    // CSVからタスクデータに変換
    return csvToTasks(content);
  } catch (error) {
    console.error('タスクファイルの読み込み中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * タスクデータをファイルに書き込む
 * @param tasks タスクの配列
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param taskFolderPath タスクフォルダのパス
 */
export const writeTasksFile = async (
  tasks: Task[],
  vaultDirHandle: FileSystemDirectoryHandle,
  taskFolderPath: string
): Promise<void> => {
  try {
    // タスクフォルダのハンドルを取得
    const taskDirHandle = await getOrCreateDirectoryByPath(vaultDirHandle, taskFolderPath);
    if (!taskDirHandle) {
      throw new Error(`タスクフォルダ ${taskFolderPath} が見つかりません`);
    }

    // タスクファイルのハンドルを取得
    const fileHandle = await getOrCreateFileHandle(taskDirHandle, DATA_FILES.TASKS);
    
    // タスクデータをCSVに変換
    const csvContent = tasksToCSV(tasks);
    
    // ファイルに書き込む
    await writeFile(fileHandle, csvContent);
  } catch (error) {
    console.error('タスクファイルの書き込み中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * ファイルハンドルを取得する
 * @param dirHandle ディレクトリハンドル
 * @param fileName ファイル名
 * @param create ファイルが存在しない場合に作成するかどうか
 * @returns ファイルハンドル
 */
export const getFileHandle = async (
  dirHandle: FileSystemDirectoryHandle,
  fileName: string,
  create: boolean = true
): Promise<FileSystemFileHandle> => {
  try {
    // ディレクトリハンドルの検証
    if (!dirHandle) {
      console.error('ディレクトリハンドルが存在しません:', dirHandle);
      throw new Error('保管庫が選択されていません。設定画面から保管庫を選択してください。');
    }
    
    // ディレクトリハンドルがオブジェクトか確認
    if (typeof dirHandle !== 'object' || dirHandle === null) {
      console.error('無効なディレクトリハンドルです（オブジェクトではありません）:', dirHandle);
      throw new Error('保管庫へのアクセス権限が失われました。設定画面から保管庫を再選択してください。');
    }
    
    // getFileHandleメソッドが存在するか確認
    if (typeof dirHandle.getFileHandle !== 'function') {
      console.error('無効なディレクトリハンドルです（getFileHandleメソッドが存在しません）:', dirHandle);
      throw new Error('保管庫へのアクセス権限が失われました。設定画面から保管庫を再選択してください。');
    }
    
    // 必要なプロパティが存在するか確認
    if (!('kind' in dirHandle) || dirHandle.kind !== 'directory') {
      console.error('無効なディレクトリハンドルです（kindプロパティが不正です）:', dirHandle);
      throw new Error('保管庫へのアクセス権限が失われました。設定画面から保管庫を再選択してください。');
    }
  } catch (error) {
    console.error('ディレクトリハンドルの検証中にエラーが発生しました:', error);
    throw new Error('保管庫へのアクセス権限に問題があります。設定画面から保管庫を再選択してください。');
  }
  
  // ファイル名の検証
  if (!fileName || fileName.trim() === '') {
    throw new Error('ファイル名が空です。');
  }
  
  try {
    return await dirHandle.getFileHandle(fileName, { create });
  } catch (error) {
    console.error(`ファイル ${fileName} の取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * テキストファイルを読み込む
 * @param fileHandle ファイルハンドル
 * @returns ファイルの内容
 */
export const readTextFile = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  return readFile(fileHandle);
};

/**
 * テキストファイルに書き込む
 * @param fileHandle ファイルハンドル
 * @param content 書き込む内容
 */
export const writeTextFile = async (fileHandle: FileSystemFileHandle, content: string): Promise<void> => {
  return writeFile(fileHandle, content);
};

/**
 * タグデータファイルを読み込む
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param taskFolderPath タスクフォルダのパス
 * @returns タグの配列
 */
export const readTagsFile = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  taskFolderPath: string
): Promise<Tag[]> => {
  try {
    // タスクフォルダのハンドルを取得
    const taskDirHandle = await getOrCreateDirectoryByPath(vaultDirHandle, taskFolderPath);
    if (!taskDirHandle) {
      throw new Error(`タスクフォルダ ${taskFolderPath} が見つかりません`);
    }

    // タグファイルのハンドルを取得
    const fileHandle = await getOrCreateFileHandle(taskDirHandle, DATA_FILES.TAGS);
    
    // ファイルの内容を読み込む
    let content = '';
    try {
      content = await readFile(fileHandle);
    } catch (error) {
      console.log('タグファイルが存在しないか、読み込めません。新規作成します。');
      return [];
    }
    
    // CSVからタグデータに変換
    return csvToTags(content);
  } catch (error) {
    console.error('タグファイルの読み込み中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * タグデータをファイルに書き込む
 * @param tags タグの配列
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param taskFolderPath タスクフォルダのパス
 */
export const writeTagsFile = async (
  tags: Tag[],
  vaultDirHandle: FileSystemDirectoryHandle,
  taskFolderPath: string
): Promise<void> => {
  try {
    // タスクフォルダのハンドルを取得
    const taskDirHandle = await getOrCreateDirectoryByPath(vaultDirHandle, taskFolderPath);
    if (!taskDirHandle) {
      throw new Error(`タスクフォルダ ${taskFolderPath} が見つかりません`);
    }

    // タグファイルのハンドルを取得
    const fileHandle = await getOrCreateFileHandle(taskDirHandle, DATA_FILES.TAGS);
    
    // タグデータをCSVに変換
    const csvContent = tagsToCSV(tags);
    
    // ファイルに書き込む
    await writeFile(fileHandle, csvContent);
  } catch (error) {
    console.error('タグファイルの書き込み中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * タスク-タグ関連付けデータファイルを読み込む
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param taskFolderPath タスクフォルダのパス
 * @returns タスク-タグ関連付けの配列
 */
export const readTaskTagsFile = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  taskFolderPath: string
): Promise<TaskTag[]> => {
  try {
    // タスクフォルダのハンドルを取得
    const taskDirHandle = await getOrCreateDirectoryByPath(vaultDirHandle, taskFolderPath);
    if (!taskDirHandle) {
      throw new Error(`タスクフォルダ ${taskFolderPath} が見つかりません`);
    }

    // タスク-タグ関連付けファイルのハンドルを取得
    const fileHandle = await getOrCreateFileHandle(taskDirHandle, DATA_FILES.TASK_TAGS);
    
    // ファイルの内容を読み込む
    let content = '';
    try {
      content = await readFile(fileHandle);
    } catch (error) {
      console.log('タスク-タグ関連付けファイルが存在しないか、読み込めません。新規作成します。');
      return [];
    }
    
    // CSVからタスク-タグ関連付けデータに変換
    return csvToTaskTags(content);
  } catch (error) {
    console.error('タスク-タグ関連付けファイルの読み込み中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * タスク-タグ関連付けデータをファイルに書き込む
 * @param taskTags タスク-タグ関連付けの配列
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param taskFolderPath タスクフォルダのパス
 */
export const writeTaskTagsFile = async (
  taskTags: TaskTag[],
  vaultDirHandle: FileSystemDirectoryHandle,
  taskFolderPath: string
): Promise<void> => {
  try {
    // タスクフォルダのハンドルを取得
    const taskDirHandle = await getOrCreateDirectoryByPath(vaultDirHandle, taskFolderPath);
    if (!taskDirHandle) {
      throw new Error(`タスクフォルダ ${taskFolderPath} が見つかりません`);
    }

    // タスク-タグ関連付けファイルのハンドルを取得
    const fileHandle = await getOrCreateFileHandle(taskDirHandle, DATA_FILES.TASK_TAGS);
    
    // タスク-タグ関連付けデータをCSVに変換
    const csvContent = taskTagsToCSV(taskTags);
    
    // ファイルに書き込む
    await writeFile(fileHandle, csvContent);
  } catch (error) {
    console.error('タスク-タグ関連付けファイルの書き込み中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * デイリーノートのファイルハンドルを取得
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param dailyNoteFolderPath デイリーノートフォルダのパス
 * @param dateFormat 日付フォーマット
 * @param date 日付オブジェクト
 * @returns ファイルハンドル
 */
export const getDailyNoteFileHandle = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  dailyNoteFolderPath: string,
  dateFormat: string,
  date: Date = new Date()
): Promise<FileSystemFileHandle> => {
  try {
    // デイリーノートフォルダのハンドルを取得
    const dailyNoteDirHandle = await getOrCreateDirectoryByPath(vaultDirHandle, dailyNoteFolderPath);
    if (!dailyNoteDirHandle) {
      throw new Error(`デイリーノートフォルダ ${dailyNoteFolderPath} が見つかりません`);
    }

    // 日付を指定フォーマットに変換
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    // デイリーノートのファイル名を生成
    const fileName = dateFormat
      .replace('YYYY', year.toString())
      .replace('MM', month)
      .replace('DD', day)
      .replace('M', String(date.getMonth() + 1))
      .replace('D', String(date.getDate()))
      + '.md';
    
    // ファイルハンドルを取得
    return await getOrCreateFileHandle(dailyNoteDirHandle, fileName);
  } catch (error) {
    console.error('デイリーノートファイルの取得中にエラーが発生しました:', error);
    throw error;
  }
};
