
import React, { useState, useMemo } from 'react';
import { InventoryRecord } from '../types';

interface EntryTabProps {
  records: InventoryRecord[];
  onUpdate: (floor: string, type: string, date: Date, value: number) => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
}

export const EntryTab: React.FC<EntryTabProps> = ({ records, onUpdate, selectedDate, onDateChange }) => {
  const [expandedFloor, setExpandedFloor] = useState<string | null>('2');
  const floors = useMemo(() => Array.from(new Set(records.map(r => r.floor))), [records]);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const daysInMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 0).getDate();
  const dateKey = selectedDate.toISOString().split('T')[0];

  return (
    <div className="space-y-4 animate-fadeIn">
      <div className="px-1 flex items-baseline gap-2 mb-2">
        <span className="text-3xl font-black text-gray-800">{selectedDate.getDate()}</span>
        <div className="flex flex-col">
          <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">
            {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
          </span>
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-tight">Data Terpilih</span>
        </div>
      </div>

      <div className="flex overflow-x-auto gap-2 py-2 hide-scrollbar">
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dayDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), dayNum);
          const dayKey = dayDate.toISOString().split('T')[0];
          const isSelected = selectedDate.getDate() === dayNum;
          
          return (
            <button
              key={dayNum}
              onClick={() => onDateChange(dayDate)}
              className={`flex-shrink-0 w-12 h-14 rounded-2xl flex flex-col items-center justify-center transition-all ${
                isSelected 
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-200 scale-105' 
                  : 'bg-white text-gray-400 border border-gray-100 hover:border-blue-200'
              }`}
            >
              <span className="text-[9px] opacity-60 font-black uppercase">
                {monthNames[selectedDate.getMonth()].slice(0, 3)}
              </span>
              <span className="text-sm font-black">{dayNum}</span>
              {records.some(r => r.usage[dayKey] > 0) && !isSelected && (
                <span className="w-1 h-1 bg-blue-300 rounded-full mt-1"></span>
              )}
            </button>
          );
        })}
      </div>

      <div className="space-y-3">
        {floors.map(floor => {
          const floorRecords = records.filter(r => r.floor === floor);
          const floorTotalForDay = floorRecords.reduce((sum: number, r: InventoryRecord) => sum + (r.usage[dateKey] || 0), 0);
          
          return (
            <div key={floor} className="bg-white rounded-3xl border border-gray-100 overflow-hidden shadow-sm transition-all hover:shadow-md">
              <button 
                onClick={() => setExpandedFloor(expandedFloor === floor ? null : floor)}
                className="w-full px-5 py-4 flex items-center justify-between hover:bg-gray-50 active:bg-gray-100"
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-colors ${floorTotalForDay > 0 ? 'bg-blue-600 text-white' : 'bg-blue-50 text-blue-600'}`}>
                    {floor}
                  </div>
                  <div className="text-left">
                    <h3 className="font-black text-gray-800 text-base">Lantai {floor}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">
                        {floorRecords.length} Area
                      </span>
                      {floorTotalForDay > 0 && (
                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded-md font-bold">
                          {floorTotalForDay} Rolls
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                   <svg 
                    className={`w-5 h-5 text-gray-300 transition-transform duration-300 ${expandedFloor === floor ? 'rotate-180' : ''}`} 
                    fill="none" stroke="currentColor" viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </button>

              {expandedFloor === floor && (
                <div className="px-4 pb-5 space-y-3 border-t border-gray-50 pt-4 bg-gray-50/50">
                  {floorRecords.map(record => (
                    <div key={`${record.floor}-${record.type}`} className="flex items-center justify-between p-4 bg-white rounded-2xl border border-gray-100 shadow-sm animate-slideUp">
                      <div className="max-w-[140px]">
                        <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{record.type}</span>
                        <p className="text-xs text-gray-400 font-medium mt-0.5 leading-tight">Penggunaan hari ini</p>
                      </div>
                      <div className="flex items-center gap-3 bg-gray-50 p-1.5 rounded-2xl">
                        <button 
                          onClick={() => onUpdate(record.floor, record.type, selectedDate, (record.usage[dateKey] || 0) - 1)}
                          className="w-10 h-10 rounded-xl bg-white border border-gray-100 flex items-center justify-center text-gray-600 shadow-sm active:scale-90 transition-transform"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M20 12H4" /></svg>
                        </button>
                        <input 
                          type="number"
                          value={record.usage[dateKey] || 0}
                          onChange={(e) => onUpdate(record.floor, record.type, selectedDate, parseInt(e.target.value) || 0)}
                          className="w-10 text-center font-black text-lg text-gray-800 bg-transparent focus:outline-none"
                        />
                        <button 
                          onClick={() => onUpdate(record.floor, record.type, selectedDate, (record.usage[dateKey] || 0) + 1)}
                          className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md active:scale-90 transition-transform"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M12 4v16m8-8H4" /></svg>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
