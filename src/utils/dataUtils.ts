/**
 * データ管理ユーティリティ
 * タスク、タグ、タスク-タグ関連付けのデータをCSV形式で管理
 */

import { Task, Tag, TaskTag, TASK_STATUS } from '../types';
import { parseCSV, formatCSV } from './csvUtils';

// ファイル名の定数
export const DATA_FILES = {
  TASKS: 'tasks.md',
  TAGS: 'tags.md',
  TASK_TAGS: 'tasks-tags.md'
};

/**
 * タスクデータをCSV形式に変換
 * @param tasks タスクオブジェクトの配列
 * @returns CSV形式のテキスト
 */
export const tasksToCSV = (tasks: Task[]): string => {
  const rows = tasks.map(task => [
    task.id,
    task.title,
    task.status.toString(),
    task.dueDate || '',
    task.linkedNote || '',
    task.createdAt,
    task.updatedAt,
    task.completedAt || ''
  ]);
  
  // ヘッダー行を追加
  const header = [
    'id',
    'title',
    'status',
    'dueDate',
    'linkedNote',
    'createdAt',
    'updatedAt',
    'completedAt'
  ];
  
  return formatCSV([header, ...rows]);
};

/**
 * CSV形式のテキストからタスクデータを解析
 * @param csvText CSV形式のテキスト
 * @returns タスクオブジェクトの配列
 */
export const csvToTasks = (csvText: string): Task[] => {
  const rows = parseCSV(csvText);
  
  // ヘッダー行がある場合は除外
  const dataRows = rows.length > 0 && rows[0][0] === 'id' ? rows.slice(1) : rows;
  
  return dataRows.map(row => {
    const [id, title, status, dueDate, linkedNote, createdAt, updatedAt, completedAt] = row;
    
    return {
      id,
      title,
      status: parseInt(status) as Task['status'],
      dueDate: dueDate || undefined,
      linkedNote: linkedNote || undefined,
      createdAt,
      updatedAt,
      completedAt: completedAt || undefined
    };
  });
};

/**
 * タグデータをCSV形式に変換
 * @param tags タグオブジェクトの配列
 * @returns CSV形式のテキスト
 */
export const tagsToCSV = (tags: Tag[]): string => {
  const rows = tags.map(tag => [
    tag.id,
    tag.name,
    tag.color,
    tag.createdAt,
    tag.updatedAt
  ]);
  
  // ヘッダー行を追加
  const header = [
    'id',
    'name',
    'color',
    'createdAt',
    'updatedAt'
  ];
  
  return formatCSV([header, ...rows]);
};

/**
 * CSV形式のテキストからタグデータを解析
 * @param csvText CSV形式のテキスト
 * @returns タグオブジェクトの配列
 */
export const csvToTags = (csvText: string): Tag[] => {
  const rows = parseCSV(csvText);
  
  // ヘッダー行がある場合は除外
  const dataRows = rows.length > 0 && rows[0][0] === 'id' ? rows.slice(1) : rows;
  
  return dataRows.map(row => {
    // CSVデータの形式に応じて値を取得
    const [id, name, color, createdAt, updatedAt] = row;
    
    return {
      id,
      name,
      // color情報がない場合はデフォルトの色を設定
      color: color || '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      createdAt,
      updatedAt: updatedAt || createdAt // updatedAtがない場合はcreatedAtを使用
    };
  });
};

/**
 * タスク-タグ関連付けデータをCSV形式に変換
 * @param taskTags タスク-タグ関連付けオブジェクトの配列
 * @returns CSV形式のテキスト
 */
export const taskTagsToCSV = (taskTags: TaskTag[]): string => {
  const rows = taskTags.map(taskTag => [
    taskTag.id,
    taskTag.taskId,
    taskTag.tagId,
    taskTag.createdAt
  ]);
  
  // ヘッダー行を追加
  const header = [
    'id',
    'taskId',
    'tagId',
    'createdAt'
  ];
  
  return formatCSV([header, ...rows]);
};

/**
 * CSV形式のテキストからタスク-タグ関連付けデータを解析
 * @param csvText CSV形式のテキスト
 * @returns タスク-タグ関連付けオブジェクトの配列
 */
export const csvToTaskTags = (csvText: string): TaskTag[] => {
  const rows = parseCSV(csvText);
  
  // ヘッダー行がある場合は除外
  const dataRows = rows.length > 0 && rows[0][0] === 'id' ? rows.slice(1) : rows;
  
  return dataRows.map(row => {
    const [id, taskId, tagId, createdAt] = row;
    
    return {
      id,
      taskId,
      tagId,
      createdAt
    };
  });
};

/**
 * タスクIDに関連付けられたタグIDを取得
 * @param taskId タスクID
 * @param taskTags タスク-タグ関連付けの配列
 * @returns タグIDの配列
 */
export const getTagIdsForTask = (taskId: string, taskTags: TaskTag[]): string[] => {
  return taskTags
    .filter(taskTag => taskTag.taskId === taskId)
    .map(taskTag => taskTag.tagId);
};

/**
 * タスクIDに関連付けられたタグを取得
 * @param taskId タスクID
 * @param taskTags タスク-タグ関連付けの配列
 * @param tags タグの配列
 * @returns タグの配列
 */
export const getTagsForTask = (taskId: string, taskTags: TaskTag[], tags: Tag[]): Tag[] => {
  const tagIds = getTagIdsForTask(taskId, taskTags);
  return tags.filter(tag => tagIds.includes(tag.id));
};

/**
 * タグIDに関連付けられたタスクIDを取得
 * @param tagId タグID
 * @param taskTags タスク-タグ関連付けの配列
 * @returns タスクIDの配列
 */
export const getTaskIdsForTag = (tagId: string, taskTags: TaskTag[]): string[] => {
  return taskTags
    .filter(taskTag => taskTag.tagId === tagId)
    .map(taskTag => taskTag.taskId);
};

/**
 * タグIDに関連付けられたタスクを取得
 * @param tagId タグID
 * @param taskTags タスク-タグ関連付けの配列
 * @param tasks タスクの配列
 * @returns タスクの配列
 */
export const getTasksForTag = (tagId: string, taskTags: TaskTag[], tasks: Task[]): Task[] => {
  const taskIds = getTaskIdsForTag(tagId, taskTags);
  return tasks.filter(task => taskIds.includes(task.id));
};

/**
 * ステータスに基づいてタスクをフィルタリング
 * @param tasks タスクの配列
 * @param status ステータス
 * @returns フィルタリングされたタスクの配列
 */
export const filterTasksByStatus = (tasks: Task[], status: Task['status']): Task[] => {
  return tasks.filter(task => task.status === status);
};

/**
 * 未完了タスク（未着手・進行中）を取得
 * @param tasks タスクの配列
 * @returns 未完了タスクの配列
 */
export const getUncompletedTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(
    task => task.status === TASK_STATUS.NOT_STARTED || task.status === TASK_STATUS.IN_PROGRESS
  );
};

/**
 * 日付でタスクをフィルタリング
 * @param tasks タスクの配列
 * @param date 日付（YYYY-MM-DD形式）
 * @returns フィルタリングされたタスクの配列
 */
export const filterTasksByDate = (tasks: Task[], date: string): Task[] => {
  return tasks.filter(task => task.dueDate === date);
};
