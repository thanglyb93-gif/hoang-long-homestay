'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

export type RoomId =
  | 'green-mountain' | 'ban-flower' | 'family-room' | 'deluxe'
  | 'epsilon' | 'zeta' | 'eta' | 'theta' | 'iota' | 'kappa'
  | 'lambda'  | 'omicron' | 'sigma' | 'omega';

interface ImageState {
  images: Record<string, string[]>;
  loadFromDB:   () => Promise<void>;
  setImages:    (roomId: string, urls: string[]) => void;
  addImage:     (roomId: string, url: string) => Promise<void>;
  removeImage:  (roomId: string, url: string) => Promise<void>;
  setHero:      (roomId: string, url: string) => Promise<void>;
  reorder:      (roomId: string, urls: string[]) => Promise<void>;
}

async function saveRoomImagesToDB(roomId: string, urls: string[]) {
  await supabase.from('room_images').delete().eq('room_id', roomId);
  if (urls.length === 0) return;
  await supabase.from('room_images').insert(
    urls.map((url, position) => ({ room_id: roomId, url, position }))
  );
}

export const useImageStore = create<ImageState>()(
  persist(
    (set, get) => ({
      images: {},

      loadFromDB: async () => {
        const { data, error } = await supabase
          .from('room_images')
          .select('*')
          .order('position', { ascending: true });
        if (error || !data) return;
        const grouped: Record<string, string[]> = {};
        for (const row of data) {
          if (!grouped[row.room_id]) grouped[row.room_id] = [];
          grouped[row.room_id].push(row.url);
        }
        set({ images: grouped });
      },

      setImages: (roomId, urls) =>
        set((s) => ({ images: { ...s.images, [roomId]: urls } })),

      addImage: async (roomId, url) => {
        const current = get().images[roomId] ?? [];
        const updated = [...current, url];
        set((s) => ({ images: { ...s.images, [roomId]: updated } }));
        await saveRoomImagesToDB(roomId, updated);
      },

      removeImage: async (roomId, url) => {
        const updated = (get().images[roomId] ?? []).filter((u) => u !== url);
        set((s) => ({ images: { ...s.images, [roomId]: updated } }));
        await saveRoomImagesToDB(roomId, updated);
      },

      setHero: async (roomId, url) => {
        const list = get().images[roomId] ?? [];
        const updated = [url, ...list.filter((u) => u !== url)];
        set((s) => ({ images: { ...s.images, [roomId]: updated } }));
        await saveRoomImagesToDB(roomId, updated);
      },

      reorder: async (roomId, urls) => {
        set((s) => ({ images: { ...s.images, [roomId]: urls } }));
        await saveRoomImagesToDB(roomId, urls);
      },
    }),
    { name: 'hl-images-v2' }
  )
);

export const ROOM_CONFIG_IMAGES: { id: RoomId; name: string; number: string; label: string }[] = [
  { id: 'green-mountain', name: 'Delta',   number: '101', label: 'Delta · Room 101' },
  { id: 'ban-flower',     name: 'Gamma',   number: '201', label: 'Gamma · Room 201' },
  { id: 'family-room',    name: 'Alpha',   number: '202', label: 'Alpha · Room 202' },
  { id: 'deluxe',         name: 'Beta',    number: '301', label: 'Beta  · Room 301' },
  { id: 'epsilon',        name: 'Epsilon', number: '102', label: 'Epsilon · Room 102' },
  { id: 'zeta',           name: 'Zeta',    number: '203', label: 'Zeta   · Room 203' },
  { id: 'eta',            name: 'Eta',     number: '204', label: 'Eta    · Room 204' },
  { id: 'theta',          name: 'Theta',   number: '302', label: 'Theta  · Room 302' },
  { id: 'iota',           name: 'Iota',    number: '303', label: 'Iota   · Room 303' },
  { id: 'kappa',          name: 'Kappa',   number: '304', label: 'Kappa  · Room 304' },
  { id: 'lambda',         name: 'Lambda',  number: '103', label: 'Lambda · Room 103' },
  { id: 'omicron',        name: 'Omicron', number: '205', label: 'Omicron · Room 205' },
  { id: 'sigma',          name: 'Sigma',   number: '206', label: 'Sigma  · Room 206' },
  { id: 'omega',          name: 'Omega',   number: '305', label: 'Omega  · Room 305' },
];