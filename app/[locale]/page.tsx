import { getTranslations, getLocale } from 'next-intl/server';
import Link from 'next/link';
import { Leaf, Coffee, Globe, ArrowRight, Wifi, Wind, Droplets, Plane, Factory } from 'lucide-react';
import Navbar from '@/components/Navbar';
import HeroSection from '@/components/HeroSection';
import AvailabilityChecker from '@/components/AvailabilityChecker';
import FooterPricingInfo from '@/components/FooterPricingInfo';
import ContactInfo from '@/components/ContactInfo';
import { activeRooms } from '@/lib/rooms';

const ROOM_THEMES: Record<string, { from: string; to: string; accent: string }> = {
  'green-mountain': { from: 'from-blue-900',    to: 'to-slate-900',   accent: 'text-blue-200' },
  'ban-flower':     { from: 'from-sky-100',     to: 'to-indigo-50',   accent: 'text-blue-500' },
  'family-room':    { from: 'from-blue-600',    to: 'to-blue-900',    accent: 'text-blue-100' },
  'deluxe':         { from: 'from-blue-400',    to: 'to-indigo-700',  accent: 'text-sky-200' },
};

function amenityKey(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z_]/g, '');
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  'WiFi':           <Wifi className="w-3.5 h-3.5" />,
  'AC':             <Wind className="w-3.5 h-3.5" />,
  'Hot water':      <Droplets className="w-3.5 h-3.5" />,
};

export default async function HomePage() {
  const t = await getTranslations();
  const locale = await getLocale();

  return (
    <div className="bg-white">
      <Navbar />

      {/* ─── Hero ─── */}
      <HeroSection />

      {/* ─── Availability Checker (overlaps hero bottom) ─── */}
      <AvailabilityChecker />

      {/* ─── Why Choose Us ─── */}
      <section className="pt-24 pb-20 px-5 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body text-blue-600 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
              {t('features.eyebrow')}
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl font-light text-forest-900 mb-4">
              {t('features.title')}
            </h2>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-px bg-blue-300" />
              <div className="w-1.5 h-1.5 rounded-full bg-blue-400" />
              <div className="w-10 h-px bg-blue-300" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Mountain Views */}
            <div className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-cream-300/70 hover:border-gold/40 hover:shadow-lg hover:shadow-forest/5 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-forest-50 flex items-center justify-center mb-5 group-hover:bg-forest/10 transition-colors">
                <Leaf className="w-7 h-7 text-forest" />
              </div>
              <h3 className="font-heading text-2xl font-semibold text-forest-900 mb-3">{t('features.views_title')}</h3>
              <p className="font-body text-forest-600/80 text-sm leading-relaxed">{t('features.views_desc')}</p>
            </div>

            {/* Homemade Breakfast */}
            <div className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-cream-300/70 hover:border-gold/40 hover:shadow-lg hover:shadow-forest/5 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                <Coffee className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-heading text-2xl font-semibold text-forest-900 mb-3">{t('features.breakfast_title')}</h3>
              <p className="font-body text-forest-600/80 text-sm leading-relaxed">{t('features.breakfast_desc')}</p>
            </div>

            {/* Local Experience */}
            <div className="group flex flex-col items-center text-center p-8 rounded-2xl bg-white border border-cream-300/70 hover:border-gold/40 hover:shadow-lg hover:shadow-forest/5 transition-all duration-300">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center mb-5 group-hover:bg-blue-100 transition-colors">
                <Globe className="w-7 h-7 text-blue-600" />
              </div>
              <h3 className="font-heading text-2xl font-semibold text-forest-900 mb-3">{t('features.local_title')}</h3>
              <p className="font-body text-forest-600/80 text-sm leading-relaxed">{t('features.local_desc')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Location Advantages ─── */}
      <section className="py-16 px-5 sm:px-8 bg-gradient-to-b from-blue-50 to-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-10">
            <p className="font-body text-blue-600 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
              {t('location.eyebrow')}
            </p>
            <h2 className="font-heading text-3xl sm:text-4xl font-light text-forest-900">
              {t('location.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Airport */}
            <div className="flex gap-5 p-7 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                <Plane className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold text-forest-900 mb-2">
                  {t('location.airport_title')}
                </h3>
                <p className="font-body text-forest-600/80 text-sm leading-relaxed">
                  {t('location.airport_desc')}
                </p>
              </div>
            </div>

            {/* Industrial zone */}
            <div className="flex gap-5 p-7 rounded-2xl bg-white border border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all duration-300">
              <div className="w-12 h-12 rounded-2xl bg-forest-900 flex items-center justify-center flex-shrink-0">
                <Factory className="w-6 h-6 text-sky-300" />
              </div>
              <div>
                <h3 className="font-heading text-xl font-semibold text-forest-900 mb-2">
                  {t('location.industry_title')}
                </h3>
                <p className="font-body text-forest-600/80 text-sm leading-relaxed">
                  {t('location.industry_desc')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Rooms Preview ─── */}
      <section className="py-20 px-5 sm:px-8 bg-forest-900">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <p className="font-body text-sky-300 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
              {t('features.rooms_eyebrow')}
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl font-light text-white mb-4">
              {t('rooms.title')}
            </h2>
            <div className="flex items-center justify-center gap-3">
              <div className="w-10 h-px bg-sky-400/50" />
              <div className="w-1.5 h-1.5 rounded-full bg-sky-400/70" />
              <div className="w-10 h-px bg-sky-400/50" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {activeRooms.map((room) => {
              const theme = ROOM_THEMES[room.id] ?? ROOM_THEMES['deluxe'];
              const topAmenities = room.amenities.slice(0, 3);
              return (
                <div
                  key={room.id}
                  className="group bg-forest-800/60 border border-white/8 rounded-2xl overflow-hidden hover:border-sky-400/30 hover:shadow-xl hover:shadow-black/30 transition-all duration-400 flex flex-col"
                >
                  {/* Color placeholder image */}
                  <div className={`relative h-44 bg-gradient-to-br ${theme.from} ${theme.to} flex items-end p-4 overflow-hidden`}>
                    {/* Subtle shimmer texture */}
                    <div className="absolute inset-0 hero-pattern opacity-30" />
                    {/* Large room number watermark */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                      <span className={`font-heading text-[72px] font-light leading-none opacity-10 ${theme.accent}`}>
                        {room.roomNumber}
                      </span>
                    </div>
                    {/* Room type + number badge */}
                    <div className="relative z-10 flex flex-col gap-1">
                      <span className="font-body text-xs font-semibold tracking-wide px-2.5 py-1 rounded-full bg-black/30 text-white/90 backdrop-blur-sm w-fit">
                        {room.type}
                      </span>
                      <span className={`font-mono text-[10px] font-bold tracking-[0.15em] opacity-60 pl-0.5 ${theme.accent}`}>
                        #{room.roomNumber}
                      </span>
                    </div>
                    
                  </div>

                  {/* Card body */}
                  <div className="flex flex-col flex-1 p-5">
                    <h3 className="font-heading text-xl font-semibold text-white mb-0.5">
                      {room.nameVi}
                    </h3>
                    <p className="font-body text-cream-400 text-xs mb-3">{room.nameEn}</p>

                    {/* Amenity chips */}
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {topAmenities.map((a) => (
                        <span
                          key={a}
                          className="flex items-center gap-1 font-body text-xs text-white/60 bg-white/8 px-2 py-0.5 rounded-full"
                        >
                          {AMENITY_ICONS[a] ?? null}
                          {t(`amenities.${amenityKey(a)}`)}
                        </span>
                      ))}
                    </div>

                    {/* CTA */}
                    <div className="mt-auto">
                      <Link
                        href={`/${locale}/rooms`}
                        className="flex items-center justify-center gap-1.5 w-full py-2.5 rounded-xl border border-white/25 text-white/80 font-body text-sm font-medium hover:bg-white/10 hover:border-white/50 transition-all duration-200 group-hover:border-sky-400/50 group-hover:text-sky-200"
                      >
                        {t('rooms.view_details')}
                        <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="text-center mt-10">
            <Link
              href={`/${locale}/rooms`}
              className="inline-flex items-center gap-2 font-body text-sm font-medium text-sky-300 hover:text-sky-200 transition-colors"
            >
              {t('features.view_all_rooms')}
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Contact / Location ─── */}
      <section id="contact" className="py-20 px-5 sm:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="font-body text-blue-600 text-xs font-semibold tracking-[0.25em] uppercase mb-3">
              {t('contact.eyebrow')}
            </p>
            <h2 className="font-heading text-4xl sm:text-5xl font-light text-forest-900">
              {t('contact.title')}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-start">
            {/* Google Maps embed */}
            <div className="rounded-2xl overflow-hidden border border-cream-300 shadow-md aspect-[4/3]">
              <iframe
                src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.47!2d106.9515792!3d10.7368103!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x317519f2844661c7%3A0xb57f67a0e347a91f!2sHoang%20Long%20Homestay!5e0!3m2!1sen!2svn!4v1716000000000!5m2!1sen!2svn"
                width="100%"
                height="100%"
                style={{ border: 0, display: 'block' }}
                allowFullScreen
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
                title="Hoang Long Homestay location"
              />
            </div>

            {/* Details — reads live from settings store */}
            <ContactInfo />
          </div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="bg-forest-900 border-t border-white/8 px-5 sm:px-8 py-10">
        <div className="max-w-5xl mx-auto flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-white">
            <span className="font-heading text-lg font-semibold text-white">Hoang Long</span>
            <span className="text-white/30">·</span>
            <span className="font-body text-sm text-white/60">Homestay</span>
          </div>
          <p className="font-body text-white/40 text-xs text-center">
            {t('footer.rights')}
          </p>
          <FooterPricingInfo />
          <div className="flex items-center gap-5">
            {(['vi', 'en', 'zh', 'ko', 'ja'] as const).map((l) => (
              <Link
                key={l}
                href={`/${l}`}
                className={`font-body text-xs font-medium transition-colors ${
                  l === locale ? 'text-sky-300' : 'text-white/40 hover:text-white/70'
                }`}
              >
                {l.toUpperCase()}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
