
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { InventoryRecord } from '../types';
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

  const monthNames = [
    "Januari", "Februari", "Maret", "April", "Mei", "Juni",
    "Juli", "Agustus", "September", "Oktober", "November", "Desember"
  ];

  const year = selectedDate.getFullYear();
  const month = selectedDate.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const handleExportExcel = () => {
    setIsExporting(true);
    
    // Slight delay to allow UI to show loading state
    setTimeout(() => {
      try {
        const exportData: any[] = [];
        records.forEach(record => {
          Object.entries(record.usage).forEach(([dateStr, val]) => {
            const usageVal = val as number;
            if (usageVal > 0) {
              const dateObj = new Date(dateStr);
              exportData.push({
                'Tanggal': dateStr,
                'Hari': dateObj.getDate(),
                'Bulan': monthNames[dateObj.getMonth()],
                'Tahun': dateObj.getFullYear(),
                'Lantai': record.floor,
                'Area (Toilet)': record.type,
                'Jumlah (Roll)': usageVal
              });
            }
          });
        });

        if (exportData.length === 0) {
          alert("Tidak ada data untuk diekspor.");
          setIsExporting(false);
          return;
        }

        // Sort by date ascending
        exportData.sort((a, b) => a.Tanggal.localeCompare(b.Tanggal));
        
        const worksheet = XLSX.utils.json_to_sheet(exportData);
        
        // Adjust column widths
        const wscols = [
          {wch: 15}, {wch: 5}, {wch: 12}, {wch: 8}, {wch: 8}, {wch: 20}, {wch: 12}
        ];
        worksheet['!cols'] = wscols;

        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Penggunaan");
        
        const fileName = `Laporan_Tissue_${monthNames[month]}_${year}.xlsx`;
        XLSX.writeFile(workbook, fileName);
      } catch (error) {
        console.error(error);
        alert("Gagal mengekspor data ke Excel.");
      } finally {
        setIsExporting(false);
      }
    }, 500);
  };

  const handleReset = () => {
    if (window.confirm("PERINGATAN: Ini akan menghapus semua data penggunaan secara permanen. Lanjutkan?")) {
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
      { name: 'M1', range: [1, 7], total: 0 },
      { name: 'M2', range: [8, 14], total: 0 },
      { name: 'M3', range: [15, 21], total: 0 },
      { name: 'M4', range: [22, 28], total: 0 },
      { name: 'M5', range: [29, 31], total: 0 },
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
      <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-6 rounded-[32px] text-white shadow-xl shadow-blue-100">
        <p className="text-blue-100 text-xs font-black uppercase tracking-widest mb-1">Total Konsumsi {monthNames[month]}</p>
        <div className="flex items-end gap-2">
          <h2 className="text-5xl font-black tracking-tighter">{totalUsage}</h2>
          <span className="text-sm font-bold opacity-80 mb-2 uppercase">Rolls</span>
        </div>
        <div className="mt-6 flex items-center gap-2 bg-white/10 w-fit px-3 py-1.5 rounded-full backdrop-blur-md">
          <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></div>
          <span className="text-[10px] font-bold uppercase tracking-wide">Data Ter-update (Lokal)</span>
        </div>
      </div>

      {/* View Switcher */}
      <div className="bg-gray-200/50 p-1 rounded-2xl flex gap-1">
        {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
          <button 
            key={mode} 
            onClick={() => setViewMode(mode)} 
            className={`flex-1 py-2.5 rounded-xl text-[11px] font-black uppercase tracking-wider transition-all ${
              viewMode === mode ? 'bg-white text-blue-600 shadow-sm scale-[1.02]' : 'text-gray-500'
            }`}
          >
            {mode === 'daily' ? 'Harian' : mode === 'weekly' ? 'Mingguan' : 'Lantai'}
          </button>
        ))}
      </div>

      {/* Chart Section */}
      <div className="min-h-[280px]">
        {viewMode === 'daily' && (
          <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm animate-fadeIn">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Aktivitas Harian</h3>
            <div className="grid grid-cols-7 gap-1.5">
              {['M', 'S', 'S', 'R', 'K', 'J', 'S'].map((l, i) => (
                <div key={i} className="text-[9px] text-center font-black text-gray-300 py-1 uppercase">{l}</div>
              ))}
              {Array.from({ length: new Date(year, month, 1).getDay() }).map((_, i) => <div key={`empty-${i}`} />)}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const usage = dailyTotals[day] || 0;
                const intensity = usage === 0 ? 'bg-gray-50 text-gray-300' : usage < 5 ? 'bg-blue-50 text-blue-400' : usage < 15 ? 'bg-blue-200 text-blue-700' : 'bg-blue-600 text-white';
                return (
                  <div key={day} className={`aspect-square rounded-xl flex flex-col items-center justify-center border border-white/50 text-[10px] font-black transition-colors ${intensity}`}>
                    <span className="opacity-40 text-[8px]">{day}</span>
                    {usage > 0 && <span className="mt-[-2px]">{usage}</span>}
                  </div>
                );
              })}
            </div>
          </div>
        )}
        
        {viewMode === 'weekly' && (
          <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm animate-slideUp">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Tren Mingguan</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#cbd5e1' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#cbd5e1' }} />
                  <Bar dataKey="total" radius={[8, 8, 8, 8]} fill="#4f46e5" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {viewMode === 'monthly' && (
          <div className="bg-white p-5 rounded-[32px] border border-gray-100 shadow-sm animate-slideUp">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Penggunaan per Lantai</h3>
            <div className="h-48">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={floorData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#cbd5e1' }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 900, fill: '#cbd5e1' }} />
                  <Bar dataKey="total" radius={[8, 8, 8, 8]} fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>

      {/* Data Management Section */}
      <div className="bg-white p-6 rounded-[32px] border border-gray-100 shadow-sm space-y-4">
        <div>
          <h3 className="text-sm font-black text-gray-800">Manajemen Data</h3>
          <p className="text-[11px] text-gray-400 font-medium">Ekspor laporan atau bersihkan database lokal.</p>
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button 
            onClick={handleExportExcel} 
            disabled={isExporting}
            className={`w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-sm font-black uppercase tracking-widest transition-all active:scale-95 ${
              isExporting 
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
              : 'bg-green-600 text-white shadow-lg shadow-green-100'
            }`}
          >
            {isExporting ? (
              <div className="w-5 h-5 border-2 border-gray-300 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            )}
            {isExporting ? 'Memproses...' : 'Unduh Laporan Excel'}
          </button>

          <button 
            onClick={handleReset}
            className="w-full flex items-center justify-center gap-2 py-3 text-red-400 text-[10px] font-black uppercase tracking-widest hover:text-red-600 transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Hapus Database Lokal
          </button>
        </div>
      </div>
      
      <div className="px-4 text-center">
        <p className="text-[9px] text-gray-300 font-bold uppercase tracking-tighter italic">
          v2.0 • Data disimpan secara aman di penyimpanan internal browser Anda.
        </p>
      </div>
    </div>
  );
};
