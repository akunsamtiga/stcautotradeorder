// PATH: app/history/page.tsx
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import {
  History,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Clock,
  DollarSign,
  BarChart2,
  Activity,
  Filter,
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
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
const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });

const formatTime = (iso: string) =>
  new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });

const formatDuration = (sec: number) => {
  if (sec >= 3600) return `${sec / 3600}j`;
  if (sec >= 60)   return `${sec / 60}m`;
  return `${sec}d`;
};

// ============================================================================
// STAT CARD
// ============================================================================
const StatCard = ({
  label, value, sub, accent, icon,
}: {
  label: string; value: string | number; sub?: string;
  accent: 'gray' | 'emerald' | 'red'; icon: React.ReactNode;
}) => {
  const colors = {
    gray:    { text: 'text-white',        bg: 'bg-white/5',         border: '' },
    emerald: { text: 'text-emerald-400',  bg: 'bg-emerald-500/10',  border: '' },
    red:     { text: 'text-red-400',      bg: 'bg-red-500/10',      border: '' },
  }[accent];

  return (
    <div className="bg-gradient-to-br from-[#1a1a1a] to-[#141414] rounded-xl border border-white/[0.05] p-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-[11px] uppercase tracking-widest text-gray-600">{label}</p>
        <div className={`p-1.5 rounded-lg ${colors.bg}`}>{icon}</div>
      </div>
      <p className={`text-2xl font-bold font-mono tabular-nums ${colors.text}`}>{value}</p>
      {sub && <p className="text-[11px] text-gray-600 mt-0.5">{sub}</p>}
    </div>
  );
};

// ============================================================================
// PILL FILTER BUTTON
// ============================================================================
const Pill = ({
  active, onClick, children, activeColor = 'emerald',
}: { active: boolean; onClick: () => void; children: React.ReactNode; activeColor?: 'emerald' | 'red' | 'gray' }) => {
  const activeMap = {
    emerald: 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300',
    red:     'bg-red-500/20 border-red-500/30 text-red-300',
    gray:    'bg-white/8 border-white/12 text-gray-200',
  };
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all ${
        active
          ? activeMap[activeColor]
          : 'border-white/[0.06] text-gray-600 hover:text-gray-300 hover:border-white/12'
      }`}
    >
      {children}
    </button>
  );
};

// ============================================================================
// EXECUTION ROW
// ============================================================================
const ExecutionRow = ({ exec }: { exec: Execution }) => {
  const resultMap = {
    win:  { label: 'WIN',  cls: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/25', dot: 'bg-emerald-400' },
    loss: { label: 'LOSS', cls: 'bg-red-500/15 text-red-400 border-red-500/25',             dot: 'bg-red-400'     },
    draw: { label: 'DRAW', cls: 'bg-gray-600/20 text-gray-400 border-gray-600/25',          dot: 'bg-gray-500'    },
  };
  const rc = exec.result ? resultMap[exec.result] : null;

  return (
    <div className="flex items-center gap-3 p-3.5 bg-[#131313] hover:bg-[#191919] rounded-xl border border-white/[0.04] hover:border-emerald-500/12 transition-all duration-150 group">
      {/* Trend icon */}
      <div className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center border ${
        exec.trend === 'buy' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'
      }`}>
        {exec.trend === 'buy'
          ? <TrendingUp  className="w-4 h-4 text-emerald-400" />
          : <TrendingDown className="w-4 h-4 text-red-400" />
        }
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-sm font-semibold text-white font-mono">{exec.assetSymbol}</span>
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${
            exec.trend === 'buy'
              ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              : 'text-red-400 bg-red-500/10 border-red-500/20'
          }`}>{exec.trend.toUpperCase()}</span>
          <span className="text-[10px] px-1.5 py-0.5 rounded border border-white/8 text-gray-600">
            {exec.accountType.toUpperCase()}
          </span>
          {(exec.martingaleStep ?? 0) > 0 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded border border-orange-500/25 bg-orange-500/10 text-orange-400">
              M{exec.martingaleStep}
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-700">
          <Clock className="w-3 h-3 flex-shrink-0" />
          <span>{formatDate(exec.executedAt)}</span>
          <span>·</span>
          <span>{formatTime(exec.executedAt)}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">{formatDuration(exec.duration)}</span>
          <span className="hidden sm:inline">·</span>
          <span className="hidden sm:inline">Rp {exec.amount.toLocaleString('id-ID')}</span>
        </div>
      </div>

      {/* Result + Profit */}
      <div className="flex flex-col items-end gap-1 flex-shrink-0">
        {rc && (
          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md border ${rc.cls}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${rc.dot}`} />
            {rc.label}
          </span>
        )}
        {exec.profit !== undefined && (
          <span className={`text-sm font-bold font-mono tabular-nums ${
            exec.profit > 0 ? 'text-emerald-400' : exec.profit < 0 ? 'text-red-400' : 'text-gray-500'
          }`}>
            {exec.profit >= 0 ? '+' : ''}Rp {Math.abs(exec.profit).toLocaleString('id-ID')}
          </span>
        )}
        {!rc && exec.status === 'failed' && (
          <span className="text-[11px] text-red-500">Gagal</span>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// HISTORY PAGE
// ============================================================================
export default function HistoryPage() {
  const router   = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const clearAuth = useAuthStore((s) => s.clearAuth);

  const [allExecs,     setAllExecs]     = useState<Execution[]>([]);
  const [isLoading,    setIsLoading]    = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Filters
  const [filterResult,  setFilterResult]  = useState<'all' | 'win' | 'loss' | 'draw'>('all');
  const [filterAccount, setFilterAccount] = useState<'all' | 'demo' | 'real'>('all');
  const [filterTrend,   setFilterTrend]   = useState<'all' | 'buy' | 'sell'>('all');
  const [search,        setSearch]        = useState('');
  const [page,          setPage]          = useState(1);
  const PER_PAGE = 25;

  // Auth guard
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

  // ── Filter ──
  const filtered = allExecs.filter((e) => {
    if (filterResult  !== 'all' && e.result      !== filterResult)  return false;
    if (filterAccount !== 'all' && e.accountType !== filterAccount) return false;
    if (filterTrend   !== 'all' && e.trend       !== filterTrend)   return false;
    if (search && !e.assetSymbol.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });
  const totalPages = Math.max(1, Math.ceil(filtered.length / PER_PAGE));
  const paginated  = filtered.slice((page - 1) * PER_PAGE, page * PER_PAGE);

  // ── Stats ──
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

  // ── Pagination numbers ──
  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)              return [1, 2, 3, 4, 5];
    if (page >= totalPages - 2) return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    return [page - 2, page - 1, page, page + 1, page + 2];
  };

  // ── Loading / auth states ──
  if (!hasHydrated) return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0c0c0c] pb-24">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-[#0c0c0c]/95 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-3xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
              <History className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white leading-none">Riwayat Eksekusi</h1>
              <p className="text-[11px] text-gray-600 mt-0.5">
                {allExecs.length.toLocaleString()} total transaksi
              </p>
            </div>
          </div>
          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/8 text-gray-500 hover:text-white hover:border-emerald-500/30 transition-all text-xs disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-5 space-y-4">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-3 p-4 bg-red-500/8 border border-red-500/20 rounded-xl text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" /> {error}
          </div>
        )}

        {/* ── STATS ── */}
        {!isLoading && allExecs.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            <StatCard
              label="Eksekusi"
              value={stats.total.toLocaleString()}
              accent="gray"
              icon={<Activity className="w-3.5 h-3.5 text-gray-500" />}
            />
            <StatCard
              label="Win Rate"
              value={`${winRate.toFixed(1)}%`}
              sub={`${stats.wins}W · ${stats.losses}L · ${stats.draws}D`}
              accent="emerald"
              icon={<BarChart2 className="w-3.5 h-3.5 text-emerald-400" />}
            />
            <StatCard
              label="Total Profit"
              value={`${stats.profit >= 0 ? '+' : ''}${(Math.abs(stats.profit) / 1000).toFixed(0)}k`}
              accent={stats.profit >= 0 ? 'emerald' : 'red'}
              icon={<DollarSign className={`w-3.5 h-3.5 ${stats.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />}
            />
            <StatCard
              label="Berhasil"
              value={`${stats.wins}`}
              sub={`dari ${stats.total} eksekusi`}
              accent="emerald"
              icon={<CheckCircle className="w-3.5 h-3.5 text-emerald-400" />}
            />
          </div>
        )}

        {/* ── FILTERS ── */}
        <div className="bg-[#141414] rounded-xl border border-white/[0.05] p-4 space-y-3">
          <p className="flex items-center gap-1.5 text-[11px] text-gray-600">
            <Filter className="w-3 h-3" /> Filter & Pencarian
          </p>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-700" />
            <input
              type="text"
              placeholder="Cari simbol aset…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-4 py-2 text-sm bg-[#0f0f0f] border border-white/6 rounded-lg text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500/30 transition-colors"
            />
          </div>

          {/* Pills */}
          <div className="flex flex-wrap gap-1.5">
            {/* Result */}
            <Pill active={filterResult === 'all'}  onClick={() => setFilterResult('all')}  activeColor="gray">Semua</Pill>
            <Pill active={filterResult === 'win'}  onClick={() => setFilterResult('win')}  activeColor="emerald">WIN</Pill>
            <Pill active={filterResult === 'loss'} onClick={() => setFilterResult('loss')} activeColor="red">LOSS</Pill>
            <Pill active={filterResult === 'draw'} onClick={() => setFilterResult('draw')} activeColor="gray">DRAW</Pill>
            <span className="w-px bg-white/6 self-stretch mx-0.5" />
            {/* Trend */}
            <Pill active={filterTrend === 'all'}  onClick={() => setFilterTrend('all')}  activeColor="gray">All</Pill>
            <Pill active={filterTrend === 'buy'}  onClick={() => setFilterTrend('buy')}  activeColor="emerald">BUY</Pill>
            <Pill active={filterTrend === 'sell'} onClick={() => setFilterTrend('sell')} activeColor="red">SELL</Pill>
            <span className="w-px bg-white/6 self-stretch mx-0.5" />
            {/* Account */}
            <Pill active={filterAccount === 'all'}  onClick={() => setFilterAccount('all')}  activeColor="gray">Demo+Real</Pill>
            <Pill active={filterAccount === 'demo'} onClick={() => setFilterAccount('demo')} activeColor="emerald">Demo</Pill>
            <Pill active={filterAccount === 'real'} onClick={() => setFilterAccount('real')} activeColor="emerald">Real</Pill>
          </div>

          <p className="text-[11px] text-gray-700">
            {filtered.length.toLocaleString()} dari {allExecs.length.toLocaleString()} eksekusi
          </p>
        </div>

        {/* ── LIST ── */}
        {isLoading ? (
          <div className="space-y-2">
            {Array.from({ length: 10 }).map((_, i) => (
              <div
                key={i}
                className="h-[72px] bg-[#131313] rounded-xl border border-white/5 animate-pulse"
                style={{ opacity: Math.max(0.15, 1 - i * 0.09) }}
              />
            ))}
          </div>
        ) : paginated.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] border border-white/6 flex items-center justify-center mb-4">
              <Calendar className="w-7 h-7 text-gray-700" />
            </div>
            <p className="text-gray-400 font-medium text-sm mb-1">Tidak ada riwayat</p>
            <p className="text-gray-700 text-xs max-w-xs leading-relaxed">
              {allExecs.length === 0
                ? 'Bot belum pernah dieksekusi. Mulai bot dari halaman Dashboard.'
                : 'Tidak ada data yang cocok dengan filter yang dipilih.'}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {paginated.map((exec) => (
              <ExecutionRow key={exec.id} exec={exec} />
            ))}
          </div>
        )}

        {/* ── PAGINATION ── */}
        {totalPages > 1 && !isLoading && (
          <div className="flex items-center justify-center gap-1.5 pt-1">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-8 h-8 rounded-lg border border-white/8 flex items-center justify-center text-gray-600 hover:text-white hover:border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {pageNums().map((n) => (
              <button
                key={n}
                onClick={() => setPage(n)}
                className={`w-8 h-8 rounded-lg text-xs font-medium border transition-all ${
                  page === n
                    ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                    : 'border-white/6 text-gray-600 hover:text-gray-300 hover:border-white/12'
                }`}
              >
                {n}
              </button>
            ))}
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              className="w-8 h-8 rounded-lg border border-white/8 flex items-center justify-center text-gray-600 hover:text-white hover:border-emerald-500/30 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
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