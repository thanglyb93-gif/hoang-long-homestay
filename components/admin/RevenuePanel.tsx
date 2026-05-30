'use client';

import { useState, useMemo } from 'react';
import {
  TrendingUp, TrendingDown, Minus, DollarSign, CalendarDays,
  CheckCircle2, BarChart2, Users,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { useAllRooms, useRoomStore } from '@/lib/room-store';
import type { AdminBooking } from '@/lib/admin-store';

type Period = 'today' | 'week' | 'month' | 'quarter' | 'ytd' | 'all';

const PERIODS: { id: Period; label: string }[] = [
  { id: 'today',   label: 'Today' },
  { id: 'week',    label: 'This Week' },
  { id: 'month',   label: 'This Month' },
  { id: 'quarter', label: 'This Quarter' },
  { id: 'ytd',     label: 'Year to Date' },
  { id: 'all',     label: 'All Time' },
];

const BAR_ACCENTS = [
  'bg-slate-400', 'bg-sky-400', 'bg-violet-400', 'bg-amber-400',
  'bg-green-400', 'bg-pink-400', 'bg-orange-400', 'bg-teal-400',
  'bg-rose-400',  'bg-indigo-400', 'bg-yellow-400', 'bg-cyan-400',
  'bg-lime-400',  'bg-fuchsia-400',
];

function todayStr() { return new Date().toISOString().slice(0, 10); }

function getPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();
  const today = todayStr();
  if (period === 'today')   return { start: today, end: today };
  if (period === 'week') {
    const dow = (now.getDay() + 6) % 7;
    const mon = new Date(now); mon.setDate(now.getDate() - dow);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
  }
  if (period === 'month') {
    const first = new Date(now.getFullYear(), now.getMonth(), 1);
    return { start: first.toISOString().slice(0, 10), end: today };
  }
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    const qStart = new Date(now.getFullYear(), q * 3, 1);
    return { start: qStart.toISOString().slice(0, 10), end: today };
  }
  if (period === 'ytd') return { start: `${now.getFullYear()}-01-01`, end: today };
  return { start: '2020-01-01', end: today };
}

function getPrevPeriodRange(period: Period): { start: string; end: string } {
  const now = new Date();
  if (period === 'today') {
    const y = new Date(now); y.setDate(now.getDate() - 1);
    const s = y.toISOString().slice(0, 10);
    return { start: s, end: s };
  }
  if (period === 'week') {
    const dow = (now.getDay() + 6) % 7;
    const mon = new Date(now); mon.setDate(now.getDate() - dow - 7);
    const sun = new Date(mon); sun.setDate(mon.getDate() + 6);
    return { start: mon.toISOString().slice(0, 10), end: sun.toISOString().slice(0, 10) };
  }
  if (period === 'month') {
    const prevEnd   = new Date(now.getFullYear(), now.getMonth(), 0);
    const prevStart = new Date(prevEnd.getFullYear(), prevEnd.getMonth(), 1);
    return { start: prevStart.toISOString().slice(0, 10), end: prevEnd.toISOString().slice(0, 10) };
  }
  if (period === 'quarter') {
    const q = Math.floor(now.getMonth() / 3);
    const prevQ    = q === 0 ? 3 : q - 1;
    const prevYear = q === 0 ? now.getFullYear() - 1 : now.getFullYear();
    const qStart   = new Date(prevYear, prevQ * 3, 1);
    const qEnd     = new Date(prevYear, prevQ * 3 + 3, 0);
    return { start: qStart.toISOString().slice(0, 10), end: qEnd.toISOString().slice(0, 10) };
  }
  if (period === 'ytd') {
    const prevYear = now.getFullYear() - 1;
    return { start: `${prevYear}-01-01`, end: `${prevYear}-12-31` };
  }
  return { start: '2010-01-01', end: '2019-12-31' };
}

function filterByRange(bookings: AdminBooking[], start: string, end: string): AdminBooking[] {
  return bookings.filter(
    (b) => b.status === 'confirmed' && b.checkIn >= start && b.checkIn <= end
  );
}

function fmt(n: number)  { return n.toLocaleString('en-US'); }
function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}
function fmtFull(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtK(n: number) {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000)     return `${(n / 1_000).toFixed(0)}K`;
  return String(n);
}

function StatCard({ label, value, sub, trend, icon: Icon, accent }: {
  label: string; value: string; sub?: string;
  trend?: { pct: number; label: string };
  icon: React.ElementType;
  accent: { bg: string; text: string; icon: string };
}) {
  return (
    <div className="bg-[#111827] rounded-2xl border border-slate-700 p-5">
      <div className="flex items-center justify-between mb-3">
        <span className="font-body text-xs text-slate-400 font-medium">{label}</span>
        <div className={`w-8 h-8 rounded-lg ${accent.bg} flex items-center justify-center`}>
          <Icon className={`w-4 h-4 ${accent.icon}`} />
        </div>
      </div>
      <p className={`price-mono text-2xl font-bold ${accent.text}`}>{value}</p>
      {sub && <p className="font-body text-xs text-slate-500 mt-1">{sub}</p>}
      {trend && (
        <div className={`flex items-center gap-1 mt-2 text-xs font-body font-semibold ${
          trend.pct > 0 ? 'text-green-400' : trend.pct < 0 ? 'text-red-400' : 'text-slate-500'
        }`}>
          {trend.pct > 0 ? <TrendingUp className="w-3 h-3" /> : trend.pct < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
          {trend.pct > 0 ? '+' : ''}{trend.pct.toFixed(0)}% vs {trend.label}
        </div>
      )}
    </div>
  );
}

function RoomBar({ name, number, revenue, bookingCount, maxRevenue, accent }: {
  name: string; number: string; revenue: number; bookingCount: number;
  maxRevenue: number; accent: string;
}) {
  const pct = maxRevenue > 0 ? Math.round((revenue / maxRevenue) * 100) : 0;
  return (
    <div className="flex items-center gap-3">
      <div className="w-28 flex-shrink-0">
        <p className="price-mono text-white text-xs font-bold">{name} · {number}</p>
        <p className="font-body text-slate-500 text-[10px]">{bookingCount} booking{bookingCount !== 1 ? 's' : ''}</p>
      </div>
      <div className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${accent}`} style={{ width: `${pct}%` }} />
      </div>
      <span className="price-mono text-white text-xs font-bold w-20 text-right flex-shrink-0">
        {revenue > 0 ? `₫${fmtK(revenue)}` : '—'}
      </span>
    </div>
  );
}

export default function RevenuePanel() {
  const { bookings } = useAdminStore();
  const { overrides: roomOverrides } = useRoomStore();
  const allRooms = useAllRooms();
  const [period, setPeriod] = useState<Period>('month');

  // Only show rooms that are active (original 4 always, placeholders only when activated)
  const visibleRooms = allRooms.filter((r) => {
    const o = roomOverrides[r.id];
    if (r.isPlaceholder) return o?.isActive === true;
    return o?.isActive !== false;
  });

  const { start, end }             = getPeriodRange(period);
  const { start: prevStart, end: prevEnd } = getPrevPeriodRange(period);

  const currentBookings = useMemo(() => filterByRange(bookings, start, end),         [bookings, start, end]);
  const prevBookings    = useMemo(() => filterByRange(bookings, prevStart, prevEnd),  [bookings, prevStart, prevEnd]);

  const totalRevenue  = currentBookings.reduce((sum, b) => sum + b.total, 0);
  const prevRevenue   = prevBookings.reduce((sum, b) => sum + b.total, 0);
  const revTrendPct   = prevRevenue > 0 ? ((totalRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const bookingCount  = currentBookings.length;
  const prevCount     = prevBookings.length;
  const countTrendPct = prevCount > 0 ? ((bookingCount - prevCount) / prevCount) * 100 : 0;

  const avgRevenue  = bookingCount > 0 ? Math.round(totalRevenue / bookingCount) : 0;
  const totalNights = currentBookings.reduce((sum, b) => sum + b.nights, 0);

  // Room breakdown — only active rooms
  const roomBreakdown = visibleRooms.map((room) => {
    const rb = currentBookings.filter((b) => b.roomId === room.id);
    return {
      id:           room.id,
      name:         room.nameEn,
      number:       room.roomNumber,
      revenue:      rb.reduce((s, b) => s + b.total, 0),
      bookingCount: rb.length,
    };
  });
  const maxRevenue = Math.max(...roomBreakdown.map((r) => r.revenue), 1);

  const paymentBreakdown = ['bank', 'momo', 'card', 'cash'].map((method) => {
    const mb = currentBookings.filter((b) => b.paymentMethod === method);
    return {
      method,
      label: method === 'bank' ? 'Bank Transfer' : method === 'momo' ? 'MoMo' : method === 'card' ? 'Card' : 'Cash',
      count: mb.length,
      total: mb.reduce((s, b) => s + b.total, 0),
    };
  }).filter((m) => m.count > 0);

  const periodLabel = period === 'today' ? 'yesterday' : period === 'week' ? 'last week' : period === 'month' ? 'last month' : period === 'quarter' ? 'last quarter' : 'last year';

  return (
    <div className="space-y-6">

      {/* Period selector */}
      <div className="bg-[#0d1526] rounded-2xl border border-slate-800 p-1.5 flex gap-1 overflow-x-auto">
        {PERIODS.map((p) => (
          <button
            key={p.id}
            onClick={() => setPeriod(p.id)}
            className={`flex-1 min-w-max px-4 py-2 rounded-xl font-body font-semibold text-sm transition-all whitespace-nowrap ${
              period === p.id
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {period !== 'all' && (
        <p className="font-body text-slate-500 text-sm">
          Revenue attributed by guest check-in date ·{' '}
          <span className="text-slate-400 font-semibold">
            {fmtFull(start)}{start !== end ? ` → ${fmtFull(end)}` : ''}
          </span>
        </p>
      )}

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Total Revenue"
          value={`₫${fmtK(totalRevenue)}`}
          sub={totalRevenue > 0 ? `${fmt(totalRevenue)} VND` : 'No revenue yet'}
          trend={period !== 'all' ? { pct: revTrendPct, label: periodLabel } : undefined}
          icon={DollarSign}
          accent={{ bg: 'bg-green-900/40', text: 'text-green-300', icon: 'text-green-400' }}
        />
        <StatCard
          label="Bookings"
          value={String(bookingCount)}
          sub={`${totalNights} total nights`}
          trend={period !== 'all' ? { pct: countTrendPct, label: periodLabel } : undefined}
          icon={CalendarDays}
          accent={{ bg: 'bg-blue-900/40', text: 'text-blue-300', icon: 'text-blue-400' }}
        />
        <StatCard
          label="Avg / Booking"
          value={avgRevenue > 0 ? `₫${fmtK(avgRevenue)}` : '—'}
          sub={avgRevenue > 0 ? `${fmt(avgRevenue)} VND` : ''}
          icon={BarChart2}
          accent={{ bg: 'bg-violet-900/40', text: 'text-violet-300', icon: 'text-violet-400' }}
        />
        <StatCard
          label="Avg / Night"
          value={totalNights > 0 ? `₫${fmtK(Math.round(totalRevenue / totalNights))}` : '—'}
          sub={totalNights > 0 ? `${totalNights} nights total` : ''}
          icon={Users}
          accent={{ bg: 'bg-sky-900/40', text: 'text-sky-300', icon: 'text-sky-400' }}
        />
      </div>

      {/* Room breakdown */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-5">
        <div className="flex items-center gap-2 mb-5">
          <BarChart2 className="w-4 h-4 text-blue-400" />
          <h3 className="price-mono text-white font-semibold text-sm">Revenue by Room</h3>
        </div>
        {bookingCount === 0 ? (
          <p className="font-body text-slate-600 text-sm text-center py-4">No bookings in this period.</p>
        ) : (
          <div className="space-y-4">
            {roomBreakdown.map((room, i) => (
              <RoomBar
                key={room.id}
                name={room.name}
                number={room.number}
                revenue={room.revenue}
                bookingCount={room.bookingCount}
                maxRevenue={maxRevenue}
                accent={BAR_ACCENTS[i % BAR_ACCENTS.length]}
              />
            ))}
          </div>
        )}
      </div>

      {/* Payment method breakdown */}
      {paymentBreakdown.length > 0 && (
        <div className="bg-[#111827] rounded-2xl border border-slate-700 p-5">
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-blue-400" />
            <h3 className="price-mono text-white font-semibold text-sm">Payment Methods</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {paymentBreakdown.map((m) => (
              <div key={m.method} className="bg-[#0b1120] rounded-xl border border-slate-700 p-3 text-center">
                <p className="font-body text-xs text-slate-400 font-semibold uppercase tracking-wider mb-1">{m.label}</p>
                <p className="price-mono text-white font-bold text-sm">{m.count} booking{m.count !== 1 ? 's' : ''}</p>
                <p className="price-mono text-slate-400 text-xs mt-0.5">₫{fmtK(m.total)}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Bookings table */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 overflow-hidden">
        <div className="flex items-center gap-2 px-5 py-4 border-b border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-green-400" />
          <h3 className="price-mono text-white font-semibold text-sm flex-1">Bookings in Period</h3>
          <span className="font-body text-xs text-slate-500">{currentBookings.length}</span>
        </div>

        {currentBookings.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="price-mono text-slate-600 text-sm">No confirmed bookings in this period.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0b1120]">
                  {['Ref', 'Guest', 'Room', 'Check-in', 'Nights', 'Revenue', 'Payment'].map((h) => (
                    <th key={h} className="price-mono text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-semibold whitespace-nowrap">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {currentBookings.map((b) => (
                  <tr key={b.ref} className="hover:bg-slate-800/30 transition-colors">
                    <td className="px-4 py-3 price-mono text-white text-xs font-bold">#{b.ref}</td>
                    <td className="px-4 py-3">
                      <p className="font-body text-sm text-white">{b.fullName}</p>
                      <p className="font-body text-xs text-slate-500">{b.nationality || b.phone}</p>
                    </td>
                    <td className="px-4 py-3 price-mono text-slate-300 text-xs whitespace-nowrap">
                      {b.roomName} · {b.roomNumber}
                    </td>
                    <td className="px-4 py-3 price-mono text-slate-300 text-xs whitespace-nowrap">
                      {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                    </td>
                    <td className="px-4 py-3 price-mono text-slate-300 text-xs text-center">{b.nights}</td>
                    <td className="px-4 py-3 price-mono text-green-300 text-xs font-bold whitespace-nowrap">
                      ₫{fmt(b.total)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-body text-xs text-slate-400 capitalize">{b.paymentMethod}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-[#0b1120] border-t border-slate-700">
                  <td colSpan={5} className="px-4 py-3 price-mono text-slate-400 text-xs font-semibold text-right">
                    Period Total:
                  </td>
                  <td className="px-4 py-3 price-mono text-green-300 text-sm font-bold whitespace-nowrap">
                    ₫{fmt(totalRevenue)}
                  </td>
                  <td />
                </tr>
              </tfoot>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}