
import React, { useState, useRef } from 'react';
import { extractInventoryFromImage } from '../services/geminiService';
import { InventoryRecord } from '../types';

interface ScannerTabProps {
  onDataExtracted: (data: any[]) => void;
}

export const ScannerTab: React.FC<ScannerTabProps> = ({ onDataExtracted }) => {
  const [isScanning, setIsScanning] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result as string;
      setPreview(base64);
      setIsScanning(true);
      
      const cleanBase64 = base64.split(',')[1];
      const extracted = await extractInventoryFromImage(cleanBase64);
      onDataExtracted(extracted);
      setIsScanning(false);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex flex-col items-center justify-center py-8 gap-6 animate-fadeIn">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-800">AI Sheet Scanner</h2>
        <p className="text-sm text-gray-500 max-w-[250px] mx-auto">Upload a photo of your paper log to automatically fill the digital inventory.</p>
      </div>

      <div className="relative w-full aspect-square max-w-[300px] border-2 border-dashed border-blue-200 rounded-3xl bg-blue-50/50 flex flex-col items-center justify-center overflow-hidden">
        {preview ? (
          <img src={preview} alt="Preview" className="w-full h-full object-cover" />
        ) : (
          <div className="flex flex-col items-center text-blue-400">
            <svg className="w-16 h-16 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
            <span className="text-sm font-medium">Capture or Upload Sheet</span>
          </div>
        )}

        {isScanning && (
          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center text-white p-4">
            <div className="w-10 h-10 border-4 border-white border-t-transparent rounded-full animate-spin mb-4"></div>
            <p className="text-sm font-semibold">AI is analyzing your log...</p>
            <p className="text-[10px] opacity-70 text-center mt-1 italic">Detecting floors, toilets, and numbers</p>
          </div>
        )}
      </div>

      <button 
        onClick={() => fileInputRef.current?.click()}
        disabled={isScanning}
        className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-10 rounded-2xl shadow-lg shadow-blue-200 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-2"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
        Select Image
      </button>
      
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange} 
        className="hidden" 
        accept="image/*" 
      />

      <div className="grid grid-cols-2 gap-3 w-full max-w-[320px] mt-4">
        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Success Rate</div>
          <div className="text-lg font-bold text-blue-600">~95%</div>
        </div>
        <div className="p-3 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="text-[10px] font-bold text-gray-400 uppercase">Process Time</div>
          <div className="text-lg font-bold text-blue-600">3-5s</div>
        </div>
      </div>
    </div>
  );
};
