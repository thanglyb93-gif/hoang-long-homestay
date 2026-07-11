import { supabase } from './supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { AdminBooking, BookingStatus } from './admin-store';

// Row shape as stored in the Supabase "bookings" table (snake_case columns).
interface BookingRow {
  id: string;
  ref: string;
  guest_name: string;
  guest_phone: string;
  guest_email: string;
  nationality: string;
  room_id: string;
  room_name: string;
  room_number: string;
  check_in: string;
  check_out: string;
  nights: number;
  guests: number;
  total_price: number;
  status: BookingStatus;
  special_requests: string;
  payment_method: string;
  created_at: string;
}

function rowToBooking(row: BookingRow): AdminBooking {
  return {
    ref: row.ref,
    roomId: row.room_id,
    roomName: row.room_name,
    roomNumber: row.room_number,
    checkIn: row.check_in,
    checkOut: row.check_out,
    nights: row.nights,
    guests: row.guests,
    fullName: row.guest_name,
    phone: row.guest_phone,
    email: row.guest_email,
    nationality: row.nationality,
    requests: row.special_requests,
    paymentMethod: row.payment_method,
    total: row.total_price,
    submittedAt: row.created_at,
    status: row.status,
  };
}

function genRef(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export type NewBookingInput = Omit<AdminBooking, 'ref' | 'submittedAt' | 'status'>;

/** Inserts a new booking. Generates a 6-digit ref and retries on the rare collision. */
export async function createBooking(data: NewBookingInput): Promise<AdminBooking> {
  for (let attempt = 0; attempt < 5; attempt++) {
    const ref = genRef();
    const { data: row, error } = await supabase
      .from('bookings')
      .insert({
        ref,
        guest_name: data.fullName,
        guest_phone: data.phone,
        guest_email: data.email,
        nationality: data.nationality,
        room_id: data.roomId,
        room_name: data.roomName,
        room_number: data.roomNumber,
        check_in: data.checkIn,
        check_out: data.checkOut,
        nights: data.nights,
        guests: data.guests,
        total_price: data.total,
        special_requests: data.requests,
        payment_method: data.paymentMethod,
      })
      .select()
      .single();

    if (!error && row) return rowToBooking(row as BookingRow);
    if (error?.code !== '23505') throw error; // not a unique-ref collision — bail
  }
  throw new Error('Could not generate a unique booking reference');
}

/** Fetches all bookings, newest first. */
export async function getAllBookings(): Promise<AdminBooking[]> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data as BookingRow[]).map(rowToBooking);
}

/** Updates a booking's status by its reference number. */
export async function updateBookingStatus(ref: string, status: BookingStatus): Promise<AdminBooking> {
  const { data, error } = await supabase
    .from('bookings')
    .update({ status })
    .eq('ref', ref)
    .select()
    .single();
  if (error) throw error;
  return rowToBooking(data as BookingRow);
}

/** Fetches a single booking by its reference number. */
export async function getBookingByRef(ref: string): Promise<AdminBooking | null> {
  const { data, error } = await supabase
    .from('bookings')
    .select('*')
    .eq('ref', ref)
    .maybeSingle();
  if (error) throw error;
  return data ? rowToBooking(data as BookingRow) : null;
}

/**
 * Subscribes to realtime INSERT/UPDATE events on the bookings table.
 * Returns an unsubscribe function.
 */
export function subscribeToBookings(onChange: (booking: AdminBooking) => void): () => void {
  const channel: RealtimeChannel = supabase
    .channel('bookings')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'bookings' },
      (payload) => {
        if (payload.eventType === 'DELETE') return;
        onChange(rowToBooking(payload.new as BookingRow));
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}
