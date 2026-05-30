'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { roundToNearestHundredThousand as round } from '@/lib/utils/round-price';
import { supabase } from './supabase';

export interface RoomPrices {
  delta101: number;
  gamma201: number;
  alpha202: number;
  beta301:  number;
}

export interface PriceHistoryEntry {
  id:                string;
  date:              string;
  delta101:          number;
  gamma201:          number;
  alpha202:          number;
  beta301:           number;
  gammaMultiplier:   number;
  premiumMultiplier: number;
  notes:             string;
}

export type SeasonalType = 'normal' | 'weekend' | 'holiday' | 'tet' | 'low' | 'custom';

interface PricingState {
  prices:                   RoomPrices;
  baseInputPrice:           number | null;
  lastUpdated:              string | null;
  nextReviewDate:           string | null;
  activeSeasonalMultiplier: number;
  seasonalLabel:            string;
  seasonalType:             SeasonalType;
  history:                  PriceHistoryEntry[];
  gammaMultiplier:          number;
  premiumMultiplier:        number;
  weeklyDiscountPct:        number;
  monthlyDiscountPct:       number;
  weeklyDiscountMinNights:  number;
  monthlyDiscountMinNights: number;
  loadFromDB:               () => Promise<void>;
  applyPrices:              (deltaInput: number, notes?: string) => void;
  setMultipliers:           (gamma: number, premium: number) => void;
  setDiscounts:             (weekly: number, monthly: number, weeklyMin?: number, monthlyMin?: number) => void;
  applySeasonalMultiplier:  (multiplier: number, label: string, type?: SeasonalType) => void;
  removeSeasonalMultiplier: () => void;
  restoreFromHistory:       (index: number) => void;
}

const DEFAULT_PRICES: RoomPrices = {
  delta101: 450000,
  gamma201: 550000,
  alpha202: 650000,
  beta301:  650000,
};

function uid(): string { return Math.random().toString(36).slice(2, 10); }

function addDays(iso: string, days: number): string {
  const d = new Date(iso);
  d.setDate(d.getDate() + days);
  return d.toISOString();
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export function calcPricesFromDelta(deltaInput: number, gammaMultiplier = 1.25, premiumMultiplier = 1.50): RoomPrices {
  const delta101 = deltaInput;
  const gamma201 = round(delta101 * gammaMultiplier);
  const premium  = round(delta101 * premiumMultiplier);
  return { delta101, gamma201, alpha202: premium, beta301: premium };
}

async function saveToDB(state: Partial<PricingState>) {
  await supabase.from('pricing').upsert({
    id:                         'main',
    prices:                     state.prices,
    base_input_price:           state.baseInputPrice,
    gamma_multiplier:           state.gammaMultiplier,
    premium_multiplier:         state.premiumMultiplier,
    weekly_discount_pct:        state.weeklyDiscountPct,
    monthly_discount_pct:       state.monthlyDiscountPct,
    weekly_discount_min_nights: state.weeklyDiscountMinNights,
    monthly_discount_min_nights:state.monthlyDiscountMinNights,
    active_seasonal_multiplier: state.activeSeasonalMultiplier,
    seasonal_label:             state.seasonalLabel,
    seasonal_type:              state.seasonalType,
    history:                    state.history,
    last_updated:               state.lastUpdated,
    updated_at:                 new Date().toISOString(),
  });
}

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

      loadFromDB: async () => {
        const { data, error } = await supabase.from('pricing').select('*').eq('id', 'main').single();
        if (error || !data) return;
        set({
          prices: { delta101: data.prices?.delta101 ?? 450000, gamma201: data.prices?.gamma201 ?? 550000, alpha202: data.prices?.alpha202 ?? 650000, beta301: data.prices?.beta301 ?? 650000 },
          baseInputPrice:           data.base_input_price           ?? null,
          gammaMultiplier:          data.gamma_multiplier           ?? 1.25,
          premiumMultiplier:        data.premium_multiplier         ?? 1.50,
          weeklyDiscountPct:        data.weekly_discount_pct        ?? 10,
          monthlyDiscountPct:       data.monthly_discount_pct       ?? 20,
          weeklyDiscountMinNights:  data.weekly_discount_min_nights ?? 7,
          monthlyDiscountMinNights: data.monthly_discount_min_nights ?? 30,
          activeSeasonalMultiplier: data.active_seasonal_multiplier ?? 1.0,
          seasonalLabel:            data.seasonal_label             ?? 'Normal',
          seasonalType:             data.seasonal_type              ?? 'normal',
          history:                  data.history                    ?? [],
          lastUpdated:              data.last_updated               ?? null,
        });
      },

      applyPrices: (deltaInput, notes = '') => {
        const { gammaMultiplier, premiumMultiplier } = get();
        const prices = calcPricesFromDelta(deltaInput, gammaMultiplier, premiumMultiplier);
        const now    = new Date().toISOString();
        const entry: PriceHistoryEntry = { id: uid(), date: now, ...prices, gammaMultiplier, premiumMultiplier, notes };
        const newState = {
          prices,
          baseInputPrice: deltaInput,
          lastUpdated:    now,
          nextReviewDate: addDays(now, 30),
          history:        [entry, ...get().history].slice(0, 6),
        };
        set(newState);
        saveToDB({ ...get(), ...newState });
      },

      setMultipliers: (gamma, premium) => {
        set({ gammaMultiplier: gamma, premiumMultiplier: premium });
        saveToDB({ ...get(), gammaMultiplier: gamma, premiumMultiplier: premium });
      },

      setDiscounts: (weekly, monthly, weeklyMin = 7, monthlyMin = 30) => {
        const newState = {
          weeklyDiscountPct:        Math.max(0, Math.min(99, weekly)),
          monthlyDiscountPct:       Math.max(0, Math.min(99, monthly)),
          weeklyDiscountMinNights:  Math.max(1, weeklyMin),
          monthlyDiscountMinNights: Math.max(1, monthlyMin),
        };
        set(newState);
        saveToDB({ ...get(), ...newState });
      },

      applySeasonalMultiplier: (multiplier, label, type = 'custom') => {
        set({ activeSeasonalMultiplier: multiplier, seasonalLabel: label, seasonalType: type });
        saveToDB({ ...get(), activeSeasonalMultiplier: multiplier, seasonalLabel: label, seasonalType: type });
      },

      removeSeasonalMultiplier: () => {
        set({ activeSeasonalMultiplier: 1.0, seasonalLabel: 'Normal', seasonalType: 'normal' });
        saveToDB({ ...get(), activeSeasonalMultiplier: 1.0, seasonalLabel: 'Normal', seasonalType: 'normal' });
      },

      restoreFromHistory: (index) => {
        const entry = get().history[index];
        if (!entry) return;
        const prices: RoomPrices = { delta101: entry.delta101, gamma201: entry.gamma201, alpha202: entry.alpha202, beta301: entry.beta301 };
        const now = new Date().toISOString();
        const restored: PriceHistoryEntry = {
          id: uid(), date: now, ...prices,
          gammaMultiplier:   entry.gammaMultiplier  ?? 1.25,
          premiumMultiplier: entry.premiumMultiplier ?? 1.50,
          notes: 'Restored - ' + (entry.notes || fmtDate(entry.date)),
        };
        const newState = {
          prices,
          baseInputPrice:    entry.delta101,
          lastUpdated:       now,
          nextReviewDate:    addDays(now, 30),
          gammaMultiplier:   entry.gammaMultiplier  ?? get().gammaMultiplier,
          premiumMultiplier: entry.premiumMultiplier ?? get().premiumMultiplier,
          history:           [restored, ...get().history].slice(0, 6),
        };
        set(newState);
        saveToDB({ ...get(), ...newState });
      },
    }),
    { name: 'hl-pricing-v3' }
  )
);

export const ROOM_PRICE_KEY: Record<string, keyof RoomPrices> = {
  'green-mountain': 'delta101',
  'ban-flower':     'gamma201',
  'family-room':    'alpha202',
  'deluxe':         'beta301',
  'epsilon':        'delta101',
  'zeta':           'gamma201',
  'eta':            'gamma201',
  'theta':          'beta301',
  'iota':           'beta301',
  'kappa':          'beta301',
  'lambda':         'delta101',
  'omicron':        'gamma201',
  'sigma':          'gamma201',
  'omega':          'beta301',
};