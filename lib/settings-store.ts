'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Data shape ────────────────────────────────────────────────────────────────

export interface SettingsData {
  // Contact
  contactPhone:     string;
  contactEmail:     string;
  address:          string;
  // Bank transfer
  bankName:         string;
  bankAccount:      string;
  bankAccountName:  string;
  bankQrUrl:        string;   // URL of uploaded QR code image
  // MoMo
  momoPhone:        string;
  momoName:         string;
  momoQrUrl:        string;   // URL of uploaded QR code image
  // Card payment (Stripe)
  stripePublishableKey: string; // pk_live_... or pk_test_...
  cardPaymentEnabled:   boolean;
  // House rules (ordered list)
  houseRules:       string[];
  // Damage fee schedule
  damageFees:       string[];
}

// ── Store interface ───────────────────────────────────────────────────────────

interface SettingsState extends SettingsData {
  update:          (patch: Partial<SettingsData>) => void;
  addRule:         (rule: string) => void;
  removeRule:      (index: number) => void;
  updateRule:      (index: number, text: string) => void;
  moveRule:        (from: number, to: number) => void;
  resetRules:      () => void;
  addDamageFee:    (fee: string) => void;
  removeDamageFee: (index: number) => void;
  updateDamageFee: (index: number, text: string) => void;
}

// ── Defaults ──────────────────────────────────────────────────────────────────

const DEFAULT_RULES: string[] = [
  'Check-in: 14:00 · Check-out: 12:00',
  'Quiet hours: 22:00 – 07:00',
  'No smoking inside the room',
  'No pets allowed',
  'Keep common areas clean and tidy',
  'Guests are responsible for any damaged property',
  'Lost key card fee: 200,000 VND',
  'Maximum capacity per room must not be exceeded',
];

const DEFAULTS: SettingsData = {
  contactPhone:         '0900 000 000',
  contactEmail:         'hoanglonghomestay@gmail.com',
  address:              'Đà Lạt, Lâm Đồng, Việt Nam',
  bankName:             'Vietcombank',
  bankAccount:          '1234 5678 9012',
  bankAccountName:      'HOANG LONG HOMESTAY',
  bankQrUrl:            '',
  momoPhone:            '0900 000 000',
  momoName:             'HOANG LONG HOMESTAY',
  momoQrUrl:            '',
  stripePublishableKey: '',
  cardPaymentEnabled:   false,
  houseRules:           DEFAULT_RULES,
  damageFees: [
    'Broken window / glass: 500,000 – 2,000,000 VND',
    'Damaged furniture (chairs, table, bed frame): 500,000 – 3,000,000 VND',
    'Stained / damaged mattress or bedding: 500,000 – 2,000,000 VND',
    'Missing or damaged remote control / accessories: 200,000 – 500,000 VND',
    'Damaged TV, A/C or appliances: replacement cost + labour',
    'Lost key card: 200,000 VND',
    'Smoking in room (non-smoking policy): 1,000,000 VND flat fee',
    'Deep cleaning required (excessive mess): 300,000 – 1,000,000 VND',
  ],
};

// ── Store ─────────────────────────────────────────────────────────────────────

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      ...DEFAULTS,

      update: (patch) => set((s) => ({ ...s, ...patch })),

      addRule: (rule) =>
        set((s) => ({ houseRules: [...s.houseRules, rule] })),

      removeRule: (index) =>
        set((s) => ({
          houseRules: s.houseRules.filter((_, i) => i !== index),
        })),

      updateRule: (index, text) =>
        set((s) => ({
          houseRules: s.houseRules.map((r, i) => (i === index ? text : r)),
        })),

      moveRule: (from, to) =>
        set((s) => {
          const rules = [...s.houseRules];
          const [item] = rules.splice(from, 1);
          rules.splice(to, 0, item);
          return { houseRules: rules };
        }),

      resetRules: () => set({ houseRules: DEFAULT_RULES }),

      addDamageFee: (fee) =>
        set((s) => ({ damageFees: [...(s.damageFees ?? []), fee] })),

      removeDamageFee: (index) =>
        set((s) => ({ damageFees: (s.damageFees ?? []).filter((_, i) => i !== index) })),

      updateDamageFee: (index, text) =>
        set((s) => ({
          damageFees: (s.damageFees ?? []).map((f, i) => (i === index ? text : f)),
        })),
    }),
    { name: 'hl-settings-v1' }
  )
);
