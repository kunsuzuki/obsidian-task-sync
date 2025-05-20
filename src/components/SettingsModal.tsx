"use client";

import React, { useState, useEffect } from 'react';
import { useTaskManager } from '../hooks/useTaskManager';
import { toast } from 'react-toastify';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose }) => {
  const { selectVault, isVaultSelected } = useTaskManager();
  const [taskFolderPath, setTaskFolderPath] = useState('Obsidian-Sync-Tasks');
  const [dailyNotesEnabled, setDailyNotesEnabled] = useState(true);
  const [dailyNotesPath, setDailyNotesPath] = useState('Daily');
  const [isLoading, setIsLoading] = useState(false);

  // 設定を読み込む
  useEffect(() => {
    const loadSettings = () => {
      const savedSettings = localStorage.getItem('obsidian-task-sync-settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          if (parsedSettings.taskFolderPath) {
            setTaskFolderPath(parsedSettings.taskFolderPath);
          }
          if (parsedSettings.dailyNotesEnabled !== undefined) {
            setDailyNotesEnabled(parsedSettings.dailyNotesEnabled);
          }
          if (parsedSettings.dailyNotesPath) {
            setDailyNotesPath(parsedSettings.dailyNotesPath);
          }
        } catch (error) {
          console.error('設定の解析中にエラーが発生しました:', error);
        }
      }
    };

    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  // 保管庫を選択
  const handleSelectVault = async () => {
    setIsLoading(true);
    try {
      await selectVault();
    } catch (error) {
      console.error('保管庫選択中にエラーが発生しました:', error);
      toast.error('保管庫の選択中にエラーが発生しました。もう一度お試しください。');
    } finally {
      setIsLoading(false);
    }
  };

  // 設定を保存
  const handleSaveSettings = () => {
    try {
      // 現在の設定を取得
      const savedSettings = localStorage.getItem('obsidian-task-sync-settings');
      let settings = {};
      
      if (savedSettings) {
        settings = JSON.parse(savedSettings);
      }
      
      // 設定を更新
      const updatedSettings = {
        ...settings,
        taskFolderPath,
        dailyNotesEnabled,
        dailyNotesPath
      };
      
      // 設定を保存
      localStorage.setItem('obsidian-task-sync-settings', JSON.stringify(updatedSettings));
      
      toast.success('設定を保存しました');
      onClose();
    } catch (error) {
      console.error('設定の保存中にエラーが発生しました:', error);
      toast.error('設定の保存中にエラーが発生しました。もう一度お試しください。');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl font-bold mb-4">設定</h2>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">保管庫</h3>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSelectVault}
              disabled={isLoading}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {isLoading ? '選択中...' : isVaultSelected ? '保管庫を変更' : '保管庫を選択'}
            </button>
            {isVaultSelected && (
              <span className="text-green-600">✓ 選択済み</span>
            )}
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">タスクフォルダ</h3>
          <div className="flex flex-col gap-2">
            <label className="text-sm text-gray-600">
              タスクデータを保存するフォルダのパス
            </label>
            <input
              type="text"
              value={taskFolderPath}
              onChange={(e) => setTaskFolderPath(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="例: Obsidian-Sync-Tasks"
            />
          </div>
        </div>
        
        <div className="mb-6">
          <h3 className="text-lg font-semibold mb-2">デイリーノート</h3>
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="dailyNotesEnabled"
                checked={dailyNotesEnabled}
                onChange={(e) => setDailyNotesEnabled(e.target.checked)}
                className="h-4 w-4"
              />
              <label htmlFor="dailyNotesEnabled" className="text-sm text-gray-600">
                デイリーノート機能を有効にする
              </label>
            </div>
            
            {dailyNotesEnabled && (
              <div className="flex flex-col gap-2">
                <label className="text-sm text-gray-600">
                  デイリーノートを保存するフォルダのパス
                </label>
                <input
                  type="text"
                  value={dailyNotesPath}
                  onChange={(e) => setDailyNotesPath(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="例: Daily"
                />
              </div>
            )}
          </div>
        </div>
        
        <div className="flex justify-end gap-2 mt-6">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
          >
            キャンセル
          </button>
          <button
            onClick={handleSaveSettings}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
