'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

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
  addBooking: (data: Omit<AdminBooking, 'ref' | 'submittedAt' | 'status'>) => string;
  updateBookingStatus: (ref: string, status: BookingStatus) => void;
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

function genRef(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

async function saveToDB(bookings: AdminBooking[], overrides: RoomOverride[], seasonalRules: SeasonalRule[]) {
  await supabase.from('admin_data').upsert({
    id: 'main',
    bookings,
    overrides,
    seasonal_rules: seasonalRules,
    updated_at: new Date().toISOString(),
  });
}

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
        if (error || !data) return;
        set({
          bookings:      data.bookings       ?? [],
          overrides:     data.overrides      ?? [],
          seasonalRules: data.seasonal_rules ?? [],
        });
      },

      login: (pin) => {
        if (pin === get().pin) { set({ isAuthenticated: true }); return true; }
        return false;
      },

      logout: () => set({ isAuthenticated: false }),

      changePin: (newPin) => set({ pin: newPin }),

      addBooking: (data) => {
        const ref = genRef();
        const booking: AdminBooking = { ...data, ref, submittedAt: new Date().toISOString(), status: 'pending' };
        set((s) => ({ bookings: [booking, ...s.bookings] }));
        const { bookings, overrides, seasonalRules } = get();
        saveToDB([booking, ...bookings.slice(1)], overrides, seasonalRules);
        return ref;
      },

      updateBookingStatus: (ref, status) => {
        set((s) => ({ bookings: s.bookings.map((b) => b.ref === ref ? { ...b, status } : b) }));
        const { bookings, overrides, seasonalRules } = get();
        saveToDB(bookings, overrides, seasonalRules);
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
        const { bookings, overrides, seasonalRules } = get();
        saveToDB(bookings, overrides, seasonalRules);
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
        const { bookings, overrides, seasonalRules } = get();
        saveToDB(bookings, overrides, seasonalRules);
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
        const { bookings, overrides, seasonalRules } = get();
        saveToDB(bookings, overrides, seasonalRules);
      },

      removeManualBlock: (roomId, blockId) => {
        set((s) => ({
          overrides: s.overrides.map((o) =>
            o.roomId === roomId ? { ...o, manualBlocks: o.manualBlocks.filter((b) => b.id !== blockId) } : o
          ),
        }));
        const { bookings, overrides, seasonalRules } = get();
        saveToDB(bookings, overrides, seasonalRules);
      },

      addSeasonalRule: (rule) => {
        set((s) => ({ seasonalRules: [...s.seasonalRules, { ...rule, id: uid() }] }));
        const { bookings, overrides, seasonalRules } = get();
        saveToDB(bookings, overrides, seasonalRules);
      },

      updateSeasonalRule: (id, updates) => {
        set((s) => ({ seas