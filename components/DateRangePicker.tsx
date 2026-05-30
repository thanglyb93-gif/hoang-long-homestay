'use client';

import { useState, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { DateRange } from '@/lib/availability';

interface Props {
  checkIn:       Date | null;
  checkOut:      Date | null;
  onChange:      (checkIn: Date | null, checkOut: Date | null) => void;
  /** Just for legend display — does not affect blocking logic */
  roomId?:       string | null;
  /** Blocked date ranges for the selected room (built by the parent from admin store) */
  blockedRanges?: DateRange[];
}

// ─── Pure calendar helpers ───────────────────────────────────────────────────

function toDay(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate());
}

function sameDay(a: Date, b: Date): boolean {
  return toDay(a).getTime() === toDay(b).getTime();
}

function buildGrid(year: number, month: number): Array<Date | null> {
  const first = new Date(year, month, 1);
  const pad   = (first.getDay() + 6) % 7; // Mon=0 … Sun=6
  const days  = new Date(year, month + 1, 0).getDate();
  const grid: Array<Date | null> = [];

  for (let i = 0; i < pad; i++) grid.push(null);
  for (let d = 1; d <= days; d++) grid.push(new Date(year, month, d));
  while (grid.length % 7 !== 0) grid.push(null);

  return grid;
}

function isDateInRanges(date: Date, blocked: DateRange[]): boolean {
  const d = toDay(date);
  return blocked.some((r) => d >= toDay(r.start) && d < toDay(r.end));
}

function rangeHasBlocked(start: Date, end: Date, blocked: DateRange[]): boolean {
  const s = toDay(start), e = toDay(end);
  return blocked.some((r) => toDay(r.start) < e && toDay(r.end) > s);
}

function fmtMonthYear(year: number, month: number, locale: string): string {
  return new Intl.DateTimeFormat(locale, { month: 'long', year: 'numeric' })
    .format(new Date(year, month, 1));
}

const WEEKDAYS = ['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'];

// ─── Component ───────────────────────────────────────────────────────────────

export default function DateRangePicker({ checkIn, checkOut, onChange, roomId, blockedRanges }: Props) {
  const locale   = (useParams().locale as string) || 'en';
  const t        = useTranslations('datepicker');
  const todayRaw = new Date();
  const today    = toDay(todayRaw);

  const blocked = blockedRanges ?? [];

  const [viewYear,  setViewYear]  = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [hover,     setHover]     = useState<Date | null>(null);

  // second month
  const m2raw  = new Date(viewYear, viewMonth + 1, 1);
  const m2year = m2raw.getFullYear();
  const m2mon  = m2raw.getMonth();

  const canGoPrev = new Date(viewYear, viewMonth - 1, 1) >= new Date(today.getFullYear(), today.getMonth(), 1);

  function prevMon() {
    if (!canGoPrev) return;
    const p = new Date(viewYear, viewMonth - 1, 1);
    setViewYear(p.getFullYear()); setViewMonth(p.getMonth());
  }
  function nextMon() {
    const n = new Date(viewYear, viewMonth + 1, 1);
    setViewYear(n.getFullYear()); setViewMonth(n.getMonth());
  }

  const handleClick = useCallback((date: Date) => {
    const d = toDay(date);
    if (d < today) return;
    if (isDateInRanges(d, blocked)) return;

    if (!checkIn || (checkIn && checkOut)) {
      onChange(d, null);
    } else {
      if (d <= toDay(checkIn)) {
        onChange(d, null);
      } else {
        if (rangeHasBlocked(checkIn, d, blocked)) return;
        onChange(checkIn, d);
      }
    }
  }, [checkIn, checkOut, onChange, today, blocked]);

  const handleHover = useCallback((date: Date | null) => {
    if (!checkIn || checkOut || !date) { setHover(null); return; }
    const d = toDay(date);
    if (d > toDay(checkIn)) setHover(d);
    else setHover(null);
  }, [checkIn, checkOut]);

  // ── Render one calendar month ──────────────────────────────────────────────
  function renderMonth(year: number, month: number) {
    const grid        = buildGrid(year, month);
    const effectiveEnd = checkOut ?? hover ?? null;

    return (
      <div className="flex-1 min-w-0">
        <p className="text-center font-body text-sm font-semibold text-forest-900 mb-3 capitalize tracking-wide">
          {fmtMonthYear(year, month, locale)}
        </p>

        {/* Week headers */}
        <div className="grid grid-cols-7 mb-1">
          {WEEKDAYS.map((d) => (
            <div key={d} className="h-7 flex items-center justify-center font-body text-xs font-medium text-forest-400">
              {d}
            </div>
          ))}
        </div>

        {/* Day grid */}
        <div
          className="grid grid-cols-7"
          onMouseLeave={() => setHover(null)}
        >
          {grid.map((date, idx) => {
            if (!date) return <div key={idx} className="h-11" />;

            const d          = toDay(date);
            const isPast     = d < today;
            const isBlocked  = !isPast && isDateInRanges(d, blocked);
            const isStart    = !!(checkIn  && sameDay(d, checkIn));
            const isEnd      = !!(checkOut && sameDay(d, checkOut));
            const isHoverEnd = !checkOut && !!hover && sameDay(d, hover);
            const inRange    = !!(checkIn && effectiveEnd && d > toDay(checkIn) && d < toDay(effectiveEnd));
            const isDisabled = isPast || isBlocked;
            const isToday    = sameDay(d, today);

            const showStartConn = isStart && effectiveEnd && toDay(effectiveEnd) > toDay(checkIn!);
            const showEndConn   = (isEnd || isHoverEnd) && !!checkIn;

            return (
              <div
                key={idx}
                className="relative h-11 flex items-center justify-center"
                onMouseEnter={() => handleHover(date)}
              >
                {/* Range background strip */}
                {inRange && (
                  <div className={`absolute inset-y-1.5 left-0 right-0 ${checkOut ? 'bg-blue-100' : 'bg-blue-50'}`} />
                )}
                {/* Start right-half connector */}
                {showStartConn && (
                  <div className={`absolute inset-y-1.5 left-1/2 right-0 ${checkOut ? 'bg-blue-100' : 'bg-blue-50'}`} />
                )}
                {/* End left-half connector */}
                {showEndConn && (
                  <div className={`absolute inset-y-1.5 left-0 right-1/2 ${checkOut ? 'bg-blue-100' : 'bg-blue-50'}`} />
                )}

                <button
                  type="button"
                  disabled={isDisabled}
                  onClick={() => handleClick(date)}
                  onMouseEnter={() => handleHover(date)}
                  className={[
                    'relative z-10 w-9 h-9 rounded-full flex items-center justify-center font-body text-sm transition-all duration-150',
                    isStart || isEnd
                      ? 'bg-blue-600 text-white font-semibold shadow-sm'
                      : '',
                    isHoverEnd && !isEnd
                      ? 'bg-blue-400/70 text-white font-semibold'
                      : '',
                    inRange && !isStart && !isEnd
                      ? 'text-blue-800'
                      : '',
                    isDisabled
                      ? 'cursor-not-allowed'
                      : !isStart && !isEnd && !isHoverEnd
                        ? 'hover:bg-cream-300 cursor-pointer'
                        : '',
                    isPast    ? 'text-forest-200' : '',
                    isBlocked ? 'text-slate-300 line-through bg-slate-100 rounded-none' : '',
                    isToday && !isStart && !isEnd ? 'font-bold text-forest-900' : '',
                    !isStart && !isEnd && !inRange && !isPast && !isBlocked ? 'text-forest-800' : '',
                  ].filter(Boolean).join(' ')}
                >
                  {date.getDate()}
                  {isToday && !isStart && !isEnd && (
                    <span className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-blue-500" />
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="select-none">
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          onClick={prevMon}
          disabled={!canGoPrev}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-cream-300 disabled:opacity-25 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 text-forest-700" />
        </button>

        <span className="font-body text-xs text-forest-400 font-medium tracking-wider uppercase">
          {checkIn && !checkOut ? t('select_checkout') : t('select_dates')}
        </span>

        <button
          type="button"
          onClick={nextMon}
          className="w-8 h-8 rounded-full flex items-center justify-center hover:bg-cream-300 transition-colors"
        >
          <ChevronRight className="w-4 h-4 text-forest-700" />
        </button>
      </div>

      {/* Two months */}
      <div className="flex flex-col sm:flex-row gap-6 sm:gap-0 sm:divide-x sm:divide-cream-300">
        <div className="sm:pr-6">{renderMonth(viewYear, viewMonth)}</div>
        <div className="hidden sm:block sm:pl-6">{renderMonth(m2year, m2mon)}</div>
      </div>

      {/* Legend */}
      {(checkIn || checkOut || roomId) && (
        <div className="flex flex-wrap items-center gap-5 mt-5 pt-4 border-t border-cream-300/70">
          {(checkIn || checkOut) && (
            <>
              <span className="flex items-center gap-1.5 font-body text-xs text-forest-500">
                <span className="w-4 h-4 rounded-full bg-blue-600 inline-block" />
                {t('legend_selected')}
              </span>
              <span className="flex items-center gap-1.5 font-body text-xs text-forest-500">
                <span className="w-4 h-4 rounded bg-blue-100 border border-blue-200 inline-block" />
                {t('legend_range')}
              </span>
            </>
          )}
          {roomId && blocked.length > 0 && (
            <span className="flex items-center gap-1.5 font-body text-xs text-forest-500">
              <span className="w-4 h-4 flex items-center justify-center text-slate-300 line-through text-xs font-body">8</span>
              {t('legend_unavailable')}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
