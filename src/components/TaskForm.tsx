"use client";

import { useState, useEffect, useRef } from 'react';
import { Task, Tag, TASK_STATUS, TASK_STATUS_LABELS } from '../types';
import { useTaskManager } from '../hooks/useTaskManager';
import { useTagManager } from '../hooks/useTagManager';
// ノート管理用のフックをインポート
import { useNoteManager } from '../hooks/useNoteManager';

interface TaskFormProps {
  taskToEdit?: Task;
  onCancel?: () => void;
}

const TaskForm = ({ taskToEdit, onCancel }: TaskFormProps) => {
  const { addTask, updateTask } = useTaskManager();
  const { tags: allTags, addTag, getTagsForTask, addTagToTask, removeTagFromTask } = useTagManager();
  // ノート管理用のフックを使用
  const { createNote } = useNoteManager();
  
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState<Task['status']>(TASK_STATUS.NOT_STARTED);
  const [dueDate, setDueDate] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showTagSuggestions, setShowTagSuggestions] = useState(false);
  const [linkedNote, setLinkedNote] = useState('');
  
  const tagInputRef = useRef<HTMLInputElement>(null);
  const tagContainerRef = useRef<HTMLDivElement>(null);

  // 編集モードの場合、フォームに値をセット
  useEffect(() => {
    if (taskToEdit) {
      setTitle(taskToEdit.title);
      setStatus(taskToEdit.status);
      setDueDate(taskToEdit.dueDate || '');
      setSelectedTags(getTagsForTask(taskToEdit.id));
      setLinkedNote(taskToEdit.linkedNote || '');
    }
  }, [taskToEdit, getTagsForTask]);
  
  // タグサジェストの外側クリックで非表示にする
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (tagContainerRef.current && !tagContainerRef.current.contains(event.target as Node)) {
        setShowTagSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // フォーム送信処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (title.trim() === '') return;
    
    const taskData = {
      title,
      status,
      dueDate: dueDate || null,
      linkedNote: linkedNote || null,
    };
    
    // リンク先ノートが指定されている場合は自動生成
    if (linkedNote) {
      try {
        // ノート管理フックを使用してノートを作成
        await createNote(linkedNote);
      } catch (error) {
        console.error('リンク先ノートの作成中にエラーが発生しました:', error);
      }
    }
    
    if (taskToEdit) {
      // 既存タスクの更新
      updateTask(taskToEdit.id, taskData);
      
      // タグの更新
      const currentTags = getTagsForTask(taskToEdit.id);
      
      // 削除されたタグを処理
      currentTags.forEach(tag => {
        if (!selectedTags.some(selectedTag => selectedTag.id === tag.id)) {
          removeTagFromTask(taskToEdit.id, tag.id);
        }
      });
      
      // 追加されたタグを処理
      selectedTags.forEach(tag => {
        if (!currentTags.some(currentTag => currentTag.id === tag.id)) {
          addTagToTask(taskToEdit.id, tag.id);
        }
      });
    } else {
      // 新規タスクの追加
      const newTask = addTask(taskData);
      
      // タグを関連付け
      selectedTags.forEach(tag => {
        addTagToTask(newTask.id, tag.id);
      });
    }

    // フォームをリセット
    resetForm();
    
    // キャンセルコールバックがある場合は呼び出し
    if (onCancel) {
      onCancel();
    }
  };

  const resetForm = () => {
    setTitle('');
    setStatus(TASK_STATUS.NOT_STARTED);
    setDueDate('');
    setSelectedTags([]);
    setTagInput('');
    setLinkedNote('');
  };
  
  // タグを追加
  const handleAddTag = () => {
    if (tagInput.trim()) {
      // 新しいタグを作成
      const newTag = addTag(tagInput.trim());
      
      // 既存のタグをディープコピー
      const newTags = [...selectedTags];
      
      // 既に選択されていない場合のみ追加
      if (!newTags.some(tag => tag.id === newTag.id)) {
        newTags.push(newTag);
        setSelectedTags(newTags);
        console.log('新しいタグが追加されました:', newTag.name);
      }
      
      // 入力をクリア
      setTagInput('');
      setShowTagSuggestions(false);
    }
  };
  
  // タグの削除処理
  const handleRemoveTag = (tagId: string) => {
    setSelectedTags(selectedTags.filter(tag => tag.id !== tagId));
  };
  
  // タグ候補からタグを選択
  const handleSelectTagSuggestion = (tag: Tag, event?: React.MouseEvent) => {
    // イベントがあれば伝播を停止
    if (event) {
      event.preventDefault();
      event.stopPropagation();
    }
    
    console.log('タグ候補が選択されました:', tag.name, tag.id);
    
    // 既存のタグをディープコピー
    const currentTags = [...selectedTags];
    
    // 既に選択されていない場合のみ追加
    if (!currentTags.some(selectedTag => selectedTag.id === tag.id)) {
      // 新しい配列を作成して設定
      currentTags.push(tag);
      setSelectedTags(currentTags);
      console.log('タグが追加されました:', currentTags);
    }
    
    // 入力をクリアして候補を非表示に
    setTagInput('');
    setShowTagSuggestions(false);
    
    // 入力フィールドにフォーカスを戻す
    setTimeout(() => {
      tagInputRef.current?.focus();
    }, 10);
  };
  
  // タグ候補をフィルタリング
  const filteredTagSuggestions = allTags
    .filter(tag => 
      tag.name.toLowerCase().includes(tagInput.toLowerCase()) && 
      !selectedTags.some(selectedTag => selectedTag.id === tag.id)
    )
    .slice(0, 5);

  return (
    <form onSubmit={handleSubmit} className="bg-surface dark:bg-surface-dark p-4 rounded-lg shadow-md">
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-text-light dark:text-text mb-1">
          タスク名
        </label>
        <input
          type="text"
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
          className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="タスクを入力してください"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="status" className="block text-sm font-medium text-text-light dark:text-text mb-1">
          ステータス
        </label>
        <select
          id="status"
          value={status}
          onChange={(e) => setStatus(Number(e.target.value) as Task['status'])}
          className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <option value={TASK_STATUS.NOT_STARTED}>{TASK_STATUS_LABELS[TASK_STATUS.NOT_STARTED]}</option>
          <option value={TASK_STATUS.IN_PROGRESS}>{TASK_STATUS_LABELS[TASK_STATUS.IN_PROGRESS]}</option>
          <option value={TASK_STATUS.COMPLETED}>{TASK_STATUS_LABELS[TASK_STATUS.COMPLETED]}</option>
        </select>
      </div>

      <div className="mb-4">
        <label htmlFor="dueDate" className="block text-sm font-medium text-text-light dark:text-text mb-1">
          納期
        </label>
        <input
          type="date"
          id="dueDate"
          value={dueDate}
          onChange={(e) => setDueDate(e.target.value)}
          className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
        />
      </div>

      <div className="mb-4">
        <label htmlFor="tags" className="block text-sm font-medium text-text-light dark:text-text mb-1">
          タグ
        </label>
        <div className="relative">
          <div ref={tagContainerRef} className="flex flex-wrap gap-1 p-2 border border-border-light dark:border-border rounded-md mb-1">
            {selectedTags.map(tag => (
              <div key={tag.id} className="flex items-center bg-primary-light/20 text-primary-dark dark:text-primary-light px-2 py-1 rounded-full text-sm">
                {tag.name}
                <button
                  type="button"
                  onClick={() => handleRemoveTag(tag.id)}
                  className="ml-1 text-text-muted hover:text-text-light focus:outline-none"
                >
                  &times;
                </button>
              </div>
            ))}
            <input
              ref={tagInputRef}
              type="text"
              value={tagInput}
              onChange={(e) => {
                setTagInput(e.target.value);
                setShowTagSuggestions(true);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddTag();
                } else if (e.key === 'Escape') {
                  setShowTagSuggestions(false);
                }
              }}
              onClick={() => {
                // クリック時にタグ候補を表示
                setShowTagSuggestions(true);
              }}
              onFocus={() => {
                // フォーカス時にタグ候補を表示
                setShowTagSuggestions(true);
              }}
              className="flex-1 min-w-[100px] border-none focus:outline-none focus:ring-0 p-1"
              placeholder={selectedTags.length > 0 ? "" : "タグを入力"}
            />
          </div>
          
          {showTagSuggestions && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-surface-dark border border-border-light dark:border-border rounded-md shadow-lg">
              {filteredTagSuggestions.length > 0 ? (
                filteredTagSuggestions.map(tag => (
                  <button
                    type="button"
                    key={tag.id}
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      console.log('タグ候補クリック:', tag.name);
                      // 既存のタグをディープコピー
                      const newTags = [...selectedTags];
                      // 既に選択されていない場合のみ追加
                      if (!newTags.some(selectedTag => selectedTag.id === tag.id)) {
                        newTags.push(tag);
                        setSelectedTags(newTags);
                      }
                      setTagInput('');
                      setShowTagSuggestions(false);
                      // フォーカスを入力フィールドに戻す
                      setTimeout(() => tagInputRef.current?.focus(), 10);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-primary-light/10 cursor-pointer text-text-light dark:text-text"
                  >
                    {tag.name}
                  </button>
                ))
              ) : (
                tagInput.trim() ? (
                  <div className="px-3 py-2 text-text-muted">
                    &ldquo;{tagInput}&rdquo;を新しいタグとして追加するにはエンターを押してください
                  </div>
                ) : (
                  allTags.length > 0 ? (
                    allTags.slice(0, 5).map(tag => (
                      <button
                        type="button"
                        key={tag.id}
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          console.log('全タグから選択:', tag.name);
                          // 既存のタグをディープコピー
                          const newTags = [...selectedTags];
                          // 既に選択されていない場合のみ追加
                          if (!newTags.some(selectedTag => selectedTag.id === tag.id)) {
                            newTags.push(tag);
                            setSelectedTags(newTags);
                          }
                          setTagInput('');
                          setShowTagSuggestions(false);
                          // フォーカスを入力フィールドに戻す
                          setTimeout(() => tagInputRef.current?.focus(), 10);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-primary-light/10 cursor-pointer text-text-light dark:text-text"
                      >
                        {tag.name}
                      </button>
                    ))
                  ) : (
                    <div className="px-3 py-2 text-text-muted">
                      タグがありません。新しいタグを入力してください。
                    </div>
                  )
                )
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-text-muted mt-1">
          新しいタグを入力してEnterを押すか、候補から選択してください
        </p>
      </div>

      <div className="mb-4">
        <label htmlFor="linkedNote" className="block text-sm font-medium text-text-light dark:text-text mb-1">
          ノートリンク
        </label>
        <input
          type="text"
          id="linkedNote"
          value={linkedNote}
          onChange={(e) => setLinkedNote(e.target.value)}
          className="w-full px-3 py-2 border border-border-light dark:border-border rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
          placeholder="ノート名"
        />
      </div>

      <div className="flex justify-end space-x-2">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-400 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
            style={{ color: '#000000', backgroundColor: '#ffffff', cursor: 'pointer' }}
          >
            キャンセル
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 bg-primary text-white dark:text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary border border-gray-400"
          style={{ color: '#ffffff !important', backgroundColor: '#7C3AED !important', cursor: 'pointer' }}
        >
          {taskToEdit ? '更新' : '追加'}
        </button>
      </div>
    </form>
  );
};

export default TaskForm;
