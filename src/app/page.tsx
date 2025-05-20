"use client";

import { useState, useEffect } from 'react';
import TaskList from '../components/TaskList';
import TaskForm from '../components/TaskForm';
import SettingsModal from '../components/SettingsModal';
import SyncStatusIndicator from '../components/SyncStatusIndicator';
import { useTaskManager } from '../hooks/useTaskManager';

export default function Home() {
  const { 
    syncWithVault, 
    isVaultSelected, 
    isSyncing, 
    isLoading, 
    isPermissionChecking,
    hasLocalChanges 
  } = useTaskManager();
  
  const [showTaskForm, setShowTaskForm] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // ページ読み込み時に保管庫が選択されていない場合、設定モーダルを表示
  useEffect(() => {
    // 読み込み中や権限確認中は何もしない
    if (isLoading || isPermissionChecking) return;
    
    // 保管庫が選択されていない場合、設定モーダルを表示
    if (!isVaultSelected) {
      setShowSettingsModal(true);
    }
  }, [isVaultSelected, isLoading, isPermissionChecking]);

  // 同期ボタンのクリックハンドラ
  const handleSync = async () => {
    try {
      await syncWithVault();
    } catch (error) {
      console.error('同期中にエラーが発生しました:', error);
    }
  };

  return (
    <div className="space-y-8 p-4">
      {/* ヘッダー部分 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="text-3xl font-bold text-text-light dark:text-text">タスク管理</h1>
        
        <div className="flex flex-col md:flex-row items-start md:items-center gap-2 w-full md:w-auto">
          {/* 同期状態表示 */}
          <div className="w-full md:w-auto">
            <SyncStatusIndicator />
          </div>
          
          {/* ボタングループ */}
          <div className="flex gap-2 w-full md:w-auto">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 border border-gray-300"
            >
              設定
            </button>
            
            <button
              onClick={handleSync}
              disabled={isSyncing || isLoading || isPermissionChecking || !isVaultSelected}
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 border ${hasLocalChanges ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'bg-blue-500 hover:bg-blue-600 text-white'} ${(isSyncing || isLoading || isPermissionChecking || !isVaultSelected) ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {hasLocalChanges ? '変更を同期' : 'Obsidianと同期'}
            </button>
            
            <button
              onClick={() => setShowTaskForm(!showTaskForm)}
              className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary border border-gray-400"
              style={{ color: '#ffffff', backgroundColor: '#7C3AED', cursor: 'pointer' }}
            >
              {showTaskForm ? 'フォームを閉じる' : '新しいタスク'}
            </button>
          </div>
        </div>
      </div>

      {/* 保管庫未選択の警告 */}
      {!isVaultSelected && !isLoading && !isPermissionChecking && (
        <div className="bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-200 p-4 rounded-lg">
          <p className="font-bold">Obsidian保管庫が選択されていません</p>
          <p>
            タスクを同期するには、設定から Obsidian 保管庫を選択してください。
            <button 
              onClick={() => setShowSettingsModal(true)}
              className="text-primary underline ml-2 cursor-pointer"
            >
              設定を開く
            </button>
          </p>
        </div>
      )}

      {/* タスク入力フォーム */}
      {showTaskForm && (
        <div className="mb-8 bg-white dark:bg-gray-800 p-4 rounded-lg shadow">
          <TaskForm onCancel={() => setShowTaskForm(false)} />
        </div>
      )}

      {/* タスクリスト */}
      <TaskList />
      
      {/* 設定モーダル */}
      <SettingsModal 
        isOpen={showSettingsModal} 
        onClose={() => setShowSettingsModal(false)} 
      />
    </div>
  );
}
