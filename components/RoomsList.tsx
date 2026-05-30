'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { SearchX } from 'lucide-react';
import RoomCard from '@/components/RoomCard';
import { usePublicRooms } from '@/lib/room-store';
import type { Room } from '@/lib/rooms';

interface Props {
  sort:        string;
  capacityMin: number;
  checkIn?:    string;
  checkOut?:   string;
}

function sortRooms(list: Room[], sort: string): Room[] {
  return [...list].sort((a, b) =>
    sort === 'price_desc'
      ? b.pricePerNight - a.pricePerNight
      : a.pricePerNight - b.pricePerNight
  );
}

export default function RoomsList({ sort, capacityMin, checkIn, checkOut }: Props) {
  const t      = useTranslations('rooms');
  const params = useParams();
  const locale = params.locale as string;

  // usePublicRooms: active rooms from rooms.ts + any admin-activated placeholder rooms,
  // with admin overrides (name, description, price, etc.) merged in.
  const publicRooms = usePublicRooms();

  const filtered = useMemo(() => {
    let list = publicRooms;

    // Guest capacity filter
    if (capacityMin > 0) {
      list = list.filter((r) => r.maxGuests >= capacityMin);
    }

    // Sort
    list = sortRooms(list, sort);

    return list;
  }, [publicRooms, capacityMin, sort]);

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-24 px-6">
        <div className="w-16 h-16 rounded-2xl bg-cream-300 flex items-center justify-center mb-5">
          <SearchX className="w-8 h-8 text-forest-300" />
        </div>
        <h2 className="font-heading text-3xl font-semibold text-forest-900 mb-3">
          {t('no_rooms_title')}
        </h2>
        <p className="font-body text-forest-500 text-base mb-8 max-w-sm">
          {t('no_rooms_desc')}
        </p>
        <Link
          href={`/${locale}/rooms`}
          className="font-body font-semibold text-sm bg-blue-600 hover:bg-blue-700 text-white px-7 py-3 rounded-full transition-all duration-200 hover:shadow-lg hover:shadow-blue-600/25"
        >
          {t('browse_all')}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-7">
      {filtered.map((room) => (
        <RoomCard
          key={room.id}
          room={room}
          checkIn={checkIn}
          checkOut={checkOut}
        />
      ))}
    </div>
  );
}
