
import React, { useState, useCallback, useEffect, useRef } from 'react';
import { Layout } from './components/Layout';
import { EntryTab } from './components/EntryTab';
import { ReportsTab } from './components/ReportsTab';
import { ScannerTab } from './components/ScannerTab';
import { INITIAL_RECORDS } from './constants';
import { InventoryRecord } from './types';
import { SupabaseService } from './services/supabaseService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'entry' | 'reports' | 'scan'>('entry');
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 1));
  const [syncStatus, setSyncStatus] = useState<'synced' | 'syncing' | 'error' | 'idle'>('idle');
  
  const [records, setRecords] = useState<InventoryRecord[]>(() => {
    try {
      const saved = localStorage.getItem('tissue_inventory_v2');
      return saved ? JSON.parse(saved) : INITIAL_RECORDS;
    } catch (e) {
      console.warn("Local data corrupted, resetting to defaults.");
      return INITIAL_RECORDS;
    }
  });

  const syncTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Initial pull from Supabase
  useEffect(() => {
    const initSync = async () => {
      if (!SupabaseService.isConfigured()) {
        setSyncStatus('idle');
        return;
      }

      setSyncStatus('syncing');
      const cloudData = await SupabaseService.pullData();
      if (cloudData) {
        setRecords(cloudData);
        setSyncStatus('synced');
      } else {
        // If pullData is null but configured, it might just be a new ID
        setSyncStatus('synced'); 
      }
    };
    initSync();
  }, []);

  // Save to Local Storage & Debounced push to Supabase
  useEffect(() => {
    localStorage.setItem('tissue_inventory_v2', JSON.stringify(records));
    
    if (!SupabaseService.isConfigured()) return;

    if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    
    setSyncStatus('syncing');
    
    syncTimeoutRef.current = setTimeout(async () => {
      const success = await SupabaseService.pushData(records);
      setSyncStatus(success ? 'synced' : 'error');
    }, 2500); // Slightly longer debounce for reliability

    return () => {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
    };
  }, [records]);

  const updateUsage = useCallback((floor: string, type: string, date: Date, value: number) => {
    const dateKey = date.toISOString().split('T')[0];
    setRecords(prev => prev.map(record => {
      if (record.floor === floor && record.type === type) {
        return {
          ...record,
          usage: {
            ...record.usage,
            [dateKey]: Math.max(0, Math.floor(value))
          }
        };
      }
      return record;
    }));
  }, []);

  const handleDataExtracted = useCallback((data: any[]) => {
    if (!Array.isArray(data)) return;
    
    setRecords(prev => {
      const newRecords = [...prev];
      data.forEach(entry => {
        const recordIndex = newRecords.findIndex(r => r.floor === String(entry.floor) && r.type === entry.type);
        if (recordIndex !== -1) {
          const targetDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), entry.day);
          const dateKey = targetDate.toISOString().split('T')[0];
          newRecords[recordIndex] = {
            ...newRecords[recordIndex],
            usage: {
              ...newRecords[recordIndex].usage,
              [dateKey]: Number(entry.value) || 0
            }
          };
        }
      });
      return newRecords;
    });
    setActiveTab('entry');
  }, [selectedDate]);

  return (
    <Layout 
      activeTab={activeTab} 
      onTabChange={setActiveTab}
      selectedDate={selectedDate}
      onDateChange={setSelectedDate}
      records={records}
      syncStatus={syncStatus}
    >
      {activeTab === 'entry' && (
        <EntryTab records={records} onUpdate={updateUsage} selectedDate={selectedDate} onDateChange={setSelectedDate} />
      )}
      {activeTab === 'reports' && (
        <ReportsTab records={records} selectedDate={selectedDate} onDataSync={setRecords} />
      )}
      {activeTab === 'scan' && (
        <ScannerTab onDataExtracted={handleDataExtracted} />
      )}
    </Layout>
  );
};

export default App;
