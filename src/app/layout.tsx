import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AppSettingsProvider } from "../hooks/useAppSettings";
import { TaskManagerProvider } from "../hooks/useTaskManager";
import { TagManagerProvider } from "../hooks/useTagManager";
import { NoteManagerProvider } from "../hooks/useNoteManager";
import Navigation from "../components/Navigation";
import { Toaster } from "react-hot-toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Obsidian Task Sync",
  description: "Obsidianと同期するタスク管理Webアプリ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className={`${inter.className} bg-background-light dark:bg-background text-text-light dark:text-text min-h-screen`}>
        <AppSettingsProvider>
          <TagManagerProvider>
            {/* 新しいTaskManagerProviderを使用 */}
            <TaskManagerProvider>
              {/* NoteManagerProviderを追加 */}
              <NoteManagerProvider>
                <Navigation />
                <main className="container mx-auto px-4 py-6">
                  {children}
                </main>
                <Toaster
                  position="bottom-right"
                  toastOptions={{
                    duration: 3000,
                    style: {
                      background: '#333',
                      color: '#fff',
                    },
                    success: {
                      style: {
                        background: '#10B981',
                      },
                    },
                    error: {
                      style: {
                        background: '#EF4444',
                      },
                    },
                  }}
                />
              </NoteManagerProvider>
            </TaskManagerProvider>
          </TagManagerProvider>
        </AppSettingsProvider>
      </body>
    </html>
  );
}
