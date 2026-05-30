'use client';

import { Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { usePricingStore } from '@/lib/pricing-store';

function daysAgo(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function Inner() {
  const { lastUpdated, activeSeasonalMultiplier, seasonalLabel } = usePricingStore();
  const searchParams = useSearchParams();
  const showAdmin    = searchParams.get('admin') === 'true';

  const days         = lastUpdated ? daysAgo(lastUpdated) : null;
  const isStale      = days !== null && days > 45;
  const isSeasonal   = activeSeasonalMultiplier !== 1.0;

  if (days === null && !showAdmin) return null;

  return (
    <div className="flex flex-col items-center gap-1 mt-2">
      {days !== null && (
        <p className={`font-body text-xs ${isStale ? 'text-amber-400' : 'text-white/25'}`}>
          Prices last updated{' '}
          {days === 0 ? 'today' : `${days} day${days === 1 ? '' : 's'} ago`}
          {isStale && ' — please review'}
        </p>
      )}

      {isSeasonal && (
        <p className="font-body text-xs text-amber-400/60">
          {seasonalLabel} pricing active
        </p>
      )}

      {showAdmin && (
        <Link
          href="/admin/pricing"
          className="font-body text-xs text-white/20 hover:text-white/60 transition-colors"
        >
          ⚙ Pricing Admin
        </Link>
      )}
    </div>
  );
}

export default function FooterPricingInfo() {
  return (
    <Suspense fallback={null}>
      <Inner />
    </Suspense>
  );
}
