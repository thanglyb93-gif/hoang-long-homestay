'use client';

import { useState } from 'react';
import {
  CheckCircle2, Clock, XCircle, BedDouble, Phone,
  Mail, Globe, CalendarDays, MessageSquare, Filter,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import type { BookingStatus, AdminBooking } from '@/lib/admin-store';

function fmt(n: number) { return n.toLocaleString('en-US'); }
function fmtDate(s: string) {
  return new Date(s + 'T00:00:00').toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}
function fmtTs(iso: string) {
  return new Date(iso).toLocaleString('en-GB', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

const STATUS_CFG = {
  pending:   { label: 'Pending',   bg: 'bg-amber-900/40', text: 'text-amber-300', border: 'border-amber-700/50',  icon: Clock },
  confirmed: { label: 'Confirmed', bg: 'bg-green-900/40', text: 'text-green-300', border: 'border-green-700/50',  icon: CheckCircle2 },
  cancelled: { label: 'Cancelled', bg: 'bg-red-900/40',   text: 'text-red-300',   border: 'border-red-700/50',    icon: XCircle },
};

interface BookingRowProps {
  booking: AdminBooking;
  onStatus: (ref: string, s: BookingStatus) => void;
}

function BookingRow({ booking: b, onStatus }: BookingRowProps) {
  const [expanded, setExpanded] = useState(false);
  const S = STATUS_CFG[b.status];
  const Icon = S.icon;

  return (
    <>
      <tr
        className="hover:bg-slate-800/30 cursor-pointer transition-colors"
        onClick={() => setExpanded((o) => !o)}
      >
        <td className="px-4 py-3 price-mono text-white text-xs font-bold">#{b.ref}</td>
        <td className="px-4 py-3">
          <p className="font-body text-sm text-white font-medium">{b.fullName}</p>
          <p className="font-body text-xs text-slate-500">{b.phone}</p>
        </td>
        <td className="px-4 py-3 price-mono text-slate-300 text-xs whitespace-nowrap">{b.roomName}</td>
        <td className="px-4 py-3">
          <p className="price-mono text-slate-300 text-xs whitespace-nowrap">{fmtDate(b.checkIn)}</p>
          <p className="price-mono text-slate-500 text-[10px]">→ {fmtDate(b.checkOut)}</p>
        </td>
        <td className="px-4 py-3 price-mono text-slate-400 text-xs whitespace-nowrap">{b.nights}n · {b.guests}g</td>
        <td className="px-4 py-3 price-mono text-white text-xs font-bold whitespace-nowrap">{fmt(b.total)}₫</td>
        <td className="px-4 py-3">
          <span className={`inline-flex items-center gap-1 font-body text-xs font-semibold px-2.5 py-1 rounded-full border ${S.bg} ${S.text} ${S.border}`}>
            <Icon className="w-3 h-3" />
            {S.label}
          </span>
        </td>
        <td className="px-4 py-3">
          <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
            {b.status === 'pending' && (
              <>
                <button
                  onClick={() => onStatus(b.ref, 'confirmed')}
                  className="font-body text-[11px] font-semibold text-green-400 hover:text-green-300 bg-green-900/30 hover:bg-green-900/60 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  ✓ Confirm
                </button>
                <button
                  onClick={() => onStatus(b.ref, 'cancelled')}
                  className="font-body text-[11px] font-semibold text-red-400 hover:text-red-300 bg-red-900/30 hover:bg-red-900/60 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
                >
                  ✕ Cancel
                </button>
              </>
            )}
            {b.status === 'confirmed' && (
              <button
                onClick={() => onStatus(b.ref, 'cancelled')}
                className="font-body text-[11px] text-slate-400 hover:text-red-300 bg-slate-800 hover:bg-red-900/30 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Cancel
              </button>
            )}
            {b.status === 'cancelled' && (
              <button
                onClick={() => onStatus(b.ref, 'pending')}
                className="font-body text-[11px] text-slate-400 hover:text-amber-300 bg-slate-800 hover:bg-amber-900/30 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap"
              >
                Reopen
              </button>
            )}
          </div>
        </td>
      </tr>

      {/* Expanded detail row */}
      {expanded && (
        <tr className="bg-[#0b1120]">
          <td colSpan={8} className="px-6 py-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
              <div className="space-y-2">
                <p className="price-mono text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Contact</p>
                <div className="flex items-center gap-2 text-slate-300">
                  <Phone className="w-3 h-3 text-slate-500" />
                  <a href={`tel:${b.phone}`} className="hover:text-white">{b.phone}</a>
                </div>
                {b.email && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Mail className="w-3 h-3 text-slate-500" />
                    <a href={`mailto:${b.email}`} className="hover:text-white truncate">{b.email}</a>
                  </div>
                )}
                {b.nationality && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Globe className="w-3 h-3 text-slate-500" />
                    <span>{b.nationality}</span>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="price-mono text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Stay</p>
                <div className="flex items-center gap-2 text-slate-300">
                  <CalendarDays className="w-3 h-3 text-slate-500" />
                  <span>{fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}</span>
                </div>
                <div className="flex items-center gap-2 text-slate-300">
                  <BedDouble className="w-3 h-3 text-slate-500" />
                  <span>{b.roomName} · {b.nights} night{b.nights !== 1 ? 's' : ''} · {b.guests} guest{b.guests !== 1 ? 's' : ''}</span>
                </div>
                <p className="price-mono text-white font-bold">{fmt(b.total)} VND</p>
              </div>

              {b.requests && (
                <div className="space-y-2">
                  <p className="price-mono text-slate-500 uppercase tracking-wider text-[10px] font-semibold">Special Requests</p>
                  <div className="flex items-start gap-2 text-slate-300">
                    <MessageSquare className="w-3 h-3 text-slate-500 flex-shrink-0 mt-0.5" />
                    <p className="leading-relaxed">{b.requests}</p>
                  </div>
                </div>
              )}

              <div className="sm:col-span-2 lg:col-span-3 pt-2 border-t border-slate-800 flex items-center gap-3">
                <p className="font-body text-slate-600 text-[10px]">Submitted: {fmtTs(b.submittedAt)}</p>
                <p className="font-body text-slate-600 text-[10px]">·</p>
                <p className="font-body text-slate-600 text-[10px]">Payment: {b.paymentMethod || 'On arrival'}</p>
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

type FilterType = 'all' | BookingStatus;

const FILTER_TABS: { key: FilterType; label: string }[] = [
  { key: 'all',       label: 'All' },
  { key: 'pending',   label: 'Pending' },
  { key: 'confirmed', label: 'Confirmed' },
  { key: 'cancelled', label: 'Cancelled' },
];

export default function BookingsPanel() {
  const { bookings, updateBookingStatus } = useAdminStore();
  const [filter, setFilter] = useState<FilterType>('all');

  const counts = {
    all:       bookings.length,
    pending:   bookings.filter((b) => b.status === 'pending').length,
    confirmed: bookings.filter((b) => b.status === 'confirmed').length,
    cancelled: bookings.filter((b) => b.status === 'cancelled').length,
  };

  const filtered = filter === 'all' ? bookings : bookings.filter((b) => b.status === filter);

  return (
    <div className="space-y-5">

      {/* Filter bar */}
      <div className="flex items-center gap-2 flex-wrap">
        <Filter className="w-4 h-4 text-slate-500" />
        {FILTER_TABS.map((tab) => {
          const count   = counts[tab.key];
          const isActive = filter === tab.key;
          return (
            <button
              key={tab.key}
              onClick={() => setFilter(tab.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-sm font-body font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              {tab.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-semibold ${
                isActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-400'
              }`}>
                {count}
              </span>
            </button>
          );
        })}
        <span className="ml-auto font-body text-xs text-slate-500">Click a row to expand details</span>
      </div>

      {/* Table */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 overflow-hidden">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <CalendarDays className="w-10 h-10 text-slate-700 mb-3" />
            <p className="price-mono text-slate-500 text-sm">
              {filter === 'all' ? 'No bookings yet.' : `No ${filter} bookings.`}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#0b1120]">
                  {['Ref', 'Guest', 'Room', 'Dates', 'Stay', 'Total', 'Status', 'Actions'].map((h) => (
                    <th key={h} className="price-mono text-[10px] text-slate-500 uppercase tracking-wider px-4 py-3 font-semibold whitespace-nowrap">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                {filtered.map((b) => (
                  <BookingRow key={b.ref} booking={b} onStatus={updateBookingStatus} />
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
