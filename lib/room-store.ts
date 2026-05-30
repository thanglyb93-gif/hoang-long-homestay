'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { rooms, type Room, type RoomType, type Amenity } from './rooms';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RoomOverride {
  nameVi?:          string;
  nameEn?:          string;
  roomNumber?:      string;
  type?:            RoomType;
  maxGuests?:       number;
  sizeSqm?:         number;
  bed?:             string;
  description?:     string;
  amenities?:       Amenity[];
  /** Custom price for this room (overrides pricing formula when set > 0) */
  customPrice?:     number;
  /** Whether this room is visible on the public website */
  isActive?:        boolean;
}

interface RoomStoreState {
  overrides: Record<string, RoomOverride>;
  updateRoom:  (roomId: string, patch: Partial<RoomOverride>) => void;
  resetRoom:   (roomId: string) => void;
  activateRoom:(roomId: string) => void;
  deactivateRoom:(roomId: string) => void;
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useRoomStore = create<RoomStoreState>()(
  persist(
    (set, get) => ({
      overrides: {},

      updateRoom: (roomId, patch) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [roomId]: { ...(s.overrides[roomId] ?? {}), ...patch },
          },
        })),

      resetRoom: (roomId) =>
        set((s) => {
          const next = { ...s.overrides };
          delete next[roomId];
          return { overrides: next };
        }),

      activateRoom: (roomId) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [roomId]: { ...(s.overrides[roomId] ?? {}), isActive: true },
          },
        })),

      deactivateRoom: (roomId) =>
        set((s) => ({
          overrides: {
            ...s.overrides,
            [roomId]: { ...(s.overrides[roomId] ?? {}), isActive: false },
          },
        })),
    }),
    { name: 'hl-rooms-v1' }
  )
);

// ── Helper: merge static room with admin override ────────────────────────────

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

/**
 * Hook that returns all 14 rooms with admin overrides applied.
 * Placeholder rooms are included; call .filter(r => !r.isPlaceholder || override?.isActive)
 * yourself to decide what to show publicly.
 */
export function useAllRooms(): Room[] {
  const { overrides } = useRoomStore();
  return rooms.map((r) => mergeRoom(r, overrides[r.id]));
}

/**
 * Hook that returns only rooms visible on the public site:
 * - Original 4 rooms (non-placeholder) are always included unless explicitly deactivated
 * - Placeholder rooms are included only when admin has activated them
 */
export function usePublicRooms(): Room[] {
  const { overrides } = useRoomStore();
  return rooms
    .filter((r) => {
      const o = overrides[r.id];
      if (r.isPlaceholder) return o?.isActive === true;
      return o?.isActive !== false; // default active for original rooms
    })
    .map((r) => mergeRoom(r, overrides[r.id]));
}
