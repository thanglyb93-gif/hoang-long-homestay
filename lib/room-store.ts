'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rooms, type Room, type RoomType, type Amenity } from './rooms';
import { supabase } from './supabase';

export interface RoomOverride {
  nameVi?:       string;
  nameEn?:       string;
  roomNumber?:   string;
  type?:         RoomType;
  maxGuests?:    number;
  sizeSqm?:      number;
  bed?:          string;
  description?:  string;
  amenities?:    Amenity[];
  customPrice?:  number;
  isActive?:     boolean;
}

interface RoomStoreState {
  overrides: Record<string, RoomOverride>;
  loadFromDB:    () => Promise<void>;
  updateRoom:    (roomId: string, patch: Partial<RoomOverride>) => void;
  resetRoom:     (roomId: string) => void;
  activateRoom:  (roomId: string) => void;
  deactivateRoom:(roomId: string) => void;
}

async function saveToDB(overrides: Record<string, RoomOverride>) {
  await supabase.from('room_store').upsert({
    id: 'main',
    overrides,
    updated_at: new Date().toISOString(),
  });
}

export const useRoomStore = create<RoomStoreState>()(
  persist(
    (set, get) => ({
      overrides: {},

      loadFromDB: async () => {
        const { data, error } = await supabase
          .from('room_store')
          .select('*')
          .eq('id', 'main')
          .single();
        if (error || !data) return;
        set({ overrides: data.overrides ?? {} });
      },

      updateRoom: (roomId, patch) => {
        set((s) => ({
          overrides: { ...s.overrides, [roomId]: { ...(s.overrides[roomId] ?? {}), ...patch } },
        }));
        saveToDB(get().overrides);
      },

      resetRoom: (roomId) => {
        set((s) => {
          const next = { ...s.overrides };
          delete next[roomId];
          return { overrides: next };
        });
        saveToDB(get().overrides);
      },

      activateRoom: (roomId) => {
        set((s) => ({
          overrides: { ...s.overrides, [roomId]: { ...(s.overrides[roomId] ?? {}), isActive: true } },
        }));
        saveToDB(get().overrides);
      },

      deactivateRoom: (roomId) => {
        set((s) => ({
          overrides: { ...s.overrides, [roomId]: { ...(s.overrides[roomId] ?? {}), isActive: false } },
        }));
        saveToDB(get().overrides);
      },
    }),
    { name: 'hl-rooms-v2' }
  )
);

export function mergeRoom(base: Room, override: RoomOverride | undefined): Room {
  if (!override) return base;
  return {
    ...base,
    nameVi:        override.nameVi        ?? base.nameVi,
    nameEn:        override.nameEn        ?? base.nameEn,
    roomNumber:    override.roomNumber    ?? base.roomNumber,
    type:          override.type          ?? base.type,
    maxGuests:     override.maxGuests     ?? base.maxGuests,
    sizeSqm:       override.sizeSqm       ?? base.sizeSqm,
    bed:           override.bed           ?? base.bed,
    description:   override.description   ?? base.description,
    amenities:     override.amenities     ?? base.amenities,
    pricePerNight: (override.customPrice && override.customPrice > 0)
                     ? override.customPrice
                     : base.pricePerNight,
  };
}

export function useAllRooms(): Room[] {
  const { overrides } = useRoomStore();
  return rooms.map((r) => mergeRoom(r, overrides[r.id]));
}

export function usePublicRooms(): Room[] {
  const { overrides } = useRoomStore();
  return rooms
    .filter((r) => {
      const o = overrides[r.id];
      if (r.isPlaceholder) return o?.isActive === true;
      return o?.isActive !== false;
    })
    .map((r) => mergeRoom(r, overrides[r.id]));
}