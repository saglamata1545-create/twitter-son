import React, { useState } from 'react';
import { TaskConfig } from '../types';
import { Settings, Play, Square, Wand2, Loader2, Link as LinkIcon, MessageSquareQuote } from 'lucide-react';
import { generateQuoteTexts } from '../services/geminiService';

interface TaskConfigPanelProps {
  config: TaskConfig;
  setConfig: React.Dispatch<React.SetStateAction<TaskConfig>>;
  isRunning: boolean;
  onStart: () => void;
  onStop: () => void;
  addLog: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void;
}

export const TaskConfigPanel: React.FC<TaskConfigPanelProps> = ({ 
  config, 
  setConfig, 
  isRunning, 
  onStart, 
  onStop,
  addLog 
}) => {
  const [linksInput, setLinksInput] = useState(config.targetLinks.join('\n'));
  const [quotesInput, setQuotesInput] = useState(config.quoteTexts.join('\n'));
  const [isGenerating, setIsGenerating] = useState(false);
  const [aiContext, setAiContext] = useState('');

  const handleLinksChange = (val: string) => {
    setLinksInput(val);
    setConfig(prev => ({
      ...prev,
      targetLinks: val.split('\n').map(s => s.trim()).filter(Boolean)
    }));
  };

  const handleQuotesChange = (val: string) => {
    setQuotesInput(val);
    setConfig(prev => ({
      ...prev,
      quoteTexts: val.split('\n').map(s => s.trim()).filter(Boolean)
    }));
  };

  const handleGenerateAI = async () => {
    if (!aiContext) {
      addLog('AI üretimi için lütfen bir konu veya bağlam girin.', 'error');
      return;
    }
    
    setIsGenerating(true);
    addLog(`AI Metin üretimi başlatıldı: ${aiContext}`, 'info');

    try {
        const generated = await generateQuoteTexts(aiContext, 10);
        const newText = quotesInput + (quotesInput ? '\n' : '') + generated.join('\n');
        setQuotesInput(newText);
        setConfig(prev => ({
            ...prev,
            quoteTexts: newText.split('\n').map(s => s.trim()).filter(Boolean)
        }));
        addLog(`${generated.length} adet yeni alıntı metni üretildi.`, 'success');
        setAiContext(''); // Clear context input
    } catch (e) {
        addLog('AI servisine bağlanılamadı veya bir hata oluştu.', 'error');
    } finally {
        setIsGenerating(false);
    }
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 shadow-lg flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex justify-between items-center border-b border-slate-700 pb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Settings size={20} className="text-purple-400" />
          Görev Yapılandırması
        </h2>
        {isRunning ? (
             <button 
             onClick={onStop}
             className="bg-red-500/10 text-red-400 border border-red-500/50 hover:bg-red-500/20 px-4 py-2 rounded-lg flex items-center gap-2 transition-all font-bold animate-pulse"
           >
             <Square size={18} fill="currentColor" />
             DURDUR
           </button>
        ) : (
            <button 
            onClick={onStart}
            className="bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg flex items-center gap-2 transition-all font-bold shadow-lg shadow-green-900/20"
          >
            <Play size={18} fill="currentColor" />
            BAŞLAT
          </button>
        )}
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-full">
        
        {/* Left: Targets */}
        <div className="flex flex-col gap-2">
            <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                <LinkIcon size={16} className="text-blue-400"/>
                Hedef Tweet Linkleri
            </label>
            <textarea
                value={linksInput}
                onChange={(e) => handleLinksChange(e.target.value)}
                disabled={isRunning}
                placeholder="https://twitter.com/user/status/123...&#10;https://x.com/user/status/456..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-purple-500 resize-none min-h-[150px]"
            />
            <div className="text-xs text-slate-500 text-right">
                {config.targetLinks.length} Link algılandı
            </div>
        </div>

        {/* Right: Texts & AI */}
        <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center">
                <label className="text-sm font-medium text-slate-300 flex items-center gap-2">
                    <MessageSquareQuote size={16} className="text-yellow-400"/>
                    Alıntı Metinleri (Sıralı)
                </label>
            </div>
            
            <textarea
                value={quotesInput}
                onChange={(e) => handleQuotesChange(e.target.value)}
                disabled={isRunning}
                placeholder="Harika bir tespit!&#10;Buna kesinlikle katılmıyorum.&#10;Çok doğru..."
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-purple-500 resize-none min-h-[150px]"
            />
            
            {/* AI Generator Mini-Section */}
            <div className="bg-slate-700/30 p-2 rounded-lg border border-slate-700 flex gap-2 items-center">
                <input 
                    type="text" 
                    value={aiContext}
                    onChange={e => setAiContext(e.target.value)}
                    placeholder="Konu girin (örn: Ekonomi, Futbol)"
                    className="flex-1 bg-slate-900 border-none rounded px-3 py-1.5 text-xs text-white focus:ring-1 focus:ring-purple-500"
                    onKeyDown={(e) => e.key === 'Enter' && handleGenerateAI()}
                />
                <button 
                    onClick={handleGenerateAI}
                    disabled={isGenerating || !process.env.API_KEY}
                    className="bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white px-3 py-1.5 rounded text-xs font-medium flex items-center gap-1 transition-colors whitespace-nowrap"
                >
                    {isGenerating ? <Loader2 size={12} className="animate-spin" /> : <Wand2 size={12} />}
                    AI Üret
                </button>
            </div>
            <div className="text-xs text-slate-500 text-right">
                {config.quoteTexts.length} Metin yüklendi
            </div>
        </div>
      </div>

      {/* Settings Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-slate-700">
        <div>
            <label className="block text-xs text-slate-400 mb-1">Tweet Başına İşlem</label>
            <input 
                type="number" 
                min="1"
                value={config.quantityPerLink}
                onChange={(e) => setConfig({...config, quantityPerLink: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
            />
        </div>
        <div>
            <label className="block text-xs text-slate-400 mb-1">Min. Bekleme (sn)</label>
            <input 
                type="number" 
                min="1"
                value={config.delayMin}
                onChange={(e) => setConfig({...config, delayMin: parseInt(e.target.value) || 1})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
            />
        </div>
        <div>
            <label className="block text-xs text-slate-400 mb-1">Max. Bekleme (sn)</label>
            <input 
                type="number" 
                min="1"
                value={config.delayMax}
                onChange={(e) => setConfig({...config, delayMax: parseInt(e.target.value) || 2})}
                className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm text-white"
            />
        </div>
        <div className="flex items-end pb-1">
             <span className="text-xs text-slate-500 italic">
                *İşlemler "Simülasyon" modundadır.
             </span>
        </div>
      </div>
    </div>
  );
};