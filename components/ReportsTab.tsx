
import React, { useState, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import * as XLSX from 'xlsx';
import { InventoryRecord } from '../types';

interface ReportsTabProps {
  records: InventoryRecord[];
  selectedDate: Date;
}

type ViewMode = 'daily' | 'weekly' | 'monthly';

export const ReportsTab: React.FC<ReportsTabProps> = ({ records, selectedDate }) => {
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
    try {
      const exportData: any[] = [];
      
      // Flatten data for Excel
      records.forEach(record => {
        Object.entries(record.usage).forEach(([dateStr, val]) => {
          // Fix: cast val to number to avoid 'unknown' type error in comparisons
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

      // Sort by date
      exportData.sort((a, b) => a.Tanggal.localeCompare(b.Tanggal));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Usage Report");

      // Auto-size columns (approximate)
      const maxWidths = exportData.reduce((acc, row) => {
        Object.keys(row).forEach((key, i) => {
          const val = String(row[key]);
          acc[i] = Math.max(acc[i] || 0, val.length, key.length);
        });
        return acc;
      }, []);
      worksheet['!cols'] = maxWidths.map(w => ({ wch: w + 2 }));

      const fileName = `Tissue_Report_${monthNames[month]}_${year}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error("Export failed:", error);
      alert("Failed to export data. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Calculate totals per day for the selected month
  const dailyTotals = useMemo(() => {
    const totals: Record<number, number> = {};
    for (let i = 1; i <= daysInMonth; i++) totals[i] = 0;
    
    records.forEach(r => {
      Object.entries(r.usage).forEach(([dateStr, val]) => {
        const d = new Date(dateStr);
        if (d.getFullYear() === year && d.getMonth() === month) {
          const dayNum = d.getDate();
          // Fix: cast val to number to avoid 'unknown' type error
          totals[dayNum] = (totals[dayNum] || 0) + (val as number);
        }
      });
    });
    return totals;
  }, [records, year, month, daysInMonth]);

  // Weekly data calculation
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

  // Floor data calculation for selected month
  const floorData = useMemo(() => {
    return Array.from(new Set(records.map(r => r.floor))).map(floor => {
      const total = records
        .filter(r => r.floor === floor)
        .reduce((sum: number, r: InventoryRecord) => {
          let floorUsage = 0;
          Object.entries(r.usage).forEach(([dateStr, val]) => {
            const d = new Date(dateStr);
            if (d.getFullYear() === year && d.getMonth() === month) {
              // Fix: cast val to number to avoid 'unknown' type error
              floorUsage += (val as number);
            }
          });
          return sum + floorUsage;
        }, 0);
      return { name: `L${floor}`, total };
    });
  }, [records, year, month]);

  const totalUsage = floorData.reduce((a, b) => a + b.total, 0);

  const renderDailyCalendar = () => {
    const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const startPadding = new Date(year, month, 1).getDay();

    return (
      <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-fadeIn">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-gray-800">Daily Heatmap</h3>
          <span className="text-[10px] text-gray-400 font-medium">{monthNames[month]} {year}</span>
        </div>
        <div className="grid grid-cols-7 gap-1">
          {dayLabels.map(label => (
            <div key={label} className="text-[10px] text-center font-bold text-gray-300 py-1 uppercase">{label}</div>
          ))}
          {Array.from({ length: startPadding }).map((_, i) => (
            <div key={`pad-${i}`} className="aspect-square"></div>
          ))}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1;
            const usage = dailyTotals[day] || 0;
            const intensity = usage === 0 ? 'bg-gray-50' : 
                             usage < 5 ? 'bg-blue-100 text-blue-700' :
                             usage < 15 ? 'bg-blue-300 text-blue-900' : 'bg-blue-600 text-white';
            
            return (
              <div 
                key={day} 
                className={`aspect-square rounded-lg flex flex-col items-center justify-center border border-white/50 transition-colors ${intensity}`}
              >
                <span className="text-[10px] font-bold opacity-60">{day}</span>
                {usage > 0 && <span className="text-[9px] font-black">{usage}</span>}
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-10">
      {/* Summary Card */}
      <div className="bg-gradient-to-br from-indigo-600 via-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-100/50">
        <div className="flex justify-between items-start mb-6">
          <div>
            <p className="text-blue-100 text-xs font-semibold uppercase tracking-wider">Total Konsumsi {monthNames[month]}</p>
            <h2 className="text-4xl font-black mt-1 tracking-tight">{totalUsage} <span className="text-sm font-normal opacity-70">Rolls</span></h2>
          </div>
          <div className="bg-white/20 p-2.5 rounded-2xl backdrop-blur-sm">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-md border border-white/10">
            <p className="text-[10px] uppercase opacity-70 font-black">Rata Harian</p>
            <p className="text-xl font-bold">{(totalUsage / daysInMonth).toFixed(1)}</p>
          </div>
          <div className="bg-white/10 p-3.5 rounded-2xl backdrop-blur-md border border-white/10">
            <p className="text-[10px] uppercase opacity-70 font-black">Month</p>
            <p className="text-xl font-bold truncate">{monthNames[month]}</p>
          </div>
        </div>
        
        {/* Export Button */}
        <button 
          onClick={handleExportExcel}
          disabled={isExporting}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-800 text-white py-3.5 rounded-2xl font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-emerald-900/20"
        >
          {isExporting ? (
            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
          ) : (
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          )}
          {isExporting ? 'Exporting...' : 'Export to Excel'}
        </button>
      </div>

      <div className="bg-gray-200/50 p-1 rounded-2xl flex gap-1">
        {(['daily', 'weekly', 'monthly'] as ViewMode[]).map((mode) => (
          <button key={mode} onClick={() => setViewMode(mode)} className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === mode ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}>
            {mode.charAt(0).toUpperCase() + mode.slice(1)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {viewMode === 'daily' && renderDailyCalendar()}
        {viewMode === 'weekly' && (
          <div className="bg-white p-4 rounded-3xl border border-gray-100 shadow-sm animate-slideUp">
            <h3 className="text-sm font-bold text-gray-800 mb-4">Weekly Consumption</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
            <h3 className="text-sm font-bold text-gray-800 mb-4">Floor Summary ({monthNames[month]})</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={floorData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
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
