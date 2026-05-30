'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  TrendingUp, TrendingDown, Minus, AlertTriangle, Check,
  History, Lock, Eye, EyeOff, LogOut, ChevronDown, ChevronUp,
  RotateCcw, Zap, Calendar, ImageIcon,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { usePricingStore, calcPricesFromDelta } from '@/lib/pricing-store';
import { roundToNearestHundredThousand as roundPrice } from '@/lib/utils/round-price';
import type { RoomPrices, SeasonalType } from '@/lib/pricing-store';

// ── Utility ───────────────────────────────────────────────────────────────────

interface PriceCalc {
  rounded: RoomPrices;
  raw: { delta101: number; gamma201: number; alpha202: number; beta301: number };
}

/** Live preview calculation (mirrors store logic, shows intermediate raws). */
function calculatePrices(deltaInput: number): PriceCalc {
  const delta101  = roundPrice(deltaInput);
  const gamma201  = roundPrice(delta101 * 1.25);
  const abRaw     = gamma201 * 1.20;
  const ab        = roundPrice(abRaw);
  return {
    rounded: { delta101, gamma201, alpha202: ab, beta301: ab },
    raw:     { delta101: deltaInput, gamma201: delta101 * 1.25, alpha202: abRaw, beta301: abRaw },
  };
}

function fmt(n: number): string {
  return n.toLocaleString('en-US');
}

function parseRaw(s: string): number {
  return parseInt(s.replace(/\D/g, ''), 10) || 0;
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

// ── Constants ─────────────────────────────────────────────────────────────────

const ROOM_CONFIG = [
  {
    key:    'delta101' as const,
    name:   'Delta',
    number: '101',
    roomId: 'green-mountain',
    tier:   'Base',
    accent: { card: 'border-slate-300', badge: 'bg-slate-100 text-slate-600', price: 'text-slate-700' },
  },
  {
    key:    'gamma201' as const,
    name:   'Gamma',
    number: '201',
    roomId: 'ban-flower',
    tier:   'Mid',
    accent: { card: 'border-sky-300', badge: 'bg-sky-100 text-sky-700', price: 'text-sky-700' },
  },
  {
    key:    'alpha202' as const,
    name:   'Alpha',
    number: '202',
    roomId: 'family-room',
    tier:   'Premium',
    accent: { card: 'border-violet-300', badge: 'bg-violet-100 text-violet-700', price: 'text-violet-700' },
  },
  {
    key:    'beta301' as const,
    name:   'Beta',
    number: '301',
    roomId: 'deluxe',
    tier:   'Premium',
    accent: { card: 'border-amber-300', badge: 'bg-amber-100 text-amber-700', price: 'text-amber-700' },
  },
] as const;

const SEASONAL_PRESETS: { type: SeasonalType; label: string; multiplier: number; btnClass: string }[] = [
  { type: 'normal',  label: 'Normal ×1.0',         multiplier: 1.00, btnClass: 'bg-slate-700 text-slate-200 border-slate-600' },
  { type: 'weekend', label: 'Weekend ×1.15',        multiplier: 1.15, btnClass: 'bg-blue-900 text-blue-200 border-blue-700' },
  { type: 'holiday', label: 'Public Holiday ×1.50', multiplier: 1.50, btnClass: 'bg-orange-900 text-orange-200 border-orange-700' },
  { type: 'tet',     label: 'Tết ×2.0',             multiplier: 2.00, btnClass: 'bg-red-900 text-red-200 border-red-700' },
  { type: 'low',     label: 'Low Season ×0.85',     multiplier: 0.85, btnClass: 'bg-green-900 text-green-200 border-green-700' },
  { type: 'custom',  label: 'Custom',                multiplier: 1.00, btnClass: 'bg-purple-900 text-purple-200 border-purple-700' },
];

// ── PriceCard ─────────────────────────────────────────────────────────────────

interface PriceCardProps {
  room:              (typeof ROOM_CONFIG)[number];
  rounded:           number;
  raw:               number;
  prevPrice:         number | null;
  seasonalMult:      number;
  seasonalLabel:     string;
}

function PriceCard({ room, rounded, raw, prevPrice, seasonalMult, seasonalLabel }: PriceCardProps) {
  const isSeasonalActive = seasonalMult !== 1.0;
  const seasonalPrice    = isSeasonalActive ? roundPrice(Math.round(rounded * seasonalMult)) : null;

  const diff         = prevPrice !== null ? rounded - prevPrice : null;
  const diffSeasonal = (prevPrice !== null && seasonalPrice !== null) ? seasonalPrice - prevPrice : null;

  return (
    <div className={`bg-[#111827] rounded-2xl border-2 ${room.accent.card} p-5 flex flex-col gap-3`}>
      {/* Room header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="price-mono text-white text-lg font-bold leading-none">
            {room.name} <span className="text-slate-400 font-normal">·</span> {room.number}
          </p>
          <span className={`inline-block mt-1.5 font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${room.accent.badge}`}>
            {room.tier}
          </span>
        </div>

        {/* Diff badge */}
        {diff !== null && diff !== 0 && (
          <div className={`flex items-center gap-1 text-xs font-semibold price-mono rounded-lg px-2 py-1 ${
            diff > 0 ? 'bg-red-900/50 text-red-300' : 'bg-green-900/50 text-green-300'
          }`}>
            {diff > 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
            {diff > 0 ? '+' : ''}{fmt(diff)}
          </div>
        )}
        {diff === 0 && (
          <div className="flex items-center gap-1 text-xs text-slate-500 price-mono">
            <Minus className="w-3.5 h-3.5" /> no change
          </div>
        )}
      </div>

      {/* Raw → Rounded */}
      <div>
        <p className="price-mono text-[11px] text-slate-500 mb-1">
          Raw: {fmt(Math.round(raw))} VND →
        </p>
        <p className={`price-mono text-2xl font-bold ${room.accent.price}`}>
          {fmt(rounded)} <span className="text-base font-normal text-slate-400">VND</span>
        </p>
      </div>

      {/* Seasonal price */}
      {isSeasonalActive && seasonalPrice !== null && (
        <div className="border-t border-slate-700 pt-3">
          <p className="font-body text-[10px] text-amber-400 uppercase tracking-wider font-semibold mb-1">
            {seasonalLabel} (×{seasonalMult})
          </p>
          <p className="price-mono text-xl font-bold text-amber-300">
            {fmt(seasonalPrice)} <span className="text-sm font-normal text-slate-400">VND</span>
          </p>
          {diffSeasonal !== null && diffSeasonal !== 0 && (
            <p className={`price-mono text-[11px] mt-0.5 ${diffSeasonal > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {diffSeasonal > 0 ? '↑ +' : '↓ '}{fmt(Math.abs(diffSeasonal))} from last applied
            </p>
          )}
        </div>
      )}

      {/* Prev price note */}
      {prevPrice !== null && (
        <p className="price-mono text-[10px] text-slate-600">
          prev: {fmt(prevPrice)} VND
        </p>
      )}
    </div>
  );
}

// ── ConfirmDialog ─────────────────────────────────────────────────────────────

interface ConfirmDialogProps {
  prices:       RoomPrices;
  notes:        string;
  onNoteChange: (v: string) => void;
  onConfirm:    () => void;
  onCancel:     () => void;
}

function ConfirmDialog({ prices, notes, onNoteChange, onConfirm, onCancel }: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onCancel} />
      <div className="relative bg-[#111827] border border-slate-700 rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="font-body text-white font-semibold text-lg mb-1">Apply these prices?</h3>
        <p className="font-body text-slate-400 text-sm mb-4">
          This will immediately update all room prices visible to guests.
        </p>

        <div className="space-y-2 mb-4">
          {ROOM_CONFIG.map((r) => (
            <div key={r.key} className="flex justify-between items-center">
              <span className="price-mono text-slate-300 text-sm">{r.name} {r.number}</span>
              <span className="price-mono text-white font-bold text-sm">{fmt(prices[r.key])} VND</span>
            </div>
          ))}
        </div>

        <div className="mb-4">
          <label className="font-body text-xs text-slate-400 block mb-1.5">Notes (optional)</label>
          <input
            type="text"
            value={notes}
            onChange={(e) => onNoteChange(e.target.value)}
            placeholder="e.g. Tết season, Low season adjustment…"
            className="w-full price-mono text-sm bg-[#0b1120] border border-slate-600 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-600 outline-none focus:border-blue-500"
            autoFocus
          />
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 font-body text-sm text-slate-300 bg-slate-800 hover:bg-slate-700 rounded-xl py-2.5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 font-body text-sm font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-xl py-2.5 transition-colors flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" /> Confirm & Apply
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function PricingAdminPage() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { isAuthenticated, login, logout, setRoomPrice } = useAdminStore();
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin,  setShowPin]  = useState(false);

  // ── Pricing store ────────────────────────────────────────────────────────────
  const {
    prices, lastUpdated, history,
    activeSeasonalMultiplier, seasonalLabel, seasonalType,
    applyPrices, applySeasonalMultiplier, removeSeasonalMultiplier,
  } = usePricingStore();

  // ── Local state ──────────────────────────────────────────────────────────────
  const [deltaInput,    setDeltaInput]    = useState('450,000');
  const [showConfirm,   setShowConfirm]   = useState(false);
  const [pendingNotes,  setPendingNotes]  = useState('');
  const [successAt,     setSuccessAt]     = useState<string | null>(null);
  const [customMultStr, setCustomMultStr] = useState('1.0');
  const [historyOpen,   setHistoryOpen]   = useState(true);
  const previewRef = useRef<HTMLDivElement>(null);

  // Seed delta input from last applied prices on mount
  useEffect(() => {
    if (prices.delta101 && deltaInput === '450,000') {
      setDeltaInput(fmt(prices.delta101));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Computed ─────────────────────────────────────────────────────────────────
  const deltaRaw = parseRaw(deltaInput);
  const calc     = deltaRaw > 0 ? calculatePrices(deltaRaw) : null;

  // ── Handlers ─────────────────────────────────────────────────────────────────
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (login(pinInput)) { setPinError(false); setPinInput(''); }
    else                 { setPinError(true);  setPinInput(''); }
  }

  function handleDeltaChange(raw: string) {
    const digits = raw.replace(/\D/g, '');
    const n      = parseInt(digits, 10);
    setDeltaInput(isNaN(n) ? '' : fmt(n));
  }

  function handleApplyConfirm() {
    if (!calc) return;

    // Write to pricing store (stores history, marks lastUpdated)
    applyPrices(deltaRaw, pendingNotes);

    // Also write to admin store for any room-level overrides used elsewhere
    setRoomPrice('green-mountain', calc.rounded.delta101);
    setRoomPrice('ban-flower',     calc.rounded.gamma201);
    setRoomPrice('family-room',    calc.rounded.alpha202);
    setRoomPrice('deluxe',         calc.rounded.beta301);

    setSuccessAt(new Date().toISOString());
    setShowConfirm(false);
    setPendingNotes('');
  }

  function handleRestorePrices(entry: (typeof history)[number]) {
    setDeltaInput(fmt(entry.delta101));
    previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleSeasonalPreset(type: SeasonalType, multiplier: number, label: string) {
    if (type === 'normal') {
      removeSeasonalMultiplier();
    } else if (type === 'custom') {
      const m = parseFloat(customMultStr) || 1;
      applySeasonalMultiplier(m, `Custom ×${m}`, 'custom');
    } else {
      applySeasonalMultiplier(multiplier, label, type);
    }
  }

  function handleCustomMultApply() {
    const m = Math.max(0.1, Math.min(10, parseFloat(customMultStr) || 1));
    applySeasonalMultiplier(m, `Custom ×${m}`, 'custom');
  }

  // ── Review countdown ─────────────────────────────────────────────────────────
  const daysElapsed   = lastUpdated ? daysAgo(lastUpdated) : null;
  const daysRemaining = daysElapsed !== null ? Math.max(0, 30 - daysElapsed) : null;
  const nextReviewAt  = lastUpdated
    ? new Date(new Date(lastUpdated).getTime() + 30 * 86_400_000).toISOString()
    : null;

  const seasonalActive = activeSeasonalMultiplier !== 1.0;

  // ── Login screen ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#111827] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-violet-500 to-blue-800" />
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#0b1120] border border-slate-700 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="price-mono text-white text-xl font-bold">Pricing Admin</h1>
              <p className="font-body text-slate-500 text-xs mt-1">Hoang Long Homestay</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                  placeholder="Admin PIN"
                  autoFocus
                  className={`w-full price-mono text-sm bg-[#0b1120] border rounded-xl px-4 py-3 pr-10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-colors ${
                    pinError ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && <p className="font-body text-xs text-red-400">Incorrect PIN.</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white price-mono font-bold text-sm py-3 rounded-xl transition-colors"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated UI ─────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b1120] text-white">

      {/* ── Seasonal amber banner ──────────────────────────────────────────── */}
      {seasonalActive && (
        <div className="bg-amber-500 text-amber-950 px-4 py-2.5 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <p className="font-body text-sm font-semibold truncate">
              ⚠ Seasonal pricing active: ×{activeSeasonalMultiplier} ({seasonalLabel}) —
              prices shown to guests include this multiplier
            </p>
          </div>
          <button
            onClick={removeSeasonalMultiplier}
            className="flex-shrink-0 font-body text-xs font-bold bg-amber-950/20 hover:bg-amber-950/40 px-3 py-1.5 rounded-lg transition-colors whitespace-nowrap"
          >
            Remove Override
          </button>
        </div>
      )}

      {/* ── Top nav bar ───────────────────────────────────────────────────── */}
      <header className="bg-[#0d1526] border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="price-mono text-white font-bold text-sm">Pricing Admin</span>
          <span className="text-slate-600 text-sm">·</span>
          <span className="font-body text-slate-400 text-xs hidden sm:inline">Hoang Long Homestay</span>
        </div>

        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="font-body text-xs text-slate-500 hidden md:inline mr-1">
              Last applied: {fmtDate(lastUpdated)}
            </span>
          )}
          <Link
            href="/admin/images"
            className="flex items-center gap-1.5 font-body text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ImageIcon className="w-3.5 h-3.5" /> Images
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 font-body text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* ── Main content ──────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-10">

        {/* ════════════════════════════════════════════════════════════════
            SECTION 1 — DELTA INPUT
        ════════════════════════════════════════════════════════════════ */}
        <section className="bg-[#111827] rounded-2xl border border-slate-700 p-6 sm:p-8">
          <div className="flex items-center gap-2 mb-1">
            <span className="price-mono text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              Section 1
            </span>
          </div>
          <h2 className="price-mono text-white text-xl font-bold mb-1">Base Price Input</h2>
          <p className="font-body text-slate-400 text-sm mb-6">
            Set Delta&apos;s price — all other rooms calculate automatically.
          </p>

          <label className="price-mono text-slate-300 text-sm font-semibold block mb-2">
            Delta Room 101 — Base Price (VND)
          </label>

          {/* Large delta input */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                inputMode="numeric"
                value={deltaInput}
                onChange={(e) => handleDeltaChange(e.target.value)}
                placeholder="e.g. 450,000"
                className="w-full price-mono text-3xl font-bold bg-[#0b1120] border-2 border-slate-600 focus:border-blue-500 rounded-xl px-5 py-4 text-white placeholder:text-slate-700 outline-none transition-colors"
              />
              {deltaRaw > 0 && (
                <span className="absolute right-4 top-1/2 -translate-y-1/2 price-mono text-xs text-slate-600">
                  VND
                </span>
              )}
            </div>
            <button
              onClick={() => previewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })}
              className="flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-500 text-white price-mono font-bold text-sm rounded-xl transition-colors flex-shrink-0"
            >
              <ChevronDown className="w-4 h-4" />
              Preview Prices
            </button>
          </div>

          <p className="font-body text-slate-500 text-xs mt-3">
            Enter the minimum price you want to offer for Delta Room 101.
            All other rooms will be calculated automatically using fixed multipliers.
          </p>

          {/* Rounding preview for delta */}
          {deltaRaw > 0 && calc && (
            <div className="mt-4 flex items-center gap-3 bg-[#0b1120] rounded-xl px-4 py-3 border border-slate-700">
              <span className="price-mono text-slate-500 text-sm">Raw: {fmt(deltaRaw)}</span>
              <span className="text-slate-600">→</span>
              <span className="price-mono text-white font-bold text-sm">Rounded: {fmt(calc.rounded.delta101)} VND</span>
              {calc.rounded.delta101 !== deltaRaw && (
                <span className={`price-mono text-xs ${calc.rounded.delta101 > deltaRaw ? 'text-red-400' : 'text-green-400'}`}>
                  ({calc.rounded.delta101 > deltaRaw ? '+' : ''}{fmt(calc.rounded.delta101 - deltaRaw)})
                </span>
              )}
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 2 — LIVE PRICE PREVIEW
        ════════════════════════════════════════════════════════════════ */}
        <section ref={previewRef}>
          <div className="flex items-center gap-2 mb-1">
            <span className="price-mono text-[10px] font-bold text-blue-400 uppercase tracking-widest">
              Section 2
            </span>
          </div>
          <h2 className="price-mono text-white text-xl font-bold mb-1">Live Price Preview</h2>
          <p className="font-body text-slate-400 text-sm mb-5">
            Updates in real-time as you type. Multipliers: Gamma ×1.25 · Alpha &amp; Beta ×1.50 of Delta (×1.20 of Gamma).
          </p>

          {deltaRaw > 0 && calc ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {ROOM_CONFIG.map((room) => (
                <PriceCard
                  key={room.key}
                  room={room}
                  rounded={calc.rounded[room.key]}
                  raw={calc.raw[room.key]}
                  prevPrice={prices[room.key] ?? null}
                  seasonalMult={activeSeasonalMultiplier}
                  seasonalLabel={seasonalLabel}
                />
              ))}
            </div>
          ) : (
            <div className="bg-[#111827] rounded-2xl border border-slate-700 p-10 text-center">
              <p className="price-mono text-slate-500 text-sm">Enter a Delta price above to see the preview.</p>
            </div>
          )}
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 3 — APPLY & HISTORY
        ════════════════════════════════════════════════════════════════ */}
        <section className="space-y-5">
          <div>
            <span className="price-mono text-[10px] font-bold text-blue-400 uppercase tracking-widest">Section 3</span>
            <h2 className="price-mono text-white text-xl font-bold mt-0.5">Apply & History</h2>
          </div>

          {/* Apply button */}
          <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
            <button
              disabled={!calc}
              onClick={() => setShowConfirm(true)}
              className="w-full flex items-center justify-center gap-2.5 py-4 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white price-mono font-bold text-base rounded-xl transition-colors shadow-lg shadow-green-900/40"
            >
              <Check className="w-5 h-5" />
              Apply All Prices to Live Website
            </button>
            <p className="font-body text-slate-500 text-xs text-center mt-2">
              Prices will be updated immediately — guests will see the new prices right away.
            </p>

            {/* Success message */}
            {successAt && (
              <div className="mt-4 flex items-start gap-3 bg-green-900/30 border border-green-700 rounded-xl px-4 py-3">
                <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="price-mono text-green-300 text-sm font-semibold">
                    ✓ Prices updated on {fmtDate(successAt)}
                  </p>
                  {nextReviewAt && (
                    <p className="font-body text-green-500 text-xs mt-0.5">
                      Next review recommended: {fmtDate(nextReviewAt)}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Review countdown */}
            {daysRemaining !== null && (
              <div className="mt-4 flex items-center gap-3 bg-[#0b1120] rounded-xl px-4 py-3 border border-slate-700">
                <Calendar className="w-4 h-4 text-slate-500 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="font-body text-slate-400 text-xs">Next price review in</span>
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

          {/* Price History Table */}
          <div className="bg-[#111827] rounded-2xl border border-slate-700 overflow-hidden">
            <button
              onClick={() => setHistoryOpen((o) => !o)}
              className="w-full flex items-center gap-3 px-6 py-4 hover:bg-slate-800/50 transition-colors text-left"
            >
              <History className="w-4 h-4 text-slate-400" />
              <span className="price-mono text-white font-semibold text-sm flex-1">
                Price History
                {history.length > 0 && (
                  <span className="ml-2 price-mono text-[11px] text-slate-500">({history.length} entries)</span>
                )}
              </span>
              {historyOpen ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>

            {historyOpen && (
              history.length === 0 ? (
                <div className="px-6 py-8 text-center border-t border-slate-800">
                  <p className="price-mono text-slate-600 text-sm">No price history yet.</p>
                </div>
              ) : (
                <div className="border-t border-slate-800 overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="bg-[#0b1120]">
                        {['Date', 'Delta 101', 'Gamma 201', 'Alpha 202', 'Beta 301', 'Notes', ''].map((h) => (
                          <th key={h} className="price-mono text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-semibold whitespace-nowrap">
                            {h}
                          </th>
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
                          <td className="px-4 py-3 font-body text-xs text-slate-500 min-w-[100px]">
                            {entry.notes || <span className="text-slate-700">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRestorePrices(entry)}
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
        </section>

        {/* ════════════════════════════════════════════════════════════════
            SECTION 4 — SEASONAL OVERRIDE
        ════════════════════════════════════════════════════════════════ */}
        <section className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="price-mono text-[10px] font-bold text-blue-400 uppercase tracking-widest">Section 4</span>
          </div>
          <h2 className="price-mono text-white text-xl font-bold mb-1">Seasonal Override</h2>
          <p className="font-body text-slate-400 text-sm mb-5">
            Temporary multiplier on top of the base price. Visible to guests immediately — does not overwrite history.
          </p>

          <div className="flex flex-wrap gap-2 mb-4">
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

          {/* Custom multiplier input */}
          {seasonalType === 'custom' && (
            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-2 bg-[#0b1120] border border-slate-600 rounded-xl px-3 py-2.5 flex-1">
                <span className="price-mono text-slate-500 text-sm">×</span>
                <input
                  type="number"
                  min="0.1"
                  max="10"
                  step="0.05"
                  value={customMultStr}
                  onChange={(e) => setCustomMultStr(e.target.value)}
                  className="price-mono bg-transparent text-white text-sm outline-none flex-1 min-w-0"
                  placeholder="1.0"
                />
              </div>
              <button
                onClick={handleCustomMultApply}
                className="price-mono text-sm font-semibold px-4 py-2.5 bg-purple-700 hover:bg-purple-600 text-white rounded-xl transition-colors"
              >
                Apply
              </button>
            </div>
          )}

          {/* Active indicator */}
          {seasonalActive && (
            <div className="mt-4 flex items-center justify-between gap-3 bg-amber-900/30 border border-amber-700 rounded-xl px-4 py-3">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                <span className="price-mono text-amber-300 text-sm font-semibold">
                  Active: {seasonalLabel} (×{activeSeasonalMultiplier})
                </span>
              </div>
              <button
                onClick={removeSeasonalMultiplier}
                className="price-mono text-xs text-amber-400 hover:text-amber-200 bg-amber-900/40 hover:bg-amber-900/70 px-3 py-1.5 rounded-lg transition-colors"
              >
                Remove
              </button>
            </div>
          )}
        </section>

        {/* Footer spacer */}
        <div className="h-8" />
      </div>

      {/* ── Confirm dialog ─────────────────────────────────────────────────── */}
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
