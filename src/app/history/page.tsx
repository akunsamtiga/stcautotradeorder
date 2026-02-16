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

// ────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ────────────────────────────────────────────────────────────
const C = {
  bg:   '#000000',
  s1:   '#06110e',
  s2:   '#091a14',
  cyan: '#34d399',
  bdr:  'rgba(52,211,153,0.15)',
  coral:'#ff5263',
};

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────
// HELPERS
// ────────────────────────────────────────────────────────────
const fmt = {
  date: (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }),
  time: (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false }),
  duration: (min: number) => {
    if (min < 1) return `${Math.round(min * 60)}d`;
    return min >= 60 ? `${min / 60}j` : `${min}m`;
  },
  idr: (n: number) => `Rp ${Math.abs(n).toLocaleString('id-ID')}`,
};

const transformOrder = (order: BinaryOrder): ExecutionDisplay => {
  const trend = order.direction === 'CALL' ? 'buy' : 'sell';
  let result: 'win' | 'loss' | 'draw' | undefined;
  let status: 'pending' | 'active' | 'completed';
  if      (order.status === 'WON')    { result = 'win';  status = 'completed'; }
  else if (order.status === 'LOST')   { result = 'loss'; status = 'completed'; }
  else if (order.status === 'DRAW')   { result = 'draw'; status = 'completed'; }
  else if (order.status === 'ACTIVE') { status = 'active'; }
  else                                { status = 'pending'; }
  return { id: order.id, executedAt: order.createdAt, trend, assetSymbol: order.assetSymbol, amount: order.amount, duration: order.duration, accountType: order.accountType, status, result, profit: order.profit };
};

// ────────────────────────────────────────────────────────────
// CARD / PILL / STAT
// ────────────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div className="ds-card" style={{ background: `linear-gradient(135deg,${C.s1} 0%,${C.s2} 100%)`, border: `1px solid ${C.bdr}`, clipPath: 'polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))', ...style }}>
    {children}
  </div>
);

const Pill: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode; accent?: string }> = ({ active, onClick, children, accent = C.cyan }) => (
  <button onClick={onClick} style={{
    padding: '5px 10px',
    background: active ? `${accent}15` : 'rgba(255,255,255,0.04)',
    border: `1px solid ${active ? `${accent}40` : 'rgba(255,255,255,0.08)'}`,
    color: active ? accent : 'rgba(255,255,255,0.3)',
    fontFamily: 'var(--font-exo)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em',
    cursor: 'pointer', clipPath: 'polygon(0 0,calc(100% - 5px) 0,100% 5px,100% 100%,5px 100%,0 calc(100% - 5px))',
    transition: 'all 0.2s ease',
  }}>
    {children}
  </button>
);

const StatCard = ({ label, value, sub, accent = '#ffffff' }: { label: string; value: string | number; sub?: string; accent?: string }) => (
  <Card style={{ padding: '12px 14px' }}>
    <p style={{ fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 8 }}>{label}</p>
    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</p>
    {sub && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 4 }}>{sub}</p>}
  </Card>
);

// ────────────────────────────────────────────────────────────
// EXECUTION ROW
// ────────────────────────────────────────────────────────────
const ExecutionRow = ({ exec }: { exec: ExecutionDisplay }) => {
  const isBuy = exec.trend === 'buy';
  const resultCfg: Record<string, { label: string; col: string }> = {
    win:  { label: 'WIN',  col: C.cyan  },
    loss: { label: 'LOSS', col: C.coral },
    draw: { label: 'DRAW', col: 'rgba(255,255,255,0.5)' },
  };
  const rc = exec.result ? resultCfg[exec.result] : null;

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px',
      background: `linear-gradient(135deg,${C.s1},${C.s2})`,
      border: `1px solid ${C.bdr}`,
      clipPath: 'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',
      transition: 'all 0.2s ease',
    }}>
      {/* Icon */}
      <div style={{ width: 36, height: 36, background: isBuy ? 'rgba(52,211,153,0.08)' : 'rgba(255,82,99,0.08)', border: `1px solid ${isBuy ? 'rgba(52,211,153,0.2)' : 'rgba(255,82,99,0.2)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        {isBuy ? <TrendUp size={15} style={{ color: C.cyan }} weight="bold" /> : <TrendDown size={15} style={{ color: C.coral }} weight="bold" />}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{exec.assetSymbol}</span>
          <span style={{ fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, padding: '2px 6px', background: isBuy ? 'rgba(52,211,153,0.08)' : 'rgba(255,82,99,0.08)', color: isBuy ? C.cyan : C.coral }}>{exec.trend.toUpperCase()}</span>
          <span style={{ fontFamily: 'var(--font-exo)', fontSize: 10, padding: '2px 6px', background: 'rgba(255,255,255,0.04)', color: 'rgba(255,255,255,0.3)' }}>{exec.accountType.toUpperCase()}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3, fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.25)' }}>
          <Clock size={10} />
          <span>{fmt.date(exec.executedAt)} · {fmt.time(exec.executedAt)}</span>
          <span className="hidden sm:inline">· {fmt.duration(exec.duration)} · {fmt.idr(exec.amount)}</span>
        </div>
      </div>

      {/* Result */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {rc && (
          <span style={{ fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, padding: '2px 8px', background: `${rc.col}10`, border: `1px solid ${rc.col}30`, color: rc.col }}>
            {rc.label}
          </span>
        )}
        {exec.profit !== undefined && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, fontWeight: 700, color: exec.profit > 0 ? C.cyan : exec.profit < 0 ? C.coral : 'rgba(255,255,255,0.3)' }}>
            {exec.profit >= 0 ? '+' : '-'}{fmt.idr(exec.profit)}
          </span>
        )}
        {!exec.result && exec.status === 'active' && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#60a5fa80' }}>Active</span>
        )}
        {!exec.result && exec.status === 'pending' && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#fcd34d80' }}>Pending</span>
        )}
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// PAGE
// ────────────────────────────────────────────────────────────
export default function HistoryPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated, clearAuth } = useAuthStore();

  const [allExecs, setAllExecs] = useState<ExecutionDisplay[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      const statusMap: Record<string, Array<'PENDING'|'ACTIVE'|'WON'|'LOST'|'EXPIRED'>> = {
        all: [], win: ['WON'], loss: ['LOST'],
      };
      const query: { status?: 'PENDING'|'ACTIVE'|'WON'|'LOST'|'EXPIRED'; accountType?: 'demo'|'real'; page: number; limit: number } = { page, limit: PER_PAGE };
      if (filterResult !== 'all' && statusMap[filterResult]?.length) query.status = statusMap[filterResult][0];
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
      setError('Gagal memuat riwayat. Silakan coba lagi.');
      setAllExecs([]);
    } finally { setIsLoading(false); }
  }, [clearAuth, router, page, filterResult, filterAccount, filterTrend, search]);

  const handleRefresh = async () => { setIsRefreshing(true); await load(); setIsRefreshing(false); };

  const stats = allExecs.reduce(
    (acc, e) => { acc.total++; if (e.result==='win'){acc.wins++;acc.profit+=e.profit??0;} if(e.result==='loss'){acc.losses++;acc.profit+=e.profit??0;} if(e.result==='draw')acc.draws++; return acc; },
    { total:0,wins:0,losses:0,draws:0,profit:0 }
  );
  const winRate = stats.total > 0 ? (stats.wins / stats.total) * 100 : 0;

  const pageNums = () => {
    if (totalPages <= 5) return Array.from({ length: totalPages }, (_, i) => i + 1);
    if (page <= 3)              return [1,2,3,4,5];
    if (page >= totalPages - 2) return [totalPages-4,totalPages-3,totalPages-2,totalPages-1,totalPages];
    return [page-2,page-1,page,page+1,page+2];
  };

  if (!hasHydrated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 24, height: 24, border: `2px solid rgba(52,211,153,0.2)`, borderTopColor: C.cyan, borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 96 }}>
      {/* Header */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)', borderBottom: `1px solid rgba(52,211,153,0.1)` }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-exo)', fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ffffff' }}>Riwayat Eksekusi</h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>{totalOrders.toLocaleString()} transaksi</p>
          </div>
          <button onClick={handleRefresh} disabled={isRefreshing || isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, color: isRefreshing ? C.cyan : 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-exo)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', cursor: 'pointer', clipPath: 'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))' }}>
            <ArrowClockwise size={13} style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,82,99,0.06)', border: '1px solid rgba(255,82,99,0.2)', borderLeft: `2px solid ${C.coral}`, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ff8a94' }}>
            <WarningCircle size={14} /> {error}
          </div>
        )}

        {/* Stats */}
        {!isLoading && allExecs.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8 }}>
            <StatCard label="Eksekusi"    value={stats.total.toLocaleString()} />
            <StatCard label="Win Rate"    value={`${winRate.toFixed(1)}%`} sub={`${stats.wins}W·${stats.losses}L·${stats.draws}D`} accent={winRate >= 50 ? C.cyan : C.coral} />
            <StatCard label="Profit"      value={`${stats.profit >= 0 ? '+' : '-'}${(Math.abs(stats.profit)/1000).toFixed(0)}k`} accent={stats.profit >= 0 ? C.cyan : C.coral} />
            <StatCard label="Menang"      value={stats.wins} sub={`dari ${stats.total}`} accent={C.cyan} />
          </div>
        )}

        {/* Filters */}
        <Card style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <MagnifyingGlass size={13} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.25)' }} />
            <input
              type="text"
              placeholder="Cari simbol aset…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{ width: '100%', paddingLeft: 34, paddingRight: 12, paddingTop: 9, paddingBottom: 9, background: 'rgba(0,0,0,0.4)', border: `1px solid rgba(255,255,255,0.08)`, color: '#ffffff', fontFamily: 'var(--font-mono)', fontSize: 12, outline: 'none', transition: 'border-color 0.2s ease' }}
              onFocus={(e) => e.target.style.borderColor = 'rgba(52,211,153,0.4)'}
              onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.08)'}
            />
          </div>

          {/* Pills */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
            <Pill active={filterResult==='all'}  onClick={()=>setFilterResult('all')}>Semua</Pill>
            <Pill active={filterResult==='win'}  onClick={()=>setFilterResult('win')}  accent={C.cyan}>WIN</Pill>
            <Pill active={filterResult==='loss'} onClick={()=>setFilterResult('loss')} accent={C.coral}>LOSS</Pill>
            <Pill active={filterResult==='draw'} onClick={()=>setFilterResult('draw')}>DRAW</Pill>
            <span style={{ width: 1, background: 'rgba(255,255,255,0.07)', margin: '0 3px', alignSelf: 'stretch' }} />
            <Pill active={filterTrend==='all'}  onClick={()=>setFilterTrend('all')}>All</Pill>
            <Pill active={filterTrend==='buy'}  onClick={()=>setFilterTrend('buy')}  accent={C.cyan}>BUY</Pill>
            <Pill active={filterTrend==='sell'} onClick={()=>setFilterTrend('sell')} accent={C.coral}>SELL</Pill>
            <span style={{ width: 1, background: 'rgba(255,255,255,0.07)', margin: '0 3px', alignSelf: 'stretch' }} />
            <Pill active={filterAccount==='all'}  onClick={()=>setFilterAccount('all')}>Semua</Pill>
            <Pill active={filterAccount==='demo'} onClick={()=>setFilterAccount('demo')} accent={C.cyan}>Demo</Pill>
            <Pill active={filterAccount==='real'} onClick={()=>setFilterAccount('real')} accent={C.cyan}>Real</Pill>
          </div>

          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.2)' }}>
            Menampilkan {allExecs.length.toLocaleString()} transaksi
          </p>
        </Card>

        {/* List */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ height: 68, background: `linear-gradient(135deg,${C.s1},${C.s2})`, border: `1px solid ${C.bdr}`, animation: 'skeleton-pulse 2s ease infinite', opacity: Math.max(0.1, 1 - i * 0.1) }} />
            ))}
          </div>
        ) : allExecs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '60px 20px', gap: 8 }}>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 14, color: 'rgba(255,255,255,0.25)' }}>Tidak ada riwayat</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.15)', textAlign: 'center' }}>Tidak ada data yang cocok dengan filter yang dipilih.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {allExecs.map((exec) => <ExecutionRow key={exec.id} exec={exec} />)}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && !isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 4 }}>
            <button onClick={() => setPage(Math.max(1, page - 1))} disabled={page === 1}
              style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === 1 ? 0.3 : 1 }}>
              <CaretLeft size={14} />
            </button>
            {pageNums().map((n) => (
              <button key={n} onClick={() => setPage(n)}
                style={{ width: 32, height: 32, background: page===n ? 'rgba(52,211,153,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${page===n ? 'rgba(52,211,153,0.4)' : 'rgba(255,255,255,0.08)'}`, color: page===n ? C.cyan : 'rgba(255,255,255,0.35)', fontFamily: 'var(--font-mono)', fontSize: 12, cursor: 'pointer' }}>
                {n}
              </button>
            ))}
            <button onClick={() => setPage(Math.min(totalPages, page + 1))} disabled={page === totalPages}
              style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: page === totalPages ? 0.3 : 1 }}>
              <CaretRight size={14} />
            </button>
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}