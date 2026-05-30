import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import { ArrowDown } from 'lucide-react';

export default async function HeroSection() {
  const t = await getTranslations('hero');
  const locale = await getLocale();

  return (
    <section className="relative w-full min-h-screen flex flex-col items-center justify-center overflow-hidden"
      style={{ background: 'linear-gradient(160deg, #050d1f 0%, #0b1a42 45%, #060e25 100%)' }}
    >

      {/* ── Aurora glow blobs ───────────────────────────────────────────── */}
      <div className="absolute -top-40 -left-40 w-[700px] h-[700px] rounded-full bg-blue-600/20 blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-indigo-500/15 blur-[110px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] rounded-full bg-sky-600/10 blur-[90px] pointer-events-none" />

      {/* ── Top edge light bar ──────────────────────────────────────────── */}
      <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-blue-400/40 to-transparent" />
      <div className="absolute top-0 inset-x-0 h-24 bg-gradient-to-b from-blue-500/8 to-transparent pointer-events-none" />

      {/* ── Dot grid ────────────────────────────────────────────────────── */}
      <div className="absolute inset-0 hero-dots pointer-events-none" />

      {/* ── Bottom fade to white (seamless handoff to AvailabilityChecker) */}
      <div className="absolute bottom-0 inset-x-0 h-52 bg-gradient-to-t from-white via-white/20 to-transparent pointer-events-none" />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto flex flex-col items-center">

        {/* Eyebrow */}
        <div
          className="flex items-center gap-3 mb-7 opacity-0 animate-fade-in animate-on-load"
          style={{ animationDelay: '100ms', animationFillMode: 'forwards' }}
        >
          <div className="h-px w-8 bg-sky-400/60" />
          <p className="font-body text-sky-300 text-xs font-semibold tracking-[0.3em] uppercase">
            {t('eyebrow')}
          </p>
          <div className="h-px w-8 bg-sky-400/60" />
        </div>

        {/* Main headline */}
        <h1
          className="font-heading text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-light text-white leading-[1.08] tracking-tight mb-7 text-balance opacity-0 animate-fade-up animate-on-load"
          style={{ animationDelay: '250ms', animationFillMode: 'forwards' }}
        >
          {t('headline')}
        </h1>

        {/* Decorative divider */}
        <div
          className="flex items-center gap-3 mb-8 opacity-0 animate-fade-in animate-on-load"
          style={{ animationDelay: '420ms', animationFillMode: 'forwards' }}
        >
          <div className="w-14 h-px bg-gradient-to-r from-transparent to-sky-400/60" />
          <div className="w-1.5 h-1.5 rounded-full bg-sky-400/80" />
          <div className="w-14 h-px bg-gradient-to-l from-transparent to-sky-400/60" />
        </div>

        {/* Subheadline */}
        <p
          className="font-body text-white/65 text-base sm:text-lg md:text-xl font-light leading-relaxed max-w-2xl mb-10 text-balance opacity-0 animate-fade-up animate-on-load"
          style={{ animationDelay: '540ms', animationFillMode: 'forwards' }}
        >
          {t('subheadline')}
        </p>

        {/* CTAs */}
        <div
          className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 opacity-0 animate-fade-up animate-on-load w-full sm:w-auto"
          style={{ animationDelay: '680ms', animationFillMode: 'forwards' }}
        >
          <a
            href="#availability"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-blue-600 hover:bg-blue-500 active:scale-95 text-white font-body font-semibold text-sm tracking-wide px-9 py-4 rounded-full transition-all duration-300 shadow-lg shadow-blue-900/40 hover:shadow-blue-600/50 hover:-translate-y-0.5"
          >
            {t('cta_button')}
          </a>
          <Link
            href={`/${locale}/rooms`}
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto border border-white/20 hover:border-white/50 active:scale-95 text-white/85 hover:text-white font-body font-medium text-sm tracking-wide px-9 py-4 rounded-full transition-all duration-300 hover:bg-white/8 backdrop-blur-sm"
          >
            {t('explore_rooms')}
          </Link>
        </div>
      </div>

      {/* ── Scroll hint ─────────────────────────────────────────────────── */}
      <div
        className="absolute bottom-36 sm:bottom-40 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 opacity-0 animate-fade-in animate-on-load"
        style={{ animationDelay: '1100ms', animationFillMode: 'forwards' }}
      >
        <span className="font-body text-white/35 text-[10px] tracking-[0.25em] uppercase">{t('scroll_hint')}</span>
        <ArrowDown className="w-3.5 h-3.5 text-white/30 animate-bounce" />
      </div>
    </section>
  );
}
