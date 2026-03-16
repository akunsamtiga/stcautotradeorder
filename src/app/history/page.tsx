'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import {
  TrendUp, TrendDown, ArrowClockwise, WarningCircle,
  Clock, MagnifyingGlass, CaretLeft, CaretRight, X,
} from '@phosphor-icons/react';

// ─── DESIGN TOKENS — exact match with dashboard/globals ──────
const C = {
  bg:    '#0f0f0f',
  card:  '#1a1a1a',
  card2: '#141414',
  bdr:   'rgba(52,211,153,0.18)',
  bdrLo: 'rgba(255,255,255,0.06)',
  cyan:  '#34d399',
  cyand: 'rgba(52,211,153,0.10)',
  coral: '#f87171',
  cord:  'rgba(248,113,113,0.10)',
  text:  '#ffffff',
  sub:   'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.40)',
  faint: 'rgba(255,255,255,0.04)',
};

const ROW_STYLE: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.bdrLo}`,
  borderRadius: 10,
  transition: 'border-color 0.15s ease, background 0.15s ease',
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
  date: (iso: string) => new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short' }),
  time: (iso: string) => new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', hour12: false }),
  dur:  (s: number)   => s >= 3600 ? `${s/3600}j` : s >= 60 ? `${s/60}m` : `${s}d`,
  idr:  (n: number)   => `Rp ${Math.abs(n).toLocaleString('id-ID')}`,
  idrK: (n: number)   => Math.abs(n) >= 1_000_000
    ? `${(n/1_000_000).toFixed(1)}jt`
    : `${(n/1_000).toFixed(0)}k`,
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
  return { id: o.id, executedAt: o.createdAt, trend, assetSymbol: o.assetSymbol,
    amount: o.amount, duration: o.duration, accountType: o.accountType, status, result, profit: o.profit };
};

// ─── SKELETON ─────────────────────────────────────────────────
const skBase: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-pulse 1.6s ease infinite',
  borderRadius: 5,
};
const Sk = ({ w = '100%', h = 12 }: { w?: string | number; h?: number }) => (
  <div style={{ width: w, height: h, ...skBase }} />
);

// ─── FILTER PILL ──────────────────────────────────────────────
const Pill: React.FC<{
  active: boolean; onClick: () => void; children: React.ReactNode; accent?: string;
}> = ({ active, onClick, children, accent = C.cyan }) => (
  <button
    onClick={onClick}
    style={{
      padding: '4px 10px',
      background: active ? `${accent}14` : 'transparent',
      border: `1px solid ${active ? `${accent}35` : 'rgba(255,255,255,0.08)'}`,
      borderRadius: 6,
      color: active ? accent : C.muted,
      fontSize: 11,
      fontWeight: active ? 600 : 400,
      letterSpacing: '0.04em',
      cursor: 'pointer',
      transition: 'all 0.15s ease',
      whiteSpace: 'nowrap',
    }}
  >
    {children}
  </button>
);

// ─── STAT MINI ────────────────────────────────────────────────
const StatMini = ({
  label, value, accent = C.muted
}: { label: string; value: string | number; accent?: string }) => (
  <div
    style={{
      flex: 1,
      padding: '10px 12px',
      background: C.card,
      border: `1px solid ${C.bdrLo}`,
      borderRadius: 10,
      minWidth: 0,
    }}
  >
    <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: 4 }}>
      {label}
    </p>
    <p style={{ fontSize: 18, fontWeight: 700, color: accent, lineHeight: 1 }}>
      {value}
    </p>
  </div>
);

// ─── EXECUTION ROW ────────────────────────────────────────────
const ExecutionRow = ({ exec }: { exec: ExecutionDisplay }) => {
  const isBuy = exec.trend === 'buy';
  const trendCol = isBuy ? C.cyan : C.coral;
  const resultMap = {
    win:  { label: 'WIN',  bg: 'rgba(52,211,153,0.10)',  col: C.cyan,  bdr: 'rgba(52,211,153,0.22)' },
    loss: { label: 'LOSS', bg: 'rgba(248,113,113,0.10)', col: C.coral, bdr: 'rgba(248,113,113,0.22)' },
    draw: { label: 'DRAW', bg: 'rgba(255,255,255,0.05)', col: C.muted, bdr: 'rgba(255,255,255,0.10)' },
  };
  const rc = exec.result ? resultMap[exec.result] : null;
  const profitPositive = exec.profit !== undefined && exec.profit > 0;
  const profitNegative = exec.profit !== undefined && exec.profit < 0;

  return (
    <div
      className="flex items-center gap-3 px-3.5 py-2.5"
      style={ROW_STYLE}
      onMouseEnter={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.bdr;
        (e.currentTarget as HTMLDivElement).style.background = '#1e1e1e';
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLDivElement).style.borderColor = C.bdrLo;
        (e.currentTarget as HTMLDivElement).style.background = C.card;
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 32, height: 32, borderRadius: 8, display: 'flex',
          alignItems: 'center', justifyContent: 'center', flexShrink: 0,
          background: isBuy ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
        }}
      >
        {isBuy
          ? <TrendUp  size={14} weight="bold" color={C.cyan} />
          : <TrendDown size={14} weight="bold" color={C.coral} />}
      </div>

      {/* Main info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{exec.assetSymbol}</span>
          <span style={{
            fontSize: 9, fontWeight: 700, color: trendCol,
            background: isBuy ? 'rgba(52,211,153,0.08)' : 'rgba(248,113,113,0.08)',
            padding: '1px 5px', borderRadius: 4,
            letterSpacing: '0.06em',
          }}>
            {exec.trend.toUpperCase()}
          </span>
          <span style={{
            fontSize: 9, color: 'rgba(255,255,255,0.25)',
            background: 'rgba(255,255,255,0.04)',
            padding: '1px 5px', borderRadius: 4,
            textTransform: 'uppercase', letterSpacing: '0.04em',
          }}>
            {exec.accountType}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginTop: 3 }}>
          <Clock size={9} color="rgba(255,255,255,0.18)" />
          <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)' }}>
            {fmt.date(exec.executedAt)} · {fmt.time(exec.executedAt)}
            <span className="hidden sm:inline"> · {fmt.dur(exec.duration)} · {fmt.idr(exec.amount)}</span>
          </span>
        </div>
      </div>

      {/* Right side */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4, flexShrink: 0 }}>
        {rc && (
          <span style={{
            fontSize: 9, fontWeight: 700, letterSpacing: '0.06em',
            color: rc.col, background: rc.bg, border: `1px solid ${rc.bdr}`,
            padding: '2px 7px', borderRadius: 5,
          }}>
            {rc.label}
          </span>
        )}
        {exec.profit !== undefined && (
          <span style={{
            fontSize: 12, fontWeight: 600,
            color: profitPositive ? C.cyan : profitNegative ? C.coral : C.muted,
          }}>
            {exec.profit >= 0 ? '+' : '−'}{fmt.idr(exec.profit)}
          </span>
        )}
        {!exec.result && exec.status === 'active' && (
          <span style={{ fontSize: 10, color: 'rgba(96,165,250,0.55)' }}>Active</span>
        )}
        {!exec.result && exec.status === 'pending' && (
          <span style={{ fontSize: 10, color: 'rgba(251,191,36,0.55)' }}>Pending</span>
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
  const [searchFocused, setSearchFocused] = useState(false);
  const PER_PAGE = 25;

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/'); return; }
    if (!hasFetchedRef.current) { hasFetchedRef.current = true; load(); }
  }, [hasHydrated, isAuthenticated]); // eslint-disable-line

  useEffect(() => {
    if (hasFetchedRef.current && hasHydrated && isAuthenticated) load();
  }, [filterResult, filterAccount, filterTrend, search, page]); // eslint-disable-line

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

  const handleRefresh = async () => {
    setIsRefreshing(true);
    hasFetchedRef.current = true;
    await load();
    setIsRefreshing(false);
  };

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

  const hasActiveFilters = filterResult !== 'all' || filterAccount !== 'all' || filterTrend !== 'all' || search !== '';

  const clearFilters = () => {
    setFilterResult('all'); setFilterAccount('all');
    setFilterTrend('all'); setSearch('');
  };

  // ── Loading gate ──────────────────────────────────────────────
  if (!hasHydrated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: `2px solid rgba(52,211,153,0.15)`,
        borderTopColor: C.cyan,
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 88, background: C.bg }}>

      {/* ── Sticky header ─────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(15,15,15,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
      }}>
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontSize: 14, fontWeight: 700, color: C.text, letterSpacing: '0.02em' }}>History</h1>
            <p style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>
              {isLoading ? '—' : `${totalOrders.toLocaleString()} transaksi`}
            </p>
          </div>

          <button
            onClick={handleRefresh}
            disabled={isRefreshing || isLoading}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 12px',
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.08)',
              borderRadius: 7,
              color: isRefreshing ? C.cyan : C.muted,
              fontSize: 11, cursor: 'pointer',
              transition: 'all 0.15s ease',
              opacity: (isRefreshing || isLoading) ? 0.4 : 1,
            }}
          >
            <ArrowClockwise
              size={12}
              style={{ animation: isRefreshing ? 'spin 0.8s linear infinite' : 'none' }}
            />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '0 auto', padding: '16px 16px 0' }}>

        {/* ── Error ──────────────────────────────────────────── */}
        {error && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px',
            background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)',
            borderLeft: `2px solid ${C.coral}`,
            borderRadius: 9, marginBottom: 12,
            fontSize: 12, color: '#fca5a5',
          }}>
            <WarningCircle size={13} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* ── Stats row ──────────────────────────────────────── */}
        {isLoading ? (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            {[1,2,3,4].map(i => (
              <div key={i} style={{ flex: 1, padding: '10px 12px', background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 10 }}>
                <Sk w="55%" h={9} />
                <div style={{ marginTop: 6 }}><Sk w="70%" h={20} /></div>
              </div>
            ))}
          </div>
        ) : allExecs.length > 0 && (
          <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
            <StatMini label="Total" value={stats.total} />
            <StatMini
              label="Win Rate"
              value={`${winRate.toFixed(0)}%`}
              accent={winRate >= 50 ? C.cyan : C.coral}
            />
            <StatMini
              label="Profit"
              value={(stats.profit >= 0 ? '+' : '') + fmt.idrK(stats.profit)}
              accent={stats.profit >= 0 ? C.cyan : C.coral}
            />
            <StatMini label="Menang" value={stats.wins} accent={C.cyan} />
          </div>
        )}

        {/* ── Search ─────────────────────────────────────────── */}
        <div style={{ position: 'relative', marginBottom: 8 }}>
          <MagnifyingGlass
            size={13}
            style={{
              position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)',
              color: searchFocused ? C.cyan : C.muted,
              transition: 'color 0.15s ease',
            }}
          />
          <input
            type="text"
            placeholder="Cari aset…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setSearchFocused(false)}
            style={{
              width: '100%', padding: '9px 11px 9px 30px',
              background: C.card,
              border: `1px solid ${searchFocused ? C.bdr : C.bdrLo}`,
              borderRadius: 9,
              color: C.text, fontSize: 12,
              outline: 'none',
              transition: 'border-color 0.15s ease',
              fontFamily: 'inherit',
            }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute', right: 9, top: '50%', transform: 'translateY(-50%)',
                background: 'none', border: 'none', cursor: 'pointer',
                color: C.muted, display: 'flex', alignItems: 'center',
              }}
            >
              <X size={11} />
            </button>
          )}
        </div>

        {/* ── Filter pills ───────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap', marginBottom: 14 }}>
          {/* Result */}
          <Pill active={filterResult==='all'}  onClick={()=>setFilterResult('all')}>Semua</Pill>
          <Pill active={filterResult==='win'}  onClick={()=>setFilterResult('win')}  accent={C.cyan}>Win</Pill>
          <Pill active={filterResult==='loss'} onClick={()=>setFilterResult('loss')} accent={C.coral}>Loss</Pill>
          <Pill active={filterResult==='draw'} onClick={()=>setFilterResult('draw')}>Draw</Pill>

          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />

          {/* Trend */}
          <Pill active={filterTrend==='buy'}  onClick={()=>setFilterTrend(filterTrend==='buy'?'all':'buy')}  accent={C.cyan}>Buy</Pill>
          <Pill active={filterTrend==='sell'} onClick={()=>setFilterTrend(filterTrend==='sell'?'all':'sell')} accent={C.coral}>Sell</Pill>

          <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />

          {/* Account */}
          <Pill active={filterAccount==='demo'} onClick={()=>setFilterAccount(filterAccount==='demo'?'all':'demo')}>Demo</Pill>
          <Pill active={filterAccount==='real'} onClick={()=>setFilterAccount(filterAccount==='real'?'all':'real')}>Real</Pill>

          {/* Clear all */}
          {hasActiveFilters && (
            <>
              <span style={{ width: 1, height: 16, background: 'rgba(255,255,255,0.07)', margin: '0 2px' }} />
              <button
                onClick={clearFilters}
                style={{
                  padding: '4px 10px', background: 'transparent',
                  border: '1px solid rgba(248,113,113,0.2)',
                  borderRadius: 6, color: C.coral, fontSize: 11, cursor: 'pointer',
                  letterSpacing: '0.04em',
                  transition: 'all 0.15s ease',
                }}
              >
                Reset
              </button>
            </>
          )}
        </div>

        {/* ── Count label ────────────────────────────────────── */}
        {!isLoading && allExecs.length > 0 && (
          <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.18)', marginBottom: 8, letterSpacing: '0.04em' }}>
            {allExecs.length.toLocaleString()} HASIL
          </p>
        )}

        {/* ── List ───────────────────────────────────────────── */}
        {isLoading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {Array.from({ length: 7 }).map((_, i) => (
              <div
                key={i}
                style={{ ...ROW_STYLE, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 12, opacity: 1 - i * 0.1 }}
              >
                <div style={{ width: 32, height: 32, borderRadius: 8, ...skBase, flexShrink: 0 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    <Sk w={70} h={11} /><Sk w={32} h={11} /><Sk w={32} h={11} />
                  </div>
                  <Sk w="48%" h={9} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 5 }}>
                  <Sk w={36} h={16} /><Sk w={55} h={11} />
                </div>
              </div>
            ))}
          </div>
        ) : allExecs.length === 0 ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '64px 0', gap: 6 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.18)' }}>Tidak ada riwayat</p>
            <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.1)', textAlign: 'center' }}>
              Tidak ada data yang cocok dengan filter yang dipilih.
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                style={{
                  marginTop: 8, padding: '6px 14px',
                  background: 'transparent', border: `1px solid ${C.bdr}`,
                  borderRadius: 7, color: C.cyan, fontSize: 12, cursor: 'pointer',
                }}
              >
                Reset filter
              </button>
            )}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {allExecs.map(exec => <ExecutionRow key={exec.id} exec={exec} />)}
          </div>
        )}

        {/* ── Pagination ─────────────────────────────────────── */}
        {totalPages > 1 && !isLoading && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, paddingTop: 16 }}>
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: `1px solid ${C.bdrLo}`,
                borderRadius: 7, color: C.muted, cursor: 'pointer',
                opacity: page === 1 ? 0.3 : 1, transition: 'all 0.15s ease',
              }}
            >
              <CaretLeft size={12} />
            </button>

            {pageNums().map(n => (
              <button
                key={n}
                onClick={() => setPage(n)}
                style={{
                  width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: page === n ? 'rgba(52,211,153,0.10)' : 'transparent',
                  border: `1px solid ${page === n ? 'rgba(52,211,153,0.30)' : C.bdrLo}`,
                  borderRadius: 7,
                  color: page === n ? C.cyan : C.muted,
                  fontSize: 12, fontWeight: page === n ? 600 : 400,
                  cursor: 'pointer', transition: 'all 0.15s ease',
                }}
              >
                {n}
              </button>
            ))}

            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              disabled={page === totalPages}
              style={{
                width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: 'transparent', border: `1px solid ${C.bdrLo}`,
                borderRadius: 7, color: C.muted, cursor: 'pointer',
                opacity: page === totalPages ? 0.3 : 1, transition: 'all 0.15s ease',
              }}
            >
              <CaretRight size={12} />
            </button>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
}