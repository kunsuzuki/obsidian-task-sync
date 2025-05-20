"use client";

import { createContext, useContext, useState, ReactNode } from 'react';
import { useAppSettings } from './useAppSettings';
import { createOrUpdateLinkedNote, createOrUpdateMultipleLinkedNotes } from '../services/noteService';
import { getDirectoryHandleFromCache } from '../utils/fileSystem';
import { extractNoteNameFromLink, isObsidianLink } from '../utils/linkUtils';
import toast from 'react-hot-toast';

// コンテキストの型定義
interface NoteManagerContextType {
  createNote: (noteName: string, content?: string) => Promise<boolean>;
  createMultipleNotes: (noteNames: string[]) => Promise<string[]>;
  isCreatingNote: boolean;
}

// コンテキストの作成
const NoteManagerContext = createContext<NoteManagerContextType | undefined>(undefined);

// プロバイダーコンポーネント
export const NoteManagerProvider = ({ children }: { children: ReactNode }): React.ReactNode => {
  const { settings } = useAppSettings();
  const [isCreatingNote, setIsCreatingNote] = useState(false);

  /**
   * ノートを作成する
   * @param noteName ノート名（Obsidianリンク形式も可）
   * @param content ノートの内容（省略可）
   * @returns 成功した場合はtrue
   */
  const createNote = async (noteName: string, content?: string): Promise<boolean> => {
    // ノート名が空の場合は作成しない
    if (!noteName || noteName.trim() === '') {
      toast.error('ノート名が空です');
      return false;
    }
    
    // リンク形式かどうかをチェックし、表示用のノート名を取得
    const displayName = isObsidianLink(noteName) ? extractNoteNameFromLink(noteName) || noteName : noteName;
    if (!noteName || noteName.trim() === '') {
      return false;
    }

    if (!settings.vaultPath || settings.vaultPath === '未選択') {
      toast.error('保管庫が選択されていません。設定画面で保管庫を選択してください。');
      return false;
    }

    setIsCreatingNote(true);

    try {
      // ディレクトリハンドルを非同期で取得
      const vaultDirHandle = await getDirectoryHandleFromCache('vault');
      if (!vaultDirHandle) {
        toast.error('保管庫のディレクトリハンドルが見つかりません');
        setIsCreatingNote(false);
        return false;
      }

      const success = await createOrUpdateLinkedNote(
        vaultDirHandle,
        settings.noteFolderPath || '',
        noteName,
        content
      );
      
      if (success) {
        toast.success(`ノート「${displayName}」を作成しました`, { duration: 3000 });
      }

      return success;
    } catch (error) {
      console.error('ノートの作成中にエラーが発生しました:', error);
      toast.error(`ノートの作成中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      return false;
    } finally {
      setIsCreatingNote(false);
    }
  };

  /**
   * 複数のリンク先ノートを作成する
   */
  const createMultipleNotes = async (noteNames: string[]): Promise<string[]> => {
    if (!settings.vaultPath || settings.vaultPath === '未選択') {
      toast.error('保管庫が選択されていません。設定画面で保管庫を選択してください。');
      return [];
    }

    setIsCreatingNote(true);

    try {
      // ディレクトリハンドルを非同期で取得
      const vaultDirHandle = await getDirectoryHandleFromCache('vault');
      if (!vaultDirHandle) {
        toast.error('保管庫のディレクトリハンドルが取得できませんでした。');
        return [];
      }

      const successfulNotes = await createOrUpdateMultipleLinkedNotes(
        vaultDirHandle,
        settings.noteFolderPath || '',
        noteNames
      );

      return successfulNotes;
    } catch (error) {
      console.error('ノートの作成中にエラーが発生しました:', error);
      toast.error(`ノートの作成中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`);
      return [];
    } finally {
      setIsCreatingNote(false);
    }
  };

  return (
    <NoteManagerContext.Provider
      value={{
        createNote,
        createMultipleNotes,
        isCreatingNote
      }}
    >
      {children}
    </NoteManagerContext.Provider>
  );
};

// カスタムフック
export const useNoteManager = () => {
  const context = useContext(NoteManagerContext);
  if (context === undefined) {
    throw new Error('useNoteManager must be used within a NoteManagerProvider');
  }
  return context;
};
