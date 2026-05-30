import { NextRequest, NextResponse } from 'next/server';
import { unlink } from 'fs/promises';
import { join, normalize } from 'path';
import { existsSync } from 'fs';

export async function DELETE(req: NextRequest) {
  try {
    const body = await req.json();
    const url  = (body?.url as string | undefined)?.trim();

    if (!url) return NextResponse.json({ error: 'Missing url' }, { status: 400 });

    // Safety: url must look like /images/rooms/<roomId>/<filename>
    const match = url.match(/^\/images\/rooms\/([a-z-]+)\/([^/]+\.(jpg|jpeg|png|webp|gif|avif))$/i);
    if (!match) return NextResponse.json({ error: 'Invalid url path' }, { status: 400 });

    const relativePath = url.replace(/^\//, '');
    const fullPath     = normalize(join(process.cwd(), 'public', relativePath));

    // Guard against path traversal
    const publicRoot = normalize(join(process.cwd(), 'public', 'images', 'rooms'));
    if (!fullPath.startsWith(publicRoot)) {
      return NextResponse.json({ error: 'Forbidden path' }, { status: 403 });
    }

    if (!existsSync(fullPath)) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    await unlink(fullPath);
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[images/delete] error:', err);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
