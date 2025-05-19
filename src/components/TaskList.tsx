"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Task, Tag, TASK_STATUS, TASK_STATUS_LABELS } from '../types';
import { useTaskManager } from '../hooks/useTaskManager';
import { useTagManager } from '../hooks/useTagManager';
import TaskForm from './TaskForm';
import Link from 'next/link';

const TaskList = () => {
  const { tasks, updateTask, deleteTask, isVaultSelected } = useTaskManager();
  const { tags, getTagsForTask } = useTagManager();
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [filterTag, setFilterTag] = useState<string | null>(null);
  const router = useRouter();

  // タスクをステータスでフィルタリング
  const notStartedTasks = tasks.filter(task => task.status === TASK_STATUS.NOT_STARTED);
  const inProgressTasks = tasks.filter(task => task.status === TASK_STATUS.IN_PROGRESS);
  const completedTasks = tasks.filter(task => task.status === TASK_STATUS.COMPLETED);
  
  // タグでフィルタリング
  const filteredTasks = filterTag
    ? tasks.filter(task => {
        const taskTags = getTagsForTask(task.id);
        return taskTags.some(tag => tag.id === filterTag);
      })
    : tasks;

  // タスクのステータスを変更
  const handleStatusChange = (task: Task, newStatus: Task['status']) => {
    updateTask(task.id, { status: newStatus });
  };
  
  // タグフィルターを切り替え
  const handleTagFilter = (tagId: string) => {
    setFilterTag(filterTag === tagId ? null : tagId);
  };

  // タスクの編集を開始
  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  // タスクの編集をキャンセル
  const handleCancelEdit = () => {
    setEditingTask(null);
  };

  // タスクを削除
  const handleDeleteTask = (taskId: string) => {
    if (window.confirm('このタスクを削除してもよろしいですか？')) {
      deleteTask(taskId);
    }
  };

  // タスクカードのレンダリング
  const renderTaskCard = (task: Task) => {
    // 編集中のタスクの場合はフォームを表示
    if (editingTask && editingTask.id === task.id) {
      return (
        <div key={task.id} className="mb-4">
          <TaskForm taskToEdit={task} onCancel={handleCancelEdit} />
        </div>
      );
    }

    // 納期が過ぎているかどうかを確認
    const isOverdue = task.dueDate && new Date(task.dueDate) < new Date() && task.status !== TASK_STATUS.COMPLETED;

    return (
      <div
        key={task.id}
        className={`p-4 mb-3 rounded-lg shadow-sm border-l-4 ${
          isOverdue
            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
            : task.status === TASK_STATUS.COMPLETED
            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
            : task.status === TASK_STATUS.IN_PROGRESS
            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
            : 'border-gray-500 bg-gray-50 dark:bg-gray-900/20'
        }`}
      >
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={task.status === TASK_STATUS.COMPLETED}
                onChange={() =>
                  handleStatusChange(task, task.status === TASK_STATUS.COMPLETED ? TASK_STATUS.NOT_STARTED : TASK_STATUS.COMPLETED)
                }
                className="mr-2 h-5 w-5 text-primary"
              />
              <h3
                className={`text-lg font-medium ${
                  task.status === TASK_STATUS.COMPLETED ? 'line-through text-text-muted' : 'text-text-light dark:text-text'
                }`}
              >
                {task.title}
              </h3>
            </div>

            {task.dueDate && (
              <div className="mt-2 text-sm">
                <span className="font-medium">納期: </span>
                <span
                  className={`${
                    isOverdue ? 'text-red-600 dark:text-red-400 font-bold' : 'text-text-light dark:text-text'
                  }`}
                >
                  {formatDueDate(task.dueDate)}
                </span>
              </div>
            )}

            <div className="mt-2 flex flex-wrap gap-1">
              {getTagsForTask(task.id).map((tag) => (
                <span
                  key={tag.id}
                  onClick={() => handleTagFilter(tag.id)}
                  className={`px-2 py-1 text-xs rounded-full cursor-pointer ${
                    filterTag === tag.id
                      ? 'bg-primary text-white'
                      : 'bg-primary-light/20 text-primary-dark dark:text-primary-light'
                  }`}
                >
                  {tag.name}
                </span>
              ))}
            </div>

            {task.linkedNote && (
              <div className="mt-2 text-sm">
                <span className="font-medium">ノート: </span>
                <span className="text-primary underline">{task.linkedNote}</span>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <button
              onClick={() => handleEditTask(task)}
              className="p-1 text-gray-500 hover:text-primary focus:outline-none"
              aria-label="編集"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => handleDeleteTask(task.id)}
              className="p-1 text-gray-500 hover:text-red-500 focus:outline-none"
              aria-label="削除"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="mt-2 text-xs text-text-muted">
          {task.status === TASK_STATUS.COMPLETED && task.completedAt
            ? `完了: ${new Date(task.completedAt).toLocaleString()}`
            : `更新: ${new Date(task.updatedAt).toLocaleString()}`}
        </div>
      </div>
    );
  };

  // タスクをソートする関数
  const sortTasks = (tasksToSort: Task[]): Task[] => {
    return [...tasksToSort].sort((a, b) => {
      // 納期がある場合は納期でソート
      if (a.dueDate && b.dueDate) {
        return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
      }
      // 納期があるタスクを優先
      if (a.dueDate && !b.dueDate) return -1;
      if (!a.dueDate && b.dueDate) return 1;
      // どちらも納期がない場合は更新日時でソート
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });
  };

  // タスクの納期をフォーマット
  const formatDueDate = (dueDate: string | null | undefined) => {
    if (!dueDate) return '';
    const date = new Date(dueDate);
    return date.toLocaleDateString('ja-JP', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };

  // 保管庫が選択されていない場合は選択を促すメッセージを表示
  if (!isVaultSelected) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                Obsidian保管庫が選択されていません。タスクを同期するには、設定画面でObsidian保管庫を選択してください。
              </p>
              <div className="mt-4">
                <Link href="/settings" className="inline-flex items-center px-4 py-2 border border-transparent text-sm leading-5 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-500 focus:outline-none focus:border-indigo-700 focus:shadow-outline-indigo active:bg-indigo-700 transition ease-in-out duration-150">
                  設定へ移動
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <div className="bg-surface-light dark:bg-surface p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text border-b pb-2">未着手</h2>
        {sortTasks(notStartedTasks).length === 0 ? (
          <p className="text-text-muted text-center py-4">タスクがありません</p>
        ) : (
          sortTasks(notStartedTasks).map(renderTaskCard)
        )}
      </div>

      <div className="bg-surface-light dark:bg-surface p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text border-b pb-2">進行中</h2>
        {sortTasks(inProgressTasks).length === 0 ? (
          <p className="text-text-muted text-center py-4">タスクがありません</p>
        ) : (
          sortTasks(inProgressTasks).map(renderTaskCard)
        )}
      </div>

      <div className="bg-surface-light dark:bg-surface p-4 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4 text-text-light dark:text-text border-b pb-2">完了</h2>
        {sortTasks(completedTasks).length === 0 ? (
          <p className="text-text-muted text-center py-4">タスクがありません</p>
        ) : (
          sortTasks(completedTasks).map(renderTaskCard)
        )}
      </div>
    </div>
  );
};

export default TaskList;
