/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#7C3AED', // Obsidian風の紫色
          light: '#A78BFA',
          dark: '#5B21B6',
        },
        secondary: {
          DEFAULT: '#10B981', // タスク完了などのアクセント色
          light: '#34D399',
          dark: '#059669',
        },
        background: {
          DEFAULT: '#1E1E1E', // ダークモードの背景色
          light: '#F9FAFB', // ライトモードの背景色
        },
        surface: {
          DEFAULT: '#2D2D2D', // ダークモードのカード背景
          light: '#FFFFFF', // ライトモードのカード背景
        },
        border: {
          DEFAULT: '#4B5563', // ダークモードの境界線
          light: '#E5E7EB', // ライトモードの境界線
        },
        text: {
          DEFAULT: '#F3F4F6', // ダークモードのテキスト
          light: '#1F2937', // ライトモードのテキスト
          muted: '#9CA3AF', // 薄いテキスト
        },
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
        mono: ['Fira Code', 'monospace'],
      },
      boxShadow: {
        card: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
      },
    },
  },
  plugins: [],
}
