'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import {
  TrendUp, TrendDown, ArrowClockwise, WarningCircle,
  Clock, MagnifyingGlass, CaretLeft, CaretRight,
} from '@phosphor-icons/react';

// ─── TOKENS ───────────────────────────────────────────────────
const C = {
  bg:    '#050807',
  card:  '#111915',
  card2: '#141f1a',
  bdr:   'rgba(255,255,255,0.07)',
  cyan:  '#34d399',
  coral: '#f87171',
  text:  '#f0faf6',
  muted: 'rgba(255,255,255,0.35)',
  faint: 'rgba(255,255,255,0.05)',
};

// ─── TYPES ────────────────────────────────────────────────────
interface BinaryOrder {
  id: string; user_id: string; asset_id: string;
  assetSymbol: string; assetName?: string;
  direction: 'CALL' | 'PUT';
  amount: number; duration: number;
  accountType: 'demo' | 'real';
  status: 'PENDING' | 'ACTIVE' | 'WON' | 'LOST' | 'EXPIRED' | 'DRAW';
  profit?: number; entry_price?: number; exit_price?: number;
  entry_time?: string; exit_time?: string;
  createdAt: string; updatedAt?: string;
}

interface ExecutionDisplay {
  id: string; executedAt: string;
  trend: 'buy' | 'sell';
  assetSymbol: string; amount: number; duration: number;
  accountType: 'demo' | 'real';
  status: 'pending' | 'active' | 'completed';
  result?: 'win' | 'loss' | 'draw';
  profit?: number;
}

// ─── HELPERS ──────────────────────────────────────────────────
const fmt = {
  date: (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
  time: (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  dur:  (s: number)   => s >= 3600 ? `${s/3600}j` : s >= 60 ? `${s/60}m` : `${s}d`,
  idr:  (n: number)   => `Rp ${Math.abs(n).toLocaleString('id-ID')}`,
};

const transformOrder = (o: BinaryOrder): ExecutionDisplay => {
  const trend = o.direction === 'CALL' ? 'buy' : 'sell';
  let result: 'win' | 'loss' | 'draw' | undefined;
  let status: 'pending' | 'active' | 'completed';
  if      (o.status === 'WON')    { result = 'win';  status = 'completed'; }
  else if (o.status === 'LOST')   { result = 'loss'; status = 'completed'; }
  else if (o.status === 'DRAW')   { result = 'draw'; status = 'completed'; }
  else if (o.status === 'ACTIVE') { status = 'active'; }
  else                            { status = 'pending'; }
  return { id: o.id, executedAt: o.createdAt, trend, assetSymbol: o.assetSymbol, amount: o.amount, duration: o.duration, accountType: o.accountType, status, result, profit: o.profit };
};

// ─── SKELETON ─────────────────────────────────────────────────
const skeletonStyle = {
  background: 'linear-gradient(90deg, #1a2420 25%, #22302a 50%, #1a2420 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-pulse 1.6s ease infinite',
} as const;

const Sk = ({ w = '100%', h = 14, className = '' }: { w?: string | number; h?: number; className?: string }) => (
  <div className={`rounded-md ${className}`} style={{ width: w, height: h, ...skeletonStyle }} />
);

// ─── PILL ─────────────────────────────────────────────────────
const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; accent?: string }> = ({
  active, onClick, children, accent = C.cyan,
}) => (
  <button
    onClick={onClick}
    className="px-3 py-[5px] text-[11px] font-semibold rounded-md cursor-pointer transition-all duration-150"
    style={{
      background: active ? `${accent}18` : C.faint,
      border: `1px solid ${active ? `${accent}40` : 'rgba(255,255,255,0.07)'}`,
      color: active ? accent : 'rgba(255,255,255,0.3)',
      letterSpacing: '0.05em',
    }}
  >
    {children}
  </button>
);

// ─── STAT CARD ────────────────────────────────────────────────
const StatCard = ({ label, value, sub, accent = C.text }: { label: string; value: string | number; sub?: string; accent?: string }) => (
  <div className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
    <p className="text-[10px] font-medium uppercase tracking-widest mb-2" style={{ color: C.muted }}>{label}</p>
    <p className="text-[20px] font-semibold leading-none" style={{ color: accent }}>{value}</p>
    {sub && <p className="text-[10px] mt-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{sub}</p>}
  </div>
);

// ─── EXECUTION ROW ────────────────────────────────────────────
const ExecutionRow = ({ exec }: { exec: ExecutionDisplay }) => {
  const isBuy = exec.trend === 'buy';
  const trendColor = isBuy ? C.cyan : C.coral;
  const resultCfg: Record<string, { label: string; col: string }> = {
    win:  { label: 'WIN',  col: C.cyan  },
    loss: { label: 'LOSS', col: C.coral },
    draw: { label: 'DRAW', col: 'rgba(255,255,255,0.4)' },
  };
  const rc = exec.result ? resultCfg[exec.result] : null;

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-3 rounded-lg transition-colors duration-150"
      style={{ background: C.card, border: `1px solid ${C.bdr}` }}
    >
      {/* Direction dot */}
      <div
        className="w-8 h-8 rounded-md flex items-center justify-center shrink-0"
        style={{
          background: isBuy ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
          border: `1px solid ${isBuy ? 'rgba(52,211,153,0.18)' : 'rgba(248,113,113,0.18)'}`,
        }}
      >
        {isBuy
          ? <TrendUp size={14} weight="bold" style={{ color: C.cyan }} />
          : <TrendDown size={14} weight="bold" style={{ color: C.coral }} />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[13px] font-semibold" style={{ color: C.text }}>{exec.assetSymbol}</span>
          <span
            className="text-[10px] font-semibold px-1.5 py-[2px] rounded"
            style={{ color: trendColor, background: isBuy ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)' }}
          >
            {exec.trend.toUpperCase()}
          </span>
          <span
            className="text-[10px] px-1.5 py-[2px] rounded"
            style={{ color: C.muted, background: C.faint }}
          >
            {exec.accountType}
          </span>
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[10px]" style={{ color: 'rgba(255,255,255,0.22)' }}>
          <Clock size={9} />
          <span>{fmt.date(exec.executedAt)} · {fmt.time(exec.executedAt)}</span>
          <span className="hidden sm:inline">· {fmt.dur(exec.duration)} · {fmt.idr(exec.amount)}</span>
        </div>
      </div>

      {/* Result */}
      <div className="flex flex-col items-end gap-1 shrink-0">
        {rc && (
          <span
            className="text-[10px] font-semibold px-2 py-[2px] rounded"
            style={{ color: rc.col, background: `${rc.col}12`, border: `1px solid ${rc.col}25` }}
          >
            {rc.label}
          </span>
        )}
        {exec.profit !== undefined && (
          <span
            className="text-[12px] font-semibold"
            style={{ color: exec.profit > 0 ? C.cyan : exec.profit < 0 ? C.coral : C.muted }}
          >
            {exec.profit >= 0 ? '+' : '-'}{fmt.idr(exec.profit)}
          </span>
        )}
        {!exec.result && exec.status === 'active' && (
          <span className="text-[10px]" style={{ color: 'rgba(96,165,250,0.6)' }}>Active</span>
        )}
        {!exec.result && exec.status === 'pending' && (
          <span className="text-[10px]" style={{ color: 'rgba(252,211,77,0.6)' }}>Pending</span>
        )}
      </div>
    </div>
  );
};

// ─── PAGE ─────────────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, clearAuth } = useAuthStore();

  const [allExecs,      setAllExecs]      = useState<ExecutionDisplay[]>([]);
  const [isLoading,     setIsLoading]     = useState(true);
  const [isRefreshing,  setIsRefreshing]  = useState(false);
  const [error,         setError]         = useState<string | null>(null);
  const [filterResult,  setFilterResult]  = useState<'all'|'win'|'loss'|'draw'>('all');
  const [filterAccount, setFilterAccount] = useState<'all'|'demo'|'real'>('all');
  const [filterTrend,   setFilterTrend]   = useState<'all'|'buy'|'sell'>('all');
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const [totalPages,    setTotalPages]    = useState(1);
  const [totalOrders,   setTotalOrders]   = useState(0);
  const PER_PAGE = 25;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/'); return; }
    load();
  }, [hasHydrated, isAuthenticated]); // eslint-disable-line

  useEffect(() => { if (hasHydrated && isAuthenticated) load(); }, [filterResult, filterAccount, filterTrend, search, page]); // eslint-disable-line
  useEffect(() => { if (page !== 1) setPage(1); }, [filterResult, filterAccount, filterTrend, search]); // eslint-disable-line

  const load = useCallback(async () => {
    setIsLoading(true); setError(null);
    try {
      const statusMap: Record<string, string> = { win: 'WON', loss: 'LOST' };
      const query: any = { page, limit: PER_PAGE };
      if (filterResult !== 'all' && statusMap[filterResult]) query.status = statusMap[filterResult];
      if (filterAccount !== 'all') query.accountType = filterAccount;

      const orders = await api.getBinaryOrders(query);
      if (!Array.isArray(orders)) { setAllExecs([]); return; }

      let transformed = orders.map(transformOrder);
      if (filterTrend !== 'all') transformed = transformed.filter(e => e.trend === filterTrend);
      if (search) transformed = transformed.filter(e => e.assetSymbol.toLowerCase().includes(search.toLowerCase()));

      setAllExecs(transformed);
      setTotalOrders(transformed.length);
      setTotalPages(Math.max(1, Math.ceil(transformed.length / PER_PAGE)));
    } catch (e: any) {
      if (e?.response?.status === 401) { clearAuth(); router.push('/'); return; }
      setError('Gagal memuat riwayat.');
      setAllExecs([]);
    } finally { setIsLoading(false); }
  }, [clearAuth, router, page, filterResult, filterAccount, filterTrend, search]);

  const handleRefresh = async () => { setIsRefreshing(true); await load(); setIsRefreshing(false); };

  const stats = allExecs.reduce(
    (acc, e) => {
      acc.total++;
      if (e.result === 'win')  { acc.wins++;   acc.profit += e.profit ?? 0; }
      if (e.result === 'loss') { acc.losses++; acc.profit += e.profit ?? 0; }
      if (e.result === 'draw')   acc.draws++;
      return acc;
    },
    { total: 0, wins: 0, losses: 0, draws: 0, profit: 0 }
  );
  const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;

  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)              return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages-4, totalPages-3, totalPages-2, totalPages-1, totalPages];
    return [page-2, page-1, page, page+1, page+2];
  };

  if (!hasHydrated) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: C.bg }}>
      <div className="w-6 h-6 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'rgba(52,211,153,0.2)', borderTopColor: C.cyan }} />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen pb-24" style={{ background: C.bg }}>

      {/* Sticky header */}
      <div
        className="sticky top-0 z-40"
        style={{
          background: 'rgba(5,8,7,0.94)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div className="max-w-[720px] mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold tracking-wide" style={{ color: C.text }}>Riwayat</h1>
            <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>{totalOrders.toLocaleString()} transaksi</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors cursor-pointer disabled:opacity-40"
            style={{
              background: C.faint,
              border: '1px solid rgba(255,255,255,0.08)',
              color: isRefreshing ? C.cyan : C.muted,
            }}
          >
            <ArrowClockwise size={12} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-[720px] mx-auto px-4 pt-4 flex flex-col gap-3">

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', borderLeft: `2px solid ${C.coral}`, color: '#fca5a5' }}
          >
            <WarningCircle size={13} className="shrink-0" /> {error}
          </div>
        )}

        {/* Stats skeleton OR real stats */}
        {isLoading ? (
          <div className="grid grid-cols-4 gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="rounded-lg p-3" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
                <Sk w="60%" h={10} className="mb-2" />
                <Sk w="70%" h={22} className="mb-1.5" />
                <Sk w="40%" h={9} />
              </div>
            ))}
          </div>
        ) : allExecs.length > 0 && (
          <div className="grid grid-cols-4 gap-2">
            <StatCard label="Eksekusi" value={stats.total.toLocaleString()} />
            <StatCard label="Win Rate" value={`${winRate.toFixed(1)}%`} sub={`${stats.wins}W · ${stats.losses}L`} accent={winRate >= 50 ? C.cyan : C.coral} />
            <StatCard label="Profit" value={`${stats.profit >= 0 ? '+' : ''}${(stats.profit/1000).toFixed(0)}k`} accent={stats.profit >= 0 ? C.cyan : C.coral} />
            <StatCard label="Menang" value={stats.wins} sub={`dari ${stats.total}`} accent={C.cyan} />
          </div>
        )}

        {/* Filters */}
        <div className="rounded-lg p-3.5 flex flex-col gap-3" style={{ background: C.card, border: `1px solid ${C.bdr}` }}>
          {/* Search */}
          <div className="relative">
            <MagnifyingGlass size={13} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: C.muted }} />
            <input
              type="text"
              placeholder="Cari simbol aset…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-2 rounded-md text-[12px] outline-none transition-colors"
              style={{
                background: 'rgba(0,0,0,0.3)',
                border: '1px solid rgba(255,255,255,0.07)',
                color: C.text,
                fontFamily: 'var(--font-geist-sans)',
              }}
              onFocus={e => e.target.style.borderColor = 'rgba(52,211,153,0.35)'}
              onBlur={e  => e.target.style.borderColor = 'rgba(255,255,255,0.07)'}
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-1.5">
            <Pill active={filterResult==='all'}  onClick={()=>setFilterResult('all')}>Semua</Pill>
            <Pill active={filterResult==='win'}  onClick={()=>setFilterResult('win')}  accent={C.cyan}>Win</Pill>
            <Pill active={filterResult==='loss'} onClick={()=>setFilterResult('loss')} accent={C.coral}>Loss</Pill>
            <Pill active={filterResult==='draw'} onClick={()=>setFilterResult('draw')}>Draw</Pill>

            <span className="self-stretch w-px mx-0.5" style={{ background: 'rgba(255,255,255,0.07)' }} />

            <Pill active={filterTrend==='all'}  onClick={()=>setFilterTrend('all')}>All</Pill>
            <Pill active={filterTrend==='buy'}  onClick={()=>setFilterTrend('buy')}  accent={C.cyan}>Buy</Pill>
            <Pill active={filterTrend==='sell'} onClick={()=>setFilterTrend('sell')} accent={C.coral}>Sell</Pill>

            <span className="self-stretch w-px mx-0.5" style={{ background: 'rgba(255,255,255,0.07)' }} />

            <Pill active={filterAccount==='all'}  onClick={()=>setFilterAccount('all')}>Semua</Pill>
            <Pill active={filterAccount==='demo'} onClick={()=>setFilterAccount('demo')}>Demo</Pill>
            <Pill active={filterAccount==='real'} onClick={()=>setFilterAccount('real')}>Real</Pill>
          </div>

          <p className="text-[10px]" style={{ color: 'rgba(255,255,255,0.2)' }}>
            {allExecs.length.toLocaleString()} ditampilkan
          </p>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="flex flex-col gap-1.5">
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                className="flex items-center gap-3 px-3.5 py-3 rounded-lg"
                style={{ background: C.card, border: `1px solid ${C.bdr}`, opacity: 1 - i * 0.1 }}
              >
                {/* Direction icon placeholder */}
                <div className="w-8 h-8 rounded-md shrink-0" style={skeletonStyle} />
                {/* Info */}
                <div className="flex-1 flex flex-col gap-1.5">
                  <div className="flex gap-1.5">
                    <Sk w={80} h={12} />
                    <Sk w={36} h={12} />
                    <Sk w={36} h={12} />
                  </div>
                  <Sk w="55%" h={10} />
                </div>
                {/* Result */}
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Sk w={40} h={18} />
                  <Sk w={60} h={13} />
                </div>
              </div>
            ))}
          </div>
        ) : allExecs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2">
            <p className="text-sm" style={{ color: 'rgba(255,255,255,0.2)' }}>Tidak ada riwayat</p>
            <p className="text-[11px] text-center" style={{ color: 'rgba(255,255,255,0.12)' }}>
              Tidak ada data yang cocok dengan filter yang dipilih.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {allExecs.map(exec => <ExecutionRow key={exec.id} exec={exec} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer disabled:opacity-25 transition-colors"
              style={{ background: C.faint, border: `1px solid ${C.bdr}`, color: C.muted }}
            >
              <CaretLeft size={13} />
            </button>

            {pageNums().map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className="w-8 h-8 rounded-md text-xs font-medium cursor-pointer transition-all"
                style={{
                  background: page === n ? 'rgba(52,211,153,0.1)' : C.faint,
                  border: `1px solid ${page === n ? 'rgba(52,211,153,0.35)' : C.bdr}`,
                  color: page === n ? C.cyan : C.muted,
                }}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 flex items-center justify-center rounded-md cursor-pointer disabled:opacity-25 transition-colors"
              style={{ background: C.faint, border: `1px solid ${C.bdr}`, color: C.muted }}
            >
              <CaretRight size={13} />
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}