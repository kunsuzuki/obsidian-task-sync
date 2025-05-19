/**
 * リンク関連のユーティリティ関数
 */

/**
 * Obsidianのリンク形式かどうかを判定する
 * @param text テキスト
 * @returns リンク形式ならtrue
 */
export const isObsidianLink = (text: string): boolean => {
  if (!text) return false;
  return /\[\[.+?\]\]/.test(text);
};

/**
 * Obsidianのリンク形式からノート名を抽出する
 * @param link リンク文字列（例: [[ノート名]]）
 * @returns 抽出されたノート名
 */
export const extractNoteNameFromLink = (link: string): string | null => {
  if (!link) return null;
  
  // [[ノート名]]の形式からノート名を抽出
  const match = link.match(/\[\[(.*?)\]\]/);
  if (match && match[1]) {
    return match[1].trim();
  }
  
  // リンク形式でない場合はそのまま返す
  return link.trim();
};

/**
 * テキストをObsidianのリンク形式に変換する
 * @param text テキスト
 * @returns リンク形式のテキスト
 */
export const convertToObsidianLink = (text: string): string => {
  if (!text) return '';
  
  // 既にリンク形式の場合はそのまま返す
  if (isObsidianLink(text)) {
    return text;
  }
  
  // リンク形式に変換
  return `[[${text.trim()}]]`;
};

/**
 * ファイル名に使用できない文字を削除または置換
 * @param fileName ファイル名
 * @returns サニタイズされたファイル名
 */
export const sanitizeFileName = (fileName: string): string => {
  if (!fileName) return '';
  
  // ファイル名に使用できない文字を削除または置換
  return fileName
    .replace(/[\\/:*?"<>|]/g, '') // Windowsで使用できない文字を削除
    .replace(/\s+/g, ' ')         // 連続する空白を1つにまとめる
    .trim();                      // 前後の空白を削除
};

/**
 * リンクテキストからファイル名を生成する
 * @param linkText リンクテキスト
 * @returns ファイル名（.mdを含まない）
 */
export const generateFileNameFromLink = (linkText: string): string => {
  const noteName = extractNoteNameFromLink(linkText);
  if (!noteName) return '';
  
  return sanitizeFileName(noteName);
};

/**
 * リンクテキストからファイルパスを生成する
 * @param linkText リンクテキスト
 * @param folderPath フォルダパス
 * @returns ファイルパス
 */
export const generateFilePathFromLink = (linkText: string, folderPath: string): string => {
  const fileName = generateFileNameFromLink(linkText);
  if (!fileName) return '';
  
  // フォルダパスの末尾のスラッシュを正規化
  const normalizedFolderPath = folderPath.endsWith('/') ? folderPath : `${folderPath}/`;
  
  return `${normalizedFolderPath}${fileName}.md`;
};
