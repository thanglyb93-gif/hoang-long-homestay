'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ArrowRight, Wifi, Wind, Droplets } from 'lucide-react';
import { activeRooms } from '@/lib/rooms';
import { usePricingStore, ROOM_PRICE_KEY } from '@/lib/pricing-store';
import { roundToNearestHundredThousand } from '@/lib/utils/round-price';

const ROOM_THEMES: Record<string, { from: string; to: string; accent: string }> = {
  'green-mountain': { from: 'from-blue-900', to: 'to-slate-900',  accent: 'text-blue-200' },
  'ban-flower':     { from: 'from-sky-100',  to: 'to-indigo-50',  accent: 'text-blue-500' },
  'family-room':    { from: 'from-blue-600', to: 'to-blue-900',   accent: 'text-blue-100' },
  'deluxe':         { from: 'from-blue-400', to: 'to-indigo-700', accent: 'text-sky-200'  },
};

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi':      <Wifi className="w-3.5 h-3.5" />,
  'AC':        <Wind className="w-3.5 h-3.5" />,
  'Hot water': <Droplets className="w-3.5 h-3.5" />,
};

function amenityKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
}

export default function HomeRoomsPreview() {
  const t      = useTranslations();
  const params = useParams();
  const locale = params.locale as string;
  const { prices, activeSeasonalMultiplier, seasonalLabel } = usePricingStore();

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {activeRooms.map((room) => {
          const theme       = ROOM_THEMES[room.id] ?? ROOM_THEMES['deluxe'];
          const priceKey    = ROOM_PRICE_KEY[room.id];
          const basePrice   = priceKey ? prices[priceKey] : room.pricePerNight;
          const isSeasonal  = activeSeasonalMultiplier !== 1.0;
          const displayPrice = isSeasonal
            ? roundToNearestHundredThousand(Math.round(basePrice * activeSeasonalMultiplier))
            : basePrice;
          const topAmenities = room.amenities.slice(0, 3);

          return (
            <div
              key={room.id}
              className="group bg-forest-800/60 border border-white/8 rounded-2xl overflow-hidden hover:border-sky-400/30 hover:shadow-xl hover:shadow-black/30 transition-all duration-400 flex flex-col"
            >
              <div className={`relative h-44 bg-gradient-to-br ${theme.from} ${theme.to} flex items-end p-4 overflow-hidden`}>
                <div className="absolute inset-0 hero-pattern opacity-30" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  <span className={`font-heading text-[72px] font-light leading-none opacity-10 ${theme.accent}`}>
                    {room.roomNumber}
                  </span>
                </div>
                <div className="relative z-10 flex flex-col gap-1">
                  <span className="font-body text-xs font-semibold tracking-wide px-2.5 py-1 rounded-full bg-black/30 text-white/90 backdrop-blur-sm w-fit">
                    {room.type}
                  </span>
                  <span className={`font-mono text-[10px] font-bold tracking-[0.15em] opacity-60 pl-0.5 ${theme.accent}`}>
                    #{room.roomNumber}
                  </span>
                </div>
                <div className="absolute top-4 right-4 text-right">
                  {isSeasonal && (
                    <span className="block font-heading text-sm text-white/40 line-through leading-none mb-0.5">
                      {(basePrice / 1000).toFixed(0)}k
                    </span>
                  )}
                  <span className={`font-heading text-2xl font-semibold ${isSeasonal ? 'text-amber-300' : theme.accent}`}>
                    {(displayPrice / 1000).toFixed(0)}k
                  </span>
                  <span className="font-body text-white/60 text-xs block">đ/{t('rooms.per_night')}</span>
                  {isSeasonal && (
                    <span className="block font-body text-[10px] text-amber-300/80 mt-0.5">{seasonalLabel}</span>
                  )}
                </div>
              </div>

              <div className="flex flex-col flex-1 p-5">
                <h3 className="font-heading text-xl font-semibold text-white mb-0.5">{room.nameVi}</h3>
                <p className="font-body text-cream-400 text-xs mb-3">{room.nameEn}</p>
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {topAmenities.map((a) => (
                    <span key={a} className="flex items-center gap-1 font-body text-xs text-white/60 bg-white/8 px-2 py-0.5 rounded-full">
                      {AMENITY_ICONS[a] ?? null}
                      {t(`amenities.${amenityKey(a)}`)}
                    </span>
                  ))}
                </div>
                <div className="mt-auto">
                  <Link
                    href={`/${locale}/rooms`}
                    className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-white/25 text-white/80 font-body text-sm font-medium hover:bg-white/10 hover:border-white/50 transition-all duration-200 group-hover:border-sky-400/50 group-hover:text-sky-200"
                  >
                    {t('rooms.view_details')}
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="text-center mt-10">
        <Link
          href={`/${locale}/rooms`}
          className="inline-flex items-center gap-2 font-body text-sm font-medium text-sky-300 hover:text-sky-200 transition-colors"
        >
          {t('features.view_all_rooms')}
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>
    </>
  );
}