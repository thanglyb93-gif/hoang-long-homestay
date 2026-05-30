'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Room } from './rooms';

interface BookingState {
  selectedRoom: Room | null;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;

  setSelectedRoom: (room: Room | null) => void;
  setCheckIn: (date: Date | null) => void;
  setCheckOut: (date: Date | null) => void;
  setGuests: (count: number) => void;
  clearBooking: () => void;

  numberOfNights: () => number;
  /** Returns the discount percentage: 20 for ≥30 nights, 10 for ≥7 nights, 0 otherwise. */
  discountPct: () => number;
  totalPrice: () => number;
}

export const useBookingStore = create<BookingState>()(
  persist(
    (set, get) => ({
      selectedRoom: null,
      checkIn: null,
      checkOut: null,
      guests: 1,

      setSelectedRoom: (room) => set({ selectedRoom: room }),
      setCheckIn: (date) => set({ checkIn: date }),
      setCheckOut: (date) => set({ checkOut: date }),
      setGuests: (count) => set({ guests: count }),
      clearBooking: () =>
        set({ selectedRoom: null, checkIn: null, checkOut: null, guests: 1 }),

      numberOfNights: () => {
        const { checkIn, checkOut } = get();
        if (!checkIn || !checkOut) return 0;
        const ms = checkOut.getTime() - checkIn.getTime();
        return Math.max(0, Math.floor(ms / (1000 * 60 * 60 * 24)));
      },

      discountPct: () => {
        const nights = get().numberOfNights();
        if (nights >= 30) return 20;
        if (nights >= 7)  return 10;
        return 0;
      },

      totalPrice: () => {
        const { selectedRoom, numberOfNights, discountPct } = get();
        if (!selectedRoom) return 0;
        const base = selectedRoom.pricePerNight * numberOfNights();
        const pct  = discountPct();
        return Math.round(base * (1 - pct / 100));
      },
    }),
    {
      name: 'hoang-long-booking',
      // Date objects don't survive JSON serialisation — revive them on rehydration
      onRehydrateStorage: () => (state) => {
        if (!state) return;
        if (state.checkIn)  state.checkIn  = new Date(state.checkIn);
        if (state.checkOut) state.checkOut = new Date(state.checkOut);
      },
    }
  )
);
