'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter, useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { X, Users, Maximize2, BedDouble, Wifi, Wind, Droplets, Package, ArrowRight, Zap, Coffee, Layers, Monitor, BookOpen, Armchair, Ban, KeyRound, WashingMachine, ChevronLeft, ChevronRight } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { usePricingStore, ROOM_PRICE_KEY } from '@/lib/pricing-store';
import { useImageStore } from '@/lib/image-store';
import { roundToNearestHundredThousand } from '@/lib/utils/round-price';
import type { Room } from '@/lib/rooms';

interface Props {
  room: Room;
  isOpen: boolean;
  onClose: () => void;
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

// Gradient placeholders for each slot when no photos uploaded
function getGalleryVariants(id: string): string[] {
  const map: Record<string, string[]> = {
    'green-mountain': [
      'bg-gradient-to-br from-blue-800 to-blue-950',
      'bg-gradient-to-tl from-slate-700 to-blue-900',
      'bg-gradient-to-br from-blue-700 to-slate-900',
      'bg-gradient-to-bl from-blue-900 to-slate-800',
    ],
    'ban-flower': [
      'bg-gradient-to-br from-sky-100 to-blue-200',
      'bg-gradient-to-tl from-blue-50 to-sky-100',
      'bg-gradient-to-br from-indigo-50 to-blue-100',
      'bg-gradient-to-bl from-sky-50 to-indigo-100',
    ],
    'family-room': [
      'bg-gradient-to-br from-blue-500 to-blue-800',
      'bg-gradient-to-tl from-blue-600 to-blue-900',
      'bg-gradient-to-br from-blue-700 to-blue-950',
      'bg-gradient-to-bl from-blue-400 to-blue-700',
    ],
    'deluxe': [
      'bg-gradient-to-br from-blue-400 to-indigo-700',
      'bg-gradient-to-tl from-indigo-500 to-blue-800',
      'bg-gradient-to-br from-blue-500 to-indigo-900',
      'bg-gradient-to-bl from-indigo-400 to-blue-700',
    ],
  };
  return map[id] ?? ['bg-blue-800', 'bg-blue-900', 'bg-blue-950', 'bg-slate-800'];
}

function amenityKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
}

export default function RoomDetailModal({ room, isOpen, onClose }: Props) {
  const t        = useTranslations('rooms');
  const tDesc    = useTranslations('room_descriptions');
  const tAmenity = useTranslations('amenities');
  const router         = useRouter();
  const params         = useParams();
  const locale         = params.locale as string;
  const { setSelectedRoom } = useBookingStore();

  // Uploaded images
  const { images: roomImages } = useImageStore();
  const uploadedImages = roomImages[room.id] ?? [];

  // Build the image list: uploaded photos first, then gradient placeholders fill to 4
  const gradients = getGalleryVariants(room.id);
  const totalSlots = Math.max(uploadedImages.length, 4);
  const imageSlots: Array<{ type: 'photo'; url: string } | { type: 'gradient'; cls: string }> =
    Array.from({ length: totalSlots }, (_, i) => {
      if (i < uploadedImages.length) return { type: 'photo', url: uploadedImages[i] };
      return { type: 'gradient', cls: gradients[i] ?? gradients[0] };
    });

  // Active image index for the hero viewer
  const [activeIdx, setActiveIdx] = useState(0);

  // Reset active index when room changes or modal opens
  useEffect(() => { if (isOpen) setActiveIdx(0); }, [isOpen, room.id]);

  // Live prices from pricing store
  const { prices, activeSeasonalMultiplier, seasonalLabel } = usePricingStore();
  const priceKey      = ROOM_PRICE_KEY[room.id];
  const basePrice     = priceKey ? prices[priceKey] : room.pricePerNight;
  const isSeasonal    = activeSeasonalMultiplier !== 1.0;
  const seasonalPrice = isSeasonal
    ? roundToNearestHundredThousand(Math.round(basePrice * activeSeasonalMultiplier))
    : null;
  const displayPrice  = seasonalPrice ?? basePrice;

  const descKey    = DESC_KEY_MAP[room.id];
  // Fall back to room.description for rooms not in the i18n map
  const description = descKey ? tDesc(descKey) : room.description;

  // Track client-side mount so createPortal is never called during SSR
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Escape key + scroll lock
  useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleArrows = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') setActiveIdx((i) => Math.min(i + 1, imageSlots.length - 1));
      if (e.key === 'ArrowLeft')  setActiveIdx((i) => Math.max(i - 1, 0));
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('keydown', handleArrows);
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('keydown', handleArrows);
      document.body.style.overflow = '';
    };
  }, [isOpen, onClose, imageSlots.length]);

  if (!isOpen || !mounted) return null;

  function handleBook() {
    setSelectedRoom(room);
    onClose();
    router.push(`/${locale}/booking`);
  }

  const activeSlot = imageSlots[activeIdx];

  return createPortal(
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6"
      role="dialog"
      aria-modal="true"
      aria-label={room.nameVi}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-forest-900/75 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Panel */}
      <div className="relative w-full max-w-3xl max-h-[92vh] bg-cream-50 rounded-2xl shadow-2xl overflow-hidden flex flex-col">

        {/* ── Hero image viewer ── */}
        <div className="relative flex-shrink-0 aspect-[16/9] bg-slate-900">

          {/* Main image */}
          {activeSlot.type === 'photo' ? (
            <Image
              src={activeSlot.url}
              alt={`${room.nameEn} — photo ${activeIdx + 1}`}
              fill
              className="object-cover"
              sizes="(max-width:768px) 100vw, 768px"
              priority
            />
          ) : (
            <div className={`absolute inset-0 ${activeSlot.cls}`}>
              <Image
                src="/images/placeholder-room.svg"
                alt={room.nameEn}
                fill
                unoptimized
                className="object-cover opacity-15 mix-blend-overlay"
              />
              <div className="absolute inset-0 hero-pattern opacity-10" />
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="font-mono text-7xl font-bold text-white/10 leading-none select-none tracking-widest">
                  {room.roomNumber}
                </span>
              </div>
            </div>
          )}

          {/* Dark gradient overlay — bottom for text, subtle top for close btn */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none" />

          {/* Close button — top right */}
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors z-10"
            aria-label={t('close')}
          >
            <X className="w-4 h-4" />
          </button>

          {/* Prev / Next arrows */}
          {imageSlots.length > 1 && (
            <>
              <button
                onClick={() => setActiveIdx((i) => Math.max(i - 1, 0))}
                disabled={activeIdx === 0}
                className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30 text-white backdrop-blur-sm transition-colors z-10"
                aria-label="Previous image"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                onClick={() => setActiveIdx((i) => Math.min(i + 1, imageSlots.length - 1))}
                disabled={activeIdx === imageSlots.length - 1}
                className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 flex items-center justify-center rounded-full bg-black/40 hover:bg-black/60 disabled:opacity-30 text-white backdrop-blur-sm transition-colors z-10"
                aria-label="Next image"
              >
                <ChevronRight className="w-5 h-5" />
              </button>
            </>
          )}

          {/* Room name overlay — bottom left */}
          <div className="absolute bottom-0 left-0 right-0 px-5 pb-4 pt-10 pointer-events-none">
            <div className="flex items-center gap-3 mb-1">
              <span className="font-body text-[11px] font-semibold text-sky-300 tracking-[0.2em] uppercase">
                {room.type}
              </span>
              <span className="font-mono text-[11px] font-bold text-white/50 tracking-widest">
                #{room.roomNumber}
              </span>
            </div>
            <h2 className="font-heading text-3xl sm:text-4xl font-semibold text-white leading-tight">
              {room.nameVi}
            </h2>
            <p className="font-body text-white/60 text-sm mt-0.5">{room.nameEn}</p>
          </div>

          {/* Image counter — top left */}
          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm text-white text-xs font-mono px-2.5 py-1 rounded-full">
            {activeIdx + 1} / {imageSlots.length}
          </div>
        </div>

        {/* ── Thumbnail strip ── */}
        {imageSlots.length > 1 && (
          <div className="flex-shrink-0 bg-slate-900 px-3 py-2 flex gap-1.5 overflow-x-auto scrollbar-hide">
            {imageSlots.map((slot, i) => (
              <button
                key={i}
                onClick={() => setActiveIdx(i)}
                className={`relative flex-shrink-0 w-14 h-10 rounded-md overflow-hidden transition-all ${
                  i === activeIdx
                    ? 'ring-2 ring-sky-400 opacity-100'
                    : 'opacity-50 hover:opacity-80'
                }`}
                aria-label={`View photo ${i + 1}`}
              >
                {slot.type === 'photo' ? (
                  <Image
                    src={slot.url}
                    alt={`Thumbnail ${i + 1}`}
                    fill
                    className="object-cover"
                    sizes="56px"
                  />
                ) : (
                  <div className={`absolute inset-0 ${slot.cls}`} />
                )}
              </button>
            ))}
          </div>
        )}

        {/* ── Scrollable content ── */}
        <div className="overflow-y-auto flex-1">
          <div className="p-6 sm:p-8">

            {/* Stats */}
            <div className="flex flex-wrap gap-6 py-4 border-b border-cream-300 mb-6">
              <div className="flex items-center gap-2">
                <Maximize2 className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-body text-xs text-forest-400 uppercase tracking-wider">{t('size_label')}</p>
                  <p className="font-body text-sm font-semibold text-forest-900">{room.sizeSqm}m²</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <BedDouble className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-body text-xs text-forest-400 uppercase tracking-wider">{t('bed_label')}</p>
                  <p className="font-body text-sm font-semibold text-forest-900">{room.bed}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-500" />
                <div>
                  <p className="font-body text-xs text-forest-400 uppercase tracking-wider">{t('max_guests_label')}</p>
                  <p className="font-body text-sm font-semibold text-forest-900">{room.maxGuests}</p>
                </div>
              </div>
            </div>

            {/* Description */}
            <p className="font-body text-forest-700 leading-relaxed text-base mb-6">
              {description}
            </p>

            {/* All Amenities */}
            <div className="mb-8">
              <h3 className="font-heading text-xl font-semibold text-forest-900 mb-3">
                {t('amenities_label')}
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {room.amenities.map((amenity) => {
                  const Icon = AMENITY_ICONS[amenity] ?? Package;
                  return (
                    <div
                      key={amenity}
                      className="flex items-center gap-2.5 bg-white border border-cream-300/70 rounded-xl px-3 py-2.5"
                    >
                      <Icon className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <span className="font-body text-sm text-forest-700">{tAmenity(amenityKey(amenity))}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>

        {/* ── Sticky footer ── */}
        <div className="flex-shrink-0 border-t border-cream-300 bg-white px-6 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div>
            {isSeasonal && (
              <span className="block font-heading text-sm font-normal text-forest-400/50 line-through leading-none mb-0.5">
                {basePrice.toLocaleString()}đ
              </span>
            )}
            <div className="flex items-baseline gap-2 flex-wrap">
              <span className={`font-heading text-2xl font-semibold ${isSeasonal ? 'text-amber-600' : 'text-forest-900'}`}>
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

          <button
            onClick={handleBook}
            className="flex items-center gap-2 font-body font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-xl transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25"
          >
            {t('book_this_room')}
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
