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
  delta101: 450_000,
  gamma201: 550_000,
  alpha202: 650_000,
  beta301:  650_000,
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
    id:                        'main',
    prices:                    state.prices,
    base_input_price:          state.baseInputPrice,
    gamma_multiplier:          state.gammaMultiplier,
    premium_multiplier:        state.premiumMultiplier,
    weekly_discount_pct:       state.weeklyDiscountPct,
    monthly_discount_pct:      state.monthlyDiscountPct,
    weekly_discount_min_nights: state.weeklyDiscountMinNights,
    monthly_discount_min_nights: state.monthlyDiscountMinNights,
    active_seasonal_multiplier: state.activeSeasonalMultiplier,
    seasonal_label:            state.seasonalLabel,
    seasonal_type:             state.seasonalType,
    history:                   state.history,
    last_updated:              state.lastUpdated,
    updated_at:                new Date().toISOString(),
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