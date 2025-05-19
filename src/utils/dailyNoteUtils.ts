/**
 * デイリーノート関連のユーティリティ関数
 */

import { Task, TASK_STATUS } from '../types';
import { readFile } from './fileSystem';
import { getDailyNoteFileHandle } from './fileSystemUtils';

/**
 * デイリーノートからタスクのステータス変更を検出
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param dailyNoteFolderPath デイリーノートフォルダのパス
 * @param dateFormat 日付フォーマット
 * @param tasks タスクの配列
 * @returns ステータスが変更されたタスクの配列
 */
export const detectTaskStatusChangesFromDailyNote = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  dailyNoteFolderPath: string,
  dateFormat: string,
  tasks: Task[]
): Promise<Task[]> => {
  try {
    // デイリーノートのファイルハンドルを取得
    const dailyNoteFileHandle = await getDailyNoteFileHandle(
      vaultDirHandle,
      dailyNoteFolderPath,
      dateFormat
    );
    
    // デイリーノートの内容を読み込む
    let content = '';
    try {
      content = await readFile(dailyNoteFileHandle);
    } catch (error) {
      console.log('デイリーノートが存在しないか、読み込めません。');
      return [];
    }
    
    // タスクセクションを抽出
    const taskSectionRegex = /## タスク\n\n([\s\S]*?)(?=\n##|$)/;
    const match = content.match(taskSectionRegex);
    if (!match || !match[1]) {
      return [];
    }
    
    const taskSection = match[1];
    const taskLines = taskSection.split('\n').filter(line => line.trim().startsWith('- '));
    
    // ステータス変更を検出
    const updatedTasks: Task[] = [];
    
    for (const task of tasks) {
      // タスクがデイリーノートに存在するか確認
      const taskLine = taskLines.find(line => line.includes(task.title));
      if (!taskLine) continue;
      
      // ステータスマークを確認
      const isCompleted = taskLine.includes('[x]') || taskLine.includes('[X]');
      const isInProgress = taskLine.includes('[/]') || taskLine.includes('[-]');
      const isNotStarted = taskLine.includes('[ ]');
      
      let newStatus = task.status;
      
      if (isCompleted && task.status !== TASK_STATUS.COMPLETED) {
        newStatus = TASK_STATUS.COMPLETED;
      } else if (isInProgress && task.status !== TASK_STATUS.IN_PROGRESS) {
        newStatus = TASK_STATUS.IN_PROGRESS;
      } else if (isNotStarted && task.status !== TASK_STATUS.NOT_STARTED) {
        newStatus = TASK_STATUS.NOT_STARTED;
      } else {
        // ステータスに変更がない場合はスキップ
        continue;
      }
      
      // ステータスが変更された場合は更新
      if (newStatus !== task.status) {
        const updatedTask: Task = {
          ...task,
          status: newStatus,
          updatedAt: new Date().toISOString(),
          ...(newStatus === TASK_STATUS.COMPLETED ? { completedAt: new Date().toISOString() } : {})
        };
        
        updatedTasks.push(updatedTask);
      }
    }
    
    return updatedTasks;
  } catch (error) {
    console.error('デイリーノートからのステータス変更検出中にエラーが発生しました:', error);
    return [];
  }
};

/**
 * タスクのステータスマークを取得
 * @param status タスクのステータス
 * @returns ステータスマーク
 */
export const getTaskStatusMark = (status: Task['status']): string => {
  switch (status) {
    case TASK_STATUS.COMPLETED:
      return '[x] ';
    case TASK_STATUS.IN_PROGRESS:
      return '[/] ';
    case TASK_STATUS.NOT_STARTED:
    default:
      return '[ ] ';
  }
};

/**
 * タスクの表示テキストを生成
 * @param task タスク
 * @returns タスクの表示テキスト
 */
export const formatTaskForDailyNote = (task: Task): string => {
  const statusMark = getTaskStatusMark(task.status);
  const dueDate = task.dueDate ? `📅 ${task.dueDate}` : '';
  const linkedNote = task.linkedNote ? `📎 [[${task.linkedNote}]]` : '';
  
  return `- ${statusMark}${task.title} ${dueDate} ${linkedNote}`;
};

/**
 * デイリーノートのタスクセクションを生成
 * @param tasks タスクの配列
 * @returns タスクセクションのテキスト
 */
export const generateTaskSection = (tasks: Task[]): string => {
  let taskSection = '## タスク\n\n';
  
  if (tasks.length === 0) {
    taskSection += '今日のタスクはありません。\n';
  } else {
    tasks.forEach(task => {
      taskSection += formatTaskForDailyNote(task) + '\n';
    });
  }
  
  return taskSection;
};

/**
 * デイリーノートのテンプレートを生成
 * @param date 日付
 * @param dateFormat 日付フォーマット
 * @param template テンプレート文字列
 * @param taskSection タスクセクション
 * @returns 生成されたテンプレート
 */
export const generateDailyNoteContent = (
  date: Date,
  dateFormat: string,
  template: string,
  taskSection: string
): string => {
  // 日付フォーマットを変換
  const formattedDate = formatDate(date, dateFormat);
  
  // テンプレートが空の場合はデフォルトのテンプレートを使用
  let content = template || `# ${formattedDate}\n\n## タスク\n\n## メモ`;
  
  // {{date:FORMAT}}を置換
  content = content.replace(/{{date:([^}]*)}}/g, (_, format) => {
    return formatDate(date, format);
  });
  
  // タスクセクションがあれば置換
  const taskSectionRegex = /## タスク\n\n([\s\S]*?)(?=\n##|$)/;
  if (taskSectionRegex.test(content)) {
    content = content.replace(taskSectionRegex, taskSection);
  } else {
    // タスクセクションがなければ追加
    content += '\n\n' + taskSection;
  }
  
  return content;
};

/**
 * 日付をフォーマットする
 * @param date 日付
 * @param format フォーマット
 * @returns フォーマットされた日付
 */
export const formatDate = (date: Date, format: string): string => {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  const day = date.getDate().toString().padStart(2, '0');
  
  return format
    .replace(/YYYY/g, year.toString())
    .replace(/MM/g, month)
    .replace(/DD/g, day);
};

/**
 * デイリーノートを更新
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param tasks タスクの配列
 */
export const updateDailyNoteWithTasks = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  tasks: Task[]
): Promise<void> => {
  try {
    // 設定を取得
    const settingsStr = localStorage.getItem('obsidian-task-sync-settings');
    if (!settingsStr) {
      throw new Error('設定が見つかりません');
    }
    
    const settings = JSON.parse(settingsStr);
    const { dailyNoteFolderPath, dailyNoteFormat, dailyNoteTemplate, dailyNoteTaskSection } = settings;
    
    if (!dailyNoteFolderPath || !dailyNoteFormat) {
      throw new Error('デイリーノートの設定が不完全です');
    }
    
    // 現在の日付
    const today = new Date();
    
    // デイリーノートのファイルハンドルを取得
    const dailyNoteFileHandle = await getDailyNoteFileHandle(
      vaultDirHandle,
      dailyNoteFolderPath,
      dailyNoteFormat
    );
    
    // デイリーノートの内容を読み込む
    let content = '';
    let isNewNote = false;
    
    try {
      const file = await dailyNoteFileHandle.getFile();
      content = await file.text();
    } catch (error) {
      console.log('デイリーノートが存在しないか、読み込めません。新規作成します。');
      isNewNote = true;
    }
    
    // タスクセクションを生成
    const taskSectionTitle = dailyNoteTaskSection || '## タスク';
    let taskSection = `${taskSectionTitle}\n\n`;
    
    if (tasks.length === 0) {
      taskSection += '今日のタスクはありません。\n';
    } else {
      tasks.forEach(task => {
        taskSection += formatTaskForDailyNote(task) + '\n';
      });
    }
    
    if (isNewNote) {
      // 新規ノートの場合はテンプレートを使用
      content = generateDailyNoteContent(today, dailyNoteFormat, dailyNoteTemplate, taskSection);
    } else {
      // 既存のノートの場合はタスクセクションのみ更新
      const taskSectionRegex = new RegExp(`${taskSectionTitle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\n\\n([\\s\\S]*?)(?=\\n##|$)`);
      
      if (taskSectionRegex.test(content)) {
        // タスクセクションを更新
        content = content.replace(taskSectionRegex, taskSection);
      } else {
        // タスクセクションを追加
        content += '\n\n' + taskSection;
      }
    }
    
    // デイリーノートに書き込む
    const writable = await dailyNoteFileHandle.createWritable();
    await writable.write(content);
    await writable.close();
    
    console.log('デイリーノートを更新しました');
  } catch (error) {
    console.error('デイリーノートの更新中にエラーが発生しました:', error);
    throw error;
  }
};
