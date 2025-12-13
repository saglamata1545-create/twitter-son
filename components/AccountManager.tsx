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

      // Formatları destekle:
      // user:pass
      // user:pass:email
      // user:pass:email:cookie
      const parts = trimmed.split(':');
      
      // Kullanıcı verileri
      let username = parts[0];
      let password = parts[1];
      let email = undefined;
      let cookie = undefined;

      if (parts.length === 3) {
        // user:pass:email
        email = parts[2];
      } else if (parts.length >= 4) {
        // user:pass:email:cookie
        email = parts[2];
        // Cookie bazen : içerebilir mi? Genelde auth_token hex string'dir, içermez.
        // Ama yine de kalan kısmı birleştirelim garanti olsun.
        cookie = parts.slice(3).join(':');
      }

      if (username && password) {
        newAccounts.push({
          id: Math.random().toString(36).substr(2, 9),
          username: username,
          password: password,
          email: email,
          cookie: cookie,
          status: AccountStatus.IDLE
        });
      }
    });

    if (newAccounts.length > 0) {
      setAccounts(prev => [...prev, ...newAccounts]);
      setInputText('');
      addLog(`${newAccounts.length} adet hesap başarıyla eklendi.`, 'success');
    } else {
      addLog('Geçerli formatta hesap bulunamadı (en az user:pass gerekli).', 'error');
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
    // Simülasyon: Hesapları kontrol ediyor gibi yap
    addLog('Hesap token/cookie kontrolleri başlatıldı (Simülasyon)...', 'info');
    setAccounts(prev => prev.map(acc => ({ ...acc, status: AccountStatus.CHECKING })));

    setTimeout(() => {
        setAccounts(prev => prev.map(acc => ({ 
            ...acc, 
            status: acc.cookie ? AccountStatus.ACTIVE : AccountStatus.IDLE // Cookie varsa direkt aktif say
        })));
        addLog('Kontroller tamamlandı. Cookie tanımlı hesaplar hazır.', 'success');
    }, 1500);
  };

  return (
    <div className="bg-slate-800 rounded-xl border border-slate-700 p-6 flex flex-col h-full shadow-lg">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <UserPlus size={20} className="text-blue-400" />
          Hesap Yöneticisi
        </h2>
        <span className="text-xs bg-slate-700 px-2 py-1 rounded text-slate-300">
          Toplam: {accounts.length}
        </span>
      </div>

      <div className="mb-4">
        <label className="block text-sm text-slate-400 mb-2">
          Hesap Listesi (Her satıra bir hesap)
          <br />
          <span className="text-xs text-slate-500">Format: user:pass:mail:cookie (auth_token)</span>
        </label>
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          className="w-full h-24 bg-slate-900 border border-slate-700 rounded-lg p-3 text-xs font-mono text-slate-300 focus:outline-none focus:border-blue-500 resize-none"
          placeholder="kullanici:sifre:mail:auth_token_kodu_buraya"
        />
        <div className="flex gap-2 mt-2">
          <button 
            onClick={parseAndAddAccounts}
            className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Listeye Ekle
          </button>
          <button 
            onClick={checkAccounts}
            className="px-4 bg-emerald-600 hover:bg-emerald-500 text-white py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
            title="Giriş Kontrolü Yap"
          >
            <ShieldCheck size={16} />
            Kontrol
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1 space-y-2 max-h-[300px]">
        {accounts.length === 0 && (
            <div className="text-center text-slate-600 text-sm py-8">
                Henüz hesap eklenmedi.
            </div>
        )}
        {accounts.map(acc => (
          <div key={acc.id} className="flex items-center justify-between bg-slate-750 p-2 rounded border border-slate-700/50 hover:border-slate-600 transition-colors">
            <div className="flex items-center gap-3 overflow-hidden">
                <div className={`w-2 h-2 rounded-full shrink-0 ${
                    acc.status === AccountStatus.ACTIVE ? 'bg-green-500' :
                    acc.status === AccountStatus.ERROR ? 'bg-red-500' :
                    acc.status === AccountStatus.CHECKING ? 'bg-yellow-500' : 'bg-slate-500'
                }`} />
                <div className="flex flex-col truncate">
                    <span className="text-sm font-medium text-slate-200 truncate">{acc.username}</span>
                    <span className="text-[10px] text-slate-500 truncate flex gap-1">
                        {acc.status}
                        {acc.cookie && <span className="text-blue-400 font-bold">• Cookie OK</span>}
                    </span>
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
         Tüm Listeyi Temizle
       </button>
      )}
    </div>
  );
};