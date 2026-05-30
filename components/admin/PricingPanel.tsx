'use client';

import { useState, useRef } from 'react';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Check,
  History, ChevronDown, ChevronUp, RotateCcw, Calendar, SlidersHorizontal,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { usePricingStore, calcPricesFromDelta } from '@/lib/pricing-store';
import { roundToNearestHundredThousand as roundPrice } from '@/lib/utils/round-price';
import type { RoomPrices, SeasonalType } from '@/lib/pricing-store';

// ── Local helpers ────────────────────────────────────────────────────────────

function fmt(n: number) { return n.toLocaleString('en-US'); }
function parseRaw(s: string) { return parseInt(s.replace(/\D/g, ''), 10) || 0; }
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtDateTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}
function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

interface PriceCalc {
  rounded: RoomPrices;
  raw: { delta101: number; gamma201: number; alpha202: number; beta301: number };
}

function calculatePrices(deltaInput: number, gammaMultiplier: number, premiumMultiplier: number): PriceCalc {
  const delta101 = deltaInput;                          // exact as entered — no rounding
  const gammaRaw = delta101 * gammaMultiplier;
  const abRaw    = delta101 * premiumMultiplier;
  return {
    rounded: { delta101, gamma201: roundPrice(gammaRaw), alpha202: roundPrice(abRaw), beta301: roundPrice(abRaw) },
    raw:     { delta101, gamma201: gammaRaw, alpha202: abRaw, beta301: abRaw },
  };
}

const ROOM_CONFIG = [
  { key: 'delta101' as const, name: 'Delta', number: '101', roomId: 'green-mountain',
    accent: { card: 'border-slate-300', badge: 'bg-slate-100 text-slate-600', price: 'text-slate-300' } },
  { key: 'gamma201' as const, name: 'Gamma', number: '201', roomId: 'ban-flower',
    accent: { card: 'border-sky-400', badge: 'bg-sky-900/50 text-sky-300', price: 'text-sky-300' } },
  { key: 'alpha202' as const, name: 'Alpha', number: '202', roomId: 'family-room',
    accent: { card: 'border-violet-400', badge: 'bg-violet-900/50 text-violet-300', price: 'text-violet-300' } },
  { key: 'beta301'  as const, name: 'Beta',  number: '301', roomId: 'deluxe',
    accent: { card: 'border-amber-400', badge: 'bg-amber-900/50 text-amber-300', price: 'text-amber-300' } },
] as const;

const SEASONAL_PRESETS: { type: SeasonalType; label: string; multiplier: number; btnClass: string }[] = [
  { type: 'normal',  label: 'Normal ×1.0',  multiplier: 1.00, btnClass: 'bg-slate-700 text-slate-200 border-slate-600' },
  { type: 'weekend', label: 'Weekend ×1.15', multiplier: 1.15, btnClass: 'bg-blue-900 text-blue-200 border-blue-700' },
  { type: 'holiday', label: 'Holiday ×1.50', multiplier: 1.50, btnClass: 'bg-orange-900 text-orange-200 border-orange-700' },
  { type: 'tet',     label: 'Tết ×2.0',      multiplier: 2.00, btnClass: 'bg-red-900 text-red-200 border-red-700' },
  { type: 'low',     label: 'Low ×0.85',     multiplier: 0.85, btnClass: 'bg-green-900 text-green-200 border-green-700' },
  { type: 'custom',  label: 'Custom',         multiplier: 1.00, btnClass: 'bg-purple-900 text-purple-200 border-purple-700' },
];

// ── PriceCard ─────────────────────────────────────────────────────────────────

function PriceCard({ room, rounded, raw, prevPrice, seasonalMult, seasonalLabel }: {
  room: (typeof ROOM_CONFIG)[number];
  rounded: number; raw: number; prevPrice: number | null;
  seasonalMult: number; seasonalLabel: string;
}) {
  const isSeasonalActive = seasonalMult !== 1.0;
  const seasonalPrice    = isSeasonalActive ? roundPrice(Math.round(rounded * seasonalMult)) : null;
  const diff             = prevPrice !== null ? rounded - prevPrice : null;

  return (
    <div className={`bg-[#0b1120] rounded-2xl border-2 ${room.accent.card} p-4 flex flex-col gap-2`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="price-mono text-white text-base font-bold leading-none">
            {room.name} <span className="text-slate-400 font-normal text-sm">·</span> {room.number}
          </p>
          <span className={`inline-block mt-1 font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${room.accent.badge}`}>
            {room.key === 'delta101' ? 'Base' : room.key === 'gamma201' ? 'Mid' : 'Premium'}
          </span>
        </div>
        {diff !== null && diff !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-semibold price-mono rounded-lg px-2 py-1 ${
            diff > 0 ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'
          }`}>
            {diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {diff > 0 ? '+' : ''}{fmt(diff)}
          </div>
        )}
        {diff === 0 && <div className="flex items-center gap-1 text-xs text-slate-500 price-mono"><Minus className="w-3.5 h-3.5" /> no change</div>}
      </div>

      <p className="price-mono text-[10px] text-slate-600">Raw: {fmt(Math.round(raw))} →</p>
      <p className={`price-mono text-xl font-bold ${room.accent.price}`}>
        {fmt(rounded)} <span className="text-sm font-normal text-slate-500">VND</span>
      </p>

      {isSeasonalActive && seasonalPrice !== null && (
        <div className="border-t border-slate-800 pt-2">
          <p className="font-body text-[10px] text-amber-400 uppercase tracking-wider font-semibold mb-0.5">
            {seasonalLabel} (×{seasonalMult})
          </p>
          <p className="price-mono text-lg font-bold text-amber-300">
            {fmt(seasonalPrice)} <span className="text-sm font-normal text-slate-500">VND</span>
          </p>
        </div>
      )}
    </div>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

function ConfirmDialog({ prices, notes, onNoteChange, onConfirm, onCancel }: {
  prices: RoomPrices; notes: string;
  onNoteChange: (v: string) => void;
  onConfirm: () => void; onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#111827] border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-body text-white font-semibold text-lg mb-1">Apply these prices?</h3>
        <p className="font-body text-slate-400 text-sm mb-4">Guests will see the new prices immediately.</p>
        <div className="space-y-2 mb-4">
          {ROOM_CONFIG.map((r) => (
            <div key={r.key} className="flex justify-between">
              <span className="price-mono text-slate-300 text-sm">{r.name} {r.number}</span>
              <span className="price-mono text-white font-bold text-sm">{fmt(prices[r.key])} VND</span>
            </div>
          ))}
        </div>
        <div className="mb-4">
          <label className="font-body text-xs text-slate-400 block mb-1.5">Notes (optional)</label>
          <input
            type="text" value={notes} onChange={(e) => onNoteChange(e.target.value)}
            placeholder="e.g. Tết season, monthly review…"
            className="w-full price-mono text-sm bg-[#0b1120] border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
            autoFocus
          />
        </div>
        <div className="flex gap-3">
          <button onClick={onCancel} className="flex-1 font-body text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl py-2.5 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="flex-1 font-body text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl py-2.5 transition-colors flex items-center justify-center gap-1.5">
            <Check className="w-4 h-4" /> Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PricingPanel() {
  const { setRoomPrice } = useAdminStore();
  const {
    prices, lastUpdated, history,
    activeSeasonalMultiplier, seasonalLabel, seasonalType,
    gammaMultiplier, premiumMultiplier,
    weeklyDiscountPct, monthlyDiscountPct,
    weeklyDiscountMinNights, monthlyDiscountMinNights,
    applyPrices, setMultipliers, setDiscounts, applySeasonalMultiplier, removeSeasonalMultiplier,
  } = usePricingStore();

  const [deltaInput,    setDeltaInput]    = useState(() => fmt(prices.delta101));
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [pendingNotes,  setPendingNotes]  = useState('');
  const [successAt,     setSuccessAt]     = useState<string | null>(null);
  const [customMultStr, setCustomMultStr] = useState('1.0');
  const [historyOpen,   setHistoryOpen]   = useState(true);
  const [formulaOpen,   setFormulaOpen]   = useState(false);

  // Local editable copies of multipliers (only saved on "Save")
  const [localGamma,    setLocalGamma]    = useState(String(gammaMultiplier));
  const [localPremium,  setLocalPremium]  = useState(String(premiumMultiplier));
  const [multSaved,     setMultSaved]     = useState(false);

  // Local editable copies of discounts
  const [localWeeklyPct,    setLocalWeeklyPct]    = useState(String(weeklyDiscountPct));
  const [localMonthlyPct,   setLocalMonthlyPct]   = useState(String(monthlyDiscountPct));
  const [localWeeklyMin,    setLocalWeeklyMin]     = useState(String(weeklyDiscountMinNights));
  const [localMonthlyMin,   setLocalMonthlyMin]    = useState(String(monthlyDiscountMinNights));
  const [discountSaved,     setDiscountSaved]      = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);

  const deltaRaw = parseRaw(deltaInput);
  const calc     = deltaRaw > 0
    ? calculatePrices(deltaRaw, gammaMultiplier, premiumMultiplier)
    : null;

  const seasonalActive = activeSeasonalMultiplier !== 1.0;

  const daysElapsed   = lastUpdated ? daysAgo(lastUpdated) : null;
  const daysRemaining = daysElapsed !== null ? Math.max(0, 30 - daysElapsed) : null;
  const nextReviewAt  = lastUpdated
    ? new Date(new Date(lastUpdated).getTime() + 30 * 86_400_000).toISOString()
    : null;

  function handleDeltaChange(raw: string) {
    const digits = raw.replace(/\D/g, '');
    const n = parseInt(digits, 10);
    setDeltaInput(isNaN(n) ? '' : fmt(n));
  }

  function handleApplyConfirm() {
    if (!calc) return;
    applyPrices(deltaRaw, pendingNotes);
    setRoomPrice('green-mountain', calc.rounded.delta101);
    setRoomPrice('ban-flower',     calc.rounded.gamma201);
    setRoomPrice('family-room',    calc.rounded.alpha202);
    setRoomPrice('deluxe',         calc.rounded.beta301);
    setSuccessAt(new Date().toISOString());
    setShowConfirm(false);
    setPendingNotes('');
  }

  function handleSaveMultipliers() {
    const g = Math.max(0.5, Math.min(5, parseFloat(localGamma) || 1.25));
    const p = Math.max(0.5, Math.min(5, parseFloat(localPremium) || 1.50));
    setLocalGamma(String(g));
    setLocalPremium(String(p));
    setMultipliers(g, p);
    setMultSaved(true);
    setTimeout(() => setMultSaved(false), 2000);
  }

  function handleSaveDiscounts() {
    const wp  = Math.max(0, Math.min(99, parseFloat(localWeeklyPct)  || 0));
    const mp  = Math.max(0, Math.min(99, parseFloat(localMonthlyPct) || 0));
    const wm  = Math.max(1, parseInt(localWeeklyMin,  10) || 7);
    const mm  = Math.max(1, parseInt(localMonthlyMin, 10) || 30);
    setLocalWeeklyPct(String(wp));
    setLocalMonthlyPct(String(mp));
    setLocalWeeklyMin(String(wm));
    setLocalMonthlyMin(String(mm));
    setDiscounts(wp, mp, wm, mm);
    setDiscountSaved(true);
    setTimeout(() => setDiscountSaved(false), 2000);
  }

  function handleSeasonalPreset(type: SeasonalType, multiplier: number, label: string) {
    if (type === 'normal') { removeSeasonalMultiplier(); return; }
    if (type === 'custom') {
      const m = parseFloat(customMultStr) || 1;
      applySeasonalMultiplier(m, `Custom ×${m}`, 'custom');
    } else {
      applySeasonalMultiplier(multiplier, label, type);
    }
  }

  return (
    <div className="space-y-8">

      {/* Seasonal banner */}
      {seasonalActive && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl px-5 py-3.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <p className="font-body text-sm text-amber-300 font-semibold">
              Seasonal pricing active: ×{activeSeasonalMultiplier} ({seasonalLabel})
            </p>
          </div>
          <button onClick={removeSeasonalMultiplier} className="font-body text-xs font-bold text-amber-400 hover:text-white bg-amber-900/40 hover:bg-amber-900/70 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap">
            Remove
          </button>
        </div>
      )}

      {/* Section 1 – Delta input */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
        <h2 className="price-mono text-white text-lg font-bold mb-1">Base Price (Delta 101)</h2>
        <p className="font-body text-slate-400 text-sm mb-5">Set Delta's price — all other rooms calculate automatically.</p>

        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <input
              type="text" inputMode="numeric" value={deltaInput}
              onChange={(e) => handleDeltaChange(e.target.value)}
              placeholder="e.g. 450,000"
              className="w-full price-mono text-2xl font-bold bg-[#0b1120] border-2 border-slate-600 focus:border-blue-500 rounded-xl px-4 py-3.5 text-white placeholder:text-slate-700 outline-none transition-colors"
            />
            {deltaRaw > 0 && <span className="absolute right-4 top-1/2 -translate-y-1/2 price-mono text-xs text-slate-600">VND</span>}
          </div>
          <button
            onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
            className="flex items-center justify-center gap-2 px-5 py-3.5 bg-blue-600 hover:bg-blue-500 text-white price-mono font-bold text-sm rounded-xl transition-colors flex-shrink-0"
          >
            <ChevronDown className="w-4 h-4" /> Preview
          </button>
        </div>

        {deltaRaw > 0 && calc && (
          <div className="mt-3 flex items-center gap-3 bg-[#0b1120] rounded-xl px-4 py-2.5 border border-slate-700">
            <span className="price-mono text-white font-bold text-sm">Delta 101: {fmt(deltaRaw)} VND</span>
            <span className="text-slate-700">·</span>
            <span className="price-mono text-slate-500 text-xs">Gamma/Alpha/Beta calculated prices will be rounded to nearest 100,000</span>
          </div>
        )}
      </div>

      {/* Section 1b – Pricing formula (collapsible) */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 overflow-hidden">
        <button
          onClick={() => setFormulaOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-800/50 transition-colors text-left"
        >
          <SlidersHorizontal className="w-4 h-4 text-slate-400" />
          <span className="price-mono text-white font-semibold text-sm flex-1">
            Pricing Formula
            <span className="text-slate-500 font-normal text-xs ml-2">
              Gamma ×{gammaMultiplier} · Alpha &amp; Beta ×{premiumMultiplier}
            </span>
          </span>
          {formulaOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {formulaOpen && (
          <div className="border-t border-slate-800 px-5 py-5 space-y-4">
            <p className="font-body text-slate-400 text-sm">
              Adjust how Gamma, Alpha and Beta prices are calculated relative to Delta.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Gamma multiplier */}
              <div>
                <label className="price-mono text-xs text-sky-400 font-semibold block mb-1.5 uppercase tracking-wider">
                  Gamma (201) = Delta ×
                </label>
                <div className="flex items-center gap-2 bg-[#0b1120] border border-slate-600 rounded-xl px-3 py-2.5">
                  <input
                    type="number" min="0.5" max="5" step="0.05"
                    value={localGamma}
                    onChange={(e) => { setLocalGamma(e.target.value); setMultSaved(false); }}
                    className="price-mono bg-transparent text-white text-base font-bold outline-none flex-1 w-full"
                  />
                  {deltaRaw > 0 && (
                    <span className="price-mono text-xs text-slate-600 flex-shrink-0">
                      = {fmt(roundPrice(deltaRaw * (parseFloat(localGamma) || 1)))}
                    </span>
                  )}
                </div>
              </div>

              {/* Premium multiplier */}
              <div>
                <label className="price-mono text-xs text-amber-400 font-semibold block mb-1.5 uppercase tracking-wider">
                  Alpha &amp; Beta (202, 301) = Delta ×
                </label>
                <div className="flex items-center gap-2 bg-[#0b1120] border border-slate-600 rounded-xl px-3 py-2.5">
                  <input
                    type="number" min="0.5" max="5" step="0.05"
                    value={localPremium}
                    onChange={(e) => { setLocalPremium(e.target.value); setMultSaved(false); }}
                    className="price-mono bg-transparent text-white text-base font-bold outline-none flex-1 w-full"
                  />
                  {deltaRaw > 0 && (
                    <span className="price-mono text-xs text-slate-600 flex-shrink-0">
                      = {fmt(roundPrice(deltaRaw * (parseFloat(localPremium) || 1)))}
                    </span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleSaveMultipliers}
                className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white price-mono font-bold text-sm rounded-xl transition-colors"
              >
                {multSaved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : 'Save Multipliers'}
              </button>
              <button
                onClick={() => { setLocalGamma('1.25'); setLocalPremium('1.50'); setMultipliers(1.25, 1.50); }}
                className="font-body text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                Reset to defaults (1.25 / 1.50)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 1c – Stay discounts */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
        <div className="flex items-center justify-between mb-1">
          <h2 className="price-mono text-white text-lg font-bold">Stay Discounts</h2>
          {(weeklyDiscountPct > 0 || monthlyDiscountPct > 0) && (
            <span className="font-body text-xs font-semibold text-green-400 bg-green-900/30 border border-green-700/50 px-2.5 py-1 rounded-full">
              Active — live on booking page
            </span>
          )}
        </div>
        <p className="font-body text-slate-400 text-sm mb-5">
          Automatic discounts applied when guests stay longer. Set a percentage to 0 to disable.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Weekly discount */}
          <div className="bg-[#0b1120] rounded-2xl border border-slate-700 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
              <p className="price-mono text-blue-300 text-sm font-bold">Weekly Discount</p>
            </div>
            <div>
              <label className="price-mono text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Min nights to qualify
              </label>
              <div className="flex items-center gap-2 bg-[#111827] border border-slate-600 rounded-xl px-3 py-2.5">
                <input
                  type="number" min="1" max="29" step="1"
                  value={localWeeklyMin}
                  onChange={(e) => { setLocalWeeklyMin(e.target.value); setDiscountSaved(false); }}
                  className="price-mono bg-transparent text-white text-base font-bold outline-none flex-1 w-full"
                />
                <span className="price-mono text-xs text-slate-500 flex-shrink-0">nights</span>
              </div>
            </div>
            <div>
              <label className="price-mono text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Discount percentage
              </label>
              <div className="flex items-center gap-2 bg-[#111827] border border-slate-600 rounded-xl px-3 py-2.5">
                <input
                  type="number" min="0" max="99" step="1"
                  value={localWeeklyPct}
                  onChange={(e) => { setLocalWeeklyPct(e.target.value); setDiscountSaved(false); }}
                  className="price-mono bg-transparent text-white text-base font-bold outline-none flex-1 w-full"
                />
                <span className="price-mono text-xs text-slate-500 flex-shrink-0">%</span>
              </div>
            </div>
            <div className={`rounded-xl px-3 py-2 text-center ${
              parseFloat(localWeeklyPct) > 0
                ? 'bg-blue-900/30 border border-blue-700/40'
                : 'bg-slate-800/50 border border-slate-700'
            }`}>
              <p className="price-mono text-xs text-slate-400">
                {parseFloat(localWeeklyPct) > 0
                  ? <span className="text-blue-300 font-bold">{localWeeklyPct}% off</span>
                  : <span className="text-slate-500">Disabled</span>}
                {parseFloat(localWeeklyPct) > 0 && (
                  <span className="text-slate-500"> for {localWeeklyMin}+ nights</span>
                )}
              </p>
            </div>
          </div>

          {/* Monthly discount */}
          <div className="bg-[#0b1120] rounded-2xl border border-slate-700 p-4 space-y-3">
            <div className="flex items-center gap-2 mb-1">
              <span className="w-2 h-2 rounded-full bg-violet-400 flex-shrink-0" />
              <p className="price-mono text-violet-300 text-sm font-bold">Monthly Discount</p>
            </div>
            <div>
              <label className="price-mono text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Min nights to qualify
              </label>
              <div className="flex items-center gap-2 bg-[#111827] border border-slate-600 rounded-xl px-3 py-2.5">
                <input
                  type="number" min="1" max="365" step="1"
                  value={localMonthlyMin}
                  onChange={(e) => { setLocalMonthlyMin(e.target.value); setDiscountSaved(false); }}
                  className="price-mono bg-transparent text-white text-base font-bold outline-none flex-1 w-full"
                />
                <span className="price-mono text-xs text-slate-500 flex-shrink-0">nights</span>
              </div>
            </div>
            <div>
              <label className="price-mono text-xs text-slate-400 font-semibold uppercase tracking-wider block mb-1.5">
                Discount percentage
              </label>
              <div className="flex items-center gap-2 bg-[#111827] border border-slate-600 rounded-xl px-3 py-2.5">
                <input
                  type="number" min="0" max="99" step="1"
                  value={localMonthlyPct}
                  onChange={(e) => { setLocalMonthlyPct(e.target.value); setDiscountSaved(false); }}
                  className="price-mono bg-transparent text-white text-base font-bold outline-none flex-1 w-full"
                />
                <span className="price-mono text-xs text-slate-500 flex-shrink-0">%</span>
              </div>
            </div>
            <div className={`rounded-xl px-3 py-2 text-center ${
              parseFloat(localMonthlyPct) > 0
                ? 'bg-violet-900/30 border border-violet-700/40'
                : 'bg-slate-800/50 border border-slate-700'
            }`}>
              <p className="price-mono text-xs text-slate-400">
                {parseFloat(localMonthlyPct) > 0
                  ? <span className="text-violet-300 font-bold">{localMonthlyPct}% off</span>
                  : <span className="text-slate-500">Disabled</span>}
                {parseFloat(localMonthlyPct) > 0 && (
                  <span className="text-slate-500"> for {localMonthlyMin}+ nights</span>
                )}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 mt-5">
          <button
            onClick={handleSaveDiscounts}
            className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white price-mono font-bold text-sm rounded-xl transition-colors"
          >
            {discountSaved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : <><Check className="w-3.5 h-3.5" /> Save Discounts</>}
          </button>
          <button
            onClick={() => {
              setLocalWeeklyPct('10'); setLocalMonthlyPct('20');
              setLocalWeeklyMin('7'); setLocalMonthlyMin('30');
              setDiscounts(10, 20, 7, 30);
            }}
            className="font-body text-xs text-slate-500 hover:text-slate-300 transition-colors"
          >
            Reset to defaults (10% / 20%)
          </button>
        </div>
      </div>

      {/* Section 2 – Live preview */}
      <div ref={previewRef}>
        <h2 className="price-mono text-white text-lg font-bold mb-1">Live Preview</h2>
        <p className="font-body text-slate-400 text-sm mb-4">
          Gamma ×{gammaMultiplier} · Alpha &amp; Beta ×{premiumMultiplier} of Delta
        </p>

        {deltaRaw > 0 && calc ? (
          <div className="grid grid-cols-2 gap-3">
            {ROOM_CONFIG.map((room) => (
              <PriceCard
                key={room.key}
                room={room}
                rounded={calc.rounded[room.key]}
                raw={calc.raw[room.key]}
                prevPrice={prices[room.key]}
                seasonalMult={activeSeasonalMultiplier}
                seasonalLabel={seasonalLabel}
              />
            ))}
          </div>
        ) : (
          <div className="bg-[#111827] rounded-2xl border border-slate-700 p-8 text-center">
            <p className="price-mono text-slate-600 text-sm">Enter a Delta price above to preview.</p>
          </div>
        )}
      </div>

      {/* Section 3 – Apply */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-5 space-y-4">
        <button
          disabled={!calc}
          onClick={() => setShowConfirm(true)}
          className="w-full flex items-center justify-center gap-2 py-3.5 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white price-mono font-bold text-sm rounded-xl transition-colors"
        >
          <Check className="w-5 h-5" /> Apply to Live Website
        </button>

        {successAt && (
          <div className="flex items-start gap-2 bg-green-900/30 border border-green-700 rounded-xl px-4 py-3">
            <Check className="w-4 h-4 text-green-400 mt-0.5" />
            <div>
              <p className="price-mono text-green-300 text-sm font-semibold">✓ Prices updated {fmtDate(successAt)}</p>
              {nextReviewAt && <p className="font-body text-green-500 text-xs mt-0.5">Review by: {fmtDate(nextReviewAt)}</p>}
            </div>
          </div>
        )}

        {daysRemaining !== null && (
          <div className="flex items-center gap-3 bg-[#0b1120] rounded-xl px-4 py-3 border border-slate-700">
            <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex justify-between items-center mb-1">
                <span className="font-body text-slate-400 text-xs">Next review in</span>
                <span className="price-mono text-white font-bold text-sm">{daysRemaining} days</span>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    daysRemaining <= 7 ? 'bg-red-500' : daysRemaining <= 14 ? 'bg-amber-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.round((daysRemaining / 30) * 100)}%` }}
                />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Section 4 – History */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 overflow-hidden">
        <button
          onClick={() => setHistoryOpen((o) => !o)}
          className="w-full flex items-center gap-3 px-5 py-4 hover:bg-slate-800/50 transition-colors text-left"
        >
          <History className="w-4 h-4 text-slate-400" />
          <span className="price-mono text-white font-semibold text-sm flex-1">
            Price History {history.length > 0 && <span className="text-slate-500 text-[11px] ml-2">({history.length})</span>}
          </span>
          {historyOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {historyOpen && (
          history.length === 0 ? (
            <div className="px-5 py-8 text-center border-t border-slate-800">
              <p className="price-mono text-slate-600 text-sm">No history yet.</p>
            </div>
          ) : (
            <div className="border-t border-slate-800 overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-[#0b1120]">
                    {['Date', 'Delta', 'Gamma', 'Alpha', 'Beta', 'Formula', 'Notes', ''].map((h) => (
                      <th key={h} className="price-mono text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {history.map((entry, i) => (
                    <tr key={entry.id} className={i === 0 ? 'bg-green-950/20' : 'hover:bg-slate-800/30'}>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="price-mono text-white text-xs">{fmtDate(entry.date)}</p>
                        <p className="price-mono text-slate-600 text-[10px]">{fmtDateTime(entry.date).split(',')[1]}</p>
                      </td>
                      <td className="px-4 py-3 price-mono text-sm text-slate-300 whitespace-nowrap">{fmt(entry.delta101)}</td>
                      <td className="px-4 py-3 price-mono text-sm text-slate-300 whitespace-nowrap">{fmt(entry.gamma201)}</td>
                      <td className="px-4 py-3 price-mono text-sm text-slate-300 whitespace-nowrap">{fmt(entry.alpha202)}</td>
                      <td className="px-4 py-3 price-mono text-sm text-slate-300 whitespace-nowrap">{fmt(entry.beta301)}</td>
                      <td className="px-4 py-3 price-mono text-[10px] text-slate-500 whitespace-nowrap">
                        ×{entry.gammaMultiplier ?? '—'} / ×{entry.premiumMultiplier ?? '—'}
                      </td>
                      <td className="px-4 py-3 font-body text-xs text-slate-500">{entry.notes || <span className="text-slate-700">—</span>}</td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => setDeltaInput(fmt(entry.delta101))}
                          className="flex items-center gap-1 price-mono text-[11px] text-blue-400 hover:text-blue-300 bg-blue-900/30 hover:bg-blue-900/50 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                        >
                          <RotateCcw className="w-3 h-3" /> Restore
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        )}
      </div>

      {/* Section 5 – Seasonal */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-5">
        <h2 className="price-mono text-white text-lg font-bold mb-1">Seasonal Override</h2>
        <p className="font-body text-slate-400 text-sm mb-4">Multiplier applied on top of base prices — visible to guests immediately.</p>

        <div className="flex flex-wrap gap-2 mb-3">
          {SEASONAL_PRESETS.map((preset) => {
            const isActive = seasonalType === preset.type;
            return (
              <button
                key={preset.type}
                onClick={() => handleSeasonalPreset(preset.type, preset.multiplier, preset.label)}
                className={`price-mono text-xs font-semibold px-3 py-2 rounded-xl border transition-all ${
                  isActive
                    ? 'bg-amber-500 text-amber-950 border-amber-400 shadow-lg shadow-amber-900/40'
                    : preset.btnClass + ' hover:opacity-80'
                }`}
              >
                {preset.label}
              </button>
            );
          })}
        </div>

        {seasonalType === 'custom' && (
          <div className="flex items-center gap-3 mt-3">
            <div className="flex items-center gap-2 bg-[#0b1120] border border-slate-600 rounded-xl px-3 py-2.5 flex-1">
              <span className="price-mono text-slate-500 text-sm">×</span>
              <input
                type="number" min="0.1" max="10" step="0.05"
                value={customMultStr} onChange={(e) => setCustomMultStr(e.target.value)}
                className="price-mono bg-transparent text-white text-sm outline-none flex-1"
              />
            </div>
            <button
              onClick={() => {
                const m = Math.max(0.1, Math.min(10, parseFloat(customMultStr) || 1));
                applySeasonalMultiplier(m, `Custom ×${m}`, 'custom');
              }}
              className="price-mono text-sm font-semibold px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl transition-colors"
            >
              Apply
            </button>
          </div>
        )}
      </div>

      {/* Confirm dialog */}
      {showConfirm && calc && (
        <ConfirmDialog
          prices={calc.rounded}
          notes={pendingNotes}
          onNoteChange={setPendingNotes}
          onConfirm={handleApplyConfirm}
          onCancel={() => setShowConfirm(false)}
        />
      )}
    </div>
  );
}
