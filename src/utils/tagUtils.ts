/**
 * タグ関連のユーティリティ関数
 */
import { Tag } from '../types';

/**
 * タグ名からタグを検索する
 * @param tags タグの配列
 * @param tagName 検索するタグ名
 * @returns 見つかったタグまたはnull
 */
export const findTagByName = (tags: Tag[], tagName: string): Tag | null => {
  const normalizedName = tagName.trim().toLowerCase();
  return tags.find(tag => tag.name.toLowerCase() === normalizedName) || null;
};

/**
 * タグ名に基づいてタグをフィルタリングする
 * @param tags タグの配列
 * @param query 検索クエリ
 * @returns フィルタリングされたタグの配列
 */
export const filterTagsByName = (tags: Tag[], query: string): Tag[] => {
  if (!query || query.trim() === '') {
    return tags;
  }
  
  const normalizedQuery = query.trim().toLowerCase();
  return tags.filter(tag => tag.name.toLowerCase().includes(normalizedQuery));
};

/**
 * タグの配列から重複を除去する
 * @param tags タグの配列
 * @returns 重複を除去したタグの配列
 */
export const removeDuplicateTags = (tags: Tag[]): Tag[] => {
  const uniqueTagIds = new Set<string>();
  return tags.filter(tag => {
    if (uniqueTagIds.has(tag.id)) {
      return false;
    }
    uniqueTagIds.add(tag.id);
    return true;
  });
};

/**
 * タグ名を正規化する（空白を削除し、小文字に変換）
 * @param tagName タグ名
 * @returns 正規化されたタグ名
 */
export const normalizeTagName = (tagName: string): string => {
  return tagName.trim().toLowerCase();
};

/**
 * 選択されたタグを更新する（追加または削除）
 * @param selectedTags 現在選択されているタグの配列
 * @param tag 追加または削除するタグ
 * @returns 更新されたタグの配列
 */
export const toggleTagSelection = (selectedTags: Tag[], tag: Tag): Tag[] => {
  const isSelected = selectedTags.some(selectedTag => selectedTag.id === tag.id);
  
  if (isSelected) {
    // タグが既に選択されている場合は削除
    return selectedTags.filter(selectedTag => selectedTag.id !== tag.id);
  } else {
    // タグが選択されていない場合は追加
    return [...selectedTags, tag];
  }
};
