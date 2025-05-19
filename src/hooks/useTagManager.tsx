"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Tag, TaskTag } from '../types';
import { useAppSettings } from './useAppSettings';
import { getDirectoryHandleFromCache } from '../utils/fileSystem';
import { readTagsFile, writeTagsFile, readTaskTagsFile, writeTaskTagsFile } from '../utils/fileSystemUtils';
import { generateId } from '../utils/idUtils';
import { findTagByName, filterTagsByName, normalizeTagName, removeDuplicateTags } from '../utils/tagUtils';

// コンテキストの型定義
interface TagManagerContextType {
  tags: Tag[];
  taskTags: TaskTag[];
  addTag: (name: string) => Tag;
  updateTag: (tagId: string, updates: Partial<Tag>) => void;
  deleteTag: (tagId: string) => void;
  getTagsForTask: (taskId: string) => Tag[];
  addTagToTask: (taskId: string, tagId: string) => void;
  removeTagFromTask: (taskId: string, tagId: string) => void;
  syncTags: () => Promise<{ tags: Tag[]; taskTags: TaskTag[]; } | void>;
  searchTagsByName: (query: string) => Tag[];
}

// コンテキストの作成
export const TagManagerContext = createContext<TagManagerContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const TagManagerProvider = ({ children }: { children: ReactNode }) => {
  const { settings } = useAppSettings();
  const [tags, setTags] = useState<Tag[]>([]);
  const [taskTags, setTaskTags] = useState<TaskTag[]>([]);

  // 初期化時にローカルストレージからデータを読み込む
  useEffect(() => {
    const savedTags = localStorage.getItem('obsidian-task-sync-tags');
    const savedTaskTags = localStorage.getItem('obsidian-task-sync-task-tags');

    if (savedTags) {
      try {
        setTags(JSON.parse(savedTags));
      } catch (error) {
        console.error('タグの読み込み中にエラーが発生しました:', error);
      }
    }

    if (savedTaskTags) {
      try {
        setTaskTags(JSON.parse(savedTaskTags));
      } catch (error) {
        console.error('タスク-タグ関連付けの読み込み中にエラーが発生しました:', error);
      }
    }
  }, []);

  // タグが変更されたらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('obsidian-task-sync-tags', JSON.stringify(tags));
  }, [tags]);

  // タスク-タグ関連付けが変更されたらローカルストレージに保存
  useEffect(() => {
    localStorage.setItem('obsidian-task-sync-task-tags', JSON.stringify(taskTags));
  }, [taskTags]);

  // タグを追加
  const addTag = (name: string): Tag => {
    // 名前が空の場合は追加しない
    if (!name || name.trim() === '') {
      throw new Error('タグ名を入力してください');
    }
    
    // 既存のタグと重複しないか確認（tagUtilsを使用）
    const normalizedName = normalizeTagName(name);
    const existingTag = findTagByName(tags, normalizedName);
    
    if (existingTag) {
      return existingTag;
    }
    
    const newTag: Tag = {
      id: generateId(),
      name: name.trim(),
      color: '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    
    const updatedTags = [...tags, newTag];
    setTags(updatedTags);
    // ローカルストレージに保存
    localStorage.setItem('obsidian-task-sync-tags', JSON.stringify(updatedTags));
    
    return newTag;
  };

  // タグを更新
  const updateTag = (tagId: string, updates: Partial<Tag>) => {
    const updatedTags = tags.map(tag => 
      tag.id === tagId 
        ? { 
            ...tag, 
            ...updates, 
            updatedAt: new Date().toISOString() 
          } 
        : tag
    );
    
    setTags(updatedTags);
    
    // ローカルストレージに即時保存
    localStorage.setItem('obsidian-task-sync-tags', JSON.stringify(updatedTags));
    
    // 非同期で保管庫にも同期
    syncTags().catch(error => {
      console.error('タグの同期中にエラーが発生しました:', error);
    });
  };

  // タグを削除
  const deleteTag = (tagId: string) => {
    setTags(prevTags => prevTags.filter(tag => tag.id !== tagId));
    
    // 関連するタスク-タグ関連付けも削除
    setTaskTags(prevTaskTags => prevTaskTags.filter(taskTag => taskTag.tagId !== tagId));
  };

  // 特定のタスクに関連付けられたタグを取得
  const getTagsForTask = (taskId: string): Tag[] => {
    const taskTagRelations = taskTags.filter(tt => tt.taskId === taskId);
    const taskTagsList = taskTagRelations.map(tt => {
      const tag = tags.find(t => t.id === tt.tagId);
      return tag || { id: tt.tagId, name: '不明なタグ', color: '#cccccc', createdAt: '', updatedAt: '' };
    });
    
    // 重複を除去して返す（tagUtilsを使用）
    return removeDuplicateTags(taskTagsList);
  };

  // タスクにタグを追加
  const addTagToTask = (taskId: string, tagId: string) => {
    // 既に関連付けられているか確認
    const exists = taskTags.some(
      taskTag => taskTag.taskId === taskId && taskTag.tagId === tagId
    );
    
    if (!exists) {
      const newTaskTag: TaskTag = {
        id: generateId(),
        taskId,
        tagId,
        createdAt: new Date().toISOString()
      };
      
      const updatedTaskTags = [...taskTags, newTaskTag];
      setTaskTags(updatedTaskTags);
      
      // ローカルストレージに即時保存
      localStorage.setItem('obsidian-task-sync-task-tags', JSON.stringify(updatedTaskTags));
      
      // 非同期で保管庫にも同期
      syncTags().catch(error => {
        console.error('タグの同期中にエラーが発生しました:', error);
      });
    }
  };

  // タスクからタグを削除
  const removeTagFromTask = (taskId: string, tagId: string) => {
    const updatedTaskTags = taskTags.filter(
      taskTag => !(taskTag.taskId === taskId && taskTag.tagId === tagId)
    );
    
    setTaskTags(updatedTaskTags);
    
    // ローカルストレージに即時保存
    localStorage.setItem('obsidian-task-sync-task-tags', JSON.stringify(updatedTaskTags));
    
    // 非同期で保管庫にも同期
    syncTags().catch(error => {
      console.error('タグの同期中にエラーが発生しました:', error);
    });
  };

  // タグデータを同期
  const syncTags = async () => {
    try {
      console.log('タグ同期を開始します...');
      const vaultDirHandle = await getDirectoryHandleFromCache('vault');
      if (!vaultDirHandle) {
        throw new Error('保管庫が選択されていません');
      }

      // 現在のタグをログ出力
      console.log(`同期前のタグ数: ${tags.length}, タスク-タグ関連付け数: ${taskTags.length}`);

      // タグファイルを読み込む
      const fileTags = await readTagsFile(vaultDirHandle, settings.taskFolderPath);
      console.log(`ファイルから読み込んだタグ数: ${fileTags.length}`);
      
      // タスク-タグ関連付けファイルを読み込む
      const fileTaskTags = await readTaskTagsFile(vaultDirHandle, settings.taskFolderPath);
      console.log(`ファイルから読み込んだタスク-タグ関連付け数: ${fileTaskTags.length}`);
      
      // マージ（同じIDのものは新しい方を優先）
      const mergedTags = mergeTags(tags, fileTags);
      const mergedTaskTags = mergeTaskTags(taskTags, fileTaskTags);
      
      console.log(`マージ後のタグ数: ${mergedTags.length}, タスク-タグ関連付け数: ${mergedTaskTags.length}`);
      
      // 状態を更新
      setTags(mergedTags);
      setTaskTags(mergedTaskTags);
      
      // ローカルストレージに保存
      localStorage.setItem('obsidian-task-sync-tags', JSON.stringify(mergedTags));
      localStorage.setItem('obsidian-task-sync-task-tags', JSON.stringify(mergedTaskTags));
      
      // ファイルに書き戻し
      await writeTagsFile(mergedTags, vaultDirHandle, settings.taskFolderPath);
      await writeTaskTagsFile(mergedTaskTags, vaultDirHandle, settings.taskFolderPath);
      
      console.log('タグデータの同期が完了しました');
      return { tags: mergedTags, taskTags: mergedTaskTags };
    } catch (error) {
      console.error('タグデータの同期中にエラーが発生しました:', error);
      throw error;
    }
  };

  // タグをマージ（同じIDのものは新しい方を優先）
  const mergeTags = (localTags: Tag[], fileTags: Tag[]): Tag[] => {
    const tagMap = new Map<string, Tag>();
    
    // ローカルタグを追加
    localTags.forEach(tag => {
      tagMap.set(tag.id, tag);
    });
    
    // ファイルのタグをマージ（更新日時が新しい場合のみ上書き）
    fileTags.forEach(fileTag => {
      const localTag = tagMap.get(fileTag.id);
      
      if (!localTag || new Date(fileTag.updatedAt) > new Date(localTag.updatedAt)) {
        tagMap.set(fileTag.id, fileTag);
      }
    });
    
    return Array.from(tagMap.values());
  };

  // タスク-タグ関連付けをマージ
  const mergeTaskTags = (localTaskTags: TaskTag[], fileTaskTags: TaskTag[]): TaskTag[] => {
    const taskTagMap = new Map<string, TaskTag>();
    
    // ローカルのタスク-タグ関連付けを追加
    localTaskTags.forEach(taskTag => {
      taskTagMap.set(taskTag.id, taskTag);
    });
    
    // ファイルのタスク-タグ関連付けをマージ
    fileTaskTags.forEach(fileTaskTag => {
      const localTaskTag = taskTagMap.get(fileTaskTag.id);
      
      if (!localTaskTag) {
        taskTagMap.set(fileTaskTag.id, fileTaskTag);
      }
    });
    
    return Array.from(taskTagMap.values());
  };

  // タグでタスクをフィルタリングするための関数
  const filterTasksByTag = (taskIds: string[], tagId: string): string[] => {
    const filteredTaskTags = taskTags.filter(tt => tt.tagId === tagId);
    return filteredTaskTags.map(tt => tt.taskId).filter(id => taskIds.includes(id));
  };
  
  // タグ名で検索するための関数
  const searchTagsByName = (query: string): Tag[] => {
    return filterTagsByName(tags, query);
  };

  return (
    <TagManagerContext.Provider
      value={{
        tags,
        taskTags,
        addTag,
        updateTag,
        deleteTag,
        getTagsForTask,
        addTagToTask,
        removeTagFromTask,
        syncTags,
        searchTagsByName, // 新しい関数を追加
      }}
    >
      {children}
    </TagManagerContext.Provider>
  );
};

// フックの作成
export const useTagManager = () => {
  const context = useContext(TagManagerContext);
  if (context === undefined) {
    throw new Error('useTagManager must be used within a TagManagerProvider');
  }
  return context;
};
