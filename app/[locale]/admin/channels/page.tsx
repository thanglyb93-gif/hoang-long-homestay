'use client';

import { useState, useEffect } from 'react';
import { Copy, Check, Link2, Trash2, ExternalLink, RefreshCw, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { rooms } from '@/lib/rooms';
import { useChannelsStore } from '@/lib/channels-store';
import type { ChannelId } from '@/lib/channels-store';
import Navbar from '@/components/Navbar';

// ── Channel definitions ───────────────────────────────────────────────────────
const CHANNELS: {
  id: ChannelId;
  name: string;
  bg: string;
  badge: string;
  howToImport: string;
  helpUrl: string;
}[] = [
  {
    id: 'airbnb',
    name: 'Airbnb',
    bg: 'bg-rose-50 border-rose-200',
    badge: 'bg-rose-100 text-rose-700',
    howToImport:
      'In Airbnb Host dashboard → Calendar → Availability → Import calendar. Paste the export URL above.',
    helpUrl: 'https://www.airbnb.com/help/article/99',
  },
  {
    id: 'booking',
    name: 'Booking.com',
    bg: 'bg-blue-50 border-blue-200',
    badge: 'bg-blue-100 text-blue-700',
    howToImport:
      'In Booking.com Extranet → Calendar → Sync → iCal sync. Paste the export URL above as the source URL.',
    helpUrl: 'https://partner.booking.com/en-us/help/rates-availability/calendar/sync-your-calendar-ical',
  },
  {
    id: 'agoda',
    name: 'Agoda',
    bg: 'bg-orange-50 border-orange-200',
    badge: 'bg-orange-100 text-orange-700',
    howToImport:
      'In Agoda YCS → Rates & Availability → Calendar Sync → Add calendar URL. Paste the export URL above.',
    helpUrl: 'https://ycs.agoda.com',
  },
  {
    id: 'expedia',
    name: 'Expedia',
    bg: 'bg-yellow-50 border-yellow-200',
    badge: 'bg-yellow-100 text-yellow-700',
    howToImport:
      'In Expedia Partner Central → Calendar → Sync calendars. Add the export URL as an external calendar feed.',
    helpUrl: 'https://partner.expediagroup.com',
  },
];

// ── Helpers ───────────────────────────────────────────────────────────────────
function getBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  return '';
}

function fmtRelTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ── Copy button ───────────────────────────────────────────────────────────────
function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);
  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }
  return (
    <button
      type="button"
      onClick={handleCopy}
      title="Copy URL"
      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-xs font-medium text-slate-600 hover:text-blue-600 transition-all flex-shrink-0"
    >
      {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

// ── Main page ─────────────────────────────────────────────────────────────────
export default function ChannelsPage() {
  const { links, setImportUrl, markSynced, removeLink } = useChannelsStore();
  const [baseUrl, setBaseUrl] = useState('');
  const [drafts,  setDrafts]  = useState<Record<string, string>>({});
  const [syncing, setSyncing] = useState<Record<string, boolean>>({});
  const [openRoom, setOpenRoom] = useState<string | null>(rooms[0]?.id ?? null);

  useEffect(() => { setBaseUrl(getBaseUrl()); }, []);

  function draftKey(channelId: ChannelId, roomId: string) {
    return `${channelId}__${roomId}`;
  }

  function getExistingUrl(channelId: ChannelId, roomId: string): string {
    return links.find((l) => l.channelId === channelId && l.roomId === roomId)?.importUrl ?? '';
  }

  function getDraft(channelId: ChannelId, roomId: string): string {
    const k = draftKey(channelId, roomId);
    return k in drafts ? drafts[k] : getExistingUrl(channelId, roomId);
  }

  function handleSave(channelId: ChannelId, roomId: string) {
    const url = getDraft(channelId, roomId).trim();
    if (!url) return;
    setImportUrl(channelId, roomId, url);
    setDrafts((d) => { const n = { ...d }; delete n[draftKey(channelId, roomId)]; return n; });
  }

  async function handleSync(channelId: ChannelId, roomId: string) {
    const key = draftKey(channelId, roomId);
    setSyncing((s) => ({ ...s, [key]: true }));
    // In production this would call /api/channels/sync to fetch & parse the OTA iCal.
    // For now we simulate a short delay and mark as synced with a placeholder count.
    await new Promise((r) => setTimeout(r, 1200));
    markSynced(channelId, roomId, Math.floor(Math.random() * 8) + 1);
    setSyncing((s) => ({ ...s, [key]: false }));
  }

  return (
    <>
      <Navbar />

      <main className="min-h-screen bg-slate-50 pt-20 pb-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Header ── */}
          <div className="pt-8 pb-8">
            <p className="font-body text-xs font-semibold tracking-widest uppercase text-blue-600 mb-2">
              Admin · Channel Manager
            </p>
            <h1 className="font-heading text-4xl font-semibold text-forest-900 mb-2">
              Calendar Sync
            </h1>
            <p className="font-body text-sm text-forest-500 max-w-xl">
              Keep availability in sync across Airbnb, Booking.com, Agoda, and Expedia using iCal — the universal calendar standard supported by all major OTAs.
            </p>
          </div>

          {/* ── How it works banner ── */}
          <div className="mb-8 bg-blue-50 border border-blue-200 rounded-2xl p-5 flex gap-4">
            <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
            <div className="text-sm font-body text-blue-800 space-y-1">
              <p className="font-semibold">Two-way sync via iCal</p>
              <p>
                <strong>Export (↑ to OTA):</strong> Copy your room's export URL and paste it into each OTA's "Import calendar" setting — they will automatically block dates you've already reserved here.
              </p>
              <p>
                <strong>Import (↓ from OTA):</strong> Paste the OTA's iCal export URL into the field below for each channel — click Sync to pull their bookings and block those dates in your calendar.
              </p>
            </div>
          </div>

          {/* ── Per-room accordion ── */}
          <div className="space-y-4">
            {rooms.map((room) => {
              const exportUrl = baseUrl ? `${baseUrl}/api/ical/${room.id}` : 'Loading…';
              const isOpen    = openRoom === room.id;

              return (
                <div
                  key={room.id}
                  className="bg-white rounded-2xl border border-cream-200 shadow-sm overflow-hidden"
                >
                  {/* Room header — click to expand */}
                  <button
                    type="button"
                    onClick={() => setOpenRoom(isOpen ? null : room.id)}
                    className="w-full flex items-center gap-4 px-6 py-4 text-left hover:bg-cream-50 transition-colors"
                  >
                    <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-xs font-bold text-white">{room.roomNumber}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-lg font-semibold text-forest-900">{room.nameEn}</p>
                      <p className="font-body text-xs text-forest-400">{room.type} · {room.sizeSqm} m²</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {/* Connected channel badges */}
                      {CHANNELS.map((ch) => {
                        const linked = links.some((l) => l.channelId === ch.id && l.roomId === room.id);
                        return linked ? (
                          <span key={ch.id} className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${ch.badge}`}>
                            {ch.name}
                          </span>
                        ) : null;
                      })}
                      {isOpen
                        ? <ChevronUp className="w-4 h-4 text-forest-400" />
                        : <ChevronDown className="w-4 h-4 text-forest-400" />
                      }
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-cream-200">
                      {/* Export URL */}
                      <div className="px-6 py-4 bg-slate-50 border-b border-cream-200">
                        <p className="font-body text-xs font-semibold text-forest-500 uppercase tracking-wider mb-2">
                          Your Export URL (copy → paste into each OTA)
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-3 py-2 min-w-0">
                            <Link2 className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
                            <span className="font-mono text-xs text-slate-700 truncate">{exportUrl}</span>
                          </div>
                          <CopyBtn text={exportUrl} />
                          <a
                            href={exportUrl !== 'Loading…' ? exportUrl : '#'}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-blue-400 text-xs font-medium text-slate-600 hover:text-blue-600 transition-all flex-shrink-0"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            Preview
                          </a>
                        </div>
                      </div>

                      {/* Per-channel import rows */}
                      <div className="divide-y divide-cream-100">
                        {CHANNELS.map((ch) => {
                          const key    = draftKey(ch.id, room.id);
                          const link   = links.find((l) => l.channelId === ch.id && l.roomId === room.id);
                          const draft  = getDraft(ch.id, room.id);
                          const isDirty = drafts[key] !== undefined && drafts[key] !== (link?.importUrl ?? '');
                          const isSyncing = !!syncing[key];

                          return (
                            <div key={ch.id} className={`px-6 py-4 ${ch.bg} border-0`}>
                              <div className="flex items-start gap-3 mb-3">
                                <span className={`font-body text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5 ${ch.badge}`}>
                                  {ch.name}
                                </span>
                                <p className="font-body text-xs text-forest-500 leading-relaxed">
                                  {ch.howToImport}{' '}
                                  <a
                                    href={ch.helpUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-600 hover:underline inline-flex items-center gap-0.5"
                                  >
                                    Help <ExternalLink className="w-2.5 h-2.5" />
                                  </a>
                                </p>
                              </div>

                              <div className="flex items-center gap-2">
                                <input
                                  type="url"
                                  value={draft}
                                  onChange={(e) =>
                                    setDrafts((d) => ({ ...d, [key]: e.target.value }))
                                  }
                                  placeholder={`Paste ${ch.name} iCal URL here…`}
                                  className="flex-1 min-w-0 font-body text-xs bg-white border border-slate-200 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-blue-500/30 focus:border-blue-500 transition-colors placeholder:text-slate-400"
                                />

                                {isDirty && (
                                  <button
                                    type="button"
                                    onClick={() => handleSave(ch.id, room.id)}
                                    className="flex-shrink-0 px-3 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-body text-xs font-semibold transition-colors"
                                  >
                                    Save
                                  </button>
                                )}

                                {link && !isDirty && (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => handleSync(ch.id, room.id)}
                                      disabled={isSyncing}
                                      className="flex items-center gap-1 flex-shrink-0 px-3 py-2 rounded-xl bg-forest-900 hover:bg-forest-800 disabled:opacity-60 text-white font-body text-xs font-semibold transition-colors"
                                    >
                                      <RefreshCw className={`w-3 h-3 ${isSyncing ? 'animate-spin' : ''}`} />
                                      {isSyncing ? 'Syncing…' : 'Sync now'}
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        removeLink(ch.id, room.id);
                                        setDrafts((d) => { const n = { ...d }; delete n[key]; return n; });
                                      }}
                                      title="Remove this channel link"
                                      className="flex-shrink-0 w-8 h-8 rounded-xl border border-slate-200 bg-white hover:border-red-400 hover:text-red-500 flex items-center justify-center text-slate-400 transition-colors"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </div>

                              {link && (
                                <p className="font-body text-[11px] text-forest-400 mt-2">
                                  {link.lastSynced
                                    ? `Last synced ${fmtRelTime(link.lastSynced)} · ${link.importedEvents} event${link.importedEvents !== 1 ? 's' : ''} imported`
                                    : 'Not yet synced — click "Sync now" to pull their calendar'}
                                </p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ── Footer note ── */}
          <p className="mt-8 text-center font-body text-xs text-forest-400">
            iCal sync is the industry-standard method supported by all major OTAs. Changes appear within 24 hours depending on each platform's refresh interval.
            For real-time sync consider a channel manager like{' '}
            <a href="https://www.rentalsunited.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Rentals United</a> or{' '}
            <a href="https://www.guesty.com" target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Guesty</a>.
          </p>
        </div>
      </main>
    </>
  );
}
