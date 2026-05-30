'use client';

import { useState } from 'react';
import { CheckCircle2, Clock, XCircle, Search, Phone, Mail, MessageCircle } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import type { BookingStatus } from '@/lib/admin-store';

const STATUS_STYLE: Record<BookingStatus, string> = {
  pending:   'bg-amber-100 text-amber-700 border-amber-200',
  confirmed: 'bg-green-100 text-green-700 border-green-200',
  cancelled: 'bg-slate-100 text-slate-500 border-slate-200',
};

const STATUS_ICON: Record<BookingStatus, React.ElementType> = {
  pending:   Clock,
  confirmed: CheckCircle2,
  cancelled: XCircle,
};

const PAYMENT_LABEL: Record<string, string> = {
  bank: 'Bank Transfer',
  momo: 'MoMo',
  card: 'Visa/Mastercard',
  cash: 'Cash',
};

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export default function BookingsPage() {
  const { bookings, updateBookingStatus } = useAdminStore();

  const [filter, setFilter] = useState<BookingStatus | 'all'>('all');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);

  const filtered = bookings.filter((b) => {
    if (filter !== 'all' && b.status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        b.ref.includes(q) ||
        b.fullName.toLowerCase().includes(q) ||
        b.roomName.toLowerCase().includes(q) ||
        b.phone.includes(q)
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-forest-900">Bookings</h1>
        <p className="font-body text-sm text-forest-500 mt-1">
          {bookings.length} total · {bookings.filter((b) => b.status === 'pending').length} pending
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-forest-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ref, name, room, phone…"
            className="w-full pl-9 pr-4 py-2.5 font-body text-sm border border-cream-300 rounded-xl outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 bg-white"
          />
        </div>
        <div className="flex gap-1 p-1 bg-white border border-cream-300 rounded-xl flex-shrink-0">
          {(['all', 'pending', 'confirmed', 'cancelled'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3 py-1.5 rounded-lg font-body text-xs font-medium capitalize transition-colors ${
                filter === s
                  ? 'bg-blue-600 text-white'
                  : 'text-forest-600 hover:bg-cream-100'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      {/* Bookings list */}
      {filtered.length === 0 ? (
        <div className="bg-white rounded-2xl border border-cream-200 p-10 text-center">
          <p className="font-body text-sm text-forest-400">No bookings found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((b) => {
            const Icon    = STATUS_ICON[b.status];
            const isOpen  = expanded === b.ref;
            return (
              <div key={b.ref} className="bg-white rounded-2xl border border-cream-200 overflow-hidden shadow-sm">
                {/* Row header */}
                <button
                  type="button"
                  onClick={() => setExpanded(isOpen ? null : b.ref)}
                  className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-cream-50 transition-colors"
                >
                  {/* Booking ref */}
                  <div className="w-14 h-14 rounded-xl bg-forest-900 flex items-center justify-center flex-shrink-0">
                    <span className="font-mono text-sm font-bold text-sky-300">{b.ref}</span>
                  </div>

                  {/* Guest info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-forest-900">{b.fullName}</p>
                    <p className="font-body text-xs text-forest-400">
                      Room {b.roomNumber} {b.roomName} · {b.nights} night{b.nights !== 1 ? 's' : ''} · {fmtDate(b.checkIn)} → {fmtDate(b.checkOut)}
                    </p>
                    <p className="font-body text-[11px] text-forest-300 mt-0.5">
                      Submitted {fmtTime(b.submittedAt)}
                    </p>
                  </div>

                  {/* Price + status */}
                  <div className="text-right flex-shrink-0">
                    <p className="font-heading text-lg font-semibold text-forest-900">{b.total.toLocaleString()}đ</p>
                    <span className={`inline-flex items-center gap-1 font-body text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLE[b.status]}`}>
                      <Icon className="w-3 h-3" />
                      {b.status}
                    </span>
                  </div>
                </button>

                {/* Expanded detail */}
                {isOpen && (
                  <div className="border-t border-cream-200 px-5 py-5 bg-cream-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      {/* Guest details */}
                      <div className="space-y-2">
                        <p className="font-body text-xs font-semibold text-forest-500 uppercase tracking-wider mb-3">Guest Details</p>
                        <Detail label="Name"        value={b.fullName} />
                        <Detail label="Phone"       value={b.phone} />
                        <Detail label="Email"       value={b.email} />
                        <Detail label="Nationality" value={b.nationality || '—'} />
                        <Detail label="Guests"      value={`${b.guests}`} />
                        {b.requests && <Detail label="Requests" value={b.requests} />}
                      </div>

                      {/* Booking details */}
                      <div className="space-y-2">
                        <p className="font-body text-xs font-semibold text-forest-500 uppercase tracking-wider mb-3">Booking Details</p>
                        <Detail label="Room"     value={`#${b.roomNumber} ${b.roomName}`} />
                        <Detail label="Check-in" value={fmtDate(b.checkIn)} />
                        <Detail label="Check-out" value={fmtDate(b.checkOut)} />
                        <Detail label="Nights"   value={`${b.nights}`} />
                        <Detail label="Payment"  value={PAYMENT_LABEL[b.paymentMethod] ?? b.paymentMethod} />
                        <Detail label="Total"    value={`${b.total.toLocaleString()}đ`} bold />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-cream-200">
                      {b.status === 'pending' && (
                        <button
                          onClick={() => updateBookingStatus(b.ref, 'confirmed')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-body text-sm font-semibold rounded-xl transition-colors"
                        >
                          <CheckCircle2 className="w-4 h-4" /> Confirm
                        </button>
                      )}
                      {b.status !== 'cancelled' && (
                        <button
                          onClick={() => updateBookingStatus(b.ref, 'cancelled')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-red-300 text-red-600 hover:bg-red-50 font-body text-sm font-medium rounded-xl transition-colors"
                        >
                          <XCircle className="w-4 h-4" /> Cancel
                        </button>
                      )}
                      {b.status === 'cancelled' && (
                        <button
                          onClick={() => updateBookingStatus(b.ref, 'pending')}
                          className="flex items-center gap-1.5 px-4 py-2 bg-white border border-cream-300 text-forest-600 hover:bg-cream-100 font-body text-sm font-medium rounded-xl transition-colors"
                        >
                          <Clock className="w-4 h-4" /> Restore to Pending
                        </button>
                      )}
                      <a
                        href={`tel:${b.phone}`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-cream-300 text-forest-700 hover:bg-cream-100 font-body text-sm font-medium rounded-xl transition-colors"
                      >
                        <Phone className="w-4 h-4" /> Call
                      </a>
                      <a
                        href={`mailto:${b.email}?subject=Booking Reference ${b.ref} – Hoang Long Homestay`}
                        className="flex items-center gap-1.5 px-4 py-2 bg-white border border-cream-300 text-forest-700 hover:bg-cream-100 font-body text-sm font-medium rounded-xl transition-colors"
                      >
                        <Mail className="w-4 h-4" /> Email
                      </a>
                      <a
                        href={`https://wa.me/${b.phone.replace(/\D/g, '')}?text=Hello ${encodeURIComponent(b.fullName)}, regarding your booking ref ${b.ref} at Hoang Long Homestay.`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-4 py-2 bg-[#25D366] hover:bg-[#1ebe5d] text-white font-body text-sm font-medium rounded-xl transition-colors"
                      >
                        <MessageCircle className="w-4 h-4" /> WhatsApp
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function Detail({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <span className="font-body text-xs text-forest-400 w-24 flex-shrink-0">{label}</span>
      <span className={`font-body text-sm flex-1 ${bold ? 'font-semibold text-forest-900' : 'text-forest-700'}`}>
        {value}
      </span>
    </div>
  );
}
