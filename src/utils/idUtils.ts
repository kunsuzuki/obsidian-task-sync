/**
 * ID生成ユーティリティ
 */

/**
 * ランダムな英数字文字列を生成
 * @param length 生成する文字列の長さ
 * @returns ランダムな英数字文字列
 */
export const generateRandomString = (length: number): string => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

/**
 * プレフィックス付きのIDを生成
 * @param prefix IDのプレフィックス
 * @returns プレフィックス付きのID
 */
export const generateId = (prefix: string): string => {
  const timestamp = new Date().getTime().toString(36);
  const random = generateRandomString(6);
  return `${prefix}-${timestamp}-${random}`;
};

/**
 * タスクIDを生成
 * @returns タスクID
 */
export const generateTaskId = (): string => {
  return generateId('task');
};

/**
 * タグIDを生成
 * @returns タグID
 */
export const generateTagId = (): string => {
  return generateId('tag');
};

/**
 * タスク-タグ関連付けIDを生成
 * @returns タスク-タグ関連付けID
 */
export const generateTaskTagId = (): string => {
  return generateId('tasktag');
};

/**
 * ノートIDを生成
 * @returns ノートID
 */
export const generateNoteId = (): string => {
  return generateId('note');
};
