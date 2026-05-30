'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Types ─────────────────────────────────────────────────────────────────────

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface AdminBooking {
  ref: string;           // 6-digit numeric reference
  roomId: string;
  roomName: string;
  roomNumber: string;
  checkIn: string;       // YYYY-MM-DD
  checkOut: string;      // YYYY-MM-DD
  nights: number;
  guests: number;
  fullName: string;
  phone: string;
  email: string;
  nationality: string;
  requests: string;
  paymentMethod: string;
  total: number;
  submittedAt: string;   // ISO timestamp
  status: BookingStatus;
}

export interface ManualBlock {
  id: string;
  start: string;         // YYYY-MM-DD
  end: string;           // YYYY-MM-DD
  note: string;
}

export interface RoomOverride {
  roomId: string;
  pricePerNight: number | null;        // null = use default from rooms.ts
  amenities: string[] | null;          // null = use default from rooms.ts
  manualBlocks: ManualBlock[];
}

export interface SeasonalRule {
  id: string;
  name: string;
  startDate: string;     // YYYY-MM-DD
  endDate: string;       // YYYY-MM-DD
  adjustmentPct: number; // +20 = 20% surcharge, -15 = 15% discount
  roomIds: string[];     // empty = apply to ALL rooms
}

// ── Store ─────────────────────────────────────────────────────────────────────

interface AdminState {
  pin: string;
  isAuthenticated: boolean;

  bookings: AdminBooking[];
  overrides: RoomOverride[];
  seasonalRules: SeasonalRule[];

  // Auth
  login: (pin: string) => boolean;
  logout: () => void;
  changePin: (newPin: string) => void;

  // Bookings
  addBooking: (data: Omit<AdminBooking, 'ref' | 'submittedAt' | 'status'>) => string;
  updateBookingStatus: (ref: string, status: BookingStatus) => void;

  // Room overrides
  getRoomOverride: (roomId: string) => RoomOverride;
  setRoomPrice: (roomId: string, price: number | null) => void;
  setRoomAmenities: (roomId: string, amenities: string[] | null) => void;
  addManualBlock: (roomId: string, block: Omit<ManualBlock, 'id'>) => void;
  removeManualBlock: (roomId: string, blockId: string) => void;

  // Seasonal pricing
  addSeasonalRule: (rule: Omit<SeasonalRule, 'id'>) => void;
  updateSeasonalRule: (id: string, updates: Partial<Omit<SeasonalRule, 'id'>>) => void;
  removeSeasonalRule: (id: string) => void;
}

const DEFAULT_PIN = 'HL2024';

function emptyOverride(roomId: string): RoomOverride {
  return { roomId, pricePerNight: null, amenities: null, manualBlocks: [] };
}

function genRef(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      pin: DEFAULT_PIN,
      isAuthenticated: false,

      bookings: [],
      overrides: [],
      seasonalRules: [],

      // ── Auth ──────────────────────────────────────────────────────────────

      login: (pin) => {
        if (pin === get().pin) {
          set({ isAuthenticated: true });
          return true;
        }
        return false;
      },

      logout: () => set({ isAuthenticated: false }),

      changePin: (newPin) => set({ pin: newPin }),

      // ── Bookings ──────────────────────────────────────────────────────────

      addBooking: (data) => {
        const ref = genRef();
        const booking: AdminBooking = {
          ...data,
          ref,
          submittedAt: new Date().toISOString(),
          status: 'pending',
        };
        set((s) => ({ bookings: [booking, ...s.bookings] }));
        return ref;
      },

      updateBookingStatus: (ref, status) =>
        set((s) => ({
          bookings: s.bookings.map((b) => (b.ref === ref ? { ...b, status } : b)),
        })),

      // ── Room overrides ────────────────────────────────────────────────────

      getRoomOverride: (roomId) =>
        get().overrides.find((o) => o.roomId === roomId) ?? emptyOverride(roomId),

      setRoomPrice: (roomId, price) =>
        set((s) => {
          const existing = s.overrides.find((o) => o.roomId === roomId);
          if (existing) {
            return {
              overrides: s.overrides.map((o) =>
                o.roomId === roomId ? { ...o, pricePerNight: price } : o
              ),
            };
          }
          return {
            overrides: [...s.overrides, { ...emptyOverride(roomId), pricePerNight: price }],
          };
        }),

      setRoomAmenities: (roomId, amenities) =>
        set((s) => {
          const existing = s.overrides.find((o) => o.roomId === roomId);
          if (existing) {
            return {
              overrides: s.overrides.map((o) =>
                o.roomId === roomId ? { ...o, amenities } : o
              ),
            };
          }
          return {
            overrides: [...s.overrides, { ...emptyOverride(roomId), amenities }],
          };
        }),

      addManualBlock: (roomId, block) => {
        const newBlock: ManualBlock = { ...block, id: uid() };
        set((s) => {
          const existing = s.overrides.find((o) => o.roomId === roomId);
          if (existing) {
            return {
              overrides: s.overrides.map((o) =>
                o.roomId === roomId
                  ? { ...o, manualBlocks: [...o.manualBlocks, newBlock] }
                  : o
              ),
            };
          }
          return {
            overrides: [
              ...s.overrides,
              { ...emptyOverride(roomId), manualBlocks: [newBlock] },
            ],
          };
        });
      },

      removeManualBlock: (roomId, blockId) =>
        set((s) => ({
          overrides: s.overrides.map((o) =>
            o.roomId === roomId
              ? { ...o, manualBlocks: o.manualBlocks.filter((b) => b.id !== blockId) }
              : o
          ),
        })),

      // ── Seasonal pricing ──────────────────────────────────────────────────

      addSeasonalRule: (rule) =>
        set((s) => ({
          seasonalRules: [...s.seasonalRules, { ...rule, id: uid() }],
        })),

      updateSeasonalRule: (id, updates) =>
        set((s) => ({
          seasonalRules: s.seasonalRules.map((r) =>
            r.id === id ? { ...r, ...updates } : r
          ),
        })),

      removeSeasonalRule: (id) =>
        set((s) => ({
          seasonalRules: s.seasonalRules.filter((r) => r.id !== id),
        })),
    }),
    {
      name: 'hoang-long-admin',
      // Don't persist isAuthenticated — always require login on new session
      partialize: (s) => ({
        pin: s.pin,
        bookings: s.bookings,
        overrides: s.overrides,
        seasonalRules: s.seasonalRules,
      }),
    }
  )
);
