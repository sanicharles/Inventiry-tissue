
import React, { useState } from 'react';
import { InventoryRecord } from '../types';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  onTabChange: (tab: 'entry' | 'reports' | 'scan') => void;
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  records: InventoryRecord[];
}

export const Layout: React.FC<LayoutProps> = ({ children, activeTab, onTabChange, selectedDate, onDateChange, records }) => {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewingDate, setViewingDate] = useState(new Date(selectedDate));

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const dayHasData = (date: Date) => {
    const key = date.toISOString().split('T')[0];
    return records.some(r => r.usage[key] !== undefined && r.usage[key] > 0);
  };

  const changeMonth = (offset: number) => {
    const newDate = new Date(viewingDate.getFullYear(), viewingDate.getMonth() + offset, 1);
    setViewingDate(newDate);
  };

  const renderCalendarOverlay = () => {
    const year = viewingDate.getFullYear();
    const month = viewingDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startPadding = new Date(year, month, 1).getDay();
    const dayLabels = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

    return (
      <>
        <div 
          className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity animate-fadeIn"
          onClick={() => setIsCalendarOpen(false)}
        />
        <div className="fixed top-20 left-4 right-4 bg-white rounded-[32px] p-6 shadow-2xl z-50 animate-slideUp border border-gray-100 max-w-md mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => changeMonth(-1)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M15 19l-7-7 7-7" /></svg></button>
            <div className="text-center">
              <h4 className="text-xl font-black text-gray-800">{monthNames[month]}</h4>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">{year}</p>
            </div>
            <button onClick={() => changeMonth(1)} className="p-2 hover:bg-gray-100 rounded-xl text-gray-400"><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 5l7 7-7 7" /></svg></button>
          </div>
          <div className="grid grid-cols-7 gap-2">
            {dayLabels.map(l => <div key={l} className="text-[10px] text-center font-black text-gray-300 py-1">{l}</div>)}
            {Array.from({ length: startPadding }).map((_, i) => <div key={`pad-${i}`} className="aspect-square"></div>)}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateObj = new Date(year, month, day);
              const isSelected = selectedDate.getDate() === day && selectedDate.getMonth() === month && selectedDate.getFullYear() === year;
              return (
                <button key={day} onClick={() => { onDateChange(dateObj); setIsCalendarOpen(false); }} className={`relative aspect-square rounded-2xl flex items-center justify-center text-sm font-bold ${isSelected ? 'bg-blue-600 text-white shadow-lg' : 'bg-gray-50 text-gray-600'}`}>
                  {day}
                  {dayHasData(dateObj) && !isSelected && <span className="absolute bottom-2 w-1 h-1 bg-blue-400 rounded-full"></span>}
                </button>
              );
            })}
          </div>
        </div>
      </>
    );
  };

  return (
    <div className="flex flex-col h-screen max-w-md mx-auto bg-gray-50 overflow-hidden shadow-xl border-x border-gray-200">
      <header className="bg-white/80 backdrop-blur-md px-4 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold shadow-sm">T</div>
          <div>
            <h1 className="text-base font-black text-gray-800 leading-none">TissueRoll</h1>
            <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">Local Storage Mode</p>
          </div>
        </div>
        
        <button 
          onClick={() => {
            setViewingDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));
            setIsCalendarOpen(!isCalendarOpen);
          }}
          className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all border ${isCalendarOpen ? 'bg-blue-600 border-blue-600 text-white' : 'bg-gray-100 border-transparent text-gray-500'}`}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
          <span className="text-[11px] font-black uppercase">{monthNames[selectedDate.getMonth()].slice(0, 3)} {selectedDate.getFullYear()}</span>
        </button>
      </header>

      {isCalendarOpen && renderCalendarOverlay()}
      <main className="flex-1 overflow-y-auto hide-scrollbar p-4 pb-24">{children}</main>

      <nav className="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-white/90 backdrop-blur-md border-t border-gray-200 flex justify-around items-center py-3 px-6 z-20">
        <button onClick={() => onTabChange('entry')} className={`flex flex-col items-center gap-1 ${activeTab === 'entry' ? 'text-blue-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /></svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Logs</span>
        </button>
        <button onClick={() => onTabChange('scan')} className={`flex flex-col items-center gap-1 -mt-8 bg-blue-600 w-14 h-14 rounded-full shadow-lg border-4 border-white justify-center transition-all ${activeTab === 'scan' ? 'bg-blue-700' : ''}`}>
          <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        </button>
        <button onClick={() => onTabChange('reports')} className={`flex flex-col items-center gap-1 ${activeTab === 'reports' ? 'text-blue-600' : 'text-gray-400'}`}>
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.2" d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" /></svg>
          <span className="text-[10px] font-bold uppercase tracking-wider">Stats</span>
        </button>
      </nav>
    </div>
  );
};
