import { FileHandleCache, DirectoryHandleCache } from '../types';

// ファイルハンドルとディレクトリハンドルのキャッシュ
let fileHandleCache: FileHandleCache = {};
export let directoryHandleCache: DirectoryHandleCache = {};

// ページ読み込み時にディレクトリハンドルのキャッシュを初期化
if (typeof window !== 'undefined') {
  // セッションストレージからキャッシュ状態をチェック
  const cacheStatus = sessionStorage.getItem('directory-handle-cache-status');
  if (cacheStatus) {
    try {
      const status = JSON.parse(cacheStatus);
      console.log('セッションストレージからキャッシュ状態を読み込みました:', status);
    } catch (error) {
      console.error('キャッシュ状態の解析中にエラーが発生しました:', error);
    }
  }
}

/**
 * File System Access APIがサポートされているかチェック
 */
export const isFileSystemAccessSupported = (): boolean => {
  try {
    // ブラウザ環境でない場合はサポートされていないと判断
    if (typeof window === 'undefined') return false;
    
    // Chrome, Edge, Operaなどのモダンブラウザでサポートされているメソッドをチェック
    return typeof window.showDirectoryPicker === 'function' && 
           typeof window.showOpenFilePicker === 'function' && 
           typeof window.showSaveFilePicker === 'function';
  } catch (error) {
    console.error('File System Access APIのサポート確認中にエラーが発生しました:', error);
    return false;
  }
};

/**
 * ディレクトリピッカーを表示してディレクトリハンドルを取得
 */
export const getDirectoryHandle = async (): Promise<FileSystemDirectoryHandle | null> => {
  try {
    if (!isFileSystemAccessSupported()) {
      throw new Error('File System Access APIはサポートされていません');
    }

    // ディレクトリピッカーを表示
    const dirHandle = await window.showDirectoryPicker({
      id: 'obsidian-vault',
      mode: 'readwrite',
      startIn: 'documents',
    });

    return dirHandle;
  } catch (error) {
    console.error('ディレクトリの選択中にエラーが発生しました:', error);
    return null;
  }
};

/**
 * ディレクトリハンドルをキャッシュに保存
 */
export const cacheDirectoryHandle = async (key: string, handle: FileSystemDirectoryHandle): Promise<void> => {
  // メモリ上のキャッシュに保存
  try {
    // 権限を確認し、必要に応じて再リクエスト
    try {
      // @ts-ignore - TypeScriptの型定義が最新のAPIに追いついていない場合の対処
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      console.log(`ディレクトリハンドルの権限状態: ${permission}`);
    } catch (error) {
      console.error('権限確認中にエラーが発生しました:', error);
    }
    
    // メモリ上のキャッシュに保存
    directoryHandleCache[key] = handle;
    
    // キャッシュのステータスを保存
    const cacheStatus = {
      timestamp: Date.now(),
      keys: Object.keys(directoryHandleCache)
    };
    
    // ローカルストレージとセッションストレージにステータスを保存
    localStorage.setItem('directory-handle-cache-status', JSON.stringify(cacheStatus));
    sessionStorage.setItem('directory-handle-cache-status', JSON.stringify(cacheStatus));
    
    console.log(`ディレクトリハンドルをキャッシュに保存しました: ${key}`);
  } catch (error) {
    console.error(`ディレクトリハンドルのキャッシュ中にエラーが発生しました: ${key}`, error);
  }
};

/**
 * パスからディレクトリを作成する
 * @param rootDirHandle ルートディレクトリハンドル
 * @param path 作成するディレクトリのパス（例: 'path/to/directory'）
 * @returns 作成したディレクトリハンドル
 */
export const createDirectoryByPath = async (
  rootDirHandle: FileSystemDirectoryHandle,
  path: string
): Promise<FileSystemDirectoryHandle> => {
  // パスを分割
  const pathParts = path.split('/');
  let currentDir = rootDirHandle;
  
  // 各パスセグメントに対してディレクトリを作成
  for (const part of pathParts) {
    if (part.trim() === '') continue;
    try {
      currentDir = await currentDir.getDirectoryHandle(part, { create: true });
    } catch (error) {
      console.error(`ディレクトリ '${part}' の作成中にエラーが発生しました:`, error);
      throw new Error(`ディレクトリ '${part}' の作成に失敗しました。`);
    }
  }
  
  return currentDir;
};

/**
 * キャッシュからディレクトリハンドルを取得
 */
export const getDirectoryHandleFromCache = async (key: string): Promise<FileSystemDirectoryHandle | undefined> => {
  try {
    // まずメモリ上のキャッシュを確認
    let handle = directoryHandleCache[key];
    
    // ディレクトリハンドルが存在するか確認
    if (!handle) {
      console.log(`メモリ上にディレクトリハンドルが存在しません: ${key}`);
      return undefined;
    }
    
    console.log(`メモリ上のキャッシュからディレクトリハンドルを取得しました: ${key}`);
    
    // ディレクトリハンドルの型を確認
    if (typeof handle !== 'object' || handle === null) {
      console.error('キャッシュから取得したディレクトリハンドルが無効です (オブジェクトではありません):', handle);
      _clearCacheForKey(key);
      return undefined;
    }
    
    // getFileHandleメソッドが存在するか確認
    if (typeof handle.getFileHandle !== 'function') {
      console.error('キャッシュから取得したディレクトリハンドルが無効です (getFileHandleメソッドが存在しません):', handle);
      _clearCacheForKey(key);
      return undefined;
    }
    
    // ディレクトリハンドルの詳細をログに出力
    try {
      console.log(`キャッシュから取得したディレクトリハンドル情報:`, {
        name: handle.name,
        kind: handle.kind,
        methods: Object.getOwnPropertyNames(Object.getPrototypeOf(handle))
      });
    } catch (error) {
      console.error('ディレクトリハンドルの詳細取得中にエラーが発生しました:', error);
      _clearCacheForKey(key);
      return undefined;
    }
    
    // 権限を確認し、必要に応じて再リクエスト
    try {
      // @ts-ignore - TypeScriptの型定義が最新のAPIに追いついていない場合の対処
      const permission = await handle.requestPermission({ mode: 'readwrite' });
      console.log(`ディレクトリハンドルの権限状態: ${permission}`);
      
      // 権限が付与されていない場合は再選択を促す
      if (permission !== 'granted') {
        console.warn('ディレクトリへの権限が付与されていません。再選択が必要です。');
        _clearCacheForKey(key);
        return undefined;
      }
    } catch (error) {
      console.error('権限確認中にエラーが発生しました:', error);
      // エラーが発生した場合はキャッシュをクリアして再選択を促す
      _clearCacheForKey(key);
      return undefined;
    }
    
    // すべてのチェックに通過した場合はディレクトリハンドルを返す
    return handle;
  } catch (error) {
    console.error('ディレクトリハンドルの取得中に予期しないエラーが発生しました:', error);
    _clearCacheForKey(key);
    return undefined;
  }
}

/**
 * キャッシュをクリアするヘルパー関数
 */
const _clearCacheForKey = (key: string): void => {
  console.log(`キャッシュをクリアします: ${key}`);
  delete directoryHandleCache[key];
  localStorage.removeItem('directory-handle-cache-status');
  sessionStorage.removeItem('directory-handle-cache-status');
}

/**
 * キャッシュにない場合の処理
 */
export const checkStoredSettings = async (key: string): Promise<void> => {
  try {
    // 保管庫の設定を確認
    const savedSettings = localStorage.getItem('obsidian-task-sync-settings');
    if (savedSettings) {
      const parsedSettings = JSON.parse(savedSettings);
      if (parsedSettings.vaultPath && parsedSettings.vaultPath !== '未選択') {
        console.log('保管庫が選択されていますが、ディレクトリハンドルはキャッシュにありません');
        console.log('ディレクトリピッカーを表示するにはユーザージェスチャーが必要です');
      }
    }
  } catch (error) {
    console.error('設定の確認中にエラーが発生しました:', error);
  }
};

/**
 * ディレクトリ内にサブディレクトリを作成
 */
export const createDirectory = async (
  parentHandle: FileSystemDirectoryHandle,
  dirName: string
): Promise<FileSystemDirectoryHandle | null> => {
  try {
    const dirHandle = await parentHandle.getDirectoryHandle(dirName, { create: true });
    return dirHandle;
  } catch (error) {
    console.error(`ディレクトリ ${dirName} の作成中にエラーが発生しました:`, error);
    return null;
  }
};

/**
 * パスからディレクトリハンドルを取得（必要に応じて作成）
 */
export const getOrCreateDirectoryByPath = async (
  rootHandle: FileSystemDirectoryHandle,
  path: string
): Promise<FileSystemDirectoryHandle | null> => {
  try {
    // パスを分割
    const parts = path.split('/').filter(part => part !== '');
    let currentHandle = rootHandle;

    // 各パーツごとにディレクトリを取得または作成
    for (const part of parts) {
      currentHandle = await currentHandle.getDirectoryHandle(part, { create: true });
    }

    return currentHandle;
  } catch (error) {
    console.error(`パス ${path} のディレクトリ取得中にエラーが発生しました:`, error);
    return null;
  }
};

/**
 * ファイルを読み込む
 */
export const readFile = async (fileHandle: FileSystemFileHandle): Promise<string> => {
  try {
    const file = await fileHandle.getFile();
    const content = await file.text();
    return content;
  } catch (error) {
    console.error('ファイルの読み込み中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * ファイルに書き込む
 */
export const writeFile = async (fileHandle: FileSystemFileHandle, content: string): Promise<void> => {
  try {
    const writable = await fileHandle.createWritable();
    await writable.write(content);
    await writable.close();
  } catch (error) {
    console.error('ファイルの書き込み中にエラーが発生しました:', error);
    throw error;
  }
};

/**
 * ファイルハンドルを取得または作成
 */
export const getOrCreateFileHandle = async (
  dirHandle: FileSystemDirectoryHandle,
  fileName: string
): Promise<FileSystemFileHandle> => {
  try {
    // dirHandleが正しいディレクトリハンドルか確認
    if (!dirHandle || typeof dirHandle.getFileHandle !== 'function') {
      console.error('無効なディレクトリハンドルです:', dirHandle);
      throw new Error('無効なディレクトリハンドルです。保管庫を再選択してください。');
    }
    
    // ディレクトリハンドルの詳細をログに出力
    console.log(`ディレクトリハンドル情報:`, {
      name: dirHandle.name,
      kind: dirHandle.kind,
      methods: Object.getOwnPropertyNames(Object.getPrototypeOf(dirHandle))
    });
    
    const fileHandle = await dirHandle.getFileHandle(fileName, { create: true });
    return fileHandle;
  } catch (error) {
    console.error(`ファイル ${fileName} の取得中にエラーが発生しました:`, error);
    throw error;
  }
};

/**
 * ファイルハンドルをキャッシュに保存
 */
export const cacheFileHandle = (path: string, handle: FileSystemFileHandle): void => {
  fileHandleCache[path] = handle;
};

/**
 * キャッシュからファイルハンドルを取得
 */
export const getFileHandleFromCache = (path: string): FileSystemFileHandle | undefined => {
  return fileHandleCache[path];
};

/**
 * ディレクトリ内のすべてのマークダウンファイルを取得
 */
export const getAllMarkdownFiles = async (dirHandle: FileSystemDirectoryHandle): Promise<FileSystemFileHandle[]> => {
  const files: FileSystemFileHandle[] = [];
  
  try {
    for await (const [name, handle] of dirHandle.entries()) {
      if (handle.kind === 'file' && name.endsWith('.md')) {
        files.push(handle as FileSystemFileHandle);
      } else if (handle.kind === 'directory') {
        const subDirFiles = await getAllMarkdownFiles(handle as FileSystemDirectoryHandle);
        files.push(...subDirFiles);
      }
    }
  } catch (error) {
    console.error('マークダウンファイルの取得中にエラーが発生しました:', error);
  }
  
  return files;
};

/**
 * ファイルの最終更新日時を取得
 */
export const getFileLastModified = async (fileHandle: FileSystemFileHandle): Promise<Date> => {
  const file = await fileHandle.getFile();
  return new Date(file.lastModified);
};

/**
 * キャッシュをクリア
 */
export const clearCache = (): void => {
  fileHandleCache = {};
  directoryHandleCache = {};
};

// ファイルシステムの権限を確認
export const verifyPermission = async (
  fileHandle: FileSystemFileHandle | FileSystemDirectoryHandle,
  readWrite: boolean
): Promise<boolean> => {
  const options: FileSystemHandlePermissionDescriptor = {
    mode: readWrite ? 'readwrite' : 'read',
  };
  
  try {
    // 権限状態を確認 (as any を使用して型エラーを回避)
    if ((await (fileHandle as any).queryPermission(options)) === 'granted') {
      return true;
    }
    
    // 権限をリクエスト (as any を使用して型エラーを回避)
    if ((await (fileHandle as any).requestPermission(options)) === 'granted') {
      return true;
    }
  } catch (error) {
    console.error('権限の確認中にエラーが発生しました:', error);
  }
  
  return false;
};
