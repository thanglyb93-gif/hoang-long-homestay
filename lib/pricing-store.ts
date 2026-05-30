'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { roundToNearestHundredThousand as round } from '@/lib/utils/round-price';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface RoomPrices {
  delta101: number;
  gamma201: number;
  alpha202: number;
  beta301:  number;
}

export interface PriceHistoryEntry {
  id:               string;
  date:             string; // ISO
  delta101:         number;
  gamma201:         number;
  alpha202:         number;
  beta301:          number;
  gammaMultiplier:  number;
  premiumMultiplier:number;
  notes:            string;
}

export type SeasonalType = 'normal' | 'weekend' | 'holiday' | 'tet' | 'low' | 'custom';

// ── Store interface ───────────────────────────────────────────────────────────

interface PricingState {
  prices:                   RoomPrices;
  baseInputPrice:           number | null;
  lastUpdated:              string | null; // ISO
  nextReviewDate:           string | null; // ISO (lastUpdated + 30 days)
  activeSeasonalMultiplier: number;
  seasonalLabel:            string;
  seasonalType:             SeasonalType;
  history:                  PriceHistoryEntry[];

  // Configurable pricing multipliers
  gammaMultiplier:          number;   // Gamma = Delta × gammaMultiplier   (default 1.25)
  premiumMultiplier:        number;   // Alpha & Beta = Delta × premiumMultiplier (default 1.50)

  // Stay-length discounts shown in the booking page
  weeklyDiscountPct:        number;   // % off when nights ≥ weeklyDiscountMinNights  (default 10)
  monthlyDiscountPct:       number;   // % off when nights ≥ monthlyDiscountMinNights (default 20)
  weeklyDiscountMinNights:  number;   // threshold for weekly discount  (default 7)
  monthlyDiscountMinNights: number;   // threshold for monthly discount (default 30)

  applyPrices:              (deltaInput: number, notes?: string) => void;
  setMultipliers:           (gamma: number, premium: number) => void;
  setDiscounts:             (weekly: number, monthly: number, weeklyMin?: number, monthlyMin?: number) => void;
  applySeasonalMultiplier:  (multiplier: number, label: string, type?: SeasonalType) => void;
  removeSeasonalMultiplier: () => void;
  restoreFromHistory:       (index: number) => void;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_PRICES: RoomPrices = {
  delta101: 450_000,
  gamma201: 550_000,
  alpha202: 650_000,
  beta301:  650_000,
};

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid(): string {
  return Math.random().toString(36).slice(2, 10);
}

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

/**
 * Calculate all room prices from a single Delta input + configurable multipliers.
 * gammaMultiplier:   Gamma = Delta × gammaMultiplier   (default 1.25)
 * premiumMultiplier: Alpha & Beta = Delta × premiumMultiplier (default 1.50)
 */
export function calcPricesFromDelta(
  deltaInput: number,
  gammaMultiplier   = 1.25,
  premiumMultiplier = 1.50
): RoomPrices {
  const delta101 = deltaInput;                           // exact as entered — no rounding
  const gamma201 = round(delta101 * gammaMultiplier);   // derived prices are rounded
  const premium  = round(delta101 * premiumMultiplier);
  return { delta101, gamma201, alpha202: premium, beta301: premium };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const usePricingStore = create<PricingState>()(
  persist(
    (set, get) => ({
      prices:                   DEFAULT_PRICES,
      baseInputPrice:           null,
      lastUpdated:              null,
      nextReviewDate:           null,
      activeSeasonalMultiplier: 1.0,
      seasonalLabel:            'Normal',
      seasonalType:             'normal',
      history:                  [],
      gammaMultiplier:          1.25,
      premiumMultiplier:        1.50,
      weeklyDiscountPct:        10,
      monthlyDiscountPct:       20,
      weeklyDiscountMinNights:  7,
      monthlyDiscountMinNights: 30,

      applyPrices: (deltaInput, notes = '') => {
        const { gammaMultiplier, premiumMultiplier } = get();
        const prices = calcPricesFromDelta(deltaInput, gammaMultiplier, premiumMultiplier);
        const now    = new Date().toISOString();
        const entry: PriceHistoryEntry = {
          id:   uid(),
          date: now,
          ...prices,
          gammaMultiplier,
          premiumMultiplier,
          notes,
        };
        set((s) => ({
          prices,
          baseInputPrice: deltaInput,
          lastUpdated:    now,
          nextReviewDate: addDays(now, 30),
          history: [entry, ...s.history].slice(0, 6),
        }));
      },

      setMultipliers: (gamma, premium) => {
        set({ gammaMultiplier: gamma, premiumMultiplier: premium });
      },

      setDiscounts: (weekly, monthly, weeklyMin = 7, monthlyMin = 30) => {
        set({
          weeklyDiscountPct:        Math.max(0, Math.min(99, weekly)),
          monthlyDiscountPct:       Math.max(0, Math.min(99, monthly)),
          weeklyDiscountMinNights:  Math.max(1, weeklyMin),
          monthlyDiscountMinNights: Math.max(1, monthlyMin),
        });
      },

      applySeasonalMultiplier: (multiplier, label, type = 'custom') => {
        set({ activeSeasonalMultiplier: multiplier, seasonalLabel: label, seasonalType: type });
      },

      removeSeasonalMultiplier: () => {
        set({ activeSeasonalMultiplier: 1.0, seasonalLabel: 'Normal', seasonalType: 'normal' });
      },

      restoreFromHistory: (index) => {
        const entry = get().history[index];
        if (!entry) return;
        const prices: RoomPrices = {
          delta101: entry.delta101,
          gamma201: entry.gamma201,
          alpha202: entry.alpha202,
          beta301:  entry.beta301,
        };
        const now = new Date().toISOString();
        const restored: PriceHistoryEntry = {
          id:               uid(),
          date:             now,
          ...prices,
          gammaMultiplier:  entry.gammaMultiplier ?? 1.25,
          premiumMultiplier:entry.premiumMultiplier ?? 1.50,
          notes:            `Restored — ${entry.notes || fmtDate(entry.date)}`,
        };
        set((s) => ({
          prices,
          baseInputPrice:   entry.delta101,
          lastUpdated:      now,
          nextReviewDate:   addDays(now, 30),
          gammaMultiplier:  entry.gammaMultiplier ?? s.gammaMultiplier,
          premiumMultiplier:entry.premiumMultiplier ?? s.premiumMultiplier,
          history: [restored, ...s.history].slice(0, 6),
        }));
      },
    }),
    { name: 'hl-pricing-v2' }
  )
);

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

// ── Room → price key mapping ──────────────────────────────────────────────────

export const ROOM_PRICE_KEY: Record<string, keyof RoomPrices> = {
  'green-mountain': 'delta101',
  'ban-flower':     'gamma201',
  'family-room':    'alpha202',
  'deluxe':         'beta301',
  // Placeholder rooms default to the same tier pricing until activated
  // (custom prices are set per-room in useRoomStore)
  'epsilon':  'delta101',
  'zeta':     'gamma201',
  'eta':      'gamma201',
  'theta':    'beta301',
  'iota':     'beta301',
  'kappa':    'beta301',
  'lambda':   'delta101',
  'omicron':  'gamma201',
  'sigma':    'gamma201',
  'omega':    'beta301',
};
