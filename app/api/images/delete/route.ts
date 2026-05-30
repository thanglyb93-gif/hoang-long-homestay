import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const url  = (body?.url as string | undefined)?.trim();

    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    // Handle Cloudinary URLs
    if (url.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      // e.g. https://res.cloudinary.com/dtfh9rdce/image/upload/v1234/hoang-long-homestay/rooms/green-mountain/filename.jpg
      const match = url.match(/\/upload\/(?:v\d+\/)?(.+)\.[a-z]+$/i);
      if (!match) return NextResponse.json({ error: 'Invalid Cloudinary url' }, { status: 400 });

      const publicId = match[1];
      await cloudinary.uploader.destroy(publicId);
      return NextResponse.json({ ok: true });
    }

    // Handle old local URLs — just return ok since files don't exist on Vercel
    return NextResponse.json({ ok: true });

  } catch (err) {
    console.error('[images/delete] error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}