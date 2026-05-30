'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useParams, usePathname } from 'next/navigation';
import {
  Lock, LogOut, LayoutDashboard, BedDouble,
  CalendarCheck, Link2, KeyRound, Eye, EyeOff,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';

interface Props {
  children: React.ReactNode;
}

const NAV_ITEMS = [
  { href: 'dashboard',  label: 'Dashboard',     icon: LayoutDashboard },
  { href: 'rooms',      label: 'Rooms',         icon: BedDouble       },
  { href: 'bookings',   label: 'Bookings',      icon: CalendarCheck   },
  { href: 'channels',   label: 'Channel Sync',  icon: Link2           },
];

export default function AdminShell({ children }: Props) {
  const { isAuthenticated, login, logout } = useAdminStore();
  const params   = useParams();
  const pathname = usePathname();
  const locale   = params.locale as string;

  const [pin,    setPin]    = useState('');
  const [error,  setError]  = useState(false);
  const [showPw, setShowPw] = useState(false);

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    const ok = login(pin);
    if (!ok) { setError(true); setPin(''); }
    else       setError(false);
  }

  // ── Login screen ──────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-forest-950 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-blue-600 via-sky-400 to-blue-800" />
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-forest-900 flex items-center justify-center mb-4">
                <Lock className="w-7 h-7 text-sky-300" />
              </div>
              <h1 className="font-heading text-2xl font-semibold text-forest-900">Admin Login</h1>
              <p className="font-body text-xs text-forest-400 mt-1">Hoang Long Homestay</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPw ? 'text' : 'password'}
                  value={pin}
                  onChange={(e) => { setPin(e.target.value); setError(false); }}
                  placeholder="Enter admin PIN"
                  autoFocus
                  className={`w-full font-body text-sm text-forest-900 bg-cream-50 border rounded-xl px-4 py-3 pr-10 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors ${
                    error ? 'border-red-400 bg-red-50' : 'border-cream-300'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-forest-400 hover:text-forest-600"
                >
                  {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {error && (
                <p className="font-body text-xs text-red-500">Incorrect PIN. Please try again.</p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-body font-semibold text-sm py-3 rounded-xl transition-colors"
              >
                Login
              </button>
            </form>

            <p className="font-body text-[11px] text-forest-300 text-center mt-6">
              Default PIN: <span className="font-mono">HL2024</span> — change in Settings after login
            </p>
          </div>
        </div>
      </div>
    );
  }

  // ── Admin shell ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top bar */}
      <header className="bg-forest-900 border-b border-white/10 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <KeyRound className="w-4 h-4 text-sky-300" />
          <span className="font-heading text-base font-semibold text-white">Admin</span>
          <span className="text-white/30 text-sm">·</span>
          <span className="font-body text-sm text-white/50">Hoang Long Homestay</span>
        </div>

        <div className="flex items-center gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const full    = `/${locale}/admin/${href}`;
            const active  = pathname === full;
            return (
              <Link
                key={href}
                href={full}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-body text-xs font-medium transition-colors ${
                  active
                    ? 'bg-white/10 text-white'
                    : 'text-white/60 hover:text-white hover:bg-white/8'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex items-center gap-1 ml-2 px-3 py-1.5 rounded-lg font-body text-xs text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* Page content */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </div>
    </div>
  );
}
