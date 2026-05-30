'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { supabase } from './supabase';

export interface SettingsData {
  contactPhone:         string;
  contactEmail:         string;
  address:              string;
  bankName:             string;
  bankAccount:          string;
  bankAccountName:      string;
  bankQrUrl:            string;
  momoPhone:            string;
  momoName:             string;
  momoQrUrl:            string;
  stripePublishableKey: string;
  cardPaymentEnabled:   boolean;
  houseRules:           string[];
  damageFees:           string[];
}

interface SettingsState extends SettingsData {
  loaded:          boolean;
  loadFromDB:      () => Promise<void>;
  update:          (patch: Partial<SettingsData>) => Promise<void>;
  addRule:         (rule: string) => void;
  removeRule:      (index: number) => void;
  updateRule:      (index: number, text: string) => void;
  moveRule:        (from: number, to: number) => void;
  resetRules:      () => void;
  addDamageFee:    (fee: string) => void;
  removeDamageFee: (index: number) => void;
  updateDamageFee: (index: number, text: string) => void;
}

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
  address:              'Phuoc Kiang, Nhon Trach, Dong Nai, Viet Nam',
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
    'Damaged furniture: 500,000 – 3,000,000 VND',
    'Stained / damaged mattress or bedding: 500,000 – 2,000,000 VND',
    'Missing or damaged accessories: 200,000 – 500,000 VND',
    'Damaged TV, A/C or appliances: replacement cost + labour',
    'Lost key card: 200,000 VND',
    'Smoking in room: 1,000,000 VND flat fee',
    'Deep cleaning required: 300,000 – 1,000,000 VND',
  ],
};

async function saveToDB(data: Partial<SettingsData>) {
  await supabase.from('settings').upsert({
    id: 'main',
    contact_phone:      data.contactPhone,
    contact_email:      data.contactEmail,
    address:            data.address,
    bank_name:          data.bankName,
    bank_account:       data.bankAccount,
    bank_account_name:  data.bankAccountName,
    bank_qr_url:        data.bankQrUrl,
    momo_phone:         data.momoPhone,
    momo_name:          data.momoName,
    momo_qr_url:        data.momoQrUrl,
    house_rules:        data.houseRules,
    damage_fees:        data.damageFees,
    updated_at:         new Date().toISOString(),
  });
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set, get) => ({
      ...DEFAULTS,
      loaded: false,

      loadFromDB: async () => {
        const { data, error } = await supabase
          .from('settings')
          .select('*')
          .eq('id', 'main')
          .single();
        if (error || !data) return;
        set({
          loaded:           true,
          contactPhone:     data.contact_phone     || DEFAULTS.contactPhone,
          contactEmail:     data.contact_email     || DEFAULTS.contactEmail,
          address:          data.address           || DEFAULTS.address,
          bankName:         data.bank_name         || DEFAULTS.bankName,
          bankAccount:      data.bank_account      || DEFAULTS.bankAccount,
          bankAccountName:  data.bank_account_name || DEFAULTS.bankAccountName,
          bankQrUrl:        data.bank_qr_url       || '',
          momoPhone:        data.momo_phone        || DEFAULTS.momoPhone,
          momoName:         data.momo_name         || DEFAULTS.momoName,
          momoQrUrl:        data.momo_qr_url       || '',
          houseRules:       data.house_rules       || DEFAULTS.houseRules,
          damageFees:       data.damage_fees       || DEFAULTS.damageFees,
        });
      },

      update: async (patch) => {
        set((s) => ({ ...s, ...patch }));
        const current = { ...get(), ...patch };
        await saveToDB(current);
      },

      addRule: (rule) => {
        set((s) => ({ houseRules: [...s.houseRules, rule] }));
        saveToDB({ houseRules: [...get().houseRules] });
      },

      removeRule: (index) => {
        set((s) => ({ houseRules: s.houseRules.filter((_, i) => i !== index) }));
        saveToDB({ houseRules: get().houseRules });
      },

      updateRule: (index, text) => {
        set((s) => ({ houseRules: s.houseRules.map((r, i) => i === index ? text : r) }));
        saveToDB({ houseRules: get().houseRules });
      },

      moveRule: (from, to) => {
        set((s) => {
          const rules = [...s.houseRules];
          const [item] = rules.splice(from, 1);
          rules.splice(to, 0, item);
          return { houseRules: rules };
        });
        saveToDB({ houseRules: get().houseRules });
      },

      resetRules: () => {
        set({ houseRules: DEFAULT_RULES });
        saveToDB({ houseRules: DEFAULT_RULES });
      },

      addDamageFee: (fee) => {
        set((s) => ({ damageFees: [...(s.damageFees ?? []), fee] }));
        saveToDB({ damageFees: get().damageFees });
      },

      removeDamageFee: (index) => {
        set((s) => ({ damageFees: (s.damageFees ?? []).filter((_, i) => i !== index) }));
        saveToDB({ damageFees: get().damageFees });
      },

      updateDamageFee: (index, text) => {
        set((s) => ({ damageFees: (s.damageFees ?? []).map((f, i) => i === index ? text : f) }));
        saveToDB({ damageFees: get().damageFees });
      },
    }),
    { name: 'hl-settings-v2' }
  )
);