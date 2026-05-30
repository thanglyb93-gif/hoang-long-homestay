'use client';
import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings-store';
import { useImageStore } from '@/lib/image-store';

export default function SettingsLoader() {
  const loadSettings = useSettingsStore((s) => s.loadFromDB);
  const loadImages   = useImageStore((s) => s.loadFromDB);

  useEffect(() => {
    loadSettings();
    loadImages();
  }, []);

  return null;
}