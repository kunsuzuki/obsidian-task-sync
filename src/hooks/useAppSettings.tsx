"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AppSettings } from '../types';

// デフォルト設定
const defaultSettings: AppSettings = {
  vaultPath: '',
  taskFolderPath: 'Obsidian-Sync-Tasks', // ユニークなフォルダ名に変更
  noteFolderPath: 'Obsidian-Sync-Notes', // ユニークなフォルダ名に変更
  dailyNoteEnabled: true, // デフォルトで有効
  dailyNoteFolderPath: 'Daily',
  dailyNoteFormat: 'YYYY-MM-DD',
  dailyNoteTaskSection: '## タスク',
  dailyNoteTemplate: '# {{date:YYYY-MM-DD}}\n\n## タスク\n\n## メモ\n\n', // デフォルトテンプレートを追加
  syncInterval: 60, // 60秒
  syncOnStartup: true, // 初期状態では自動同期をオン
  syncOnFocus: true, // 初期状態では自動同期をオン
  syncAllTasksToDailyNote: false, // デフォルトでは今日のタスクのみ
  noteTemplate: '# {{title}}\n\n作成日: {{date}}\nタスクID: {{taskId}}\n\n',
  autoSync: true, // 自動同期を有効に
};

// ローカルストレージのキー
const SETTINGS_STORAGE_KEY = 'obsidian-task-sync-settings';

// コンテキストの型定義
interface AppSettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => void;
  resetSettings: () => void;
}

// コンテキストの作成
const AppSettingsContext = createContext<AppSettingsContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const AppSettingsProvider = ({ children }: { children: ReactNode }) => {
  const [settings, setSettings] = useState<AppSettings>(defaultSettings);

  // 初期化時に設定を読み込む
  useEffect(() => {
    const savedSettings = localStorage.getItem(SETTINGS_STORAGE_KEY);
    if (savedSettings) {
      try {
        const parsedSettings = JSON.parse(savedSettings);
        setSettings({ ...defaultSettings, ...parsedSettings });
      } catch (error) {
        console.error('設定の読み込み中にエラーが発生しました:', error);
      }
    }
  }, []);

  // 設定を更新
  const updateSettings = (newSettings: Partial<AppSettings>) => {
    setSettings(prevSettings => {
      const updatedSettings = { ...prevSettings, ...newSettings };
      localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(updatedSettings));
      return updatedSettings;
    });
  };

  // 設定をリセット
  const resetSettings = () => {
    setSettings(defaultSettings);
    localStorage.removeItem(SETTINGS_STORAGE_KEY);
  };

  return (
    <AppSettingsContext.Provider value={{ settings, updateSettings, resetSettings }}>
      {children}
    </AppSettingsContext.Provider>
  );
};

// カスタムフック
export const useAppSettings = () => {
  const context = useContext(AppSettingsContext);
  if (context === undefined) {
    throw new Error('useAppSettings must be used within an AppSettingsProvider');
  }
  return context;
};
