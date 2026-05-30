'use client';

import { useState } from 'react';
import {
  Lock, Eye, EyeOff, LogOut,
  LayoutDashboard, DollarSign, ImageIcon, BedDouble, CalendarDays,
  Sparkles, TrendingUp, SlidersHorizontal, Pencil,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import OverviewPanel  from '@/components/admin/OverviewPanel';
import PricingPanel   from '@/components/admin/PricingPanel';
import PhotosPanel    from '@/components/admin/PhotosPanel';
import RoomsPanel     from '@/components/admin/RoomsPanel';
import BookingsPanel  from '@/components/admin/BookingsPanel';
import CleaningPanel  from '@/components/admin/CleaningPanel';
import RevenuePanel   from '@/components/admin/RevenuePanel';
import SettingsPanel  from '@/components/admin/SettingsPanel';
import RoomInfoPanel  from '@/components/admin/RoomInfoPanel';

// ── Tab config ────────────────────────────────────────────────────────────────

type TabId = 'overview' | 'pricing' | 'photos' | 'rooms' | 'bookings' | 'cleaning' | 'revenue' | 'roominfo' | 'settings';

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: 'overview',  label: 'Overview',  icon: LayoutDashboard },
  { id: 'pricing',   label: 'Pricing',   icon: DollarSign },
  { id: 'photos',    label: 'Photos',    icon: ImageIcon },
  { id: 'rooms',     label: 'Rooms',     icon: BedDouble },
  { id: 'bookings',  label: 'Bookings',  icon: CalendarDays },
  { id: 'cleaning',  label: 'Cleaning',  icon: Sparkles },
  { id: 'revenue',   label: 'Revenue',   icon: TrendingUp },
  { id: 'roominfo',  label: 'Room Info', icon: Pencil },
  { id: 'settings',  label: 'Settings',  icon: SlidersHorizontal },
];

// ── Main page ─────────────────────────────────────────────────────────────────

export default function AdminHubPage() {
  const { isAuthenticated, login, logout } = useAdminStore();
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin,  setShowPin]  = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>('overview');

  // ── Login ────────────────────────────────────────────────────────────────────
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (login(pinInput)) { setPinError(false); setPinInput(''); }
    else                 { setPinError(true);  setPinInput(''); }
  }

  // ── PIN gate ─────────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#111827] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-violet-500 to-blue-800" />
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#0b1120] border border-slate-700 flex items-center justify-center mb-4">
                <Lock className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="price-mono text-white text-xl font-bold">Admin Panel</h1>
              <p className="font-body text-slate-500 text-xs mt-1">Hoang Long Homestay</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                  placeholder="Admin PIN"
                  autoFocus
                  className={`w-full price-mono text-sm bg-[#0b1120] border rounded-xl px-4 py-3 pr-10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-colors ${
                    pinError ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                <button type="button" onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && <p className="font-body text-xs text-red-400">Incorrect PIN.</p>}
              <button type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white price-mono font-bold text-sm py-3 rounded-xl transition-colors">
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated dashboard ───────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#0b1120] text-white">

      {/* ── Top bar ─────────────────────────────────────────────────────────── */}
      <header className="bg-[#0d1526] border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          {/* HL mark */}
          <svg width="24" height="18" viewBox="0 0 220 165" fill="currentColor" className="text-blue-400" aria-hidden="true">
            <rect x="10"  y="10"  width="40" height="115"/>
            <rect x="90"  y="10"  width="40" height="70"/>
            <rect x="168" y="10"  width="42" height="70"/>
            <rect x="50"  y="50"  width="80" height="26"/>
            <rect x="90"  y="113" width="120" height="40"/>
          </svg>
          <span className="price-mono text-white font-bold text-sm">Admin Panel</span>
          <span className="text-slate-600 text-sm hidden sm:inline">·</span>
          <span className="font-body text-slate-400 text-xs hidden sm:inline">Hoang Long Homestay</span>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-1.5 font-body text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
        >
          <LogOut className="w-3.5 h-3.5" /> Logout
        </button>
        <a href="/en" className="flex items-center gap-1.5 font-body text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors">
          🏠 Home
        </a>
      </header>

      {/* ── Tab nav ─────────────────────────────────────────────────────────── */}
      <div className="bg-[#0d1526] border-b border-slate-800 px-4 sm:px-6 overflow-x-auto">
        <nav className="flex items-center gap-1 min-w-max">
          {TABS.map((tab) => {
            const Icon     = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-3.5 font-body text-sm font-medium transition-colors whitespace-nowrap ${
                  isActive
                    ? 'text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-blue-400' : ''}`} />
                {tab.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-500 rounded-t-full" />
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* ── Content ─────────────────────────────────────────────────────────── */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {activeTab === 'overview'  && <OverviewPanel />}
        {activeTab === 'pricing'   && <PricingPanel />}
        {activeTab === 'photos'    && <PhotosPanel />}
        {activeTab === 'rooms'     && <RoomsPanel />}
        {activeTab === 'bookings'  && <BookingsPanel />}
        {activeTab === 'cleaning'  && <CleaningPanel />}
        {activeTab === 'revenue'   && <RevenuePanel />}
        {activeTab === 'roominfo'  && <RoomInfoPanel />}
        {activeTab === 'settings'  && <SettingsPanel />}
      </div>

    </div>
  );
}
