"use client";

import { useState, useEffect } from 'react';
import { useAppSettings } from '../hooks/useAppSettings';
import { useTaskManager } from '../hooks/useTaskManager';
import { isFileSystemAccessSupported } from '../utils/fileSystem';
import toast from 'react-hot-toast';

const SettingsForm = () => {
  const { settings, updateSettings } = useAppSettings();
  const { selectVault, syncWithVault } = useTaskManager();
  // 初期状態でサポートされていると設定
  const [isFileSystemSupported, setIsFileSystemSupported] = useState(true);

  useEffect(() => {
    // マウント時とウィンドウフォーカス時にAPIサポートを確認
    const checkApiSupport = () => {
      try {
        // 強制的にサポートされているとみなす
        setIsFileSystemSupported(true);
        console.log('File System Access APIのサポート状態: true (強制設定)');
        
        // 実際のサポート状態も確認してログ出力
        const actualSupport = isFileSystemAccessSupported();
        console.log('実際のFile System Access APIサポート状態:', actualSupport);
        console.log('window.showDirectoryPickerの型:', typeof window.showDirectoryPicker);
      } catch (error) {
        console.error('APIサポート確認中にエラーが発生しました:', error);
      }
    };
    
    // 初回ロード時に確認
    checkApiSupport();
    
    // ウィンドウフォーカス時に再確認
    window.addEventListener('focus', checkApiSupport);
    return () => {
      window.removeEventListener('focus', checkApiSupport);
    };
  }, []);

  const handleSelectVault = async () => {
    try {
      // 保管庫選択処理を実行
      await selectVault();
      
      // 設定を再読み込みして表示を更新
      const savedSettings = localStorage.getItem('obsidian-task-sync-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        updateSettings(parsedSettings);
      }
    } catch (error) {
      console.error('保管庫選択中にエラーが発生しました:', error);
      toast.error(`保管庫選択中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // フォームの送信時に設定を保存
    // 注: 個別のフィールド変更時に既に保存されているため、ここでは追加の処理は不要
  };

  const handleChange = (field: keyof typeof settings, value: any) => {
    updateSettings({ [field]: value });
  };

  return (
    <div className="bg-surface-light dark:bg-surface p-6 rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-text-light dark:text-text">設定</h2>

      {/* 警告メッセージは非表示にします */}

      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label className="block text-sm font-medium text-text-light dark:text-text mb-1">
            Obsidian保管庫
          </label>
          <div className="flex items-center">
            <input
              type="text"
              value={settings.vaultPath && settings.vaultPath !== '未選択' ? settings.vaultPath : '未選択'}
              readOnly
              className="flex-1 px-3 py-2 border border-border-light dark:border-border rounded-md bg-gray-100 dark:bg-gray-700"
            />
            <div className="ml-2">
              <button
                type="button"
                onClick={handleSelectVault}
                className="px-4 py-2 bg-primary text-white dark:text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary border border-gray-400"
              >
                選択
              </button>
              <div style={{ visibility: !isFileSystemSupported ? 'visible' : 'hidden' }} className="mt-4 p-4 bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-100 rounded-md">
                <h3 className="text-lg font-semibold">互換性の問題</h3>
                <p>
                  お使いのブラウザはFile System Access APIをサポートしていません。
                  Chrome、Edge、またはOperaの最新版をお使いください。
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text mb-1">
              タスク保存先フォルダ
            </label>
            <input
              type="text"
              value={settings.taskFolderPath}
              onChange={(e) => handleChange('taskFolderPath', e.target.value)}
              className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Tasks"
            />
            <p className="text-xs text-gray-500 mt-1">タスク、タグ、タスク-タグ関連付けファイルが保存されるフォルダ</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text mb-1">
              ノート保存先フォルダ
            </label>
            <input
              type="text"
              value={settings.noteFolderPath}
              onChange={(e) => handleChange('noteFolderPath', e.target.value)}
              className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Notes"
            />
            <p className="text-xs text-gray-500 mt-1">タスクにリンクされたノートが保存されるフォルダ</p>
          </div>
          
          <div className="col-span-2">
            <div className="flex items-center mb-2">
              <input
                type="checkbox"
                id="dailyNoteEnabled"
                checked={settings.dailyNoteEnabled || false}
                onChange={(e) => handleChange('dailyNoteEnabled', e.target.checked)}
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="dailyNoteEnabled" className="ml-2 block text-sm font-medium text-text-light dark:text-text">
                デイリーノート機能を有効にする
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-2">有効にすると、同期時に未完了タスクがデイリーノートに追加されます</p>
          </div>

          <div className={settings.dailyNoteEnabled ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm font-medium text-text-light dark:text-text mb-1">
              デイリーノートフォルダ
            </label>
            <input
              type="text"
              value={settings.dailyNoteFolderPath}
              onChange={(e) => handleChange('dailyNoteFolderPath', e.target.value)}
              className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Daily"
              disabled={!settings.dailyNoteEnabled}
            />
            <p className="text-xs text-gray-500 mt-1">既存のデイリーノートフォルダを指定してください</p>
          </div>

          <div className={settings.dailyNoteEnabled ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm font-medium text-text-light dark:text-text mb-1">
              デイリーノートフォーマット
            </label>
            <input
              type="text"
              value={settings.dailyNoteFormat}
              onChange={(e) => handleChange('dailyNoteFormat', e.target.value)}
              className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="YYYY-MM-DD"
              disabled={!settings.dailyNoteEnabled}
            />
            <p className="text-xs text-gray-500 mt-1">例: YYYY-MM-DD, YYYY/MM/DD</p>
          </div>

          <div className={settings.dailyNoteEnabled ? '' : 'opacity-50 pointer-events-none'}>
            <label className="block text-sm font-medium text-text-light dark:text-text mb-1">
              デイリーノートのタスクセクション
            </label>
            <input
              type="text"
              value={settings.dailyNoteTaskSection}
              onChange={(e) => handleChange('dailyNoteTaskSection', e.target.value)}
              className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="## タスク"
              disabled={!settings.dailyNoteEnabled}
            />
          </div>
          
          <div className={settings.dailyNoteEnabled ? 'col-span-2' : 'col-span-2 opacity-50 pointer-events-none'}>
            <label className="block text-sm font-medium text-text-light dark:text-text mb-1">
              デイリーノートテンプレート
            </label>
            <textarea
              value={settings.dailyNoteTemplate || ''}
              onChange={(e) => handleChange('dailyNoteTemplate', e.target.value)}
              className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary h-32"
              placeholder="# {{date:YYYY-MM-DD}}

## タスク

## メモ"
              disabled={!settings.dailyNoteEnabled}
            />
            <p className="text-xs text-gray-500 mt-1">デイリーノートが存在しない場合に使用されるテンプレートです。{'{{'}日付変数例: date:YYYY-MM-DD{'}}'}のような形式で日付を挿入できます。</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-text-light dark:text-text mb-1">
              同期間隔（秒）
            </label>
            <input
              type="number"
              min="0"
              value={settings.syncInterval}
              onChange={(e) => handleChange('syncInterval', parseInt(e.target.value) || 0)}
              className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-text-light dark:text-text mb-1">
            ノートテンプレート
          </label>
          <textarea
            value={settings.noteTemplate}
            onChange={(e) => handleChange('noteTemplate', e.target.value)}
            rows={5}
            className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary font-mono text-sm"
            placeholder="# {{title}}&#10;&#10;作成日: {{date}}&#10;タスクID: {{taskId}}&#10;&#10;"
          />
          <p className="mt-1 text-sm text-text-muted">
            利用可能な変数: {"{{title}}, {{date}}, {{taskId}}"}
          </p>
        </div>

        <div className="mb-6 space-y-3">
          <div className="flex items-center">
            <input
              type="checkbox"
              id="syncOnStartup"
              checked={settings.syncOnStartup}
              onChange={(e) => handleChange('syncOnStartup', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            <label htmlFor="syncOnStartup" className="ml-2 text-text-light dark:text-text">
              起動時に同期する
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="syncOnFocus"
              checked={settings.syncOnFocus}
              onChange={(e) => handleChange('syncOnFocus', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            <label htmlFor="syncOnFocus" className="ml-2 text-text-light dark:text-text">
              フォーカス時に同期する
            </label>
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              id="syncAllTasksToDailyNote"
              checked={settings.syncAllTasksToDailyNote}
              onChange={(e) => handleChange('syncAllTasksToDailyNote', e.target.checked)}
              className="h-4 w-4 text-primary focus:ring-primary"
            />
            <label htmlFor="syncAllTasksToDailyNote" className="ml-2 text-text-light dark:text-text">
              全てのタスクをデイリーノートに同期する（オフの場合は今日のタスクのみ）
            </label>
          </div>
        </div>

        <div className="mt-4">
          <h3 className="text-lg font-semibold mb-2">同期状態</h3>
          <div className="bg-gray-100 dark:bg-gray-800 p-3 rounded-md">
            <p>
              <strong>最終同期日時:</strong>{' '}
              {/* ローカルストレージから取得した情報を表示する場合はここに追加 */}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <div>
          </div>
          <button
            type="button"
            onClick={() => syncWithVault()}
            disabled={!settings.vaultPath}
            className="px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50"
          >
            今すぐ同期
          </button>
        </div>
      </form>
    </div>
  );
};

export default SettingsForm;
