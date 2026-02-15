'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import {
  TrendingUp, TrendingDown, RefreshCw, AlertCircle,
  Clock, Search, ChevronLeft, ChevronRight,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface Execution {
  id: string;
  scheduleId: string;
  executedAt: string;
  trend: 'buy' | 'sell';
  assetSymbol: string;
  amount: number;
  duration: number;
  accountType: 'demo' | 'real';
  martingaleStep?: number;
  status: 'pending' | 'executed' | 'failed' | 'skipped';
  result?: 'win' | 'loss' | 'draw';
  profit?: number;
}

// ============================================================================
// HELPERS
// ============================================================================
const fmt = {
  date: (iso: string) =>
    new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
  time: (iso: string) =>
    new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  duration: (sec: number) =>
    sec >= 3600 ? `${sec / 3600}j` : sec >= 60 ? `${sec / 60}m` : `${sec}d`,
  idr: (n: number) => `Rp ${Math.abs(n).toLocaleString('id-ID')}`,
};

// ============================================================================
// STAT CARD
// ============================================================================
const StatCard = ({
  label, value, sub, color = 'default',
}: {
  label: string; value: string | number; sub?: string;
  color?: 'default' | 'green' | 'red';
}) => (
  <div className="bg-[#141414] rounded-xl border border-white/[0.05] p-4">
    <p className="text-[10px] uppercase tracking-widest text-white/20 mb-2">{label}</p>
    <p className={`text-xl font-bold font-mono tabular-nums ${
      color === 'green' ? 'text-emerald-400' : color === 'red' ? 'text-red-400' : 'text-white'
    }`}>{value}</p>
    {sub && <p className="text-[10px] text-white/20 mt-0.5">{sub}</p>}
  </div>
);

// ============================================================================
// PILL
// ============================================================================
const Pill = ({
  active, onClick, children, color = 'default',
}: {
  active: boolean; onClick: () => void; children: React.ReactNode;
  color?: 'default' | 'green' | 'red';
}) => (
  <button
    onClick={onClick}
    className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
      active
        ? color === 'green'
          ? 'bg-emerald-500/15 border-emerald-500/25 text-emerald-300'
          : color === 'red'
          ? 'bg-red-500/15 border-red-500/25 text-red-300'
          : 'bg-white/10 border-white/[0.15] text-white'
        : 'border-white/[0.06] text-white/25 hover:text-white/50 hover:border-white/10'
    }`}
  >
    {children}
  </button>
);

// ============================================================================
// EXECUTION ROW
// ============================================================================
const ExecutionRow = ({ exec }: { exec: Execution }) => {
  const isBuy = exec.trend === 'buy';
  const result = exec.result;

  return (
    <div className="flex items-center gap-3 px-4 py-3.5 bg-[#141414] hover:bg-[#181818] rounded-xl border border-white/[0.04] transition-colors">
      {/* Icon */}
      <div className={`w-9 h-9 rounded-xl flex-shrink-0 flex items-center justify-center ${
        isBuy ? 'bg-emerald-500/10' : 'bg-red-500/10'
      }`}>
        {isBuy
          ? <TrendingUp className="w-4 h-4 text-emerald-400" />
          : <TrendingDown className="w-4 h-4 text-red-400" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white font-mono">{exec.assetSymbol}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
            isBuy ? 'text-emerald-400 bg-emerald-500/10' : 'text-red-400 bg-red-500/10'
          }`}>{exec.trend.toUpperCase()}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-white/25">
            {exec.accountType.toUpperCase()}
          </span>
          {(exec.martingaleStep ?? 0) > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-400">
              M{exec.martingaleStep}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-white/20">
          <Clock className="w-3 h-3" />
          <span>{fmt.date(exec.executedAt)} · {fmt.time(exec.executedAt)}</span>
          <span className="hidden sm:inline">· {fmt.duration(exec.duration)} · {fmt.idr(exec.amount)}</span>
        </div>
      </div>

      {/* Result */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {result && (
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
            result === 'win'  ? 'bg-emerald-500/10 text-emerald-400' :
            result === 'loss' ? 'bg-red-500/10 text-red-400' :
            'bg-white/5 text-white/30'
          }`}>
            {result.toUpperCase()}
          </span>
        )}
        {exec.profit !== undefined && (
          <span className={`text-sm font-bold font-mono tabular-nums ${
            exec.profit > 0 ? 'text-emerald-400' : exec.profit < 0 ? 'text-red-400' : 'text-white/30'
          }`}>
            {exec.profit >= 0 ? '+' : '-'}{fmt.idr(exec.profit)}
          </span>
        )}
        {!result && exec.status === 'failed' && (
          <span className="text-[11px] text-red-400/60">Gagal</span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// PAGE
// ============================================================================
export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [allExecs,     setAllExecs]     = useState<Execution[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  const [filterResult,  setFilterResult]  = useState<'all' | 'win' | 'loss' | 'draw'>('all');
  const [filterAccount, setFilterAccount] = useState<'all' | 'demo' | 'real'>('all');
  const [filterTrend,   setFilterTrend]   = useState<'all' | 'buy' | 'sell'>('all');
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const PER_PAGE = 25;

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/'); return; }
    load();
  }, [hasHydrated, isAuthenticated]); // eslint-disable-line

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const schedules = await api.getOrderSchedules().catch(() => []);
      const batches   = await Promise.all(
        schedules.map((s: any) => api.getOrderHistory(s.id, 500).catch(() => []))
      );
      const merged = (batches.flat() as Execution[])
        .filter(Boolean)
        .sort((a, b) => new Date(b.executedAt).getTime() - new Date(a.executedAt).getTime());
      setAllExecs(merged);
    } catch (e: any) {
      if (e?.response?.status === 401) { clearAuth(); router.push('/'); return; }
      setError('Gagal memuat riwayat. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  }, [clearAuth, router]);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await load();
    setIsRefreshing(false);
  };

  useEffect(() => { setPage(1); }, [filterResult, filterAccount, filterTrend, search]);

  // Filtered + paginated
  const filtered = allExecs.filter((e) => {
    if (filterResult  !== 'all' && e.result      !== filterResult)  return false;
    if (filterAccount !== 'all' && e.accountType !== filterAccount) return false;
    if (filterTrend   !== 'all' && e.trend       !== filterTrend)   return false;
    if (search && !e.assetSymbol.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // Stats
  const stats = filtered.reduce(
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

  // Pagination numbers
  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)              return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  // Guards
  if (!hasHydrated) return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0c0c0c] pb-24">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0c0c0c]/90 backdrop-blur-md border-b border-white/[0.04]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-white">Riwayat Eksekusi</h1>
            <p className="text-[11px] text-white/20 mt-0.5">
              {allExecs.length.toLocaleString()} transaksi
            </p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/30 hover:text-white hover:border-white/[0.15] transition-colors text-xs disabled:opacity-30"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-500/8 border border-red-500/15 rounded-xl text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* Stats */}
        {!isLoading && allExecs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <StatCard label="Eksekusi"     value={stats.total.toLocaleString()} />
            <StatCard label="Win Rate"     value={`${winRate.toFixed(1)}%`}
              sub={`${stats.wins}W · ${stats.losses}L · ${stats.draws}D`}
              color={winRate >= 50 ? 'green' : 'red'} />
            <StatCard label="Total Profit"
              value={`${stats.profit >= 0 ? '+' : '-'}${(Math.abs(stats.profit) / 1000).toFixed(0)}k`}
              color={stats.profit >= 0 ? 'green' : 'red'} />
            <StatCard label="Menang"       value={stats.wins}
              sub={`dari ${stats.total}`} color="green" />
          </div>
        )}

        {/* Filters */}
        <div className="bg-[#141414] rounded-xl border border-white/[0.04] p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/20" />
            <input
              type="text"
              placeholder="Cari simbol aset…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm bg-[#0f0f0f] border border-white/[0.06] rounded-lg text-white placeholder-white/20 focus:outline-none focus:border-white/[0.15] transition-colors"
            />
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-1.5">
            <Pill active={filterResult === 'all'}  onClick={() => setFilterResult('all')}>Semua</Pill>
            <Pill active={filterResult === 'win'}  onClick={() => setFilterResult('win')}  color="green">WIN</Pill>
            <Pill active={filterResult === 'loss'} onClick={() => setFilterResult('loss')} color="red">LOSS</Pill>
            <Pill active={filterResult === 'draw'} onClick={() => setFilterResult('draw')}>DRAW</Pill>
            <span className="w-px bg-white/[0.06] self-stretch mx-0.5" />
            <Pill active={filterTrend === 'all'}  onClick={() => setFilterTrend('all')}>All</Pill>
            <Pill active={filterTrend === 'buy'}  onClick={() => setFilterTrend('buy')}  color="green">BUY</Pill>
            <Pill active={filterTrend === 'sell'} onClick={() => setFilterTrend('sell')} color="red">SELL</Pill>
            <span className="w-px bg-white/[0.06] self-stretch mx-0.5" />
            <Pill active={filterAccount === 'all'}  onClick={() => setFilterAccount('all')}>Demo+Real</Pill>
            <Pill active={filterAccount === 'demo'} onClick={() => setFilterAccount('demo')} color="green">Demo</Pill>
            <Pill active={filterAccount === 'real'} onClick={() => setFilterAccount('real')} color="green">Real</Pill>
          </div>

          <p className="text-[11px] text-white/20">
            {filtered.length.toLocaleString()} dari {allExecs.length.toLocaleString()} eksekusi
          </p>
        </div>

        {/* List */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div
                key={i}
                className="h-[68px] bg-[#141414] rounded-xl border border-white/[0.04] animate-pulse"
                style={{ opacity: Math.max(0.1, 1 - i * 0.12) }}
              />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <p className="text-white/40 text-sm mb-1">Tidak ada riwayat</p>
            <p className="text-white/20 text-xs max-w-xs leading-relaxed">
              {allExecs.length === 0
                ? 'Bot belum pernah dieksekusi. Mulai bot dari halaman Dashboard.'
                : 'Tidak ada data yang cocok dengan filter yang dipilih.'}
            </p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {paginated.map((exec) => (
              <ExecutionRow key={exec.id} exec={exec} />
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center gap-1 pt-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white hover:border-white/[0.15] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageNums().map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-xs font-medium border transition-colors ${
                  page === n
                    ? 'bg-white/10 border-white/[0.15] text-white'
                    : 'border-white/[0.06] text-white/25 hover:text-white/50 hover:border-white/10'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white/25 hover:text-white hover:border-white/[0.15] disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
}