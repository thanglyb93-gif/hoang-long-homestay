'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { Users, Maximize2, BedDouble, Wifi, Wind, Droplets, Package, CheckCircle2, XCircle, ArrowRight, Zap, Coffee, Layers, Monitor, BookOpen, Armchair, Ban, KeyRound, WashingMachine } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { isRoomAvailable } from '@/lib/availability';
import { usePricingStore, ROOM_PRICE_KEY } from '@/lib/pricing-store';
import { useImageStore } from '@/lib/image-store';
import { roundToNearestHundredThousand } from '@/lib/utils/round-price';
import type { Room } from '@/lib/rooms';
import RoomDetailModal from './RoomDetailModal';

interface Props {
  room: Room;
  checkIn?: string;
  checkOut?: string;
}

const AMENITY_ICONS: Record<string, React.ElementType> = {
  'WiFi':           Wifi,
  'AC':             Wind,
  'Hot water':      Droplets,
  'Private bathroom': Droplets,
  'Hair dryer':     Zap,
  'Iron':           Layers,
  'Kettle':         Coffee,
  'Microwave':      Package,
  'TV':             Monitor,
  'Desk':           BookOpen,
  'Chair':          Armchair,
  'Non-smoking':    Ban,
  'Self check-in':  KeyRound,
  'Washing machine': WashingMachine,
};

type DescKey = 'green_mountain' | 'ban_flower' | 'family_room' | 'deluxe';
const DESC_KEY_MAP: Record<string, DescKey> = {
  'green-mountain': 'green_mountain',
  'ban-flower':     'ban_flower',
  'family-room':    'family_room',
  'deluxe':         'deluxe',
};

// Full gradient class strings — required as static strings for Tailwind JIT
function getGradientClass(id: string): string {
  const map: Record<string, string> = {
    'green-mountain': 'bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900',
    'ban-flower':     'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-50',
    'family-room':    'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900',
    'deluxe':         'bg-gradient-to-br from-blue-400 via-indigo-600 to-blue-900',
  };
  return map[id] ?? 'bg-gradient-to-br from-blue-800 to-blue-900';
}

function getTextStyle(id: string): { badge: string; accent: string; price: string } {
  const map: Record<string, { badge: string; accent: string; price: string }> = {
    'green-mountain': { badge: 'bg-black/30 text-white',         accent: 'text-blue-200',  price: 'text-forest' },
    'ban-flower':     { badge: 'bg-white/70 text-blue-700',      accent: 'text-blue-500',  price: 'text-blue-700' },
    'family-room':    { badge: 'bg-black/30 text-white',         accent: 'text-blue-100',  price: 'text-forest' },
    'deluxe':         { badge: 'bg-black/30 text-white',         accent: 'text-sky-200',   price: 'text-forest' },
  };
  return map[id] ?? { badge: 'bg-black/30 text-white', accent: 'text-white', price: 'text-forest' };
}

function amenityKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
}

export default function RoomCard({ room, checkIn, checkOut }: Props) {
  const t        = useTranslations('rooms');
  const tDesc    = useTranslations('room_descriptions');
  const tAmenity = useTranslations('amenities');
  const router  = useRouter();
  const params  = useParams();
  const locale  = params.locale as string;
  const { setSelectedRoom } = useBookingStore();

  const [modalOpen, setModalOpen] = useState(false);

  // Hero image from image store
  const { images: roomImages } = useImageStore();
  const heroImage = (roomImages[room.id] ?? [])[0] ?? null;

  // Live prices from pricing store
  const { prices, activeSeasonalMultiplier, seasonalLabel } = usePricingStore();
  const priceKey    = ROOM_PRICE_KEY[room.id];
  const basePrice   = priceKey ? prices[priceKey] : room.pricePerNight;
  const isSeasonal  = activeSeasonalMultiplier !== 1.0;
  const seasonalPrice = isSeasonal
    ? roundToNearestHundredThousand(Math.round(basePrice * activeSeasonalMultiplier))
    : null;
  const displayPrice = seasonalPrice ?? basePrice;

  const gradient   = getGradientClass(room.id);
  const textStyle  = getTextStyle(room.id);
  const descKey    = DESC_KEY_MAP[room.id];
  // Fall back to room.description for placeholder rooms not in i18n map
  const description = descKey ? tDesc(descKey) : room.description;

  // Availability badge — only shown when dates are provided
  const available = checkIn && checkOut
    ? isRoomAvailable(room.id, new Date(checkIn), new Date(checkOut))
    : null;

  // Show first 4 amenities as pills; the rest as "+N more"
  const visibleAmenities = room.amenities.slice(0, 4);
  const extraCount       = room.amenities.length - visibleAmenities.length;

  function handleBook() {
    setSelectedRoom(room);
    router.push(`/${locale}/booking`);
  }

  return (
    <>
      <article className="group bg-white border border-cream-300/80 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:shadow-forest/8 hover:-translate-y-1 transition-all duration-300 flex flex-col md:flex-row">

        {/* ── Image panel ── */}
        <div className={`relative flex-shrink-0 w-full md:w-[38%] min-h-[220px] md:min-h-0 ${gradient} overflow-hidden`}>
            {heroImage ? (
            /* Real room photo */
            <Image
              src={heroImage}
              alt={room.nameEn}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 40vw"
            />
          ) : (
            /* Placeholder until photos are uploaded */
            <>
              <Image
                src="/images/placeholder-room.svg"
                alt={room.nameEn}
                fill
                unoptimized
                className="object-cover opacity-10 mix-blend-overlay"
              />
              <div className="absolute inset-0 hero-pattern opacity-15" />
            </>
          )}

          {/* Room number watermark — only shown when no real photo */}
          {!heroImage && (
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
              <span className={`font-heading text-[88px] font-light leading-none opacity-10 ${textStyle.accent}`}>
                {room.roomNumber}
              </span>
            </div>
          )}

          {/* Gradient scrim so text stays readable over real photos */}
          {heroImage && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-black/30 pointer-events-none" />
          )}

          {/* Top badges row */}
          <div className="absolute top-4 left-4 right-4 flex items-start justify-between gap-2">
            <div className="flex flex-col gap-1.5">
              <span className={`font-body text-xs font-semibold tracking-wide px-2.5 py-1 rounded-full backdrop-blur-sm ${textStyle.badge}`}>
                {room.type}
              </span>
              <span className={`font-mono text-[11px] font-bold tracking-[0.15em] opacity-70 pl-0.5 ${textStyle.accent}`}>
                #{room.roomNumber}
              </span>
            </div>

            {available !== null && (
              available ? (
                <span className="flex items-center gap-1 font-body text-xs font-semibold bg-blue-500/90 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <CheckCircle2 className="w-3 h-3" />
                  {t('available_badge')}
                </span>
              ) : (
                <span className="flex items-center gap-1 font-body text-xs font-semibold bg-slate-600/90 text-white px-2.5 py-1 rounded-full backdrop-blur-sm">
                  <XCircle className="w-3 h-3" />
                  {t('unavailable_badge')}
                </span>
              )
            )}
          </div>

          {/* Price badge at bottom of image */}
          <div className="absolute bottom-4 right-4 text-right">
            {isSeasonal && (
              <span className="block font-heading text-base font-normal text-white/40 line-through leading-none mb-0.5">
                {(basePrice / 1000).toFixed(0)}k
              </span>
            )}
            <span className={`font-heading text-3xl font-semibold ${isSeasonal ? 'text-amber-300' : textStyle.accent}`}>
              {(displayPrice / 1000).toFixed(0)}k
            </span>
            <span className="block font-body text-xs text-white/50">đ{t('per_night')}</span>
            {isSeasonal && (
              <span className="block font-body text-[10px] text-amber-300/80 mt-0.5 leading-none">
                {seasonalLabel}
              </span>
            )}
          </div>
        </div>

        {/* ── Content panel ── */}
        <div className="flex flex-col flex-1 p-6 md:p-7">

          {/* Room name */}
          <div className="mb-4">
            <h2 className="font-heading text-3xl font-semibold text-forest-900 leading-tight">
              {room.nameVi}
            </h2>
            <p className="font-body text-forest-500/70 text-sm mt-0.5">{room.nameEn}</p>
          </div>

          {/* Stats row */}
          <div className="flex flex-wrap items-center gap-4 mb-4 pb-4 border-b border-cream-300/60">
            <span className="flex items-center gap-1.5 font-body text-xs text-forest-600">
              <Maximize2 className="w-3.5 h-3.5 text-forest-400" />
              {room.sizeSqm}m²
            </span>
            <span className="flex items-center gap-1.5 font-body text-xs text-forest-600">
              <BedDouble className="w-3.5 h-3.5 text-forest-400" />
              {room.bed}
            </span>
            <span className="flex items-center gap-1.5 font-body text-xs text-forest-600">
              <Users className="w-3.5 h-3.5 text-forest-400" />
              {t('max_guests_label')} {room.maxGuests}
            </span>
          </div>

          {/* Description */}
          <p className="font-body text-forest-700/80 text-sm leading-relaxed mb-4 line-clamp-2">
            {description}
          </p>

          {/* Amenity pills */}
          <div className="flex flex-wrap gap-1.5 mb-5">
            {visibleAmenities.map((amenity) => {
              const Icon = AMENITY_ICONS[amenity];
              return (
                <span
                  key={amenity}
                  className="flex items-center gap-1 font-body text-xs text-forest-600 bg-cream-100 border border-cream-300/70 px-2.5 py-1 rounded-full"
                >
                  {Icon && <Icon className="w-3 h-3 text-forest-400" />}
                  {tAmenity(amenityKey(amenity))}
                </span>
              );
            })}
            {extraCount > 0 && (
              <span className="font-body text-xs text-forest-400 italic px-1 py-1">
                {t('more_amenities', { count: extraCount })}
              </span>
            )}
          </div>

          {/* Price + CTAs */}
          <div className="mt-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-4 border-t border-cream-300/60">
            <div>
              {isSeasonal && (
                <span className="block font-heading text-base font-normal text-forest-400/50 line-through leading-none mb-0.5">
                  {basePrice.toLocaleString()}đ
                </span>
              )}
              <div className="flex items-baseline gap-1.5 flex-wrap">
                <span className={`font-heading text-2xl font-semibold ${isSeasonal ? 'text-amber-600' : textStyle.price}`}>
                  {displayPrice.toLocaleString()}đ
                </span>
                <span className="font-body text-sm text-forest-400">{t('per_night')}</span>
                {isSeasonal && (
                  <span className="font-body text-[11px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    {seasonalLabel}
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2.5">
              <button
                onClick={() => setModalOpen(true)}
                className="flex-1 sm:flex-none font-body text-sm font-medium text-forest-700 border border-forest-200 hover:border-forest-400 hover:bg-forest-50 active:scale-95 px-4 py-2.5 rounded-xl transition-all duration-200"
              >
                {t('view_details')}
              </button>
              <button
                onClick={handleBook}
                disabled={available === false}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 font-body text-sm font-semibold bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed active:scale-95 text-white px-5 py-2.5 rounded-xl transition-all duration-200 hover:shadow-md hover:shadow-blue-600/25"
              >
                {t('book_this_room')}
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </article>

      <RoomDetailModal
        room={room}
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
