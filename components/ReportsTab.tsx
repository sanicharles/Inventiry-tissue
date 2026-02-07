
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { InventoryRecord } from '../types';
import { SupabaseService } from '../services/supabaseService';
import { INITIAL_RECORDS } from '../constants';

interface ReportsTabProps {
  records: InventoryRecord[];
  selectedDate: Date;
  onDataSync?: (records: InventoryRecord[]) => void;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

export const ReportsTab: React.FC<ReportsTabProps> = ({ records, selectedDate, onDataSync }) => {
  const [viewMode, setViewMode] = useState<ViewMode>('daily');
  const [isExporting, setIsExporting] = useState(false);
  const [syncIdInput, setSyncIdInput] = useState(SupabaseService.getSyncId());
  const [isConnecting, setIsConnecting] = useState(false);

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleExportExcel = () => {
    setIsExporting(true);
    try {
      const exportData: any[] = [];
      records.forEach(record => {
        Object.entries(record.usage).forEach(([dateStr, val]) => {
          const usageVal = val as number;
          if (usageVal > 0) {
            exportData.push({
              'Tanggal': dateStr,
              'Lantai': record.floor,
              'Tipe Toilet': record.type,
              'Jumlah (Roll)': usageVal
            });
          }
        });
      });
      exportData.sort((a, b) => a.Tanggal.localeCompare(b.Tanggal));
      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Usage Report");
      const fileName = `Tissue_Report_${monthNames[month]}_${year}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      alert("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleConnectSyncId = async () => {
    if (!syncIdInput.trim()) return;
    setIsConnecting(true);
    SupabaseService.setSyncId(syncIdInput.trim());
    
    if (SupabaseService.isConfigured()) {
      const data = await SupabaseService.pullData();
      if (data && onDataSync) {
        onDataSync(data);
        alert("Terhubung ke cloud! Data diperbarui.");
      } else {
        alert("Sync ID disimpan. Siap melakukan sinkronisasi baru.");
      }
    } else {
      alert("Sync ID disimpan secara lokal. Masukkan Supabase keys untuk menghubungkan ke Cloud.");
    }
    setIsConnecting(false);
  };

  const handleReset = () => {
    if (window.confirm("Hapus semua data lokal dan reset ke awal?")) {
      localStorage.removeItem('tissue_inventory_v2');
      if (onDataSync) onDataSync(INITIAL_RECORDS);
      window.location.reload();
    }
  };

  const dailyTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) totals[i] = 0;
    records.forEach(r => {
      Object.entries(r.usage).forEach(([dateStr, val]) => {
        const d = new Date(dateStr);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const dayNum = d.getDate();
          totals[dayNum] = (totals[dayNum] || 0) + (val as number);
        }
      });
    });
    return totals;
  }, [records, year, month, daysInMonth]);

  const weeklyData = useMemo(() => {
    const weeks = [
      { name: 'W1', range: [1, 7], total: 0 },
      { name: 'W2', range: [8, 14], total: 0 },
      { name: 'W3', range: [15, 21], total: 0 },
      { name: 'W4', range: [22, 28], total: 0 },
      { name: 'W5', range: [29, 31], total: 0 },
    ];
    weeks.forEach(w => {
      for (let i = w.range[0]; i <= Math.min(w.range[1], daysInMonth); i++) {
        w.total += dailyTotals[i] || 0;
      }
    });
    return weeks;
  }, [dailyTotals, daysInMonth]);

  const floorData = useMemo(() => {
    return Array.from(new Set(records.map(r => r.floor))).map(floor => {
      const total = records
        .filter(r => r.floor === floor)
        .reduce((sum: number, r: InventoryRecord) => {
          let floorUsage = 0;
          Object.entries(r.usage).forEach(([dateStr, val]) => {
            const d = new Date(dateStr);
            if (d.getFullYear() === year && d.getMonth() === month) {
              floorUsage += (val as number);
            }
          });
          return sum + floorUsage;
        }, 0);
      return { name: `L${floor}`, total };
    });
  }, [records, year, month]);

  const totalUsage = floorData.reduce((a, b) => a + b.total, 0);

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-100/50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Total Konsumsi {monthNames[month]}</p>
            <h2 className="text-4xl font-black mt-1 tracking-tight">{totalUsage} <span className="text-sm font-normal opacity-70">Rolls</span></h2>
          </div>
          <button onClick={handleExportExcel} disabled={isExporting} className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm active:scale-90 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          </button>
        </div>
        <p className="text-[10px] text-blue-100 font-bold">Laporan bulanan dapat diunduh ke format Excel.</p>
      </div>

      {/* Supabase Sync Settings */}
      <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
          </div>
          <div>
            <h3 className="text-sm font-black text-gray-800">Sinkronisasi Cloud</h3>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-tight">Status: {SupabaseService.isConfigured() ? 'Cloud Ready' : 'Local Only'}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={syncIdInput} 
            onChange={(e) => setSyncIdInput(e.target.value.toUpperCase())}
            className="flex-1 bg-gray-50 border border-gray-100 rounded-xl px-4 text-sm font-bold text-gray-800 focus:outline-none focus:border-blue-400" 
            placeholder="ID-SINKRONISASI"
          />
          <button 
            onClick={handleConnectSyncId} 
            disabled={isConnecting}
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest active:scale-95 transition-all disabled:opacity-50"
          >
            {isConnecting ? '...' : 'Tautkan'}
          </button>
        </div>
        <button 
          onClick={handleReset}
          className="w-full text-center text-[10px] text-red-400 font-bold uppercase tracking-widest hover:text-red-600 py-1"
        >
          Hapus Data & Reset Cache
        </button>
      </div>

      <div className="bg-gray-200/50 p-1 rounded-2xl flex gap-1">
        {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
          <button key={mode} onClick={() => setViewMode(mode)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {mode === 'daily' ? 'Harian' : mode === 'weekly' ? 'Mingguan' : 'Lantai'}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {viewMode === 'daily' && (
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-fadeIn">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Heatmap Harian</h3>
            <div className="grid grid-cols-7 gap-1">
              {['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'].map(l => (
                <div key={l} className="text-[10px] text-center font-bold text-gray-300 py-1 uppercase">{l}</div>
              ))}
              {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => <div key={i} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const usage = dailyTotals[day] || 0;
                const intensity = usage === 0 ? 'bg-gray-50' : usage < 5 ? 'bg-blue-100' : usage < 15 ? 'bg-blue-300' : 'bg-blue-600 text-white';
                return (
                  <div key={day} className={`aspect-square rounded-lg flex flex-col items-center justify-center border border-white/50 text-[10px] font-bold ${intensity}`}>
                    <span className="opacity-60">{day}</span>
                    {usage > 0 && <span>{usage}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {viewMode === 'weekly' && (
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-slideUp">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Konsumsi Mingguan</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Bar dataKey="total" radius={[8, 8, 0, 0]} fill="#6366f1" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
        {viewMode === 'monthly' && (
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-slideUp">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Ringkasan Lantai</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={floorData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#9ca3af' }} />
                  <Bar dataKey="total" radius={[6, 6, 0, 0]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
