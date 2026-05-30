'use client';

import { useState } from 'react';
import { Plus, Trash2, CalendarOff, CheckCircle2, AlertCircle, BedDouble } from 'lucide-react';
import { useAdminStore } from '@/lib/admin-store';
import { usePricingStore } from '@/lib/pricing-store';

const ROOMS = [
  { id: 'green-mountain', name: 'Delta',   number: '101', tier: 'Standard Double', priceKey: 'delta101'  as const, isPlaceholder: false },
  { id: 'ban-flower',    name: 'Gamma',   number: '201', tier: 'Superior Double', priceKey: 'gamma201'  as const, isPlaceholder: false },
  { id: 'family-room',   name: 'Alpha',   number: '202', tier: 'Deluxe Double',   priceKey: 'alpha202'  as const, isPlaceholder: false },
  { id: 'deluxe',        name: 'Beta',    number: '301', tier: 'Deluxe Double',   priceKey: 'beta301'   as const, isPlaceholder: false },
  { id: 'epsilon',       name: 'Epsilon', number: '102', tier: 'Standard Double', priceKey: 'delta101'  as const, isPlaceholder: true  },
  { id: 'zeta',          name: 'Zeta',    number: '203', tier: 'Superior Double', priceKey: 'gamma201'  as const, isPlaceholder: true  },
  { id: 'eta',           name: 'Eta',     number: '302', tier: 'Deluxe Double',   priceKey: 'alpha202'  as const, isPlaceholder: true  },
  { id: 'theta',         name: 'Theta',   number: '303', tier: 'Deluxe Double',   priceKey: 'beta301'   as const, isPlaceholder: true  },
];

export default function RoomsPanel() {
  const { blockedDates, blockDate, unblockDate } = useAdminStore();
  const { prices } = usePricingStore();
  const [selectedRoom, setSelectedRoom] = useState<string | null>(null);
  const [dateInput, setDateInput] = useState('');
  const [activeTab, setActiveTab] = useState<'active' | 'placeholder'>('active');

  const activeRooms = ROOMS.filter(r => !r.isPlaceholder);
  const placeholderRooms = ROOMS.filter(r => r.isPlaceholder);
  const displayRooms = activeTab === 'active' ? activeRooms : placeholderRooms;

  const handleBlock = () => {
    if (!selectedRoom || !dateInput) return;
    blockDate(selectedRoom, dateInput);
    setDateInput('');
  };

  const getBlockedForRoom = (roomId: string) => {
    return (blockedDates && blockedDates[roomId]) ? blockedDates[roomId] : [];
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-1">Room Management</h2>
        <p className="text-gray-400 text-sm">Block dates and manage room availability</p>
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
        {displayRooms.map(room => {
          const blocked = getBlockedForRoom(room.id);
          const price = prices[room.priceKey];
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
                      <h3 className="text-white font-semibold">{room.name} · Room {room.number}</h3>
                      {room.isPlaceholder && (
                        <span className="text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 px-2 py-0.5 rounded-full">
                          Placeholder
                        </span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm">{room.tier}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-medium">{price ? `$${price}/night` : '—'}</p>
                  {blocked.length > 0 && (
                    <p className="text-orange-400 text-xs">{blocked.length} date{blocked.length > 1 ? 's' : ''} blocked</p>
                  )}
                </div>
              </div>

              {/* Blocked dates list */}
              {blocked.length > 0 && (
                <div className="mt-2 space-y-1">
                  {blocked.map(date => (
                    <div key={date} className="flex items-center justify-between bg-gray-700/50 rounded-lg px-3 py-1.5">
                      <div className="flex items-center gap-2">
                        <CalendarOff className="w-3.5 h-3.5 text-orange-400" />
                        <span className="text-gray-300 text-sm">{date}</span>
                      </div>
                      <button
                        onClick={e => { e.stopPropagation(); unblockDate(room.id, date); }}
                        className="text-red-400 hover:text-red-300 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Date block input */}
              {isSelected && (
                <div className="mt-3 flex gap-2" onClick={e => e.stopPropagation()}>
                  <input
                    type="date"
                    value={dateInput}
                    onChange={e => setDateInput(e.target.value)}
                    className="flex-1 bg-gray-700 text-white rounded-lg px-3 py-2 text-sm border border-gray-600 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={handleBlock}
                    disabled={!dateInput}
                    className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-3 py-2 rounded-lg text-sm flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    Block
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}