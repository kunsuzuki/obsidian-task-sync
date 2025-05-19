/**
 * CSVデータ管理のためのユーティリティ関数
 * RFC 4180に準拠したCSV形式の処理を提供
 */

/**
 * 文字列をCSV形式に変換
 * @param value 変換する文字列
 * @returns CSV形式に変換された文字列
 */
export const escapeCSV = (value: string | number | null | undefined): string => {
  if (value === null || value === undefined) {
    return '""';
  }
  
  const stringValue = String(value);
  // ダブルクォートを含む場合、ダブルクォートでエスケープ
  const escaped = stringValue.replace(/"/g, '""');
  // 常にダブルクォートで囲む
  return `"${escaped}"`;
};

/**
 * 配列をCSV行に変換
 * @param values 変換する値の配列
 * @returns CSV形式の行
 */
export const arrayToCSVLine = (values: (string | number | null | undefined)[]): string => {
  return values.map(escapeCSV).join(',');
};

/**
 * CSV行を配列に変換
 * @param line CSV形式の行
 * @returns 変換された値の配列
 */
export const parseCSVLine = (line: string): string[] => {
  const result: string[] = [];
  let inQuotes = false;
  let currentValue = '';
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = i < line.length - 1 ? line[i + 1] : '';
    
    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // エスケープされたダブルクォート
        currentValue += '"';
        i++; // 次の文字をスキップ
      } else {
        // クォートの開始または終了
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      // フィールドの区切り
      result.push(currentValue);
      currentValue = '';
    } else {
      // 通常の文字
      currentValue += char;
    }
  }
  
  // 最後のフィールドを追加
  result.push(currentValue);
  
  return result;
};

/**
 * 複数行のCSVテキストを解析
 * @param csvText 複数行のCSVテキスト
 * @returns 行ごとに分割された値の配列
 */
export const parseCSV = (csvText: string): string[][] => {
  // 空の場合は空配列を返す
  if (!csvText.trim()) {
    return [];
  }
  
  // 行ごとに分割して解析
  return csvText
    .split('\n')
    .filter(line => line.trim()) // 空行を除外
    .map(parseCSVLine);
};

/**
 * 配列のリストをCSVテキストに変換
 * @param rows 行ごとの値の配列
 * @returns CSV形式のテキスト
 */
export const formatCSV = (rows: (string | number | null | undefined)[][]): string => {
  return rows.map(arrayToCSVLine).join('\n');
};
