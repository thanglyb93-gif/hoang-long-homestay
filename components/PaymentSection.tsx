'use client';

import { useRef, ChangeEvent, useState } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { Copy, CreditCard, Clock } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';

// ── Types ─────────────────────────────────────────────────────────────────────

export type PaymentMethod = 'bank' | 'momo' | 'card' | 'cash';

interface Props {
  paymentMethod:  PaymentMethod;
  onMethodChange: (m: PaymentMethod) => void;
  total:          number;
  bookingRef:     string;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function copyText(v: string) { navigator.clipboard.writeText(v).catch(() => {}); }

function Row({ label, value, copy: canCopy, highlight }: {
  label: string; value: string; copy?: boolean; highlight?: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <span className="font-body text-xs text-forest-500 flex-shrink-0 min-w-[130px]">{label}</span>
      <span className={`font-body text-xs font-semibold flex-1 truncate ${highlight ? 'text-blue-700' : 'text-forest-900'}`}>
        {value}
      </span>
      {canCopy && (
        <button
          type="button"
          onClick={() => copyText(value)}
          className="flex-shrink-0 opacity-40 hover:opacity-100 transition-opacity"
          title="Copy"
        >
          <Copy className="w-3 h-3 text-forest-600" />
        </button>
      )}
    </div>
  );
}

// ── QR Display ────────────────────────────────────────────────────────────────

function QRDisplay({ url, color = '#0f172a' }: { url: string; color?: string }) {
  if (url) {
    return (
      <div className="relative w-[100px] h-[100px] rounded-lg overflow-hidden bg-white border border-slate-200">
        <Image src={url} alt="QR Code" fill className="object-contain p-1" sizes="100px" />
      </div>
    );
  }

  const S = 5;
  const data: [number, number][] = [
    [6,7],[6,9],[6,11],[6,13],[6,15],[6,17],[6,19],
    [7,6],[7,8],[7,10],[7,12],[7,14],[7,16],[7,18],
    [8,7],[8,8],[8,10],[8,12],[8,15],[8,17],[8,19],
    [9,6],[9,9],[9,11],[9,13],[9,16],[9,18],
    [10,7],[10,9],[10,12],[10,14],[10,16],[10,19],
    [11,6],[11,8],[11,11],[11,13],[11,15],[11,17],
    [12,7],[12,9],[12,10],[12,12],[12,14],[12,18],
    [13,6],[13,8],[13,11],[13,13],[13,16],[13,19],
    [14,7],[14,9],[14,12],[14,15],[14,17],
    [15,6],[15,8],[15,10],[15,13],[15,16],[15,18],
    [16,7],[16,9],[16,11],[16,14],[16,17],[16,19],
    [17,6],[17,8],[17,10],[17,12],[17,15],[17,18],
    [18,7],[18,9],[18,11],[18,13],[18,16],[18,19],
    [19,6],[19,8],[19,10],[19,12],[19,14],[19,17],
  ];
  return (
    <svg width="100" height="100" viewBox="0 0 100 100" fill="none">
      <rect x="0"  y="0"  width="35" height="35" rx="4" fill={color}/>
      <rect x="5"  y="5"  width="25" height="25" rx="3" fill="white"/>
      <rect x="10" y="10" width="15" height="15" rx="2" fill={color}/>
      <rect x="65" y="0"  width="35" height="35" rx="4" fill={color}/>
      <rect x="70" y="5"  width="25" height="25" rx="3" fill="white"/>
      <rect x="75" y="10" width="15" height="15" rx="2" fill={color}/>
      <rect x="0"  y="65" width="35" height="35" rx="4" fill={color}/>
      <rect x="5"  y="70" width="25" height="25" rx="3" fill="white"/>
      <rect x="10" y="75" width="15" height="15" rx="2" fill={color}/>
      {data.map(([r, c]) => (
        <rect key={`${r}-${c}`} x={c * S} y={r * S} width={S - 1} height={S - 1} rx="0.5" fill={color}/>
      ))}
    </svg>
  );
}

// ── Main component ─────────────────────────────────────────────────────────────

export default function PaymentSection({ paymentMethod, onMethodChange, total, bookingRef }: Props) {
  const t = useTranslations('booking');
  const s = useSettingsStore();

  const METHODS = [
    { id: 'bank' as const, icon: '🏦', label: t('pm_bank_label'),  sublabel: t('pm_bank_sublabel') },
    { id: 'momo' as const, icon: '🟣', label: t('pm_momo_label'),  sublabel: t('pm_momo_sublabel') },
    { id: 'card' as const, icon: '💳', label: t('pm_card_label'),  sublabel: t('pm_card_sublabel') },
    { id: 'cash' as const, icon: '💵', label: t('pm_cash_label'),  sublabel: t('pm_cash_sublabel') },
  ];

  return (
    <div className="space-y-5">
      {/* Payment method tiles */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {METHODS.map((m) => (
          <button
            key={m.id}
            type="button"
            onClick={() => onMethodChange(m.id)}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all duration-150 text-center ${
              paymentMethod === m.id
                ? 'border-blue-600 bg-blue-50 shadow-sm'
                : 'border-cream-200 hover:border-blue-300 hover:bg-blue-50/40'
            }`}
          >
            <span className="text-2xl">{m.icon}</span>
            <div>
              <p className="font-body text-xs font-semibold text-forest-900 leading-tight">{m.label}</p>
              <p className="font-body text-[10px] text-forest-400 mt-0.5">{m.sublabel}</p>
            </div>
            {paymentMethod === m.id && (
              <span className="w-4 h-4 rounded-full bg-blue-600 flex items-center justify-center">
                <svg className="w-2.5 h-2.5 text-white" fill="currentColor" viewBox="0 0 12 12">
                  <path d="M10 3L5 8.5 2 5.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
                </svg>
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Bank Transfer ── */}
      {paymentMethod === 'bank' && (
        <div className="flex flex-col sm:flex-row gap-5 bg-slate-50 rounded-xl border border-slate-200 p-5">
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="bg-white rounded-xl p-2 shadow-sm border border-slate-200">
              <QRDisplay url={s.bankQrUrl} />
            </div>
          </div>
          <div className="space-y-2.5 min-w-0 flex-1">
            <p className="font-body text-xs font-bold text-forest-500 uppercase tracking-wider">
              {t('bank_details_title')}
            </p>
            <div className="space-y-1.5">
              <Row label={t('bank_label_bank')}    value={s.bankName} />
              <Row label={t('bank_label_account')} value={s.bankAccount} copy />
              <Row label={t('bank_label_holder')}  value={s.bankAccountName} />
              {total > 0 && (
                <Row label={t('bank_label_amount')} value={`${total.toLocaleString()}đ`} highlight />
              )}
              {bookingRef && (
                <Row label={t('bank_label_ref')} value={`HL-${bookingRef}`} copy highlight />
              )}
            </div>
            <p className="font-body text-[11px] text-blue-600 bg-blue-50 rounded-lg px-3 py-2 mt-2">
              {t('bank_note')}
            </p>
          </div>
        </div>
      )}

      {/* ── MoMo ── */}
      {paymentMethod === 'momo' && (
        <div className="flex flex-col sm:flex-row gap-5 bg-purple-50 rounded-xl border border-purple-200 p-5">
          <div className="flex-shrink-0 flex items-center justify-center">
            <div className="bg-white rounded-xl p-2 shadow-sm border border-purple-200">
              <QRDisplay url={s.momoQrUrl} color="#a21caf" />
            </div>
          </div>
          <div className="space-y-2.5 min-w-0 flex-1">
            <p className="font-body text-xs font-bold text-purple-600 uppercase tracking-wider">
              {t('momo_title')}
            </p>
            <div className="space-y-1.5">
              <Row label={t('momo_label_phone')}  value={s.momoPhone} copy />
              <Row label={t('momo_label_name')}   value={s.momoName} />
              {total > 0 && (
                <Row label={t('momo_label_amount')} value={`${total.toLocaleString()}đ`} highlight />
              )}
            </div>
            <p className="font-body text-[11px] text-purple-700 bg-purple-50 rounded-lg px-3 py-2 mt-2 border border-purple-100">
              {t('momo_note')}
            </p>
          </div>
        </div>
      )}

      {/* ── Card — coming soon placeholder ── */}
      {paymentMethod === 'card' && (
        <div className="flex items-center gap-4 bg-slate-50 rounded-xl border border-slate-200 p-5">
          <div className="flex gap-2 flex-shrink-0">
            {/* Visa */}
            <div className="flex items-center justify-center w-12 h-8 bg-[#1a1f71] rounded-md">
              <span className="font-bold text-white text-sm italic tracking-tight select-none" style={{ fontFamily: 'Georgia, serif' }}>
                VISA
              </span>
            </div>
            {/* Mastercard */}
            <div className="flex items-center justify-center w-12 h-8 bg-white border border-slate-200 rounded-md overflow-hidden">
              <svg viewBox="0 0 50 30" width="40" height="24" fill="none">
                <circle cx="18" cy="15" r="12" fill="#EB001B"/>
                <circle cx="32" cy="15" r="12" fill="#F79E1B" fillOpacity="0.88"/>
              </svg>
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-body text-sm font-semibold text-forest-900">{t('pm_card_label')}</p>
              <span className="flex items-center gap-1 font-body text-[10px] font-semibold text-amber-700 bg-amber-100 border border-amber-200 px-2 py-0.5 rounded-full">
                <Clock className="w-2.5 h-2.5" /> Coming soon
              </span>
            </div>
            <p className="font-body text-xs text-forest-500 mt-0.5">{t('card_not_configured')}</p>
          </div>
        </div>
      )}

      {/* ── Cash ── */}
      {paymentMethod === 'cash' && (
        <div className="flex items-center gap-4 bg-green-50 rounded-xl border border-green-200 p-5">
          <span className="text-3xl">💵</span>
          <div>
            <p className="font-body text-sm font-semibold text-forest-900">{t('cash_title')}</p>
            <p className="font-body text-xs text-forest-500 mt-0.5">{t('cash_desc')}</p>
          </div>
        </div>
      )}
    </div>
  );
}
