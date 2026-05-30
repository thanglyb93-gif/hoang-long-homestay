'use client';
import { useEffect } from 'react';
import { useSettingsStore } from '@/lib/settings-store';
import { useImageStore } from '@/lib/image-store';
import { usePricingStore } from '@/lib/pricing-store';
import { useAdminStore } from '@/lib/admin-store';
import { useRoomStore } from '@/lib/room-store';

export default function SettingsLoader() {
  const loadSettings = useSettingsStore((s) => s.loadFromDB);
  const loadImages   = useImageStore((s) => s.loadFromDB);
  const loadPricing  = usePricingStore((s) => s.loadFromDB);
  const loadAdmin    = useAdminStore ((s) => s.loadFromDB);
  const loadRooms    = useRoomStore  ((s) => s.loadFromDB);

  useEffect(() => {
    loadSettings();
    loadImages();
    loadPricing();
    loadAdmin();
    loadRooms();
  }, []);

  return null;
}