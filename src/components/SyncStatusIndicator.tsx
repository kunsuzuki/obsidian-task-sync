"use client";

import React from 'react';
import { useTaskManager } from '../hooks/useTaskManager';

const SyncStatusIndicator: React.FC = () => {
  const { 
    isSyncing, 
    isLoading, 
    isPermissionChecking, 
    lastSynced, 
    syncError 
  } = useTaskManager();

  // 最終同期時間のフォーマット
  const formatLastSynced = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleString('ja-JP', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    } catch (error) {
      console.error('日付のフォーマット中にエラーが発生しました:', error);
      return dateString;
    }
  };

  // 読み込み中
  if (isLoading) {
    return (
      <div className="flex items-center text-blue-600">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>設定を読み込み中...</span>
      </div>
    );
  }

  // 権限確認中
  if (isPermissionChecking) {
    return (
      <div className="flex items-center text-blue-600">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>保管庫へのアクセス権限を確認中...</span>
      </div>
    );
  }

  // 同期中
  if (isSyncing) {
    return (
      <div className="flex items-center text-blue-600">
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span>同期中...</span>
      </div>
    );
  }

  // エラーがある場合
  if (syncError) {
    return (
      <div className="flex items-center text-red-600">
        <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
        <span>同期エラー: {syncError}</span>
      </div>
    );
  }

  // 最終同期時間
  if (lastSynced) {
    return (
      <div className="flex items-center text-green-600">
        <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
        <span>最終同期: {formatLastSynced(lastSynced)}</span>
      </div>
    );
  }

  // デフォルト
  return (
    <div className="flex items-center text-gray-500">
      <svg className="h-4 w-4 mr-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m-8 6H4m0 0l4 4m-4-4l4-4" />
      </svg>
      <span>未同期</span>
    </div>
  );
};

export default SyncStatusIndicator;
