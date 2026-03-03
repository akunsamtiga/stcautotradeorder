'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import { ChartCard } from '@/components/ChartCard';
import {
  Activity, AlertCircle, BarChart2, Calendar,
  ChevronDown, ChevronUp, Info, Plus,
  Settings, Trash2, X, Zap,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// DESIGN TOKENS (only used for dynamic/computed values)
// ═══════════════════════════════════════════════════════════════
const C = {
  bg:    '#050807',
  card:  '#111915',
  card2: '#141f1a',
  bdr:   'rgba(255,255,255,0.08)',
  bdrAct:'rgba(52,211,153,0.3)',
  cyan:  '#34d399',
  cyand: 'rgba(52,211,153,0.1)',
  coral: '#f87171',
  cord:  'rgba(248,113,113,0.1)',
  text:  '#f0faf6',
  sub:   'rgba(255,255,255,0.6)',
  muted: 'rgba(255,255,255,0.35)',
  faint: 'rgba(255,255,255,0.05)',
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface OrderSettings {
  assetSymbol: string; assetName: string;
  accountType: 'demo'|'real'; duration: number; amount: number;
  schedules: {time:string; trend:'buy'|'sell'}[];
  martingaleSetting: {maxStep:number; multiplier:number};
  stopLossProfit: {stopProfit?:number; stopLoss?:number};
}
interface BotStatus {
  isRunning:boolean; isPaused:boolean; activeSchedules:number;
  nextExecutionTime?:string; lastExecutionTime?:string; currentProfit:number;
}

// ═══════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════

const Skeleton: React.FC<{
  width?:string|number; height?:string|number;
  style?:React.CSSProperties; variant?:'shimmer'|'pulse';
}> = ({ width='100%', height=20, style, variant='pulse' }) => (
  <div
    className={variant === 'shimmer' ? 'animate-[shimmer_1.8s_ease_infinite]' : 'animate-[skeleton-pulse_1.8s_ease_infinite]'}
    style={{
      width, height,
      background: variant === 'shimmer'
        ? `linear-gradient(90deg, ${C.faint} 0%, rgba(255,255,255,0.06) 50%, ${C.faint} 100%)`
        : C.faint,
      backgroundSize: variant === 'shimmer' ? '200% 100%' : undefined,
      borderRadius: 4,
      ...style,
    }}
  />
);

const Card: React.FC<{
  children: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
}> = ({ children, style, className = '' }) => (
  <div
    className={`ds-card relative overflow-hidden rounded-[10px] shadow-[0_1px_3px_rgba(0,0,0,0.2)] ${className}`}
    style={{ background: C.card, border: `1px solid ${C.bdr}`, ...style }}
  >
    {children}
  </div>
);

const Divider = () => (
  <div className="h-px my-3" style={{ background: C.bdr }} />
);

/** Section label with trailing line */
const SL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="flex items-center gap-2 mb-2.5">
    <span className="text-[11px] font-medium tracking-[0.05em]" style={{ color: C.muted }}>
      {children}
    </span>
    <div className="flex-1 h-px" style={{ background: C.bdr }} />
  </div>
);

/** Field label */
const FL: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <label className="block text-[11px] font-medium mb-[5px]" style={{ color: C.muted }}>
    {children}
  </label>
);

const Toggle: React.FC<{ checked: boolean; onChange: (v: boolean) => void; disabled?: boolean }> =
({ checked, onChange, disabled = false }) => (
  <label className={`inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'}`}>
    <input
      type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)}
      disabled={disabled} className="absolute opacity-0 w-0 h-0"
    />
    <div
      className="w-11 h-[22px] rounded-[22px] relative transition-all duration-200"
      style={{
        background: checked ? 'rgba(52,211,153,0.2)' : 'rgba(255,255,255,0.06)',
        border: `1px solid ${checked ? 'rgba(52,211,153,0.5)' : 'rgba(255,255,255,0.12)'}`,
      }}
    >
      <div
        className="absolute top-0.5 w-4 h-4 rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.2)] transition-[left] duration-200"
        style={{
          left: checked ? 23 : 2,
          background: checked ? C.cyan : 'rgba(255,255,255,0.5)',
        }}
      />
    </div>
  </label>
);

// ═══════════════════════════════════════════════════════════════
// CLOCK — full
// ═══════════════════════════════════════════════════════════════
const RealtimeClock: React.FC = () => {
  const [time, setTime] = useState<Date|null>(null);
  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt  = (d: Date) => d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
  const fmtD = (d: Date) => d.toLocaleDateString('id-ID',  { weekday:'short', day:'2-digit', month:'short' });
  const tz   = () => {
    if (!time) return 'UTC';
    const o = -time.getTimezoneOffset() / 60;
    return `UTC${o >= 0 ? '+' : ''}${o}`;
  };

  return (
    <Card className="p-[14px_16px] h-full">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-medium" style={{ color: C.muted }}>Waktu Lokal</span>
        <span className="flex items-center gap-[5px]">
          <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: C.coral }} />
          <span className="text-[10px] font-semibold opacity-80" style={{ color: C.coral }}>Live</span>
        </span>
      </div>
      <p suppressHydrationWarning className="text-[26px] font-semibold tracking-[-0.01em] leading-none" style={{ color: C.text }}>
        {time ? fmt(time) : '--:--:--'}
      </p>
      <div className="flex justify-between mt-2">
        <span suppressHydrationWarning className="text-[11px]" style={{ color: C.sub }}>{time ? fmtD(time) : ''}</span>
        <span suppressHydrationWarning className="text-[10px]" style={{ color: C.muted }}>{tz()}</span>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// REALTIME CLOCK — compact (mobile)
// ═══════════════════════════════════════════════════════════════
const RealtimeClockCompact: React.FC = () => {
  const [time, setTime] = useState<Date|null>(null);
  useEffect(() => {
    setTime(new Date());
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const fmt = (d: Date) => d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit', hour12:false });
  const tz  = () => {
    if (!time) return 'UTC';
    const o = -time.getTimezoneOffset() / 60;
    return `UTC${o >= 0 ? '+' : ''}${o}`;
  };

  return (
    <div
      className="rounded-lg p-[10px_12px]"
      style={{ background: C.card, border: `1px solid ${C.bdr}` }}
    >
      <div className="flex justify-between items-center mb-0.5">
        <span className="text-[9px] font-medium" style={{ color: C.muted }}>WAKTU</span>
        <span className="inline-block w-[5px] h-[5px] rounded-full" style={{ background: C.coral }} />
      </div>
      <p suppressHydrationWarning className="text-[13px] font-semibold tracking-[0.02em] leading-none" style={{ color: C.text }}>
        {time ? fmt(time) : '--:--:--'}
      </p>
      <p suppressHydrationWarning className="text-[9px] mt-[3px]" style={{ color: C.muted }}>{tz()}</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
const StatCard: React.FC<{
  title: string; value: string|number; icon: React.ReactNode;
  trend?: 'up'|'down'|'neutral'; isLoading?: boolean;
}> = ({ title, value, icon, trend='neutral', isLoading=false }) => {
  const col = trend === 'up' ? C.cyan : trend === 'down' ? C.coral : C.text;
  return (
    <Card className="p-[14px_16px]">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <p className="text-[11px] font-medium mb-2" style={{ color: C.muted }}>{title}</p>
          <div className="relative min-h-[28px]">
            <p
              className="text-[24px] font-semibold tracking-[-0.02em] leading-none"
              style={{ color: col, opacity: isLoading ? 0 : 1 }}
            >
              {value}
            </p>
            {isLoading && (
              <div className="absolute top-0 left-0">
                <Skeleton width={60} height={28} variant="shimmer" />
              </div>
            )}
          </div>
        </div>
        <div className="mt-0.5 opacity-60" style={{ color: C.muted }}>{icon}</div>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROFIT CARD
// ═══════════════════════════════════════════════════════════════
const ProfitCard: React.FC<{ todayProfit: number; isLoading?: boolean }> = ({ todayProfit, isLoading=false }) => {
  const isPos = todayProfit >= 0;
  const col   = isPos ? C.cyan : C.coral;
  return (
    <Card className="p-[18px_20px]">
      <div className="flex items-center justify-between mb-2.5">
        <span className="text-[11px] font-medium" style={{ color: C.muted }}>Profit Hari Ini</span>
        <span className="flex items-center gap-[5px]">
          <span className="inline-block w-1.5 h-1.5 rounded-full opacity-80" style={{ background: col }} />
          <span className="text-[10px] font-semibold opacity-70" style={{ color: col }}>Live</span>
        </span>
      </div>

      <div className="relative min-h-[42px]">
        <p
          className="font-semibold tracking-[-0.02em] leading-[1.1] text-[clamp(26px,5vw,40px)]"
          style={{ color: col, opacity: isLoading ? 0 : 1 }}
        >
          {isPos ? '+' : '-'}Rp {Math.abs(todayProfit).toLocaleString('id-ID')}
        </p>
        {isLoading && (
          <div className="absolute top-0 left-0">
            <Skeleton width={220} height={42} variant="shimmer" />
          </div>
        )}
      </div>

      {!isLoading && (
        <div className="mt-3 flex items-center gap-2.5">
          <div className="flex-1 h-0.5 rounded-sm overflow-hidden" style={{ background: C.faint }}>
            <div
              className="h-full rounded-sm opacity-50 transition-[width] duration-300"
              style={{ width: isPos ? '68%' : '32%', background: col }}
            />
          </div>
          <span
            className="text-[11px] font-semibold px-2 py-0.5 rounded"
            style={{ color: col, background: `${col}12` }}
          >
            {isPos ? 'Profit' : 'Loss'}
          </span>
        </div>
      )}
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCHEDULE PANEL
// ═══════════════════════════════════════════════════════════════

function getActiveScheduleIndex(schedules: {time:string; trend:'buy'|'sell'}[]): number {
  if (!schedules.length) return -1;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();
  let closestIdx = -1, closestDiff = Infinity;
  schedules.forEach((s, i) => {
    const [h, m] = s.time.split(':').map(Number);
    let diff = (h * 60 + m) - nowMin;
    if (diff < 0) diff += 24 * 60;
    if (diff < closestDiff) { closestDiff = diff; closestIdx = i; }
  });
  return closestIdx;
}

const SchedulePanel: React.FC<{
  schedules: {time:string; trend:'buy'|'sell'}[];
  executions?: {scheduledTime:string; result:'win'|'loss'|'draw'}[];
  onOpenModal: () => void; isDisabled?: boolean; maxCount?: number;
  fillHeight?: boolean; tabletMaxItems?: number;
}> = ({ schedules, executions=[], onOpenModal, isDisabled=false, maxCount=50, fillHeight=false, tabletMaxItems }) => {
  const listRef  = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<(HTMLDivElement|null)[]>([]);
  const [activeIdx, setActiveIdx] = React.useState<number>(-1);

  React.useEffect(() => {
    const update = () => setActiveIdx(getActiveScheduleIndex(schedules));
    update();
    const t = setInterval(update, 10_000);
    return () => clearInterval(t);
  }, [schedules]);

  React.useEffect(() => {
    if (activeIdx < 0) return;
    const el = itemRefs.current[activeIdx];
    const container = listRef.current;
    if (!el || !container) return;
    container.scrollTo({ top: el.offsetTop - container.clientHeight / 2 + el.offsetHeight / 2, behavior: 'smooth' });
  }, [activeIdx]);

  return (
    <Card
      className={`flex flex-col ${fillHeight ? 'h-full flex-1' : ''}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-3.5 py-[11px]"
        style={{ borderBottom: `1px solid ${C.bdr}` }}
      >
        <span className="text-xs font-semibold" style={{ color: C.sub }}>Jadwal</span>
        {schedules.length > 0 && activeIdx >= 0 && (
          <span
            className="flex items-center gap-[5px] text-[10px] font-medium px-2 py-0.5 rounded-full border"
            style={{ color: C.cyan, background: 'rgba(52,211,153,0.08)', borderColor: 'rgba(52,211,153,0.2)' }}
          >
            <span className="inline-block w-[5px] h-[5px] rounded-full" style={{ background: C.cyan }} />
            <span className="hidden sm:inline">Berikutnya</span>
          </span>
        )}
      </div>

      {/* Body */}
      {schedules.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-5 gap-2">
          <Calendar className="w-7 h-7" strokeWidth={1.5} style={{ color: C.muted }} />
          <p className="text-xs text-center" style={{ color: C.muted }}>Belum ada jadwal</p>
        </div>
      ) : (
        <div
          ref={listRef}
          className="flex-1 overflow-y-auto"
          style={{ maxHeight: tabletMaxItems ? tabletMaxItems * 36 : fillHeight ? 'none' : 200 }}
        >
          {schedules.map((s, i) => {
            const isActive = i === activeIdx;
            const isBuy    = s.trend === 'buy';
            const col      = isBuy ? C.cyan : C.coral;
            const execResult = executions.filter(e => e.scheduledTime === s.time).slice(-1)[0]?.result;
            return (
              <div
                key={i}
                ref={el => { itemRefs.current[i] = el; }}
                className="schedule-item flex items-center gap-2 px-3 py-2 cursor-default transition-colors duration-150"
                style={{
                  borderBottom: `1px solid ${C.bdr}`,
                  background: isActive ? (isBuy ? 'rgba(52,211,153,0.05)' : 'rgba(248,113,113,0.05)') : 'transparent',
                  borderLeft: isActive ? `2px solid ${col}` : '2px solid transparent',
                }}
              >
                <span
                  className="text-[10px] w-[18px] text-right shrink-0"
                  style={{ color: isActive ? col : C.muted, fontWeight: isActive ? 600 : 400 }}
                >
                  {isActive ? '▶' : String(i + 1).padStart(2, '0')}
                </span>
                <span
                  className="text-[13px] flex-1"
                  style={{ color: isActive ? C.text : C.sub, fontWeight: isActive ? 600 : 400 }}
                >
                  {s.time}
                </span>
                {(!execResult || isActive) && (
                  <span
                    className="text-[10px] font-semibold px-[7px] py-0.5 rounded"
                    style={{ color: col, background: isBuy ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)' }}
                  >
                    {s.trend === 'buy' ? 'Buy' : 'Sell'}
                  </span>
                )}
                {execResult && !isActive && (
                  <span
                    className="text-[10px] font-semibold"
                    style={{ color: execResult === 'win' ? C.cyan : execResult === 'loss' ? C.coral : C.muted }}
                  >
                    {execResult === 'win' ? 'Win' : execResult === 'loss' ? 'Lose' : 'Draw'}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Footer */}
      <div className="p-[8px_10px]" style={{ borderTop: `1px solid ${C.bdr}` }}>
        <button
          onClick={onOpenModal}
          disabled={isDisabled}
          className="w-full flex items-center justify-center gap-1.5 py-2 rounded-md text-xs font-medium transition-opacity"
          style={{
            background: 'rgba(52,211,153,0.07)',
            border: '1px solid rgba(52,211,153,0.18)',
            color: C.cyan,
            cursor: isDisabled ? 'not-allowed' : 'pointer',
            opacity: isDisabled ? 0.4 : 1,
          }}
        >
          <Plus className="w-3 h-3" />
          {schedules.length === 0 ? 'Tambah' : 'Kelola'}
        </button>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// BULK SCHEDULE MODAL
// ═══════════════════════════════════════════════════════════════
const BulkScheduleModal: React.FC<{
  isOpen: boolean; onClose: () => void;
  schedules: {time:string; trend:'buy'|'sell'}[];
  onAddSchedules: (s:{time:string; trend:'buy'|'sell'}[]) => void;
  onRemoveSchedule: (i:number) => void;
  onClearAll: () => void; maxCount?: number;
}> = ({ isOpen, onClose, schedules, onAddSchedules, onRemoveSchedule, onClearAll, maxCount=50 }) => {
  const [input, setInput] = useState('');
  const [error, setError] = useState('');
  if (!isOpen) return null;

  const parseTime = (s: string): string|null => {
    s = s.trim();
    let m = s.match(/^(\d{1,2})[:.] ?(\d{1,2})$/);
    if (m) { const h=+m[1], min=+m[2]; if (h<=23&&min<=59) return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`; }
    m = s.match(/^(\d{3,4})$/);
    if (m) { const ns=m[1].padStart(4,'0'), h=+ns.slice(0,2), min=+ns.slice(2); if (h<=23&&min<=59) return `${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`; }
    return null;
  };
  const parseTrend = (s: string): 'buy'|'sell'|null => {
    const n = s.toLowerCase().trim();
    if (n==='buy'||n==='b') return 'buy';
    if (n==='sell'||n==='s') return 'sell';
    return null;
  };
  const handleAdd = () => {
    setError(''); if (!input.trim()) { setError('Input kosong'); return; }
    const result: {time:string;trend:'buy'|'sell'}[] = [], errs: string[] = [];
    input.trim().split('\n').forEach((line, i) => {
      const parts = line.trim().split(/[\s,\t\-]+/).filter(Boolean);
      if (!parts.length) return;
      if (parts.length < 2) { errs.push(`Baris ${i+1}: format tidak lengkap`); return; }
      const time = parseTime(parts[0]); if (!time) { errs.push(`Baris ${i+1}: waktu salah "${parts[0]}"`); return; }
      const trend = parseTrend(parts[1]); if (!trend) { errs.push(`Baris ${i+1}: trend salah "${parts[1]}"`); return; }
      if (result.some(r=>r.time===time)||schedules.some(r=>r.time===time)) { errs.push(`Baris ${i+1}: ${time} sudah ada`); return; }
      result.push({ time, trend });
    });
    if (errs.length) { setError(errs.join('\n')); return; }
    if (!result.length) { setError('Tidak ada jadwal valid'); return; }
    onAddSchedules(result); setInput('');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-[88px] animate-[fade-in_0.15s_ease]">
      {/* Backdrop */}
      <div
        className="absolute inset-0 backdrop-blur-md"
        style={{ background: 'rgba(0,0,0,0.75)' }}
        onClick={onClose}
      />

      {/* Sheet */}
      <div
        className="relative w-full max-w-[500px] flex flex-col max-h-[calc(100vh-104px)] rounded-xl animate-[slide-up_0.2s_ease]"
        style={{
          background: C.card, border: `1px solid ${C.bdr}`,
          boxShadow: '0 -8px 40px rgba(0,0,0,0.35)',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-[18px] py-[15px]" style={{ borderBottom: `1px solid ${C.bdr}` }}>
          <div>
            <h2 className="text-[15px] font-semibold mb-[3px]" style={{ color: C.text }}>Input Jadwal</h2>
            <p className="text-[11px]" style={{ color: C.muted }}>
              Format: <span className="font-medium" style={{ color: C.cyan }}>09:30 buy</span> · satu per baris
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-[30px] h-[30px] flex items-center justify-center rounded-md cursor-pointer"
            style={{ background: C.faint, border: `1px solid ${C.bdr}`, color: C.sub }}
          >
            <X className="w-[13px] h-[13px]" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-[14px_18px]">
          {schedules.length > 0 && (
            <div className="mb-[14px]">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-medium" style={{ color: C.sub }}>{schedules.length} jadwal aktif</span>
                <button
                  onClick={() => window.confirm('Hapus semua jadwal?') && onClearAll()}
                  className="flex items-center gap-1 text-[11px] font-medium opacity-80 bg-transparent border-none cursor-pointer py-[3px]"
                  style={{ color: C.coral }}
                >
                  <Trash2 className="w-[10px] h-[10px]" /> Hapus semua
                </button>
              </div>
              <div
                className="max-h-[130px] overflow-y-auto rounded-md"
                style={{ border: `1px solid ${C.bdr}`, background: C.card2 }}
              >
                {schedules.map((s, i) => (
                  <div
                    key={i}
                    className="schedule-item flex items-center gap-2.5 px-3 py-[7px]"
                    style={{ borderBottom: i < schedules.length - 1 ? `1px solid ${C.bdr}` : 'none' }}
                  >
                    <span className="text-[10px] w-5 text-right" style={{ color: C.muted }}>{String(i+1).padStart(2,'0')}</span>
                    <span className="text-[13px] font-medium flex-1" style={{ color: C.text }}>{s.time}</span>
                    <span
                      className="text-[10px] font-semibold px-[7px] py-0.5 rounded"
                      style={{ color: s.trend==='buy'?C.cyan:C.coral, background: s.trend==='buy'?'rgba(52,211,153,0.1)':'rgba(248,113,113,0.1)' }}
                    >
                      {s.trend === 'buy' ? 'Buy' : 'Sell'}
                    </span>
                    <button
                      onClick={() => onRemoveSchedule(i)}
                      className="p-[3px] flex items-center justify-center bg-transparent border-none cursor-pointer"
                      style={{ color: C.muted }}
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="mb-2.5">
            <p
              className="text-[11px] mb-[7px] px-2.5 py-[5px] rounded-md"
              style={{ color: C.muted, background: C.faint }}
            >
              Contoh: <span style={{ color: C.cyan }}>09:30 buy</span>{' · '}
              <span style={{ color: C.sub }}>14:15 s</span>{' · '}
              <span style={{ color: C.sub }}>1600 sell</span>
            </p>
            <textarea
              className="ds-input"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder={"09:00 buy\n09:30 sell\n1000 b\n14:15 buy"}
              rows={7}
            />
          </div>

          {error && (
            <div
              className="flex gap-2 px-3 py-2.5 rounded-md"
              style={{ background: C.cord, border: `1px solid rgba(248,113,113,0.2)`, borderLeft: `2px solid ${C.coral}` }}
            >
              <AlertCircle className="w-[13px] h-[13px] shrink-0 mt-[1px]" style={{ color: C.coral }} />
              <p className="text-[11px] leading-[1.5] whitespace-pre-line" style={{ color: C.coral }}>{error}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-2 px-[18px] py-3" style={{ borderTop: `1px solid ${C.bdr}` }}>
          <button
            onClick={handleAdd}
            disabled={!input.trim()}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-md text-[13px] font-medium transition-colors"
            style={{
              background: !input.trim() ? C.faint : 'rgba(52,211,153,0.1)',
              border: `1px solid ${!input.trim() ? C.bdr : 'rgba(52,211,153,0.3)'}`,
              color: !input.trim() ? C.muted : C.cyan,
              cursor: !input.trim() ? 'not-allowed' : 'pointer',
              opacity: !input.trim() ? 0.5 : 1,
            }}
          >
            <Plus className="w-[13px] h-[13px]" /> Tambah
          </button>
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-md text-[13px] font-medium bg-transparent cursor-pointer"
            style={{ border: `1px solid ${C.bdr}`, color: C.sub }}
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// PICKER MODAL
// ═══════════════════════════════════════════════════════════════
interface PickerOption { value: string; label: string; sub?: string; }

const PickerModal: React.FC<{
  isOpen: boolean; onClose: () => void; title: string;
  options: PickerOption[]; value: string;
  onSelect: (v: string) => void; searchable?: boolean;
}> = ({ isOpen, onClose, title, options, value, onSelect, searchable=false }) => {
  const [query, setQuery] = useState('');
  if (!isOpen) return null;

  const filtered = searchable && query.trim()
    ? options.filter(o => o.label.toLowerCase().includes(query.toLowerCase()) || o.value.toLowerCase().includes(query.toLowerCase()))
    : options;

  const handleSelect = (v: string) => { onSelect(v); onClose(); };

  return (
    <div className="fixed inset-0 z-[60] flex items-end justify-center p-4 pb-[88px] animate-[fade-in_0.15s_ease]">
      <div className="absolute inset-0 backdrop-blur-md" style={{ background: 'rgba(0,0,0,0.72)' }} onClick={onClose} />
      <div
        className="relative w-full max-w-[420px] flex flex-col max-h-[calc(100vh-120px)] rounded-[14px] overflow-hidden animate-[slide-up_0.2s_ease]"
        style={{ background: C.card, border: `1px solid ${C.bdr}`, boxShadow: '0 -8px 40px rgba(0,0,0,0.35)' }}
      >
        {/* Handle */}
        <div className="w-9 h-1 rounded-sm mx-auto mt-2.5 shrink-0" style={{ background: 'rgba(255,255,255,0.12)' }} />

        {/* Header */}
        <div className="flex items-center justify-between px-[18px] pt-3 pb-2.5 shrink-0">
          <span className="text-sm font-semibold" style={{ color: C.text }}>{title}</span>
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
            style={{ background: C.faint, border: `1px solid ${C.bdr}`, color: C.sub }}
          >
            <X className="w-3 h-3" />
          </button>
        </div>

        {/* Search */}
        {searchable && (
          <div className="px-3.5 pb-2.5 shrink-0">
            <input autoFocus className="ds-input text-[13px]" placeholder="Cari aset..." value={query} onChange={e => setQuery(e.target.value)} />
          </div>
        )}

        {/* Options */}
        <div className="overflow-y-auto flex-1">
          {filtered.length === 0 ? (
            <div className="px-[18px] py-6 text-center">
              <p className="text-xs" style={{ color: C.muted }}>Tidak ditemukan</p>
            </div>
          ) : (
            filtered.map((opt, i) => {
              const isSelected = opt.value === value;
              return (
                <button
                  key={opt.value}
                  onClick={() => handleSelect(opt.value)}
                  className="w-full text-left flex items-center justify-between px-[18px] py-[11px] border-none cursor-pointer transition-colors duration-100"
                  style={{
                    background: isSelected ? 'rgba(52,211,153,0.07)' : 'transparent',
                    borderBottom: i < filtered.length - 1 ? `1px solid ${C.bdr}` : 'none',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = C.faint; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}
                >
                  <div>
                    <span
                      className="block text-[13px]"
                      style={{ color: isSelected ? C.cyan : C.text, fontWeight: isSelected ? 600 : 400 }}
                    >
                      {opt.label}
                    </span>
                    {opt.sub && <span className="block text-[11px] mt-[1px]" style={{ color: C.muted }}>{opt.sub}</span>}
                  </div>
                  {isSelected && (
                    <span
                      className="w-[18px] h-[18px] rounded-full flex items-center justify-center shrink-0"
                      style={{ background: 'rgba(52,211,153,0.15)', border: `1.5px solid ${C.cyan}` }}
                    >
                      <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                        <path d="M1 3.5L3.5 6L8 1" stroke="#34d399" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

const PickerButton: React.FC<{
  label: string; placeholder?: string; disabled?: boolean; onClick: () => void;
}> = ({ label, placeholder, disabled, onClick }) => (
  <button
    type="button"
    onClick={onClick}
    disabled={disabled}
    className="w-full flex items-center justify-between px-3 py-[9px] rounded-md transition-colors duration-150"
    style={{
      background: 'rgba(255,255,255,0.04)',
      border: `1px solid ${C.bdr}`,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }}
    onMouseEnter={e => { if (!disabled) e.currentTarget.style.borderColor = 'rgba(255,255,255,0.18)'; }}
    onMouseLeave={e => { e.currentTarget.style.borderColor = C.bdr; }}
  >
    <span className="text-[13px]" style={{ color: label ? C.text : C.muted }}>
      {label || placeholder || '— pilih —'}
    </span>
    <ChevronDown className="w-[13px] h-[13px] shrink-0" style={{ color: C.muted }} />
  </button>
);

// ═══════════════════════════════════════════════════════════════
// ORDER SETTINGS CARD
// ═══════════════════════════════════════════════════════════════
const DURATIONS = [
  {value:'60',label:'1 Menit'},{value:'120',label:'2 Menit'},
  {value:'300',label:'5 Menit'},{value:'600',label:'10 Menit'},
  {value:'900',label:'15 Menit'},{value:'1800',label:'30 Menit'},
  {value:'3600',label:'1 Jam'},
];

const OrderSettingsCard: React.FC<{
  settings: OrderSettings; onChange: (s: OrderSettings) => void;
  isDisabled?: boolean; assets?: any[]; onAssetSelect?: (a: any) => void;
}> = ({ settings, onChange, isDisabled=false, assets=[], onAssetSelect }) => {
  const [open, setOpen]     = useState(true);
  const [mg, setMg]         = useState(settings.martingaleSetting.maxStep > 0);
  const [pickerOpen, setPickerOpen] = useState<'asset'|'accountType'|'duration'|null>(null);

  useEffect(() => setMg(settings.martingaleSetting.maxStep > 0), [settings.martingaleSetting.maxStep]);

  const set  = (k: keyof OrderSettings, v: any) => onChange({ ...settings, [k]: v });
  const nest = (p: keyof OrderSettings, k: string, v: any) => onChange({ ...settings, [p]: { ...(settings[p] as any), [k]: v } });
  const toggleMg = (v: boolean) => { setMg(v); onChange({ ...settings, martingaleSetting: v ? {maxStep:3,multiplier:2} : {maxStep:0,multiplier:1} }); };

  const assetOptions:   PickerOption[] = assets.map((a:any) => ({ value: a.symbol, label: a.name||a.symbol, sub: a.symbol !== (a.name||a.symbol) ? a.symbol : undefined }));
  const accountOptions: PickerOption[] = [
    { value:'demo', label:'Demo', sub:'Trading dengan dana virtual' },
    { value:'real', label:'Real', sub:'Trading dengan dana nyata' },
  ];
  const durationLabel = DURATIONS.find(d => d.value === settings.duration.toString())?.label || '';
  const assetLabel    = assets.find((a:any) => a.symbol === settings.assetSymbol)?.name || settings.assetSymbol || '';
  const accountLabel  = accountOptions.find(o => o.value === settings.accountType)?.label || '';

  return (
    <>
      <PickerModal isOpen={pickerOpen==='asset'} onClose={() => setPickerOpen(null)} title="Pilih Aset" options={assetOptions} value={settings.assetSymbol} searchable onSelect={v => { const a = assets.find((x:any) => x.symbol===v); if(a){onChange({...settings,assetSymbol:a.symbol,assetName:a.name||a.symbol});onAssetSelect?.(a);} }} />
      <PickerModal isOpen={pickerOpen==='accountType'} onClose={() => setPickerOpen(null)} title="Tipe Akun" options={accountOptions} value={settings.accountType} onSelect={v => set('accountType', v)} />
      <PickerModal isOpen={pickerOpen==='duration'} onClose={() => setPickerOpen(null)} title="Timeframe" options={DURATIONS.map(d=>({value:d.value,label:d.label}))} value={settings.duration.toString()} onSelect={v => set('duration', +v)} />

      <Card style={{ opacity: isDisabled ? 0.65 : 1 }}>
        {/* Header toggle */}
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer"
          style={{ borderBottom: open ? `1px solid ${C.bdr}` : 'none' }}
        >
          <div className="flex items-center gap-2">
            <Settings className="w-[14px] h-[14px]" style={{ color: C.cyan }} />
            <span className="text-[13px] font-semibold" style={{ color: C.text }}>Pengaturan Order</span>
            {isDisabled && (
              <span className="text-[10px] px-1.5 py-[1px] rounded" style={{ color: C.muted, background: C.faint }}>terkunci</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {settings.assetSymbol && <span className="text-[11px]" style={{ color: C.muted }}>{settings.assetSymbol}</span>}
            {open
              ? <ChevronUp className="w-[13px] h-[13px]" style={{ color: C.muted }} />
              : <ChevronDown className="w-[13px] h-[13px]" style={{ color: C.muted }} />
            }
          </div>
        </button>

        {open && (
          <div className="px-4 py-[14px]" style={{ pointerEvents: isDisabled ? 'none' : undefined }}>
            <SL>Pengaturan Dasar</SL>

            {/* Asset */}
            <div className="mb-2.5">
              <FL>Aset Trading</FL>
              <PickerButton label={assetLabel} placeholder="Pilih aset trading" disabled={isDisabled} onClick={() => setPickerOpen('asset')} />
            </div>

            {/* Tipe + Timeframe */}
            <div className="grid grid-cols-2 gap-2.5 mb-2.5">
              <div>
                <FL>Tipe Akun</FL>
                <PickerButton label={accountLabel} placeholder="Pilih tipe" disabled={isDisabled} onClick={() => setPickerOpen('accountType')} />
              </div>
              <div>
                <FL>Timeframe</FL>
                <PickerButton label={durationLabel} placeholder="Pilih durasi" disabled={isDisabled} onClick={() => setPickerOpen('duration')} />
              </div>
            </div>

            {/* Amount */}
            <div className="mb-4">
              <FL>Jumlah per Order</FL>
              <div className="relative mb-2">
                <span className="absolute left-[11px] top-1/2 -translate-y-1/2 text-[11px] z-[1] pointer-events-none" style={{ color: C.muted }}>Rp</span>
                <input type="number" className="ds-input" value={settings.amount} onChange={e => set('amount', +e.target.value||0)} disabled={isDisabled} min="1000" step="1000" style={{ paddingLeft: 34 }} />
              </div>
              <div className="grid grid-cols-4 gap-[5px]">
                {[10000, 25000, 50000, 100000].map(amt => (
                  <button key={amt} type="button" onClick={() => set('amount', amt)} disabled={isDisabled} className={`quick-amount-btn ${settings.amount===amt?'active':''}`}>
                    {amt >= 1000000 ? `${amt/1000000}M` : `${amt/1000}K`}
                  </button>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-[5px] mt-[5px]">
                {[250000, 500000, 1000000].map(amt => (
                  <button key={amt} type="button" onClick={() => set('amount', amt)} disabled={isDisabled} className={`quick-amount-btn ${settings.amount===amt?'active':''}`}>
                    {amt >= 1000000 ? `${amt/1000000}M` : `${amt/1000}K`}
                  </button>
                ))}
              </div>
            </div>

            <Divider />
            <SL>Martingale</SL>
            <div className="rounded-lg p-3 mb-[14px]" style={{ background: C.card2, border: `1px solid ${C.bdr}` }}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[13px] font-medium" style={{ color: C.sub }}>Martingale</p>
                  <p className="text-[11px] mt-0.5" style={{ color: C.muted }}>Gandakan amount setelah loss</p>
                </div>
                <Toggle checked={mg} onChange={toggleMg} disabled={isDisabled} />
              </div>
              {mg && (
                <div className="mt-2.5 pt-2.5 grid grid-cols-2 gap-2.5" style={{ borderTop: `1px solid ${C.bdr}` }}>
                  <div><FL>Max Step</FL><input type="number" className="ds-input" min="1" max="10" value={settings.martingaleSetting.maxStep} onChange={e => nest('martingaleSetting','maxStep',+e.target.value||0)} disabled={isDisabled} /></div>
                  <div><FL>Multiplier</FL><input type="number" className="ds-input" min="1" max="5" step="0.1" value={settings.martingaleSetting.multiplier} onChange={e => nest('martingaleSetting','multiplier',+e.target.value||1)} disabled={isDisabled} /></div>
                </div>
              )}
            </div>

            <Divider />
            <SL>Risk Management</SL>
            <div className="grid grid-cols-2 gap-2.5">
              <div>
                <FL>Stop Loss</FL>
                <div className="relative">
                  <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[11px] z-[1] pointer-events-none" style={{ color: C.muted }}>Rp</span>
                  <input type="number" className="ds-input" value={settings.stopLossProfit.stopLoss||''} onChange={e => nest('stopLossProfit','stopLoss',e.target.value?+e.target.value:undefined)} disabled={isDisabled} placeholder="Opsional" style={{ paddingLeft: 30 }} />
                </div>
              </div>
              <div>
                <FL>Take Profit</FL>
                <div className="relative">
                  <span className="absolute left-[10px] top-1/2 -translate-y-1/2 text-[11px] z-[1] pointer-events-none" style={{ color: C.muted }}>Rp</span>
                  <input type="number" className="ds-input" value={settings.stopLossProfit.stopProfit||''} onChange={e => nest('stopLossProfit','stopProfit',e.target.value?+e.target.value:undefined)} disabled={isDisabled} placeholder="Opsional" style={{ paddingLeft: 30 }} />
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>
    </>
  );
};

// ═══════════════════════════════════════════════════════════════
// BOT CONTROL CARD
// ═══════════════════════════════════════════════════════════════
const BotControlCard: React.FC<{
  status: BotStatus; onStart: ()=>void; onPause: ()=>void; onStop: ()=>void;
  isLoading?: boolean; canStart?: boolean; errorMessage?: string;
}> = ({ status, onStart, onPause, onStop, isLoading=false, canStart=false, errorMessage }) => {
  const [open, setOpen] = useState(true);
  const running = status.isRunning && !status.isPaused;
  const si = running
    ? { label:'Aktif',    col: C.cyan }
    : status.isPaused
    ? { label:'Dijeda',   col: '#6ee7b7' }
    : { label:'Nonaktif', col: C.muted };

  const BBtn: React.FC<{onClick:()=>void; disabled?:boolean; accent:string; label:string; loadingLabel?:string}> =
  ({ onClick, disabled, accent, label, loadingLabel='Memproses...' }) => (
    <button
      onClick={onClick}
      disabled={disabled||isLoading}
      className="w-full flex items-center justify-center py-2.5 rounded-md text-[13px] font-semibold tracking-wide transition-opacity"
      style={{
        background: `${accent}10`,
        border: `1px solid ${accent}30`,
        color: accent,
        cursor: (disabled||isLoading) ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.35 : 1,
        letterSpacing: '0.04em',
      }}
    >
      {isLoading ? loadingLabel : label}
    </button>
  );

  return (
    <Card style={{ borderColor: running ? 'rgba(52,211,153,0.2)' : C.bdr }}>
      {/* Header */}
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer"
        style={{ borderBottom: open ? `1px solid ${C.bdr}` : 'none' }}
      >
        <div className="flex items-center gap-2">
          <Zap className="w-[14px] h-[14px]" style={{ color: C.cyan }} />
          <span className="text-[13px] font-semibold" style={{ color: C.text }}>Kontrol Bot</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-[5px] text-[11px] font-medium" style={{ color: si.col }}>
            <span className="inline-block w-1.5 h-1.5 rounded-full" style={{ background: si.col }} />
            {si.label}
          </span>
          {open
            ? <ChevronUp className="w-[13px] h-[13px]" style={{ color: C.muted }} />
            : <ChevronDown className="w-[13px] h-[13px]" style={{ color: C.muted }} />
          }
        </div>
      </button>

      {open && (
        <div className="px-4 py-[14px]">
          {/* Mini stats */}
          <div className="grid grid-cols-2 gap-2 mb-2.5">
            {[
              { l:'Jadwal Aktif', v: status.activeSchedules, c: C.sub },
              { l:'Profit Sesi',  v: (status.currentProfit>=0?'+':'')+status.currentProfit.toLocaleString('id-ID'), c: status.currentProfit>=0?C.cyan:C.coral },
            ].map(s => (
              <div key={s.l} className="rounded-[7px] px-3 py-2.5" style={{ background: C.card2, border: `1px solid ${C.bdr}` }}>
                <p className="text-[11px] font-medium mb-1" style={{ color: C.muted }}>{s.l}</p>
                <p className="text-[20px] font-semibold leading-none" style={{ color: s.c }}>{s.v}</p>
              </div>
            ))}
          </div>

          {/* Next exec */}
          {status.nextExecutionTime && (
            <div className="flex items-center justify-between px-[11px] py-[7px] rounded-md mb-2.5" style={{ background: C.card2, border: `1px solid ${C.bdr}` }}>
              <span className="text-[11px]" style={{ color: C.muted }}>Berikutnya</span>
              <span className="text-[13px] font-semibold" style={{ color: '#6ee7b7' }}>{status.nextExecutionTime}</span>
            </div>
          )}

          {/* Error */}
          {errorMessage && (
            <div className="flex gap-[7px] px-[11px] py-[9px] mb-2.5 rounded-md" style={{ background: C.cord, border: `1px solid rgba(248,113,113,0.2)`, borderLeft: `2px solid ${C.coral}` }}>
              <AlertCircle className="w-3 h-3 shrink-0 mt-[1px]" style={{ color: C.coral }} />
              <p className="text-[11px]" style={{ color: C.coral }}>{errorMessage}</p>
            </div>
          )}

          {/* Buttons */}
          <div className="flex flex-row gap-1.5">
            {!status.isRunning && (
              <BBtn onClick={onStart} disabled={isLoading||!canStart} accent={C.cyan}
                label={status.isPaused ? 'Lanjutkan Bot' : 'Mulai Bot'}
              />
            )}
            {status.isRunning && !status.isPaused && (
              <BBtn onClick={onPause} disabled={isLoading} accent="#6ee7b7"
                label="Jeda Bot"
              />
            )}
            {status.isRunning && (
              <BBtn onClick={onStop} disabled={isLoading} accent={C.coral}
                label="Hentikan Bot"
              />
            )}
          </div>

          {/* Hint */}
          {!canStart && !errorMessage && (
            <div className="flex gap-[7px] px-[11px] py-[9px] mt-2 rounded-md" style={{ background: C.faint, border: `1px solid ${C.bdr}` }}>
              <Info className="w-[13px] h-[13px] shrink-0 mt-[1px]" style={{ color: C.muted }} />
              <p className="text-xs leading-[1.5]" style={{ color: C.muted }}>
                Lengkapi pengaturan dan tambahkan jadwal untuk memulai bot
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router         = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const clearAuth      = useAuthStore(s => s.clearAuth);
  const [isLoading, setIsLoading]         = useState(true);
  const [error, setError]                 = useState<string|null>(null);
  const [activeSchedule, setActiveSchedule] = useState<any>(null);
  const [assets, setAssets]               = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen]     = useState(false);
  const [isActionLoad, setIsActionLoad]   = useState(false);
  const [settings, setSettings] = useState<OrderSettings>({
    assetSymbol:'', assetName:'', accountType:'demo', duration:60, amount:10000,
    schedules:[], martingaleSetting:{maxStep:0,multiplier:2}, stopLossProfit:{},
  });
  const [botStatus, setBotStatus] = useState<BotStatus>({ isRunning:false, isPaused:false, activeSchedules:0, currentProfit:0 });
  const [todayStats, setTodayStats] = useState({ profit:0, executions:0, winRate:0 });
  const [executions, setExecutions] = useState<{scheduledTime:string; result:'win'|'loss'|'draw'}[]>([]);
  const [deviceType, setDeviceType] = useState<'mobile'|'tablet'|'desktop'>('desktop');

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/'); return; }
    document.documentElement.classList.add('dashboard-page');
    loadData();
    api.getActiveAssets().then((d:any) => setAssets(d||[])).catch(() => {});
    const iv = setInterval(loadData, 30000);
    return () => {
      clearInterval(iv);
      document.documentElement.classList.remove('dashboard-page');
    };
  }, [hasHydrated, isAuthenticated]); // eslint-disable-line

  useEffect(() => {
    const checkDevice = () => {
      const w = window.innerWidth;
      if (w < 768) setDeviceType('mobile');
      else if (w < 1024) setDeviceType('tablet');
      else setDeviceType('desktop');
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  const getNextExecTime = (schedules: any[]) => {
    if (!schedules?.length) return undefined;
    const cur = new Date().getHours()*60 + new Date().getMinutes();
    const future = schedules.map((s:any) => { const[h,m]=s.time.split(':').map(Number); return h*60+m; }).filter((t:number)=>t>cur).sort((a:number,b:number)=>a-b);
    if (future.length) { const h=Math.floor(future[0]/60), m=future[0]%60; return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`; }
    return `Besok ${schedules[0].time}`;
  };

  const loadData = async () => {
    setIsLoading(true); setError(null);
    try {
      const scheds = await api.getOrderSchedules().catch(() => []);
      const active = scheds.find((s:any) => s.status==='active' && s.isActive);
      setActiveSchedule(active||null);
      const ac = scheds.filter((s:any) => s.status==='active').length;
      const pc = scheds.filter((s:any) => s.status==='paused').length;
      setBotStatus({ isRunning:ac>0, isPaused:pc>0&&ac===0, activeSchedules:ac, nextExecutionTime:active?getNextExecTime(active.schedules):undefined, lastExecutionTime:active?.lastExecutedAt?new Date(active.lastExecutedAt).toLocaleTimeString('id-ID'):undefined, currentProfit:scheds.reduce((s:number,x:any)=>s+(x.currentProfit||0),0) });
      const stats = await api.getTodayStats(); setTodayStats(stats);
      if (active) { try { const execs = await api.getOrderHistory(active.id,200); setExecutions((execs||[]).filter((e:any)=>e.result).map((e:any)=>({scheduledTime:e.scheduledTime,result:e.result}))); } catch { setExecutions([]); } } else { setExecutions([]); }
      if (active) setSettings({ assetSymbol:active.assetSymbol, assetName:active.assetName||active.assetSymbol, accountType:active.accountType, duration:active.duration, amount:active.amount, schedules:active.schedules, martingaleSetting:active.martingaleSetting, stopLossProfit:active.stopLossProfit });
    } catch (e:any) {
      if (e?.response?.status===401) { clearAuth(); router.push('/'); return; }
      setError('Gagal memuat data. Silakan refresh.');
    } finally { setIsLoading(false); }
  };

  const handleStart = async () => {
    setIsActionLoad(true); setError(null);
    try { await api.createOrderSchedule({ assetSymbol:settings.assetSymbol, assetName:settings.assetName, accountType:settings.accountType, duration:settings.duration, amount:settings.amount, schedules:settings.schedules, martingaleSetting:settings.martingaleSetting, stopLossProfit:settings.stopLossProfit }); await loadData(); }
    catch (e:any) { setError(e?.response?.data?.message||'Gagal memulai bot.'); }
    finally { setIsActionLoad(false); }
  };
  const handlePause = async () => {
    if (!activeSchedule) return; setIsActionLoad(true); setError(null);
    try { await api.pauseOrderSchedule(activeSchedule.id); await loadData(); }
    catch (e:any) { setError(e?.response?.data?.message||'Gagal menjeda bot.'); }
    finally { setIsActionLoad(false); }
  };
  const handleStop = async () => {
    if (!activeSchedule || !window.confirm('Yakin ingin menghentikan bot?')) return;
    setIsActionLoad(true); setError(null);
    try { await api.deleteOrderSchedule(activeSchedule.id); await loadData(); setSettings({ assetSymbol:'', assetName:'', accountType:'demo', duration:60, amount:10000, schedules:[], martingaleSetting:{maxStep:0,multiplier:2}, stopLossProfit:{} }); }
    catch (e:any) { setError(e?.response?.data?.message||'Gagal menghentikan bot.'); }
    finally { setIsActionLoad(false); }
  };

  const canStart = !!(settings.assetSymbol && settings.schedules.length > 0);
  const g  = deviceType==='desktop' ? 20 : deviceType==='tablet' ? 18 : 16;
  const px = 16;

  if (!hasHydrated) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="w-[22px] h-[22px] border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(52,211,153,0.15)', borderTopColor: C.cyan }} />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen pb-[88px]" style={{ background: C.bg }}>

      {/* HEADER IMAGE — mobile & tablet only */}
      {deviceType !== 'desktop' && (
        <div className="relative mb-5">
          <img src="/header3.png" alt="" className="w-full h-auto block" />
        </div>
      )}

      <div className="max-w-[1280px] mx-auto" style={{ padding: `0 ${px}px` }}>

        {/* ERROR */}
        {error && (
          <div
            className="flex items-start gap-[9px] px-[14px] py-2.5 rounded-[7px] mb-5"
            style={{ background: C.cord, border: `1px solid rgba(248,113,113,0.2)`, borderLeft: `2px solid ${C.coral}` }}
          >
            <AlertCircle className="w-[13px] h-[13px] shrink-0 mt-0.5" style={{ color: C.coral }} />
            <span className="text-xs flex-1" style={{ color: C.coral }}>{error}</span>
            <button onClick={() => setError(null)} className="bg-transparent border-none cursor-pointer opacity-50" style={{ color: C.coral }}>
              <X className="w-[13px] h-[13px]" />
            </button>
          </div>
        )}

        {/* ── DESKTOP ── */}
        {deviceType === 'desktop' && (
          <div className="pt-6 flex flex-col" style={{ gap: g }}>

            {/* Top row: stats + clock */}
            <div className="grid grid-cols-4" style={{ gap: g }}>
              <StatCard title="Eksekusi Hari Ini" value={todayStats.executions} icon={<Activity className="w-[15px] h-[15px]" />} isLoading={isLoading} />
              <StatCard title="Win Rate" value={`${todayStats.winRate.toFixed(1)}%`} icon={<BarChart2 className="w-[15px] h-[15px]" />} trend={todayStats.winRate>50?'up':'down'} isLoading={isLoading} />
              <ProfitCard todayProfit={todayStats.profit} isLoading={isLoading} />
              <div className="h-full"><RealtimeClock /></div>
            </div>

            {/* Main content: chart + right sidebar */}
            <div className="grid" style={{ gridTemplateColumns: '1fr 340px', gap: g, alignItems: 'start' }}>

              {/* Left: chart */}
              <Card className="p-4">
                <ChartCard assetSymbol={settings.assetSymbol} height={340} />
                {settings.assetSymbol && (
                  <div className="flex items-center justify-center gap-[5px] mt-3">
                    <span className="inline-block w-1 h-1 rounded-full opacity-50" style={{ background: C.cyan }} />
                    <span className="text-[10px]" style={{ color: C.muted }}>{settings.assetSymbol} · {settings.assetName}</span>
                  </div>
                )}
              </Card>

              {/* Right sidebar */}
              <div className="flex flex-col" style={{ gap: g }}>
                <SchedulePanel
                  schedules={settings.schedules} executions={executions}
                  onOpenModal={() => setIsModalOpen(true)}
                  isDisabled={botStatus.isRunning&&!botStatus.isPaused} maxCount={10}
                />
                <OrderSettingsCard settings={settings} onChange={setSettings} isDisabled={botStatus.isRunning&&!botStatus.isPaused} assets={assets} />
                <BotControlCard status={botStatus} onStart={handleStart} onPause={handlePause} onStop={handleStop} isLoading={isActionLoad} canStart={canStart} errorMessage={error||undefined} />
              </div>
            </div>
          </div>
        )}

        {/* ── TABLET ── */}
        {deviceType === 'tablet' && (
          <div className="flex flex-col" style={{ gap: g }}>
            <div className="grid grid-cols-3" style={{ gap: g }}>
              <StatCard title="Eksekusi" value={todayStats.executions} icon={<Activity className="w-[13px] h-[13px]" />} isLoading={isLoading} />
              <StatCard title="Win Rate" value={`${todayStats.winRate.toFixed(1)}%`} icon={<BarChart2 className="w-[13px] h-[13px]" />} trend={todayStats.winRate>50?'up':'down'} isLoading={isLoading} />
              <div className="h-full"><RealtimeClock /></div>
            </div>
            <ProfitCard todayProfit={todayStats.profit} isLoading={isLoading} />
            <div className="grid grid-cols-2 items-stretch" style={{ gap: g }}>
              <Card className="p-3"><ChartCard assetSymbol={settings.assetSymbol} height={220} /></Card>
              <SchedulePanel schedules={settings.schedules} executions={executions} onOpenModal={() => setIsModalOpen(true)} isDisabled={botStatus.isRunning&&!botStatus.isPaused} maxCount={10} tabletMaxItems={10} />
            </div>
            <div className="grid grid-cols-2" style={{ gap: g }}>
              <OrderSettingsCard settings={settings} onChange={setSettings} isDisabled={botStatus.isRunning&&!botStatus.isPaused} assets={assets} />
              <BotControlCard status={botStatus} onStart={handleStart} onPause={handlePause} onStop={handleStop} isLoading={isActionLoad} canStart={canStart} errorMessage={error||undefined} />
            </div>
          </div>
        )}

        {/* ── MOBILE ── */}
        {deviceType === 'mobile' && (
          <div className="flex flex-col" style={{ gap: g }}>
            <ProfitCard todayProfit={todayStats.profit} isLoading={isLoading} />
            <div className="grid items-stretch" style={{ gridTemplateColumns: '3fr 2fr', gap: g }}>
              <div className="flex flex-col gap-2">
                <RealtimeClockCompact />
                <Card className="p-[10px] flex-1 flex flex-col">
                  <ChartCard assetSymbol={settings.assetSymbol} height={110} />
                  <div className="flex-1 flex flex-col justify-end gap-[5px] mt-2">
                    {settings.assetSymbol && (
                      <div className="flex items-center justify-center gap-[5px] px-2 py-[3px] rounded" style={{ background: C.faint }}>
                        <span className="inline-block w-1 h-1 rounded-full opacity-60 shrink-0" style={{ background: C.cyan }} />
                        <span className="text-[9px] whitespace-nowrap overflow-hidden text-ellipsis" style={{ color: C.muted }}>{settings.assetSymbol}</span>
                      </div>
                    )}
                    <div className="flex flex-col gap-1">
                      <div className="flex justify-between items-center">
                        <span className="text-[9px]" style={{ color: C.muted }}>Profit</span>
                        <span className="text-[10px] font-semibold" style={{ color: botStatus.currentProfit>=0?C.cyan:C.coral }}>
                          {botStatus.currentProfit>=0?'+':''}{botStatus.currentProfit.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-[9px]" style={{ color: C.muted }}>Status</span>
                        <span
                          className="text-[9px] font-semibold"
                          style={{ color: botStatus.isRunning&&!botStatus.isPaused ? C.cyan : botStatus.isPaused ? '#6ee7b7' : C.muted }}
                        >
                          {botStatus.isRunning&&!botStatus.isPaused ? 'Aktif' : botStatus.isPaused ? 'Dijeda' : 'Off'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <SchedulePanel schedules={settings.schedules} executions={executions} onOpenModal={() => setIsModalOpen(true)} isDisabled={botStatus.isRunning&&!botStatus.isPaused} maxCount={10} />
            </div>
            <div className="grid grid-cols-2" style={{ gap: g }}>
              <StatCard title="Eksekusi" value={todayStats.executions} icon={<Activity className="w-3 h-3" />} isLoading={isLoading} />
              <StatCard title="Win Rate" value={`${todayStats.winRate.toFixed(1)}%`} icon={<BarChart2 className="w-3 h-3" />} trend={todayStats.winRate>50?'up':'down'} isLoading={isLoading} />
            </div>
            <OrderSettingsCard settings={settings} onChange={setSettings} isDisabled={botStatus.isRunning&&!botStatus.isPaused} assets={assets} />
            <BotControlCard status={botStatus} onStart={handleStart} onPause={handlePause} onStop={handleStop} isLoading={isActionLoad} canStart={canStart} errorMessage={error||undefined} />
          </div>
        )}
      </div>

      <BulkScheduleModal
        isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}
        schedules={settings.schedules}
        onAddSchedules={s => setSettings({...settings, schedules:[...settings.schedules,...s]})}
        onRemoveSchedule={i => setSettings({...settings, schedules:settings.schedules.filter((_,j)=>j!==i)})}
        onClearAll={() => setSettings({...settings, schedules:[]})} maxCount={10}
      />
      <BottomNav />
    </div>
  );
}