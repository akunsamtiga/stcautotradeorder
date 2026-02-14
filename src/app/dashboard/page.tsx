// PATH: app/dashboard/page.tsx
'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import { ChartCard } from '@/components/ChartCard';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  DollarSign,
  Clock,
  Activity,
  Settings,
  Plus,
  Trash2,
  Play,
  Pause,
  Square,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  Target,
  Zap,
  CheckCircle,
  XCircle,
  Info,
  X,
  Calendar
} from 'lucide-react';

// ============================================================================
// INJECT PROFESSIONAL STYLES - MATCH LANDING PAGE
// ============================================================================
const injectDashboardStyles = () => {
  if (typeof document === 'undefined') return;
  
  const styleId = 'dashboard-professional-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }
    
    @keyframes blob {
      0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
      50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    .floating {
      animation: float 6s ease-in-out infinite;
    }
    
    .blob-decoration {
      animation: blob 8s ease-in-out infinite;
    }
    
    .dashboard-card {
      background: linear-gradient(135deg, #1A1D23 0%, #22252B 100%);
      border: 1px solid rgba(16, 185, 129, 0.2);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .dashboard-card:hover {
      border-color: rgba(16, 185, 129, 0.4);
      box-shadow: 0 8px 30px rgba(16, 185, 129, 0.15), 0 0 40px rgba(16, 185, 129, 0.05);
      transform: translateY(-4px) scale(1.01);
    }
  `;
  document.head.appendChild(style);
};

// ============================================================================
// BANNER IMAGE COMPONENT
// ============================================================================
interface BannerImageProps {
  src: string;
  alt?: string;
}
const BannerImage: React.FC<BannerImageProps> = ({ src, alt = 'Banner' }) => {
  return (
    <div className="w-full mb-6 lg:mb-8">
      <div className="relative rounded-3xl overflow-hidden shadow-2xl border-2 border-emerald-500/30 hover:border-emerald-500/50 transition-all duration-500 hover:shadow-emerald-500/20">
        <img
          src={src}
          alt={alt}
          className="w-full h-auto object-cover"
        />
      </div>
    </div>
  );
};

// ============================================================================
// INTERFACES
// ============================================================================

interface OrderSettings {
  assetSymbol: string;
  assetName: string;
  accountType: 'demo' | 'real';
  duration: number;
  amount: number;
  schedules: { time: string; trend: 'buy' | 'sell' }[];
  martingaleSetting: {
    maxStep: number;
    multiplier: number;
  };
  stopLossProfit: {
    stopProfit?: number;
    stopLoss?: number;
  };
}

interface BotStatus {
  isRunning: boolean;
  isPaused: boolean;
  activeSchedules: number;
  nextExecutionTime?: string;
  lastExecutionTime?: string;
  currentProfit: number;
}

// ============================================================================
// STAT CARD COMPONENT
// ============================================================================
interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  subtitle?: string;
  isLoading?: boolean;
}

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon,
  trend = 'neutral',
  subtitle,
  isLoading = false,
}) => {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-emerald-400';
      case 'down': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="dashboard-card rounded-3xl p-5 sm:p-6">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 bg-emerald-500/15 rounded-2xl border border-emerald-500/30">
          <div className="text-emerald-400">
            {icon}
          </div>
        </div>
        {trend !== 'neutral' && (
          <div className={`text-xs font-medium px-3 py-1.5 rounded-full ${getTrendColor()} ${trend === 'up' ? 'bg-emerald-500/10 border border-emerald-500/30' : 'bg-red-500/10 border border-red-500/30'}`}>
            {trend === 'up' ? '↑' : '↓'}
          </div>
        )}
      </div>
      {isLoading ? (
        <div className="space-y-3">
          <div className="h-4 bg-gray-800 rounded-lg w-3/4 animate-pulse"></div>
          <div className="h-8 bg-gray-800 rounded-lg w-1/2 animate-pulse"></div>
        </div>
      ) : (
        <>
          <h3 className="text-xs sm:text-sm text-gray-400 mb-1">{title}</h3>
          <p className="text-2xl sm:text-3xl font-bold text-white mb-1">{value}</p>
          {subtitle && <p className="text-xs sm:text-sm text-gray-500">{subtitle}</p>}
        </>
      )}
    </div>
  );
};

// ============================================================================
// PROFIT CARD COMPONENT
// ============================================================================
interface ProfitCardProps {
  todayProfit: number;
  isLoading?: boolean;
}

const ProfitCard: React.FC<ProfitCardProps> = ({
  todayProfit,
  isLoading = false,
}) => {
  const isProfit = todayProfit >= 0;
  return (
    <div className="dashboard-card rounded-3xl border-2 border-emerald-500/30 overflow-hidden">
      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <div className="w-10 h-10 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
        </div>
      ) : (
        <div className="text-center py-8 px-6">
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="p-2 bg-emerald-500/15 rounded-full border border-emerald-500/30">
              <DollarSign className="w-5 h-5 text-emerald-400" />
            </div>
            <h2 className="text-sm font-semibold text-gray-300 tracking-wide">
              Profit Hari Ini
            </h2>
          </div>
          <div className={`text-5xl sm:text-6xl font-bold ${isProfit ? 'text-emerald-400' : 'text-red-400'} transition-all duration-200 tracking-tight mb-2`}>
            {isProfit ? '+' : ''}Rp {Math.abs(todayProfit).toLocaleString('id-ID')}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// REALTIME CLOCK COMPONENT
// ============================================================================
const RealtimeClockCard: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    setCurrentTime(new Date());
    
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getTimezone = () => {
    const offset = -currentTime.getTimezoneOffset() / 60;
    return `UTC${offset >= 0 ? '+' : ''}${offset}`;
  };

  if (!isMounted) {
    return (
      <div className="dashboard-card rounded-3xl p-6">
        <div className="w-full border-2 border-emerald-500/30 rounded-2xl overflow-hidden p-3">
          <div className="px-4 py-3 bg-emerald-500/15 border-2 border-emerald-500/30 rounded-2xl mb-3">
            <div className="font-mono text-3xl font-bold text-emerald-400 text-center tracking-wide">
              --:--:--
            </div>
          </div>
          <div className="px-4 py-2 bg-emerald-500/10 flex items-center justify-between rounded-xl">
            <span className="text-emerald-400/80 text-xs font-medium">UTC</span>
            <div className="flex items-center gap-1">
              <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
              <span className="text-emerald-400 text-xs font-semibold">Live</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="dashboard-card rounded-3xl p-6">
      <div className="w-full border-2 border-emerald-500/30 rounded-2xl overflow-hidden p-3">
        <div className="px-4 py-3 bg-emerald-500/15 border-2 border-emerald-500/30 rounded-2xl mb-3">
          <div 
            className="font-mono text-3xl font-bold text-emerald-400 text-center tracking-wide"
            suppressHydrationWarning
          >
            {formatTime(currentTime)}
          </div>
        </div>
        
        <div className="px-4 py-2 bg-emerald-500/10 flex items-center justify-between rounded-xl">
          <span className="text-emerald-400/80 text-xs font-medium" suppressHydrationWarning>
            {getTimezone()}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
            <span className="text-emerald-400 text-xs font-semibold">Live</span>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// TOGGLE SWITCH COMPONENT
// ============================================================================
interface ToggleSwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
  disabled?: boolean;
}

const ToggleSwitch: React.FC<ToggleSwitchProps> = ({
  checked,
  onChange,
  label,
  description,
  disabled = false,
}) => {
  return (
    <div className="flex items-center justify-between p-4 bg-[#1a1a1a] rounded-xl border border-emerald-500/20 transition-all duration-300 hover:border-emerald-500/40">
      <div>
        <span className="text-sm font-medium text-gray-200">{label}</span>
        {description && <p className="text-xs text-gray-500 mt-1">{description}</p>}
      </div>
      <label className="relative inline-flex items-center cursor-pointer">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
        />
        <div
          className={`w-12 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-emerald-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${checked ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gray-700'} ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} transition-all duration-200`}
        ></div>
      </label>
    </div>
  );
};

// ============================================================================
// BULK SCHEDULE MODAL COMPONENT
// ============================================================================
interface BulkScheduleModalProps {
  isOpen: boolean;
  onClose: () => void;
  schedules: { time: string; trend: 'buy' | 'sell' }[];
  onAddSchedules: (schedules: { time: string; trend: 'buy' | 'sell' }[]) => void;
  onRemoveSchedule: (index: number) => void;
  onClearAll: () => void;
  maxCount?: number;
}

const BulkScheduleModal: React.FC<BulkScheduleModalProps> = ({
  isOpen,
  onClose,
  schedules,
  onAddSchedules,
  onRemoveSchedule,
  onClearAll,
  maxCount = 50,
}) => {
  const [bulkInput, setBulkInput] = useState('');
  const [error, setError] = useState('');

  if (!isOpen) return null;

  const parseTime = (timeStr: string): string | null => {
    timeStr = timeStr.trim();
    
    let match = timeStr.match(/^(\d{1,2})[:\.](\d{1,2})$/);
    if (match) {
      const hours = parseInt(match[1]);
      const minutes = parseInt(match[2]);
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    match = timeStr.match(/^(\d{3,4})$/);
    if (match) {
      const numStr = match[1].padStart(4, '0');
      const hours = parseInt(numStr.substring(0, 2));
      const minutes = parseInt(numStr.substring(2, 4));
      
      if (hours >= 0 && hours <= 23 && minutes >= 0 && minutes <= 59) {
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
      }
    }
    
    return null;
  };

  const parseTrend = (trendStr: string): 'buy' | 'sell' | null => {
    const normalized = trendStr.toLowerCase().trim();
    
    if (normalized === 'buy' || normalized === 'b') {
      return 'buy';
    }
    if (normalized === 'sell' || normalized === 's') {
      return 'sell';
    }
    
    return null;
  };

  const handleBulkAdd = () => {
    setError('');
    
    if (!bulkInput.trim()) {
      setError('Input tidak boleh kosong');
      return;
    }

    const lines = bulkInput.trim().split('\n');
    const newSchedules: { time: string; trend: 'buy' | 'sell' }[] = [];
    const errors: string[] = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      const parts = line.split(/[\s,\t\-]+/).filter(p => p);
      
      if (parts.length < 2) {
        errors.push(`Baris ${i + 1}: Format tidak lengkap. Contoh: "12:12 buy" atau "12.12 s"`);
        continue;
      }

      const time = parseTime(parts[0]);
      if (!time) {
        errors.push(`Baris ${i + 1}: Format waktu salah "${parts[0]}". Gunakan: HH:MM, HH.MM, atau HHMM`);
        continue;
      }

      const trend = parseTrend(parts[1]);
      if (!trend) {
        errors.push(`Baris ${i + 1}: Trend salah "${parts[1]}". Gunakan: buy/b atau sell/s`);
        continue;
      }

      const isDuplicate = newSchedules.some(s => s.time === time);
      if (isDuplicate) {
        errors.push(`Baris ${i + 1}: Waktu ${time} sudah ada dalam input ini`);
        continue;
      }

      const isDuplicateExisting = schedules.some(s => s.time === time);
      if (isDuplicateExisting) {
        errors.push(`Baris ${i + 1}: Waktu ${time} sudah ada dalam jadwal`);
        continue;
      }

      newSchedules.push({ time, trend });
    }

    if (errors.length > 0) {
      setError(errors.join('\n'));
      return;
    }

    if (schedules.length + newSchedules.length > maxCount) {
      setError(`Maksimal ${maxCount} jadwal. Saat ini: ${schedules.length}, akan ditambah: ${newSchedules.length}`);
      return;
    }

    if (newSchedules.length > 0) {
      onAddSchedules(newSchedules);
      setBulkInput('');
      setError('');
    } else {
      setError('Tidak ada jadwal valid yang ditemukan');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('Hapus semua jadwal?')) {
      onClearAll();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div 
        className="fixed inset-0 bg-black bg-opacity-75 transition-opacity"
        onClick={onClose}
      ></div>

      <div className="flex items-center justify-center min-h-screen p-4">
        <div className="relative dashboard-card rounded-3xl border-2 border-emerald-500/30 shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
          <div className="flex items-center justify-between px-6 py-5 border-b border-emerald-500/20">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-500/15 rounded-2xl border border-emerald-500/30">
                <Clock className="w-6 h-6 text-emerald-400" />
              </div>
              <h2 className="text-xl font-bold text-gray-100">Input Jadwal Trading Massal</h2>
            </div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 transition-colors p-2 hover:bg-gray-800 rounded-2xl">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
            <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl">
              <div className="flex items-start gap-3">
                <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-200 space-y-1">
                  <p className="font-semibold">Format Input Fleksibel:</p>
                  <ul className="list-disc list-inside space-y-1 text-blue-300/90">
                    <li>Waktu: <code className="bg-blue-900/30 px-1.5 py-0.5 rounded">12:12</code>, <code className="bg-blue-900/30 px-1.5 py-0.5 rounded">12.12</code>, atau <code className="bg-blue-900/30 px-1.5 py-0.5 rounded">1212</code></li>
                    <li>Trend: <code className="bg-blue-900/30 px-1.5 py-0.5 rounded">buy/b</code> atau <code className="bg-blue-900/30 px-1.5 py-0.5 rounded">sell/s</code></li>
                    <li>Contoh: <code className="bg-blue-900/30 px-1.5 py-0.5 rounded">09:30 buy</code>, <code className="bg-blue-900/30 px-1.5 py-0.5 rounded">14.15 s</code>, <code className="bg-blue-900/30 px-1.5 py-0.5 rounded">1600 sell</code></li>
                  </ul>
                </div>
              </div>
            </div>

            {schedules.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-3 gap-2">
                  <h3 className="text-xs sm:text-sm font-semibold text-gray-200 flex items-center gap-1.5 sm:gap-2 min-w-0 flex-1">
                    <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400 flex-shrink-0" />
                    <span className="truncate">Jadwal ({schedules.length}/{maxCount})</span>
                  </h3>
                  <button onClick={handleClearAll} className="text-[10px] sm:text-xs text-red-400 hover:text-red-300 transition-colors flex items-center gap-1 flex-shrink-0 px-2 py-1 hover:bg-red-500/10 rounded-lg">
                    <Trash2 className="w-3 h-3" />
                    <span className="hidden xs:inline">Hapus</span>
                  </button>
                </div>
                <div className="h-40 sm:h-48 overflow-y-auto space-y-1.5 sm:space-y-2 custom-scrollbar pr-1 sm:pr-2 bg-[#0f0f0f] rounded-xl p-2 border border-emerald-500/10">
                  {schedules.map((schedule, index) => (
                    <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-[#1a1a1a] rounded-xl border border-emerald-500/10 hover:border-emerald-500/20 transition-all gap-1.5 sm:gap-2">
                      <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-[10px] sm:text-sm border border-emerald-500/20 flex-shrink-0">
                          {index + 1}
                        </div>
                        <span className="text-xs sm:text-sm font-medium text-gray-100 font-mono min-w-[42px] sm:min-w-[45px] flex-shrink-0">{schedule.time}</span>
                        {schedule.trend === 'buy' ? (
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                            <TrendingUp className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden xs:inline">BUY</span>
                            <span className="xs:hidden">B</span>
                          </span>
                        ) : (
                          <span className="px-1.5 sm:px-2 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 flex items-center gap-0.5 sm:gap-1 flex-shrink-0">
                            <TrendingDown className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                            <span className="hidden xs:inline">SELL</span>
                            <span className="xs:hidden">S</span>
                          </span>
                        )}
                      </div>
                      <button onClick={() => onRemoveSchedule(index)} className="text-red-400 hover:text-red-300 transition-colors flex-shrink-0 p-1 hover:bg-red-500/10 rounded-lg">
                        <X className="w-3.5 h-3.5 sm:w-5 sm:h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Input Massal (satu jadwal per baris)
              </label>
              <textarea
                value={bulkInput}
                onChange={(e) => setBulkInput(e.target.value)}
                placeholder="09:00 buy&#10;09:30 sell&#10;10.00 b&#10;1030 s&#10;11:00 buy"
                className="w-full px-4 py-3 text-sm bg-[#1a1a1a] text-gray-100 border border-emerald-500/20 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 resize-none font-mono transition-all duration-200"
                rows={8}
              />
              <p className="mt-2 text-xs text-gray-400">
                Masukkan satu jadwal per baris. Gunakan format fleksibel seperti contoh di atas.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
                  <div className="text-xs text-red-300 whitespace-pre-line">{error}</div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleBulkAdd}
                disabled={!bulkInput.trim() || schedules.length >= maxCount}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 active:from-emerald-800 active:to-emerald-700 disabled:from-gray-700 disabled:to-gray-700 disabled:cursor-not-allowed transition-all duration-200 font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:shadow-none hover:scale-105"
              >
                <Plus className="w-5 h-5" />
                Tambah Jadwal
              </button>
              <button onClick={onClose} className="px-6 py-3 bg-gray-700 text-gray-200 rounded-xl hover:bg-gray-600 transition-all duration-200 font-medium hover:scale-105">
                Tutup
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// SCHEDULE BUTTON COMPONENT
// ============================================================================
interface ScheduleButtonProps {
  schedules: { time: string; trend: 'buy' | 'sell' }[];
  onOpenModal: () => void;
  isDisabled?: boolean;
  maxCount?: number;
}

const ScheduleButton: React.FC<ScheduleButtonProps> = ({
  schedules,
  onOpenModal,
  isDisabled = false,
  maxCount = 50,
}) => {
  return (
    <div className="dashboard-card rounded-3xl">
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-500/10 rounded-xl">
              <Clock className="w-5 h-5 text-emerald-400" />
            </div>
            <span className="text-sm font-semibold text-gray-100">Jadwal Trading</span>
          </div>
          <span className="text-xs text-gray-400 bg-[#1a1a1a] px-3 py-1.5 rounded-full border border-emerald-500/20">
            {schedules.length}/{maxCount}
          </span>
        </div>

        {schedules.length > 0 ? (
          <div className="h-40 sm:h-48 overflow-y-auto space-y-1.5 sm:space-y-2 mb-4 custom-scrollbar pr-1 sm:pr-2 bg-[#0f0f0f] rounded-xl p-2 border border-emerald-500/10">
            {schedules.map((schedule, index) => (
              <div key={index} className="flex items-center justify-between p-2 sm:p-3 bg-[#1a1a1a] rounded-xl border border-emerald-500/10 gap-1.5 sm:gap-2 hover:border-emerald-500/20 transition-all">
                <div className="flex items-center gap-1.5 sm:gap-3 min-w-0 flex-1">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-400 font-bold text-[10px] sm:text-sm border border-emerald-500/20 flex-shrink-0">
                    {index + 1}
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-100 font-mono min-w-[42px] sm:min-w-[45px] flex-shrink-0">{schedule.time}</span>
                  <span className={`px-1.5 sm:px-3 py-0.5 sm:py-1 rounded-lg text-[10px] sm:text-xs font-medium flex-shrink-0 ${
                    schedule.trend === 'buy'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : 'bg-red-500/10 text-red-400 border border-red-500/20'
                  }`}>
                    <span className="hidden xs:inline">{schedule.trend.toUpperCase()}</span>
                    <span className="xs:hidden">{schedule.trend === 'buy' ? 'B' : 'S'}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mb-4 p-6 bg-[#1a1a1a] rounded-xl border border-emerald-500/10 text-center">
            <Calendar className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Belum ada jadwal trading</p>
          </div>
        )}

        <button
          onClick={onOpenModal}
          disabled={isDisabled || schedules.length >= maxCount}
          className="w-full px-6 py-3 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 active:from-emerald-800 active:to-emerald-700 disabled:from-[#2a2a2a] disabled:to-[#2a2a2a] disabled:cursor-not-allowed transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:shadow-none hover:scale-105"
        >
          <Plus className="w-5 h-5" />
          {schedules.length === 0 ? 'Tambah Jadwal' : 'Kelola Jadwal'}
        </button>
      </div>
    </div>
  );
};

// ============================================================================
// ORDER SETTINGS CARD COMPONENT
// ============================================================================
const DURATION_OPTIONS = [
  { value: '60', label: '1 Menit' },
  { value: '120', label: '2 Menit' },
  { value: '300', label: '5 Menit' },
  { value: '600', label: '10 Menit' },
  { value: '900', label: '15 Menit' },
  { value: '1800', label: '30 Menit' },
  { value: '3600', label: '1 Jam' },
];

interface OrderSettingsCardProps {
  settings: OrderSettings;
  onChange: (settings: OrderSettings) => void;
  isDisabled?: boolean;
  assets?: any[];
  onAssetSelect?: (asset: any) => void;
}

const OrderSettingsCard: React.FC<OrderSettingsCardProps> = ({
  settings,
  onChange,
  isDisabled = false,
  assets = [],
  onAssetSelect,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMartingaleEnabled, setIsMartingaleEnabled] = useState(settings.martingaleSetting.maxStep > 0);

  useEffect(() => {
    setIsMartingaleEnabled(settings.martingaleSetting.maxStep > 0);
  }, [settings.martingaleSetting.maxStep]);

  const toggleMartingale = (enabled: boolean) => {
    if (enabled) {
      onChange({
        ...settings,
        martingaleSetting: {
          maxStep: 3,
          multiplier: 2.0,
        },
      });
    } else {
      onChange({
        ...settings,
        martingaleSetting: {
          maxStep: 0,
          multiplier: 1.0,
        },
      });
    }
    setIsMartingaleEnabled(enabled);
  };

  const updateNestedSetting = (parent: string, key: string, value: any) => {
    onChange({
      ...settings,
      [parent]: {
        ...(settings as any)[parent],
        [key]: value,
      },
    });
  };

  return (
    <div className="dashboard-card rounded-3xl">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 cursor-pointer border-b border-emerald-500/20 transition-all duration-200 hover:bg-[#1a1a1a] rounded-t-3xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30">
            <Settings className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-gray-100">
              Pengaturan Order
            </h2>
            <p className="text-xs text-gray-500 hidden sm:block">Konfigurasi trading Anda</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {settings.assetSymbol && (
            <span className="hidden sm:flex items-center gap-1 px-2 py-1 bg-emerald-500/10 text-emerald-400 rounded-lg text-xs border border-emerald-500/20">
              <CheckCircle className="w-3 h-3" />
              Ready
            </span>
          )}
          {isExpanded ? (
            <ChevronUp className="w-5 h-5 text-emerald-400 transition-transform duration-200" />
          ) : (
            <ChevronDown className="w-5 h-5 text-emerald-400 transition-transform duration-200" />
          )}
        </div>
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
          {/* Basic Settings Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-emerald-500 rounded-full"></div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Pengaturan Dasar
              </h3>
            </div>

            {/* Asset Selection */}
            <div className="bg-[#1a1a1a]/50 border border-emerald-500/10 rounded-xl p-3 sm:p-4 hover:border-emerald-500/20 transition-all">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-300 mb-2">
                <Target className="w-4 h-4 text-emerald-400" />
                Aset Trading
              </label>
              <select
                value={settings.assetSymbol}
                onChange={(e) => {
                  const selected = assets.find(asset => asset.symbol === e.target.value);
                  if (selected) {
                    const newSettings = {
                      ...settings,
                      assetSymbol: selected.symbol,
                      assetName: selected.name || selected.symbol,
                    };
                    onChange(newSettings);
                    if (onAssetSelect) {
                      onAssetSelect(selected);
                    }
                  }
                }}
                disabled={isDisabled}
                className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-[#0f0f0f] text-gray-100 border border-emerald-500/20 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 disabled:bg-[#151515] disabled:cursor-not-allowed appearance-none transition-all duration-200 font-medium"
              >
                <option value="">Pilih Aset Trading</option>
                {assets.length === 0 && (
                  <option value="" disabled>Memuat aset...</option>
                )}
                {assets.map(asset => (
                  <option key={asset.id} value={asset.symbol}>
                    {asset.name || asset.symbol}
                  </option>
                ))}
              </select>
              {settings.assetSymbol && (
                <div className="mt-2 flex items-center gap-1.5 text-xs text-emerald-400 bg-emerald-500/5 px-2 py-1.5 rounded-lg border border-emerald-500/10">
                  <CheckCircle className="w-3 h-3 flex-shrink-0" />
                  <span className="font-medium truncate">{settings.assetSymbol} - {settings.assetName}</span>
                </div>
              )}
            </div>

            {/* Account Type & Duration Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {/* Account Type */}
              <div className="bg-[#1a1a1a]/50 border border-emerald-500/10 rounded-xl p-3 sm:p-4 hover:border-emerald-500/20 transition-all">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                  Tipe Akun
                </label>
                <select
                  value={settings.accountType}
                  onChange={(e) => onChange({ ...settings, accountType: e.target.value as 'demo' | 'real' })}
                  disabled={isDisabled}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-[#0f0f0f] text-gray-100 border border-emerald-500/20 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 disabled:bg-[#151515] disabled:cursor-not-allowed appearance-none transition-all duration-200 font-medium"
                >
                  <option value="demo">🎮 Demo Account</option>
                  <option value="real">💰 Real Account</option>
                </select>
              </div>

              {/* Timeframe */}
              <div className="bg-[#1a1a1a]/50 border border-emerald-500/10 rounded-xl p-3 sm:p-4 hover:border-emerald-500/20 transition-all">
                <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-300 mb-2">
                  <Clock className="w-4 h-4 text-emerald-400" />
                  Timeframe
                </label>
                <select
                  value={settings.duration.toString()}
                  onChange={(e) => onChange({ ...settings, duration: parseInt(e.target.value) })}
                  disabled={isDisabled}
                  className="w-full px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-[#0f0f0f] text-gray-100 border border-emerald-500/20 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 disabled:bg-[#151515] disabled:cursor-not-allowed appearance-none transition-all duration-200 font-medium"
                >
                  {DURATION_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Amount */}
            <div className="bg-[#1a1a1a]/50 border border-emerald-500/10 rounded-xl p-3 sm:p-4 hover:border-emerald-500/20 transition-all">
              <label className="flex items-center gap-2 text-xs sm:text-sm font-medium text-gray-300 mb-2">
                <BarChart2 className="w-4 h-4 text-emerald-400" />
                Jumlah per Order
              </label>
              <div className="relative">
                <span className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 text-gray-400 text-xs sm:text-sm font-medium">
                  Rp
                </span>
                <input
                  type="number"
                  value={settings.amount}
                  onChange={(e) => onChange({ ...settings, amount: parseInt(e.target.value) || 0 })}
                  disabled={isDisabled}
                  min="1000"
                  step="1000"
                  placeholder="10000"
                  className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3 text-xs sm:text-sm bg-[#0f0f0f] text-gray-100 border border-emerald-500/20 rounded-xl focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 disabled:bg-[#151515] disabled:cursor-not-allowed transition-all duration-200 font-medium"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1.5 flex items-center gap-1">
                <Info className="w-3 h-3" />
                Minimum Rp 1.000
              </p>
            </div>
          </div>

          {/* Martingale Section */}
          <div className="border-t border-emerald-500/20 pt-4 sm:pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-orange-500 rounded-full"></div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Strategi Martingale
              </h3>
            </div>

            {/* Martingale Toggle */}
            <div className="bg-gradient-to-br from-orange-500/5 to-orange-500/0 border border-orange-500/20 rounded-xl p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 bg-orange-500/10 rounded-xl">
                    <Zap className="w-5 h-5 text-orange-400" />
                  </div>
                  <div>
                    <span className="text-sm font-semibold text-gray-200 block">Martingale</span>
                    <p className="text-xs text-gray-500">Gandakan amount setelah loss</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isMartingaleEnabled}
                    onChange={(e) => toggleMartingale(e.target.checked)}
                    disabled={isDisabled}
                    className="sr-only peer"
                  />
                  <div
                    className={`w-12 h-7 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-orange-500/30 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all ${isMartingaleEnabled ? 'bg-gradient-to-r from-orange-600 to-orange-500' : 'bg-gray-700'} ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'} transition-all duration-200`}
                  ></div>
                </label>
              </div>

              {isMartingaleEnabled && (
                <div className="mt-4 space-y-3 pt-4 border-t border-orange-500/20">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {/* Max Step */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-2">
                        <Target className="w-3.5 h-3.5 text-orange-400" />
                        Max Step
                      </label>
                      <input
                        type="number"
                        value={settings.martingaleSetting.maxStep}
                        onChange={(e) => updateNestedSetting('martingaleSetting', 'maxStep', parseInt(e.target.value) || 0)}
                        disabled={isDisabled}
                        min="1"
                        max="10"
                        className="w-full px-3 py-2.5 text-xs sm:text-sm bg-[#0f0f0f] text-gray-100 border border-orange-500/20 rounded-xl focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/30 disabled:bg-[#151515] disabled:cursor-not-allowed transition-all duration-200 font-medium"
                      />
                    </div>

                    {/* Multiplier */}
                    <div>
                      <label className="flex items-center gap-1.5 text-xs font-medium text-gray-300 mb-2">
                        <TrendingUp className="w-3.5 h-3.5 text-orange-400" />
                        Multiplier
                      </label>
                      <input
                        type="number"
                        value={settings.martingaleSetting.multiplier}
                        onChange={(e) => updateNestedSetting('martingaleSetting', 'multiplier', parseFloat(e.target.value) || 1)}
                        disabled={isDisabled}
                        min="1"
                        max="5"
                        step="0.1"
                        className="w-full px-3 py-2.5 text-xs sm:text-sm bg-[#0f0f0f] text-gray-100 border border-orange-500/20 rounded-xl focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/30 disabled:bg-[#151515] disabled:cursor-not-allowed transition-all duration-200 font-medium"
                      />
                    </div>
                  </div>

                  {/* Info Card */}
                  <div className="bg-orange-500/10 border border-orange-500/20 rounded-xl p-2.5 sm:p-3">
                    <p className="text-xs text-orange-300 flex items-start gap-2">
                      <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                      <span>
                        Strategi akan menggandakan amount sebesar <strong>{settings.martingaleSetting.multiplier}x</strong> setelah loss, 
                        maksimal <strong>{settings.martingaleSetting.maxStep} step</strong>.
                      </span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Stop Loss/Profit Section */}
          <div className="border-t border-emerald-500/20 pt-4 sm:pt-6 space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-1 h-5 bg-blue-500 rounded-full"></div>
              <h3 className="text-xs sm:text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Risk Management
              </h3>
            </div>

            <div className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 border border-blue-500/20 rounded-xl p-3 sm:p-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                {/* Stop Loss */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    <XCircle className="w-4 h-4 text-red-400" />
                    Stop Loss
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={settings.stopLossProfit.stopLoss || ''}
                      onChange={(e) => updateNestedSetting('stopLossProfit', 'stopLoss', e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={isDisabled}
                      placeholder="Opsional"
                      className="w-full pl-9 sm:pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-[#0f0f0f] text-gray-100 border border-blue-500/20 rounded-xl focus:ring-2 focus:ring-red-500/30 focus:border-red-500/30 disabled:bg-[#151515] disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    />
                  </div>
                </div>

                {/* Take Profit */}
                <div>
                  <label className="flex items-center gap-1.5 text-xs sm:text-sm font-medium text-gray-300 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-400" />
                    Take Profit
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs font-medium">
                      Rp
                    </span>
                    <input
                      type="number"
                      value={settings.stopLossProfit.stopProfit || ''}
                      onChange={(e) => updateNestedSetting('stopLossProfit', 'stopProfit', e.target.value ? parseInt(e.target.value) : undefined)}
                      disabled={isDisabled}
                      placeholder="Opsional"
                      className="w-full pl-9 sm:pl-10 pr-3 py-2.5 text-xs sm:text-sm bg-[#0f0f0f] text-gray-100 border border-blue-500/20 rounded-xl focus:ring-2 focus:ring-green-500/30 focus:border-green-500/30 disabled:bg-[#151515] disabled:cursor-not-allowed transition-all duration-200 font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Info */}
              <div className="mt-3 bg-blue-500/10 border border-blue-500/20 rounded-xl p-2.5">
                <p className="text-xs text-blue-300 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                  <span>Bot akan otomatis berhenti saat mencapai target profit atau loss yang ditentukan.</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// BOT CONTROL CARD COMPONENT - IMPROVED VERSION
// ============================================================================
interface BotControlCardProps {
  status: BotStatus;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  isLoading?: boolean;
  canStart?: boolean;
  errorMessage?: string;
}

const BotControlCard: React.FC<BotControlCardProps> = ({
  status,
  onStart,
  onPause,
  onStop,
  isLoading = false,
  canStart = false,
  errorMessage,
}) => {
  const [isExpanded, setIsExpanded] = useState(true);

  const getStatusConfig = () => {
    if (status.isRunning && !status.isPaused) {
      return {
        label: 'Bot Aktif',
        color: 'emerald',
        bgGradient: 'from-emerald-500/20 to-emerald-500/5',
        borderColor: 'border-emerald-500/40',
        textColor: 'text-emerald-400',
        icon: <Activity className="w-5 h-5" />,
        dotColor: 'bg-emerald-400',
      };
    } else if (status.isPaused) {
      return {
        label: 'Bot Dijeda',
        color: 'yellow',
        bgGradient: 'from-yellow-500/20 to-yellow-500/5',
        borderColor: 'border-yellow-500/40',
        textColor: 'text-yellow-400',
        icon: <Pause className="w-5 h-5" />,
        dotColor: 'bg-yellow-400',
      };
    } else {
      return {
        label: 'Bot Nonaktif',
        color: 'gray',
        bgGradient: 'from-gray-500/20 to-gray-500/5',
        borderColor: 'border-gray-500/40',
        textColor: 'text-gray-400',
        icon: <Square className="w-5 h-5" />,
        dotColor: 'bg-gray-400',
      };
    }
  };

  const statusConfig = getStatusConfig();

  return (
    <div className="dashboard-card rounded-3xl">
      {/* Header */}
      <div
        className="flex items-center justify-between px-4 sm:px-6 py-4 sm:py-5 cursor-pointer border-b border-emerald-500/20 transition-all duration-200 hover:bg-[#1a1a1a] rounded-t-3xl"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-2xl bg-emerald-500/15 flex items-center justify-center border border-emerald-500/30">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-semibold text-gray-100">
              Kontrol Bot
            </h2>
            <p className="text-xs text-gray-500 hidden sm:block">Kelola trading bot Anda</p>
          </div>
        </div>
        {isExpanded ? (
          <ChevronUp className="w-5 h-5 text-emerald-400 transition-transform duration-200" />
        ) : (
          <ChevronDown className="w-5 h-5 text-emerald-400 transition-transform duration-200" />
        )}
      </div>

      {isExpanded && (
        <div className="p-4 sm:p-6 space-y-5">
          {/* Status Card - Prominent */}
          <div className={`relative overflow-hidden bg-gradient-to-br ${statusConfig.bgGradient} border ${statusConfig.borderColor} rounded-2xl p-5 transition-all duration-300`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#0f0f0f] flex items-center justify-center border ${statusConfig.borderColor}`}>
                  <div className={statusConfig.textColor}>
                    {statusConfig.icon}
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Status Bot</p>
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 ${statusConfig.dotColor} rounded-full ${status.isRunning && !status.isPaused ? 'animate-pulse' : ''}`}></div>
                    <p className={`text-lg font-bold ${statusConfig.textColor}`}>
                      {statusConfig.label}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Jadwal Aktif */}
            <div className="bg-[#1a1a1a]/50 border border-emerald-500/10 rounded-xl p-3 sm:p-4 hover:border-emerald-500/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <Clock className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-gray-400">Jadwal Aktif</p>
              </div>
              <p className="text-xl sm:text-2xl font-bold text-emerald-400">
                {status.activeSchedules}
              </p>
            </div>

            {/* Current Profit */}
            <div className="bg-[#1a1a1a]/50 border border-emerald-500/10 rounded-xl p-3 sm:p-4 hover:border-emerald-500/20 transition-all">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="w-4 h-4 text-emerald-400" />
                <p className="text-xs text-gray-400">Profit Sesi</p>
              </div>
              <p className={`text-xl sm:text-2xl font-bold ${status.currentProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {status.currentProfit >= 0 ? '+' : ''}{status.currentProfit.toLocaleString('id-ID')}
              </p>
            </div>
          </div>

          {/* Execution Times */}
          {(status.nextExecutionTime || status.lastExecutionTime) && (
            <div className="space-y-2">
              {status.nextExecutionTime && (
                <div className="flex items-center justify-between p-3 bg-blue-500/5 border border-blue-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span className="text-xs sm:text-sm text-gray-300">Eksekusi Berikutnya</span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-blue-400">
                    {status.nextExecutionTime}
                  </span>
                </div>
              )}
              {status.lastExecutionTime && (
                <div className="flex items-center justify-between p-3 bg-purple-500/5 border border-purple-500/20 rounded-xl">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-purple-400" />
                    <span className="text-xs sm:text-sm text-gray-300">Eksekusi Terakhir</span>
                  </div>
                  <span className="text-xs sm:text-sm font-mono font-bold text-purple-400">
                    {status.lastExecutionTime}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Error Message */}
          {errorMessage && (
            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3 animate-pulse">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-300">{errorMessage}</p>
            </div>
          )}

          {/* Control Buttons */}
          <div className="space-y-3 pt-2">
            {!status.isRunning && (
              <button
                onClick={onStart}
                disabled={isLoading || !canStart}
                className="w-full group relative overflow-hidden flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-emerald-600 to-emerald-500 text-white rounded-xl hover:from-emerald-700 hover:to-emerald-600 active:from-emerald-800 active:to-emerald-700 disabled:from-[#2a2a2a] disabled:to-[#2a2a2a] disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 disabled:shadow-none touch-manipulation hover:scale-105"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>{status.isPaused ? 'Melanjutkan...' : 'Memulai...'}</span>
                  </>
                ) : (
                  <>
                    <Play className="w-5 h-5" />
                    <span>{status.isPaused ? 'Lanjutkan Bot' : 'Mulai Bot'}</span>
                  </>
                )}
              </button>
            )}
            
            {status.isRunning && !status.isPaused && (
              <button
                onClick={onPause}
                disabled={isLoading}
                className="w-full group relative overflow-hidden flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-yellow-600 to-yellow-500 text-white rounded-xl hover:from-yellow-700 hover:to-yellow-600 active:from-yellow-800 active:to-yellow-700 disabled:from-[#2a2a2a] disabled:to-[#2a2a2a] disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-lg shadow-yellow-500/20 hover:shadow-yellow-500/30 disabled:shadow-none touch-manipulation hover:scale-105"
              >
                <Pause className="w-5 h-5" />
                <span>Jeda Bot</span>
              </button>
            )}
            
            {status.isRunning && (
              <button
                onClick={onStop}
                disabled={isLoading}
                className="w-full group relative overflow-hidden flex items-center justify-center gap-2 px-6 py-4 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-xl hover:from-red-700 hover:to-red-600 active:from-red-800 active:to-red-700 disabled:from-[#2a2a2a] disabled:to-[#2a2a2a] disabled:cursor-not-allowed transition-all duration-200 font-semibold text-sm shadow-lg shadow-red-500/20 hover:shadow-red-500/30 disabled:shadow-none touch-manipulation hover:scale-105"
              >
                <Square className="w-5 h-5" />
                <span>Hentikan Bot</span>
              </button>
            )}
          </div>

          {/* Info Message */}
          {!canStart && !errorMessage && (
            <div className="p-4 bg-gradient-to-br from-yellow-500/10 to-orange-500/5 border border-yellow-500/20 rounded-xl flex items-start gap-3">
              <Info className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-300 mb-1">
                  Belum Siap
                </p>
                <p className="text-xs text-yellow-300/80">
                  Konfigurasi pengaturan dan tambahkan jadwal terlebih dahulu untuk memulai bot
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// MAIN DASHBOARD PAGE
// ============================================================================

export default function DashboardPage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated } = useAuthStore();
  const clearAuth = useAuthStore((state) => state.clearAuth);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [assets, setAssets] = useState<any[]>([]);
  const [selectedAsset, setSelectedAsset] = useState<any>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [orderSettings, setOrderSettings] = useState<OrderSettings>({
    assetSymbol: '',
    assetName: '',
    accountType: 'demo',
    duration: 60,
    amount: 10000,
    schedules: [],
    martingaleSetting: {
      maxStep: 0,
      multiplier: 2,
    },
    stopLossProfit: {},
  });

  const [botStatus, setBotStatus] = useState<BotStatus>({
    isRunning: false,
    isPaused: false,
    activeSchedules: 0,
    nextExecutionTime: undefined,
    lastExecutionTime: undefined,
    currentProfit: 0,
  });

  const [todayStats, setTodayStats] = useState({
    profit: 0,
    executions: 0,
    winRate: 0,
  });

  const [isActionLoading, setIsActionLoading] = useState(false);

  useEffect(() => {
    injectDashboardStyles();
  }, []);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.push('/');
      return;
    }
    loadData();
    loadAssets();
    const interval = setInterval(loadData, 30000);
    return () => clearInterval(interval);
  }, [hasHydrated, isAuthenticated, router]);

  const loadAssets = async () => {
    try {
      const assetsData = await api.getActiveAssets();
      setAssets(assetsData || []);
    } catch (err) {
      console.error('❌ Gagal memuat aset:', err);
      setAssets([]);
    }
  };

  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const schedulesData = await api.getOrderSchedules().catch(err => {
        console.error('Gagal memuat jadwal:', err);
        return [];
      });

      const active = schedulesData.find((s: any) => s.status === 'active' && s.isActive);
      setActiveSchedule(active || null);

      const activeSchedules = schedulesData.filter((s: any) => s.status === 'active').length;
      const pausedSchedules = schedulesData.filter((s: any) => s.status === 'paused').length;

      setBotStatus({
        isRunning: activeSchedules > 0,
        isPaused: pausedSchedules > 0 && activeSchedules === 0,
        activeSchedules: activeSchedules,
        nextExecutionTime: active ? getNextExecutionTime(active.schedules) : undefined,
        lastExecutionTime: active?.lastExecutedAt ? new Date(active.lastExecutedAt).toLocaleTimeString('id-ID') : undefined,
        currentProfit: schedulesData.reduce((sum: number, s: any) => sum + (s.currentProfit || 0), 0),
      });

      const todayStatsData = await api.getTodayStats();
      
      setTodayStats({
        profit: todayStatsData.profit,
        executions: todayStatsData.executions,
        winRate: todayStatsData.winRate,
      });

      if (active) {
        setOrderSettings({
          assetSymbol: active.assetSymbol,
          assetName: active.assetName || active.assetSymbol,
          accountType: active.accountType,
          duration: active.duration,
          amount: active.amount,
          schedules: active.schedules,
          martingaleSetting: active.martingaleSetting,
          stopLossProfit: active.stopLossProfit,
        });
      }
    } catch (error: any) {
      console.error('Gagal memuat data dashboard:', error);
      if (error?.response?.status === 401) {
        clearAuth();
        router.push('/');
        return;
      }
      setError('Gagal memuat beberapa data. Silakan refresh halaman.');
    } finally {
      setIsLoading(false);
    }
  };

  const getNextExecutionTime = (schedules: any[]) => {
    if (!schedules || schedules.length === 0) return undefined;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const futureTimes = schedules
      .map(s => {
        const [hours, minutes] = s.time.split(':').map(Number);
        return hours * 60 + minutes;
      })
      .filter(time => time > currentTime)
      .sort((a, b) => a - b);

    if (futureTimes.length > 0) {
      const nextTime = futureTimes[0];
      const hours = Math.floor(nextTime / 60);
      const minutes = nextTime % 60;
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    const firstTime = schedules[0].time;
    return `Besok ${firstTime}`;
  };

  const handleStartBot = async () => {
    setIsActionLoading(true);
    setError(null);

    try {
      const response = await api.createOrderSchedule({
        assetSymbol: orderSettings.assetSymbol,
        assetName: orderSettings.assetName,
        accountType: orderSettings.accountType,
        duration: orderSettings.duration,
        amount: orderSettings.amount,
        schedules: orderSettings.schedules,
        martingaleSetting: orderSettings.martingaleSetting,
        stopLossProfit: orderSettings.stopLossProfit,
      });

      if (response) {
        await loadData();
      }
    } catch (err: any) {
      console.error('❌ Gagal memulai bot:', err);
      setError(err.response?.data?.message || 'Gagal memulai bot. Silakan coba lagi.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handlePauseBot = async () => {
    if (!activeSchedule) return;

    setIsActionLoading(true);
    setError(null);

    try {
      await api.pauseOrderSchedule(activeSchedule.id);
      await loadData();
    } catch (err: any) {
      console.error('❌ Gagal menjeda bot:', err);
      setError(err.response?.data?.message || 'Gagal menjeda bot. Silakan coba lagi.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStopBot = async () => {
    if (!activeSchedule) return;

    if (!window.confirm('Apakah Anda yakin ingin menghentikan bot?')) {
      return;
    }

    setIsActionLoading(true);
    setError(null);

    try {
      await api.deleteOrderSchedule(activeSchedule.id);
      await loadData();
      
      setOrderSettings({
        assetSymbol: '',
        assetName: '',
        accountType: 'demo',
        duration: 60,
        amount: 10000,
        schedules: [],
        martingaleSetting: {
          maxStep: 0,
          multiplier: 2,
        },
        stopLossProfit: {},
      });
    } catch (err: any) {
      console.error('❌ Gagal menghentikan bot:', err);
      setError(err.response?.data?.message || 'Gagal menghentikan bot. Silakan coba lagi.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const canStartBot = !!(orderSettings.assetSymbol && orderSettings.schedules.length > 0);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0F0F0F] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin"></div>
          <p className="text-gray-500 text-sm">Memuat...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#161616] to-[#0F0F0F] pb-20">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(16, 185, 129, 0.05);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(16, 185, 129, 0.2);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(16, 185, 129, 0.3);
        }
        @media (min-width: 640px) {
          .custom-scrollbar::-webkit-scrollbar {
            width: 8px;
          }
        }
      `}</style>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10 relative">
        {/* Decorative Blobs */}
        <div className="absolute top-20 left-0 w-72 h-72 rounded-full opacity-20 blur-3xl blob-decoration pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
        }} />
        <div className="absolute top-40 right-0 w-96 h-96 rounded-full opacity-15 blur-3xl blob-decoration pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          animationDelay: '2s'
        }} />
        
        <BannerImage
          src="/header3.jpg"
          alt="Banner Bot Trading"
        />

        {error && (
          <div className="mb-6 bg-red-500/10 border border-red-500/20 rounded-2xl p-5 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-red-400 hover:text-red-300 text-2xl flex-shrink-0 transition-colors duration-200 p-1 hover:bg-red-500/10 rounded-lg"
            >
              ×
            </button>
          </div>
        )}

        {/* Desktop Layout (lg and up) */}
        <div className="hidden lg:grid grid-cols-12 gap-6">
          {/* Left Column - Main Content */}
          <div className="col-span-8 space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                title="Total Eksekusi"
                value={todayStats.executions}
                icon={<Activity className="w-5 h-5" />}
                trend="neutral"
                isLoading={isLoading}
              />
              <StatCard
                title="Win Rate"
                value={`${todayStats.winRate.toFixed(1)}%`}
                icon={<BarChart2 className="w-5 h-5" />}
                trend={todayStats.winRate > 50 ? 'up' : 'down'}
                isLoading={isLoading}
              />
              <RealtimeClockCard />
            </div>

            {/* Profit Card */}
            <ProfitCard
              todayProfit={todayStats.profit}
              isLoading={isLoading}
            />

            {/* Chart Card */}
            <div className="dashboard-card rounded-3xl p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-100 flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/15 rounded-xl border border-emerald-500/30">
                    <BarChart2 className="w-5 h-5 text-emerald-400" />
                  </div>
                  Grafik Langsung
                </h3>
              </div>
              <ChartCard
                assetSymbol={orderSettings.assetSymbol}
                height={300}
              />
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-400">
                  {orderSettings.assetSymbol && orderSettings.assetName 
                    ? `${orderSettings.assetSymbol} - ${orderSettings.assetName}`
                    : 'No asset selected'}
                </p>
              </div>
            </div>
          </div>

          {/* Right Column - Controls */}
          <div className="col-span-4 space-y-6">
            <ScheduleButton
              schedules={orderSettings.schedules}
              onOpenModal={() => setIsModalOpen(true)}
              isDisabled={botStatus.isRunning && !botStatus.isPaused}
              maxCount={10}
            />

            <OrderSettingsCard
              settings={orderSettings}
              onChange={setOrderSettings}
              isDisabled={botStatus.isRunning && !botStatus.isPaused}
              assets={assets}
              onAssetSelect={(asset) => {
                setSelectedAsset(asset);
              }}
            />

            <BotControlCard
              status={botStatus}
              onStart={handleStartBot}
              onPause={handlePauseBot}
              onStop={handleStopBot}
              isLoading={isActionLoading}
              canStart={canStartBot}
              errorMessage={error || undefined}
            />
          </div>
        </div>

        {/* Tablet Layout (md to lg) */}
        <div className="hidden md:grid lg:hidden grid-cols-2 gap-6">
          <div className="space-y-6">
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-3">
              <StatCard
                title="Eksekusi"
                value={todayStats.executions}
                icon={<Activity className="w-4 h-4" />}
                trend="neutral"
                isLoading={isLoading}
              />
              <StatCard
                title="Win Rate"
                value={`${todayStats.winRate.toFixed(1)}%`}
                icon={<BarChart2 className="w-4 h-4" />}
                trend={todayStats.winRate > 50 ? 'up' : 'down'}
                isLoading={isLoading}
              />
              <RealtimeClockCard />
            </div>

            <ProfitCard
              todayProfit={todayStats.profit}
              isLoading={isLoading}
            />

            <div className="dashboard-card rounded-3xl p-5">
              <div className="flex items-center justify-between mb-5">
                <h3 className="text-base font-semibold text-gray-100 flex items-center gap-2">
                  <div className="p-2 bg-emerald-500/15 rounded-xl border border-emerald-500/30">
                    <BarChart2 className="w-4 h-4 text-emerald-400" />
                  </div>
                  Grafik
                </h3>
              </div>
              <ChartCard
                assetSymbol={orderSettings.assetSymbol}
                height={250}
              />
              <div className="mt-3 text-center">
                <p className="text-sm text-gray-400">
                  {orderSettings.assetSymbol && orderSettings.assetName 
                    ? `${orderSettings.assetSymbol} - ${orderSettings.assetName}`
                    : 'No asset selected'}
                </p>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <ScheduleButton
              schedules={orderSettings.schedules}
              onOpenModal={() => setIsModalOpen(true)}
              isDisabled={botStatus.isRunning && !botStatus.isPaused}
              maxCount={10}
            />

            <OrderSettingsCard
              settings={orderSettings}
              onChange={setOrderSettings}
              isDisabled={botStatus.isRunning && !botStatus.isPaused}
              assets={assets}
              onAssetSelect={(asset) => setSelectedAsset(asset)}
            />

            <BotControlCard
              status={botStatus}
              onStart={handleStartBot}
              onPause={handlePauseBot}
              onStop={handleStopBot}
              isLoading={isActionLoading}
              canStart={canStartBot}
              errorMessage={error || undefined}
            />
          </div>
        </div>

        {/* Mobile Layout */}
        <div className="grid md:hidden gap-4">
          <ProfitCard
            todayProfit={todayStats.profit}
            isLoading={isLoading}
          />

          <div className="grid grid-cols-2 gap-3">
            <div className="dashboard-card rounded-3xl p-3">
              <div className="mb-3">
                <h2 className="text-[10px] font-semibold text-gray-100 flex items-center gap-1 mb-2">
                  <Clock className="w-3 h-3 text-emerald-400" />
                  <span>Waktu</span>
                </h2>
                <RealtimeClockDisplay />
              </div>
              <div className="border-t border-emerald-500/20 my-3"></div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-[10px] font-semibold text-gray-100 flex items-center gap-1">
                    <Activity className="w-3 h-3 text-emerald-400" />
                    Grafik
                  </h3>
                </div>
                <ChartCard
                  assetSymbol={orderSettings.assetSymbol}
                  height={100}
                />
                <div className="mt-2 text-center">
                  <p className="text-[9px] text-gray-400">
                    {orderSettings.assetSymbol && orderSettings.assetName 
                      ? `${orderSettings.assetSymbol} - ${orderSettings.assetName}`
                      : 'No asset selected'}
                  </p>
                </div>
              </div>
            </div>
            <div className="min-h-0">
              <ScheduleButton
                schedules={orderSettings.schedules}
                onOpenModal={() => setIsModalOpen(true)}
                isDisabled={botStatus.isRunning && !botStatus.isPaused}
                maxCount={10}
              />
            </div>
          </div>

          <OrderSettingsCard
            settings={orderSettings}
            onChange={setOrderSettings}
            isDisabled={botStatus.isRunning && !botStatus.isPaused}
            assets={assets}
            onAssetSelect={(asset) => setSelectedAsset(asset)}
          />

          <BotControlCard
            status={botStatus}
            onStart={handleStartBot}
            onPause={handlePauseBot}
            onStop={handleStopBot}
            isLoading={isActionLoading}
            canStart={canStartBot}
            errorMessage={error || undefined}
          />
        </div>
      </div>

      {/* Bulk Schedule Modal */}
      <BulkScheduleModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        schedules={orderSettings.schedules}
        onAddSchedules={(schedules) => {
          setOrderSettings({
            ...orderSettings,
            schedules: [...orderSettings.schedules, ...schedules],
          });
        }}
        onRemoveSchedule={(index) => {
          setOrderSettings({
            ...orderSettings,
            schedules: orderSettings.schedules.filter((_, i) => i !== index),
          });
        }}
        onClearAll={() => {
          setOrderSettings({
            ...orderSettings,
            schedules: [],
          });
        }}
        maxCount={10}
      />

      <BottomNav />
    </div>
  );
}

// ============================================================================
// REALTIME CLOCK DISPLAY (WITHOUT CARD WRAPPER)
// ============================================================================
const RealtimeClockDisplay: React.FC = () => {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  const getTimezone = () => {
    const offset = -currentTime.getTimezoneOffset() / 60;
    return `UTC${offset >= 0 ? '+' : ''}${offset}`;
  };

  return (
    <div className="w-full border-2 border-emerald-500/30 rounded-xl overflow-hidden p-2">
      <div className="px-3 py-2 bg-emerald-500/10 border-2 border-emerald-500/20 rounded-xl mb-2">
        <div className="font-mono text-xl font-bold text-emerald-400 text-center tracking-wide">
          {formatTime(currentTime)}
        </div>
      </div>
      
      <div className="px-3 py-1.5 bg-emerald-500/10 flex items-center justify-between rounded-xl">
        <span className="text-emerald-400/80 text-[10px] font-medium">{getTimezone()}</span>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse"></div>
          <span className="text-emerald-400 text-[10px] font-semibold">Live</span>
        </div>
      </div>
    </div>
  );
};