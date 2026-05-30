'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CalendarDays, Users, Search } from 'lucide-react';

export default function AvailabilityChecker() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;

  const today    = new Date().toISOString().split('T')[0];
  const tomorrow = new Date(Date.now() + 86_400_000).toISOString().split('T')[0];

  const [checkIn,  setCheckIn]  = useState(today);
  const [checkOut, setCheckOut] = useState(tomorrow);
  const [guests,   setGuests]   = useState(2);
  const [error,    setError]    = useState('');

  function handleSearch() {
    if (!checkIn || !checkOut) {
      setError(t('availability.select_dates'));
      return;
    }
    if (checkIn >= checkOut) {
      setError(t('booking.checkout_after_checkin'));
      return;
    }
    setError('');
    const q = new URLSearchParams({ checkin: checkIn, checkout: checkOut, guests: String(guests) });
    router.push(`/${locale}/rooms?${q.toString()}`);
  }

  return (
    <div id="availability" className="relative z-20">
      {/* Card that overlaps the hero bottom */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 -mt-8 sm:-mt-10">
        <div className="bg-white rounded-2xl shadow-2xl shadow-forest-900/20 border border-cream-300/60 overflow-hidden">

          {/* Top accent bar */}
          <div className="h-1 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-800" />

          <div className="p-4 sm:p-7">
            <div className="flex flex-col sm:flex-row gap-4 items-end">

              {/* Check-in */}
              <div className="flex-1 min-w-0">
                <label className="flex items-center gap-1.5 font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {t('booking.check_in')}
                </label>
                <input
                  type="date"
                  value={checkIn}
                  min={today}
                  onChange={(e) => { setCheckIn(e.target.value); setError(''); }}
                  className="w-full font-body text-sm text-forest-900 bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors cursor-pointer"
                />
              </div>

              {/* Check-out */}
              <div className="flex-1 min-w-0">
                <label className="flex items-center gap-1.5 font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-2">
                  <CalendarDays className="w-3.5 h-3.5" />
                  {t('booking.check_out')}
                </label>
                <input
                  type="date"
                  value={checkOut}
                  min={checkIn || today}
                  onChange={(e) => { setCheckOut(e.target.value); setError(''); }}
                  className="w-full font-body text-sm text-forest-900 bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 min-h-[44px] focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors cursor-pointer"
                />
              </div>

              {/* Guests */}
              <div className="w-full sm:w-36 min-w-0">
                <label className="flex items-center gap-1.5 font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-2">
                  <Users className="w-3.5 h-3.5" />
                  {t('booking.guests')}
                </label>
                <div className="flex items-center bg-cream-50 border border-cream-300 rounded-xl overflow-hidden min-h-[44px]">
                  <button
                    onClick={() => setGuests((g) => Math.max(1, g - 1))}
                    className="px-3.5 py-3 min-h-[44px] text-forest-600 hover:bg-cream-300 active:bg-cream-400 transition-colors font-medium text-lg leading-none"
                    aria-label="Decrease guests"
                  >
                    −
                  </button>
                  <span className="flex-1 text-center font-body text-sm font-semibold text-forest-900">
                    {guests}
                  </span>
                  <button
                    onClick={() => setGuests((g) => Math.min(6, g + 1))}
                    className="px-3.5 py-3 min-h-[44px] text-forest-600 hover:bg-cream-300 active:bg-cream-400 transition-colors font-medium text-lg leading-none"
                    aria-label="Increase guests"
                  >
                    +
                  </button>
                </div>
              </div>

              {/* Search button */}
              <button
                onClick={handleSearch}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-body font-semibold text-sm tracking-wide px-7 py-3 min-h-[44px] rounded-xl transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5 whitespace-nowrap"
              >
                <Search className="w-4 h-4" />
                {t('availability.available')}
              </button>
            </div>

            {error && (
              <p className="mt-3 font-body text-sm text-blue-600 font-medium">{error}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
