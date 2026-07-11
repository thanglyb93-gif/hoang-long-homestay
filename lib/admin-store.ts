'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';
import * as bookingsDB from './bookings-db';

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export interface AdminBooking {
  ref: string;
  roomId: string;
  roomName: string;
  roomNumber: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  guests: number;
  fullName: string;
  phone: string;
  email: string;
  nationality: string;
  requests: string;
  paymentMethod: string;
  total: number;
  submittedAt: string;
  status: BookingStatus;
}

export interface ManualBlock {
  id: string;
  start: string;
  end: string;
  note: string;
}

export interface RoomOverride {
  roomId: string;
  pricePerNight: number | null;
  amenities: string[] | null;
  manualBlocks: ManualBlock[];
}

export interface SeasonalRule {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  adjustmentPct: number;
  roomIds: string[];
}

interface AdminState {
  pin: string;
  isAuthenticated: boolean;
  bookings: AdminBooking[];
  overrides: RoomOverride[];
  seasonalRules: SeasonalRule[];
  loadFromDB: () => Promise<void>;
  login: (pin: string) => boolean;
  logout: () => void;
  changePin: (newPin: string) => void;
  addBooking: (data: Omit<AdminBooking, 'ref' | 'submittedAt' | 'status'>) => Promise<string>;
  updateBookingStatus: (ref: string, status: BookingStatus) => Promise<void>;
  getRoomOverride: (roomId: string) => RoomOverride;
  setRoomPrice: (roomId: string, price: number | null) => void;
  setRoomAmenities: (roomId: string, amenities: string[] | null) => void;
  addManualBlock: (roomId: string, block: Omit<ManualBlock, 'id'>) => void;
  removeManualBlock: (roomId: string, blockId: string) => void;
  addSeasonalRule: (rule: Omit<SeasonalRule, 'id'>) => void;
  updateSeasonalRule: (id: string, updates: Partial<Omit<SeasonalRule, 'id'>>) => void;
  removeSeasonalRule: (id: string) => void;
}

const DEFAULT_PIN = 'HL2024';

function emptyOverride(roomId: string): RoomOverride {
  return { roomId, pricePerNight: null, amenities: null, manualBlocks: [] };
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function saveToDB(overrides: RoomOverride[], seasonalRules: SeasonalRule[]) {
  await supabase.from('admin_data').upsert({
    id: 'main',
    overrides,
    seasonal_rules: seasonalRules,
    updated_at: new Date().toISOString(),
  });
}

// Realtime subscription is process-wide — guard against setting it up more than once
// (multiple admin shells / hot reloads all call loadFromDB()).
let bookingsChannelActive = false;

export const useAdminStore = create<AdminState>()(
  persist(
    (set, get) => ({
      pin: DEFAULT_PIN,
      isAuthenticated: false,
      bookings: [],
      overrides: [],
      seasonalRules: [],

      loadFromDB: async () => {
        const { data, error } = await supabase
          .from('admin_data')
          .select('*')
          .eq('id', 'main')
          .single();
        if (!error && data) {
          set({
            overrides:     data.overrides      ?? [],
            seasonalRules: data.seasonal_rules ?? [],
          });
        }

        try {
          const bookings = await bookingsDB.getAllBookings();
          set({ bookings });
        } catch {
          // network hiccup — keep whatever was already in state
        }

        if (!bookingsChannelActive) {
          bookingsChannelActive = true;
          bookingsDB.subscribeToBookings((booking) => {
            set((s) => {
              const exists = s.bookings.some((b) => b.ref === booking.ref);
              return {
                bookings: exists
                  ? s.bookings.map((b) => b.ref === booking.ref ? booking : b)
                  : [booking, ...s.bookings],
              };
            });
          });
        }
      },

      login: (pin) => {
        if (pin === get().pin) { set({ isAuthenticated: true }); return true; }
        return false;
      },

      logout: () => set({ isAuthenticated: false }),

      changePin: (newPin) => set({ pin: newPin }),

      addBooking: async (data) => {
        const booking = await bookingsDB.createBooking(data);
        set((s) => ({ bookings: [booking, ...s.bookings] }));
        return booking.ref;
      },

      updateBookingStatus: async (ref, status) => {
        set((s) => ({ bookings: s.bookings.map((b) => b.ref === ref ? { ...b, status } : b) }));
        await bookingsDB.updateBookingStatus(ref, status);
      },

      getRoomOverride: (roomId) =>
        get().overrides.find((o) => o.roomId === roomId) ?? emptyOverride(roomId),

      setRoomPrice: (roomId, price) => {
        set((s) => {
          const existing = s.overrides.find((o) => o.roomId === roomId);
          return {
            overrides: existing
              ? s.overrides.map((o) => o.roomId === roomId ? { ...o, pricePerNight: price } : o)
              : [...s.overrides, { ...emptyOverride(roomId), pricePerNight: price }],
          };
        });
        const s = get();
        saveToDB(s.overrides, s.seasonalRules);
      },

      setRoomAmenities: (roomId, amenities) => {
        set((s) => {
          const existing = s.overrides.find((o) => o.roomId === roomId);
          return {
            overrides: existing
              ? s.overrides.map((o) => o.roomId === roomId ? { ...o, amenities } : o)
              : [...s.overrides, { ...emptyOverride(roomId), amenities }],
          };
        });
        const s = get();
        saveToDB(s.overrides, s.seasonalRules);
      },

      addManualBlock: (roomId, block) => {
        const newBlock: ManualBlock = { ...block, id: uid() };
        set((s) => {
          const existing = s.overrides.find((o) => o.roomId === roomId);
          return {
            overrides: existing
              ? s.overrides.map((o) => o.roomId === roomId ? { ...o, manualBlocks: [...o.manualBlocks, newBlock] } : o)
              : [...s.overrides, { ...emptyOverride(roomId), manualBlocks: [newBlock] }],
          };
        });
        const s = get();
        saveToDB(s.overrides, s.seasonalRules);
      },

      removeManualBlock: (roomId, blockId) => {
        set((s) => ({
          overrides: s.overrides.map((o) =>
            o.roomId === roomId ? { ...o, manualBlocks: o.manualBlocks.filter((b) => b.id !== blockId) } : o
          ),
        }));
        const s = get();
        saveToDB(s.overrides, s.seasonalRules);
      },

      addSeasonalRule: (rule) => {
        set((s) => ({ seasonalRules: [...s.seasonalRules, { ...rule, id: uid() }] }));
        const s = get();
        saveToDB(s.overrides, s.seasonalRules);
      },

      updateSeasonalRule: (id, updates) => {
        set((s) => ({ seasonalRules: s.seasonalRules.map((r) => r.id === id ? { ...r, ...updates } : r) }));
        const s = get();
        saveToDB(s.overrides, s.seasonalRules);
      },

      removeSeasonalRule: (id) => {
        set((s) => ({ seasonalRules: s.seasonalRules.filter((r) => r.id !== id) }));
        const s = get();
        saveToDB(s.overrides, s.seasonalRules);
      },
    }),
    {
      name: 'hoang-long-admin-v2',
      partialize: (s) => ({
        pin: s.pin,
        overrides: s.overrides,
        seasonalRules: s.seasonalRules,
      }),
    }
  )
);