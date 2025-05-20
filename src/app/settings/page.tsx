"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function SettingsPage() {
  const router = useRouter();

  useEffect(() => {
    // メインページにリダイレクト
    router.push('/');
  }, [router]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] space-y-4">
      <h1 className="text-3xl font-bold text-text-light dark:text-text">リダイレクト中...</h1>
      <p className="text-gray-600 dark:text-gray-400">
        設定ページはメインページに統合されました。自動的にメインページにリダイレクトします。
      </p>
      <Link href="/" className="text-blue-500 hover:underline">
        メインページに移動する
      </Link>
    </div>
  );
}
