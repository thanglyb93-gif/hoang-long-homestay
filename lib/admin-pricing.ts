import { rooms } from './rooms';
import type { RoomOverride, SeasonalRule } from './admin-store';

/**
 * Returns the effective price per night for a room, factoring in:
 * 1. Admin price override (if set)
 * 2. Best matching seasonal rule for the stay window
 */
export function getEffectivePricePerNight(
  roomId: string,
  checkIn: Date,
  checkOut: Date,
  overrides: RoomOverride[],
  seasonalRules: SeasonalRule[]
): number {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return 0;

  // Admin override wins over the default price
  const override = overrides.find((o) => o.roomId === roomId);
  const basePrice = override?.pricePerNight ?? room.pricePerNight;

  // Find seasonal rules that apply to this room and overlap with the stay
  const applicable = seasonalRules.filter((rule) => {
    if (rule.roomIds.length > 0 && !rule.roomIds.includes(roomId)) return false;
    const rs = new Date(rule.startDate);
    const re = new Date(rule.endDate);
    return checkIn < re && checkOut > rs;
  });

  if (applicable.length === 0) return basePrice;

  // Apply the rule with the highest absolute adjustment
  const best = applicable.reduce((prev, cur) =>
    Math.abs(cur.adjustmentPct) > Math.abs(prev.adjustmentPct) ? cur : prev
  );

  return Math.round(basePrice * (1 + best.adjustmentPct / 100));
}

/**
 * Returns effective amenities for a room (admin override or default).
 */
export function getEffectiveAmenities(
  roomId: string,
  overrides: RoomOverride[]
): string[] {
  const room = rooms.find((r) => r.id === roomId);
  if (!room) return [];
  const override = overrides.find((o) => o.roomId === roomId);
  return override?.amenities ?? room.amenities;
}

/**
 * Returns all manually blocked date ranges for a room from admin store.
 */
export function getAdminBlocks(
  roomId: string,
  overrides: RoomOverride[]
): Array<{ start: Date; end: Date }> {
  const override = overrides.find((o) => o.roomId === roomId);
  if (!override) return [];
  return override.manualBlocks.map((b) => ({
    start: new Date(b.start),
    end: new Date(b.end),
  }));
}
