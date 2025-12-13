export enum AccountStatus {
  IDLE = 'Beklemede',
  CHECKING = 'Kontrol Ediliyor...',
  ACTIVE = 'Aktif',
  ERROR = 'Hata',
  BANNED = 'Askıya Alındı'
}

export interface Account {
  id: string;
  username: string;
  password?: string;
  email?: string;
  cookie?: string; // ct0 or auth_token simulation
  status: AccountStatus;
  lastAction?: string;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  type: 'info' | 'success' | 'error' | 'warning';
  account?: string;
}

export interface TaskConfig {
  targetLinks: string[];
  quoteTexts: string[];
  quantityPerLink: number; // How many quotes per link
  delayMin: number;
  delayMax: number;
}