"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useTaskManager } from '../hooks/useTaskManager';

const Navigation = () => {
  const pathname = usePathname();
  const { syncWithVault } = useTaskManager();

  return (
    <nav className="bg-surface-light dark:bg-surface shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-8 w-8 text-primary"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              <span className="ml-2 text-xl font-bold text-text-light dark:text-text">
                Obsidian Task Sync
              </span>
            </Link>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => syncWithVault()}
              className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 focus:outline-none border border-gray-400"
              aria-label="同期"
              title="今すぐ同期"
              style={{ color: '#000000', backgroundColor: '#ffffff' }}
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6 text-text-light dark:text-text"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </button>

            <Link
              href="/"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/'
                  ? 'bg-primary-light/20 text-primary-dark dark:text-primary-light'
                  : 'text-text-light dark:text-text hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              タスク
            </Link>

            <Link
              href="/settings"
              className={`px-3 py-2 rounded-md text-sm font-medium ${
                pathname === '/settings'
                  ? 'bg-primary-light/20 text-primary-dark dark:text-primary-light'
                  : 'text-text-light dark:text-text hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              設定
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
