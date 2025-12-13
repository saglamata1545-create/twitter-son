import React, { useState, useEffect, useRef } from 'react';
import { Account, AccountStatus, LogEntry, TaskConfig } from './types';
import { AccountManager } from './components/AccountManager';
import { TaskConfigPanel } from './components/TaskConfigPanel';
import { BotConsole } from './components/BotConsole';
import { LayoutDashboard, Activity } from 'lucide-react';

const App: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  
  const [taskConfig, setTaskConfig] = useState<TaskConfig>({
    targetLinks: [],
    quoteTexts: [],
    quantityPerLink: 1,
    delayMin: 10, // Gerçek işlem için süreyi artırdık
    delayMax: 30
  });

  // Log ekleme yardımcısı
  const addLog = (message: string, type: 'info' | 'success' | 'error' | 'warning', account?: string) => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date(),
      message,
      type,
      account
    }]);
  };

  // Bot Logic State References
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
    const activeAccounts = accounts.filter(a => a.status === AccountStatus.ACTIVE || a.status === AccountStatus.IDLE);
    
    if (activeAccounts.length === 0) {
      addLog('İşleme başlamak için en az bir aktif hesap ekleyin.', 'error');
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
    addLog('Bot başlatıldı. Backend servisine bağlanılıyor...', 'info');
    processQueue();
  };

  const handleStop = () => {
    setIsRunning(false);
    addLog('Bot kullanıcı tarafından durduruldu.', 'warning');
  };

  const processQueue = async () => {
    if (processingRef.current) return;
    processingRef.current = true;

    let linkIndex = 0;
    let textIndex = 0;
    let loopCountPerLink = 0;

    // Backend URL
    const API_URL = "http://localhost:8000/quote-tweet";

    while (isRunningRef.current) {
      const config = configRef.current;
      const currentAccounts = accountsRef.current.filter(a => a.status !== AccountStatus.BANNED && a.status !== AccountStatus.ERROR);
      
      if (currentAccounts.length === 0) {
        addLog('Kullanılabilir hesap kalmadı.', 'error');
        setIsRunning(false);
        break;
      }

      // Rastgele hesap seç
      const account = currentAccounts[Math.floor(Math.random() * currentAccounts.length)];
      
      const targetLink = config.targetLinks[linkIndex];
      const quoteText = config.quoteTexts[textIndex % config.quoteTexts.length];

      addLog(`İşlem başlatılıyor... Hedef: ${targetLink.substring(targetLink.lastIndexOf('/') + 1)}`, 'info', account.username);
      
      try {
        // GERÇEK BACKEND İSTEĞİ
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
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
            throw new Error(errorData.detail || 'Backend hatası');
        }

        const result = await response.json();
        addLog(`BAŞARILI: ${result.message}`, 'success', account.username);

      } catch (error: any) {
          console.error(error);
          addLog(`HATA OLUŞTU: ${error.message}. Sunucu (server.py) çalışıyor mu?`, 'error', account.username);
          
          // Hata durumunda hesabı işaretleyebiliriz (İsteğe bağlı)
          // setAccounts(...)
      }

      // Döngü Mantığı
      textIndex++;
      loopCountPerLink++;

      if (loopCountPerLink >= config.quantityPerLink) {
        loopCountPerLink = 0;
        linkIndex++;
        
        if (linkIndex >= config.targetLinks.length) {
          addLog('Tüm linkler tamamlandı.', 'success');
          setIsRunning(false);
          break;
        }
      }

      // Bekleme Süresi (Rate limit yememek için önemli)
      if (isRunningRef.current) {
          const delay = Math.floor(Math.random() * (config.delayMax - config.delayMin + 1) + config.delayMin);
          addLog(`${delay} saniye bekleniyor...`, 'warning');
          await new Promise(r => setTimeout(r, delay * 1000));
      }
    }

    processingRef.current = false;
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col gap-6 h-[90vh]">
        
        {/* Top Header */}
        <header className="flex items-center justify-between bg-slate-800 p-4 rounded-xl border border-slate-700 shadow-lg">
            <div className="flex items-center gap-3">
                <div className="bg-blue-600 p-2 rounded-lg">
                    <LayoutDashboard size={24} className="text-white" />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">X-Bot Pro <span className="text-blue-400">Panel</span></h1>
                    <p className="text-xs text-slate-400">Otomatik Alıntı Tweet Yönetimi</p>
                </div>
            </div>
            
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 rounded-full border border-slate-700">
                    <Activity size={14} className={isRunning ? "text-green-500 animate-pulse" : "text-slate-500"} />
                    <span className="text-xs font-mono font-medium text-slate-300">
                        DURUM: {isRunning ? 'AKTİF (BACKEND)' : 'HAZIR'}
                    </span>
                </div>
            </div>
        </header>

        {/* Main Grid */}
        <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-0">
          
          {/* Left Column: Account Manager (3 cols) */}
          <div className="lg:col-span-3 h-full min-h-[400px]">
            <AccountManager 
                accounts={accounts} 
                setAccounts={setAccounts} 
                addLog={addLog}
            />
          </div>

          {/* Middle/Right Column: Config & Console (9 cols) */}
          <div className="lg:col-span-9 flex flex-col gap-6 h-full">
            {/* Top: Config Panel */}
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

            {/* Bottom: Logs */}
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