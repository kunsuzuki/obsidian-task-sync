"use client";

import SettingsForm from '../../components/SettingsForm';

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold text-text-light dark:text-text">設定</h1>
      <SettingsForm />
    </div>
  );
}
