import { NextRequest, NextResponse } from 'next/server';
import { getBlockedRanges } from '@/lib/availability';
import { rooms } from '@/lib/rooms';

/** Format a Date as YYYYMMDD for iCal DATE values */
function dateOnly(d: Date): string {
  return d.toISOString().slice(0, 10).replace(/-/g, '');
}

/** Format a Date as YYYYMMDDTHHmmssZ for iCal DATETIME values */
function dateTime(d: Date): string {
  return d.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
}

export async function GET(
  _req: NextRequest,
  { params }: { params: { roomId: string } }
) {
  const { roomId } = params;
  const room = rooms.find((r) => r.id === roomId);

  if (!room) {
    return new NextResponse('Room not found', { status: 404 });
  }

  const ranges = getBlockedRanges(roomId);
  const now    = dateTime(new Date());

  const events = ranges.map((range, i) => {
    const uid = `hl-${roomId}-${dateOnly(range.start)}-${dateOnly(range.end)}-${i}@hoanglonghomestay.vn`;
    return [
      'BEGIN:VEVENT',
      `UID:${uid}`,
      `DTSTART;VALUE=DATE:${dateOnly(range.start)}`,
      `DTEND;VALUE=DATE:${dateOnly(range.end)}`,
      `SUMMARY:Blocked – ${room.nameEn} #${room.roomNumber}`,
      'STATUS:CONFIRMED',
      `DTSTAMP:${now}`,
      `CREATED:${now}`,
      'END:VEVENT',
    ].join('\r\n');
  });

  const ical = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Hoang Long Homestay//Room Availability//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:Hoang Long – ${room.nameEn} (${room.roomNumber})`,
    'X-WR-CALDESC:Blocked dates for Hoang Long Homestay room availability sync',
    'X-WR-TIMEZONE:Asia/Ho_Chi_Minh',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return new NextResponse(ical, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="hoang-long-${roomId}.ics"`,
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  });
}
