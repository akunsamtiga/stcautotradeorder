'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import {
  User, Mail, Phone, Shield, LogOut, Edit2,
  Check, X, RefreshCw, AlertCircle,
  CheckCircle, Lock, ChevronRight, Wallet,
  Award, Star, Zap,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
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
  balances: {
    real: number;
    demo: number;
    combined: number;
  };
}

// ============================================================================
// SKELETON LOADER
// ============================================================================
const Skeleton = ({ className = '' }: { className?: string }) => (
  <div className={`animate-pulse bg-white/5 rounded ${className}`} />
);

// ============================================================================
// AVATAR
// ============================================================================
const Avatar = ({ name, email, avatarUrl }: { name?: string; email: string; avatarUrl?: string }) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : email[0].toUpperCase();

  if (avatarUrl) {
    return (
      <div className="w-20 h-20 rounded-2xl overflow-hidden border-2 border-emerald-500/20 flex-shrink-0">
        <img src={avatarUrl} alt={name || email} className="w-full h-full object-cover" />
      </div>
    );
  }

  return (
    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 border-2 border-emerald-500/20 flex items-center justify-center flex-shrink-0">
      <span className="text-2xl font-bold text-emerald-400">{initials}</span>
    </div>
  );
};

// ============================================================================
// STATUS BADGE
// ============================================================================
const StatusBadge = ({ status }: { status: 'standard' | 'gold' | 'vip' }) => {
  const config = {
    standard: {
      label: 'STANDARD',
      icon: <User className="w-3 h-3" />,
      className: 'bg-slate-500/15 text-slate-300 border-slate-500/25',
    },
    gold: {
      label: 'GOLD',
      icon: <Award className="w-3 h-3" />,
      className: 'bg-yellow-500/15 text-yellow-300 border-yellow-500/25',
    },
    vip: {
      label: 'VIP',
      icon: <Star className="w-3 h-3" />,
      className: 'bg-purple-500/15 text-purple-300 border-purple-500/25',
    },
  };

  const { label, icon, className } = config[status] || config.standard;

  return (
    <span className={`inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wider ${className}`}>
      {icon}
      {label}
    </span>
  );
};

// ============================================================================
// STATUS CARD WITH PROGRESS
// ============================================================================
const StatusCard = ({ 
  statusInfo, 
  isLoading 
}: { 
  statusInfo: UserProfile['statusInfo']; 
  isLoading: boolean;
}) => {
  if (isLoading) {
    return (
      <div className="bg-gradient-to-br from-[#141414] to-[#0f0f0f] rounded-2xl border border-white/[0.06] p-5">
        <Skeleton className="h-5 w-32 mb-4" />
        <Skeleton className="h-8 w-full mb-4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  const statusColors = {
    standard: { from: 'from-slate-500/20', to: 'to-slate-500/5', border: 'border-slate-500/30', text: 'text-slate-300', glow: 'shadow-slate-500/20' },
    gold: { from: 'from-yellow-500/20', to: 'to-yellow-500/5', border: 'border-yellow-500/30', text: 'text-yellow-300', glow: 'shadow-yellow-500/20' },
    vip: { from: 'from-purple-500/20', to: 'to-purple-500/5', border: 'border-purple-500/30', text: 'text-purple-300', glow: 'shadow-purple-500/20' },
  };

  const colors = statusColors[statusInfo.current];
  const progress = statusInfo.progress || 0;

  return (
    <div className={`bg-gradient-to-br ${colors.from} ${colors.to} rounded-2xl border ${colors.border} p-5 shadow-lg ${colors.glow}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${colors.from} ${colors.to} border ${colors.border} flex items-center justify-center`}>
            {statusInfo.current === 'standard' && <User className="w-5 h-5 text-slate-300" />}
            {statusInfo.current === 'gold' && <Award className="w-5 h-5 text-yellow-300" />}
            {statusInfo.current === 'vip' && <Star className="w-5 h-5 text-purple-300" />}
          </div>
          <div>
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Status Akun</p>
            <StatusBadge status={statusInfo.current} />
          </div>
        </div>
        <div className="text-right">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-0.5">Profit Bonus</p>
          <p className={`text-lg font-bold ${colors.text}`}>{statusInfo.profitBonus}</p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
          <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Total Deposit</p>
          <p className="text-base font-bold text-white font-mono">
            Rp {statusInfo.totalDeposit.toLocaleString('id-ID')}
          </p>
        </div>
        {statusInfo.nextStatus && (
          <div className="bg-black/20 rounded-xl p-3 border border-white/5">
            <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Butuh Lagi</p>
            <p className="text-base font-bold text-emerald-400 font-mono">
              Rp {(statusInfo.depositNeeded || 0).toLocaleString('id-ID')}
            </p>
          </div>
        )}
      </div>

      {/* Progress Bar */}
      {statusInfo.nextStatus && progress < 100 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs text-white/60">
              Progress ke <span className={`font-bold ${colors.text}`}>{statusInfo.nextStatus}</span>
            </p>
            <p className="text-xs font-bold text-white/60">{progress.toFixed(1)}%</p>
          </div>
          <div className="h-2 bg-black/30 rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r ${colors.from} ${colors.to} rounded-full transition-all duration-500`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {statusInfo.current === 'vip' && (
        <div className="flex items-center gap-2 text-xs text-purple-300/80 bg-purple-500/10 rounded-lg px-3 py-2 mt-3">
          <Zap className="w-3.5 h-3.5" />
          <span>Kamu sudah mencapai status tertinggi! 🎉</span>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// INFO ROW
// ============================================================================
const InfoRow = ({
  icon, label, value, verified,
}: { icon: React.ReactNode; label: string; value?: string; verified?: boolean }) => (
  <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.04] last:border-0">
    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 text-white/20">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[10px] uppercase tracking-widest text-white/20">{label}</p>
      <p className="text-sm text-white mt-0.5 truncate">{value || '—'}</p>
    </div>
    {verified !== undefined && (
      <span className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
        verified
          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/[0.2]'
          : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/[0.2]'
      }`}>
        {verified ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
        {verified ? 'Verified' : 'Unverified'}
      </span>
    )}
  </div>
);

// ============================================================================
// EDITABLE FIELD
// ============================================================================
const EditableField = ({
  icon, label, value, onSave, placeholder,
}: {
  icon: React.ReactNode; label: string; value?: string;
  onSave: (v: string) => Promise<void>; placeholder: string;
}) => {
  const [editing, setEditing] = useState(false);
  const [val,     setVal]     = useState(value || '');
  const [saving,  setSaving]  = useState(false);
  const [err,     setErr]     = useState('');

  const handleSave = async () => {
    if (!val.trim()) {
      setErr('Field tidak boleh kosong');
      return;
    }
    setSaving(true); setErr('');
    try { 
      await onSave(val); 
      setEditing(false); 
    } catch (e: any) { 
      setErr(e.message || 'Gagal menyimpan. Coba lagi.'); 
    } finally { 
      setSaving(false); 
    }
  };

  return (
    <div className="py-3.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 text-white/20">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1">{label}</p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-[#0f0f0f] border border-white/[0.1] rounded-lg px-3 py-1.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-emerald-500/40 transition-colors"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-7 h-7 rounded-lg bg-emerald-500/15 border border-emerald-500/[0.25] flex items-center justify-center text-emerald-400 hover:bg-emerald-500/25 disabled:opacity-50 transition-colors"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { setEditing(false); setVal(value || ''); setErr(''); }}
                className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.08] flex items-center justify-center text-white/30 hover:text-white/60 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-white flex-1 truncate">
                {value || <span className="text-white/20 italic">Belum diisi</span>}
              </p>
              <button
                onClick={() => { setEditing(true); setVal(value || ''); }}
                className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-white/20 hover:text-white/60 hover:border-white/[0.12] transition-all"
              >
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}
          {err && <p className="text-[11px] text-red-400 mt-1">{err}</p>}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MENU ITEM
// ============================================================================
const MenuItem = ({
  icon, label, sublabel, onClick, danger = false,
}: { 
  icon: React.ReactNode; 
  label: string; 
  sublabel?: string; 
  onClick: () => void; 
  danger?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-all text-left ${
      danger
        ? 'border-red-500/[0.1] bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/[0.15]'
        : 'border-white/[0.04] bg-[#141414] hover:bg-[#181818] hover:border-white/[0.06]'
    }`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
      danger ? 'bg-red-500/10 text-red-400' : 'bg-white/[0.04] text-white/25'
    }`}>
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-white/80'}`}>{label}</p>
      {sublabel && <p className="text-[11px] text-white/20 mt-0.5">{sublabel}</p>}
    </div>
    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${danger ? 'text-red-400/40' : 'text-white/15'}`} />
  </button>
);

// ============================================================================
// SECTION LABEL
// ============================================================================
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p className="text-[10px] uppercase tracking-widest text-white/20 px-1 mb-2">{children}</p>
);

// ============================================================================
// PAGE
// ============================================================================
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, setAuth, clearAuth } = useAuthStore();

  const [profile,     setProfile]     = useState<UserProfile | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [error,       setError]       = useState<string | null>(null);
  const [logoutModal, setLogoutModal] = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/'); return; }
    loadData();
  }, [hasHydrated, isAuthenticated]); // eslint-disable-line

  const loadData = async (showRefreshing = false) => {
    if (showRefreshing) setRefreshing(true);
    else setIsLoading(true);
    setError(null);
    
    try {
      const profileData = await api.getUserProfile();
      setProfile(profileData);
      
      // Update auth store with latest user data
      if (profileData.user && user) {
        setAuth(
          {
            ...user,
            fullName: profileData.user.fullName,
            phoneNumber: profileData.user.phoneNumber,
            isEmailVerified: profileData.user.isEmailVerified,
          },
          useAuthStore.getState().token!
        );
      }
    } catch (e: any) {
      console.error('Failed to load profile:', e);
      if (e?.response?.status === 401) {
        clearAuth();
        router.push('/');
        return;
      }
      setError('Gagal memuat profil. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  const handleSaveFullName = async (fullName: string) => {
    const updated = await api.updateProfile({ fullName });
    if (user && updated) {
      setAuth({ ...user, fullName: updated.fullName ?? fullName }, useAuthStore.getState().token!);
      await loadData(true);
    }
  };

  const handleSavePhone = async (phoneNumber: string) => {
    const updated = await api.updateProfile({ phoneNumber });
    if (user && updated) {
      setAuth({ ...user, phoneNumber: updated.phoneNumber ?? phoneNumber }, useAuthStore.getState().token!);
      await loadData(true);
    }
  };

  const handleLogout = () => { clearAuth(); router.push('/'); };

  const handleRefresh = () => loadData(true);

  const roleBadge = () => {
    if (!user) return null;
    const map: Record<string, string> = {
      superadmin: 'bg-purple-500/15 text-purple-300 border-purple-500/[0.25]',
      admin:      'bg-blue-500/15 text-blue-300 border-blue-500/[0.25]',
      user:       'bg-emerald-500/10 text-emerald-400 border-emerald-500/[0.2]',
    };
    return (
      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[user.role] ?? map.user}`}>
        {user.role}
      </span>
    );
  };

  // Guards
  if (!hasHydrated) return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-white/10 border-t-white/40 rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0c0c0c] pb-28">

      {/* Header */}
      <div className="sticky top-0 z-40 bg-[#0c0c0c]/90 backdrop-blur-md border-b border-white/[0.04]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-sm font-semibold text-white">Profil</h1>
            <p className="text-[11px] text-white/20 mt-0.5">Kelola akun & pengaturan</p>
          </div>
          <button
            onClick={handleRefresh}
            disabled={refreshing || isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/30 hover:text-white hover:border-white/[0.15] transition-colors text-xs disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2.5 p-3.5 bg-red-500/8 border border-red-500/15 rounded-xl text-red-300 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Identity Card */}
        <div className="bg-gradient-to-br from-[#141414] to-[#0f0f0f] rounded-2xl border border-white/[0.06] p-5 shadow-xl">
          {isLoading ? (
            <div className="flex items-center gap-4">
              <Skeleton className="w-20 h-20 rounded-2xl" />
              <div className="flex-1">
                <Skeleton className="h-5 w-32 mb-2" />
                <Skeleton className="h-4 w-48 mb-2" />
                <Skeleton className="h-3 w-40" />
              </div>
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4">
                <Avatar 
                  name={profile?.profileInfo?.personal?.fullName} 
                  email={user?.email ?? ''} 
                  avatarUrl={profile?.profileInfo?.avatar?.url}
                />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <h2 className="text-base font-semibold text-white truncate">
                      {profile?.profileInfo?.personal?.fullName || user?.fullName || 'Pengguna'}
                    </h2>
                    {roleBadge()}
                  </div>
                  <p className="text-sm text-white/30 truncate mb-1">{user?.email}</p>
                  <p className="text-[11px] text-white/15 font-mono">ID: {user?.id?.substring(0, 16)}…</p>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="mt-4 pt-4 border-t border-white/[0.04] grid grid-cols-2 gap-3">
                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Real Balance</p>
                  <p className="text-base font-bold text-emerald-400 font-mono">
                    Rp {profile?.balances?.real?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
                <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                  <p className="text-[10px] uppercase tracking-widest text-white/40 mb-1">Demo Balance</p>
                  <p className="text-base font-bold text-white font-mono">
                    Rp {profile?.balances?.demo?.toLocaleString('id-ID') || '0'}
                  </p>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Status Card */}
        {profile?.statusInfo && (
          <StatusCard statusInfo={profile.statusInfo} isLoading={isLoading} />
        )}

        {/* Account Info */}
        <div>
          <SectionLabel>Informasi Akun</SectionLabel>
          <div className="bg-[#141414] rounded-xl border border-white/[0.05] px-4 py-1">
            {isLoading ? (
              <>
                <div className="py-3.5 border-b border-white/[0.04]">
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="py-3.5 border-b border-white/[0.04]">
                  <Skeleton className="h-12 w-full" />
                </div>
                <div className="py-3.5">
                  <Skeleton className="h-12 w-full" />
                </div>
              </>
            ) : (
              <>
                <InfoRow
                  icon={<Mail className="w-4 h-4" />}
                  label="Email"
                  value={user?.email}
                  verified={profile?.profileInfo?.verification?.emailVerified}
                />
                <EditableField
                  icon={<User className="w-4 h-4" />}
                  label="Nama Lengkap"
                  value={profile?.profileInfo?.personal?.fullName}
                  placeholder="Masukkan nama lengkap"
                  onSave={handleSaveFullName}
                />
                <EditableField
                  icon={<Phone className="w-4 h-4" />}
                  label="Nomor Telepon"
                  value={profile?.profileInfo?.personal?.phoneNumber}
                  placeholder="Masukkan nomor HP"
                  onSave={handleSavePhone}
                />
                <InfoRow
                  icon={<Shield className="w-4 h-4" />}
                  label="Role"
                  value={user?.role}
                />
              </>
            )}
          </div>
        </div>

        {/* Settings */}
        <div>
          <SectionLabel>Pengaturan</SectionLabel>
          <div className="space-y-1.5">
            <MenuItem
              icon={<Lock className="w-4 h-4" />}
              label="Ubah Password"
              sublabel="Perbarui kata sandi akun kamu"
              onClick={() => router.push('/profile/change-password')}
            />
            <MenuItem
              icon={<Wallet className="w-4 h-4" />}
              label="Riwayat Saldo"
              sublabel="Lihat deposit & penarikan"
              onClick={() => router.push('/balance-history')}
            />
          </div>
        </div>

        {/* Logout */}
        <MenuItem
          icon={<LogOut className="w-4 h-4" />}
          label="Keluar"
          sublabel="Logout dari akun ini"
          onClick={() => setLogoutModal(true)}
          danger
        />

        <p className="text-center text-[10px] text-white/10 pt-1">OrderBot v1.0.0</p>
      </div>

      {/* Logout Modal */}
      {logoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setLogoutModal(false)}
          />
          <div className="relative w-full max-w-sm bg-[#161616] rounded-2xl border border-white/[0.07] p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-base font-semibold text-white text-center mb-2">Keluar dari Akun?</h3>
            <p className="text-xs text-white/30 text-center mb-5">
              Kamu harus login ulang untuk mengakses dashboard.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/[0.08] text-white/40 text-sm hover:text-white/70 hover:border-white/[0.12] transition-colors"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500/15 border border-red-500/[0.25] text-red-300 text-sm font-medium hover:bg-red-500/25 transition-colors"
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