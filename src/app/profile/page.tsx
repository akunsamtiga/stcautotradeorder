'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import {
  User, Mail, Phone, Shield, LogOut, Edit2,
  Check, X, Copy, RefreshCw, AlertCircle,
  CheckCircle, Gift, Lock, ChevronRight, Wallet,
} from 'lucide-react';

// ============================================================================
// TYPES
// ============================================================================
interface Balance {
  demo_balance: number;
  real_balance: number;
}

interface TodayStats {
  profit: number;
  executions: number;
  winRate: number;
}

// ============================================================================
// AVATAR
// ============================================================================
const Avatar = ({ name, email }: { name?: string; email: string }) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : email[0].toUpperCase();

  return (
    <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center flex-shrink-0">
      <span className="text-xl font-bold text-emerald-400">{initials}</span>
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
    setSaving(true); setErr('');
    try { await onSave(val); setEditing(false); }
    catch { setErr('Gagal menyimpan. Coba lagi.'); }
    finally { setSaving(false); }
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
}: { icon: React.ReactNode; label: string; sublabel?: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl border transition-colors text-left ${
      danger
        ? 'border-red-500/[0.1] bg-red-500/5 hover:bg-red-500/10'
        : 'border-white/[0.04] bg-[#141414] hover:bg-[#181818]'
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

  const [balance,     setBalance]     = useState<Balance | null>(null);
  const [todayStats,  setTodayStats]  = useState<TodayStats | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/'); return; }
    loadData();
  }, [hasHydrated, isAuthenticated]); // eslint-disable-line

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bal, stats] = await Promise.allSettled([api.getBalance(), api.getTodayStats()]);
      if (bal.status   === 'fulfilled') setBalance(bal.value);
      if (stats.status === 'fulfilled') setTodayStats(stats.value);
    } catch (e: any) {
      if (e?.response?.status === 401) { clearAuth(); router.push('/'); }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFullName = async (fullName: string) => {
    const updated = await api.updateProfile({ fullName });
    if (user && updated)
      setAuth({ ...user, fullName: updated.fullName ?? fullName }, useAuthStore.getState().token!);
  };

  const handleSavePhone = async (phoneNumber: string) => {
    const updated = await api.updateProfile({ phoneNumber });
    if (user && updated)
      setAuth({ ...user, phoneNumber: updated.phoneNumber ?? phoneNumber }, useAuthStore.getState().token!);
  };

  const handleCopyReferral = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleLogout = () => { clearAuth(); router.push('/'); };

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
        <div className="max-w-2xl mx-auto px-4 py-4">
          <h1 className="text-sm font-semibold text-white">Profil</h1>
          <p className="text-[11px] text-white/20 mt-0.5">Kelola akun & pengaturan</p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-5">

        {/* Identity */}
        <div className="bg-[#141414] rounded-xl border border-white/[0.05] p-5">
          <div className="flex items-center gap-4">
            <Avatar name={user?.fullName} email={user?.email ?? ''} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-base font-semibold text-white truncate">
                  {user?.fullName || 'Pengguna'}
                </h2>
                {roleBadge()}
              </div>
              <p className="text-sm text-white/30 truncate mt-0.5">{user?.email}</p>
              <p className="text-[11px] text-white/15 mt-0.5 font-mono">ID: {user?.id?.substring(0, 16)}…</p>
            </div>
          </div>

          {/* Quick stats */}
          <div className="mt-4 pt-4 border-t border-white/[0.04] grid grid-cols-3 gap-2">
            {[
              {
                label: 'Profit Hari Ini',
                value: isLoading ? '…'
                  : `${(todayStats?.profit ?? 0) >= 0 ? '+' : ''}${(Math.abs(todayStats?.profit ?? 0) / 1000).toFixed(0)}k`,
                color: (todayStats?.profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400',
              },
              {
                label: 'Win Rate',
                value: isLoading ? '…' : `${(todayStats?.winRate ?? 0).toFixed(0)}%`,
                color: 'text-white',
              },
              {
                label: 'Eksekusi',
                value: isLoading ? '…' : `${todayStats?.executions ?? 0}`,
                color: 'text-white',
              },
            ].map(({ label, value, color }) => (
              <div key={label}>
                <p className="text-[10px] text-white/20 uppercase tracking-wider">{label}</p>
                <p className={`text-sm font-bold font-mono mt-0.5 ${color}`}>{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Balance */}
        <div>
          <SectionLabel>Saldo Akun</SectionLabel>
          <div className="flex gap-2">
            {[
              { label: 'Demo Balance', amount: balance?.demo_balance ?? 0 },
              { label: 'Real Balance', amount: balance?.real_balance ?? 0 },
            ].map(({ label, amount }) => (
              <div key={label} className="flex-1 bg-[#141414] border border-white/[0.05] rounded-xl p-4">
                <p className="text-[10px] uppercase tracking-widest text-white/20 mb-1.5">{label}</p>
                {isLoading
                  ? <div className="h-5 w-20 bg-white/5 rounded animate-pulse" />
                  : <p className="text-lg font-bold font-mono text-white">Rp {amount.toLocaleString('id-ID')}</p>
                }
              </div>
            ))}
          </div>
        </div>

        {/* Account Info */}
        <div>
          <SectionLabel>Informasi Akun</SectionLabel>
          <div className="bg-[#141414] rounded-xl border border-white/[0.05] px-4 py-1">
            <InfoRow
              icon={<Mail className="w-4 h-4" />}
              label="Email"
              value={user?.email}
              verified={user?.isEmailVerified}
            />
            <EditableField
              icon={<User className="w-4 h-4" />}
              label="Nama Lengkap"
              value={user?.fullName}
              placeholder="Masukkan nama lengkap"
              onSave={handleSaveFullName}
            />
            <EditableField
              icon={<Phone className="w-4 h-4" />}
              label="Nomor Telepon"
              value={user?.phoneNumber}
              placeholder="Masukkan nomor HP"
              onSave={handleSavePhone}
            />
            <InfoRow
              icon={<Shield className="w-4 h-4" />}
              label="Role"
              value={user?.role}
            />
          </div>
        </div>

        {/* Referral */}
        {user?.referralCode && (
          <div>
            <SectionLabel>Kode Referral</SectionLabel>
            <div className="bg-[#141414] rounded-xl border border-white/[0.05] p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/[0.2] flex items-center justify-center">
                    <Gift className="w-4 h-4 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[10px] text-white/20 mb-0.5">Kode kamu</p>
                    <p className="text-lg font-bold text-emerald-400 font-mono tracking-widest">
                      {user.referralCode}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopyReferral}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                    copySuccess
                      ? 'bg-emerald-500/15 border-emerald-500/[0.25] text-emerald-300'
                      : 'bg-white/[0.04] border-white/[0.08] text-white/30 hover:text-white/60 hover:border-white/[0.12]'
                  }`}
                >
                  {copySuccess
                    ? <><Check className="w-3.5 h-3.5" /> Disalin!</>
                    : <><Copy className="w-3.5 h-3.5" /> Salin</>
                  }
                </button>
              </div>
              <p className="text-[11px] text-white/15 mt-3">
                Bagikan kode ini kepada teman. Keduanya mendapat keuntungan saat mereka bergabung.
              </p>
            </div>
          </div>
        )}

        {/* Settings */}
        <div>
          <SectionLabel>Pengaturan</SectionLabel>
          <div className="space-y-1.5">
            <MenuItem
              icon={<Lock className="w-4 h-4" />}
              label="Ubah Password"
              sublabel="Perbarui kata sandi akun kamu"
              onClick={() => {}}
            />
            <MenuItem
              icon={<Wallet className="w-4 h-4" />}
              label="Riwayat Saldo"
              sublabel="Lihat deposit & penarikan"
              onClick={() => {}}
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
          <div className="relative w-full max-w-sm bg-[#161616] rounded-2xl border border-white/[0.07] p-6">
            <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <h3 className="text-sm font-semibold text-white text-center mb-1">Keluar dari Akun?</h3>
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