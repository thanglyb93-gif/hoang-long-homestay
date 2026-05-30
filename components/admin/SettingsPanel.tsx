'use client';

import { useState, useRef, ChangeEvent } from 'react';
import Image from 'next/image';
import {
  Phone, Mail, MapPin, Building2, CreditCard, Smartphone,
  ScrollText, Plus, Trash2, GripVertical, Check, RotateCcw,
  QrCode, Upload, Loader2, AlertCircle, ExternalLink, DollarSign,
} from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';

// ── Reusable field ────────────────────────────────────────────────────────────

function Field({
  label, value, onChange, placeholder, type = 'text', mono = false,
}: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; mono?: boolean;
}) {
  return (
    <div>
      <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${mono ? 'price-mono text-slate-400' : 'font-body text-slate-400'}`}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full text-sm bg-[#0b1120] border border-slate-600 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-700 outline-none transition-colors ${mono ? 'price-mono' : 'font-body'}`}
      />
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }: {
  icon: React.ElementType; title: string; subtitle?: string;
}) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <div className="w-8 h-8 rounded-lg bg-blue-900/50 flex items-center justify-center flex-shrink-0">
        <Icon className="w-4 h-4 text-blue-400" />
      </div>
      <div>
        <h3 className="price-mono text-white font-bold text-sm">{title}</h3>
        {subtitle && <p className="font-body text-slate-500 text-xs mt-0.5">{subtitle}</p>}
      </div>
    </div>
  );
}

// ── Damage Fees Editor ───────────────────────────────────────────────────────

function DamageFeesEditor() {
  const { damageFees = [], addDamageFee, removeDamageFee, updateDamageFee } = useSettingsStore();
  const [newFee, setNewFee] = useState('');

  function handleAdd() {
    const trimmed = newFee.trim();
    if (!trimmed) return;
    addDamageFee(trimmed);
    setNewFee('');
  }

  return (
    <div>
      <p className="price-mono text-slate-400 text-xs font-semibold uppercase tracking-wider mb-3">
        {damageFees.length} item{damageFees.length !== 1 ? 's' : ''}
      </p>

      <div className="space-y-1.5 mb-3">
        {damageFees.map((fee, i) => (
          <div key={i} className="flex items-center gap-2 bg-[#0b1120] border border-slate-700 rounded-xl px-3 py-2.5">
            <DollarSign className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
            <input
              type="text"
              value={fee}
              onChange={(e) => updateDamageFee(i, e.target.value)}
              className="font-body text-sm text-white bg-transparent outline-none flex-1 min-w-0"
            />
            <button
              onClick={() => removeDamageFee(i)}
              className="flex-shrink-0 text-slate-700 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={newFee}
          onChange={(e) => setNewFee(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="e.g. Broken window: 500,000 – 2,000,000 VND"
          className="flex-1 font-body text-sm bg-[#0b1120] border border-slate-600 focus:border-blue-500 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-700 outline-none transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!newFee.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-body font-semibold text-sm rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
}

// ── QR Code Upload ────────────────────────────────────────────────────────────

function QrUpload({
  label, currentUrl, qrTarget, onUploaded,
}: {
  label: string;
  currentUrl: string;
  qrTarget: 'bank' | 'momo';
  onUploaded: (url: string) => void;
}) {
  const inputRef  = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [manual,  setManual]  = useState(currentUrl);

  async function handleFile(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true); setError('');
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('type', 'qr');
      fd.append('qrTarget', qrTarget);
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      onUploaded(data.url);
      setManual(data.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  function handleManualSave() {
    onUploaded(manual.trim());
  }

  return (
    <div className="space-y-3">
      <p className="price-mono text-slate-400 text-xs font-semibold uppercase tracking-wider">{label}</p>

      {/* Preview */}
      <div className="flex items-center gap-4">
        <div className="w-20 h-20 rounded-xl border border-slate-600 overflow-hidden bg-[#0b1120] flex items-center justify-center flex-shrink-0">
          {currentUrl ? (
            <Image src={currentUrl} alt="QR" width={80} height={80} className="object-contain" />
          ) : (
            <QrCode className="w-8 h-8 text-slate-700" />
          )}
        </div>
        <div className="flex-1 min-w-0 space-y-2">
          {/* Upload button */}
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white price-mono font-bold text-xs rounded-xl transition-colors"
          >
            {loading
              ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Uploading…</>
              : <><Upload className="w-3.5 h-3.5" /> Upload QR Image</>}
          </button>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />

          {/* Or paste URL */}
          <div className="flex gap-2">
            <input
              type="url"
              value={manual}
              onChange={(e) => setManual(e.target.value)}
              placeholder="Or paste image URL…"
              className="flex-1 price-mono text-xs bg-[#0b1120] border border-slate-600 focus:border-blue-500 rounded-xl px-3 py-2 text-white placeholder:text-slate-700 outline-none transition-colors min-w-0"
            />
            <button
              type="button"
              onClick={handleManualSave}
              className="px-3 py-2 bg-slate-700 hover:bg-slate-600 text-white price-mono text-xs rounded-xl transition-colors flex-shrink-0"
            >
              Save
            </button>
          </div>

          {error && (
            <p className="flex items-center gap-1 font-body text-xs text-red-400">
              <AlertCircle className="w-3 h-3" /> {error}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

// ── House Rules Editor ────────────────────────────────────────────────────────

function RulesEditor() {
  const { houseRules, addRule, removeRule, updateRule, moveRule, resetRules } = useSettingsStore();
  const [newRule, setNewRule] = useState('');
  const [dragging, setDragging] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);

  function handleAdd() {
    const trimmed = newRule.trim();
    if (!trimmed) return;
    addRule(trimmed);
    setNewRule('');
  }

  function handleDragStart(i: number) { setDragging(i); }
  function handleDragOver(i: number, e: React.DragEvent) { e.preventDefault(); setOver(i); }
  function handleDrop(i: number) {
    if (dragging !== null && dragging !== i) moveRule(dragging, i);
    setDragging(null); setOver(null);
  }
  function handleDragEnd() { setDragging(null); setOver(null); }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <p className="price-mono text-slate-400 text-xs font-semibold uppercase tracking-wider">
          {houseRules.length} rule{houseRules.length !== 1 ? 's' : ''}
        </p>
        <button
          onClick={() => { if (confirm('Reset house rules to defaults?')) resetRules(); }}
          className="flex items-center gap-1 font-body text-xs text-slate-500 hover:text-slate-300 transition-colors"
        >
          <RotateCcw className="w-3 h-3" /> Reset
        </button>
      </div>

      <div className="space-y-1.5 mb-3">
        {houseRules.map((rule, i) => (
          <div
            key={i}
            draggable
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(i, e)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            className={`flex items-center gap-2 bg-[#0b1120] border rounded-xl px-3 py-2.5 transition-all ${
              over === i && dragging !== i ? 'border-blue-500 bg-blue-900/20' : 'border-slate-700'
            } ${dragging === i ? 'opacity-50' : ''}`}
          >
            <GripVertical className="w-3.5 h-3.5 text-slate-600 cursor-grab flex-shrink-0" />
            <span className="font-body text-slate-500 text-xs w-5 text-center flex-shrink-0">{i + 1}.</span>
            <input
              type="text"
              value={rule}
              onChange={(e) => updateRule(i, e.target.value)}
              className="font-body text-sm text-white bg-transparent outline-none flex-1 min-w-0"
            />
            <button
              onClick={() => removeRule(i)}
              className="flex-shrink-0 text-slate-700 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>

      {/* Add new rule */}
      <div className="flex gap-2">
        <input
          type="text"
          value={newRule}
          onChange={(e) => setNewRule(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          placeholder="Add a new rule…"
          className="flex-1 font-body text-sm bg-[#0b1120] border border-slate-600 focus:border-blue-500 rounded-xl px-3 py-2.5 text-white placeholder:text-slate-700 outline-none transition-colors"
        />
        <button
          onClick={handleAdd}
          disabled={!newRule.trim()}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-body font-semibold text-sm rounded-xl transition-colors flex-shrink-0"
        >
          <Plus className="w-4 h-4" /> Add
        </button>
      </div>
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function SettingsPanel() {
  const s = useSettingsStore();
  const [saved, setSaved] = useState(false);

  function handleSave() {
    // Settings auto-persist via Zustand. Just show confirmation.
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  }

  return (
    <div className="space-y-6">

      {/* Contact info */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
        <SectionHeader icon={Phone} title="Contact Information" subtitle="Displayed publicly on the website and booking confirmation" />
        <div className="space-y-4">
          <Field
            label="Phone Number"
            value={s.contactPhone}
            onChange={(v) => s.update({ contactPhone: v })}
            placeholder="0900 000 000"
            type="tel"
            mono
          />
          <Field
            label="Email Address"
            value={s.contactEmail}
            onChange={(v) => s.update({ contactEmail: v })}
            placeholder="homestay@email.com"
            type="email"
          />
          <div>
            <label className="block font-body text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              <MapPin className="w-3.5 h-3.5 inline mr-1" />
              Address
            </label>
            <textarea
              value={s.address}
              onChange={(e) => s.update({ address: e.target.value })}
              rows={2}
              placeholder="Full address…"
              className="w-full font-body text-sm bg-[#0b1120] border border-slate-600 focus:border-blue-500 rounded-xl px-4 py-2.5 text-white placeholder:text-slate-700 outline-none transition-colors resize-none"
            />
          </div>
        </div>
      </div>

      {/* Bank transfer */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
        <SectionHeader icon={Building2} title="Bank Transfer Details" subtitle="Shown to guests who choose bank transfer payment" />
        <div className="space-y-4">
          <Field label="Bank Name"       value={s.bankName}        onChange={(v) => s.update({ bankName: v })}        placeholder="Vietcombank" mono />
          <Field label="Account Number"  value={s.bankAccount}     onChange={(v) => s.update({ bankAccount: v })}     placeholder="1234 5678 9012" mono />
          <Field label="Account Name"    value={s.bankAccountName} onChange={(v) => s.update({ bankAccountName: v })} placeholder="HOANG LONG HOMESTAY" mono />
        </div>
      </div>

      {/* MoMo */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
        <SectionHeader icon={Smartphone} title="MoMo E-Wallet" subtitle="Shown to guests who choose MoMo payment" />
        <div className="space-y-4">
          <Field label="MoMo Phone"  value={s.momoPhone} onChange={(v) => s.update({ momoPhone: v })} placeholder="0900 000 000" type="tel" mono />
          <Field label="Display Name" value={s.momoName}  onChange={(v) => s.update({ momoName: v })}  placeholder="HOANG LONG HOMESTAY" mono />
        </div>
      </div>

      {/* QR Codes */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
        <SectionHeader
          icon={QrCode}
          title="Payment QR Codes"
          subtitle="Upload a QR image or paste a URL — shown to guests in the booking payment section"
        />
        <div className="space-y-6">
          <QrUpload
            label="Bank Transfer QR"
            currentUrl={s.bankQrUrl}
            qrTarget="bank"
            onUploaded={(url) => s.update({ bankQrUrl: url })}
          />
          <div className="border-t border-slate-800" />
          <QrUpload
            label="MoMo QR"
            currentUrl={s.momoQrUrl}
            qrTarget="momo"
            onUploaded={(url) => s.update({ momoQrUrl: url })}
          />
        </div>
      </div>

      {/* Card / Stripe */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
        <SectionHeader
          icon={CreditCard}
          title="Card Payment (Stripe)"
          subtitle="Visa & Mastercard — configure Stripe to accept card payments online"
        />
        <div className="space-y-4">
          {/* Enable toggle */}
          <div className="flex items-center justify-between bg-[#0b1120] rounded-xl px-4 py-3 border border-slate-700">
            <div>
              <p className="price-mono text-white text-sm font-semibold">Enable Card Payments</p>
              <p className="font-body text-slate-500 text-xs mt-0.5">
                Shows Stripe card form to guests. Requires keys below to be configured.
              </p>
            </div>
            <button
              type="button"
              onClick={() => s.update({ cardPaymentEnabled: !s.cardPaymentEnabled })}
              className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 ${s.cardPaymentEnabled ? 'bg-blue-600' : 'bg-slate-700'}`}
            >
              <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${s.cardPaymentEnabled ? 'translate-x-5' : ''}`} />
            </button>
          </div>

          {/* Publishable key */}
          <Field
            label="Stripe Publishable Key"
            value={s.stripePublishableKey}
            onChange={(v) => s.update({ stripePublishableKey: v.trim() })}
            placeholder="pk_live_… or pk_test_…"
            mono
          />

          {/* Setup instructions */}
          <div className="bg-blue-900/20 border border-blue-700/40 rounded-xl p-4 space-y-2">
            <p className="price-mono text-blue-300 text-xs font-bold uppercase tracking-wider">Setup Instructions</p>
            <ol className="font-body text-slate-400 text-xs space-y-1 list-decimal list-inside">
              <li>Run <code className="price-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">npm install stripe @stripe/stripe-js</code></li>
              <li>Create <code className="price-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">.env.local</code> and add <code className="price-mono text-slate-300 bg-slate-800 px-1.5 py-0.5 rounded">STRIPE_SECRET_KEY=sk_live_…</code></li>
              <li>Enter your Publishable Key above (starts with <code className="price-mono text-slate-300">pk_live_</code>)</li>
              <li>Toggle "Enable Card Payments" ON</li>
              <li>Restart the dev server</li>
            </ol>
            <p className="font-body text-amber-400 text-[10px] mt-2">
              ⚠ Stripe does not support VND. Card charges are converted to USD at ~25,000 VND / 1 USD.
            </p>
            <a
              href="https://dashboard.stripe.com/apikeys"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 price-mono text-blue-400 hover:text-blue-300 text-xs transition-colors"
            >
              <ExternalLink className="w-3 h-3" /> Open Stripe Dashboard
            </a>
          </div>
        </div>
      </div>

      {/* House Rules */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
        <SectionHeader
          icon={ScrollText}
          title="House Rules"
          subtitle="Drag to reorder · click to edit inline · guests must agree before booking"
        />
        <RulesEditor />
      </div>

      {/* Damage Fees */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 p-6">
        <SectionHeader
          icon={AlertCircle}
          title="Damage Fee Schedule"
          subtitle="Shown in House Rules and booking confirmation — one fee item per line"
        />
        <DamageFeesEditor />
      </div>

      {/* Save bar */}
      <div className="flex items-center justify-between bg-[#111827] rounded-2xl border border-slate-700 px-5 py-4">
        <p className="font-body text-slate-400 text-sm">
          Changes are saved automatically when you type.
        </p>
        <button
          onClick={handleSave}
          className="flex items-center gap-2 px-5 py-2.5 bg-green-600 hover:bg-green-500 text-white price-mono font-bold text-sm rounded-xl transition-colors"
        >
          {saved ? <><Check className="w-4 h-4" /> Saved!</> : <><Check className="w-4 h-4" /> Confirm Save</>}
        </button>
      </div>
    </div>
  );
}
