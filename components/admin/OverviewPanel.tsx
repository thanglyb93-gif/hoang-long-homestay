'use client';

import { useMemo } from 'react';
import { Calendar, CheckCircle2, Clock, XCircle, DollarSign, BedDouble, TrendingUp } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { usePricingStore, ROOM_PRICE_KEY } from '@/lib/pricing-store';
import { useImageStore } from '@/lib/image-store';
import { useAllRooms, useRoomStore } from '@/lib/room-store';

function fmt(n: number) { return n.toLocaleString('en-US'); }
function fmtShort(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function daysAgo(iso: string) {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

const STATUS_STYLES = {
  pending:   { bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'border-amber-700/50', icon: Clock },
  confirmed: { bg: 'bg-green-900/40', text: 'text-green-300', border: 'border-green-700/50', icon: CheckCircle2 },
  cancelled: { bg: 'bg-red-900/40',   text: 'text-red-300',   border: 'border-red-700/50',   icon: XCircle },
};

export default function OverviewPanel() {
  const { bookings, overrides }              = useAdminStore();
  const { prices, lastUpdated, activeSeasonalMultiplier, seasonalLabel } = usePricingStore();
  const { images }                           = useImageStore();
  const { overrides: roomOverrides }         = useRoomStore();
  const allRooms                             = useAllRooms();

  const today = new Date().toISOString().slice(0, 10);

  // Split into visible (active) and placeholder (not yet activated)
  const visibleRooms = allRooms.filter((r) => {
    const o = roomOverrides[r.id];
    if (r.isPlaceholder) return o?.isActive === true;
    return o?.isActive !== false;
  });

  const placeholderRooms = allRooms.filter((r) => {
    const o = roomOverrides[r.id];
    if (!r.isPlaceholder) return false;
    return o?.isActive !== true;
  });

  const stats = useMemo(() => ({
    total:          bookings.length,
    pending:        bookings.filter((b) => b.status === 'pending').length,
    confirmed:      bookings.filter((b) => b.status === 'confirmed').length,
    todayCheckIns:  bookings.filter((b) => b.checkIn  === today && b.status === 'confirmed').length,
  }), [bookings, today]);

  function isOccupiedToday(roomId: string) {
    const hasBooking = bookings.some(
      (b) => b.roomId === roomId && b.status === 'confirmed' &&
             b.checkIn <= today && b.checkOut > today
    );
    if (hasBooking) return 'booked';
    const override = overrides.find((o) => o.roomId === roomId);
    const hasBlock = override?.manualBlocks.some((bl) => bl.start <= today && bl.end > today);
    if (hasBlock) return 'blocked';
    return 'available';
  }

  const recentBookings = bookings.slice(0, 6);

  return (
    <div className="space-y-8">

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Bookings',  value: stats.total,        icon: Calendar,     color: 'text-blue-400',  bg: 'bg-blue-900/30' },
          { label: 'Pending',         value: stats.pending,      icon: Clock,        color: 'text-amber-400', bg: 'bg-amber-900/30' },
          { label: 'Confirmed',       value: stats.confirmed,    icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-900/30' },
          { label: 'Today Check-ins', value: stats.todayCheckIns,icon: BedDouble,    color: 'text-sky-400',   bg: 'bg-sky-900/30' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-[#111827] rounded-2xl border border-slate-700 p-5">
            <div className="flex items-center justify-between mb-3">
              <span className="font-body text-xs text-slate-400 font-medium">{label}</span>
              <div className={`w-8 h-8 rounded-lg ${bg} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${color}`} />
              </div>
            </div>
            <p className="price-mono text-3xl font-bold text-white">{value}</p>
          </div>
        ))}
      </div>

      {/* Room status + Current prices */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Room status today */}
        <div className="bg-[#111827] rounded-2xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <BedDouble className="w-4 h-4 text-blue-400" />
            <h3 className="price-mono text-white font-semibold text-sm">Room Status — Today</h3>
          </div>
          <div className="space-y-1.5 max-h-96 overflow-y-auto pr-1">
            {/* Active rooms */}
            {visibleRooms.map((room) => {
              const status   = isOccupiedToday(room.id);
              const imgCount = (images[room.id] ?? []).length;
              return (
                <div key={room.id} className="flex items-center justify-between py-2.5 border-b border-slate-800 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                      status === 'available' ? 'bg-green-400' :
                      status === 'booked'    ? 'bg-blue-400'  : 'bg-amber-400'
                    }`} />
                    <div>
                      <p className="price-mono text-white text-sm font-semibold">{room.nameEn} · {room.roomNumber}</p>
                      <p className="font-body text-slate-500 text-xs">{imgCount} photo{imgCount !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                  <span className={`font-body text-xs font-semibold px-2.5 py-1 rounded-full ${
                    status === 'available' ? 'bg-green-900/40 text-green-300' :
                    status === 'booked'    ? 'bg-blue-900/40 text-blue-300'  :
                                            'bg-amber-900/40 text-amber-300'
                  }`}>
                    {status === 'available' ? 'Available' : status === 'booked' ? 'Occupied' : 'Blocked'}
                  </span>
                </div>
              );
            })}
            {/* Placeholder rooms (not yet activated) */}
            {placeholderRooms.map((room) => (
              <div key={room.id} className="flex items-center justify-between py-2 border-b border-slate-800/50 last:border-0 opacity-50">
                <div className="flex items-center gap-3">
                  <div className="w-2.5 h-2.5 rounded-full flex-shrink-0 bg-slate-600" />
                  <p className="price-mono text-slate-500 text-xs">{room.nameEn} · {room.roomNumber}</p>
                </div>
                <span className="font-body text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700">
                  Placeholder
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Current prices */}
        <div className="bg-[#111827] rounded-2xl border border-slate-700 p-5">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-blue-400" />
              <h3 className="price-mono text-white font-semibold text-sm">Live Prices</h3>
            </div>
            {lastUpdated && (
              <span className={`font-body text-xs ${daysAgo(lastUpdated) > 45 ? 'text-amber-400' : 'text-slate-500'}`}>
                Updated {daysAgo(lastUpdated) === 0 ? 'today' : `${daysAgo(lastUpdated)}d ago`}
              </span>
            )}
          </div>

          {activeSeasonalMultiplier !== 1.0 && (
            <div className="mb-3 flex items-center gap-2 bg-amber-900/30 border border-amber-700/50 rounded-xl px-3 py-2">
              <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
              <span className="font-body text-xs text-amber-300 font-semibold">
                {seasonalLabel} (×{activeSeasonalMultiplier}) active
              </span>
            </div>
          )}

          <div className="space-y-2.5">
            {allRooms.map((room) => {
              const priceKey  = ROOM_PRICE_KEY[room.id];
              const basePrice = priceKey ? prices[priceKey] : 0;
              const seasonal  = activeSeasonalMultiplier !== 1.0
                ? Math.round(basePrice * activeSeasonalMultiplier / 100000) * 100000
                : null;
              const isActive  = visibleRooms.some((r) => r.id === room.id);
              return (
                <div key={room.id} className={`flex items-center justify-between ${!isActive ? 'opacity-40' : ''}`}>
                  <span className="price-mono text-slate-300 text-sm">
                    {room.nameEn} · {room.roomNumber}
                    {!isActive && <span className="text-slate-600 text-xs ml-1">(placeholder)</span>}
                  </span>
                  <div className="text-right">
                    {seasonal && (
                      <span className="price-mono text-xs text-slate-600 line-through mr-2">
                        {fmt(basePrice)}
                      </span>
                    )}
                    <span className={`price-mono text-sm font-bold ${seasonal ? 'text-amber-300' : 'text-white'}`}>
                      {fmt(seasonal ?? basePrice)}
                      <span className="text-slate-500 font-normal"> ₫</span>
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Recent bookings */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <Calendar className="w-4 h-4 text-blue-400" />
          <h3 className="price-mono text-white font-semibold text-sm flex-1">Recent Bookings</h3>
          {bookings.length > 0 && (
            <span className="font-body text-xs text-slate-500">{bookings.length} total</span>
          )}
        </div>

        {recentBookings.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="price-mono text-slate-600 text-sm">No bookings yet.</p>
            <p className="font-body text-slate-700 text-xs mt-1">Bookings appear here when guests submit requests.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0b1120]">
                  {['Ref', 'Guest', 'Room', 'Check-in', 'Check-out', 'Total', 'Status'].map((h) => (
                    <th key={h} className="price-mono text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {recentBookings.map((b) => {
                  const S    = STATUS_STYLES[b.status];
                  const Icon = S.icon;
                  return (
                    <tr key={b.ref} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-4 py-3 price-mono text-white text-xs font-bold">#{b.ref}</td>
                      <td className="px-4 py-3">
                        <p className="font-body text-sm text-white">{b.fullName}</p>
                        <p className="font-body text-xs text-slate-500">{b.phone}</p>
                      </td>
                      <td className="px-4 py-3 price-mono text-slate-300 text-xs whitespace-nowrap">{b.roomName}</td>
                      <td className="px-4 py-3 price-mono text-slate-300 text-xs whitespace-nowrap">{fmtShort(b.checkIn)}</td>
                      <td className="px-4 py-3 price-mono text-slate-300 text-xs whitespace-nowrap">{fmtShort(b.checkOut)}</td>
                      <td className="px-4 py-3 price-mono text-white text-xs font-bold whitespace-nowrap">{fmt(b.total)}₫</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 font-body text-xs font-semibold px-2.5 py-1 rounded-full border ${S.bg} ${S.text} ${S.border}`}>
                          <Icon className="w-3 h-3" />
                          {b.status.charAt(0).toUpperCase() + b.status.slice(1)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}