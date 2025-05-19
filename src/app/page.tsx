"use client";

import { useState } from 'react';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import { useTaskManager } from '../hooks/useTaskManager';
import { useAppSettings } from '../hooks/useAppSettings';

export default function Home() {
  const taskManager = useTaskManager();
  const { settings } = useAppSettings();
  const [showTaskForm, setShowTaskForm] = useState(false);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-light dark:text-text">タスク管理</h1>
        <button
          onClick={() => setShowTaskForm(!showTaskForm)}
          className="px-4 py-2 bg-primary text-white dark:text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary border border-gray-400"
          style={{ color: '#ffffff !important', backgroundColor: '#7C3AED !important', cursor: 'pointer' }}
        >
          {showTaskForm ? 'フォームを閉じる' : '新しいタスク'}
        </button>
      </div>

      {(!settings.vaultPath || settings.vaultPath === '未選択' || settings.vaultPath === '' || settings.vaultPath.startsWith('選択済み:')) && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
          <p className="font-bold">Obsidian保管庫が選択されていません</p>
          <p>
            タスクを同期するには、設定画面でObsidian保管庫を選択してください。
            <a href="/settings" className="text-primary underline ml-2">
              設定へ移動
            </a>
          </p>
        </div>
      )}

      {/* エラー表示は必要に応じて実装する */}

      {showTaskForm && (
        <div className="mb-8">
          <TaskForm onCancel={() => setShowTaskForm(false)} />
        </div>
      )}

      <TaskList />
    </div>
  );
}
