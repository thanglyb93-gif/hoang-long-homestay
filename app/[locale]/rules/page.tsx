'use client';

import { useState } from 'react';
import { useTranslations } from 'next-intl';
import {
  Cigarette, AlertTriangle, ChevronDown, ChevronUp,
  Printer, Clock, Users, Volume2, PawPrint, BedDouble,
  Droplets, UtensilsCrossed, AlertCircle, Shield, Info,
} from 'lucide-react';
import Navbar from '@/components/Navbar';

// ── Damage table data ─────────────────────────────────────────────────────────

interface DamageItem {
  emoji: string;
  labelKey: string;
  fee?: string;        // VND amount — language-agnostic
  feeNoteKey?: string; // translated suffix / full description
}

interface DamageCategory {
  key: 'bedroom' | 'bathroom' | 'kitchen' | 'general';
  icon: React.ElementType;
  headerClass: string;
  borderClass: string;
  bgClass: string;
  iconClass: string;
  divideClass: string;
  items: DamageItem[];
}

const DAMAGE_CATEGORIES: DamageCategory[] = [
  {
    key:         'bedroom',
    icon:        BedDouble,
    headerClass: 'bg-blue-700 text-white',
    borderClass: 'border-blue-200',
    bgClass:     'bg-blue-50',
    iconClass:   'text-blue-600',
    divideClass: 'divide-blue-100',
    items: [
      { emoji: '📺', labelKey: 'item_tv',        fee: '3,000,000 VND' },
      { emoji: '💡', labelKey: 'item_lamp',       fee: '200,000 VND' },
      { emoji: '🪵', labelKey: 'item_table',      fee: '500,000 VND' },
      { emoji: '🪑', labelKey: 'item_chair',      fee: '300,000 VND' },
      { emoji: '🪟', labelKey: 'item_window',     fee: '500,000–1,000,000 VND' },
      { emoji: '🪟', labelKey: 'item_curtains',   fee: '300,000–500,000 VND' },
      { emoji: '🔐', labelKey: 'item_door_lock',  fee: '1,500,000 VND' },
      { emoji: '🛏️', labelKey: 'item_bedsheet',  fee: '200,000 VND', feeNoteKey: 'fee_per_piece' },
      { emoji: '🧺', labelKey: 'item_towel',      fee: '100,000 VND', feeNoteKey: 'fee_per_piece' },
    ],
  },
  {
    key:         'bathroom',
    icon:        Droplets,
    headerClass: 'bg-cyan-700 text-white',
    borderClass: 'border-cyan-200',
    bgClass:     'bg-cyan-50',
    iconClass:   'text-cyan-600',
    divideClass: 'divide-cyan-100',
    items: [
      { emoji: '🪞', labelKey: 'item_mirror',     fee: '400,000–800,000 VND' },
      { emoji: '🛁', labelKey: 'item_bathtub',    fee: '500,000–2,000,000 VND' },
      { emoji: '💨', labelKey: 'item_hair_dryer', fee: '300,000 VND' },
      { emoji: '🚽', labelKey: 'item_toilet',     fee: '200,000 VND', feeNoteKey: 'fee_plus_plumber' },
    ],
  },
  {
    key:         'kitchen',
    icon:        UtensilsCrossed,
    headerClass: 'bg-amber-700 text-white',
    borderClass: 'border-amber-200',
    bgClass:     'bg-amber-50',
    iconClass:   'text-amber-600',
    divideClass: 'divide-amber-100',
    items: [
      { emoji: '❄️', labelKey: 'item_ac',        fee: '2,000,000 VND' },
      { emoji: '🧊', labelKey: 'item_fridge',    fee: '2,500,000 VND' },
      { emoji: '📦', labelKey: 'item_microwave', fee: '800,000 VND' },
      { emoji: '☕', labelKey: 'item_kettle',    fee: '250,000 VND' },
      { emoji: '🥛', labelKey: 'item_glass',     fee: '50,000 VND', feeNoteKey: 'fee_per_piece' },
    ],
  },
  {
    key:         'general',
    icon:        AlertCircle,
    headerClass: 'bg-red-700 text-white',
    borderClass: 'border-red-200',
    bgClass:     'bg-red-50',
    iconClass:   'text-red-600',
    divideClass: 'divide-red-100',
    items: [
      { emoji: '⚠️', labelKey: 'item_other', feeNoteKey: 'item_other_fee' },
    ],
  },
];

// ── Page ──────────────────────────────────────────────────────────────────────

type AnyKey = Parameters<ReturnType<typeof useTranslations<'rules'>>>[0];

export default function RulesPage() {
  const t = useTranslations('rules');

  // All categories open by default (so everything is visible on first load)
  const [openCats, setOpenCats] = useState<Set<string>>(
    new Set(DAMAGE_CATEGORIES.map((c) => c.key))
  );

  function toggleCat(key: string) {
    setOpenCats((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });
  }

  return (
    <>
      <Navbar />

      {/* Outer wrapper clears the fixed Navbar (h-16 mobile / h-[72px] sm+) */}
      <div className="pt-16 sm:pt-[72px]">

      {/* ── Sticky warning banner ──────────────────────────────────────────── */}
      <div className="sticky top-16 sm:top-[72px] z-40 bg-gradient-to-r from-red-600 to-red-700 text-white px-4 py-2.5 shadow-md print:hidden">
        <div className="flex items-center justify-center gap-2 max-w-3xl mx-auto">
          <AlertTriangle className="w-4 h-4 flex-shrink-0" />
          <p className="font-body text-sm font-medium text-center">{t('banner')}</p>
        </div>
      </div>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 pb-16 pt-8 space-y-10">

        {/* ── Page header ─────────────────────────────────────────────────── */}
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="font-body text-xs font-semibold text-blue-600 uppercase tracking-widest mb-2">
              Hoang Long Homestay
            </p>
            <h1 className="font-heading text-4xl font-semibold text-forest-900">
              {t('page_title')}
            </h1>
            <p className="font-body text-sm text-forest-500 mt-2 max-w-xl">
              {t('page_subtitle')}
            </p>
          </div>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-2 px-4 py-2.5 bg-white border border-cream-300 text-forest-700 hover:bg-cream-100 font-body text-sm font-medium rounded-xl transition-colors flex-shrink-0 shadow-sm print:hidden"
          >
            <Printer className="w-4 h-4" />
            {t('print')}
          </button>
        </div>

        {/* ── SMOKING POLICY ──────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-forest-900">
            <Cigarette className="w-5 h-5 text-sky-300" />
            <h2 className="font-heading text-lg font-semibold text-white">{t('smoking_title')}</h2>
          </div>

          <div className="px-5 py-5 space-y-4">
            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">🚭</span>
              <p className="font-body text-sm text-forest-800 leading-relaxed">
                {t('smoking_rule1')}
              </p>
            </div>

            <div className="flex items-start gap-3 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="font-body text-sm font-semibold text-red-700">
                {t('smoking_fine_label')}: {t('smoking_fine_amount')}
              </p>
            </div>

            <div className="flex items-start gap-3">
              <span className="text-xl leading-none mt-0.5">🌿</span>
              <p className="font-body text-sm text-forest-700 leading-relaxed">
                {t('smoking_outdoor')}
              </p>
            </div>
          </div>
        </section>

        {/* ── DAMAGE FEES ─────────────────────────────────────────────────── */}
        <section className="space-y-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-forest-900">
              {t('damage_title')}
            </h2>
            <p className="font-body text-sm text-forest-500 mt-1">
              {t('damage_subtitle')}
            </p>
          </div>

          {DAMAGE_CATEGORIES.map((cat) => {
            const isOpen = openCats.has(cat.key);
            const Icon = cat.icon;
            return (
              <div
                key={cat.key}
                className={`rounded-2xl border ${cat.borderClass} overflow-hidden shadow-sm`}
              >
                {/* Accordion trigger */}
                <button
                  type="button"
                  onClick={() => toggleCat(cat.key)}
                  className={`w-full flex items-center gap-3 px-5 py-4 text-left transition-colors ${
                    isOpen ? cat.headerClass : 'bg-white hover:bg-cream-50'
                  }`}
                >
                  <Icon
                    className={`w-5 h-5 flex-shrink-0 ${isOpen ? 'text-white' : cat.iconClass}`}
                  />
                  <span
                    className={`font-heading text-base font-semibold flex-1 ${
                      isOpen ? 'text-white' : 'text-forest-900'
                    }`}
                  >
                    {t(`cat_${cat.key}` as AnyKey)}
                  </span>
                  <span
                    className={`font-body text-xs tabular-nums ${
                      isOpen ? 'text-white/70' : 'text-forest-400'
                    }`}
                  >
                    {cat.items.length}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-white/80" />
                  ) : (
                    <ChevronDown className={`w-4 h-4 ${cat.iconClass}`} />
                  )}
                </button>

                {/* Accordion body — always in DOM; hidden class overridden for print */}
                <div className={`${isOpen ? '' : 'hidden'} print:!block`}>
                  <table className={`w-full ${cat.bgClass}`}>
                    <tbody className={`divide-y ${cat.divideClass}`}>
                      {cat.items.map((item) => (
                        <tr key={item.labelKey}>
                          <td className="pl-5 pr-3 py-3 text-lg leading-none w-10">
                            {item.emoji}
                          </td>
                          <td className="pr-3 py-3 font-body text-sm text-forest-800 leading-snug">
                            {t(item.labelKey as AnyKey)}
                          </td>
                          <td className="px-5 py-3 text-right align-top whitespace-nowrap">
                            {item.fee && (
                              <span className="font-body text-sm font-bold text-forest-900">
                                {item.fee}
                              </span>
                            )}
                            {item.feeNoteKey && (
                              <span
                                className={`font-body block ${
                                  item.fee
                                    ? 'text-[11px] text-forest-500'
                                    : 'text-sm font-bold text-forest-900'
                                }`}
                              >
                                {t(item.feeNoteKey as AnyKey)}
                              </span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            );
          })}
        </section>

        {/* ── ACCOUNTABILITY CALLOUT ───────────────────────────────────────── */}
        <section className="rounded-2xl bg-amber-50 border-2 border-amber-400 p-6 space-y-3 shadow-sm">
          <div className="flex items-center gap-2.5">
            <Shield className="w-5 h-5 text-amber-700 flex-shrink-0" />
            <h2 className="font-heading text-lg font-bold text-amber-900">
              {t('trust_title')}
            </h2>
          </div>
          <p className="font-body text-sm text-amber-900 leading-relaxed">
            {t('trust_body')}
          </p>
        </section>

        {/* ── OTHER RULES ─────────────────────────────────────────────────── */}
        <section className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 bg-forest-900">
            <Info className="w-5 h-5 text-sky-300" />
            <h2 className="font-heading text-lg font-semibold text-white">{t('other_title')}</h2>
          </div>

          <div className="divide-y divide-cream-100">
            {(
              [
                { emoji: '🕑', icon: Clock,    key: 'other_checkin' },
                { emoji: '💰', icon: Clock,    key: 'other_late_checkout' },
                { emoji: '👤', icon: Users,    key: 'other_extra_guests' },
                { emoji: '🔇', icon: Volume2,  key: 'other_noise' },
                { emoji: '🐾', icon: PawPrint, key: 'other_pets' },
              ] as const
            ).map(({ emoji, key }) => (
              <div key={key} className="flex items-start gap-3.5 px-5 py-3.5">
                <span className="text-xl leading-none mt-0.5 flex-shrink-0">{emoji}</span>
                <p className="font-body text-sm text-forest-800 leading-relaxed pt-0.5">
                  {t(key as AnyKey)}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Print-only footer ────────────────────────────────────────────── */}
        <div className="hidden print:block text-center pt-6 border-t border-gray-200">
          <p className="font-body text-xs text-gray-500">
            Hoang Long Homestay · Phước Kiểng, Nhơn Trạch, Đồng Nai, Việt Nam
          </p>
        </div>
      </main>

      </div>{/* end pt-16/pt-[72px] wrapper */}

      {/* Print global styles */}
      <style jsx global>{`
        @media print {
          .sticky { position: static !important; }
          header { display: none !important; }
          @page { margin: 1.5cm; }
        }
      `}</style>
    </>
  );
}
