import { getTranslations } from 'next-intl/server';
import Link from 'next/link';
import { format } from 'date-fns';
import { CalendarDays, Users } from 'lucide-react';
import Navbar from '@/components/Navbar';
import RoomsFilterBar from '@/components/RoomsFilterBar';
import RoomsList from '@/components/RoomsList';
import FooterPricingInfo from '@/components/FooterPricingInfo';

interface Props {
  params: { locale: string };
  searchParams: {
    checkin?:  string;
    checkout?: string;
    guests?:   string;
    sort?:     string;
    capacity?: string;
  };
}

function formatDate(iso: string): string {
  try {
    return format(new Date(iso), 'd MMM yyyy');
  } catch {
    return iso;
  }
}

export default async function RoomsPage({ params, searchParams }: Props) {
  const t       = await getTranslations('rooms');
  const { locale }                                                = params;
  const { checkin, checkout, guests, sort = 'price_asc', capacity = '0' } = searchParams;

  const guestCount   = Math.max(1, parseInt(guests   ?? '1') || 1);
  const capacityMin  = Math.max(0, parseInt(capacity ?? '0') || 0);
  const checkInDate  = checkin  ? new Date(checkin)  : null;
  const checkOutDate = checkout ? new Date(checkout) : null;
  const hasDateFilter = !!(checkInDate && checkOutDate && checkInDate < checkOutDate);

  return (
    <div className="min-h-screen bg-white">
      <Navbar />

      {/* ── Page header ── */}
      <section className="pt-24 pb-12 px-5 sm:px-8 bg-forest-900 relative overflow-hidden">
        <div className="absolute inset-0 hero-pattern opacity-30" />
        <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-white to-transparent" />

        <div className="relative max-w-5xl mx-auto">
          <p className="font-body text-sky-300 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
            {t('page_eyebrow')}
          </p>
          <h1 className="font-heading text-5xl sm:text-6xl font-light text-white mb-3">
            {t('page_title')}
          </h1>
          <p className="font-body text-cream-300/70 text-base max-w-lg">
            {t('page_subtitle')}
          </p>
        </div>
      </section>

      {/* ── Availability banner (when searching by date) ── */}
      {hasDateFilter && (
        <div className="px-5 sm:px-8 -mt-1">
          <div className="max-w-5xl mx-auto">
            <div className="flex flex-wrap items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-5 py-3.5">
              <CalendarDays className="w-4 h-4 text-blue-600 flex-shrink-0" />
              <span className="font-body text-sm text-forest-800">
                <span className="font-semibold">{t('showing_from')}: </span>
                {formatDate(checkin!)}
                <span className="mx-1.5 text-forest-400">{t('showing_to')}</span>
                {formatDate(checkout!)}
              </span>
              <span className="flex items-center gap-1 font-body text-xs text-forest-500 bg-white border border-cream-300 px-2.5 py-1 rounded-full">
                <Users className="w-3 h-3" />
                {t('showing_guests', { count: guestCount })}
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── Filter bar + room list ── */}
      <section className="px-5 sm:px-8 py-10">
        <div className="max-w-5xl mx-auto">

          {/* Filter bar */}
          <div className="flex items-center justify-between flex-wrap gap-4 mb-8 pb-6 border-b border-cream-300">
            <RoomsFilterBar
              locale={locale}
              currentSort={sort}
              currentCapacity={capacity}
              checkin={checkin}
              checkout={checkout}
              guestCount={guests}
            />
          </div>

          {/* RoomsList is a client component — reads usePublicRooms() so newly
              activated rooms appear immediately without a server reload. */}
          <RoomsList
            sort={sort}
            capacityMin={capacityMin}
            checkIn={checkin}
            checkOut={checkout}
          />

        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-forest-900 border-t border-white/8 px-5 sm:px-8 py-8 mt-16">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <Link href={`/${locale}`} className="font-heading text-lg font-semibold text-white">
            Hoang Long Homestay
          </Link>
          <FooterPricingInfo />
          <div className="flex items-center gap-5">
            {(['vi', 'en', 'zh', 'ko', 'ja'] as const).map((l) => (
              <Link
                key={l}
                href={`/${l}/rooms`}
                className={`font-body text-xs font-medium transition-colors ${
                  l === locale ? 'text-sky-300' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
