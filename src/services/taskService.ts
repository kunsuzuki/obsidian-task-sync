/**
 * タスク操作に関するコアサービス
 */
import { Task, TASK_STATUS } from '../types';
import { generateId } from '../utils/idUtils';

/**
 * 新しいタスクを作成する
 */
export const createTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
  const now = new Date().toISOString();
  return {
    id: generateId('task'),
    createdAt: now,
    updatedAt: now,
    ...taskData,
    // デフォルトのステータスが設定されていない場合は「未着手」に設定
    status: taskData.status || TASK_STATUS.NOT_STARTED
  };
};

/**
 * タスクを更新する
 * @param tasks タスクの配列
 * @param taskId 更新するタスクのID
 * @param updates 更新内容
 * @returns 更新後のタスク配列
 */
export const updateTask = (tasks: Task[], taskId: string, updates: Partial<Task>): Task[] => {
  return tasks.map(task => {
    if (task.id === taskId) {
      return updateTaskItem(task, updates);
    }
    return task;
  });
};

/**
 * 個別のタスクを更新する
 */
export const updateTaskItem = (task: Task, updates: Partial<Task>): Task => {
  const updatedTask = {
    ...task,
    ...updates,
    updatedAt: new Date().toISOString()
  };
  
  // 完了状態に変更された場合、完了日時を設定
  if (updates.status === TASK_STATUS.COMPLETED && task.status !== TASK_STATUS.COMPLETED) {
    updatedTask.completedAt = new Date().toISOString();
  }
  
  // 完了状態から他の状態に変更された場合、完了日時をクリア
  if (task.status === TASK_STATUS.COMPLETED && updates.status && updates.status !== TASK_STATUS.COMPLETED) {
    updatedTask.completedAt = null;
  }
  
  return updatedTask;
};

/**
 * タスクを削除する
 * @param tasks タスクの配列
 * @param taskId 削除するタスクのID
 * @returns 削除後のタスク配列
 */
export const deleteTask = (tasks: Task[], taskId: string): Task[] => {
  return tasks.filter(task => task.id !== taskId);
};

/**
 * タスクをマージする（ローカルと保管庫のタスクを統合）
 * @param localTasks ローカルのタスク配列
 * @param vaultTasks 保管庫のタスク配列
 * @returns マージ結果と変更有無
 */
export const mergeTasks = (localTasks: Task[], vaultTasks: Task[]): { mergedTasks: Task[], hasChanges: boolean } => {
  const taskMap = new Map<string, Task>();

  // ローカルタスクを追加（最新のタスクを含む）
  localTasks.forEach(task => {
    // 重要: 必ずディープコピーを作成して、参照渡しによる問題を防ぐ
    taskMap.set(task.id, {...task});
  });

  // 保管庫のタスクをマージ
  vaultTasks.forEach(vaultTask => {
    const localTask = taskMap.get(vaultTask.id);

    if (!localTask) {
      // ローカルに存在しない場合は追加
      taskMap.set(vaultTask.id, {...vaultTask});
    } else {
      // 両方に存在する場合は更新日時を比較
      const localUpdatedAt = new Date(localTask.updatedAt).getTime();
      const vaultUpdatedAt = new Date(vaultTask.updatedAt).getTime();

      // 新しく追加されたタスクの場合（過去1分以内）
      const isRecentlyAdded = (Date.now() - localUpdatedAt) < 60000;

      if (isRecentlyAdded) {
        // 最近追加されたタスクはローカルを優先
        // 既にtaskMapにセット済みなので何もしない
      } else if (localUpdatedAt > vaultUpdatedAt) {
        // ローカルの方が新しい場合はローカルを優先（既にセット済み）
      } else if (vaultUpdatedAt > localUpdatedAt) {
        // 保管庫の方が新しい場合
        
        // ステータスの判断: 完了状態は特別扱い
        // 完了状態が新しい場合は優先、それ以外は最新の状態を採用
        const useVaultStatus = 
          (vaultTask.status === TASK_STATUS.COMPLETED && localTask.status !== TASK_STATUS.COMPLETED) || 
          (localTask.status !== TASK_STATUS.COMPLETED && vaultTask.status !== TASK_STATUS.COMPLETED);
        
        const mergedTask = {
          ...vaultTask,
          status: useVaultStatus ? vaultTask.status : localTask.status,
          completedAt: useVaultStatus && vaultTask.status === TASK_STATUS.COMPLETED 
            ? vaultTask.completedAt 
            : localTask.completedAt
        };
        
        taskMap.set(vaultTask.id, mergedTask);
      } else {
        // 更新日時が同じ場合、内容を比較して異なる場合はマージ
        if (JSON.stringify(localTask) !== JSON.stringify(vaultTask)) {
          // 内容が異なる場合、ステータスはローカルを優先
          const mergedTask = {
            ...vaultTask,
            status: localTask.status,
            completedAt: localTask.completedAt
          };
          taskMap.set(vaultTask.id, mergedTask);
        }
      }
    }
  });

  // マージ前とマージ後のタスク数を比較して変更があったかどうかを確認
  const hasChanges = localTasks.length !== taskMap.size || 
    localTasks.some(task => {
      const mergedTask = taskMap.get(task.id);
      return !mergedTask || mergedTask.updatedAt !== task.updatedAt;
    });
  
  // マージ結果を配列として返す
  return {
    mergedTasks: Array.from(taskMap.values()),
    hasChanges
  };
};

/**
 * 未完了のタスクを取得する
 */
export const getUncompletedTasks = (tasks: Task[]): Task[] => {
  return tasks.filter(task => task.status !== TASK_STATUS.COMPLETED);
};
