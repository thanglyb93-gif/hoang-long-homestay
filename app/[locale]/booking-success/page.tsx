'use client';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { CheckCircle2, Home, MessageCircle } from 'lucide-react';
import { useSettingsStore } from '@/lib/settings-store';
import { toWhatsAppNumber } from '@/components/ContactInfo';
import Navbar from '@/components/Navbar';
export default function BookingSuccessPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const ref = searchParams.get('ref') ?? '';
  const { contactPhone } = useSettingsStore();
  const waUrl = 'https://wa.me/' + toWhatsAppNumber(contactPhone) + '?text=' + encodeURIComponent('Hello! I just booked at Hoang Long Homestay. Reference: ' + ref);
  return (
    <>
      <Navbar />
      <main className="min-h-screen bg-white flex items-center justify-center px-4 pt-20">
        <div className="w-full max-w-md bg-white rounded-2xl border border-cream-200 shadow-lg overflow-hidden">
          <div className="h-1.5 bg-gradient-to-r from-green-500 via-green-400 to-green-500" />
          <div className="p-8 flex flex-col items-center text-center">
            <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-5">
              <CheckCircle2 className="w-11 h-11 text-green-500" />
            </div>
            <h1 className="font-heading text-2xl font-semibold text-forest-900 mb-3">
              You have successfully booked a room at Hoang Long Homestay!
            </h1>
            <p className="font-body text-forest-500 text-sm mb-6">
              Thank you for choosing us. We will contact you shortly to confirm.
            </p>
            {ref && (
              <div className="w-full bg-forest-900 rounded-xl p-4 mb-6">
                <p className="font-body text-xs text-white/50 uppercase tracking-wider mb-1">Your Booking Reference</p>
                <p className="font-heading text-3xl font-bold text-sky-300 tracking-widest">{ref}</p>
              </div>
            )}
            <p className="font-body text-xs text-forest-400 mb-6">
              We will contact you within 2 hours to confirm via phone or email.
            </p>
            <div className="flex flex-col gap-3 w-full">
              <a href={waUrl} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-2 w-full bg-[#25D366] hover:bg-[#1ebe5d] text-white font-body font-semibold text-sm py-3 rounded-xl transition-colors">
                <MessageCircle className="w-4 h-4" />
                Chat on WhatsApp
              </a>
              <Link href={'/' + locale} className="flex items-center justify-center gap-2 w-full border border-cream-300 hover:bg-cream-50 text-forest-700 font-body font-medium text-sm py-3 rounded-xl transition-colors">
                <Home className="w-4 h-4" />
                Back to Home
              </Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}