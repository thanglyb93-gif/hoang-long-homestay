'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { CheckCircle2, Copy, MessageCircle, Home, X, CalendarDays, Users, BedDouble, Wallet, CreditCard } from 'lucide-react';
import { useBookingStore } from '@/lib/booking-store';
import { useSettingsStore } from '@/lib/settings-store';
import { toWhatsAppNumber } from '@/components/ContactInfo';
import type { Room } from '@/lib/rooms';

type PaymentMethod = 'bank' | 'momo' | 'card' | 'cash';

const PAYMENT_LABELS: Record<PaymentMethod, string> = {
  bank: 'Chuyển khoản ngân hàng',
  momo: 'MoMo',
  card: 'Visa / Mastercard',
  cash: 'Tiền mặt khi nhận phòng',
};

interface Props {
  isOpen: boolean;
  bookingRef: string;
  room: Room | null;
  checkIn: Date | null;
  checkOut: Date | null;
  guests: number;
  nights: number;
  total: number;
  paymentMethod?: PaymentMethod;
  onClose: () => void;
}

// WhatsApp number is derived from the settings store inside the component

function fmtDate(d: Date): string {
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

export default function BookingConfirmModal({
  isOpen, bookingRef, room, checkIn, checkOut, guests, nights, total, paymentMethod, onClose,
}: Props) {
  const t = useTranslations('confirmation');
  const tB = useTranslations('booking');
  const params = useParams();
  const locale = params.locale as string;
  const { clearBooking } = useBookingStore();
  const { contactPhone } = useSettingsStore();

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  if (!isOpen) return null;

  const waText = encodeURIComponent(
    `${t('wa_greeting')}\n` +
    `${t('wa_ref')}: ${bookingRef}\n` +
    `${t('wa_room')}: ${room?.nameVi ?? ''}\n` +
    `${t('wa_checkin')}: ${checkIn ? fmtDate(checkIn) : '—'}\n` +
    `${t('wa_checkout')}: ${checkOut ? fmtDate(checkOut) : '—'}`
  );
  const waUrl = `https://wa.me/${toWhatsAppNumber(contactPhone)}?text=${waText}`;

  function handleBackHome() {
    clearBooking();
    onClose();
  }

  function copyRef() {
    navigator.clipboard.writeText(bookingRef).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-forest-900/80 backdrop-blur-sm" />

      {/* Panel */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Blue top bar */}
        <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-800" />

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-cream-100 hover:bg-cream-300 flex items-center justify-center text-forest-600 transition-colors z-10"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="p-7 sm:p-8">
          {/* Header */}
          <div className="flex flex-col items-center text-center mb-7">
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center mb-4">
              <CheckCircle2 className="w-8 h-8 text-blue-500" />
            </div>
            <h2 className="font-heading text-3xl font-semibold text-forest-900 mb-1">{t('title')}</h2>
            <p className="font-body text-forest-500 text-sm">{t('subtitle')}</p>
          </div>

          {/* Reference box */}
          <div className="bg-forest-900 rounded-xl p-4 mb-6 flex items-center justify-between">
            <div>
              <p className="font-body text-xs text-white/50 uppercase tracking-wider mb-1">{t('reference_label')}</p>
              <p className="font-heading text-3xl font-semibold text-sky-300 tracking-widest">{bookingRef}</p>
            </div>
            <button
              onClick={copyRef}
              title="Copy reference"
              className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors"
            >
              <Copy className="w-4 h-4 text-white/70" />
            </button>
          </div>

          {/* Booking details */}
          <div className="bg-cream-50 rounded-xl border border-cream-300 p-4 mb-5 space-y-3">
            <p className="font-body text-xs font-semibold text-forest-500 uppercase tracking-wider mb-2">{t('details_title')}</p>
            {room && (
              <div className="flex items-center gap-2 text-sm">
                <BedDouble className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="font-body font-medium text-forest-900">{room.nameVi}</span>
                <span className="font-body text-forest-400">· {room.type}</span>
              </div>
            )}
            {checkIn && checkOut && (
              <div className="flex items-center gap-2 text-sm">
                <CalendarDays className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="font-body text-forest-700">
                  {fmtDate(checkIn)}
                  <span className="mx-1.5 text-forest-400">→</span>
                  {fmtDate(checkOut)}
                  <span className="ml-2 text-forest-400">({nights} {tB('nights')})</span>
                </span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Users className="w-4 h-4 text-blue-500 flex-shrink-0" />
              <span className="font-body text-forest-700">{guests} {tB('guests')}</span>
            </div>
            {paymentMethod && (
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-blue-500 flex-shrink-0" />
                <span className="font-body text-forest-700">{PAYMENT_LABELS[paymentMethod]}</span>
              </div>
            )}
            {total > 0 && (
              <div className="flex items-center justify-between pt-2 border-t border-cream-300">
                <div className="flex items-center gap-2">
                  <Wallet className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <span className="font-body text-sm font-semibold text-forest-900">{tB('total')}</span>
                </div>
                <span className="font-heading text-xl font-semibold text-forest-900">
                  {total.toLocaleString()}đ
                </span>
              </div>
            )}
          </div>

          {/* Trust message */}
          <p className="font-body text-sm text-forest-600 text-center mb-1 font-medium">{t('message')}</p>
          <p className="font-body text-xs text-forest-400 text-center mb-6">{t('note')}</p>

          {/* Actions */}
          <div className="flex flex-col gap-2.5">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2.5 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-body font-semibold text-sm py-3 rounded-xl transition-colors"
            >
              <MessageCircle className="w-4 h-4" />
              {t('whatsapp')}
            </a>
            <Link
              href={`/${locale}`}
              onClick={handleBackHome}
              className="flex items-center justify-center gap-2 w-full border border-cream-300 hover:border-forest-300 hover:bg-cream-100 text-forest-700 font-body font-medium text-sm py-3 rounded-xl transition-colors"
            >
              <Home className="w-4 h-4" />
              {t('back_home')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
