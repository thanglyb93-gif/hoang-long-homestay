'use client';

import { useState } from 'react';
import {
  BedDouble, DollarSign, ListChecks, CalendarOff,
  Plus, Trash2, RotateCcw, Check, X, ChevronDown, ChevronUp,
  Pencil, Save,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { rooms } from '@/lib/rooms';
import type { Amenity } from '@/lib/rooms';

const ALL_AMENITIES: Amenity[] = [
  'AC', 'Hot water', 'WiFi',
  'Hair dryer', 'Iron', 'Kettle', 'Microwave', 'TV',
  'Desk', 'Chair', 'Private bathroom',
  'Non-smoking', 'Self check-in', 'Washing machine',
];

const AMENITY_ICON: Record<Amenity, string> = {
  'AC': '❄️',
  'Hot water': '🚿',
  'WiFi': '📶',
  'Hair dryer': '💨',
  'Iron': '👔',
  'Kettle': '☕',
  'Microwave': '📦',
  'TV': '📺',
  'Desk': '🖊️',
  'Chair': '🪑',
  'Private bathroom': '🚽',
  'Non-smoking': '🚭',
  'Self check-in': '🔑',
  'Washing machine': '🫧',
};

const TYPE_BADGE: Record<string, string> = {
  'Standard Double': 'bg-slate-100 text-slate-600',
  'Superior Double': 'bg-blue-100 text-blue-700',
  'Deluxe Double':   'bg-amber-100 text-amber-700',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

type Section = 'price' | 'amenities' | 'blocks';

export default function AdminRoomsPage() {
  const { getRoomOverride, setRoomPrice, setRoomAmenities, addManualBlock, removeManualBlock } = useAdminStore();

  // Which room card is expanded, and which section within it
  const [expandedRoom, setExpandedRoom] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<Section>('price');

  // Price editing state
  const [editingPrice, setEditingPrice] = useState<Record<string, string>>({});
  const [priceDirty, setPriceDirty]     = useState<Record<string, boolean>>({});

  // Block form state per room
  const [blockForm, setBlockForm] = useState<Record<string, { start: string; end: string; note: string }>>({});

  function getBlock(roomId: string) {
    return blockForm[roomId] ?? { start: '', end: '', note: '' };
  }
  function setBlock(roomId: string, patch: Partial<{ start: string; end: string; note: string }>) {
    setBlockForm((prev) => ({ ...prev, [roomId]: { ...getBlock(roomId), ...patch } }));
  }

  function toggleRoom(roomId: string) {
    if (expandedRoom === roomId) {
      setExpandedRoom(null);
    } else {
      setExpandedRoom(roomId);
      setActiveSection('price');
    }
  }

  function handleSavePrice(roomId: string, defaultPrice: number) {
    const raw = editingPrice[roomId];
    if (raw === undefined) return;
    const parsed = parseInt(raw.replace(/\D/g, ''), 10);
    if (!isNaN(parsed) && parsed > 0) {
      setRoomPrice(roomId, parsed);
    }
    setPriceDirty((p) => ({ ...p, [roomId]: false }));
  }

  function handleResetPrice(roomId: string) {
    setRoomPrice(roomId, null);
    setEditingPrice((p) => ({ ...p, [roomId]: '' }));
    setPriceDirty((p) => ({ ...p, [roomId]: false }));
  }

  function handleAmenityToggle(roomId: string, amenity: Amenity, currentList: string[]) {
    const next = currentList.includes(amenity)
      ? currentList.filter((a) => a !== amenity)
      : [...currentList, amenity];
    setRoomAmenities(roomId, next);
  }

  function handleResetAmenities(roomId: string) {
    setRoomAmenities(roomId, null);
  }

  function handleAddBlock(roomId: string) {
    const { start, end, note } = getBlock(roomId);
    if (!start || !end || start >= end) return;
    addManualBlock(roomId, { start, end, note });
    setBlock(roomId, { start: '', end: '', note: '' });
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-forest-900">Room Management</h1>
        <p className="font-body text-sm text-forest-500 mt-1">
          Override pricing, amenities, and availability for each room.
        </p>
      </div>

      <div className="space-y-4">
        {rooms.map((room) => {
          const override     = getRoomOverride(room.id);
          const isOpen       = expandedRoom === room.id;
          const effectivePx  = override.pricePerNight ?? room.pricePerNight;
          const priceChanged = override.pricePerNight !== null && override.pricePerNight !== room.pricePerNight;
          const effectiveAm  = override.amenities ?? [...room.amenities];
          const amenitiesChanged = override.amenities !== null;
          const blockCount   = override.manualBlocks.length;

          // Initialise editing price from current override or default
          const editVal = editingPrice[room.id] ?? (override.pricePerNight?.toString() ?? room.pricePerNight.toString());

          return (
            <div key={room.id} className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
              {/* Room header */}
              <button
                type="button"
                onClick={() => toggleRoom(room.id)}
                className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-cream-50 transition-colors"
              >
                <div className="w-12 h-12 rounded-xl bg-forest-900 flex items-center justify-center flex-shrink-0">
                  <span className="font-mono text-sm font-bold text-sky-300">{room.roomNumber}</span>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body text-sm font-semibold text-forest-900">
                      Room {room.roomNumber} · {room.nameEn}
                    </p>
                    <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${TYPE_BADGE[room.type]}`}>
                      {room.type}
                    </span>
                    {priceChanged && (
                      <span className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">
                        Price overridden
                      </span>
                    )}
                    {amenitiesChanged && (
                      <span className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">
                        Amenities modified
                      </span>
                    )}
                    {blockCount > 0 && (
                      <span className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-600">
                        {blockCount} block{blockCount !== 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <p className="font-body text-xs text-forest-400 mt-0.5">
                    {room.sizeSqm} m² · {room.bed} · {room.maxGuests} guests max
                  </p>
                </div>

                <div className="text-right flex-shrink-0 flex items-center gap-3">
                  <div>
                    <p className="font-heading text-lg font-semibold text-forest-900">
                      {effectivePx.toLocaleString()}đ
                    </p>
                    {priceChanged && (
                      <p className="font-body text-[10px] text-forest-400 line-through">
                        {room.pricePerNight.toLocaleString()}đ
                      </p>
                    )}
                  </div>
                  {isOpen ? <ChevronUp className="w-4 h-4 text-forest-400" /> : <ChevronDown className="w-4 h-4 text-forest-400" />}
                </div>
              </button>

              {/* Expanded panel */}
              {isOpen && (
                <div className="border-t border-cream-200">
                  {/* Section tabs */}
                  <div className="flex border-b border-cream-200 bg-cream-50/50">
                    {([
                      { key: 'price',     label: 'Pricing',     icon: DollarSign  },
                      { key: 'amenities', label: 'Amenities',   icon: ListChecks  },
                      { key: 'blocks',    label: 'Availability', icon: CalendarOff },
                    ] as { key: Section; label: string; icon: React.ElementType }[]).map(({ key, label, icon: Icon }) => (
                      <button
                        key={key}
                        onClick={() => setActiveSection(key)}
                        className={`flex items-center gap-1.5 px-4 py-3 font-body text-xs font-medium border-b-2 transition-colors ${
                          activeSection === key
                            ? 'border-blue-600 text-blue-600 bg-white'
                            : 'border-transparent text-forest-500 hover:text-forest-700'
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" />
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* ── PRICING ─────────────────────────────────────────────── */}
                  {activeSection === 'price' && (
                    <div className="px-5 py-5 space-y-4">
                      <p className="font-body text-xs text-forest-500">
                        Set a custom base price per night. This overrides the default price but seasonal rules and long-stay discounts still apply on top.
                      </p>

                      <div className="flex items-end gap-3">
                        <div className="flex-1">
                          <label className="font-body text-xs font-semibold text-forest-500 block mb-1.5">
                            Price per night (VND)
                          </label>
                          <div className="relative">
                            <input
                              type="text"
                              inputMode="numeric"
                              value={priceDirty[room.id] ? editingPrice[room.id] ?? '' : editVal}
                              onChange={(e) => {
                                setEditingPrice((p) => ({ ...p, [room.id]: e.target.value }));
                                setPriceDirty((p) => ({ ...p, [room.id]: true }));
                              }}
                              placeholder={room.pricePerNight.toString()}
                              className="w-full font-body text-sm text-forest-900 border border-cream-300 rounded-xl px-4 py-2.5 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                            />
                          </div>
                          <p className="font-body text-[11px] text-forest-400 mt-1">
                            Default: {room.pricePerNight.toLocaleString()}đ
                          </p>
                        </div>

                        <button
                          onClick={() => handleSavePrice(room.id, room.pricePerNight)}
                          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-body text-sm font-semibold rounded-xl transition-colors"
                        >
                          <Save className="w-4 h-4" /> Save
                        </button>

                        {priceChanged && (
                          <button
                            onClick={() => handleResetPrice(room.id)}
                            className="flex items-center gap-1.5 px-4 py-2.5 bg-white border border-cream-300 text-forest-600 hover:bg-cream-100 font-body text-sm font-medium rounded-xl transition-colors"
                          >
                            <RotateCcw className="w-4 h-4" /> Reset
                          </button>
                        )}
                      </div>

                      {/* Effective price preview */}
                      <div className="rounded-xl bg-cream-50 border border-cream-200 px-4 py-3 flex items-center justify-between">
                        <span className="font-body text-xs text-forest-500">Effective price (base, excl. seasonal)</span>
                        <span className="font-heading text-base font-semibold text-forest-900">
                          {effectivePx.toLocaleString()}đ / night
                        </span>
                      </div>
                    </div>
                  )}

                  {/* ── AMENITIES ────────────────────────────────────────────── */}
                  {activeSection === 'amenities' && (
                    <div className="px-5 py-5 space-y-4">
                      <div className="flex items-center justify-between">
                        <p className="font-body text-xs text-forest-500">
                          Toggle which amenities are available in this room. Unchecking removes it from the room listing.
                        </p>
                        {amenitiesChanged && (
                          <button
                            onClick={() => handleResetAmenities(room.id)}
                            className="flex items-center gap-1 font-body text-xs text-forest-500 hover:text-forest-700 transition-colors flex-shrink-0 ml-4"
                          >
                            <RotateCcw className="w-3.5 h-3.5" /> Reset to default
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {ALL_AMENITIES.map((amenity) => {
                          const active = effectiveAm.includes(amenity);
                          return (
                            <button
                              key={amenity}
                              type="button"
                              onClick={() => handleAmenityToggle(room.id, amenity, effectiveAm)}
                              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-left transition-colors ${
                                active
                                  ? 'bg-green-50 border-green-300 text-green-800'
                                  : 'bg-slate-50 border-slate-200 text-slate-400'
                              }`}
                            >
                              <span className="text-base leading-none">{AMENITY_ICON[amenity]}</span>
                              <span className="font-body text-xs font-medium flex-1">{amenity}</span>
                              {active
                                ? <Check className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                                : <X className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                              }
                            </button>
                          );
                        })}
                      </div>

                      <p className="font-body text-[11px] text-forest-400">
                        {effectiveAm.length} of {ALL_AMENITIES.length} amenities active
                      </p>
                    </div>
                  )}

                  {/* ── AVAILABILITY BLOCKS ──────────────────────────────────── */}
                  {activeSection === 'blocks' && (
                    <div className="px-5 py-5 space-y-5">
                      <p className="font-body text-xs text-forest-500">
                        Manually block dates so guests cannot book this room (e.g. maintenance, personal use). Booking.com / Airbnb blocks should be imported via Channel Sync instead.
                      </p>

                      {/* Add block form */}
                      <div className="rounded-xl bg-cream-50 border border-cream-200 p-4 space-y-3">
                        <p className="font-body text-xs font-semibold text-forest-600">Add new block</p>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          <div>
                            <label className="font-body text-[11px] text-forest-500 block mb-1">From</label>
                            <input
                              type="date"
                              value={getBlock(room.id).start}
                              onChange={(e) => setBlock(room.id, { start: e.target.value })}
                              className="w-full font-body text-sm border border-cream-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="font-body text-[11px] text-forest-500 block mb-1">To (exclusive)</label>
                            <input
                              type="date"
                              value={getBlock(room.id).end}
                              min={getBlock(room.id).start || undefined}
                              onChange={(e) => setBlock(room.id, { end: e.target.value })}
                              className="w-full font-body text-sm border border-cream-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                            />
                          </div>
                          <div>
                            <label className="font-body text-[11px] text-forest-500 block mb-1">Note (optional)</label>
                            <input
                              type="text"
                              value={getBlock(room.id).note}
                              onChange={(e) => setBlock(room.id, { note: e.target.value })}
                              placeholder="e.g. Maintenance"
                              className="w-full font-body text-sm border border-cream-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => handleAddBlock(room.id)}
                          disabled={!getBlock(room.id).start || !getBlock(room.id).end || getBlock(room.id).start >= getBlock(room.id).end}
                          className="flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:opacity-40 disabled:cursor-not-allowed text-white font-body text-sm font-semibold rounded-xl transition-colors"
                        >
                          <Plus className="w-4 h-4" /> Add Block
                        </button>
                      </div>

                      {/* Existing blocks */}
                      {override.manualBlocks.length === 0 ? (
                        <div className="text-center py-6">
                          <CalendarOff className="w-8 h-8 text-forest-200 mx-auto mb-2" />
                          <p className="font-body text-sm text-forest-400">No manual blocks set.</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {override.manualBlocks.map((block) => (
                            <div
                              key={block.id}
                              className="flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-xl"
                            >
                              <CalendarOff className="w-4 h-4 text-red-400 flex-shrink-0" />
                              <div className="flex-1 min-w-0">
                                <p className="font-body text-sm font-medium text-red-800">
                                  {fmtDate(block.start)} → {fmtDate(block.end)}
                                </p>
                                {block.note && (
                                  <p className="font-body text-xs text-red-500 mt-0.5">{block.note}</p>
                                )}
                              </div>
                              <button
                                onClick={() => removeManualBlock(room.id, block.id)}
                                className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-100 transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
