'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SlidersHorizontal, X } from 'lucide-react';

interface Props {
  locale: string;
  currentSort: string;
  currentCapacity: string;
  checkin?: string;
  checkout?: string;
  guestCount?: string;
}

export default function RoomsFilterBar({
  locale,
  currentSort,
  currentCapacity,
  checkin,
  checkout,
  guestCount,
}: Props) {
  const t = useTranslations('rooms');
  const router = useRouter();

  function buildUrl(overrides: Record<string, string>) {
    const params = new URLSearchParams();
    if (checkin)    params.set('checkin',   checkin);
    if (checkout)   params.set('checkout',  checkout);
    if (guestCount) params.set('guests',    guestCount);
    params.set('sort',     currentSort);
    params.set('capacity', currentCapacity);
    Object.entries(overrides).forEach(([k, v]) => params.set(k, v));
    router.push(`/${locale}/rooms?${params.toString()}`);
  }

  function clearDates() {
    const params = new URLSearchParams();
    params.set('sort',     currentSort);
    params.set('capacity', currentCapacity);
    router.push(`/${locale}/rooms?${params.toString()}`);
  }

  const hasAvailabilityFilter = !!(checkin && checkout);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <SlidersHorizontal className="w-4 h-4 text-forest-400 flex-shrink-0" />

      {/* Sort */}
      <div className="flex items-center gap-2">
        <label className="font-body text-xs font-semibold text-forest-500 uppercase tracking-wider whitespace-nowrap">
          {t('sort_label')}
        </label>
        <select
          value={currentSort}
          onChange={(e) => buildUrl({ sort: e.target.value })}
          className="font-body text-sm text-forest-800 bg-white border border-cream-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors cursor-pointer"
        >
          <option value="price_asc">{t('sort_price_asc')}</option>
          <option value="price_desc">{t('sort_price_desc')}</option>
        </select>
      </div>

      {/* Capacity */}
      <div className="flex items-center gap-2">
        <label className="font-body text-xs font-semibold text-forest-500 uppercase tracking-wider whitespace-nowrap">
          {t('capacity_label')}
        </label>
        <select
          value={currentCapacity}
          onChange={(e) => buildUrl({ capacity: e.target.value })}
          className="font-body text-sm text-forest-800 bg-white border border-cream-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors cursor-pointer"
        >
          <option value="0">{t('capacity_any')}</option>
          <option value="1">{t('capacity_1')}</option>
          <option value="2">{t('capacity_2')}</option>
          <option value="3">{t('capacity_3')}</option>
          <option value="4">{t('capacity_4')}</option>
        </select>
      </div>

      {/* Clear dates badge */}
      {hasAvailabilityFilter && (
        <button
          onClick={clearDates}
          className="flex items-center gap-1.5 font-body text-xs font-medium text-blue-600 border border-blue-300 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-colors"
        >
          <X className="w-3 h-3" />
          {t('browse_all')}
        </button>
      )}
    </div>
  );
}
