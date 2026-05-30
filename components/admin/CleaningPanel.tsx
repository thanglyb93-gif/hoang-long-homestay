'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import {
  Sparkles, CheckCircle2, Circle, Clock, AlertTriangle,
  RotateCcw, Check, ChevronDown, ChevronUp, MessageSquare,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { useImageStore } from '@/lib/image-store';
import { useCleaningStore, CLEANING_TASKS } from '@/lib/cleaning-store';
import { useAllRooms, useRoomStore } from '@/lib/room-store';

const GRADIENTS: Record<string, string> = {
  'green-mountain': 'from-blue-900 to-slate-900',
  'ban-flower':     'from-sky-200 to-indigo-100',
  'family-room':    'from-blue-600 to-blue-900',
  'deluxe':         'from-blue-400 to-indigo-700',
};
const DEFAULT_GRADIENT = 'from-slate-700 to-slate-900';

function todayStr() { return new Date().toISOString().slice(0, 10); }
function addDays(dateStr: string, n: number): string {
  const d = new Date(dateStr + 'T00:00:00');
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function fmtDate(iso: string) {
  return new Date(iso + 'T00:00:00').toLocaleDateString('en-GB', {
    weekday: 'short', day: 'numeric', month: 'short',
  });
}
function fmtTs(iso: string) {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

type CleaningUrgency = 'today' | 'tomorrow' | 'soon' | 'none';

function getUrgency(checkOutDate: string | null): CleaningUrgency {
  if (!checkOutDate) return 'none';
  const today    = todayStr();
  const tomorrow = addDays(today, 1);
  if (checkOutDate === today)              return 'today';
  if (checkOutDate === tomorrow)           return 'tomorrow';
  if (checkOutDate <= addDays(today, 3))   return 'soon';
  return 'none';
}

const URGENCY_STYLES: Record<CleaningUrgency, { bg: string; badge: string; text: string; icon: React.ElementType }> = {
  today:    { bg: 'bg-red-900/30 border-red-700/50',     badge: 'bg-red-500 text-white',        text: 'text-red-300',   icon: AlertTriangle },
  tomorrow: { bg: 'bg-amber-900/30 border-amber-700/50', badge: 'bg-amber-500 text-amber-950',  text: 'text-amber-300', icon: Clock },
  soon:     { bg: 'bg-blue-900/20 border-blue-700/30',   badge: 'bg-blue-700 text-blue-100',    text: 'text-blue-300',  icon: Clock },
  none:     { bg: 'bg-[#111827] border-slate-700',        badge: 'bg-slate-700 text-slate-300', text: 'text-slate-400', icon: Sparkles },
};

function RoomCard({ room }: { room: { id: string; nameEn: string; roomNumber: string } }) {
  const today = todayStr();
  const { bookings } = useAdminStore();
  const { images }   = useImageStore();
  const {
    rooms: cleaningRooms, toggleTask, markAllDone, markCleaned, resetTasks, updateNote,
  } = useCleaningStore();

  const [expanded, setExpanded] = useState(false);

  const nextCheckout: string | null = useMemo(() => {
    const upcoming = bookings
      .filter((b) => b.roomId === room.id && b.status === 'confirmed' && b.checkOut >= today)
      .sort((a, b) => a.checkOut.localeCompare(b.checkOut));
    return upcoming[0]?.checkOut ?? null;
  }, [bookings, room.id, today]);

  const nextGuest: string | null = useMemo(() => {
    if (!nextCheckout) return null;
    return bookings.find(
      (b) => b.roomId === room.id && b.status === 'confirmed' && b.checkOut === nextCheckout
    )?.fullName ?? null;
  }, [bookings, nextCheckout, room.id]);

  const urgency    = getUrgency(nextCheckout);
  const style      = URGENCY_STYLES[urgency];
  const UrgencyIcon = style.icon;
  const gradient   = GRADIENTS[room.id] ?? DEFAULT_GRADIENT;

  const record     = cleaningRooms[room.id];
  const statuses   = record?.taskStatuses ?? CLEANING_TASKS.map((t) => ({ taskId: t.id, done: false }));
  const doneCount  = statuses.filter((s) => s.done).length;
  const totalTasks = CLEANING_TASKS.length;
  const allDone    = doneCount === totalTasks;
  const note       = record?.note ?? '';
  const lastCleaned= record?.lastCleanedAt ?? null;

  const heroImg = (images[room.id] ?? [])[0] ?? null;

  return (
    <div className={`rounded-2xl border overflow-hidden ${style.bg}`}>
      <div className={`relative h-24 bg-gradient-to-br ${gradient} overflow-hidden flex-shrink-0`}>
        {heroImg && (
          <Image src={heroImg} alt={room.nameEn} fill className="object-cover opacity-50" sizes="400px" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
        <div className="absolute inset-0 p-4 flex items-end justify-between">
          <div>
            <p className="price-mono text-white/60 text-[10px] font-semibold tracking-widest uppercase">Room {room.roomNumber}</p>
            <h3 className="price-mono text-white text-xl font-bold">{room.nameEn}</h3>
          </div>
          <div className="text-right">
            {urgency !== 'none' && nextCheckout ? (
              <div>
                <p className="font-body text-white/50 text-[10px]">Checkout</p>
                <p className="price-mono text-white text-sm font-bold">{fmtDate(nextCheckout)}</p>
                {nextGuest && <p className="font-body text-white/50 text-[10px] truncate max-w-[100px]">{nextGuest}</p>}
              </div>
            ) : (
              <p className="font-body text-white/40 text-xs">No upcoming checkout</p>
            )}
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <UrgencyIcon className={`w-4 h-4 ${style.text}`} />
            <span className={`font-body text-sm font-semibold ${style.text}`}>
              {urgency === 'today'    ? 'Clean today!'
               : urgency === 'tomorrow' ? 'Clean tomorrow'
               : urgency === 'soon'     ? 'Clean in ≤3 days'
               :                          'No rush'}
            </span>
          </div>
          <span className={`font-body text-xs font-bold px-2.5 py-1 rounded-full ${style.badge}`}>
            {doneCount}/{totalTasks} tasks
          </span>
        </div>

        <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-500 ${allDone ? 'bg-green-500' : urgency === 'today' ? 'bg-red-500' : urgency === 'tomorrow' ? 'bg-amber-500' : 'bg-blue-500'}`}
            style={{ width: `${Math.round((doneCount / totalTasks) * 100)}%` }}
          />
        </div>

        {lastCleaned && (
          <p className="font-body text-xs text-slate-500">Last cleaned: {fmtTs(lastCleaned)}</p>
        )}

        <button
          onClick={() => setExpanded((o) => !o)}
          className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-slate-800/50 hover:bg-slate-800 transition-colors"
        >
          <span className="font-body text-sm text-slate-300 font-medium">Cleaning Checklist</span>
          {expanded ? <ChevronUp className="w-4 h-4 text-slate-500" /> : <ChevronDown className="w-4 h-4 text-slate-500" />}
        </button>

        {expanded && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              {CLEANING_TASKS.map((task) => {
                const status = statuses.find((s) => s.taskId === task.id);
                const done   = status?.done ?? false;
                return (
                  <button
                    key={task.id}
                    onClick={() => toggleTask(room.id, task.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-all text-left ${
                      done
                        ? 'bg-green-900/20 border-green-700/40 text-green-300'
                        : 'bg-[#0b1120] border-slate-700 text-slate-300 hover:border-slate-500'
                    }`}
                  >
                    {done
                      ? <CheckCircle2 className="w-4 h-4 text-green-400 flex-shrink-0" />
                      : <Circle       className="w-4 h-4 text-slate-600 flex-shrink-0" />
                    }
                    <span className={`font-body text-sm ${done ? 'line-through opacity-60' : ''}`}>
                      {task.label}
                    </span>
                  </button>
                );
              })}
            </div>

            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <MessageSquare className="w-3 h-3 text-slate-500" />
                <span className="font-body text-xs text-slate-500 uppercase tracking-wider font-semibold">Note</span>
              </div>
              <textarea
                value={note}
                onChange={(e) => updateNote(room.id, e.target.value)}
                placeholder="Any special notes for this cleaning…"
                rows={2}
                className="w-full font-body text-sm bg-[#0b1120] border border-slate-700 focus:border-blue-500 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-700 outline-none transition-colors resize-none"
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => markAllDone(room.id)}
                disabled={allDone}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-blue-700 hover:bg-blue-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-body font-semibold text-sm rounded-xl transition-colors"
              >
                <Check className="w-4 h-4" /> Mark All Done
              </button>
              <button
                onClick={() => { if (confirm('Mark room as fully cleaned and reset checklist?')) markCleaned(room.id); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-green-600 hover:bg-green-500 text-white font-body font-semibold text-sm rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4" /> Room Clean ✓
              </button>
            </div>
            <button
              onClick={() => resetTasks(room.id)}
              className="w-full flex items-center justify-center gap-1.5 py-2 font-body text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Reset checklist
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default function CleaningPanel() {
  const today = todayStr();
  const { bookings } = useAdminStore();
  const { overrides } = useRoomStore();
  const allRooms = useAllRooms();

  // Show only active rooms (original 4 always shown, placeholders only when activated)
  const visibleRooms = allRooms.filter((r) => {
    const o = overrides[r.id];
    if (r.isPlaceholder) return o?.isActive === true;
    return o?.isActive !== false;
  });

  const urgencyToday = visibleRooms.filter((r) => {
    const next = bookings
      .filter((b) => b.roomId === r.id && b.status === 'confirmed' && b.checkOut >= today)
      .sort((a, b) => a.checkOut.localeCompare(b.checkOut))[0]?.checkOut ?? null;
    return next === today;
  }).length;

  const urgencyTomorrow = visibleRooms.filter((r) => {
    const next = bookings
      .filter((b) => b.roomId === r.id && b.status === 'confirmed' && b.checkOut >= today)
      .sort((a, b) => a.checkOut.localeCompare(b.checkOut))[0]?.checkOut ?? null;
    return next === addDays(today, 1);
  }).length;

  return (
    <div className="space-y-6">
      {(urgencyToday > 0 || urgencyTomorrow > 0) && (
        <div className={`rounded-2xl border px-5 py-4 flex items-center gap-3 ${
          urgencyToday > 0 ? 'bg-red-900/20 border-red-700/50' : 'bg-amber-900/20 border-amber-700/50'
        }`}>
          <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${urgencyToday > 0 ? 'text-red-400' : 'text-amber-400'}`} />
          <div>
            <p className={`price-mono font-bold text-sm ${urgencyToday > 0 ? 'text-red-300' : 'text-amber-300'}`}>
              {urgencyToday > 0
                ? `${urgencyToday} room${urgencyToday > 1 ? 's' : ''} need cleaning today!`
                : `${urgencyTomorrow} room${urgencyTomorrow > 1 ? 's' : ''} need cleaning tomorrow`}
            </p>
            <p className="font-body text-slate-400 text-xs mt-0.5">
              Reminder triggers automatically one day before checkout · extending stay overrides the date
            </p>
          </div>
        </div>
      )}

      {urgencyToday === 0 && urgencyTomorrow === 0 && (
        <div className="bg-green-900/10 border border-green-700/30 rounded-2xl px-5 py-4 flex items-center gap-3">
          <Sparkles className="w-5 h-5 text-green-400" />
          <p className="font-body text-green-300 text-sm font-semibold">
            All rooms up to date — no cleaning due in the next 48 hours
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {visibleRooms.map((room) => (
          <RoomCard key={room.id} room={room} />
        ))}
      </div>

      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-4">
        <p className="price-mono text-slate-500 text-xs font-semibold uppercase tracking-wider mb-3">Legend</p>
        <div className="flex flex-wrap gap-4">
          {[
            { color: 'bg-red-500',   label: 'Clean today — guest checks out today' },
            { color: 'bg-amber-500', label: 'Clean tomorrow — guest checks out tomorrow' },
            { color: 'bg-blue-500',  label: 'Within 3 days' },
            { color: 'bg-slate-700', label: 'No upcoming checkout' },
          ].map(({ color, label }) => (
            <span key={label} className="flex items-center gap-2 font-body text-xs text-slate-400">
              <span className={`w-3 h-3 rounded-full flex-shrink-0 ${color}`} />
              {label}
            </span>
          ))}
        </div>
        <p className="font-body text-slate-600 text-xs mt-3">
          ✦ If a guest extends their stay, the checkout date updates and this reminder resets automatically.
        </p>
      </div>
    </div>
  );
}