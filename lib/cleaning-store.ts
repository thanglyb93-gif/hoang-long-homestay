'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

// ── Task definitions ──────────────────────────────────────────────────────────

export const CLEANING_TASKS: { id: string; label: string }[] = [
  { id: 'change_linens',       label: 'Change bed linens & pillowcases' },
  { id: 'make_bed',            label: 'Make bed neatly' },
  { id: 'clean_bathroom',      label: 'Clean & sanitize bathroom' },
  { id: 'replace_towels',      label: 'Replace towels & bath mat' },
  { id: 'restock_toiletries',  label: 'Restock toiletries (soap, shampoo, etc.)' },
  { id: 'vacuum',              label: 'Vacuum / mop floor' },
  { id: 'wipe_surfaces',       label: 'Wipe all surfaces, mirrors & TV' },
  { id: 'empty_trash',         label: 'Empty all trash bins' },
  { id: 'check_ac',            label: 'Check A/C & set to default temp' },
  { id: 'check_amenities',     label: 'Restock kettle, coffee, tea & cups' },
  { id: 'check_lights',        label: 'Check all lights, outlets & TV' },
  { id: 'final_inspect',       label: 'Final walkthrough & door check' },
];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface TaskStatus {
  taskId: string;
  done:   boolean;
}

export interface RoomCleaningRecord {
  taskStatuses:   TaskStatus[];
  lastCleanedAt:  string | null; // ISO timestamp
  note:           string;
}

// ── Store interface ───────────────────────────────────────────────────────────

interface CleaningState {
  rooms:      Record<string, RoomCleaningRecord>;
  toggleTask: (roomId: string, taskId: string) => void;
  markAllDone:(roomId: string) => void;
  markCleaned:(roomId: string) => void;   // records timestamp + resets tasks
  resetTasks: (roomId: string) => void;
  updateNote: (roomId: string, note: string) => void;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function defaultRecord(): RoomCleaningRecord {
  return {
    taskStatuses: CLEANING_TASKS.map((t) => ({ taskId: t.id, done: false })),
    lastCleanedAt: null,
    note: '',
  };
}

function getRecord(
  rooms: Record<string, RoomCleaningRecord>,
  roomId: string
): RoomCleaningRecord {
  const r = rooms[roomId];
  if (!r) return defaultRecord();
  // Ensure any new tasks added later are present
  const existing = new Set(r.taskStatuses.map((s) => s.taskId));
  const merged   = [...r.taskStatuses];
  for (const t of CLEANING_TASKS) {
    if (!existing.has(t.id)) merged.push({ taskId: t.id, done: false });
  }
  return { ...r, taskStatuses: merged };
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useCleaningStore = create<CleaningState>()(
  persist(
    (set, get) => ({
      rooms: {},

      toggleTask: (roomId, taskId) => {
        const record = getRecord(get().rooms, roomId);
        const statuses = record.taskStatuses.map((s) =>
          s.taskId === taskId ? { ...s, done: !s.done } : s
        );
        set((s) => ({
          rooms: { ...s.rooms, [roomId]: { ...record, taskStatuses: statuses } },
        }));
      },

      markAllDone: (roomId) => {
        const record   = getRecord(get().rooms, roomId);
        const statuses = record.taskStatuses.map((s) => ({ ...s, done: true }));
        set((s) => ({
          rooms: { ...s.rooms, [roomId]: { ...record, taskStatuses: statuses } },
        }));
      },

      markCleaned: (roomId) => {
        set((s) => ({
          rooms: {
            ...s.rooms,
            [roomId]: {
              taskStatuses:  CLEANING_TASKS.map((t) => ({ taskId: t.id, done: false })),
              lastCleanedAt: new Date().toISOString(),
              note:          '',
            },
          },
        }));
      },

      resetTasks: (roomId) => {
        const record = getRecord(get().rooms, roomId);
        set((s) => ({
          rooms: {
            ...s.rooms,
            [roomId]: {
              ...record,
              taskStatuses: CLEANING_TASKS.map((t) => ({ taskId: t.id, done: false })),
            },
          },
        }));
      },

      updateNote: (roomId, note) => {
        const record = getRecord(get().rooms, roomId);
        set((s) => ({
          rooms: { ...s.rooms, [roomId]: { ...record, note } },
        }));
      },
    }),
    { name: 'hl-cleaning-v1' }
  )
);
