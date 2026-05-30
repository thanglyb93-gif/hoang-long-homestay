import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const VALID_ROOM_IDS = new Set([
  'green-mountain', 'ban-flower', 'family-room', 'deluxe',
  'epsilon', 'zeta', 'eta', 'theta', 'iota', 'kappa',
  'lambda', 'omicron', 'sigma', 'omega',
]);
const VALID_QR_TYPES  = new Set(['bank', 'momo']);
const ALLOWED_TYPES   = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']);
const MAX_BYTES       = 15 * 1024 * 1024;

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file     = formData.get('file')      as File   | null;
    const roomId   = (formData.get('roomId')   as string | null)?.trim();
    const type     = (formData.get('type')     as string | null)?.trim();
    const qrTarget = (formData.get('qrTarget') as string | null)?.trim();

    if (!file) return NextResponse.json({ error: 'Missing file' }, { status: 400 });
    if (!ALLOWED_TYPES.has(file.type))
      return NextResponse.json({ error: 'Invalid file type' }, { status: 415 });
    if (file.size > MAX_BYTES)
      return NextResponse.json({ error: 'File too large — 15 MB max' }, { status: 413 });

    const bytes  = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const folder = type === 'qr'
      ? `hoang-long-homestay/qr`
      : `hoang-long-homestay/rooms/${roomId}`;

    if (type === 'qr') {
      if (!qrTarget || !VALID_QR_TYPES.has(qrTarget))
        return NextResponse.json({ error: 'Invalid qrTarget' }, { status: 400 });
    } else {
      if (!roomId || !VALID_ROOM_IDS.has(roomId))
        return NextResponse.json({ error: 'Invalid roomId' }, { status: 400 });
    }

    const result = await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        { folder, resource_type: 'image' },
        (error, result) => {
          if (error || !result) reject(error);
          else resolve(result as { secure_url: string });
        }
      ).end(buffer);
    });

    return NextResponse.json({ url: result.secure_url });

  } catch (err) {
    console.error('[upload] error:', err);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}