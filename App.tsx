
import React, { useState, useCallback, useEffect } from 'react';
import { Layout } from './components/Layout';
import { EntryTab } from './components/EntryTab';
import { ReportsTab } from './components/ReportsTab';
import { ScannerTab } from './components/ScannerTab';
import { INITIAL_RECORDS } from './constants';
import { InventoryRecord } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'entry' | 'reports' | 'scan'>('entry');
  const [selectedDate, setSelectedDate] = useState(new Date(2026, 0, 1)); // Default to Jan 1, 2026
  const [records, setRecords] = useState<InventoryRecord[]>(() => {
    const saved = localStorage.getItem('tissue_inventory_v2');
    return saved ? JSON.parse(saved) : INITIAL_RECORDS;
  });

  useEffect(() => {
    localStorage.setItem('tissue_inventory_v2', JSON.stringify(records));
  }, [records]);

  const updateUsage = useCallback((floor: string, type: string, date: Date, value: number) => {
    const dateKey = date.toISOString().split('T')[0];
    setRecords(prev => prev.map(record => {
      if (record.floor === floor && record.type === type) {
        return {
          ...record,
          usage: {
            ...record.usage,
            [dateKey]: Math.max(0, value)
          }
        };
      }
      return record;
    }));
  }, []);

  const handleDataExtracted = useCallback((data: any[]) => {
    setRecords(prev => {
      const newRecords = [...prev];
      data.forEach(entry => {
        const recordIndex = newRecords.findIndex(r => r.floor === String(entry.floor) && r.type === entry.type);
        if (recordIndex !== -1) {
          // Assuming entry.day refers to current selected month/year
          const targetDate = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), entry.day);
          const dateKey = targetDate.toISOString().split('T')[0];
          newRecords[recordIndex] = {
            ...newRecords[recordIndex],
            usage: {
              ...newRecords[recordIndex].usage,
              [dateKey]: entry.value
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
    >
      {activeTab === 'entry' && (
        <EntryTab records={records} onUpdate={updateUsage} selectedDate={selectedDate} onDateChange={setSelectedDate} />
      )}
      {activeTab === 'reports' && (
        <ReportsTab records={records} selectedDate={selectedDate} />
      )}
      {activeTab === 'scan' && (
        <ScannerTab onDataExtracted={handleDataExtracted} />
      )}
    </Layout>
  );
};

export default App;
