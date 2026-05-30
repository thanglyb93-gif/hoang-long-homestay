'use client';

import {
  useState, useEffect, useRef, useCallback, DragEvent, ChangeEvent,
} from 'react';
import Image from 'next/image';
import Link from 'next/link';
import {
  Lock, Eye, EyeOff, LogOut, ImageIcon, Upload, Trash2, Star,
  StarOff, CheckCircle2, AlertCircle, X, Loader2, Zap,
} from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { useImageStore, ROOM_CONFIG_IMAGES } from '@/lib/image-store';
import type { RoomId } from '@/lib/image-store';

// ── Types ─────────────────────────────────────────────────────────────────────

interface PendingFile {
  id:      string;
  file:    File;
  preview: string; // object URL
  status:  'pending' | 'uploading' | 'done' | 'error';
  error?:  string;
  url?:    string; // uploaded URL
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function uid() { return Math.random().toString(36).slice(2, 10); }

const ACCEPT = 'image/jpeg,image/png,image/webp,image/avif,image/gif';
const MAX_MB = 15;

function fileSizeFmt(bytes: number) {
  if (bytes < 1024)         return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function validateFile(file: File): string | null {
  if (!file.type.startsWith('image/')) return 'Not an image file';
  if (file.size > MAX_MB * 1024 * 1024) return `Too large — max ${MAX_MB} MB`;
  return null;
}

// ── Gradient fallback colours (matches RoomCard) ─────────────────────────────
const ROOM_GRADIENTS: Record<string, string> = {
  'green-mountain': 'from-blue-900 via-blue-800 to-slate-900',
  'ban-flower':     'from-sky-200 via-blue-100 to-indigo-100',
  'family-room':    'from-blue-600 via-blue-700 to-blue-900',
  'deluxe':         'from-blue-400 via-indigo-600 to-blue-900',
};

// ── ImageGrid ────────────────────────────────────────────────────────────────

interface ImageGridProps {
  roomId:    string;
  images:    string[];
  onDelete:  (url: string) => void;
  onSetHero: (url: string) => void;
}

function ImageGrid({ roomId, images, onDelete, onSetHero }: ImageGridProps) {
  const [deleting, setDeleting] = useState<string | null>(null);

  async function handleDelete(url: string) {
    setDeleting(url);
    try {
      const res = await fetch('/api/images/delete', {
        method:  'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ url }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? 'Delete failed');
      onDelete(url);
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Delete failed');
    } finally {
      setDeleting(null);
    }
  }

  if (images.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-36 bg-[#0b1120] rounded-2xl border-2 border-dashed border-slate-700 text-center">
        <ImageIcon className="w-8 h-8 text-slate-700 mb-2" />
        <p className="font-body text-slate-600 text-sm">No images yet</p>
        <p className="font-body text-slate-700 text-xs mt-0.5">Upload below to get started</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {images.map((url, i) => {
        const isHero    = i === 0;
        const isDeleting = deleting === url;
        return (
          <div
            key={url}
            className={`group relative rounded-xl overflow-hidden aspect-[4/3] bg-slate-800 ${
              isHero ? 'ring-2 ring-amber-400' : ''
            }`}
          >
            <Image
              src={url}
              alt={`Room image ${i + 1}`}
              fill
              className="object-cover transition-opacity duration-200 group-hover:opacity-80"
              sizes="(max-width:640px) 50vw, (max-width:1024px) 33vw, 25vw"
            />

            {/* Hero badge */}
            {isHero && (
              <div className="absolute top-1.5 left-1.5 flex items-center gap-1 bg-amber-400 text-amber-950 text-[10px] font-bold px-2 py-0.5 rounded-full">
                <Star className="w-2.5 h-2.5" /> Hero
              </div>
            )}

            {/* Image index */}
            {!isHero && (
              <div className="absolute top-1.5 left-1.5 bg-black/50 text-white text-[10px] font-mono px-1.5 py-0.5 rounded">
                #{i + 1}
              </div>
            )}

            {/* Action overlay */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity bg-black/50">
              {!isHero && (
                <button
                  onClick={() => onSetHero(url)}
                  className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-amber-950 text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
                >
                  <Star className="w-3 h-3" /> Set as Hero
                </button>
              )}
              {isHero && (
                <div className="flex items-center gap-1 text-amber-300 text-xs font-semibold">
                  <Star className="w-3 h-3" /> Hero Image
                </div>
              )}
              <button
                onClick={() => handleDelete(url)}
                disabled={isDeleting}
                className="flex items-center gap-1.5 bg-red-600/90 hover:bg-red-500 disabled:bg-red-900 text-white text-xs font-semibold px-3 py-1.5 rounded-lg transition-colors"
              >
                {isDeleting
                  ? <><Loader2 className="w-3 h-3 animate-spin" /> Deleting…</>
                  : <><Trash2 className="w-3 h-3" /> Delete</>
                }
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── UploadZone ────────────────────────────────────────────────────────────────

interface UploadZoneProps {
  roomId:   RoomId;
  onUploaded: (url: string) => void;
}

function UploadZone({ roomId, onUploaded }: UploadZoneProps) {
  const [pending,  setPending]  = useState<PendingFile[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInputRef            = useRef<HTMLInputElement>(null);

  function addFiles(files: FileList | File[]) {
    const arr = Array.from(files);
    const validated: PendingFile[] = arr.map((file) => {
      const err = validateFile(file);
      return {
        id:      uid(),
        file,
        preview: URL.createObjectURL(file),
        status:  err ? 'error' : 'pending',
        error:   err ?? undefined,
      };
    });
    setPending((p) => [...p, ...validated]);
  }

  function handleInputChange(e: ChangeEvent<HTMLInputElement>) {
    if (e.target.files?.length) {
      addFiles(e.target.files);
      e.target.value = '';
    }
  }

  function handleDrop(e: DragEvent) {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files?.length) addFiles(e.dataTransfer.files);
  }

  function removePending(id: string) {
    setPending((p) => {
      const item = p.find((x) => x.id === id);
      if (item) URL.revokeObjectURL(item.preview);
      return p.filter((x) => x.id !== id);
    });
  }

  async function uploadOne(pf: PendingFile): Promise<void> {
    setPending((p) => p.map((x) => x.id === pf.id ? { ...x, status: 'uploading' } : x));
    try {
      const fd = new FormData();
      fd.append('file',   pf.file);
      fd.append('roomId', roomId);

      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? 'Upload failed');

      setPending((p) => p.map((x) =>
        x.id === pf.id ? { ...x, status: 'done', url: data.url } : x
      ));
      onUploaded(data.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Upload failed';
      setPending((p) => p.map((x) =>
        x.id === pf.id ? { ...x, status: 'error', error: msg } : x
      ));
    }
  }

  async function uploadAll() {
    const toUpload = pending.filter((p) => p.status === 'pending');
    await Promise.all(toUpload.map(uploadOne));
  }

  const hasPending  = pending.some((p) => p.status === 'pending');
  const hasUploading = pending.some((p) => p.status === 'uploading');

  // Clean up object URLs on unmount
  useEffect(() => {
    return () => pending.forEach((p) => URL.revokeObjectURL(p.preview));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Drop zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative flex flex-col items-center justify-center h-36 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200 ${
          dragging
            ? 'border-blue-400 bg-blue-900/20 scale-[1.01]'
            : 'border-slate-600 bg-[#0b1120] hover:border-slate-400 hover:bg-slate-900/50'
        }`}
      >
        <Upload className={`w-7 h-7 mb-2 transition-colors ${dragging ? 'text-blue-400' : 'text-slate-500'}`} />
        <p className={`font-body text-sm font-semibold transition-colors ${dragging ? 'text-blue-300' : 'text-slate-400'}`}>
          {dragging ? 'Drop images here' : 'Drag & drop images, or click to browse'}
        </p>
        <p className="font-body text-xs text-slate-600 mt-1">
          JPG · PNG · WebP · AVIF · GIF &nbsp;·&nbsp; Max {MAX_MB} MB each
        </p>
        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPT}
          multiple
          className="hidden"
          onChange={handleInputChange}
        />
      </div>

      {/* Pending file list */}
      {pending.length > 0 && (
        <div className="space-y-2">
          {pending.map((pf) => (
            <div
              key={pf.id}
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 border ${
                pf.status === 'error'
                  ? 'bg-red-900/20 border-red-700/50'
                  : pf.status === 'done'
                  ? 'bg-green-900/20 border-green-700/50'
                  : 'bg-[#0b1120] border-slate-700'
              }`}
            >
              {/* Thumbnail */}
              <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800 relative">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={pf.preview} alt="" className="w-full h-full object-cover" />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p className="font-body text-sm text-slate-200 truncate">{pf.file.name}</p>
                <p className="font-body text-xs text-slate-500">{fileSizeFmt(pf.file.size)}</p>
                {pf.status === 'error' && (
                  <p className="font-body text-xs text-red-400 mt-0.5">{pf.error}</p>
                )}
              </div>

              {/* Status icon */}
              <div className="flex-shrink-0">
                {pf.status === 'pending'   && <Upload      className="w-4 h-4 text-slate-500" />}
                {pf.status === 'uploading' && <Loader2     className="w-4 h-4 text-blue-400 animate-spin" />}
                {pf.status === 'done'      && <CheckCircle2 className="w-4 h-4 text-green-400" />}
                {pf.status === 'error'     && <AlertCircle  className="w-4 h-4 text-red-400" />}
              </div>

              {/* Remove button */}
              {(pf.status === 'pending' || pf.status === 'error') && (
                <button
                  onClick={(e) => { e.stopPropagation(); removePending(pf.id); }}
                  className="flex-shrink-0 text-slate-600 hover:text-slate-300 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {/* Upload button */}
          {hasPending && (
            <button
              onClick={uploadAll}
              disabled={hasUploading}
              className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 disabled:bg-slate-700 disabled:cursor-not-allowed text-white font-body font-semibold text-sm rounded-xl transition-colors"
            >
              {hasUploading
                ? <><Loader2 className="w-4 h-4 animate-spin" /> Uploading…</>
                : <><Upload className="w-4 h-4" /> Upload {pending.filter((p) => p.status === 'pending').length} image{pending.filter((p) => p.status === 'pending').length !== 1 ? 's' : ''}</>
              }
            </button>
          )}

          {/* Clear done/errors */}
          {!hasPending && !hasUploading && (
            <button
              onClick={() => setPending([])}
              className="w-full font-body text-xs text-slate-500 hover:text-slate-300 transition-colors py-1"
            >
              Clear completed
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────

export default function ImagesAdminPage() {
  // ── Auth ────────────────────────────────────────────────────────────────────
  const { isAuthenticated, login, logout } = useAdminStore();
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState(false);
  const [showPin,  setShowPin]  = useState(false);

  // ── Image store ──────────────────────────────────────────────────────────────
  const { images, setImages, addImage, removeImage, setHero } = useImageStore();

  // ── Selected room tab ────────────────────────────────────────────────────────
  const [activeRoom, setActiveRoom] = useState<RoomId>('green-mountain');

  // ── Sync images from disk on tab change ──────────────────────────────────────
  const syncImages = useCallback(async (roomId: string) => {
    try {
      // Derive list from the store (which the admin page updates on upload/delete)
      // No separate API needed — store is source of truth after admin actions.
      // On first load, the store already contains persisted URLs from localStorage.
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    syncImages(activeRoom);
  }, [activeRoom, syncImages]);

  // ── Login ────────────────────────────────────────────────────────────────────
  function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    if (login(pinInput)) { setPinError(false); setPinInput(''); }
    else                 { setPinError(true);  setPinInput(''); }
  }

  // ── Login screen ─────────────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#0b1120] flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-[#111827] rounded-2xl border border-slate-700 shadow-2xl overflow-hidden">
          <div className="h-1 bg-gradient-to-r from-blue-600 via-violet-500 to-blue-800" />
          <div className="p-8">
            <div className="flex flex-col items-center mb-8">
              <div className="w-14 h-14 rounded-2xl bg-[#0b1120] border border-slate-700 flex items-center justify-center mb-4">
                <ImageIcon className="w-6 h-6 text-blue-400" />
              </div>
              <h1 className="price-mono text-white text-xl font-bold">Room Images</h1>
              <p className="font-body text-slate-500 text-xs mt-1">Hoang Long Homestay</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  value={pinInput}
                  onChange={(e) => { setPinInput(e.target.value); setPinError(false); }}
                  placeholder="Admin PIN"
                  autoFocus
                  className={`w-full price-mono text-sm bg-[#0b1120] border rounded-xl px-4 py-3 pr-10 text-white placeholder:text-slate-600 outline-none focus:border-blue-500 transition-colors ${
                    pinError ? 'border-red-500' : 'border-slate-600'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPin((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {pinError && <p className="font-body text-xs text-red-400">Incorrect PIN.</p>}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white price-mono font-bold text-sm py-3 rounded-xl transition-colors"
              >
                Login
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // ── Authenticated ─────────────────────────────────────────────────────────────
  const roomImages = images[activeRoom] ?? [];
  const activeConfig = ROOM_CONFIG_IMAGES.find((r) => r.id === activeRoom)!;
  const gradient = ROOM_GRADIENTS[activeRoom] ?? 'from-blue-800 to-blue-900';

  return (
    <div className="min-h-screen bg-[#0b1120] text-white">

      {/* ── Top nav ───────────────────────────────────────────────────────── */}
      <header className="bg-[#0d1526] border-b border-slate-800 px-4 sm:px-6 h-14 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center flex-shrink-0">
            <ImageIcon className="w-4 h-4 text-white" />
          </div>
          <span className="price-mono text-white font-bold text-sm">Room Images</span>
          <span className="text-slate-600 text-sm">·</span>
          <span className="font-body text-slate-400 text-xs hidden sm:inline">Hoang Long Homestay</span>
        </div>

        <div className="flex items-center gap-2">
          {/* Nav links */}
          <Link
            href="/admin/pricing"
            className="flex items-center gap-1.5 font-body text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <Zap className="w-3.5 h-3.5" /> Pricing
          </Link>
          <button
            onClick={logout}
            className="flex items-center gap-1.5 font-body text-xs text-slate-400 hover:text-white px-3 py-1.5 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </header>

      {/* ── Main ──────────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-8">

        {/* Page header */}
        <div>
          <h1 className="price-mono text-white text-2xl font-bold mb-1">Room Photo Manager</h1>
          <p className="font-body text-slate-400 text-sm">
            Upload photos for each room. The first image is shown as the hero on the website.
            Hover any image to set it as hero or delete it.
          </p>
        </div>

        {/* ── Room tabs ─────────────────────────────────────────────────── */}
        <div className="flex gap-2 flex-wrap">
          {ROOM_CONFIG_IMAGES.map((room) => {
            const count   = (images[room.id] ?? []).length;
            const isActive = activeRoom === room.id;
            return (
              <button
                key={room.id}
                onClick={() => setActiveRoom(room.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-900/40'
                    : 'bg-[#111827] text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700'
                }`}
              >
                <span className="price-mono">{room.name}</span>
                <span className={`font-body text-xs ${isActive ? 'text-blue-200' : 'text-slate-500'}`}>
                  {room.number}
                </span>
                {count > 0 && (
                  <span className={`ml-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive ? 'bg-blue-500 text-white' : 'bg-slate-700 text-slate-300'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* ── Room panel ────────────────────────────────────────────────── */}
        <div className="bg-[#111827] rounded-2xl border border-slate-700 overflow-hidden">

          {/* Room header with gradient preview */}
          <div className={`bg-gradient-to-r ${gradient} px-6 py-5 flex items-center justify-between`}>
            <div>
              <p className="price-mono text-white/50 text-xs font-semibold tracking-widest uppercase">
                Room {activeConfig.number}
              </p>
              <h2 className="price-mono text-white text-2xl font-bold leading-tight">
                {activeConfig.name}
              </h2>
            </div>
            <div className="text-right">
              <p className="font-body text-white/60 text-sm">
                {roomImages.length} image{roomImages.length !== 1 ? 's' : ''}
              </p>
              {roomImages.length > 0 && (
                <p className="font-body text-white/40 text-xs mt-0.5">
                  Hero: #{1}
                </p>
              )}
            </div>
          </div>

          <div className="p-6 space-y-6">

            {/* Current images */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="price-mono text-white font-semibold text-sm">
                  Current Photos
                </h3>
                {roomImages.length > 0 && (
                  <div className="flex items-center gap-1.5 font-body text-xs text-amber-400">
                    <Star className="w-3 h-3" />
                    First image is hero
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

            {/* Divider */}
            <div className="border-t border-slate-800" />

            {/* Upload zone */}
            <div>
              <h3 className="price-mono text-white font-semibold text-sm mb-3">
                Upload New Photos
              </h3>
              <UploadZone
                roomId={activeRoom}
                onUploaded={(url) => addImage(activeRoom, url)}
              />
            </div>

          </div>
        </div>

        {/* ── Tips ──────────────────────────────────────────────────────── */}
        <div className="bg-[#111827] rounded-2xl border border-slate-700 p-5">
          <h3 className="price-mono text-slate-300 font-semibold text-sm mb-3">📸 Photo Tips</h3>
          <ul className="space-y-1.5">
            {[
              'Landscape orientation (4:3 or 16:9) looks best on the website.',
              'At least 1200×900 px for sharp display on retina screens.',
              'The first (hero) image is shown on room cards and in search results.',
              'Upload 4+ photos to fill the detail modal gallery grid.',
              'Good natural light makes rooms look bigger and more inviting.',
            ].map((tip) => (
              <li key={tip} className="flex items-start gap-2 font-body text-xs text-slate-500">
                <span className="text-slate-600 mt-0.5">·</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>

        <div className="h-8" />
      </div>
    </div>
  );
}
