'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import {
  User, EnvelopeSimple, Phone, ShieldCheck, SignOut,
  PencilSimple, Check, X, ArrowClockwise, WarningCircle,
  CheckCircle, CaretRight, Medal, Star,
  Lightning, UserCircle,
} from '@phosphor-icons/react';

// ────────────────────────────────────────────────────────────
// DESIGN TOKENS
// ────────────────────────────────────────────────────────────
const C = {
  bg:   '#000000',
  s1:   '#06110e',
  s2:   '#091a14',
  s3:   '#0c2119',
  cyan: '#34d399',
  bdr:  'rgba(52,211,153,0.15)',
  coral:'#ff5263',
};

// ────────────────────────────────────────────────────────────
// TYPES
// ────────────────────────────────────────────────────────────
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

// ────────────────────────────────────────────────────────────
// SKELETON
// ────────────────────────────────────────────────────────────
const Skeleton = ({ w = '100%', h = 16 }: { w?: string | number; h?: number }) => (
  <div
    style={{
      width: w, height: h,
      background: 'rgba(52,211,153,0.05)',
      animation: 'skeleton-pulse 2s ease infinite',
      borderRadius: 2,
    }}
  />
);

// ────────────────────────────────────────────────────────────
// CARD
// ────────────────────────────────────────────────────────────
const Card: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({
  children, style,
}) => (
  <div
    className="ds-card"
    style={{
      background: `linear-gradient(135deg, ${C.s1} 0%, ${C.s2} 100%)`,
      border: `1px solid ${C.bdr}`,
      clipPath: 'polygon(0 0,calc(100% - 12px) 0,100% 12px,100% 100%,12px 100%,0 calc(100% - 12px))',
      position: 'relative',
      overflow: 'hidden',
      ...style,
    }}
  >
    {children}
  </div>
);

// ────────────────────────────────────────────────────────────
// AVATAR
// ────────────────────────────────────────────────────────────
const Avatar = ({ name, email, avatarUrl }: { name?: string; email: string; avatarUrl?: string }) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : email[0].toUpperCase();

  if (avatarUrl)
    return (
      <div style={{ width: 72, height: 72, border: `2px solid ${C.bdr}`, overflow: 'hidden', flexShrink: 0 }}>
        <img src={avatarUrl} alt={name || email} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    );

  return (
    <div style={{
      width: 72, height: 72, flexShrink: 0,
      background: `linear-gradient(135deg, ${C.s3}, ${C.s2})`,
      border: `2px solid ${C.bdr}`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      clipPath: 'polygon(0 0,calc(100% - 10px) 0,100% 10px,100% 100%,10px 100%,0 calc(100% - 10px))',
    }}>
      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 24, fontWeight: 700, color: C.cyan }}>{initials}</span>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// STATUS BADGE
// ────────────────────────────────────────────────────────────
const statusCfg = {
  standard: { label: 'STANDARD', Icon: UserCircle, col: '#9ca3af',  dim: 'rgba(156,163,175,0.12)' },
  gold:     { label: 'GOLD',     Icon: Medal,       col: '#fcd34d',  dim: 'rgba(252,211,77,0.12)'  },
  vip:      { label: 'VIP',      Icon: Star,        col: '#c084fc',  dim: 'rgba(192,132,252,0.12)' },
} as const;

const StatusBadge = ({ status }: { status: 'standard' | 'gold' | 'vip' }) => {
  const { label, Icon, col, dim } = statusCfg[status] ?? statusCfg.standard;
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 5,
      fontSize: 10, fontFamily: 'var(--font-exo)', fontWeight: 700,
      letterSpacing: '0.15em',
      padding: '3px 10px',
      background: dim,
      border: `1px solid ${col}40`,
      color: col,
    }}>
      <Icon size={11} weight="fill" />{label}
    </span>
  );
};

// ────────────────────────────────────────────────────────────
// STATUS CARD
// ────────────────────────────────────────────────────────────
const StatusCard = ({ statusInfo, isLoading }: { statusInfo: UserProfile['statusInfo']; isLoading: boolean }) => {
  if (isLoading) return (
    <Card style={{ padding: '20px' }}>
      <Skeleton w={120} h={14} />
      <div style={{ marginTop: 12 }}><Skeleton h={32} /></div>
      <div style={{ marginTop: 10 }}><Skeleton h={60} /></div>
    </Card>
  );

  const { col } = statusCfg[statusInfo.current] ?? statusCfg.standard;
  const progress = statusInfo.progress || 0;

  return (
    <Card style={{ padding: '20px' }}>
      <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: `linear-gradient(90deg,transparent,${col}80,transparent)`, boxShadow: `0 0 6px ${col}50` }} />

      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, background: `${col}15`, border: `1px solid ${col}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', clipPath: 'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))' }}>
            {statusInfo.current === 'standard' && <UserCircle size={18} weight="regular" style={{ color: col }} />}
            {statusInfo.current === 'gold'     && <Medal  size={18} weight="fill"    style={{ color: col }} />}
            {statusInfo.current === 'vip'      && <Star   size={18} weight="fill"    style={{ color: col }} />}
          </div>
          <div>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Status Akun</p>
            <StatusBadge status={statusInfo.current} />
          </div>
        </div>
        <div style={{ textAlign: 'right' }}>
          <p style={{ fontFamily: 'var(--font-exo)', fontSize: 10, letterSpacing: '0.2em', color: 'rgba(255,255,255,0.35)', textTransform: 'uppercase', marginBottom: 4 }}>Profit Bonus</p>
          <p style={{ fontFamily: 'var(--font-mono)', fontSize: 18, fontWeight: 700, color: col }}>{statusInfo.profitBonus}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: statusInfo.nextStatus ? '1fr 1fr' : '1fr', gap: 10, marginBottom: 14 }}>
        {[
          { label: 'Total Deposit', val: `Rp ${statusInfo.totalDeposit.toLocaleString('id-ID')}` },
          ...(statusInfo.nextStatus ? [{ label: 'Dibutuhkan', val: `Rp ${(statusInfo.depositNeeded || 0).toLocaleString('id-ID')}` }] : []),
        ].map((s) => (
          <div key={s.label} style={{ background: 'rgba(0,0,0,0.3)', border: `1px solid rgba(255,255,255,0.05)`, padding: '10px 12px' }}>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, fontWeight: 700, color: '#ffffff' }}>{s.val}</p>
          </div>
        ))}
      </div>

      {statusInfo.nextStatus && progress < 100 && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>Progress ke <span style={{ color: col, fontWeight: 700 }}>{statusInfo.nextStatus}</span></p>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.5)' }}>{progress.toFixed(1)}%</p>
          </div>
          <div style={{ height: 3, background: 'rgba(0,0,0,0.4)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${progress}%`, background: `linear-gradient(to right,${col},${col}80)`, transition: 'width 0.5s ease' }} />
          </div>
        </div>
      )}

      {statusInfo.current === 'vip' && (
        <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', background: 'rgba(192,132,252,0.08)', border: '1px solid rgba(192,132,252,0.2)' }}>
          <Lightning size={14} weight="fill" style={{ color: '#c084fc' }} />
          <span style={{ fontFamily: 'var(--font-exo)', fontSize: 11, color: 'rgba(192,132,252,0.8)' }}>Status tertinggi tercapai! 🎉</span>
        </div>
      )}
    </Card>
  );
};

// ────────────────────────────────────────────────────────────
// INFO ROW
// ────────────────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, verified }: {
  icon: React.ReactNode; label: string; value?: string; verified?: boolean;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '13px 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
    <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'rgba(255,255,255,0.2)' }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontFamily: 'var(--font-exo)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 2 }}>{label}</p>
      <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: '#ffffff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{value || '—'}</p>
    </div>
    {verified !== undefined && (
      <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 10, fontFamily: 'var(--font-exo)', fontWeight: 700, padding: '3px 8px', color: verified ? C.cyan : '#fcd34d', background: verified ? 'rgba(52,211,153,0.08)' : 'rgba(252,211,77,0.08)', border: `1px solid ${verified ? C.bdr : 'rgba(252,211,77,0.25)'}` }}>
        {verified ? <CheckCircle size={11} weight="fill" /> : <WarningCircle size={11} weight="fill" />}
        {verified ? 'Verified' : 'Unverified'}
      </span>
    )}
  </div>
);

// ────────────────────────────────────────────────────────────
// EDITABLE FIELD
// ────────────────────────────────────────────────────────────
const EditableField = ({ icon, label, value, onSave, placeholder }: {
  icon: React.ReactNode; label: string; value?: string;
  onSave: (v: string) => Promise<void>; placeholder: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState(value || '');
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');

  const handleSave = async () => {
    if (!val.trim()) { setErr('Field tidak boleh kosong'); return; }
    setSaving(true); setErr('');
    try { await onSave(val); setEditing(false); }
    catch (e: any) { setErr(e.message || 'Gagal menyimpan.'); }
    finally { setSaving(false); }
  };

  return (
    <div style={{ padding: '13px 0', borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.06)`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: 'rgba(255,255,255,0.2)' }}>{icon}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontFamily: 'var(--font-exo)', fontSize: 10, letterSpacing: '0.18em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.25)', marginBottom: 5 }}>{label}</p>
          {editing ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input autoFocus value={val} onChange={(e) => setVal(e.target.value)} placeholder={placeholder}
                style={{ flex: 1, padding: '6px 10px', background: C.s2, border: `1px solid ${C.bdr}`, color: '#fff', fontFamily: 'var(--font-mono)', fontSize: 13, outline: 'none' }} />
              <button onClick={handleSave} disabled={saving}
                style={{ width: 28, height: 28, background: 'rgba(52,211,153,0.1)', border: `1px solid ${C.bdr}`, color: C.cyan, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {saving ? <span style={{ width: 10, height: 10, border: `2px solid ${C.cyan}`, borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.8s linear infinite' }} /> : <Check size={13} weight="bold" />}
              </button>
              <button onClick={() => { setEditing(false); setVal(value || ''); setErr(''); }}
                style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} weight="bold" />
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <p style={{ fontFamily: 'var(--font-mono)', fontSize: 13, color: value ? '#ffffff' : 'rgba(255,255,255,0.25)', fontStyle: value ? 'normal' : 'italic', flex: 1 }}>{value || 'Belum diisi'}</p>
              <button onClick={() => { setEditing(true); setVal(value || ''); }}
                style={{ width: 28, height: 28, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <PencilSimple size={12} />
              </button>
            </div>
          )}
          {err && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff8a94', marginTop: 4 }}>{err}</p>}
        </div>
      </div>
    </div>
  );
};

// ────────────────────────────────────────────────────────────
// MENU ITEM
// ────────────────────────────────────────────────────────────
const MenuItem = ({ icon, label, sublabel, onClick, danger = false }: {
  icon: React.ReactNode; label: string; sublabel?: string; onClick: () => void; danger?: boolean;
}) => (
  <button onClick={onClick} style={{
    width: '100%', display: 'flex', alignItems: 'center', gap: 12,
    padding: '13px 16px', cursor: 'pointer', textAlign: 'left',
    background: danger ? 'rgba(255,82,99,0.04)' : `linear-gradient(135deg,${C.s1},${C.s2})`,
    border: `1px solid ${danger ? 'rgba(255,82,99,0.12)' : C.bdr}`,
    clipPath: 'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',
    transition: 'all 0.25s ease',
  }}>
    <div style={{ width: 32, height: 32, background: danger ? 'rgba(255,82,99,0.1)' : 'rgba(255,255,255,0.04)', border: `1px solid ${danger ? 'rgba(255,82,99,0.25)' : 'rgba(255,255,255,0.06)'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color: danger ? C.coral : 'rgba(255,255,255,0.25)' }}>{icon}</div>
    <div style={{ flex: 1 }}>
      <p style={{ fontFamily: 'var(--font-exo)', fontSize: 13, fontWeight: 600, color: danger ? C.coral : 'rgba(255,255,255,0.85)' }}>{label}</p>
      {sublabel && <p style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'rgba(255,255,255,0.25)', marginTop: 2 }}>{sublabel}</p>}
    </div>
    <CaretRight size={14} style={{ color: danger ? 'rgba(255,82,99,0.4)' : 'rgba(255,255,255,0.15)', flexShrink: 0 }} />
  </button>
);

// ────────────────────────────────────────────────────────────
// SECTION LABEL
// ────────────────────────────────────────────────────────────
const SL = ({ children }: { children: React.ReactNode }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
    <div style={{ width: 3, height: 12, background: C.cyan, opacity: 0.6 }} />
    <p style={{ fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>{children}</p>
    <div style={{ flex: 1, height: 1, background: 'rgba(52,211,153,0.1)' }} />
  </div>
);

// ────────────────────────────────────────────────────────────
// PAGE
// ────────────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, setAuth, clearAuth } = useAuthStore();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [logoutModal, setLogoutModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/'); return; }
    loadData();
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
    } catch (e: any) {
      if (e?.response?.status === 401) { clearAuth(); router.push('/'); return; }
      setError('Gagal memuat profil. Silakan coba lagi.');
    } finally { setIsLoading(false); setRefreshing(false); }
  };

  // ✅ FIX: Gunakan api.updateUserProfile() → PUT /user/profile (bukan PATCH /auth/profile yang tidak ada)
  const handleSaveFullName = async (fullName: string) => {
    const updated = await api.updateUserProfile({ fullName });
    if (user && updated) {
      setAuth(
        { ...user, fullName: updated.profile?.fullName ?? fullName },
        useAuthStore.getState().token!
      );
      await loadData(true);
    }
  };

  // ✅ FIX: Gunakan api.updateUserProfile() → PUT /user/profile (bukan PATCH /auth/profile yang tidak ada)
  const handleSavePhone = async (phoneNumber: string) => {
    const updated = await api.updateUserProfile({ phoneNumber });
    if (user && updated) {
      setAuth(
        { ...user, phoneNumber: updated.profile?.phoneNumber ?? phoneNumber },
        useAuthStore.getState().token!
      );
      await loadData(true);
    }
  };

  const roleBadge = () => {
    if (!user) return null;
    const map: Record<string, { col: string; dim: string }> = {
      superadmin: { col: '#c084fc', dim: 'rgba(192,132,252,0.12)' },
      admin:      { col: '#60a5fa', dim: 'rgba(96,165,250,0.12)'  },
      user:       { col: C.cyan,   dim: 'rgba(52,211,153,0.10)'  },
    };
    const s = map[user.role] ?? map.user;
    return (
      <span style={{ fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, letterSpacing: '0.15em', padding: '2px 8px', background: s.dim, border: `1px solid ${s.col}40`, color: s.col }}>
        {user.role.toUpperCase()}
      </span>
    );
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
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '14px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h1 style={{ fontFamily: 'var(--font-exo)', fontSize: 14, fontWeight: 800, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#ffffff' }}>Profil</h1>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 2 }}>Kelola akun & pengaturan</p>
          </div>
          <button onClick={() => loadData(true)} disabled={refreshing || isLoading}
            style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px', background: 'rgba(255,255,255,0.04)', border: `1px solid rgba(255,255,255,0.1)`, color: refreshing ? C.cyan : 'rgba(255,255,255,0.4)', fontFamily: 'var(--font-exo)', fontSize: 11, fontWeight: 600, letterSpacing: '0.12em', cursor: 'pointer', clipPath: 'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))' }}>
            <ArrowClockwise size={13} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            Refresh
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Error */}
        {error && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'rgba(255,82,99,0.06)', border: '1px solid rgba(255,82,99,0.2)', borderLeft: `2px solid ${C.coral}`, fontFamily: 'var(--font-mono)', fontSize: 12, color: '#ff8a94' }}>
            <WarningCircle size={14} style={{ flexShrink: 0 }} />
            {error}
          </div>
        )}

        {/* Identity Card */}
        <Card style={{ padding: '20px' }}>
          <div style={{ position: 'absolute', top: 0, left: '20%', right: '20%', height: 2, background: `linear-gradient(90deg,transparent,${C.cyan}80,transparent)`, boxShadow: `0 0 6px ${C.cyan}40` }} />
          {isLoading ? (
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ width: 72, height: 72, background: 'rgba(52,211,153,0.05)', animation: 'skeleton-pulse 2s ease infinite', flexShrink: 0 }} />
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <Skeleton w={140} h={18} /><Skeleton w={200} h={14} /><Skeleton w={120} h={12} />
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <Avatar name={profile?.profileInfo?.personal?.fullName} email={user?.email ?? ''} avatarUrl={profile?.profileInfo?.avatar?.url} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
                    <h2 style={{ fontFamily: 'var(--font-exo)', fontSize: 16, fontWeight: 800, color: '#ffffff' }}>{profile?.profileInfo?.personal?.fullName || user?.fullName || 'Pengguna'}</h2>
                    {roleBadge()}
                  </div>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.35)', marginBottom: 2 }}>{user?.email}</p>
                  <p style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.15)' }}>ID: {user?.id?.substring(0, 16)}…</p>
                </div>
              </div>

              <div style={{ marginTop: 14, paddingTop: 14, borderTop: '1px solid rgba(255,255,255,0.05)', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Real Balance', val: `Rp ${profile?.balances?.real?.toLocaleString('id-ID') || '0'}`, col: C.cyan },
                  { label: 'Demo Balance', val: `Rp ${profile?.balances?.demo?.toLocaleString('id-ID') || '0'}`, col: 'rgba(255,255,255,0.75)' },
                ].map((s) => (
                  <div key={s.label} style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.05)', padding: '10px 12px' }}>
                    <p style={{ fontFamily: 'var(--font-exo)', fontSize: 9, letterSpacing: '0.2em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>{s.label}</p>
                    <p style={{ fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 700, color: s.col }}>{s.val}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>

        {/* Status */}
        {profile?.statusInfo && <StatusCard statusInfo={profile.statusInfo} isLoading={isLoading} />}

        {/* Account Info */}
        <div>
          <SL>Informasi Akun</SL>
          <Card style={{ padding: '0 16px' }}>
            {isLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12, padding: '14px 0' }}>
                <Skeleton h={40} /><Skeleton h={40} /><Skeleton h={40} />
              </div>
            ) : (
              <>
                <InfoRow
                  icon={<EnvelopeSimple size={15} />}
                  label="Email"
                  value={user?.email}
                  verified={profile?.profileInfo?.verification?.emailVerified}
                />
                <EditableField
                  icon={<User size={15} />}
                  label="Nama Lengkap"
                  value={profile?.profileInfo?.personal?.fullName}
                  placeholder="Contoh: John Doe"
                  onSave={handleSaveFullName}
                />
                <EditableField
                  icon={<Phone size={15} />}
                  label="Nomor Telepon"
                  value={profile?.profileInfo?.personal?.phoneNumber}
                  placeholder="+6281234567890 (sertakan kode negara)"
                  onSave={handleSavePhone}
                />
                <InfoRow
                  icon={<ShieldCheck size={15} />}
                  label="Role"
                  value={user?.role}
                />
              </>
            )}
          </Card>
        </div>

        {/* Logout */}
        <MenuItem
          icon={<SignOut size={15} />}
          label="Keluar"
          sublabel="Logout dari akun ini"
          onClick={() => setLogoutModal(true)}
          danger
        />

        <p style={{ textAlign: 'center', fontFamily: 'var(--font-mono)', fontSize: 10, color: 'rgba(255,255,255,0.1)', paddingTop: 4 }}>
          OrderBot v1.0.0
        </p>
      </div>

      {/* Logout Modal */}
      {logoutModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: 16, paddingBottom: 88 }}>
          <div
            style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)' }}
            onClick={() => setLogoutModal(false)}
          />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 400,
            background: `linear-gradient(135deg,${C.s1},${C.s2})`,
            border: `1px solid rgba(255,82,99,0.2)`,
            borderTop: `2px solid ${C.coral}`,
            padding: 24,
            clipPath: 'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%)',
            boxShadow: `0 -20px 60px rgba(0,0,0,0.5)`,
            animation: 'slide-up 0.25s ease',
          }}>
            <div style={{ width: 44, height: 44, background: 'rgba(255,82,99,0.08)', border: `1px solid rgba(255,82,99,0.2)`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px', clipPath: 'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))' }}>
              <SignOut size={22} style={{ color: C.coral }} weight="duotone" />
            </div>
            <h3 style={{ fontFamily: 'var(--font-exo)', fontSize: 16, fontWeight: 800, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#ffffff', textAlign: 'center', marginBottom: 8 }}>Keluar dari Akun?</h3>
            <p style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'rgba(255,255,255,0.35)', textAlign: 'center', marginBottom: 20 }}>Kamu harus login ulang untuk mengakses dashboard.</p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setLogoutModal(false)}
                style={{ flex: 1, padding: '11px', background: 'transparent', border: `1px solid rgba(255,255,255,0.1)`, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-exo)', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer', clipPath: 'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))' }}
              >
                BATAL
              </button>
              <button
                onClick={() => { clearAuth(); router.push('/'); }}
                style={{ flex: 1, padding: '11px', background: 'rgba(255,82,99,0.1)', border: `1px solid rgba(255,82,99,0.35)`, color: C.coral, fontFamily: 'var(--font-exo)', fontSize: 12, fontWeight: 700, letterSpacing: '0.15em', cursor: 'pointer', clipPath: 'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))' }}
              >
                KELUAR
              </button>
            </div>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}