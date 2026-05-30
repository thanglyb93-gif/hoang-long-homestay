'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useParams, useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Menu, X, ChevronDown, Settings } from 'lucide-react';

const LOCALES = ['vi', 'en', 'zh', 'ko', 'ja'];

const LANGUAGES = [
  { code: 'vi', flag: '🇻🇳', label: 'VI' },
  { code: 'en', flag: '🇺🇸', label: 'EN' },
  { code: 'zh', flag: '🇨🇳', label: 'ZH' },
  { code: 'ko', flag: '🇰🇷', label: 'KO' },
  { code: 'ja', flag: '🇯🇵', label: 'JA' },
];

/** HL monogram mark — uses currentColor so it adapts to white or navy context */
function HLMark({ className = '' }: { className?: string }) {
  return (
    <svg
      width="36"
      height="27"
      viewBox="0 0 220 165"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      className={className}
    >
      {/* H left stem */}
      <rect x="10"  y="10"  width="40" height="115"/>
      {/* H / L shared center bar */}
      <rect x="90"  y="10"  width="40" height="70"/>
      {/* H outer-right bar */}
      <rect x="168" y="10"  width="42" height="70"/>
      {/* H crossbar */}
      <rect x="50"  y="50"  width="80" height="26"/>
      {/* L foot */}
      <rect x="90"  y="113" width="120" height="40"/>
    </svg>
  );
}

export default function Navbar() {
  const t = useTranslations('nav');
  const pathname = usePathname();
  const params = useParams();
  const router = useRouter();
  const locale = params.locale as string;

  const [scrolled,   setScrolled]   = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [langOpen,   setLangOpen]   = useState(false);
  const langRef = useRef<HTMLDivElement>(null);

  // Scroll listener
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close lang dropdown on outside click
  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false); }, [pathname]);

  // On mount: apply stored locale preference if different from URL locale
  useEffect(() => {
    const stored = localStorage.getItem('hl-locale');
    if (stored && stored !== locale && LOCALES.includes(stored)) {
      const segments = pathname.split('/');
      segments[1] = stored;
      router.replace(segments.join('/'));
    }
    // Run only once on mount — intentionally omitting deps
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchLocale(newLocale: string) {
    localStorage.setItem('hl-locale', newLocale);
    document.cookie = `NEXT_LOCALE=${newLocale};path=/;max-age=31536000;SameSite=lax`;
    const segments = pathname.split('/');
    segments[1] = newLocale;
    router.push(segments.join('/'));
    setLangOpen(false);
  }

  const currentLang = LANGUAGES.find((l) => l.code === locale) ?? LANGUAGES[0];

  const navLinks = [
    { href: `/${locale}`,         label: t('home') },
    { href: `/${locale}/rooms`,   label: t('rooms') },
    { href: `/${locale}/booking`, label: t('booking') },
    { href: `/${locale}/rules`,   label: t('rules') },
    { href: `#contact`,           label: t('contact') },
  ];

  const textColor  = 'text-white';
  const activeColor = 'text-sky-300';

  // Only the homepage has a dark hero — all other pages have white backgrounds,
  // so the navbar must always be solid dark on inner pages.
  const isHomePage = pathname === `/${locale}`;
  const solidBg = scrolled || mobileOpen || !isHomePage;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        solidBg
          ? 'bg-[#060e25] shadow-lg shadow-black/30'
          : 'bg-gradient-to-b from-black/40 to-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-5 sm:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">

          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 group">
            <HLMark className="text-white opacity-90 group-hover:opacity-100 transition-opacity duration-300" />
            <div className="flex flex-col leading-none">
              <span className="font-body text-[13px] font-bold tracking-[0.18em] text-white uppercase">
                Hoang Long
              </span>
              <span className="font-body text-[9px] font-medium tracking-[0.28em] text-white/60 uppercase mt-0.5">
                Homestay
              </span>
            </div>
          </Link>

          {/* Desktop nav */}
          <nav className="hidden md:flex items-center gap-7">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-body text-sm font-medium tracking-wide transition-colors duration-200 hover:text-sky-300 ${
                  pathname === link.href ? activeColor : textColor
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Admin tab — always last, subtly styled */}
            <Link
              href="/admin"
              className={`flex items-center gap-1.5 font-body text-sm font-medium tracking-wide transition-colors duration-200 hover:text-sky-300 ${
                pathname.startsWith('/admin') ? activeColor : 'text-white/50 hover:text-white/80'
              }`}
            >
              <Settings className="w-3.5 h-3.5" />
              Admin
            </Link>
          </nav>

          {/* Right: lang switcher + mobile toggle */}
          <div className="flex items-center gap-3">
            {/* Language switcher */}
            <div ref={langRef} className="relative">
              <button
                onClick={() => setLangOpen((o) => !o)}
                className={`flex items-center gap-1.5 text-sm font-medium px-2.5 py-1.5 rounded-lg transition-colors duration-200 hover:bg-white/10 ${textColor}`}
                aria-label="Switch language"
              >
                <span className="text-base leading-none">{currentLang.flag}</span>
                <span className="font-body">{currentLang.label}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${langOpen ? 'rotate-180' : ''}`} />
              </button>

              {langOpen && (
                <div className="absolute right-0 mt-1.5 py-1 w-36 bg-[#060e25] border border-white/10 rounded-xl shadow-2xl animate-fade-down">
                  {LANGUAGES.map((lang) => (
                    <button
                      key={lang.code}
                      onClick={() => switchLocale(lang.code)}
                      className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 text-sm font-body transition-colors hover:bg-white/10 ${
                        lang.code === locale ? 'text-sky-300 font-semibold' : 'text-white/80 hover:text-white'
                      }`}
                    >
                      <span className="text-base">{lang.flag}</span>
                      <span>{lang.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen((o) => !o)}
              className={`md:hidden p-2 rounded-lg transition-colors hover:bg-white/10 ${textColor}`}
              aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-[#060e25] animate-fade-down">
          <nav className="max-w-6xl mx-auto px-5 py-4 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`font-body text-base font-medium px-3 py-2.5 rounded-lg transition-colors hover:bg-white/10 ${
                  pathname === link.href ? 'text-sky-300' : 'text-cream-100'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/admin"
              className={`flex items-center gap-2 font-body text-base font-medium px-3 py-2.5 rounded-lg transition-colors hover:bg-white/10 ${
                pathname.startsWith('/admin') ? 'text-sky-300' : 'text-white/50'
              }`}
            >
              <Settings className="w-4 h-4" />
              Admin
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
