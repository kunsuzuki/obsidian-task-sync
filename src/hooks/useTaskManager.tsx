"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Task } from '../types';
import { createTask, updateTask as updateTaskService, deleteTask as deleteTaskService } from '../services/taskService';
import { syncTasksWithVault } from '../services/syncService';
import { updateDailyNote } from '../services/dailyNoteService';
import { directoryHandleCache, getDirectoryHandleFromCache, cacheDirectoryHandle, createDirectoryByPath } from '../utils/fileSystem';

// タスクマネージャーのコンテキスト型定義
interface TaskManagerContextType {
  tasks: Task[];
  addTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>) => Task;
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  deleteTask: (taskId: string) => void;
  syncWithVault: () => Promise<void>;
  selectVault: () => Promise<void>;
  isFirstSync: boolean;
  isVaultSelected: boolean;
  isSyncing: boolean;
  hasLocalChanges: boolean;
  lastSynced: string | null;
  syncError: string | null;
  isLoading: boolean; // アプリの読み込み状態
  isPermissionChecking: boolean; // 権限確認中の状態
}

// デフォルト値
const defaultTaskManagerContext: TaskManagerContextType = {
  tasks: [],
  addTask: () => ({ id: '', title: '', status: 1, createdAt: '', updatedAt: '' }),
  updateTask: () => {},
  deleteTask: () => {},
  syncWithVault: async () => {},
  selectVault: async () => {},
  isFirstSync: true,
  isVaultSelected: false,
  isSyncing: false,
  hasLocalChanges: false,
  lastSynced: null,
  syncError: null,
  isLoading: true, // 初期状態は読み込み中
  isPermissionChecking: false,
};

// コンテキストの作成
const TaskManagerContext = createContext<TaskManagerContextType>(defaultTaskManagerContext);

// カスタムフックの作成
export const useTaskManager = () => useContext(TaskManagerContext);

// プロバイダーコンポーネント
export const TaskManagerProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // タスクの状態
  const [tasks, setTasks] = useState<Task[]>([]);
  
  // 同期関連の状態
  const [isFirstSync, setIsFirstSync] = useState<boolean>(true);
  const [isVaultSelected, setIsVaultSelected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [hasLocalChanges, setHasLocalChanges] = useState<boolean>(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);
  
  // 読み込み状態と権限確認状態
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isPermissionChecking, setIsPermissionChecking] = useState<boolean>(false);
  
  // ディレクトリハンドルの権限確認を行う関数
  const checkDirectoryPermission = async () => {
    try {
      // ディレクトリハンドルをキャッシュから取得
      const vaultDirHandle = await getDirectoryHandleFromCache('vault');
      
      // ディレクトリハンドルがない場合
      if (!vaultDirHandle) {
        console.log('ディレクトリハンドルがキャッシュに存在しません');
        setIsPermissionChecking(false);
        return;
      }
      
      // 権限確認
      try {
        // @ts-ignore - TypeScriptの型定義が最新のAPIに追いついていない場合の対処
        const permission = await vaultDirHandle.requestPermission({ mode: 'readwrite' });
        console.log(`ディレクトリハンドルの権限状態: ${permission}`);
        
        if (permission === 'granted') {
          // 権限が付与された場合
          toast.success('保管庫へのアクセス権限を取得しました。', {
            autoClose: 3000,
            position: 'top-center',
          });
          
          // 権限確認完了
          setIsPermissionChecking(false);
          setIsVaultSelected(true);
        } else {
          // 権限が付与されなかった場合
          toast.error('保管庫へのアクセス権限が付与されませんでした。', {
            autoClose: 5000,
            position: 'top-center',
          });
          
          // 権限確認完了
          setIsPermissionChecking(false);
        }
      } catch (error) {
        console.error('権限確認中にエラーが発生しました:', error);
        
        // 権限確認エラーの場合、ユーザーに通知
        toast.info('保管庫へのアクセス権限を確認してください。「同期」ボタンをクリックすると権限が確認されます。', {
          autoClose: 5000,
          position: 'top-center',
        });
        
        // 権限確認完了
        setIsPermissionChecking(false);
      }
    } catch (error) {
      console.error('ディレクトリハンドルの取得中にエラーが発生しました:', error);
      setIsPermissionChecking(false);
    }
  };
  
  // ページ読み込み時の処理
  useEffect(() => {
    // ローカルストレージから情報を読み込む
    loadDataFromLocalStorage();
  }, []);
  
  // ローカルストレージから情報を読み込む関数
  const loadDataFromLocalStorage = async () => {
    try {
      console.log('ローカルストレージから情報を読み込んでいます...');
      
      // 設定情報の読み込み
      const savedSettings = localStorage.getItem('obsidian-task-sync-settings');
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          
          // 保管庫が選択されているか確認
          if (parsedSettings.vaultPath && parsedSettings.vaultPath !== '未選択') {
            console.log('保管庫が選択されています:', parsedSettings.vaultPath);
            
            // 保管庫が選択されている場合、権限確認を試みる
            setIsPermissionChecking(true);
            
            try {
              // ディレクトリハンドルの権限確認
              await checkDirectoryPermission();
              
              // 権限が確認できた場合
              setIsVaultSelected(true);
              console.log('保管庫の選択状態を更新しました:', true);
            } catch (error) {
              console.error('権限確認中にエラーが発生しました:', error);
              setIsVaultSelected(false);
            }
          } else {
            console.log('保管庫が選択されていません');
            setIsVaultSelected(false);
          }
        } catch (error) {
          console.error('設定情報の解析中にエラーが発生しました:', error);
        }
      } else {
        console.log('保存された設定情報がありません');
      }
      
      // 保存されたタスクの読み込み
      const savedTasks = localStorage.getItem('obsidian-task-sync-tasks');
      if (savedTasks) {
        try {
          const parsedTasks = JSON.parse(savedTasks);
          setTasks(parsedTasks);
          console.log('保存されたタスクを読み込みました:', parsedTasks.length);
        } catch (error) {
          console.error('タスクの解析中にエラーが発生しました:', error);
        }
      }
      
      // 最終同期時間の読み込み
      const savedLastSynced = localStorage.getItem('obsidian-task-sync-last-synced');
      if (savedLastSynced) {
        setLastSynced(savedLastSynced);
        console.log('最終同期時間を読み込みました:', savedLastSynced);
      }
      
      // 初回同期フラグの読み込み
      const savedIsFirstSync = localStorage.getItem('obsidian-task-sync-is-first-sync');
      if (savedIsFirstSync) {
        setIsFirstSync(savedIsFirstSync === 'true');
        console.log('初回同期フラグを読み込みました:', savedIsFirstSync === 'true');
      }
    } catch (error) {
      console.error('ローカルストレージからの情報読み込み中にエラーが発生しました:', error);
    } finally {
      // 読み込み完了
      setIsLoading(false);
      console.log('ローカルストレージからの情報読み込みが完了しました');
    }
  };
  
  // タスクの変更時にローカルストレージに保存
  useEffect(() => {
    if (tasks.length > 0) {
      localStorage.setItem('obsidian-task-sync-tasks', JSON.stringify(tasks));
    }
  }, [tasks]);
  
  // 保管庫を選択
  const selectVault = async (): Promise<void> => {
    try {
      // 読み込み中または権限確認中の場合は処理を延期
      if (isLoading) {
        toast.info('設定の読み込み中です。しばらくお待ちください...', {
          autoClose: 3000,
          position: 'top-center',
        });
        return;
      }
      
      if (isPermissionChecking) {
        toast.info('保管庫へのアクセス権限を確認中です。しばらくお待ちください...', {
          autoClose: 3000,
          position: 'top-center',
        });
        return;
      }
      
      // File System Access APIがサポートされているか確認
      if (!('showDirectoryPicker' in window)) {
        toast.error('お使いのブラウザはFile System Access APIをサポートしていません。', {
          autoClose: 5000,
          position: 'top-center',
        });
        return;
      }
      
      try {
        // ユーザーにディレクトリを選択させる
        // @ts-ignore - TypeScriptの型定義が最新のAPIに追いついていない場合の対処
        const dirHandle = await window.showDirectoryPicker({
          id: 'obsidian-vault',
          mode: 'readwrite',
          startIn: 'documents',
        });
        
        // 選択されたディレクトリの名前を取得
        const vaultName = dirHandle.name;
        console.log('選択された保管庫:', vaultName);
        
        // ディレクトリハンドルをキャッシュに保存
        cacheDirectoryHandle('vault', dirHandle);
        
        // 設定を保存
        const settings = {
          vaultPath: vaultName,
          taskFolderPath: 'Obsidian-Sync-Tasks', // デフォルトのタスクフォルダパス
          dailyNotesEnabled: true, // デフォルトでデイリーノート機能を有効化
          dailyNotesPath: 'Daily', // デフォルトのデイリーノートパス
        };
        
        localStorage.setItem('obsidian-task-sync-settings', JSON.stringify(settings));
        
        // 保管庫選択状態を更新
        setIsVaultSelected(true);
        
        // 成功メッセージを表示
        toast.success(`保管庫「${vaultName}」を選択しました。`, {
          autoClose: 3000,
          position: 'top-center',
        });
        
        // 初回同期を実行
        setIsFirstSync(true);
        localStorage.setItem('obsidian-task-sync-is-first-sync', 'true');
        
        // 少し遅延させて同期を実行
        setTimeout(() => {
          syncWithVault().catch(error => {
            console.error('初回同期中にエラーが発生しました:', error);
          });
        }, 1000);
      } catch (error) {
        // ユーザーがキャンセルした場合やその他のエラーの場合
        if ((error as Error).name !== 'AbortError') {
          console.error('保管庫選択中にエラーが発生しました:', error);
          toast.error('保管庫の選択中にエラーが発生しました。', {
            autoClose: 5000,
            position: 'top-center',
          });
        } else {
          console.log('ユーザーが保管庫選択をキャンセルしました');
        }
      }
    } catch (error) {
      console.error('予期しないエラーが発生しました:', error);
      toast.error('予期しないエラーが発生しました。もう一度お試しください。', {
        autoClose: 5000,
        position: 'top-center',
      });
    }
  };
  
  // タスクを追加
  const addTask = (taskData: Omit<Task, 'id' | 'createdAt' | 'updatedAt'>): Task => {
    const newTask = createTask(taskData);
    setTasks(prevTasks => [...prevTasks, newTask]);
    setHasLocalChanges(true);
    
    // 変更後に自動同期
    setTimeout(() => {
      syncWithVault().catch(error => {
        console.error('タスク追加後の同期中にエラーが発生しました:', error);
        toast.error('同期中にエラーが発生しました。設定画面で保管庫を確認してください。');
      });
    }, 100); // 少し遅延させて実行し、UIの更新が完了してから同期する
    
    return newTask;
  };
  
  // タスクを更新
  const updateTask = (taskId: string, updates: Partial<Task>): void => {
    const updatedTasks = updateTaskService(tasks, taskId, updates);
    setTasks(updatedTasks);
    setHasLocalChanges(true);
    
    // 変更後に自動同期
    setTimeout(() => {
      syncWithVault().catch(error => {
        console.error('タスク更新後の同期中にエラーが発生しました:', error);
        toast.error('同期中にエラーが発生しました。設定画面で保管庫を確認してください。');
      });
    }, 100); // 少し遅延させて実行し、UIの更新が完了してから同期する
  };
  
  // タスクを削除
  const deleteTask = (taskId: string): void => {
    const updatedTasks = deleteTaskService(tasks, taskId);
    setTasks(updatedTasks);
    setHasLocalChanges(true);
    
    // 変更後に自動同期
    setTimeout(() => {
      syncWithVault().catch(error => {
        console.error('タスク削除後の同期中にエラーが発生しました:', error);
        toast.error('同期中にエラーが発生しました。設定画面で保管庫を確認してください。');
      });
    }, 100); // 少し遅延させて実行し、UIの更新が完了してから同期する
  };

  // 保管庫と同期
  const syncWithVault = async (): Promise<void> => {
    try {
      // 読み込み中または権限確認中の場合は処理を延期
      if (isLoading) {
        toast.info('設定の読み込み中です。しばらくお待ちください...', {
          autoClose: 3000,
          position: 'top-center',
        });
        return;
      }
      
      if (isPermissionChecking) {
        toast.info('保管庫へのアクセス権限を確認中です。しばらくお待ちください...', {
          autoClose: 3000,
          position: 'top-center',
        });
        return;
      }
      
      // 保管庫が選択されていない場合は自動的に権限確認を試みる
      if (!isVaultSelected) {
        const savedSettings = localStorage.getItem('obsidian-task-sync-settings');
        if (savedSettings) {
          try {
            const parsedSettings = JSON.parse(savedSettings);
            if (parsedSettings.vaultPath && parsedSettings.vaultPath !== '未選択') {
              // 設定はあるが権限がない可能性があるため、権限確認を試みる
              setIsPermissionChecking(true);
              toast.info('保管庫へのアクセス権限を確認しています...', {
                autoClose: 3000,
                position: 'top-center',
              });
              
              try {
                await checkDirectoryPermission();
                // 権限確認後に再度同期を試みる
                setTimeout(() => syncWithVault(), 1000);
                return;
              } catch (error) {
                console.error('権限確認中にエラーが発生しました:', error);
                // エラーが発生した場合は通常のフローに進む
              }
            }
          } catch (parseError) {
            console.error('設定の解析中にエラーが発生しました:', parseError);
          }
        }
        
        toast.info('保管庫が選択されていません。設定画面で保管庫を選択してください。', {
          autoClose: 5000,
          position: 'top-center',
        });
        return;
      }
      
      // 同期開始状態を設定
      setIsSyncing(true);
      setSyncError(null);
      
      // ディレクトリハンドルをキャッシュから取得
      const vaultDirHandle = await getDirectoryHandleFromCache('vault');
      
      // ディレクトリハンドルがない場合は同期しない
      if (!vaultDirHandle) {
        // ディレクトリハンドルがない場合は、読み込み中であることを通知
        toast.info('保管庫の設定を確認中です。しばらくお待ちください...', {
          autoClose: 3000,
          position: 'top-center',
        });
        
        // 権限確認を試みる
        setIsPermissionChecking(true);
        await checkDirectoryPermission();
        
        setIsSyncing(false);
        return;
      }
      
      // ディレクトリハンドルの検証
      if (typeof vaultDirHandle !== 'object' || vaultDirHandle === null) {
        console.error('無効なディレクトリハンドルです（オブジェクトではありません）:', vaultDirHandle);
        toast.error('保管庫へのアクセス権限が失われています。設定画面から保管庫を再選択してください。', {
          autoClose: 5000,
          position: 'top-center',
        });
        setIsSyncing(false);
        return;
      }
      
      // getFileHandleメソッドが存在するか確認
      if (typeof vaultDirHandle.getFileHandle !== 'function') {
        console.error('無効なディレクトリハンドルです（getFileHandleメソッドが存在しません）:', vaultDirHandle);
        toast.error('保管庫へのアクセス権限が失われています。設定画面から保管庫を再選択してください。', {
          autoClose: 5000,
          position: 'top-center',
        });
        setIsSyncing(false);
        return;
      }
      
      console.log('保管庫との同期を開始します...');
      
      // 権限を確認
      try {
        // @ts-ignore - TypeScriptの型定義が最新のAPIに追いついていない場合の対処
        const permission = await vaultDirHandle.requestPermission({ mode: 'readwrite' });
        console.log(`ディレクトリハンドルの権限状態: ${permission}`);
        
        if (permission !== 'granted') {
          throw new Error('保管庫へのアクセス権限が付与されませんでした。');
        }
      } catch (permissionError) {
        console.error('権限確認中にエラーが発生しました:', permissionError);
        
        // 権限確認エラーの場合、権限確認プロセスを開始
        setIsPermissionChecking(true);
        toast.info('保管庫へのアクセス権限を確認しています...', {
          autoClose: 3000,
          position: 'top-center',
        });
        
        await checkDirectoryPermission();
        setIsSyncing(false);
        return;
      }
      
      // 設定からタスクフォルダのパスを取得
      let taskFolderPath = 'Obsidian-Sync-Tasks';
      try {
        const savedSettings = localStorage.getItem('obsidian-task-sync-settings');
        if (savedSettings) {
          const parsedSettings = JSON.parse(savedSettings);
          if (parsedSettings.taskFolderPath) {
            taskFolderPath = parsedSettings.taskFolderPath;
            console.log('設定からタスクフォルダパスを取得しました:', taskFolderPath);
          }
        }
      } catch (error) {
        console.error('設定からタスクフォルダパスの取得に失敗しました:', error);
      }
      
      // タスクフォルダが存在するか確認し、存在しない場合は作成
      try {
        await createDirectoryByPath(vaultDirHandle, taskFolderPath);
        console.log(`タスクフォルダ '${taskFolderPath}' の存在を確認しました`);
      } catch (folderError) {
        console.error('タスクフォルダの確認中にエラーが発生しました:', folderError);
        throw new Error(`タスクフォルダ '${taskFolderPath}' の作成に失敗しました。`);
      }
      
      // 同期処理を実行
      const result = await syncTasksWithVault(
        vaultDirHandle,
        taskFolderPath,
        tasks,
        isFirstSync
      );
      
      // タスクを更新
      if (result.hasChanges) {
        setTasks(result.mergedTasks);
        toast.success('タスクを同期しました');
      } else {
        toast.success('同期が完了しました（変更なし）');
      }
      
      // 初回同期フラグをオフにする
      if (isFirstSync) {
        setIsFirstSync(false);
      }
      
      // 同期時間を更新
      const syncTime = new Date().toISOString();
      setLastSynced(syncTime);
      localStorage.setItem('obsidian-task-sync-last-synced', syncTime);
      
      // ローカル変更フラグをリセット
      setHasLocalChanges(false);
    } catch (error) {
      console.error('同期中にエラーが発生しました:', error);
      setSyncError(error instanceof Error ? error.message : '不明なエラー');
      toast.error('同期中にエラーが発生しました: ' + (error instanceof Error ? error.message : '不明なエラー'));
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <TaskManagerContext.Provider
      value={{
        tasks,
        addTask,
        updateTask,
        deleteTask,
        syncWithVault,
        selectVault,
        isFirstSync,
        isVaultSelected,
        isSyncing,
        hasLocalChanges,
        lastSynced,
        syncError,
        isLoading,
        isPermissionChecking,
      }}
    >
      {children}
    </TaskManagerContext.Provider>
  );
};
