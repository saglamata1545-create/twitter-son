import React, { useState } from 'react';
import { Account, AccountStatus } from '../types';
import { UserPlus, Trash2, CheckCircle, AlertCircle, ShieldCheck } from 'lucide-react';

interface AccountManagerProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  addLog: (message: string, type: 'info' | 'success' | 'error' | 'warning') => void;
}

export const AccountManager: React.FC<AccountManagerProps> = ({ accounts, setAccounts, addLog }) => {
  const [inputText, setInputText] = useState('');

  const parseAndAddAccounts = () => {
    const lines = inputText.split('\n');
    const newAccounts: Account[] = [];

    lines.forEach(line => {
      const trimmed = line.trim();
      if (!trimmed) return;

      // Formatlar:
      // user:pass:email:cookie (Önerilen)
      
      const parts = trimmed.split(':');
      
      let username = '';
      let password = '';
      let email = undefined;
      let cookie = undefined;

      if (parts.length >= 4) {
          username = parts[0];
          password = parts[1];
          email = parts[2];
          // 3. indexten sonrasını cookie (auth_token) olarak al
          cookie = parts.slice(3).join(':'); 
      } else if (parts.length === 2) {
          username = parts[0];
          password = parts[1];
      }

      if (username) {
        newAccounts.push({
          id: Math.random().toString(36).substr(2, 9),
          username: username,
          password: password,
          email: email,
          cookie: cookie,
          status: cookie ? AccountStatus.IDLE : AccountStatus.IDLE
        });
      }
    });

    if (newAccounts.length > 0) {
      setAccounts(prev => [...prev, ...newAccounts]);
      setInputText('');
      addLog(`${newAccounts.length} adet hesap eklendi.`, 'success');
    } else {
      addLog('Geçersiz format. Lütfen kullanıcı:şifre:mail:cookie formatını kullanın.', 'error');
    }
  };

  const removeAccount = (id: string) => {
    setAccounts(prev => prev.filter(acc => acc.id !== id));
  };

  const clearAll = () => {
    if(window.confirm('Tüm hesapları silmek istediğinize emin misiniz?')) {
        setAccounts([]);
        addLog('Tüm hesaplar temizlendi.', 'warning');
    }
  };

  const checkAccounts = () => {
    // Görsel kontrol (Backend bağlantısı yapılabilir ama şimdilik manuel tetikleme yeterli)
    setAccounts(prev => prev.map(acc => ({ 
        ...acc, 
        status: acc.cookie ? AccountStatus.ACTIVE : AccountStatus.IDLE 
    })));
    addLog('Hesap durumları güncellendi.', 'info');
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserPlus size={20} className="text-blue-400" />
          Hesaplar
        </h2>
        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
          Toplam: {accounts.length}
        </span>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Hesap Listesi
          <br />
          <span className="text-xs text-slate-500 font-mono">Format: k_adi:sifre:mail:auth_token</span>
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
          placeholder="ahmet:1234:a@g.com:a8f5c..."
        />
        <div className="flex gap-2 mt-2">
          <button 
            onClick={parseAndAddAccounts}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Ekle
          </button>
          <button 
            onClick={checkAccounts}
            className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <ShieldCheck size={16} />
            Durum
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2 max-h-[300px]">
        {accounts.length === 0 && (
            <div className="text-center text-slate-600 text-sm py-8">
                Hesap yok.
            </div>
        )}
        {accounts.map(acc => (
          <div key={acc.id} className="flex items-center justify-between bg-slate-750 p-2 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                    acc.status === AccountStatus.ACTIVE ? 'bg-green-500' :
                    acc.status === AccountStatus.ERROR ? 'bg-red-500' :
                    'bg-slate-500'
                }`} />
                <div className="flex flex-col truncate max-w-[150px]">
                    <span className="text-sm font-medium text-slate-200 truncate">{acc.username}</span>
                    <div className="flex gap-2 text-[10px] text-slate-500">
                        {acc.cookie ? <span className="text-blue-400 font-bold">Cookie OK</span> : <span>Pass Login</span>}
                    </div>
                </div>
            </div>
            <button 
              onClick={() => removeAccount(acc.id)}
              className="text-slate-500 hover:text-red-400 p-1 transition-colors"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ))}
      </div>

      {accounts.length > 0 && (
         <button 
         onClick={clearAll}
         className="mt-4 text-xs text-red-400 hover:text-red-300 w-full text-center hover:underline"
       >
         Temizle
       </button>
      )}
    </div>
  );
};