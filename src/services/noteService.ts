/**
 * ノート操作に関するサービス
 */
import { getFileHandle, readTextFile, writeTextFile } from '../utils/fileSystemUtils';
import { Task } from '../types';
import { extractNoteNameFromLink, generateFilePathFromLink, sanitizeFileName } from '../utils/linkUtils';
import toast from 'react-hot-toast';

/**
 * リンク先ノートを作成または更新する
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param noteFolderPath ノートを保存するフォルダのパス
 * @param noteName ノート名（Obsidianリンク形式も可）
 * @param content ノートの内容（省略可）
 * @returns 成功した場合はtrue、失敗した場合はfalse
 */
export const createOrUpdateLinkedNote = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  noteFolderPath: string,
  noteName: string,
  content?: string
): Promise<boolean> => {
  // リンク形式からノート名を抽出
  const extractedNoteName = extractNoteNameFromLink(noteName) || noteName;
  // ファイル名をサニタイズ
  const sanitizedNoteName = sanitizeFileName(extractedNoteName);
  try {
    // ノートのファイルパスを生成
    const noteFilePath = generateFilePathFromLink(sanitizedNoteName, noteFolderPath);
    
    // ファイルハンドルを取得
    const fileHandle = await getFileHandle(vaultDirHandle, noteFilePath, true);
    
    // 既存のノート内容を取得
    let existingContent = '';
    try {
      existingContent = await readTextFile(fileHandle);
    } catch (error) {
      // ファイルが存在しない場合は空文字列のまま
      console.log('新規ノートを作成します');
    }
    
    // ノートの内容を設定
    const noteContent = content || existingContent || `# ${extractedNoteName}

作成日: ${new Date().toLocaleDateString('ja-JP')}

## メモ

`;
    
    // ノートを書き込み
    await writeTextFile(fileHandle, noteContent);
    
    console.log(`ノートを保存しました: ${noteFilePath}`);
    toast.success(`リンク先ノート「${noteName}」を作成しました`, { duration: 3000 });
    return true;
  } catch (error) {
    console.error('リンク先ノートの作成中にエラーが発生しました:', error);
    toast.error(`リンク先ノートの作成中にエラーが発生しました: ${error instanceof Error ? error.message : '不明なエラー'}`, { duration: 5000 });
    return false;
  }
};

/**
 * 複数のリンク先ノートを作成または更新する
 * @param vaultDirHandle 保管庫のディレクトリハンドル
 * @param noteFolderPath ノートフォルダのパス
 * @param noteNames ノート名の配列
 * @returns 成功したノート名の配列
 */
export const createOrUpdateMultipleLinkedNotes = async (
  vaultDirHandle: FileSystemDirectoryHandle,
  noteFolderPath: string,
  noteNames: string[]
): Promise<string[]> => {
  const successfulNotes: string[] = [];
  
  for (const noteName of noteNames) {
    const success = await createOrUpdateLinkedNote(
      vaultDirHandle,
      noteFolderPath,
      noteName
    );
    
    if (success) {
      successfulNotes.push(noteName);
    }
  }
  
  return successfulNotes;
};
