'use client';

import { useState } from 'react';
import Image from 'next/image';
import {
  ChevronDown, ChevronUp, RotateCcw, Check, Power, PowerOff,
  BedDouble, Users, Maximize2, DollarSign, Pencil,
} from 'lucide-react';
import { useRoomStore, useAllRooms } from '@/lib/room-store';
import { useImageStore } from '@/lib/image-store';
import { usePricingStore, ROOM_PRICE_KEY } from '@/lib/pricing-store';
import { roundToNearestHundredThousand } from '@/lib/utils/round-price';
import type { Room, RoomType, Amenity } from '@/lib/rooms';

// ── Config ────────────────────────────────────────────────────────────────────

const ROOM_TYPES: RoomType[] = ['Standard Double', 'Superior Double', 'Deluxe Double'];

const ROOM_GRADIENTS: Record<string, string> = {
  'green-mountain': 'from-blue-900 to-slate-900',
  'ban-flower':     'from-sky-200 to-indigo-100',
  'family-room':    'from-blue-600 to-blue-900',
  'deluxe':         'from-blue-400 to-indigo-700',
};
const DEFAULT_GRADIENT = 'from-slate-700 to-slate-900';

const ALL_AMENITIES: Amenity[] = [
  'AC', 'Hot water', 'WiFi', 'Hair dryer', 'Iron', 'Kettle',
  'Microwave', 'TV', 'Desk', 'Chair', 'Private bathroom',
  'Non-smoking', 'Self check-in', 'Washing machine',
];

function fmt(n: number) { return n.toLocaleString('en-US'); }

// ── Field helpers ─────────────────────────────────────────────────────────────

function Label({ children }: { children: React.ReactNode }) {
  return (
    <label className="block price-mono text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1.5">
      {children}
    </label>
  );
}

function TextInput({ value, onChange, placeholder, mono = false }: {
  value: string; onChange: (v: string) => void;
  placeholder?: string; mono?: boolean;
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full text-sm bg-[#0b1120] border border-slate-600 focus:border-blue-500 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-700 outline-none transition-colors ${mono ? 'price-mono' : 'font-body'}`}
    />
  );
}

function NumberInput({ value, onChange, min, max, label }: {
  value: number; onChange: (v: number) => void;
  min?: number; max?: number; label?: string;
}) {
  return (
    <div className="flex items-center gap-2 bg-[#0b1120] border border-slate-600 rounded-xl px-3 py-2.5">
      <input
        type="number"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="price-mono text-sm bg-transparent text-white outline-none flex-1 w-full"
      />
      {label && <span className="price-mono text-xs text-slate-600 flex-shrink-0">{label}</span>}
    </div>
  );
}

// ── Room editor card ──────────────────────────────────────────────────────────

function RoomEditor({ room }: { room: Room }) {
  const { overrides, updateRoom, resetRoom, activateRoom, deactivateRoom } = useRoomStore();
  const { images }   = useImageStore();
  const { prices, activeSeasonalMultiplier } = usePricingStore();

  const override  = overrides[room.id] ?? {};
  const heroImg   = (images[room.id] ?? [])[0] ?? null;
  const isActive  = room.isPlaceholder ? (override.isActive === true) : (override.isActive !== false);
  const [open, setOpen] = useState(false);
  const [saved, setSaved] = useState(false);

  // Live price from pricing store (formula-based)
  const priceKey   = ROOM_PRICE_KEY[room.id];
  const formulaPrice = priceKey ? prices[priceKey] : room.pricePerNight;
  const customPrice  = override.customPrice ?? 0;
  const displayPrice = customPrice > 0 ? customPrice : formulaPrice;

  // Local editable state (applied to override on "Save")
  const [local, setLocal] = useState({
    nameVi:      override.nameVi      ?? room.nameVi,
    nameEn:      override.nameEn      ?? room.nameEn,
    roomNumber:  override.roomNumber  ?? room.roomNumber,
    type:        override.type        ?? room.type,
    maxGuests:   override.maxGuests   ?? room.maxGuests,
    sizeSqm:     override.sizeSqm     ?? room.sizeSqm,
    bed:         override.bed         ?? room.bed,
    description: override.description ?? room.description,
    customPrice: String(customPrice > 0 ? customPrice : ''),
    amenities:   override.amenities   ?? room.amenities,
  });

  function handleSave() {
    updateRoom(room.id, {
      nameVi:      local.nameVi,
      nameEn:      local.nameEn,
      roomNumber:  local.roomNumber,
      type:        local.type,
      maxGuests:   local.maxGuests,
      sizeSqm:     local.sizeSqm,
      bed:         local.bed,
      description: local.description,
      customPrice: local.customPrice ? Number(local.customPrice.replace(/\D/g, '')) : 0,
      amenities:   local.amenities,
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  function handleReset() {
    if (!confirm(`Reset "${room.nameEn}" to defaults?`)) return;
    resetRoom(room.id);
    setLocal({
      nameVi:      room.nameVi,
      nameEn:      room.nameEn,
      roomNumber:  room.roomNumber,
      type:        room.type,
      maxGuests:   room.maxGuests,
      sizeSqm:     room.sizeSqm,
      bed:         room.bed,
      description: room.description,
      customPrice: '',
      amenities:   room.amenities,
    });
  }

  function toggleAmenity(a: Amenity) {
    setLocal((l) => ({
      ...l,
      amenities: l.amenities.includes(a)
        ? l.amenities.filter((x) => x !== a)
        : [...l.amenities, a],
    }));
  }

  const gradient = ROOM_GRADIENTS[room.id] ?? DEFAULT_GRADIENT;

  return (
    <div className={`bg-[#111827] rounded-2xl border overflow-hidden ${
      isActive ? 'border-slate-700' : 'border-slate-800 opacity-70'
    }`}>
      {/* Header */}
      <div className={`relative h-20 bg-gradient-to-br ${gradient} overflow-hidden`}>
        {heroImg && (
          <Image src={heroImg} alt={room.nameEn} fill className="object-cover opacity-50" sizes="400px" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 p-4 flex items-end justify-between">
          <div>
            <p className="price-mono text-white/50 text-[10px] font-semibold tracking-widest uppercase">
              Room {local.roomNumber} {room.isPlaceholder ? '· Placeholder' : ''}
            </p>
            <h3 className="price-mono text-white text-lg font-bold">{local.nameEn || room.nameEn}</h3>
          </div>
          <div className="flex items-center gap-2">
            {/* Active toggle */}
            <button
              onClick={() => isActive ? deactivateRoom(room.id) : activateRoom(room.id)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-full transition-colors ${
                isActive
                  ? 'bg-green-500/20 text-green-300 border border-green-500/40 hover:bg-red-900/30 hover:text-red-300 hover:border-red-500/40'
                  : 'bg-slate-700/50 text-slate-400 border border-slate-600 hover:bg-green-900/30 hover:text-green-300 hover:border-green-500/40'
              }`}
              title={isActive ? 'Click to deactivate (hide from public site)' : 'Click to activate (show on public site)'}
            >
              {isActive
                ? <><Power className="w-3 h-3" /> Active</>
                : <><PowerOff className="w-3 h-3" /> Inactive</>}
            </button>
            {/* Expand toggle */}
            <button
              onClick={() => setOpen((o) => !o)}
              className="w-7 h-7 rounded-full bg-black/30 hover:bg-black/50 flex items-center justify-center text-white transition-colors"
            >
              {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Summary strip */}
      <div className="px-4 py-2.5 flex items-center gap-4 border-b border-slate-800 bg-[#0d1526]">
        <div className="flex items-center gap-1.5">
          <Maximize2 className="w-3 h-3 text-slate-500" />
          <span className="price-mono text-xs text-slate-400">{local.sizeSqm}m²</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Users className="w-3 h-3 text-slate-500" />
          <span className="price-mono text-xs text-slate-400">max {local.maxGuests}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <BedDouble className="w-3 h-3 text-slate-500" />
          <span className="price-mono text-xs text-slate-400">{local.type}</span>
        </div>
        <div className="flex items-center gap-1.5 ml-auto">
          <DollarSign className="w-3 h-3 text-slate-500" />
          <span className="price-mono text-xs text-white font-bold">{fmt(displayPrice)}₫</span>
          {customPrice > 0 && (
            <span className="price-mono text-[9px] text-amber-400 bg-amber-900/30 px-1.5 py-0.5 rounded-full">custom</span>
          )}
        </div>
      </div>

      {/* Expandable editor */}
      {open && (
        <div className="p-5 space-y-5">
          {/* Names + room number */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <Label>Display Name (VI)</Label>
              <TextInput value={local.nameVi} onChange={(v) => setLocal((l) => ({ ...l, nameVi: v }))} placeholder="Tên phòng" />
            </div>
            <div>
              <Label>Display Name (EN)</Label>
              <TextInput value={local.nameEn} onChange={(v) => setLocal((l) => ({ ...l, nameEn: v }))} placeholder="Room name" />
            </div>
            <div>
              <Label>Room Number</Label>
              <TextInput value={local.roomNumber} onChange={(v) => setLocal((l) => ({ ...l, roomNumber: v }))} placeholder="101" mono />
            </div>
          </div>

          {/* Type + size + guests + bed */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <Label>Type</Label>
              <select
                value={local.type}
                onChange={(e) => setLocal((l) => ({ ...l, type: e.target.value as RoomType }))}
                className="w-full font-body text-sm bg-[#0b1120] border border-slate-600 focus:border-blue-500 rounded-xl px-3 py-2.5 text-white outline-none transition-colors"
              >
                {ROOM_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>Size (m²)</Label>
              <NumberInput value={local.sizeSqm} onChange={(v) => setLocal((l) => ({ ...l, sizeSqm: v }))} min={10} max={200} label="m²" />
            </div>
            <div>
              <Label>Max Guests</Label>
              <NumberInput value={local.maxGuests} onChange={(v) => setLocal((l) => ({ ...l, maxGuests: v }))} min={1} max={10} />
            </div>
            <div>
              <Label>Bed</Label>
              <TextInput value={local.bed} onChange={(v) => setLocal((l) => ({ ...l, bed: v }))} placeholder="1 Queen bed" />
            </div>
          </div>

          {/* Custom price */}
          <div>
            <Label>Custom Price / Night (VND)</Label>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 bg-[#0b1120] border border-slate-600 focus-within:border-blue-500 rounded-xl px-3 py-2.5 flex-1">
                <span className="price-mono text-slate-600 text-sm">₫</span>
                <input
                  type="text"
                  inputMode="numeric"
                  value={local.customPrice}
                  onChange={(e) => setLocal((l) => ({ ...l, customPrice: e.target.value.replace(/\D/g, '') }))}
                  placeholder="Leave blank to use pricing formula"
                  className="price-mono text-sm bg-transparent text-white outline-none flex-1"
                />
              </div>
              {local.customPrice && (
                <button
                  onClick={() => setLocal((l) => ({ ...l, customPrice: '' }))}
                  className="font-body text-xs text-slate-500 hover:text-slate-300 transition-colors whitespace-nowrap"
                >
                  Use formula
                </button>
              )}
            </div>
            <p className="font-body text-[11px] text-slate-600 mt-1">
              Formula price: {fmt(formulaPrice)}₫
              {activeSeasonalMultiplier !== 1.0 && ` (×${activeSeasonalMultiplier} seasonal)`}
            </p>
          </div>

          {/* Description */}
          <div>
            <Label>Description</Label>
            <textarea
              value={local.description}
              onChange={(e) => setLocal((l) => ({ ...l, description: e.target.value }))}
              rows={4}
              placeholder="Room description shown to guests…"
              className="w-full font-body text-sm bg-[#0b1120] border border-slate-600 focus:border-blue-500 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-700 outline-none transition-colors resize-none leading-relaxed"
            />
          </div>

          {/* Amenities */}
          <div>
            <Label>Amenities ({local.amenities.length} selected)</Label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
              {ALL_AMENITIES.map((a) => {
                const checked = local.amenities.includes(a);
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-left text-xs transition-all ${
                      checked
                        ? 'bg-blue-900/40 border-blue-600/60 text-blue-200'
                        : 'bg-[#0b1120] border-slate-700 text-slate-500 hover:border-slate-500'
                    }`}
                  >
                    <span className={`w-3 h-3 rounded border flex-shrink-0 flex items-center justify-center ${
                      checked ? 'bg-blue-500 border-blue-500' : 'border-slate-600'
                    }`}>
                      {checked && <Check className="w-2 h-2 text-white" />}
                    </span>
                    <span className="font-body truncate">{a}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-3 pt-2 border-t border-slate-800">
            <button
              onClick={handleSave}
              className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-500 text-white price-mono font-bold text-sm rounded-xl transition-colors"
            >
              {saved ? <><Check className="w-3.5 h-3.5" /> Saved!</> : <><Pencil className="w-3.5 h-3.5" /> Save Changes</>}
            </button>
            <button
              onClick={handleReset}
              className="flex items-center gap-1.5 font-body text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset to defaults
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function RoomInfoPanel() {
  const allRooms = useAllRooms();
  const active      = allRooms.filter((r) => !r.isPlaceholder);
  const placeholder = allRooms.filter((r) =>  r.isPlaceholder);

  return (
    <div className="space-y-8">

      {/* Info banner */}
      <div className="bg-blue-900/20 border border-blue-700/40 rounded-2xl px-5 py-4 space-y-1">
        <p className="price-mono text-blue-300 text-sm font-bold">Room Information Manager</p>
        <p className="font-body text-slate-400 text-sm">
          Edit names, descriptions, amenities, room numbers, and custom prices for each room.
          Toggle "Active" to show or hide a room on the public website.
          Changes take effect immediately for guests.
        </p>
      </div>

      {/* Active rooms */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Power className="w-4 h-4 text-green-400" />
          <h2 className="price-mono text-white font-bold text-sm">Active Rooms ({active.length})</h2>
        </div>
        <div className="space-y-3">
          {active.map((room) => <RoomEditor key={room.id} room={room} />)}
        </div>
      </div>

      {/* Placeholder rooms */}
      <div>
        <div className="flex items-center gap-2 mb-2">
          <PowerOff className="w-4 h-4 text-slate-500" />
          <h2 className="price-mono text-slate-400 font-bold text-sm">Placeholder Rooms ({placeholder.length}) — Coming Soon</h2>
        </div>
        <p className="font-body text-slate-600 text-xs mb-4">
          These rooms are hidden from guests. Toggle "Active" on any room to make it live when ready.
        </p>
        <div className="space-y-3">
          {placeholder.map((room) => <RoomEditor key={room.id} room={room} />)}
        </div>
      </div>
    </div>
  );
}
