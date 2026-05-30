import { rooms, type Room } from './rooms';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface DateRange {
  start: Date; // inclusive (check-in day)
  end:   Date; // exclusive (check-out day — guest leaves, room is free)
}

// ── Core helpers ──────────────────────────────────────────────────────────────

/** Returns true if two half-open date ranges [aStart, aEnd) and [bStart, bEnd) overlap. */
export function rangesOverlap(
  aStart: Date, aEnd: Date,
  bStart: Date, bEnd: Date,
): boolean {
  return aStart < bEnd && aEnd > bStart;
}

/**
 * Returns true if [checkIn, checkOut) overlaps with any of the provided blocked ranges.
 */
export function isBlockedByRanges(
  checkIn: Date,
  checkOut: Date,
  blocked: DateRange[],
): boolean {
  return blocked.some((r) => rangesOverlap(checkIn, checkOut, r.start, r.end));
}

// ── Room-level availability ───────────────────────────────────────────────────

/**
 * Returns true when the room has no overlap with blocked dates for [checkIn, checkOut).
 */
export function isRoomAvailableForRange(
  checkIn:  Date,
  checkOut: Date,
  blocked:  DateRange[],
): boolean {
  if (checkIn >= checkOut) return false;
  return !isBlockedByRanges(checkIn, checkOut, blocked);
}

/**
 * Filter the room list to those that:
 * 1. Can accommodate `guests`
 * 2. Have no overlap with their blocked date ranges
 *
 * Pass `blockedByRoom` as a map built from admin store data:
 *   { [roomId]: DateRange[] }
 */
export function filterAvailableRooms(
  checkIn:      Date,
  checkOut:     Date,
  guests:       number,
  blockedByRoom: Record<string, DateRange[]>,
): Room[] {
  if (checkIn >= checkOut) return [];
  return rooms.filter((room) => {
    if (room.maxGuests < guests) return false;
    const blocked = blockedByRoom[room.id] ?? [];
    return !isBlockedByRanges(checkIn, checkOut, blocked);
  });
}

/**
 * Build blocked date ranges for one room by merging admin bookings + manual blocks.
 * Call this inside a client component that has access to useAdminStore().
 *
 * bookings:     Array<{ roomId, status, checkIn: string, checkOut: string }>
 * manualBlocks: Array<{ start: string, end: string }>
 */
export function buildBlockedRanges(
  roomId: string,
  bookings: Array<{ roomId: string; status: string; checkIn: string; checkOut: string }>,
  manualBlocks: Array<{ start: string; end: string }>,
): DateRange[] {
  const ranges: DateRange[] = [];

  // Confirmed guest bookings
  bookings
    .filter((b) => b.roomId === roomId && b.status === 'confirmed')
    .forEach((b) => {
      ranges.push({
        start: new Date(b.checkIn  + 'T00:00:00'),
        end:   new Date(b.checkOut + 'T00:00:00'),
      });
    });

  // Admin manual blocks
  manualBlocks.forEach((bl) => {
    ranges.push({
      start: new Date(bl.start + 'T00:00:00'),
      end:   new Date(bl.end   + 'T00:00:00'),
    });
  });

  return ranges;
}

// ── Legacy compatibility ───────────────────────────────────────────────────────

/**
 * Server-side availability shim.
 * Admin blocks are stored in Zustand (client-only), so server components
 * cannot access them. This always returns true — the real block enforcement
 * happens in the booking page (client-side, via buildBlockedRanges).
 */
export function isRoomAvailable(
  _roomId: string,
  checkIn: Date,
  checkOut: Date,
): boolean {
  return checkIn < checkOut;
}
