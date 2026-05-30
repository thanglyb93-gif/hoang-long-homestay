import { NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

const VALID_ROOM_IDS = new Set([
  'green-mountain', 'ban-flower', 'family-room', 'deluxe',
  'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa',
  'lambda', 'omicron', 'sigma', 'omega',
]);
const VALID_QR_TYPES = new Set(['bank', 'momo']);
const ALLOWED_TYPES  = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_BYTES      = 15 * 1024 * 1024; // 15 MB

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get('file')   as File   | null;
    const roomId   = (formData.get('roomId') as string | null)?.trim();
    const type     = (formData.get('type')   as string | null)?.trim(); // 'room' | 'qr'
    const qrTarget = (formData.get('qrTarget') as string | null)?.trim(); // 'bank' | 'momo'

    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type))
      return NextResponse.json({ error: 'Invalid file type — JPEG, PNG, WebP, AVIF or GIF only' }, { status: 415 });
    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: 'File too large — 15 MB max' }, { status: 413 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const ext    = file.name.split('.').pop()?.toLowerCase().replace(/[^a-z0-9]/g, '') ?? 'jpg';
    const safeName = file.name
      .replace(/\.[^.]+$/, '')
      .replace(/[^a-z0-9_\-]/gi, '-')
      .slice(0, 40)
      .toLowerCase();
    const filename = `${Date.now()}-${safeName}.${ext}`;

    // ── QR code upload ──────────────────────────────────────────────────────
    if (type === 'qr') {
      if (!qrTarget || !VALID_QR_TYPES.has(qrTarget))
        return NextResponse.json({ error: 'Invalid qrTarget — must be "bank" or "momo"' }, { status: 400 });

      const dir = join(process.cwd(), 'public', 'images', 'qr');
      if (!existsSync(dir)) await mkdir(dir, { recursive: true });

      await writeFile(join(dir, `${qrTarget}-${filename}`), buffer);
      return NextResponse.json({ url: `/images/qr/${qrTarget}-${filename}`, filename });
    }

    // ── Room photo upload (default) ─────────────────────────────────────────
    if (!roomId)              return NextResponse.json({ error: 'Missing roomId' }, { status: 400 });
    if (!VALID_ROOM_IDS.has(roomId))
      return NextResponse.json({ error: 'Invalid roomId' }, { status: 400 });

    const dir = join(process.cwd(), 'public', 'images', 'rooms', roomId);
    if (!existsSync(dir)) await mkdir(dir, { recursive: true });

    await writeFile(join(dir, filename), buffer);
    return NextResponse.json({ url: `/images/rooms/${roomId}/${filename}`, filename });

  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
