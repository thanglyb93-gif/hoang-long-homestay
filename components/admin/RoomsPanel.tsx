'use client';

import { useState } from 'react';
import { Plus, Trash2, CalendarOff, BedDouble } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { usePricingStore, ROOM_PRICE_KEY } from '@/lib/pricing-store';
import { useAllRooms, useRoomStore } from '@/lib/room-store';

export default function RoomsPanel() {
  const { overrides: roomOverrides } = useRoomStore();
  const { getRoomOverride, addManualBlock, removeManualBlock } = useAdminStore();
  const { prices } = usePricingStore();
  const allRooms = useAllRooms();

  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [blockNote, setBlockNote] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'placeholder'>('active');

  const activeRooms = allRooms.filter((r) => {
    const o = roomOverrides[r.id];
    if (r.isPlaceholder) return o?.isActive === true;
    return o?.isActive !== false;
  });

  const placeholderRooms = allRooms.filter((r) => {
    const o = roomOverrides[r.id];
    if (!r.isPlaceholder) return false;
    return o?.isActive !== true;
  });

  const displayRooms = activeTab === 'active' ? activeRooms : placeholderRooms;

  const handleBlock = () => {
    if (!selectedRoom || !startDate || !endDate) return;
    addManualBlock(selectedRoom, { start: startDate, end: endDate, note: blockNote });
    setStartDate('');
    setEndDate('');
    setBlockNote('');
  };

  const getBlocksForRoom = (roomId: string) => {
    return getRoomOverride(roomId).manualBlocks ?? [];
  };

  const formatDateRange = (start: string, end: string) => {
    if (start === end) return start;
    return `${start} → ${end}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Room Management</h2>
        <p className="text-gray-400 text-sm">Block date ranges and manage room availability</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('active')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'active'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Active Rooms ({activeRooms.length})
        </button>
        <button
          onClick={() => setActiveTab('placeholder')}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            activeTab === 'placeholder'
              ? 'bg-blue-600 text-white'
              : 'bg-gray-800 text-gray-400 hover:text-white'
          }`}
        >
          Placeholder Rooms ({placeholderRooms.length})
        </button>
      </div>

      {/* Room Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {displayRooms.map((room) => {
          const blocks = getBlocksForRoom(room.id);
          const priceKey = ROOM_PRICE_KEY[room.id];
          const price = priceKey ? prices[priceKey] : null;
          const isSelected = selectedRoom === room.id;

          return (
            <div
              key={room.id}
              className={`bg-gray-800 rounded-xl p-4 border-2 transition-colors cursor-pointer ${
                isSelected ? 'border-blue-500' : 'border-gray-700 hover:border-gray-600'
              }`}
              onClick={() => setSelectedRoom(isSelected ? null : room.id)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BedDouble className="w-5 h-5 text-blue-400" />
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-semibold">
                        {room.nameEn} · Room {room.roomNumber}
                      </h3>
                      {room.isPlaceholder && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                          Placeholder
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{room.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">
                    {price ? `${price.toLocaleString()} ₫/night` : '—'}
                  </p>
                  {blocks.length > 0 && (
                    <p className="text-orange-400 text-xs">
                      {blocks.length} block{blocks.length > 1 ? 's' : ''}
                    </p>
                  )}
                </div>
              </div>

              {/* Blocked ranges list */}
              {blocks.length > 0 && (
                <div className="mt-2 space-y-1">
                  {blocks.map((block) => (
                    <div
                      key={block.id}
                      className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-1.5"
                    >
                      <div className="flex items-center gap-2">
                        <CalendarOff className="w-3.5 h-3.5 text-orange-400 flex-shrink-0" />
                        <div>
                          <span className="text-gray-300 text-sm">
                            {formatDateRange(block.start, block.end)}
                          </span>
                          {block.note && (
                            <p className="text-gray-500 text-xs">{block.note}</p>
                          )}
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          removeManualBlock(room.id, block.id);
                        }}
                        className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Date range block input */}
              {isSelected && (
                <div
                  className="mt-3 space-y-2"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">From</label>
                      <input
                        type="date"
                        value={startDate}
                        onChange={(e) => {
                          setStartDate(e.target.value);
                          if (!endDate || e.target.value > endDate) setEndDate(e.target.value);
                        }}
                        className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                    <div>
                      <label className="text-gray-400 text-xs mb-1 block">To</label>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
                      />
                    </div>
                  </div>
                  <input
                    type="text"
                    value={blockNote}
                    onChange={(e) => setBlockNote(e.target.value)}
                    placeholder="Note (optional, e.g. Maintenance)"
                    className="w-full bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleBlock}
                    disabled={!startDate || !endDate}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm flex items-center justify-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Block Date Range
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {displayRooms.length === 0 && (
          <div className="col-span-2 bg-gray-800/50 rounded-xl p-8 text-center border border-gray-700">
            <p className="text-gray-400 text-sm">
              {activeTab === 'active'
                ? 'No active rooms. Activate rooms in Room Info.'
                : 'All placeholder rooms have been activated.'}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}