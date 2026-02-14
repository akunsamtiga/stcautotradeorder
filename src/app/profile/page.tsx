// PATH: app/profile/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import {
  User,
  Mail,
  Phone,
  Shield,
  LogOut,
  Edit2,
  Check,
  X,
  Copy,
  RefreshCw,
  AlertCircle,
  CheckCircle,
  DollarSign,
  Gift,
  Lock,
  ChevronRight,
  Activity,
  BarChart2,
  Wallet,
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
// AVATAR (initials-based)
// ============================================================================
const Avatar = ({ name, email }: { name?: string; email: string }) => {
  const initials = name
    ? name.split(' ').map((n) => n[0]).join('').substring(0, 2).toUpperCase()
    : email[0].toUpperCase();

  return (
    <div className="relative">
      <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500/30 to-emerald-700/20 border-2 border-emerald-500/30 flex items-center justify-center shadow-xl shadow-emerald-500/10">
        <span className="text-2xl font-bold text-emerald-300">{initials}</span>
      </div>
      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 rounded-full border-2 border-[#0c0c0c] flex items-center justify-center">
        <div className="w-2 h-2 bg-white rounded-full" />
      </div>
    </div>
  );
};

// ============================================================================
// INFO ROW (display-only)
// ============================================================================
const InfoRow = ({
  icon, label, value, verified,
}: { icon: React.ReactNode; label: string; value?: string; verified?: boolean }) => (
  <div className="flex items-center gap-3 py-3.5 border-b border-white/[0.04] last:border-0">
    <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 text-gray-600">
      {icon}
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-[11px] text-gray-600 uppercase tracking-wider">{label}</p>
      <p className="text-sm text-white mt-0.5 truncate">{value || '—'}</p>
    </div>
    {verified !== undefined && (
      <div className={`flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full border ${
        verified
          ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
          : 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20'
      }`}>
        {verified ? <CheckCircle className="w-3 h-3" /> : <AlertCircle className="w-3 h-3" />}
        {verified ? 'Verified' : 'Unverified'}
      </div>
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
  const [val, setVal]         = useState(value || '');
  const [saving, setSaving]   = useState(false);
  const [err, setErr]         = useState('');

  const handleSave = async () => {
    setSaving(true);
    setErr('');
    try {
      await onSave(val);
      setEditing(false);
    } catch {
      setErr('Gagal menyimpan. Coba lagi.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="py-3.5 border-b border-white/[0.04] last:border-0">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center flex-shrink-0 text-gray-600">
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-1">{label}</p>
          {editing ? (
            <div className="flex items-center gap-2">
              <input
                autoFocus
                value={val}
                onChange={(e) => setVal(e.target.value)}
                placeholder={placeholder}
                className="flex-1 bg-[#0f0f0f] border border-emerald-500/30 rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-700 focus:outline-none focus:border-emerald-500/50"
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="w-7 h-7 rounded-lg bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 hover:bg-emerald-500/30 disabled:opacity-50 transition-colors"
              >
                {saving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { setEditing(false); setVal(value || ''); setErr(''); }}
                className="w-7 h-7 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-gray-500 hover:text-gray-300 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <p className="text-sm text-white flex-1 truncate">{value || <span className="text-gray-700 italic">Belum diisi</span>}</p>
              <button
                onClick={() => { setEditing(true); setVal(value || ''); }}
                className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/8 flex items-center justify-center text-gray-600 hover:text-emerald-400 hover:border-emerald-500/25 transition-all"
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
// BALANCE CARD
// ============================================================================
const BalanceCard = ({
  label, amount, isLoading,
}: { label: string; amount: number; isLoading: boolean }) => (
  <div className="flex-1 bg-[#111] border border-white/[0.06] rounded-xl p-4">
    <p className="text-[11px] text-gray-600 uppercase tracking-wider mb-2">{label}</p>
    {isLoading ? (
      <div className="h-6 w-24 bg-white/5 rounded animate-pulse" />
    ) : (
      <p className="text-xl font-bold font-mono tabular-nums text-white">
        Rp {amount.toLocaleString('id-ID')}
      </p>
    )}
  </div>
);

// ============================================================================
// STAT MINI
// ============================================================================
const StatMini = ({
  label, value, color, icon,
}: { label: string; value: string; color: string; icon: React.ReactNode }) => (
  <div className="flex items-center gap-2.5">
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${color}`}>{icon}</div>
    <div>
      <p className="text-xs text-gray-600">{label}</p>
      <p className="text-sm font-bold text-white font-mono">{value}</p>
    </div>
  </div>
);

// ============================================================================
// MENU ITEM
// ============================================================================
const MenuItem = ({
  icon, label, sublabel, onClick, danger = false,
}: { icon: React.ReactNode; label: string; sublabel?: string; onClick: () => void; danger?: boolean }) => (
  <button
    onClick={onClick}
    className={`w-full flex items-center gap-3 p-4 rounded-xl border transition-all text-left ${
      danger
        ? 'border-red-500/10 bg-red-500/5 hover:bg-red-500/10 hover:border-red-500/20'
        : 'border-white/[0.04] bg-[#131313] hover:bg-[#1a1a1a] hover:border-white/8'
    }`}
  >
    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
      danger ? 'bg-red-500/10' : 'bg-white/[0.04]'
    }`}>
      <div className={danger ? 'text-red-400' : 'text-gray-500'}>{icon}</div>
    </div>
    <div className="flex-1 min-w-0">
      <p className={`text-sm font-medium ${danger ? 'text-red-400' : 'text-gray-200'}`}>{label}</p>
      {sublabel && <p className="text-[11px] text-gray-600 mt-0.5">{sublabel}</p>}
    </div>
    <ChevronRight className={`w-4 h-4 flex-shrink-0 ${danger ? 'text-red-400/50' : 'text-gray-700'}`} />
  </button>
);

// ============================================================================
// PROFILE PAGE
// ============================================================================
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, setAuth, clearAuth } = useAuthStore();

  const [balance,     setBalance]     = useState<Balance | null>(null);
  const [todayStats,  setTodayStats]  = useState<TodayStats | null>(null);
  const [isLoading,   setIsLoading]   = useState(true);
  const [copySuccess, setCopySuccess] = useState(false);
  const [logoutModal, setLogoutModal] = useState(false);

  // Auth guard
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) { router.push('/'); return; }
    loadData();
  }, [hasHydrated, isAuthenticated]); // eslint-disable-line

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [bal, stats] = await Promise.allSettled([
        api.getBalance(),
        api.getTodayStats(),
      ]);
      if (bal.status    === 'fulfilled') setBalance(bal.value);
      if (stats.status  === 'fulfilled') setTodayStats(stats.value);
    } catch (e: any) {
      if (e?.response?.status === 401) { clearAuth(); router.push('/'); }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveFullName = async (fullName: string) => {
    const updated = await api.updateProfile({ fullName });
    if (user && updated) {
      setAuth({ ...user, fullName: updated.fullName ?? fullName }, useAuthStore.getState().token!);
    }
  };

  const handleSavePhone = async (phoneNumber: string) => {
    const updated = await api.updateProfile({ phoneNumber });
    if (user && updated) {
      setAuth({ ...user, phoneNumber: updated.phoneNumber ?? phoneNumber }, useAuthStore.getState().token!);
    }
  };

  const handleCopyReferral = () => {
    if (!user?.referralCode) return;
    navigator.clipboard.writeText(user.referralCode).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  // ── Role badge ──
  const roleBadge = () => {
    if (!user) return null;
    const map = {
      superadmin: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
      admin:      'bg-blue-500/20 text-blue-300 border-blue-500/30',
      user:       'bg-emerald-500/15 text-emerald-400 border-emerald-500/20',
    };
    return (
      <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${map[user.role]}`}>
        {user.role}
      </span>
    );
  };

  // ── Loading / auth states ──
  if (!hasHydrated) return (
    <div className="min-h-screen bg-[#0c0c0c] flex items-center justify-center">
      <div className="w-12 h-12 border-4 border-emerald-500/30 border-t-emerald-400 rounded-full animate-spin" />
    </div>
  );
  if (!isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#0c0c0c] pb-28">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-[#0c0c0c]/95 backdrop-blur-md border-b border-white/[0.05]">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
            <User className="w-5 h-5 text-emerald-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">Profil</h1>
            <p className="text-[11px] text-gray-600 mt-0.5">Kelola akun & pengaturan</p>
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-5 space-y-4">

        {/* ── IDENTITY CARD ── */}
        <div className="bg-gradient-to-br from-[#181818] to-[#111] rounded-2xl border border-white/[0.06] p-6">
          <div className="flex items-start gap-5">
            <Avatar name={user?.fullName} email={user?.email ?? ''} />
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap mb-1">
                <h2 className="text-lg font-bold text-white truncate">
                  {user?.fullName || 'Pengguna'}
                </h2>
                {roleBadge()}
              </div>
              <p className="text-sm text-gray-500 truncate">{user?.email}</p>
              <p className="text-[11px] text-gray-700 mt-0.5">ID: {user?.id?.substring(0, 16)}…</p>
            </div>
          </div>

          {/* Today's quick stats */}
          <div className="mt-5 pt-5 border-t border-white/[0.05] grid grid-cols-3 gap-4">
            <StatMini
              label="Profit Hari Ini"
              value={
                isLoading ? '…' :
                `${(todayStats?.profit ?? 0) >= 0 ? '+' : ''}${((Math.abs(todayStats?.profit ?? 0)) / 1000).toFixed(0)}k`
              }
              color={(todayStats?.profit ?? 0) >= 0 ? 'bg-emerald-500/10' : 'bg-red-500/10'}
              icon={<DollarSign className={`w-4 h-4 ${(todayStats?.profit ?? 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />}
            />
            <StatMini
              label="Win Rate"
              value={isLoading ? '…' : `${(todayStats?.winRate ?? 0).toFixed(0)}%`}
              color="bg-blue-500/10"
              icon={<BarChart2 className="w-4 h-4 text-blue-400" />}
            />
            <StatMini
              label="Eksekusi"
              value={isLoading ? '…' : `${todayStats?.executions ?? 0}`}
              color="bg-white/[0.04]"
              icon={<Activity className="w-4 h-4 text-gray-500" />}
            />
          </div>
        </div>

        {/* ── BALANCE ── */}
        <div>
          <p className="text-[11px] text-gray-600 uppercase tracking-wider px-1 mb-2.5">Saldo Akun</p>
          <div className="flex gap-2.5">
            <BalanceCard
              label="Demo Balance"
              amount={balance?.demo_balance ?? 0}
              isLoading={isLoading}
            />
            <BalanceCard
              label="Real Balance"
              amount={balance?.real_balance ?? 0}
              isLoading={isLoading}
            />
          </div>
        </div>

        {/* ── PROFILE INFO ── */}
        <div>
          <p className="text-[11px] text-gray-600 uppercase tracking-wider px-1 mb-2.5">Informasi Akun</p>
          <div className="bg-gradient-to-br from-[#181818] to-[#111] rounded-2xl border border-white/[0.05] px-5 py-1">
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

        {/* ── REFERRAL CODE ── */}
        {user?.referralCode && (
          <div>
            <p className="text-[11px] text-gray-600 uppercase tracking-wider px-1 mb-2.5">Kode Referral</p>
            <div className="bg-gradient-to-br from-[#181818] to-[#111] rounded-2xl border border-emerald-500/10 p-5">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                    <Gift className="w-4.5 h-4.5 text-emerald-400" />
                  </div>
                  <div>
                    <p className="text-[11px] text-gray-600 mb-0.5">Kode Referral Kamu</p>
                    <p className="text-xl font-bold text-emerald-400 font-mono tracking-widest">
                      {user.referralCode}
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCopyReferral}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-sm font-medium transition-all ${
                    copySuccess
                      ? 'bg-emerald-500/20 border-emerald-500/30 text-emerald-300'
                      : 'bg-white/[0.04] border-white/8 text-gray-400 hover:text-white hover:border-white/15'
                  }`}
                >
                  {copySuccess
                    ? <><Check className="w-3.5 h-3.5" /> Disalin!</>
                    : <><Copy className="w-3.5 h-3.5" /> Salin</>
                  }
                </button>
              </div>
              <p className="text-[11px] text-gray-700 mt-3">
                Bagikan kode ini kepada teman. Keduanya mendapat keuntungan saat mereka bergabung.
              </p>
            </div>
          </div>
        )}

        {/* ── MENU SETTINGS ── */}
        <div>
          <p className="text-[11px] text-gray-600 uppercase tracking-wider px-1 mb-2.5">Pengaturan</p>
          <div className="space-y-2">
            <MenuItem
              icon={<Lock className="w-4 h-4" />}
              label="Ubah Password"
              sublabel="Perbarui kata sandi akun kamu"
              onClick={() => {/* TODO: navigate to change-password page */}}
            />
            <MenuItem
              icon={<Wallet className="w-4 h-4" />}
              label="Riwayat Saldo"
              sublabel="Lihat deposit & penarikan"
              onClick={() => {/* TODO: navigate to balance history */}}
            />
          </div>
        </div>

        {/* ── LOGOUT ── */}
        <div>
          <MenuItem
            icon={<LogOut className="w-4 h-4" />}
            label="Keluar"
            sublabel="Logout dari akun ini"
            onClick={() => setLogoutModal(true)}
            danger
          />
        </div>

        {/* ── VERSION NOTE ── */}
        <p className="text-center text-[11px] text-gray-800 pt-2">OrderBot v1.0.0</p>

      </div>

      {/* ── LOGOUT MODAL ── */}
      {logoutModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            onClick={() => setLogoutModal(false)}
          />
          <div className="relative w-full max-w-sm bg-gradient-to-b from-[#1e1e1e] to-[#181818] rounded-2xl border border-white/8 p-6 shadow-2xl">
            <div className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-6 h-6 text-red-400" />
            </div>
            <h3 className="text-base font-bold text-white text-center mb-1">Keluar dari Akun?</h3>
            <p className="text-sm text-gray-500 text-center mb-6">
              Kamu harus login ulang untuk mengakses dashboard.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setLogoutModal(false)}
                className="flex-1 py-2.5 rounded-xl border border-white/8 text-gray-400 text-sm font-medium hover:text-white hover:border-white/15 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleLogout}
                className="flex-1 py-2.5 rounded-xl bg-red-500/20 border border-red-500/30 text-red-300 text-sm font-semibold hover:bg-red-500/30 transition-all"
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