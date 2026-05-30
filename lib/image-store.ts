'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────

export type RoomId =
  | 'green-mountain' | 'ban-flower' | 'family-room' | 'deluxe'
  | 'epsilon' | 'zeta' | 'eta' | 'theta' | 'iota' | 'kappa'
  | 'lambda'  | 'omicron' | 'sigma' | 'omega';

// Images are stored as ordered arrays — index 0 is always the hero image.
interface ImageState {
  images: Record<string, string[]>; // roomId → ordered URLs

  /** Replace the full list for a room (used after fetching from API). */
  setImages: (roomId: string, urls: string[]) => void;

  /** Append a newly-uploaded URL to a room's list. */
  addImage: (roomId: string, url: string) => void;

  /** Remove a URL from a room's list. */
  removeImage: (roomId: string, url: string) => void;

  /** Move a URL to the front of the list (makes it the hero). */
  setHero: (roomId: string, url: string) => void;

  /** Reorder by dragging (pass the new full array). */
  reorder: (roomId: string, urls: string[]) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useImageStore = create<ImageState>()(
  persist(
    (set) => ({
      images: {},

      setImages: (roomId, urls) =>
        set((s) => ({ images: { ...s.images, [roomId]: urls } })),

      addImage: (roomId, url) =>
        set((s) => ({
          images: {
            ...s.images,
            [roomId]: [...(s.images[roomId] ?? []), url],
          },
        })),

      removeImage: (roomId, url) =>
        set((s) => ({
          images: {
            ...s.images,
            [roomId]: (s.images[roomId] ?? []).filter((u) => u !== url),
          },
        })),

      setHero: (roomId, url) =>
        set((s) => {
          const list = s.images[roomId] ?? [];
          const rest = list.filter((u) => u !== url);
          return { images: { ...s.images, [roomId]: [url, ...rest] } };
        }),

      reorder: (roomId, urls) =>
        set((s) => ({ images: { ...s.images, [roomId]: urls } })),
    }),
    { name: 'hl-images-v1' }
  )
);

// ── Helpers ───────────────────────────────────────────────────────────────────

export const ROOM_CONFIG_IMAGES: { id: RoomId; name: string; number: string; label: string }[] = [
  { id: 'green-mountain', name: 'Delta',   number: '101', label: 'Delta · Room 101' },
  { id: 'ban-flower',     name: 'Gamma',   number: '201', label: 'Gamma · Room 201' },
  { id: 'family-room',    name: 'Alpha',   number: '202', label: 'Alpha · Room 202' },
  { id: 'deluxe',         name: 'Beta',    number: '301', label: 'Beta  · Room 301' },
  // Placeholder rooms
  { id: 'epsilon',        name: 'Epsilon', number: '102', label: 'Epsilon · Room 102' },
  { id: 'zeta',           name: 'Zeta',    number: '203', label: 'Zeta    · Room 203' },
  { id: 'eta',            name: 'Eta',     number: '204', label: 'Eta     · Room 204' },
  { id: 'theta',          name: 'Theta',   number: '302', label: 'Theta   · Room 302' },
  { id: 'iota',           name: 'Iota',    number: '303', label: 'Iota    · Room 303' },
  { id: 'kappa',          name: 'Kappa',   number: '304', label: 'Kappa   · Room 304' },
  { id: 'lambda',         name: 'Lambda',  number: '103', label: 'Lambda  · Room 103' },
  { id: 'omicron',        name: 'Omicron', number: '205', label: 'Omicron · Room 205' },
  { id: 'sigma',          name: 'Sigma',   number: '206', label: 'Sigma   · Room 206' },
  { id: 'omega',          name: 'Omega',   number: '305', label: 'Omega   · Room 305' },
];
