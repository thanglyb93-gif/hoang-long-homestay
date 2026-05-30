'use client';

import { useState, useRef, useEffect, ChangeEvent, DragEvent } from 'react';
import Image from 'next/image';
import { Upload, Trash2, Star, CheckCircle2, AlertCircle, X, Loader2, ImageIcon } from 'lucide-react';
import { useImageStore, ROOM_CONFIG_IMAGES } from '@/lib/image-store';
import type { RoomId } from '@/lib/image-store';

const ACCEPT   = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
const MAX_MB   = 15;

function uid() { return Math.random().toString(36).slice(2, 10); }
function fileSizeFmt(b: number) {
  if (b < 1024)         return `${b} B`;
  if (b < 1024 * 1024) return `${(b / 1024).toFixed(0)} KB`;
  return `${(b / (1024 * 1024)).toFixed(1)} MB`;
}
function validateFile(f: File): string | null {
  if (!f.type.startsWith('image/')) return 'Not an image file';
  if (f.size > MAX_MB * 1024 * 1024) return `Too large — max ${MAX_MB} MB`;
  return null;
}

const ROOM_GRADIENTS: Record<string, string> = {
  'green-mountain': 'from-blue-900 to-slate-900',
  'ban-flower':     'from-sky-200 to-indigo-100',
  'family-room':    'from-blue-600 to-blue-900',
  'deluxe':         'from-blue-400 to-indigo-700',
};

interface PendingFile {
  id: string; file: File; preview: string;
  status: 'pending' | 'uploading' | 'done' | 'error';
  error?: string;
}

// ── ImageGrid ─────────────────────────────────────────────────────────────────

function ImageGrid({ roomId, images, onDelete, onSetHero }: {
  roomId: string; images: string[];
  onDelete: (url: string) => void;
  onSetHero: (url: string) => void;
}) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(url: string) {
    setDeleting(url);
    try {
      const res = await fetch('/api/images/delete', {
        method: 'DELETE', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Delete failed');
      onDelete(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally { setDeleting(null); }
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-28 bg-[#0b1120] rounded-2xl border-2 border-dashed border-slate-700 text-center">
        <ImageIcon className="w-6 h-6 text-slate-700 mb-1.5" />
        <p className="font-body text-slate-600 text-sm">No images yet</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
      {images.map((url, i) => {
        const isHero = i === 0;
        return (
          <div key={url} className={`group relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-800 ${isHero ? 'ring-2 ring-amber-400' : ''}`}>
            <Image src={url} alt={`Photo ${i + 1}`} fill className="object-cover transition-opacity group-hover:opacity-70" sizes="150px" />
            {isHero && (
              <div className="absolute top-1 left-1 flex items-center gap-0.5 bg-amber-400 text-amber-950 text-[9px] font-bold px-1.5 py-0.5 rounded-full">
                <Star className="w-2 h-2" /> Hero
              </div>
            )}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
              {!isHero && (
                <button onClick={() => onSetHero(url)} className="flex items-center gap-1 bg-amber-500 hover:bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-1 rounded-lg transition-colors">
                  <Star className="w-2.5 h-2.5" /> Hero
                </button>
              )}
              <button
                onClick={() => handleDelete(url)} disabled={deleting === url}
                className="flex items-center gap-1 bg-red-600/90 hover:bg-red-500 disabled:bg-red-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg transition-colors"
              >
                {deleting === url ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Trash2 className="w-2.5 h-2.5" />}
                Del
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── UploadZone ────────────────────────────────────────────────────────────────

function UploadZone({ roomId, onUploaded }: { roomId: RoomId; onUploaded: (url: string) => void }) {
  const [pending,  setPending]  = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    setPending((p) => [
      ...p,
      ...arr.map((f) => {
        const err = validateFile(f);
        return { id: uid(), file: f, preview: URL.createObjectURL(f), status: err ? 'error' as const : 'pending' as const, error: err ?? undefined };
      }),
    ]);
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault(); setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  async function uploadOne(pf: PendingFile) {
    setPending((p) => p.map((x) => x.id === pf.id ? { ...x, status: 'uploading' as const } : x));
    try {
      const fd = new FormData();
      fd.append('file', pf.file); fd.append('roomId', roomId);
      const res  = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');
      setPending((p) => p.map((x) => x.id === pf.id ? { ...x, status: 'done' as const, url: data.url } : x));
      onUploaded(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setPending((p) => p.map((x) => x.id === pf.id ? { ...x, status: 'error' as const, error: msg } : x));
    }
  }

  const hasPending   = pending.some((p) => p.status === 'pending');
  const hasUploading = pending.some((p) => p.status === 'uploading');

  useEffect(() => { return () => pending.forEach((p) => URL.revokeObjectURL(p.preview)); }, []); // eslint-disable-line

  return (
    <div className="space-y-3">
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center h-24 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
          dragging ? 'border-blue-400 bg-blue-900/20' : 'border-slate-600 bg-[#0b1120] hover:border-slate-400'
        }`}
      >
        <Upload className={`w-5 h-5 mb-1.5 ${dragging ? 'text-blue-400' : 'text-slate-500'}`} />
        <p className={`font-body text-sm ${dragging ? 'text-blue-300' : 'text-slate-400'}`}>
          {dragging ? 'Drop here' : 'Drag & drop or click to browse'}
        </p>
        <p className="font-body text-xs text-slate-600 mt-0.5">JPG · PNG · WebP · AVIF · Max {MAX_MB}MB</p>
        <input ref={inputRef} type="file" accept={ACCEPT} multiple className="hidden"
          onChange={(e: ChangeEvent<HTMLInputElement>) => { if (e.target.files?.length) { addFiles(e.target.files); e.target.value = ''; } }} />
      </div>

      {pending.length > 0 && (
        <div className="space-y-1.5">
          {pending.map((pf) => (
            <div key={pf.id} className={`flex items-center gap-2.5 rounded-xl px-3 py-2 border ${
              pf.status === 'error' ? 'bg-red-900/20 border-red-700/50' :
              pf.status === 'done'  ? 'bg-green-900/20 border-green-700/50' : 'bg-[#0b1120] border-slate-700'
            }`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pf.preview} alt="" className="w-8 h-8 object-cover rounded-lg flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="font-body text-xs text-slate-200 truncate">{pf.file.name}</p>
                {pf.status === 'error' && <p className="font-body text-[10px] text-red-400">{pf.error}</p>}
              </div>
              {pf.status === 'pending'   && <Upload       className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />}
              {pf.status === 'uploading' && <Loader2      className="w-3.5 h-3.5 text-blue-400 animate-spin flex-shrink-0" />}
              {pf.status === 'done'      && <CheckCircle2 className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />}
              {pf.status === 'error'     && <AlertCircle  className="w-3.5 h-3.5 text-red-400 flex-shrink-0" />}
              {(pf.status === 'pending' || pf.status === 'error') && (
                <button onClick={() => setPending((p) => p.filter((x) => x.id !== pf.id))} className="text-slate-600 hover:text-slate-300">
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ))}
          {hasPending && (
            <button onClick={() => Promise.all(pending.filter((p) => p.status === 'pending').map(uploadOne))}
              disabled={hasUploading}
              className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 text-white font-body font-semibold text-sm rounded-xl transition-colors">
              {hasUploading ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</> : <><Upload className="w-4 h-4" /> Upload {pending.filter((p) => p.status === 'pending').length} image{pending.filter((p) => p.status === 'pending').length !== 1 ? 's' : ''}</>}
            </button>
          )}
          {!hasPending && !hasUploading && (
            <button onClick={() => setPending([])} className="w-full font-body text-xs text-slate-500 hover:text-slate-300 py-1">Clear completed</button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────

export default function PhotosPanel() {
  const { images, addImage, removeImage, setHero } = useImageStore();
  const [activeRoom, setActiveRoom] = useState<RoomId>('green-mountain');

  const roomImages   = images[activeRoom] ?? [];
  const activeConfig = ROOM_CONFIG_IMAGES.find((r) => r.id === activeRoom)!;
  const gradient     = ROOM_GRADIENTS[activeRoom];

  return (
    <div className="space-y-6">
      {/* Room tabs */}
      <div className="flex gap-2 flex-wrap">
        {ROOM_CONFIG_IMAGES.map((room) => {
          const count    = (images[room.id] ?? []).length;
          const isActive = activeRoom === room.id;
          return (
            <button
              key={room.id}
              onClick={() => setActiveRoom(room.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all ${
                isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40' : 'bg-[#111827] text-slate-400 hover:text-white border border-slate-700'
              }`}
            >
              <span className="price-mono">{room.name}</span>
              <span className={`text-xs ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>{room.number}</span>
              {count > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${isActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'}`}>
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Room panel */}
      <div className="bg-[#111827] rounded-2xl border border-slate-700 overflow-hidden">
        <div className={`bg-gradient-to-r ${gradient} px-5 py-4 flex items-center justify-between`}>
          <div>
            <p className="price-mono text-white/50 text-xs font-semibold tracking-widest uppercase">Room {activeConfig.number}</p>
            <h2 className="price-mono text-white text-xl font-bold">{activeConfig.name}</h2>
          </div>
          <p className={`font-body text-sm ${activeConfig.id === 'ban-flower' ? 'text-blue-600' : 'text-white/60'}`}>
            {roomImages.length} photo{roomImages.length !== 1 ? 's' : ''}
          </p>
        </div>

        <div className="p-5 space-y-5">
          <div>
            <div className="flex items-center justify-between mb-2.5">
              <h3 className="price-mono text-white font-semibold text-sm">Current Photos</h3>
              {roomImages.length > 0 && (
                <div className="flex items-center gap-1 font-body text-xs text-amber-400">
                  <Star className="w-3 h-3" /> First = hero
                </div>
              )}
            </div>
            <ImageGrid
              roomId={activeRoom}
              images={roomImages}
              onDelete={(url) => removeImage(activeRoom, url)}
              onSetHero={(url) => setHero(activeRoom, url)}
            />
          </div>

          <div className="border-t border-slate-800" />

          <div>
            <h3 className="price-mono text-white font-semibold text-sm mb-2.5">Upload New</h3>
            <UploadZone roomId={activeRoom} onUploaded={(url) => addImage(activeRoom, url)} />
          </div>
        </div>
      </div>
    </div>
  );
}
