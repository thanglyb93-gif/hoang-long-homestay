'use client';
import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings-store';
import { useImageStore } from '@/lib/image-store';

export default function SettingsLoader() {
  const loadFromDB = useSettingsStore((s) => s.loadFromDB);
  useEffect(() => {
    loadFromDB();
  }, []);
  return null;
}