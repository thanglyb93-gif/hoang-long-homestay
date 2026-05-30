'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import {
  TrendingUp, DollarSign, CalendarCheck, Bell, CheckCircle2,
  Clock, XCircle, ArrowRight, BarChart3, Pencil, PlusCircle, Trash2,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { getEffectivePricePerNight } from '@/lib/admin-pricing';
import { rooms } from '@/lib/rooms';
import { isRoomAvailable } from '@/lib/availability';

// ── Helpers ───────────────────────────────────────────────────────────────────

function toYMD(d: Date) {
  return d.toISOString().slice(0, 10);
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function daysFromNow(iso: string) {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

const STATUS_STYLE: Record<string, string> = {
  pending:   'bg-amber-100 text-amber-700',
  confirmed: 'bg-green-100 text-green-700',
  cancelled: 'bg-slate-100 text-slate-500',
};

const STATUS_ICON: Record<string, React.ElementType> = {
  pending:   Clock,
  confirmed: CheckCircle2,
  cancelled: XCircle,
};

// ── Component ─────────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const params = useParams();
  const locale = params.locale as string;

  const {
    bookings, overrides, seasonalRules,
    addSeasonalRule, updateSeasonalRule, removeSeasonalRule,
    changePin,
  } = useAdminStore();

  const today     = new Date();
  const todayStr  = toYMD(today);

  // ── Seasonal rule form state
  const [ruleForm, setRuleForm] = useState({
    name: '', startDate: '', endDate: '', adjustmentPct: '0', roomIds: [] as string[],
  });
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [showRuleForm,  setShowRuleForm]  = useState(false);

  // ── PIN change form
  const [newPin,    setNewPin]    = useState('');
  const [pinSaved,  setPinSaved]  = useState(false);

  // ── Derived stats ──────────────────────────────────────────────────────────
  const activeBookings = bookings.filter((b) => b.status !== 'cancelled');

  // Current occupancy: active booking whose dates include today
  const todayOccupied = useMemo(
    () =>
      activeBookings.filter(
        (b) => b.checkIn <= todayStr && b.checkOut > todayStr
      ),
    [activeBookings, todayStr]
  );

  // Revenue this calendar month
  const thisMonthRevenue = useMemo(() => {
    const ym = today.toISOString().slice(0, 7); // YYYY-MM
    return activeBookings
      .filter((b) => b.checkIn.startsWith(ym))
      .reduce((sum, b) => sum + b.total, 0);
  }, [activeBookings, today]);

  // Total revenue all-time
  const totalRevenue = useMemo(
    () => activeBookings.reduce((sum, b) => sum + b.total, 0),
    [activeBookings]
  );

  // Monthly occupancy (last 6 months) — % of room-nights booked
  const occupancyData = useMemo(() => {
    const months: { label: string; pct: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
      const ym = d.toISOString().slice(0, 7);
      const label = d.toLocaleDateString('en-GB', { month: 'short' });
      const daysInMonth = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
      const totalRoomNights = rooms.length * daysInMonth;
      const bookedNights = activeBookings
        .filter((b) => b.checkIn.startsWith(ym))
        .reduce((sum, b) => sum + b.nights, 0);
      months.push({ label, pct: Math.min(100, Math.round((bookedNights / totalRoomNights) * 100)) });
    }
    return months;
  }, [activeBookings, today]);

  // Pending bookings (newest notifications)
  const pending = bookings.filter((b) => b.status === 'pending').slice(0, 5);

  // ── Seasonal rule handlers ──────────────────────────────────────────────────
  function submitRule(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name: ruleForm.name,
      startDate: ruleForm.startDate,
      endDate: ruleForm.endDate,
      adjustmentPct: Number(ruleForm.adjustmentPct),
      roomIds: ruleForm.roomIds,
    };
    if (editingRuleId) {
      updateSeasonalRule(editingRuleId, payload);
      setEditingRuleId(null);
    } else {
      addSeasonalRule(payload);
    }
    setRuleForm({ name: '', startDate: '', endDate: '', adjustmentPct: '0', roomIds: [] });
    setShowRuleForm(false);
  }

  function startEditRule(id: string) {
    const r = seasonalRules.find((x) => x.id === id);
    if (!r) return;
    setRuleForm({
      name: r.name,
      startDate: r.startDate,
      endDate: r.endDate,
      adjustmentPct: r.adjustmentPct.toString(),
      roomIds: r.roomIds,
    });
    setEditingRuleId(id);
    setShowRuleForm(true);
  }

  function handleChangePin(e: React.FormEvent) {
    e.preventDefault();
    if (newPin.length < 4) return;
    changePin(newPin);
    setNewPin('');
    setPinSaved(true);
    setTimeout(() => setPinSaved(false), 3000);
  }

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-3xl font-semibold text-forest-900">Dashboard</h1>
        <p className="font-body text-sm text-forest-500 mt-1">
          {today.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* ── Stat cards ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Revenue this month"
          value={`${thisMonthRevenue.toLocaleString()}đ`}
          icon={DollarSign}
          color="text-blue-600 bg-blue-50"
        />
        <StatCard
          label="Total revenue"
          value={`${totalRevenue.toLocaleString()}đ`}
          icon={TrendingUp}
          color="text-indigo-600 bg-indigo-50"
        />
        <StatCard
          label="Rooms occupied today"
          value={`${todayOccupied.length} / ${rooms.length}`}
          icon={CalendarCheck}
          color="text-green-600 bg-green-50"
        />
        <StatCard
          label="Pending bookings"
          value={pending.length.toString()}
          icon={Bell}
          color="text-amber-600 bg-amber-50"
        />
      </div>

      {/* ── Room status grid ── */}
      <section>
        <h2 className="font-heading text-xl font-semibold text-forest-900 mb-4">Room Status</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {rooms.map((room) => {
            const occupied = todayOccupied.find((b) => b.roomId === room.id);
            const effPrice = getEffectivePricePerNight(room.id, today, today, overrides, seasonalRules);
            const override = overrides.find((o) => o.roomId === room.id);
            return (
              <div
                key={room.id}
                className={`rounded-2xl border p-5 ${
                  occupied
                    ? 'bg-forest-900 border-forest-800'
                    : 'bg-white border-cream-200'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className={`font-mono text-xs font-bold ${occupied ? 'text-sky-300' : 'text-blue-500'}`}>
                      #{room.roomNumber}
                    </span>
                    <p className={`font-heading text-lg font-semibold ${occupied ? 'text-white' : 'text-forest-900'}`}>
                      {room.nameEn}
                    </p>
                  </div>
                  <span
                    className={`font-body text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                      occupied
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-green-100 text-green-700'
                    }`}
                  >
                    {occupied ? 'Occupied' : 'Available'}
                  </span>
                </div>

                {occupied ? (
                  <div className="space-y-1">
                    <p className="font-body text-sm font-semibold text-white">{occupied.fullName}</p>
                    <p className="font-body text-xs text-white/60">
                      {fmtDate(occupied.checkIn)} → {fmtDate(occupied.checkOut)}
                    </p>
                    <p className="font-body text-xs text-sky-300">
                      {Math.ceil((new Date(occupied.checkOut).getTime() - today.getTime()) / 86_400_000)}d remaining
                    </p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="font-body text-xs text-forest-500">No active booking</p>
                  </div>
                )}

                <div className={`mt-3 pt-3 border-t ${occupied ? 'border-white/10' : 'border-cream-200'}`}>
                  <p className={`font-body text-xs ${occupied ? 'text-white/50' : 'text-forest-400'}`}>
                    Rate tonight
                  </p>
                  <p className={`font-heading text-base font-semibold ${occupied ? 'text-white' : 'text-forest-900'}`}>
                    {effPrice.toLocaleString()}đ
                    {override?.pricePerNight && (
                      <span className="font-body text-[10px] text-blue-400 ml-1">(custom)</span>
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Occupancy chart ── */}
      <section>
        <h2 className="font-heading text-xl font-semibold text-forest-900 mb-4">
          <span className="flex items-center gap-2"><BarChart3 className="w-5 h-5 text-blue-500" /> Monthly Occupancy</span>
        </h2>
        <div className="bg-white rounded-2xl border border-cream-200 p-6">
          <div className="flex items-end gap-3 h-32">
            {occupancyData.map(({ label, pct }) => (
              <div key={label} className="flex-1 flex flex-col items-center gap-1">
                <span className="font-body text-xs text-forest-500">{pct}%</span>
                <div className="w-full bg-cream-100 rounded-t-lg relative" style={{ height: '80px' }}>
                  <div
                    className="absolute bottom-0 w-full bg-blue-500 rounded-t-lg transition-all duration-500"
                    style={{ height: `${pct}%` }}
                  />
                </div>
                <span className="font-body text-xs text-forest-400">{label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pending bookings notifications ── */}
      {pending.length > 0 && (
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-heading text-xl font-semibold text-forest-900">
              <span className="flex items-center gap-2">
                <Bell className="w-5 h-5 text-amber-500" />
                Pending Bookings
                <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-body text-[10px] font-bold flex items-center justify-center">
                  {pending.length}
                </span>
              </span>
            </h2>
            <Link
              href={`/${locale}/admin/bookings`}
              className="font-body text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="space-y-3">
            {pending.map((b) => (
              <BookingRow key={b.ref} booking={b} locale={locale} />
            ))}
          </div>
        </section>
      )}

      {/* ── Seasonal pricing ── */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-heading text-xl font-semibold text-forest-900">
            Seasonal Pricing Rules
          </h2>
          <button
            onClick={() => { setEditingRuleId(null); setShowRuleForm((v) => !v); }}
            className="flex items-center gap-1.5 font-body text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            <PlusCircle className="w-4 h-4" /> Add rule
          </button>
        </div>

        {showRuleForm && (
          <form onSubmit={submitRule} className="bg-white border border-blue-200 rounded-2xl p-5 mb-4 space-y-4">
            <h3 className="font-heading text-base font-semibold text-forest-900">
              {editingRuleId ? 'Edit Rule' : 'New Seasonal Rule'}
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="font-body text-xs font-semibold text-forest-600 uppercase tracking-wider block mb-1">Rule Name</label>
                <input
                  type="text"
                  required
                  value={ruleForm.name}
                  onChange={(e) => setRuleForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Tết Holiday, Peak Summer"
                  className="w-full font-body text-sm border border-cream-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-forest-600 uppercase tracking-wider block mb-1">Adjustment (%)</label>
                <input
                  type="number"
                  required
                  value={ruleForm.adjustmentPct}
                  onChange={(e) => setRuleForm((f) => ({ ...f, adjustmentPct: e.target.value }))}
                  placeholder="+20 surcharge / -10 discount"
                  className="w-full font-body text-sm border border-cream-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
                <p className="font-body text-[11px] text-forest-400 mt-0.5">
                  Positive = surcharge · Negative = discount
                </p>
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-forest-600 uppercase tracking-wider block mb-1">Start Date</label>
                <input
                  type="date"
                  required
                  value={ruleForm.startDate}
                  onChange={(e) => setRuleForm((f) => ({ ...f, startDate: e.target.value }))}
                  className="w-full font-body text-sm border border-cream-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="font-body text-xs font-semibold text-forest-600 uppercase tracking-wider block mb-1">End Date</label>
                <input
                  type="date"
                  required
                  value={ruleForm.endDate}
                  onChange={(e) => setRuleForm((f) => ({ ...f, endDate: e.target.value }))}
                  className="w-full font-body text-sm border border-cream-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
                />
              </div>
            </div>
            {/* Room selection */}
            <div>
              <label className="font-body text-xs font-semibold text-forest-600 uppercase tracking-wider block mb-2">Apply to rooms (leave empty = all rooms)</label>
              <div className="flex flex-wrap gap-2">
                {rooms.map((room) => {
                  const checked = ruleForm.roomIds.includes(room.id);
                  return (
                    <label
                      key={room.id}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border cursor-pointer font-body text-xs font-medium transition-colors ${
                        checked
                          ? 'bg-blue-600 border-blue-600 text-white'
                          : 'bg-white border-cream-300 text-forest-700 hover:border-blue-400'
                      }`}
                    >
                      <input
                        type="checkbox"
                        className="sr-only"
                        checked={checked}
                        onChange={() =>
                          setRuleForm((f) => ({
                            ...f,
                            roomIds: checked
                              ? f.roomIds.filter((id) => id !== room.id)
                              : [...f.roomIds, room.id],
                          }))
                        }
                      />
                      #{room.roomNumber} {room.nameEn}
                    </label>
                  );
                })}
              </div>
            </div>
            <div className="flex gap-2 pt-1">
              <button type="submit" className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white font-body text-sm font-semibold rounded-xl transition-colors">
                {editingRuleId ? 'Save Changes' : 'Add Rule'}
              </button>
              <button
                type="button"
                onClick={() => { setShowRuleForm(false); setEditingRuleId(null); }}
                className="px-5 py-2 border border-cream-300 text-forest-600 font-body text-sm font-medium rounded-xl hover:bg-cream-100 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {seasonalRules.length === 0 ? (
          <div className="bg-white rounded-2xl border border-cream-200 p-6 text-center">
            <p className="font-body text-sm text-forest-400">No seasonal rules yet. Add one to adjust pricing for holidays, peak seasons, or special events.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {seasonalRules.map((rule) => {
              const pct = rule.adjustmentPct;
              return (
                <div key={rule.id} className="bg-white rounded-xl border border-cream-200 px-5 py-4 flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-heading text-sm font-bold flex-shrink-0 ${
                    pct > 0 ? 'bg-rose-50 text-rose-600' : 'bg-green-50 text-green-600'
                  }`}>
                    {pct > 0 ? `+${pct}` : pct}%
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-sm font-semibold text-forest-900">{rule.name}</p>
                    <p className="font-body text-xs text-forest-400">
                      {fmtDate(rule.startDate)} → {fmtDate(rule.endDate)}
                      {rule.roomIds.length > 0
                        ? ` · Rooms: ${rule.roomIds.map((id) => rooms.find((r) => r.id === id)?.roomNumber).join(', ')}`
                        : ' · All rooms'}
                    </p>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <button onClick={() => startEditRule(rule.id)} className="w-8 h-8 rounded-lg border border-cream-300 flex items-center justify-center text-forest-400 hover:text-blue-600 hover:border-blue-400 transition-colors">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => removeSeasonalRule(rule.id)} className="w-8 h-8 rounded-lg border border-cream-300 flex items-center justify-center text-forest-400 hover:text-red-500 hover:border-red-400 transition-colors">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ── Change PIN ── */}
      <section>
        <h2 className="font-heading text-xl font-semibold text-forest-900 mb-4">Security</h2>
        <div className="bg-white rounded-2xl border border-cream-200 p-5 max-w-sm">
          <p className="font-body text-sm text-forest-600 mb-3">Change your admin PIN</p>
          <form onSubmit={handleChangePin} className="flex gap-2">
            <input
              type="password"
              value={newPin}
              onChange={(e) => setNewPin(e.target.value)}
              placeholder="New PIN (min 4 chars)"
              minLength={4}
              className="flex-1 font-body text-sm border border-cream-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500"
            />
            <button
              type="submit"
              className="px-4 py-2 bg-forest-900 hover:bg-forest-800 text-white font-body text-sm font-semibold rounded-xl transition-colors"
            >
              {pinSaved ? '✓ Saved' : 'Save'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({
  label, value, icon: Icon, color,
}: { label: string; value: string; icon: React.ElementType; color: string }) {
  return (
    <div className="bg-white rounded-2xl border border-cream-200 p-5">
      <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5" />
      </div>
      <p className="font-heading text-2xl font-semibold text-forest-900">{value}</p>
      <p className="font-body text-xs text-forest-400 mt-0.5">{label}</p>
    </div>
  );
}

function BookingRow({ booking: b, locale }: { booking: ReturnType<typeof useAdminStore.getState>['bookings'][0]; locale: string }) {
  const Icon = STATUS_ICON[b.status];
  return (
    <Link
      href={`/${locale}/admin/bookings`}
      className="flex items-center gap-4 bg-white rounded-xl border border-cream-200 px-5 py-4 hover:border-blue-200 hover:shadow-sm transition-all"
    >
      <div className="w-12 h-12 rounded-xl bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
        <span className="font-mono text-sm font-bold text-amber-700">{b.ref}</span>
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-body text-sm font-semibold text-forest-900">{b.fullName}</p>
        <p className="font-body text-xs text-forest-400">
          Room {b.roomNumber} {b.roomName} · {b.nights} night{b.nights !== 1 ? 's' : ''} · {b.checkIn}
        </p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className="font-heading text-base font-semibold text-forest-900">{b.total.toLocaleString()}đ</p>
        <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${STATUS_STYLE[b.status]}`}>
          {b.status}
        </span>
      </div>
    </Link>
  );
}
