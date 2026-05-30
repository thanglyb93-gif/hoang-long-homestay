'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import Link from 'next/link';
import {
  User, Phone, Mail, Globe, MessageSquare, BedDouble,
  CalendarDays, Users, Wallet, ShieldCheck, CreditCard, Zap, ChevronRight,
  Info, ScrollText,
} from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { useAdminStore } from '@/lib/admin-store';
import { usePricingStore, ROOM_PRICE_KEY } from '@/lib/pricing-store';
import { roundToNearestHundredThousand } from '@/lib/utils/round-price';
import { buildBlockedRanges, filterAvailableRooms } from '@/lib/availability';
import type { DateRange } from '@/lib/availability';
import type { Room } from '@/lib/rooms';
import { usePublicRooms } from '@/lib/room-store';
import { useImageStore } from '@/lib/image-store';
import Image from 'next/image';
import DateRangePicker from '@/components/DateRangePicker';
import PaymentSection from '@/components/PaymentSection';
import BookingConfirmModal from '@/components/BookingConfirmModal';
import Navbar from '@/components/Navbar';

const NATIONALITIES = [
  'Vietnamese', 'American', 'British', 'Australian', 'Canadian',
  'French', 'German', 'Japanese', 'Korean', 'Chinese',
  'Singaporean', 'Thai', 'Indonesian', 'Malaysian', 'Filipino',
  'Indian', 'Italian', 'Spanish', 'Dutch', 'Russian',
];

const GRADIENT_MAP: Record<string, string> = {
  'green-mountain': 'bg-gradient-to-br from-blue-900 via-blue-800 to-slate-900',
  'ban-flower':     'bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-50',
  'family-room':    'bg-gradient-to-br from-blue-600 via-blue-700 to-blue-900',
  'deluxe':         'bg-gradient-to-br from-blue-400 via-indigo-600 to-blue-900',
};

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function genRef(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

interface FormErrors {
  fullName?: string;
  phone?: string;
  email?: string;
  rulesAgreed?: string;
}

// ─────────────────────────────────────────────────────────────────────────────

export default function BookingPage() {
  const t = useTranslations('booking');
  const params = useParams();
  const locale = params.locale as string;

  const {
    selectedRoom, checkIn, checkOut, guests,
    setSelectedRoom, setCheckIn, setCheckOut, setGuests,
    numberOfNights,
  } = useBookingStore();

  const { addBooking, bookings, overrides } = useAdminStore();
  const { images: roomImages } = useImageStore();
  // Live room list: includes admin-activated placeholder rooms + name/description overrides
  const ROOMS = usePublicRooms();
  const {
    prices: livePrices,
    activeSeasonalMultiplier,
    weeklyDiscountPct, monthlyDiscountPct,
    weeklyDiscountMinNights, monthlyDiscountMinNights,
  } = usePricingStore();

  /** Returns the live price for a room including any active seasonal multiplier. */
  function getLivePrice(roomId: string): number {
    const key  = ROOM_PRICE_KEY[roomId];
    const base = key ? livePrices[key] : 0;
    if (activeSeasonalMultiplier !== 1.0) {
      return roundToNearestHundredThousand(Math.round(base * activeSeasonalMultiplier));
    }
    return base;
  }

  const [fullName,       setFullName]       = useState('');
  const [phone,          setPhone]          = useState('');
  const [email,          setEmail]          = useState('');
  const [nationality,    setNationality]    = useState('');
  const [requests,       setRequests]       = useState('');
  const [paymentMethod,  setPaymentMethod]  = useState<'bank' | 'momo' | 'card' | 'cash'>('bank');
  const [rulesAgreed,    setRulesAgreed]    = useState(false);
  const [errors,         setErrors]         = useState<FormErrors>({});
  const [modalOpen,      setModalOpen]      = useState(false);
  
  // Reset modal on page load
  useEffect(() => {
    setModalOpen(false);
  }, []);
  const [bookingRef,     setBookingRef]     = useState('');

  const nights = numberOfNights();

  // Live price for the selected room (pricing store + seasonal multiplier)
  const liveRoomPrice: number = selectedRoom ? getLivePrice(selectedRoom.id) : 0;

  // Discounts come from the admin pricing store so they can be changed live
  const discount: number =
    nights >= monthlyDiscountMinNights && monthlyDiscountPct > 0 ? monthlyDiscountPct :
    nights >= weeklyDiscountMinNights  && weeklyDiscountPct  > 0 ? weeklyDiscountPct  :
    0;

  const total: number = selectedRoom
    ? Math.round(liveRoomPrice * nights * (1 - discount / 100))
    : 0;

  // Build blocked date ranges per room from admin store (bookings + manual blocks)
  const allBlockedRanges = useMemo((): Record<string, DateRange[]> => {
    const result: Record<string, DateRange[]> = {};
    for (const room of ROOMS) {
      const override = overrides.find((o) => o.roomId === room.id);
      result[room.id] = buildBlockedRanges(
        room.id,
        bookings,
        override?.manualBlocks ?? [],
      );
    }
    return result;
  }, [bookings, overrides]);

  const selectedRoomBlockedRanges: DateRange[] =
    selectedRoom ? (allBlockedRanges[selectedRoom.id] ?? []) : [];

  const availableRooms: Room[] = (checkIn && checkOut)
    ? filterAvailableRooms(checkIn, checkOut, guests, allBlockedRanges)
    : ROOMS;

  useEffect(() => {
    if (selectedRoom && checkIn && checkOut) {
      const blocked = allBlockedRanges[selectedRoom.id] ?? [];
      const isAvail = !blocked.some((r) => checkIn < r.end && checkOut > r.start);
      if (!isAvail) setSelectedRoom(null);
    }
  }, [checkIn, checkOut, selectedRoom, setSelectedRoom, allBlockedRanges]);

  function validate(): boolean {
    const e: FormErrors = {};
    if (!fullName.trim()) e.fullName    = t('required_field');
    if (!phone.trim())    e.phone       = t('required_field');
    if (!email.trim())    e.email       = t('required_field');
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = t('invalid_email');
    if (!rulesAgreed)     e.rulesAgreed = t('rules_required');
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedRoom || !checkIn || !checkOut) return;
    if (!validate()) return;

    const toYMD = (d: Date) => d.toISOString().slice(0, 10);

    // Record in admin store — generates & returns the 6-digit ref
    const ref = addBooking({
      roomId:        selectedRoom.id,
      roomName:      selectedRoom.nameEn,
      roomNumber:    selectedRoom.roomNumber,
      checkIn:       toYMD(checkIn),
      checkOut:      toYMD(checkOut),
      nights,
      guests,
      fullName,
      phone,
      email,
      nationality,
      requests,
      paymentMethod,
      total,
    });

    setBookingRef(ref);
    setModalOpen(true);
  }

  const canSubmit = !!selectedRoom && !!checkIn && !!checkOut && nights > 0;

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-white pt-20 pb-16">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* Page header */}
          <div className="pt-8 pb-10 text-center">
            <p className="font-body text-xs font-semibold tracking-widest uppercase text-blue-600 mb-2">
              Hoang Long Homestay
            </p>
            <h1 className="font-heading text-4xl sm:text-5xl font-semibold text-forest-900">
              {t('title')}
            </h1>
          </div>

          <div className="flex flex-col lg:flex-row gap-8 items-start">

            {/* ── LEFT: Form ─────────────────────────────────────────────── */}
            <form onSubmit={handleSubmit} className="flex-1 min-w-0 space-y-6">

              {/* Step 1 — Dates & Guests */}
              <section className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-cream-200 bg-cream-50/60">
                  <span className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-body text-xs font-semibold flex-shrink-0">
                    1
                  </span>
                  <h2 className="font-heading text-lg font-semibold text-forest-900">{t('step_dates')}</h2>
                </div>
                <div className="p-5 sm:p-6">
                  <DateRangePicker
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onChange={(ci, co) => { setCheckIn(ci); setCheckOut(co); }}
                    roomId={selectedRoom?.id ?? null}
                    blockedRanges={selectedRoomBlockedRanges}
                  />

                  {/* Guests counter */}
                  <div className="mt-5 pt-5 border-t border-cream-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      <span className="font-body text-sm font-medium text-forest-800">{t('guests')}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setGuests(Math.max(1, guests - 1))}
                        disabled={guests <= 1}
                        className="w-8 h-8 rounded-full border border-cream-300 flex items-center justify-center font-body text-forest-700 hover:bg-cream-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >−</button>
                      <span className="font-body text-sm font-semibold text-forest-900 w-5 text-center">{guests}</span>
                      <button
                        type="button"
                        onClick={() => setGuests(Math.min(10, guests + 1))}
                        disabled={guests >= 10}
                        className="w-8 h-8 rounded-full border border-cream-300 flex items-center justify-center font-body text-forest-700 hover:bg-cream-200 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      >+</button>
                    </div>
                  </div>
                </div>
              </section>

              {/* Step 2 — Room selection */}
              <section className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-cream-200 bg-cream-50/60">
                  <span className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-body text-xs font-semibold flex-shrink-0">
                    2
                  </span>
                  <h2 className="font-heading text-lg font-semibold text-forest-900">{t('step_room')}</h2>
                </div>
                <div className="p-5 sm:p-6 space-y-3">
                  {availableRooms.length === 0 && (
                    <p className="font-body text-sm text-forest-400 text-center py-4">
                      No rooms available for the selected dates and guests.
                    </p>
                  )}
                  {ROOMS.map((room) => {
                    const available   = availableRooms.some(r => r.id === room.id);
                    const selected    = selectedRoom?.id === room.id;
                    const heroImg     = (roomImages[room.id] ?? [])[0] ?? null;
                    const roomPrice   = getLivePrice(room.id);
                    const baseKey     = ROOM_PRICE_KEY[room.id];
                    const basePrice   = baseKey ? livePrices[baseKey] : 0;
                    const isSeasonal  = activeSeasonalMultiplier !== 1.0;

                    return (
                      <button
                        key={room.id}
                        type="button"
                        disabled={!available}
                        onClick={() => setSelectedRoom(available ? room : null)}
                        className={[
                          'w-full flex items-center gap-4 rounded-xl border-2 p-3 text-left transition-all duration-150',
                          selected
                            ? 'border-blue-600 bg-blue-50 shadow-sm'
                            : available
                              ? 'border-cream-200 hover:border-blue-400/40 hover:bg-cream-50'
                              : 'border-cream-200 opacity-45 cursor-not-allowed',
                        ].filter(Boolean).join(' ')}
                      >
                        {/* Thumbnail: real photo if available, else gradient */}
                        <div className={`relative w-12 h-12 rounded-lg flex-shrink-0 overflow-hidden ${heroImg ? 'bg-slate-200' : (GRADIENT_MAP[room.id] ?? 'bg-gradient-to-br from-stone-400 to-stone-700')}`}>
                          {heroImg && (
                            <Image src={heroImg} alt={room.nameEn} fill className="object-cover" sizes="48px" />
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-body text-sm font-semibold text-forest-900 truncate">{room.nameVi}</p>
                          <p className="font-body text-xs text-forest-400">{room.type} · max {room.maxGuests}</p>
                        </div>

                        <div className="text-right flex-shrink-0">
                          {isSeasonal && (
                            <p className="font-body text-xs text-forest-400 line-through leading-none">
                              {basePrice.toLocaleString()}đ
                            </p>
                          )}
                          <p className={`font-heading text-base font-semibold ${isSeasonal ? 'text-amber-600' : 'text-forest-900'}`}>
                            {roomPrice.toLocaleString()}đ
                          </p>
                          <p className="font-body text-xs text-forest-400">/ {t('nights')}</p>
                        </div>

                        {selected && (
                          <div className="w-5 h-5 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                            <ChevronRight className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>

              {/* Step 3 — Payment Method */}
              <section className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-cream-200 bg-cream-50/60">
                  <span className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-body text-xs font-semibold flex-shrink-0">
                    3
                  </span>
                  <h2 className="font-heading text-lg font-semibold text-forest-900">{t('step_payment')}</h2>
                </div>
                <div className="p-5 sm:p-6">
                  <PaymentSection
                    paymentMethod={paymentMethod}
                    onMethodChange={setPaymentMethod}
                    total={total}
                    bookingRef={bookingRef}
                  />
                </div>
              </section>

              {/* Step 4 — Guest details */}
              <section className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
                <div className="flex items-center gap-3 px-6 py-4 border-b border-cream-200 bg-cream-50/60">
                  <span className="w-6 h-6 rounded-full bg-blue-700 flex items-center justify-center text-white font-body text-xs font-semibold flex-shrink-0">
                    4
                  </span>
                  <h2 className="font-heading text-lg font-semibold text-forest-900">{t('step_details')}</h2>
                </div>
                <div className="p-5 sm:p-6 space-y-4">

                  {/* Full name */}
                  <div>
                    <label className="flex items-center gap-1.5 font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-1.5">
                      <User className="w-3.5 h-3.5" />{t('full_name')} *
                    </label>
                    <input
                      type="text"
                      value={fullName}
                      onChange={e => setFullName(e.target.value)}
                      placeholder={t('full_name_placeholder')}
                      className={`w-full font-body text-sm text-forest-900 placeholder:text-forest-300 bg-cream-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors ${errors.fullName ? 'border-red-400' : 'border-cream-300'}`}
                    />
                    {errors.fullName && <p className="font-body text-xs text-red-500 mt-1">{errors.fullName}</p>}
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="flex items-center gap-1.5 font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-1.5">
                      <Phone className="w-3.5 h-3.5" />{t('phone')} *
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value)}
                      placeholder={t('phone_placeholder')}
                      className={`w-full font-body text-sm text-forest-900 placeholder:text-forest-300 bg-cream-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors ${errors.phone ? 'border-red-400' : 'border-cream-300'}`}
                    />
                    {errors.phone && <p className="font-body text-xs text-red-500 mt-1">{errors.phone}</p>}
                  </div>

                  {/* Email */}
                  <div>
                    <label className="flex items-center gap-1.5 font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-1.5">
                      <Mail className="w-3.5 h-3.5" />{t('email_label')} *
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder={t('email_placeholder')}
                      className={`w-full font-body text-sm text-forest-900 placeholder:text-forest-300 bg-cream-50 border rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors ${errors.email ? 'border-red-400' : 'border-cream-300'}`}
                    />
                    {errors.email && <p className="font-body text-xs text-red-500 mt-1">{errors.email}</p>}
                  </div>

                  {/* Nationality */}
                  <div>
                    <label className="flex items-center gap-1.5 font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-1.5">
                      <Globe className="w-3.5 h-3.5" />{t('nationality')}
                    </label>
                    <select
                      value={nationality}
                      onChange={e => setNationality(e.target.value)}
                      className="w-full font-body text-sm text-forest-900 bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors appearance-none"
                    >
                      <option value="">{t('select_nationality')}</option>
                      {NATIONALITIES.map(n => (
                        <option key={n} value={n}>{n}</option>
                      ))}
                    </select>
                  </div>

                  {/* Special requests */}
                  <div>
                    <label className="flex items-center gap-1.5 font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-1.5">
                      <MessageSquare className="w-3.5 h-3.5" />{t('special_requests')}
                    </label>
                    <textarea
                      value={requests}
                      onChange={e => setRequests(e.target.value)}
                      placeholder={t('special_requests_placeholder')}
                      rows={3}
                      className="w-full font-body text-sm text-forest-900 placeholder:text-forest-300 bg-cream-50 border border-cream-300 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors resize-none"
                    />
                  </div>

                  {/* ── House Rules agreement ──────────────────────────── */}
                  <div
                    className={`rounded-xl border-2 p-4 transition-colors ${
                      errors.rulesAgreed
                        ? 'border-red-400 bg-red-50'
                        : rulesAgreed
                          ? 'border-green-400 bg-green-50'
                          : 'border-amber-300 bg-amber-50'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Custom checkbox */}
                      <button
                        type="button"
                        role="checkbox"
                        aria-checked={rulesAgreed}
                        onClick={() => {
                          setRulesAgreed((v) => !v);
                          if (errors.rulesAgreed) setErrors((e) => ({ ...e, rulesAgreed: undefined }));
                        }}
                        className={`mt-0.5 flex-shrink-0 w-5 h-5 rounded border-2 flex items-center justify-center transition-colors ${
                          rulesAgreed
                            ? 'bg-green-600 border-green-600'
                            : errors.rulesAgreed
                              ? 'border-red-400 bg-white'
                              : 'border-amber-400 bg-white hover:border-amber-500'
                        }`}
                      >
                        {rulesAgreed && (
                          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12">
                            <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </button>

                      {/* Label text */}
                      <p
                        className={`flex-1 font-body text-sm leading-relaxed cursor-pointer select-none ${
                          rulesAgreed ? 'text-green-800' : 'text-amber-900'
                        }`}
                        onClick={() => {
                          setRulesAgreed((v) => !v);
                          if (errors.rulesAgreed) setErrors((e) => ({ ...e, rulesAgreed: undefined }));
                        }}
                      >
                        {t('rules_agree')}
                      </p>

                      {/* Info icon → opens House Rules in a new tab */}
                      <Link
                        href={`/${locale}/rules`}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={t('rules_view')}
                        className={`flex-shrink-0 p-1.5 rounded-lg transition-colors ${
                          rulesAgreed
                            ? 'text-green-600 hover:bg-green-100'
                            : 'text-amber-600 hover:bg-amber-100'
                        }`}
                      >
                        <Info className="w-4 h-4" />
                      </Link>
                    </div>

                    {/* "View rules" helper text — shown when unchecked */}
                    {!rulesAgreed && (
                      <div className="flex items-center gap-1.5 mt-2.5 ml-8">
                        <ScrollText className="w-3.5 h-3.5 text-amber-600 flex-shrink-0" />
                        <Link
                          href={`/${locale}/rules`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-body text-xs font-semibold text-amber-700 underline underline-offset-2 hover:text-amber-900 transition-colors"
                        >
                          {t('rules_view')}
                        </Link>
                      </div>
                    )}

                    {/* Validation error */}
                    {errors.rulesAgreed && (
                      <p className="font-body text-xs text-red-600 font-medium mt-2 ml-8">
                        {errors.rulesAgreed}
                      </p>
                    )}
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full mt-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white font-body font-semibold text-sm py-4 rounded-xl transition-colors shadow-sm"
                  >
                    {t('confirm_booking')}
                  </button>

                  {!canSubmit && (
                    <p className="font-body text-xs text-forest-400 text-center">
                      {!checkIn || !checkOut
                        ? t('select_dates_prompt')
                        : !selectedRoom
                          ? t('select_room_prompt')
                          : ''}
                    </p>
                  )}
                </div>
              </section>
            </form>

            {/* ── RIGHT: Sticky summary ───────────────────────────────────── */}
            <aside className="w-full lg:w-80 xl:w-96 flex-shrink-0">
              <div className="lg:sticky lg:top-28 bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">

                {/* Room gradient preview */}
                <div className={`h-36 flex items-end p-4 ${selectedRoom ? (GRADIENT_MAP[selectedRoom.id] ?? 'bg-gradient-to-br from-blue-800 to-blue-900') : 'bg-gradient-to-br from-blue-100 to-slate-200'}`}>
                  {selectedRoom ? (
                    <div>
                      <p className="font-heading text-lg font-semibold text-white leading-tight">{selectedRoom.nameVi}</p>
                      <p className="font-body text-xs text-white/70">{selectedRoom.type}</p>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 text-forest-400">
                      <BedDouble className="w-4 h-4" />
                      <span className="font-body text-sm">{t('no_room_selected')}</span>
                    </div>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  <p className="font-body text-xs font-semibold text-forest-500 uppercase tracking-wider">{t('summary_title')}</p>

                  {/* Dates & guests */}
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <CalendarDays className="w-4 h-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        {checkIn && checkOut ? (
                          <p className="font-body text-sm text-forest-800">
                            {fmtDate(checkIn)}
                            <span className="mx-1 text-forest-400">→</span>
                            {fmtDate(checkOut)}
                          </p>
                        ) : (
                          <p className="font-body text-sm text-forest-400">{t('no_dates')}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
                      <p className="font-body text-sm text-forest-800">{guests} {t('guests')}</p>
                    </div>
                  </div>

                  {/* Price breakdown */}
                  {selectedRoom && nights > 0 && (
                    <div className="border-t border-cream-200 pt-4 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-body text-sm text-forest-600">
                          {liveRoomPrice.toLocaleString()}đ × {nights} {t('nights')}
                        </span>
                        <span className="font-body text-sm text-forest-800">
                          {(liveRoomPrice * nights).toLocaleString()}đ
                        </span>
                      </div>
                      {discount > 0 && (
                        <div className="flex justify-between items-center">
                          <span className="font-body text-xs text-blue-600 font-medium">
                            {discount === monthlyDiscountPct
                              ? `${t('discount_month')} (−${discount}%)`
                              : `${t('discount_week')} (−${discount}%)`}
                          </span>
                          <span className="font-body text-xs font-semibold text-blue-600">
                            −{(liveRoomPrice * nights - total).toLocaleString()}đ
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between items-center pt-2 border-t border-cream-200">
                        <div className="flex items-center gap-1.5">
                          <Wallet className="w-4 h-4 text-blue-500" />
                          <span className="font-body text-sm font-semibold text-forest-900">{t('total')}</span>
                        </div>
                        <span className="font-heading text-xl font-semibold text-forest-900">
                          {total.toLocaleString()}đ
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Payment notice */}
                  <p className="font-body text-xs text-forest-400 text-center bg-cream-50 rounded-lg px-3 py-2">
                    {t('payment_notice')}
                  </p>

                  {/* Trust signals */}
                  <div className="border-t border-cream-200 pt-4 space-y-2">
                    {(
                      [
                        { Icon: ShieldCheck, text: t('trust_1') },
                        { Icon: CreditCard,  text: t('trust_2') },
                        { Icon: Zap,         text: t('trust_3') },
                      ] as { Icon: React.ElementType; text: string }[]
                    ).map(({ Icon, text }) => (
                      <div key={text} className="flex items-center gap-2">
                        <Icon className="w-3.5 h-3.5 text-blue-500 flex-shrink-0" />
                        <span className="font-body text-xs text-forest-600">{text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </aside>

          </div>
        </div>
      </main>

      <BookingConfirmModal
        isOpen={modalOpen}
        bookingRef={bookingRef}
        room={selectedRoom}
        checkIn={checkIn}
        checkOut={checkOut}
        guests={guests}
        nights={nights}
        total={total}
        paymentMethod={paymentMethod}
        onClose={() => setModalOpen(false)}
      />
    </>
  );
}
