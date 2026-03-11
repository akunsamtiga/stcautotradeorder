'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash, MagnifyingGlass, Robot, ShieldCheck,
  Warning, X, CheckCircle, Info, ArrowLeft, Copy, Check,
} from '@phosphor-icons/react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface WhitelistEntry {
  id: string;
  userId: string;
  userEmail: string;
  note?: string;
  addedAt: string;
  isActive: boolean;
}

interface WhitelistResponse {
  success: boolean;
  data?: {
    autotradeEnabled: boolean;
    withdrawalFeePercent: number;
    whitelist: WhitelistEntry[];
    pagination: { page: number; limit: number; total: number };
    totalWhitelisted: number;
  };
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const { state } = JSON.parse(raw);
    return state?.token ?? null;
  } catch {
    return null;
  }
}
function formatDate(iso: string) {
  return new Date(iso).toLocaleString('id-ID', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

function maskEmail(email: string) {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const masked = user.length <= 2 ? user[0] + '*' : user[0] + '***' + user[user.length - 1];
  return `${masked}@${domain}`;
}

// ─── Sub-components ───────────────────────────────────────────────────────────

const StatBadge: React.FC<{ label: string; value: string | number; accent?: boolean }> = ({
  label, value, accent,
}) => (
  <div style={{
    padding: '10px 16px',
    background: accent ? 'rgba(52,211,153,0.08)' : 'rgba(255,255,255,0.03)',
    border: `1px solid ${accent ? 'rgba(52,211,153,0.25)' : 'rgba(255,255,255,0.07)'}`,
    borderRadius: 8,
    minWidth: 100,
  }}>
    <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.1em', fontFamily: 'var(--font-exo)', textTransform: 'uppercase', marginBottom: 4 }}>
      {label}
    </div>
    <div style={{ fontSize: 20, fontWeight: 700, color: accent ? '#34d399' : '#fff', fontFamily: 'var(--font-exo)' }}>
      {value}
    </div>
  </div>
);

const Toast: React.FC<{ type: 'success' | 'error' | 'info'; message: string; onClose: () => void }> = ({
  type, message, onClose,
}) => {
  const colors = {
    success: { bg: 'rgba(52,211,153,0.12)', border: 'rgba(52,211,153,0.3)', icon: <CheckCircle size={16} weight="fill" style={{ color: '#34d399', flexShrink: 0 }} /> },
    error:   { bg: 'rgba(255,82,99,0.12)',   border: 'rgba(255,82,99,0.3)',   icon: <Warning size={16} weight="fill" style={{ color: '#ff5263', flexShrink: 0 }} /> },
    info:    { bg: 'rgba(96,165,250,0.1)',   border: 'rgba(96,165,250,0.25)', icon: <Info size={16} weight="fill" style={{ color: '#60a5fa', flexShrink: 0 }} /> },
  }[type];

  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', top: 20, right: 20, zIndex: 9999,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 16px',
      background: colors.bg, border: `1px solid ${colors.border}`,
      borderRadius: 8, maxWidth: 340,
      animation: 'slide-up 0.25s ease',
    }}>
      {colors.icon}
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-exo)', flex: 1 }}>
        {message}
      </span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', padding: 0, display: 'flex' }}>
        <X size={14} />
      </button>
    </div>
  );
};

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhitelistPage() {
  const router = useRouter();

  // State
  const [entries, setEntries] = useState<WhitelistEntry[]>([]);
  const [totalWhitelisted, setTotalWhitelisted] = useState(0);
  const [withdrawalFeePercent, setWithdrawalFeePercent] = useState(5);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserId, setNewUserId] = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding] = useState(false);

  // Check input
  const [checkId, setCheckId] = useState('');
  const [checking, setChecking] = useState(false);
  const [checkResult, setCheckResult] = useState<null | { userId: string; isWhitelisted: boolean }>(null);

  // Delete confirm
  const [deleteTarget, setDeleteTarget] = useState<WhitelistEntry | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);

  // Copy state
  const [copied, setCopied] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => setToast({ type, message });

  // ── Fetch whitelist ────────────────────────────────────────────────────────
  const fetchWhitelist = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/affiliate-program/autotrade/whitelist`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json: WhitelistResponse = await res.json();

      if (res.status === 403) {
        setAccessDenied(true);
        return;
      }
      if (!json.success || !json.data) throw new Error('Failed to fetch');

      setEntries(json.data.whitelist);
      setTotalWhitelisted(json.data.totalWhitelisted);
      setWithdrawalFeePercent(json.data.withdrawalFeePercent);
    } catch {
      showToast('error', 'Gagal memuat whitelist. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWhitelist(); }, [fetchWhitelist]);

  // ── Add to whitelist ───────────────────────────────────────────────────────
  const handleAdd = async () => {
    if (!newUserId.trim()) return showToast('error', 'User ID tidak boleh kosong');
    setAdding(true);
    try {
      const res = await fetch(`${API}/affiliate-program/autotrade/whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userId: newUserId.trim(), note: newNote.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Gagal menambahkan user');

      showToast('success', `User ID ${newUserId} berhasil ditambahkan ke whitelist`);
      setNewUserId('');
      setNewNote('');
      setShowAddForm(false);
      fetchWhitelist();
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setAdding(false);
    }
  };

  // ── Remove from whitelist ─────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await fetch(`${API}/affiliate-program/autotrade/whitelist/${deleteTarget.userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus user');

      showToast('success', `User ID ${deleteTarget.userId} dihapus dari whitelist`);
      setDeleteTarget(null);
      fetchWhitelist();
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setDeleting(false);
    }
  };

  // ── Check whitelist ───────────────────────────────────────────────────────
  const handleCheck = async () => {
    if (!checkId.trim()) return;
    setChecking(true);
    setCheckResult(null);
    try {
      const res = await fetch(`${API}/affiliate-program/autotrade/whitelist/check/${checkId.trim()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memeriksa');
      setCheckResult(json.data);
    } catch (e: any) {
      showToast('error', e.message);
    } finally {
      setChecking(false);
    }
  };

  // ── Copy user ID ──────────────────────────────────────────────────────────
  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  // ── Access denied screen ──────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div style={{
        minHeight: '100dvh', display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16,
      }}>
        <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'rgba(255,82,99,0.1)', border: '1px solid rgba(255,82,99,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={28} style={{ color: '#ff5263' }} />
        </div>
        <p style={{ fontFamily: 'var(--font-exo)', fontWeight: 700, fontSize: 17, color: '#fff', textAlign: 'center' }}>
          Akses Ditolak
        </p>
        <p style={{ fontFamily: 'var(--font-exo)', fontSize: 13, color: 'rgba(255,255,255,0.45)', textAlign: 'center', maxWidth: 280 }}>
          Halaman ini hanya bisa diakses oleh affiliator dengan fitur autotrade aktif.
        </p>
        <button
          onClick={() => router.back()}
          style={{
            marginTop: 8, padding: '10px 20px',
            background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)',
            color: 'rgba(255,255,255,0.7)', borderRadius: 6, cursor: 'pointer',
            fontFamily: 'var(--font-exo)', fontSize: 13,
          }}
        >
          Kembali
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <div onClick={() => setDeleteTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: 360,
            background: 'linear-gradient(135deg, #06110e 0%, #0b1c15 100%)',
            border: '1px solid rgba(255,82,99,0.25)', borderTop: '2px solid #ff5263',
            borderRadius: 10, padding: 24, animation: 'slide-up 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: 'rgba(255,82,99,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Warning size={20} weight="fill" style={{ color: '#ff5263' }} />
              </div>
              <div>
                <p style={{ fontFamily: 'var(--font-exo)', fontWeight: 700, fontSize: 15, color: '#fff' }}>Hapus dari Whitelist?</p>
                <p style={{ fontFamily: 'var(--font-exo)', fontSize: 12, color: 'rgba(255,255,255,0.45)', marginTop: 2 }}>
                  ID: <span style={{ color: '#ff8a94' }}>{deleteTarget.userId}</span>
                </p>
              </div>
            </div>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 13, color: 'rgba(255,255,255,0.55)', marginBottom: 20, lineHeight: 1.5 }}>
              User ini tidak akan bisa lagi menggunakan bot autotrade setelah dihapus.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setDeleteTarget(null)}
                style={{ flex: 1, padding: '10px 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-exo)', fontSize: 13 }}
              >
                Batal
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                style={{ flex: 1, padding: '10px 0', background: 'rgba(255,82,99,0.15)', border: '1px solid rgba(255,82,99,0.3)', color: '#ff5263', borderRadius: 6, cursor: 'pointer', fontFamily: 'var(--font-exo)', fontSize: 13, fontWeight: 600, opacity: deleting ? 0.6 : 1 }}
              >
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Layout */}
      <div style={{ minHeight: '100dvh', padding: '0 0 80px' }}>

        {/* Header */}
        <div style={{
          position: 'sticky', top: 0, zIndex: 40,
          background: 'rgba(5,8,7,0.95)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(52,211,153,0.1)',
          padding: '14px 18px',
          display: 'flex', alignItems: 'center', gap: 12,
        }}>
          <button
            onClick={() => router.back()}
            style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.4)', cursor: 'pointer', display: 'flex', padding: 4 }}
          >
            <ArrowLeft size={18} />
          </button>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flex: 1 }}>
            <Robot size={20} style={{ color: '#34d399' }} />
            <span style={{ fontFamily: 'var(--font-exo)', fontWeight: 800, fontSize: 15, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#fff' }}>
              Whitelist Autotrade
            </span>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 14px',
              background: 'rgba(52,211,153,0.12)', border: '1px solid rgba(52,211,153,0.3)',
              color: '#34d399', borderRadius: 6, cursor: 'pointer',
              fontFamily: 'var(--font-exo)', fontSize: 12, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}
          >
            <Plus size={14} weight="bold" />
            Tambah
          </button>
        </div>

        <div style={{ padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Info Banner */}
          <div style={{
            padding: '12px 14px',
            background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.15)',
            borderRadius: 8, display: 'flex', gap: 10, alignItems: 'flex-start',
          }}>
            <Info size={15} style={{ color: '#34d399', flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 12, color: 'rgba(255,255,255,0.55)', lineHeight: 1.55 }}>
              Hanya User ID yang ada di daftar ini yang bisa login ke bot autotrade.
              {' '}Setiap penarikan komisi dikenakan fee <span style={{ color: '#34d399', fontWeight: 700 }}>{withdrawalFeePercent}%</span> karena fitur autotrade aktif.
            </p>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: 10 }}>
            <StatBadge label="Total Whitelist" value={totalWhitelisted} accent />
            <StatBadge label="Fee Penarikan" value={`${withdrawalFeePercent}%`} />
          </div>

          {/* Add Form (inline, collapsible) */}
          {showAddForm && (
            <div style={{
              padding: '16px', background: 'rgba(52,211,153,0.05)', border: '1px solid rgba(52,211,153,0.2)',
              borderRadius: 8, animation: 'slide-up 0.2s ease',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
                <span style={{ fontFamily: 'var(--font-exo)', fontSize: 13, fontWeight: 700, color: '#34d399', letterSpacing: '0.06em', textTransform: 'uppercase' }}>
                  Tambah User ID
                </span>
                <button onClick={() => { setShowAddForm(false); setNewUserId(''); setNewNote(''); }}
                  style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.35)', cursor: 'pointer', display: 'flex' }}>
                  <X size={15} />
                </button>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-exo)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
                    User ID *
                  </label>
                  <input
                    className="ds-input"
                    placeholder="Contoh: 12345"
                    value={newUserId}
                    onChange={e => setNewUserId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontFamily: 'var(--font-exo)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.5)', marginBottom: 5 }}>
                    Catatan (opsional)
                  </label>
                  <input
                    className="ds-input"
                    placeholder="Contoh: Bot client — Budi Santoso"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                  />
                </div>
                <button
                  onClick={handleAdd}
                  disabled={adding || !newUserId.trim()}
                  style={{
                    width: '100%', padding: '11px 0', marginTop: 2,
                    background: adding || !newUserId.trim() ? 'rgba(52,211,153,0.05)' : 'rgba(52,211,153,0.14)',
                    border: '1px solid rgba(52,211,153,0.3)', color: '#34d399',
                    borderRadius: 6, cursor: adding || !newUserId.trim() ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-exo)', fontSize: 13, fontWeight: 700,
                    letterSpacing: '0.1em', textTransform: 'uppercase',
                    opacity: adding || !newUserId.trim() ? 0.5 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {adding ? 'Menambahkan...' : 'Tambahkan ke Whitelist'}
                </button>
              </div>
            </div>
          )}

          {/* Check ID */}
          <div style={{ padding: '14px', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8 }}>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 12, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 10 }}>
              <MagnifyingGlass size={12} style={{ marginRight: 6, verticalAlign: 'middle' }} />
              Cek User ID
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                className="ds-input"
                style={{ flex: 1 }}
                placeholder="Masukkan User ID..."
                value={checkId}
                onChange={e => { setCheckId(e.target.value); setCheckResult(null); }}
                onKeyDown={e => e.key === 'Enter' && handleCheck()}
              />
              <button
                onClick={handleCheck}
                disabled={checking || !checkId.trim()}
                style={{
                  padding: '0 16px', flexShrink: 0,
                  background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.12)',
                  color: 'rgba(255,255,255,0.7)', borderRadius: 6, cursor: 'pointer',
                  fontFamily: 'var(--font-exo)', fontSize: 12, whiteSpace: 'nowrap',
                  opacity: checking || !checkId.trim() ? 0.5 : 1,
                }}
              >
                {checking ? '...' : 'Cek'}
              </button>
            </div>
            {checkResult && (
              <div style={{
                marginTop: 10, padding: '9px 12px',
                background: checkResult.isWhitelisted ? 'rgba(52,211,153,0.08)' : 'rgba(255,82,99,0.08)',
                border: `1px solid ${checkResult.isWhitelisted ? 'rgba(52,211,153,0.25)' : 'rgba(255,82,99,0.25)'}`,
                borderRadius: 6, display: 'flex', alignItems: 'center', gap: 8, animation: 'slide-up 0.2s ease',
              }}>
                {checkResult.isWhitelisted
                  ? <CheckCircle size={15} weight="fill" style={{ color: '#34d399', flexShrink: 0 }} />
                  : <Warning size={15} weight="fill" style={{ color: '#ff5263', flexShrink: 0 }} />}
                <span style={{ fontFamily: 'var(--font-exo)', fontSize: 13, color: checkResult.isWhitelisted ? '#34d399' : '#ff5263' }}>
                  ID <strong>{checkResult.userId}</strong> {checkResult.isWhitelisted ? 'sudah diwhitelist ✓' : 'belum diwhitelist'}
                </span>
              </div>
            )}
          </div>

          {/* Whitelist Table */}
          <div style={{ border: '1px solid rgba(255,255,255,0.07)', borderRadius: 8, overflow: 'hidden' }}>
            {/* Table header */}
            <div style={{
              padding: '10px 14px', background: 'rgba(255,255,255,0.03)',
              borderBottom: '1px solid rgba(255,255,255,0.06)',
              display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center',
            }}>
              {['User ID / Catatan', 'Ditambahkan', ''].map((h, i) => (
                <span key={i} style={{ fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.3)' }}>
                  {h}
                </span>
              ))}
            </div>

            {/* Rows */}
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} style={{ padding: '14px', borderBottom: '1px solid rgba(255,255,255,0.04)', display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.06)', flex: 1, animation: 'pulse 1.5s ease infinite' }} />
                  <div style={{ height: 14, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: 70, animation: 'pulse 1.5s ease infinite' }} />
                </div>
              ))
            ) : entries.length === 0 ? (
              <div style={{ padding: '32px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
                <Robot size={32} style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p style={{ fontFamily: 'var(--font-exo)', fontSize: 13, color: 'rgba(255,255,255,0.3)', textAlign: 'center' }}>
                  Belum ada user di whitelist.<br />Tambahkan User ID di atas.
                </p>
              </div>
            ) : (
              entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{
                    padding: '13px 14px',
                    borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                    display: 'grid', gridTemplateColumns: '1fr auto auto', gap: 10, alignItems: 'center',
                    background: idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)',
                    transition: 'background 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.03)')}
                  onMouseLeave={e => (e.currentTarget.style.background = idx % 2 === 0 ? 'transparent' : 'rgba(255,255,255,0.01)')}
                >
                  {/* ID + info */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 3, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                      <span style={{ fontFamily: 'var(--font-exo)', fontSize: 14, fontWeight: 700, color: '#34d399' }}>
                        {entry.userId}
                      </span>
                      <button
                        onClick={() => copyId(entry.userId)}
                        title="Salin ID"
                        style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.25)', cursor: 'pointer', display: 'flex', padding: 2 }}
                      >
                        {copied === entry.userId ? <Check size={12} style={{ color: '#34d399' }} /> : <Copy size={12} />}
                      </button>
                    </div>
                    <span style={{ fontFamily: 'var(--font-exo)', fontSize: 11, color: 'rgba(255,255,255,0.35)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {maskEmail(entry.userEmail)}{entry.note ? ` · ${entry.note}` : ''}
                    </span>
                  </div>

                  {/* Date */}
                  <span style={{ fontFamily: 'var(--font-exo)', fontSize: 10, color: 'rgba(255,255,255,0.3)', whiteSpace: 'nowrap' }}>
                    {formatDate(entry.addedAt)}
                  </span>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteTarget(entry)}
                    title="Hapus dari whitelist"
                    style={{
                      width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'rgba(255,82,99,0.06)', border: '1px solid rgba(255,82,99,0.15)',
                      color: 'rgba(255,82,99,0.5)', borderRadius: 6, cursor: 'pointer', flexShrink: 0,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,82,99,0.15)';
                      (e.currentTarget as HTMLButtonElement).style.color = '#ff5263';
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,82,99,0.06)';
                      (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,82,99,0.5)';
                    }}
                  >
                    <Trash size={13} />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Empty padding for bottom nav */}
          <div style={{ height: 10 }} />
        </div>
      </div>
    </>
  );
}