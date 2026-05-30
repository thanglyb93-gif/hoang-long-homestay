'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type ChannelId = 'airbnb' | 'booking' | 'agoda' | 'expedia';

export interface ChannelLink {
  channelId: ChannelId;
  roomId: string;
  /** iCal URL provided by the OTA — we import their calendar to block our dates */
  importUrl: string;
  lastSynced?: string; // ISO timestamp
  importedEvents: number;
}

interface ChannelsState {
  links: ChannelLink[];
  setImportUrl: (channelId: ChannelId, roomId: string, url: string) => void;
  markSynced: (channelId: ChannelId, roomId: string, eventCount: number) => void;
  removeLink: (channelId: ChannelId, roomId: string) => void;
  getLink: (channelId: ChannelId, roomId: string) => ChannelLink | undefined;
}

export const useChannelsStore = create<ChannelsState>()(
  persist(
    (set, get) => ({
      links: [],

      setImportUrl: (channelId, roomId, url) => {
        const filtered = get().links.filter(
          (l) => !(l.channelId === channelId && l.roomId === roomId)
        );
        set({
          links: [
            ...filtered,
            { channelId, roomId, importUrl: url, importedEvents: 0 },
          ],
        });
      },

      markSynced: (channelId, roomId, eventCount) => {
        set({
          links: get().links.map((l) =>
            l.channelId === channelId && l.roomId === roomId
              ? { ...l, lastSynced: new Date().toISOString(), importedEvents: eventCount }
              : l
          ),
        });
      },

      removeLink: (channelId, roomId) => {
        set({
          links: get().links.filter(
            (l) => !(l.channelId === channelId && l.roomId === roomId)
          ),
        });
      },

      getLink: (channelId, roomId) =>
        get().links.find((l) => l.channelId === channelId && l.roomId === roomId),
    }),
    { name: 'hoang-long-channels' }
  )
);
