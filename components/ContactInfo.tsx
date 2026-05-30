'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { useSettingsStore } from '@/lib/settings-store';

/** Strips non-digit characters and converts Vietnamese local format (0xxx) to WhatsApp format (84xxx). */
export function toWhatsAppNumber(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) return '84' + digits.slice(1);
  return digits;
}

/** Converts a display phone to a tel: href (keeps leading + if present, else just digits). */
function toTelHref(phone: string): string {
  const digits = phone.replace(/\s/g, '');
  return digits.startsWith('+') ? digits : '+' + digits.replace(/\D/g, '');
}

export default function ContactInfo() {
  const t      = useTranslations();
  const params = useParams();
  const locale = params.locale as string;

  const { contactPhone, contactEmail, address } = useSettingsStore();

  return (
    <div className="space-y-6 py-2">
      <div>
        <h3 className="font-heading text-3xl font-semibold text-forest-900 mb-1">
          Hoàng Long Homestay
        </h3>
        <p className="font-body text-forest-600/70 text-sm">{t('contact.subtitle')}</p>
      </div>

      <div className="space-y-4">
        {/* Address */}
        <div className="flex items-start gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-forest/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <MapPin className="w-4 h-4 text-forest-700" />
          </div>
          <div>
            <p className="font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-0.5">
              Address
            </p>
            <p className="font-body text-forest-800 text-sm leading-relaxed whitespace-pre-line">
              {address}
            </p>
          </div>
        </div>

        {/* Phone */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Phone className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-0.5">
              Phone
            </p>
            <a
              href={`tel:${toTelHref(contactPhone)}`}
              className="font-body text-forest-800 text-sm hover:text-blue-600 transition-colors"
            >
              {contactPhone}
            </a>
          </div>
        </div>

        {/* Email */}
        <div className="flex items-center gap-3.5">
          <div className="w-9 h-9 rounded-xl bg-blue-500/10 flex items-center justify-center flex-shrink-0">
            <Mail className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="font-body text-xs font-semibold text-forest-600 uppercase tracking-wider mb-0.5">
              Email
            </p>
            <a
              href={`mailto:${contactEmail}`}
              className="font-body text-forest-800 text-sm hover:text-blue-600 transition-colors"
            >
              {contactEmail}
            </a>
          </div>
        </div>
      </div>

      <Link
        href={`/${locale}/booking`}
        className="inline-flex items-center gap-2 bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-body font-semibold text-sm tracking-wide px-7 py-3 rounded-full transition-all duration-300 hover:shadow-lg hover:shadow-blue-600/30 hover:-translate-y-0.5"
      >
        {t('booking.confirm_booking')}
        <ArrowRight className="w-4 h-4" />
      </Link>
    </div>
  );
}
