'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import {
  User, EnvelopeSimple, Phone, ShieldCheck, SignOut,
  PencilSimple, Check, X, ArrowClockwise, WarningCircle,
  CheckCircle, Medal, Star, Lightning, UserCircle,
  Robot, ArrowRight,
} from '@phosphor-icons/react';

// ─── TOKENS — synced with dashboard ──────────────────────────
const C = {
  bg:    '#050807',
  card:  '#111915',
  card2: '#141f1a',
  bdr:   'rgba(52,211,153,0.22)',
  cyan:  '#34d399',
  coral: '#f87171',
  text:  '#f0faf6',
  sub:   '#e8f5f1',
  muted: 'rgba(255,255,255,0.45)',
  faint: 'rgba(255,255,255,0.05)',
};

const cardStyle: React.CSSProperties = {
  background: C.card,
  border: `1px solid ${C.bdr}`,
  boxShadow: '0 0 0 1px rgba(52,211,153,0.06), 0 4px 18px rgba(52,211,153,0.07), 0 2px 8px rgba(0,0,0,0.3)',
};

// ─── TYPES ────────────────────────────────────────────────────
interface UserProfile {
  user: any;
  profileInfo: any;
  statusInfo: {
    current: 'standard' | 'gold' | 'vip';
    totalDeposit: number;
    profitBonus: string;
    nextStatus?: string;
    progress?: number;
    depositNeeded?: number;
  };
  balances: { real: number; demo: number; combined: number };
}

// ─── SKELETON ─────────────────────────────────────────────────
const skeletonStyle = {
  background: 'linear-gradient(90deg, #1a2420 25%, #22302a 50%, #1a2420 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-pulse 1.6s ease infinite',
} as const;

const Skeleton = ({ w = '100%', h = 16, className = '' }: { w?: string | number; h?: number; className?: string }) => (
  <div className={`rounded-md ${className}`} style={{ width: w, height: h, ...skeletonStyle }} />
);

// ─── AVATAR ───────────────────────────────────────────────────
const Avatar = ({ name, email, avatarUrl }: { name?: string; email: string; avatarUrl?: string }) => {
  const initials = name
    ? name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
    : email[0].toUpperCase();

  if (avatarUrl) return (
    <div className="w-16 h-16 rounded-full overflow-hidden shrink-0" style={{ border: `2px solid ${C.bdr}` }}>
      <img src={avatarUrl} alt={name || email} className="w-full h-full object-cover" />
    </div>
  );

  return (
    <div
      className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
      style={{ background: C.card2, border: `2px solid rgba(52,211,153,0.3)` }}
    >
      <span className="text-[22px] font-semibold" style={{ color: C.cyan }}>{initials}</span>
    </div>
  );
};

// ─── STATUS ───────────────────────────────────────────────────
const statusCfg = {
  standard: { label: 'Standard', Icon: UserCircle, col: '#9ca3af', dim: 'rgba(156,163,175,0.1)' },
  gold:     { label: 'Gold',     Icon: Medal,      col: '#fcd34d', dim: 'rgba(252,211,77,0.1)'  },
  vip:      { label: 'VIP',      Icon: Star,       col: '#c084fc', dim: 'rgba(192,132,252,0.1)' },
} as const;

const StatusBadge = ({ status }: { status: 'standard' | 'gold' | 'vip' }) => {
  const { label, Icon, col, dim } = statusCfg[status] ?? statusCfg.standard;
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-[3px] rounded-md"
      style={{ color: col, background: dim, border: `1px solid ${col}35` }}
    >
      <Icon size={11} weight="fill" />{label}
    </span>
  );
};

// ─── STATUS CARD ──────────────────────────────────────────────
const StatusCard = ({ statusInfo, isLoading }: { statusInfo: UserProfile['statusInfo']; isLoading: boolean }) => {
  if (isLoading) return (
    <div className="rounded-xl p-5 flex flex-col gap-4" style={cardStyle}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg" style={skeletonStyle} />
          <div className="flex flex-col gap-2">
            <Skeleton w={60} h={9} />
            <Skeleton w={80} h={18} />
          </div>
        </div>
        <div className="flex flex-col items-end gap-2">
          <Skeleton w={60} h={9} />
          <Skeleton w={50} h={22} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="p-3 rounded-lg flex flex-col gap-2" style={{ background: 'rgba(0,0,0,0.25)' }}><Skeleton w="50%" h={9} /><Skeleton w="80%" h={16} /></div>
        <div className="p-3 rounded-lg flex flex-col gap-2" style={{ background: 'rgba(0,0,0,0.25)' }}><Skeleton w="50%" h={9} /><Skeleton w="80%" h={16} /></div>
      </div>
      <div className="flex flex-col gap-2"><Skeleton h={9} w="60%" /><Skeleton h={4} /></div>
    </div>
  );

  const { col } = statusCfg[statusInfo.current] ?? statusCfg.standard;
  const progress = statusInfo.progress || 0;

  return (
    <div className="rounded-xl p-5 relative overflow-hidden" style={cardStyle}>
      <div className="absolute top-0 left-1/4 right-1/4 h-px" style={{ background: `linear-gradient(90deg,transparent,${col}70,transparent)` }} />

      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center"
            style={{ background: `${col}12`, border: `1px solid ${col}25` }}
          >
            {statusInfo.current === 'standard' && <UserCircle size={18} style={{ color: col }} />}
            {statusInfo.current === 'gold'     && <Medal  size={18} weight="fill" style={{ color: col }} />}
            {statusInfo.current === 'vip'      && <Star   size={18} weight="fill" style={{ color: col }} />}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Status Akun</p>
            <StatusBadge status={statusInfo.current} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Profit Bonus</p>
          <p className="text-[18px] font-semibold" style={{ color: col }}>{statusInfo.profitBonus}</p>
        </div>
      </div>

      <div className={`grid ${statusInfo.nextStatus ? 'grid-cols-2' : 'grid-cols-1'} gap-2 mb-4`}>
        {[
          { label: 'Total Deposit', val: `Rp ${statusInfo.totalDeposit.toLocaleString('id-ID')}` },
          ...(statusInfo.nextStatus ? [{ label: 'Dibutuhkan', val: `Rp ${(statusInfo.depositNeeded || 0).toLocaleString('id-ID')}` }] : []),
        ].map(s => (
          <div key={s.label} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(52,211,153,0.08)` }}>
            <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>{s.label}</p>
            <p className="text-[13px] font-semibold" style={{ color: C.text }}>{s.val}</p>
          </div>
        ))}
      </div>

      {statusInfo.nextStatus && progress < 100 && (
        <div>
          <div className="flex justify-between mb-1.5">
            <p className="text-[11px]" style={{ color: C.muted }}>
              Progress ke <span className="font-semibold" style={{ color: col }}>{statusInfo.nextStatus}</span>
            </p>
            <p className="text-[11px]" style={{ color: C.muted }}>{progress.toFixed(1)}%</p>
          </div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.35)' }}>
            <div
              className="h-full rounded-full transition-[width] duration-500"
              style={{ width: `${progress}%`, background: `linear-gradient(to right,${col},${col}70)` }}
            />
          </div>
        </div>
      )}

      {statusInfo.current === 'vip' && (
        <div
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-lg"
          style={{ background: 'rgba(192,132,252,0.07)', border: '1px solid rgba(192,132,252,0.18)' }}
        >
          <Lightning size={13} weight="fill" style={{ color: '#c084fc' }} />
          <span className="text-[11px]" style={{ color: 'rgba(192,132,252,0.8)' }}>Status tertinggi tercapai! 🎉</span>
        </div>
      )}
    </div>
  );
};

// ─── INFO ROW ─────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, verified }: {
  icon: React.ReactNode; label: string; value?: string; verified?: boolean;
}) => (
  <div className="flex items-center gap-3 py-3" style={{ borderBottom: `1px solid rgba(52,211,153,0.06)` }}>
    <div
      className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
      style={{ background: C.faint, border: `1px solid rgba(52,211,153,0.1)`, color: C.muted }}
    >
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-widest mb-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>{label}</p>
      <p className="text-[13px] truncate" style={{ color: C.text }}>{value || '—'}</p>
    </div>
    {verified !== undefined && (
      <span
        className="flex items-center gap-1 text-[10px] font-medium px-2 py-[3px] rounded-md"
        style={{
          color: verified ? C.cyan : '#fcd34d',
          background: verified ? 'rgba(52,211,153,0.07)' : 'rgba(252,211,77,0.07)',
          border: `1px solid ${verified ? 'rgba(52,211,153,0.2)' : 'rgba(252,211,77,0.2)'}`,
        }}
      >
        {verified ? <CheckCircle size={10} weight="fill" /> : <WarningCircle size={10} weight="fill" />}
        {verified ? 'Verified' : 'Unverified'}
      </span>
    )}
  </div>
);

// ─── EDITABLE FIELD ───────────────────────────────────────────
const EditableField = ({ icon, label, value, onSave, placeholder }: {
  icon: React.ReactNode; label: string; value?: string;
  onSave: (v: string) => Promise<void>; placeholder: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(value || '');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const handleSave = async () => {
    if (!val.trim()) { setErr('Field tidak boleh kosong'); return; }
    setSaving(true); setErr('');
    try   { await onSave(val); setEditing(false); }
    catch (e: any) { setErr(e.message || 'Gagal menyimpan.'); }
    finally { setSaving(false); }
  };

  return (
    <div className="py-3" style={{ borderBottom: `1px solid rgba(52,211,153,0.06)` }}>
      <div className="flex items-center gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: C.faint, border: `1px solid rgba(52,211,153,0.1)`, color: C.muted }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: 'rgba(255,255,255,0.2)' }}>{label}</p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={val}
                onChange={e => setVal(e.target.value)}
                placeholder={placeholder}
                className="flex-1 px-2.5 py-1.5 rounded-md text-[13px] outline-none"
                style={{
                  background: 'rgba(0,0,0,0.4)',
                  border: `1px solid rgba(52,211,153,0.3)`,
                  color: C.text,
                }}
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
                style={{ background: 'rgba(52,211,153,0.1)', border: `1px solid rgba(52,211,153,0.25)`, color: C.cyan }}
              >
                {saving
                  ? <span className="w-3 h-3 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: C.cyan, borderTopColor: 'transparent' }} />
                  : <Check size={12} weight="bold" />
                }
              </button>
              <button
                onClick={() => { setEditing(false); setVal(value || ''); setErr(''); }}
                className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
                style={{ background: C.faint, border: `1px solid rgba(255,255,255,0.08)`, color: C.muted }}
              >
                <X size={12} weight="bold" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p
                className="text-[13px] flex-1"
                style={{ color: value ? C.text : 'rgba(255,255,255,0.2)', fontStyle: value ? 'normal' : 'italic' }}
              >
                {value || 'Belum diisi'}
              </p>
              <button
                onClick={() => { setEditing(true); setVal(value || ''); }}
                className="w-7 h-7 flex items-center justify-center rounded-md cursor-pointer"
                style={{ background: C.faint, border: `1px solid rgba(52,211,153,0.12)`, color: C.muted }}
              >
                <PencilSimple size={11} />
              </button>
            </div>
          )}
          {err && <p className="text-[11px] mt-1" style={{ color: '#fca5a5' }}>{err}</p>}
        </div>
      </div>
    </div>
  );
};

// ─── SECTION LABEL ────────────────────────────────────────────
const SL = ({ children }: { children: React.ReactNode }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="w-0.5 h-3 rounded-full opacity-60" style={{ background: C.cyan }} />
    <p className="text-[10px] font-semibold uppercase tracking-widest" style={{ color: C.muted }}>{children}</p>
    <div className="flex-1 h-px" style={{ background: 'rgba(52,211,153,0.1)' }} />
  </div>
);

// ─── PAGE ─────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, setAuth, clearAuth } = useAuthStore();
  const [profile,      setProfile]      = useState<UserProfile | null>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [error,        setError]        = useState<string | null>(null);
  const [logoutModal,  setLogoutModal]  = useState(false);
  const [refreshing,   setRefreshing]   = useState(false);
  const [autotradeEnabled,    setAutotradeEnabled]    = useState(false);
  const [affiliateFee,        setAffiliateFee]        = useState(5);
  const [affiliateCode,       setAffiliateCode]       = useState<string | null>(null);
  const [affiliatePanelReady, setAffiliatePanelReady] = useState(false);

  // Prevent re-fetch on tab switch — only load once on first mount
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/'); return; }
    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      loadData();
    }
  }, [hasHydrated, isAuthenticated]); // eslint-disable-line

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true); else setIsLoading(true);
    setError(null);
    try {
      const data = await api.getUserProfile();
      setProfile(data);
      if (data.user && user) {
        setAuth(
          { ...user, fullName: data.user.fullName, phoneNumber: data.user.phoneNumber, isEmailVerified: data.user.isEmailVerified },
          useAuthStore.getState().token!
        );
      }

      // ── Cek status affiliate program (autotrade) ───────────────
      try {
        const prog = await api.getMyAffiliateProgram();
        if (prog?.autotradeEnabled) {
          setAutotradeEnabled(true);
          setAffiliateFee(prog.autotradeWithdrawalFee ?? 5);
          setAffiliateCode(prog.affiliateCode ?? null);
        } else {
          setAutotradeEnabled(false);
          setAffiliateCode(null);
        }
      } catch {
        // Non-blocking — bukan affiliator atau program belum ada
        setAutotradeEnabled(false);
        setAffiliateCode(null);
      } finally {
        setAffiliatePanelReady(true);
      }
      // ───────────────────────────────────────────────────────────

    } catch (e: any) {
      if (e?.response?.status === 401) { clearAuth(); router.push('/'); return; }
      setError('Gagal memuat profil.');
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  const handleRefresh = () => {
    hasFetchedRef.current = true;
    loadData(true);
  };

  const handleSaveFullName = async (fullName: string) => {
    const updated = await api.updateUserProfile({ fullName });
    if (user && updated) {
      setAuth({ ...user, fullName: updated.profile?.fullName ?? fullName }, useAuthStore.getState().token!);
      await loadData(true);
    }
  };

  const handleSavePhone = async (phoneNumber: string) => {
    const updated = await api.updateUserProfile({ phoneNumber });
    if (user && updated) {
      setAuth({ ...user, phoneNumber: updated.profile?.phoneNumber ?? phoneNumber }, useAuthStore.getState().token!);
      await loadData(true);
    }
  };

  const roleBadge = () => {
    if (!user) return null;
    const map: Record<string, { col: string; dim: string }> = {
      superadmin: { col: '#c084fc', dim: 'rgba(192,132,252,0.1)' },
      admin:      { col: '#60a5fa', dim: 'rgba(96,165,250,0.1)'  },
      user:       { col: C.cyan,   dim: 'rgba(52,211,153,0.08)' },
    };
    const s = map[user.role] ?? map.user;
    return (
      <span
        className="text-[10px] font-semibold px-2 py-[3px] rounded-md"
        style={{ color: s.col, background: s.dim, border: `1px solid ${s.col}35` }}
      >
        {user.role}
      </span>
    );
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
          borderBottom: '1px solid rgba(52,211,153,0.1)',
        }}
      >
        <div className="max-w-[640px] mx-auto px-4 py-3.5 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-bold tracking-wide" style={{ color: C.text }}>Profil</h1>
            <p className="text-[10px] mt-0.5" style={{ color: C.muted }}>Kelola akun & pengaturan</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium cursor-pointer disabled:opacity-40"
            style={{ background: C.faint, border: '1px solid rgba(52,211,153,0.15)', color: refreshing ? C.cyan : C.muted }}
          >
            <ArrowClockwise size={12} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-[640px] mx-auto px-4 pt-4 flex flex-col gap-3">

        {/* Error */}
        {error && (
          <div
            className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-lg text-xs"
            style={{ background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.18)', borderLeft: `2px solid ${C.coral}`, color: '#fca5a5' }}
          >
            <WarningCircle size={13} className="shrink-0" /> {error}
          </div>
        )}

        {/* Identity card */}
        <div className="rounded-xl p-5 relative overflow-hidden" style={cardStyle}>
          <div className="absolute top-0 left-1/4 right-1/4 h-px" style={{ background: `linear-gradient(90deg,transparent,rgba(52,211,153,0.5),transparent)` }} />

          {isLoading ? (
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-full shrink-0" style={skeletonStyle} />
              <div className="flex-1 flex flex-col gap-2 justify-center">
                <Skeleton w={150} h={18} />
                <Skeleton w={200} h={13} />
                <Skeleton w={100} h={11} />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Avatar name={profile?.profileInfo?.personal?.fullName} email={user?.email ?? ''} avatarUrl={profile?.profileInfo?.avatar?.url} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-base font-bold" style={{ color: C.text }}>
                      {profile?.profileInfo?.personal?.fullName || user?.fullName || 'Pengguna'}
                    </h2>
                    {roleBadge()}
                  </div>
                  <p className="text-[12px]" style={{ color: 'rgba(255,255,255,0.3)' }}>{user?.email}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'rgba(255,255,255,0.12)' }}>
                    ID: {user?.id?.substring(0, 16)}…
                  </p>
                </div>
              </div>

              {/* Balance */}
              <div className="mt-4 pt-4 grid grid-cols-2 gap-2" style={{ borderTop: '1px solid rgba(52,211,153,0.08)' }}>
                {[
                  { label: 'Real Balance', val: `Rp ${profile?.balances?.real?.toLocaleString('id-ID') || '0'}`, col: C.cyan },
                  { label: 'Demo Balance', val: `Rp ${profile?.balances?.demo?.toLocaleString('id-ID') || '0'}`, col: 'rgba(255,255,255,0.6)' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-lg" style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(52,211,153,0.1)` }}>
                    <p className="text-[9px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>{s.label}</p>
                    <p className="text-[14px] font-semibold" style={{ color: s.col }}>{s.val}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Status */}
        {profile?.statusInfo && <StatusCard statusInfo={profile.statusInfo} isLoading={isLoading} />}

        {/* Account info */}
        <div>
          <SL>Informasi Akun</SL>
          <div className="rounded-xl px-4 py-1" style={cardStyle}>
            {isLoading ? (
              <div className="flex flex-col py-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 py-3" style={{ borderBottom: i < 3 ? '1px solid rgba(52,211,153,0.06)' : 'none' }}>
                    <div className="w-8 h-8 rounded-lg shrink-0" style={skeletonStyle} />
                    <div className="flex-1 flex flex-col gap-1.5">
                      <Skeleton w="30%" h={9} />
                      <Skeleton w={`${50 + i * 10}%`} h={13} />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <>
                <InfoRow
                  icon={<EnvelopeSimple size={14} />}
                  label="Email"
                  value={user?.email}
                  verified={profile?.profileInfo?.verification?.emailVerified}
                />
                <EditableField
                  icon={<User size={14} />}
                  label="Nama Lengkap"
                  value={profile?.profileInfo?.personal?.fullName}
                  placeholder="Contoh: John Doe"
                  onSave={handleSaveFullName}
                />
                <EditableField
                  icon={<Phone size={14} />}
                  label="Nomor Telepon"
                  value={profile?.profileInfo?.personal?.phoneNumber}
                  placeholder="+6281234567890"
                  onSave={handleSavePhone}
                />
                <InfoRow
                  icon={<ShieldCheck size={14} />}
                  label="Role"
                  value={user?.role}
                />
              </>
            )}
          </div>
        </div>

        {/* Referral code */}
        {user?.referralCode && (
          <div className="rounded-xl px-4 py-3" style={cardStyle}>
            <p className="text-[10px] uppercase tracking-widest mb-1" style={{ color: C.muted }}>Kode Referral</p>
            <p className="text-[15px] font-bold tracking-widest" style={{ color: C.cyan }}>{user.referralCode}</p>
          </div>
        )}

        {/* ── Autotrade Whitelist Panel — hanya tampil jika affiliator + autotrade aktif ── */}
        {affiliatePanelReady && autotradeEnabled && (
          <>
            <SL>Panel Affiliator</SL>

            <button
              onClick={() => router.push('/whitelist')}
              className="w-full rounded-xl p-4 text-left cursor-pointer relative overflow-hidden group"
              style={{
                background: 'linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(52,211,153,0.03) 100%)',
                border: '1px solid rgba(52,211,153,0.22)',
                boxShadow: '0 0 0 1px rgba(52,211,153,0.04), 0 4px 18px rgba(52,211,153,0.06)',
                transition: 'all 0.22s ease',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget;
                el.style.background = 'linear-gradient(135deg, rgba(52,211,153,0.13) 0%, rgba(52,211,153,0.06) 100%)';
                el.style.borderColor = 'rgba(52,211,153,0.4)';
                el.style.boxShadow = '0 0 0 1px rgba(52,211,153,0.08), 0 6px 24px rgba(52,211,153,0.1)';
                el.style.transform = 'translateY(-1px)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget;
                el.style.background = 'linear-gradient(135deg, rgba(52,211,153,0.07) 0%, rgba(52,211,153,0.03) 100%)';
                el.style.borderColor = 'rgba(52,211,153,0.22)';
                el.style.boxShadow = '0 0 0 1px rgba(52,211,153,0.04), 0 4px 18px rgba(52,211,153,0.06)';
                el.style.transform = 'translateY(0)';
              }}
            >
              {/* Top glow line */}
              <div style={{
                position: 'absolute', top: 0, left: '15%', right: '15%', height: 1,
                background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.6), transparent)',
              }} />

              <div className="flex items-center gap-3">
                {/* Robot icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'rgba(52,211,153,0.1)',
                    border: '1px solid rgba(52,211,153,0.28)',
                    boxShadow: '0 0 14px rgba(52,211,153,0.15)',
                  }}
                >
                  <Robot size={20} weight="duotone" style={{ color: C.cyan }} />
                </div>

                {/* Text */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="text-[13px] font-bold" style={{ color: C.text }}>
                      Panel Whitelist Autotrade
                    </p>
                    {/* Pulse badge */}
                    <span
                      className="flex items-center gap-1 text-[9px] font-bold px-1.5 py-[2px] rounded"
                      style={{
                        color: C.cyan,
                        background: 'rgba(52,211,153,0.1)',
                        border: '1px solid rgba(52,211,153,0.25)',
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                      }}
                    >
                      <span style={{
                        width: 5, height: 5, borderRadius: '50%',
                        background: C.cyan, display: 'inline-block',
                        boxShadow: '0 0 5px rgba(52,211,153,0.9)',
                        animation: 'pulse 2s ease infinite',
                      }} />
                      Aktif
                    </span>
                  </div>
                  <p className="text-[11px]" style={{ color: 'rgba(255,255,255,0.38)' }}>
                    Kelola User ID yang bisa login ke bot autotrade kamu
                  </p>
                  <div className="flex items-center gap-3 mt-1.5">
                    {affiliateCode && (
                      <span className="text-[10px]" style={{ color: 'rgba(52,211,153,0.55)' }}>
                        Kode: <span style={{ fontWeight: 700, color: C.cyan, fontFamily: 'monospace' }}>{affiliateCode}</span>
                      </span>
                    )}
                    <span className="text-[10px]" style={{ color: 'rgba(52,211,153,0.5)' }}>
                      Fee penarikan: <span style={{ fontWeight: 700, color: C.cyan }}>{affiliateFee}%</span>
                    </span>
                  </div>
                </div>

                {/* Arrow */}
                <ArrowRight
                  size={17}
                  style={{ color: 'rgba(52,211,153,0.5)', flexShrink: 0, transition: 'transform 0.2s ease' }}
                />
              </div>
            </button>
          </>
        )}

        {/* Logout */}
        <button
          onClick={() => setLogoutModal(true)}
          className="w-full flex items-center gap-3 px-4 py-3.5 rounded-xl text-left cursor-pointer transition-colors"
          style={{
            background: 'rgba(248,113,113,0.04)',
            border: '1px solid rgba(248,113,113,0.18)',
            boxShadow: '0 0 0 1px rgba(248,113,113,0.04), 0 4px 18px rgba(248,113,113,0.05)',
          }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)', color: C.coral }}
          >
            <SignOut size={14} />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-medium" style={{ color: C.coral }}>Keluar</p>
            <p className="text-[11px] mt-0.5" style={{ color: 'rgba(255,255,255,0.2)' }}>Logout dari akun ini</p>
          </div>
        </button>

        <p className="text-center text-[10px] pt-1 pb-2" style={{ color: 'rgba(255,255,255,0.1)' }}>
          STC AutoTrade v1.0.0
        </p>
      </div>

      {/* Logout Modal */}
      {logoutModal && (
        <div className="fixed inset-0 z-50 flex items-end justify-center p-4 pb-[88px]">
          <div
            className="absolute inset-0 backdrop-blur-xl"
            style={{ background: 'rgba(0,0,0,0.82)' }}
            onClick={() => setLogoutModal(false)}
          />
          <div
            className="relative w-full max-w-[360px] rounded-2xl p-6 flex flex-col items-center text-center animate-[slide-up_0.22s_ease]"
            style={{
              background: C.card,
              border: '1px solid rgba(248,113,113,0.18)',
              borderTop: `2px solid ${C.coral}`,
              boxShadow: '0 -16px 48px rgba(0,0,0,0.5)',
            }}
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.2)' }}
            >
              <SignOut size={20} style={{ color: C.coral }} weight="duotone" />
            </div>
            <h3 className="text-base font-bold mb-2" style={{ color: C.text }}>Keluar dari Akun?</h3>
            <p className="text-[12px] mb-5" style={{ color: C.muted }}>
              Kamu harus login ulang untuk mengakses dashboard.
            </p>
            <div className="flex gap-2.5 w-full">
              <button
                onClick={() => setLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-colors"
                style={{ background: C.faint, border: `1px solid rgba(52,211,153,0.12)`, color: C.muted }}
              >
                Batal
              </button>
              <button
                onClick={() => { clearAuth(); router.push('/'); }}
                className="flex-1 py-2.5 rounded-xl text-[13px] font-medium cursor-pointer transition-colors"
                style={{ background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.3)', color: C.coral }}
              >
                Keluar
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}