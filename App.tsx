import React, { useState, useEffect, useRef } from 'react';
import { Account, AccountStatus, LogEntry, TaskConfig } from './types';
import { AccountManager } from './components/AccountManager';
import { TaskConfigPanel } from './components/TaskConfigPanel';
import { BotConsole } from './components/BotConsole';
import { LayoutDashboard, Activity, Zap } from 'lucide-react';

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const [taskConfig, setTaskConfig] = useState<TaskConfig>({
    targetLinks: [],
    quoteTexts: [],
    quantityPerLink: 1,
    delayMin: 15, 
    delayMax: 60
  });

  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning', account?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      message,
      type,
      account
    }]);
  };

  const isRunningRef = useRef(isRunning);
  const accountsRef = useRef(accounts);
  const configRef = useRef(taskConfig);
  const processingRef = useRef(false);

  useEffect(() => {
    isRunningRef.current = isRunning;
  }, [isRunning]);

  useEffect(() => {
    accountsRef.current = accounts;
  }, [accounts]);

  useEffect(() => {
    configRef.current = taskConfig;
  }, [taskConfig]);

  const handleStart = () => {
    const activeAccounts = accounts.filter(a => a.status !== AccountStatus.BANNED && a.status !== AccountStatus.ERROR);
    
    if (activeAccounts.length === 0) {
      addLog('İşleme başlamak için en az bir hesap ekleyin.', 'error');
      return;
    }
    if (taskConfig.targetLinks.length === 0) {
      addLog('Hedef tweet linki girilmedi.', 'error');
      return;
    }
    if (taskConfig.quoteTexts.length === 0) {
      addLog('Alıntı metni bulunamadı.', 'error');
      return;
    }

    setIsRunning(true);
    addLog('Bot başlatıldı. Gerçek tarayıcı işlemleri sıraya alınıyor...', 'info');
    processQueue();
  };

  const handleStop = () => {
    setIsRunning(false);
    addLog('Durdurma komutu gönderildi. Mevcut işlem bitince duracak.', 'warning');
  };

  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    let linkIndex = 0;
    let textIndex = 0;
    let loopCountPerLink = 0;

    const API_URL = "http://localhost:8000/quote-tweet";

    while (isRunningRef.current) {
      const config = configRef.current;
      const validAccounts = accountsRef.current.filter(a => a.status !== AccountStatus.BANNED && a.status !== AccountStatus.ERROR);
      
      if (validAccounts.length === 0) {
        addLog('Kullanılabilir hesap kalmadı. İşlem durduruldu.', 'error');
        setIsRunning(false);
        break;
      }

      // Rastgele hesap seç
      const account = validAccounts[Math.floor(Math.random() * validAccounts.length)];
      
      const targetLink = config.targetLinks[linkIndex];
      const quoteText = config.quoteTexts[textIndex % config.quoteTexts.length];

      addLog(`İşlem başlatılıyor... (Cookie Girişli)`, 'info', account.username);
      
      try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                account: {
                    username: account.username,
                    password: account.password,
                    email: account.email,
                    cookie: account.cookie
                },
                tweetUrl: targetLink,
                quoteText: quoteText
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.detail || 'Sunucu hatası');
        }

        const result = await response.json();
        addLog(`BAŞARILI: ${result.message}`, 'success', account.username);
        
        // Başarılı işlem sonrası hesabı aktif olarak güncelle (görsel)
        setAccounts(prev => prev.map(a => a.id === account.id ? {...a, status: AccountStatus.ACTIVE} : a));

      } catch (error: any) {
          console.error(error);
          addLog(`HATA: ${error.message}`, 'error', account.username);
          setAccounts(prev => prev.map(a => a.id === account.id ? {...a, status: AccountStatus.ERROR} : a));
      }

      textIndex++;
      loopCountPerLink++;

      if (loopCountPerLink >= config.quantityPerLink) {
        loopCountPerLink = 0;
        linkIndex++;
        
        if (linkIndex >= config.targetLinks.length) {
          addLog('Tüm hedef linkler tamamlandı.', 'success');
          setIsRunning(false);
          break;
        }
      }

      if (isRunningRef.current) {
          const delay = Math.floor(Math.random() * (config.delayMax - config.delayMin + 1) + config.delayMin);
          addLog(`${delay} saniye bekleniyor... (Güvenlik Beklemesi)`, 'warning');
          await new Promise(r => setTimeout(r, delay * 1000));
      }
    }

    processingRef.current = false;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 h-[90vh]">
        
        <header className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <LayoutDashboard size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">X-Bot Pro <span className="text-blue-400">Otomasyon</span></h1>
                    <p className="text-xs text-slate-400">Playwright Destekli Gerçek Zamanlı Bot</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border transition-all ${isRunning ? 'bg-green-900/30 border-green-500/50' : 'bg-slate-900 border-slate-700'}`}>
                    <Activity size={14} className={isRunning ? "text-green-500 animate-pulse" : "text-slate-500"} />
                    <span className={`text-xs font-mono font-medium ${isRunning ? 'text-green-400' : 'text-slate-300'}`}>
                        DURUM: {isRunning ? 'ÇALIŞIYOR' : 'HAZIR'}
                    </span>
                </div>
            </div>
        </header>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          <div className="lg:col-span-3 h-full min-h-[400px]">
            <AccountManager accounts={accounts} setAccounts={setAccounts} addLog={addLog} />
          </div>

          <div className="lg:col-span-9 flex flex-col gap-6 h-full">
            <div className="flex-1 min-h-[400px]">
                <TaskConfigPanel 
                    config={taskConfig}
                    setConfig={setTaskConfig}
                    isRunning={isRunning}
                    onStart={handleStart}
                    onStop={handleStop}
                    addLog={addLog}
                />
            </div>

            <div className="h-[250px] shrink-0">
                <BotConsole logs={logs} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;