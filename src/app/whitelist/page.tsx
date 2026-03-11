'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus, Trash, MagnifyingGlass, Robot, ShieldCheck,
  Warning, X, CheckCircle, Info, ArrowLeft, Copy, Check,
  Users, UserPlus,
} from '@phosphor-icons/react';

// ─── Types ───────────────────────────────────────────────────────────────────

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

// ─── Tokens ──────────────────────────────────────────────────────────────────

const C = {
  bg:    '#050807',
  card:  '#0e1712',
  card2: '#111a15',
  bdr:   'rgba(52,211,153,0.15)',
  cyan:  '#34d399',
  coral: '#f87171',
  text:  '#f0faf6',
  muted: 'rgba(255,255,255,0.45)',
  faint: 'rgba(255,255,255,0.04)',
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem('auth-storage');
    if (!raw) return null;
    const { state } = JSON.parse(raw);
    return state?.token ?? null;
  } catch { return null; }
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

// ─── Toast ────────────────────────────────────────────────────────────────────

const Toast: React.FC<{ type: 'success' | 'error' | 'info'; message: string; onClose: () => void }> = ({
  type, message, onClose,
}) => {
  const cfg = {
    success: { bg: 'rgba(52,211,153,0.1)',  border: 'rgba(52,211,153,0.3)',  icon: <CheckCircle size={15} weight="fill" style={{ color: '#34d399', flexShrink: 0 }} /> },
    error:   { bg: 'rgba(248,113,113,0.1)', border: 'rgba(248,113,113,0.3)', icon: <Warning    size={15} weight="fill" style={{ color: '#f87171', flexShrink: 0 }} /> },
    info:    { bg: 'rgba(96,165,250,0.1)',  border: 'rgba(96,165,250,0.25)', icon: <Info        size={15} weight="fill" style={{ color: '#60a5fa', flexShrink: 0 }} /> },
  }[type];

  useEffect(() => {
    const t = setTimeout(onClose, 3500);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <div style={{
      position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
      zIndex: 9999, width: 'calc(100% - 32px)', maxWidth: 400,
      display: 'flex', alignItems: 'center', gap: 10,
      padding: '12px 14px',
      background: cfg.bg, border: `1px solid ${cfg.border}`,
      borderRadius: 10, backdropFilter: 'blur(12px)',
      animation: 'slide-up 0.25s ease',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
    }}>
      {cfg.icon}
      <span style={{ fontSize: 13, color: 'rgba(255,255,255,0.85)', fontFamily: 'var(--font-exo)', flex: 1, lineHeight: 1.4 }}>
        {message}
      </span>
      <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.3)', cursor: 'pointer', padding: 2, display: 'flex', flexShrink: 0 }}>
        <X size={13} />
      </button>
    </div>
  );
};

// ─── Delete Modal ─────────────────────────────────────────────────────────────

const DeleteModal: React.FC<{
  entry: WhitelistEntry;
  deleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}> = ({ entry, deleting, onConfirm, onClose }) => (
  <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', padding: '0 0 0' }}>
    <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} />
    <div style={{
      position: 'relative', width: '100%', maxWidth: 480,
      background: 'linear-gradient(160deg, #0c1a14 0%, #0a1510 100%)',
      border: '1px solid rgba(248,113,113,0.22)', borderTop: '2px solid #f87171',
      borderRadius: '16px 16px 0 0',
      padding: '24px 20px 36px',
      animation: 'slide-up 0.22s cubic-bezier(0.4,0,0.2,1)',
    }}>
      {/* Handle */}
      <div style={{ width: 36, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.12)', margin: '0 auto 20px' }} />

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 16 }}>
        <div style={{ width: 40, height: 40, borderRadius: 10, background: 'rgba(248,113,113,0.1)', border: '1px solid rgba(248,113,113,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Trash size={18} style={{ color: '#f87171' }} weight="duotone" />
        </div>
        <div>
          <p style={{ fontFamily: 'var(--font-exo)', fontWeight: 700, fontSize: 15, color: '#fff', marginBottom: 4 }}>Hapus dari Whitelist?</p>
          <p style={{ fontFamily: 'var(--font-exo)', fontSize: 12, color: 'rgba(255,255,255,0.4)', lineHeight: 1.5 }}>
            User <span style={{ color: '#34d399', fontWeight: 600 }}>{entry.userId}</span> tidak akan bisa menggunakan bot autotrade setelah dihapus.
          </p>
        </div>
      </div>

      {/* Info chip */}
      <div style={{ padding: '9px 12px', background: 'rgba(248,113,113,0.06)', border: '1px solid rgba(248,113,113,0.15)', borderRadius: 8, marginBottom: 20 }}>
        <p style={{ fontFamily: 'monospace', fontSize: 12, color: '#fca5a5' }}>{maskEmail(entry.userEmail)}</p>
        {entry.note && <p style={{ fontFamily: 'var(--font-exo)', fontSize: 11, color: 'rgba(255,255,255,0.35)', marginTop: 3 }}>{entry.note}</p>}
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={onClose}
          style={{ flex: 1, padding: '12px 0', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-exo)', fontSize: 13, fontWeight: 500 }}>
          Batal
        </button>
        <button onClick={onConfirm} disabled={deleting}
          style={{ flex: 1, padding: '12px 0', background: deleting ? 'rgba(248,113,113,0.08)' : 'rgba(248,113,113,0.14)', border: '1px solid rgba(248,113,113,0.3)', color: '#f87171', borderRadius: 8, cursor: deleting ? 'not-allowed' : 'pointer', fontFamily: 'var(--font-exo)', fontSize: 13, fontWeight: 700, opacity: deleting ? 0.65 : 1, transition: 'all 0.2s' }}>
          {deleting ? (
            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}>
              <span style={{ width: 13, height: 13, border: '2px solid #f87171', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              Menghapus...
            </span>
          ) : 'Hapus'}
        </button>
      </div>
    </div>
  </div>
);

// ─── Skeleton Row ─────────────────────────────────────────────────────────────

const SkeletonRow = () => (
  <div style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
    <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(255,255,255,0.05)', flexShrink: 0, animation: 'pulse 1.5s ease infinite' }} />
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div style={{ height: 12, borderRadius: 4, background: 'rgba(255,255,255,0.07)', width: '45%', animation: 'pulse 1.5s ease infinite' }} />
      <div style={{ height: 10, borderRadius: 4, background: 'rgba(255,255,255,0.04)', width: '70%', animation: 'pulse 1.5s ease infinite' }} />
    </div>
    <div style={{ width: 28, height: 28, borderRadius: 6, background: 'rgba(255,255,255,0.04)', animation: 'pulse 1.5s ease infinite' }} />
  </div>
);

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function WhitelistPage() {
  const router = useRouter();

  const [entries, setEntries]                   = useState<WhitelistEntry[]>([]);
  const [totalWhitelisted, setTotalWhitelisted] = useState(0);
  const [loading, setLoading]                   = useState(true);
  const [accessDenied, setAccessDenied]         = useState(false);

  // Add form
  const [showAddForm, setShowAddForm] = useState(false);
  const [newUserId, setNewUserId]     = useState('');
  const [newNote, setNewNote]         = useState('');
  const [adding, setAdding]           = useState(false);

  // Check
  const [checkId, setCheckId]         = useState('');
  const [checking, setChecking]       = useState(false);
  const [checkResult, setCheckResult] = useState<null | { userId: string; isWhitelisted: boolean }>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<WhitelistEntry | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Toast & copy
  const [toast, setToast]   = useState<{ type: 'success' | 'error' | 'info'; message: string } | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const showToast = (type: 'success' | 'error' | 'info', message: string) => setToast({ type, message });

  // ── Fetch ─────────────────────────────────────────────────────────────────
  const fetchWhitelist = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch(`${API}/affiliate-program/autotrade/whitelist`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json: WhitelistResponse = await res.json();

      if (res.status === 403) { setAccessDenied(true); return; }
      if (!json.success || !json.data) throw new Error('Failed to fetch');

      setEntries(json.data.whitelist);
      setTotalWhitelisted(json.data.totalWhitelisted);
    } catch {
      showToast('error', 'Gagal memuat whitelist. Coba lagi.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchWhitelist(); }, [fetchWhitelist]);

  // ── Add ───────────────────────────────────────────────────────────────────
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

      showToast('success', `User ${newUserId} berhasil ditambahkan`);
      setNewUserId(''); setNewNote(''); setShowAddForm(false);
      fetchWhitelist();
    } catch (e: any) {
      showToast('error', e.message);
    } finally { setAdding(false); }
  };

  // ── Delete ────────────────────────────────────────────────────────────────
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

      showToast('success', `User ${deleteTarget.userId} dihapus dari whitelist`);
      setDeleteTarget(null);
      fetchWhitelist();
    } catch (e: any) {
      showToast('error', e.message);
    } finally { setDeleting(false); }
  };

  // ── Check ─────────────────────────────────────────────────────────────────
  const handleCheck = async () => {
    if (!checkId.trim()) return;
    setChecking(true); setCheckResult(null);
    try {
      const res = await fetch(`${API}/affiliate-program/autotrade/whitelist/check/${checkId.trim()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memeriksa');
      setCheckResult(json.data);
    } catch (e: any) {
      showToast('error', e.message);
    } finally { setChecking(false); }
  };

  // ── Copy ──────────────────────────────────────────────────────────────────
  const copyId = (id: string) => {
    navigator.clipboard.writeText(id).then(() => {
      setCopied(id);
      setTimeout(() => setCopied(null), 1800);
    });
  };

  // ── Access denied ─────────────────────────────────────────────────────────
  if (accessDenied) {
    return (
      <div style={{ minHeight: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 24, gap: 16, background: C.bg }}>
        <div style={{ width: 56, height: 56, borderRadius: 14, background: 'rgba(248,113,113,0.08)', border: '1px solid rgba(248,113,113,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <ShieldCheck size={26} style={{ color: '#f87171' }} />
        </div>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontFamily: 'var(--font-exo)', fontWeight: 800, fontSize: 17, color: '#fff', marginBottom: 8 }}>Akses Ditolak</p>
          <p style={{ fontFamily: 'var(--font-exo)', fontSize: 13, color: 'rgba(255,255,255,0.4)', maxWidth: 280, lineHeight: 1.6 }}>
            Halaman ini hanya untuk affiliator dengan fitur autotrade aktif.
          </p>
        </div>
        <button onClick={() => router.back()} style={{ marginTop: 8, padding: '10px 22px', background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.7)', borderRadius: 8, cursor: 'pointer', fontFamily: 'var(--font-exo)', fontSize: 13 }}>
          Kembali
        </button>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────

  return (
    <div style={{ minHeight: '100dvh', background: C.bg, paddingBottom: 40 }}>

      {/* Toast */}
      {toast && <Toast type={toast.type} message={toast.message} onClose={() => setToast(null)} />}

      {/* Delete Modal */}
      {deleteTarget && (
        <DeleteModal
          entry={deleteTarget}
          deleting={deleting}
          onConfirm={handleDelete}
          onClose={() => setDeleteTarget(null)}
        />
      )}

      {/* ── Header ── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(5,8,7,0.95)', backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(52,211,153,0.1)',
      }}>
        <div style={{ maxWidth: 640, margin: '0 auto', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
          <button onClick={() => router.back()} style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', padding: 7, borderRadius: 8, flexShrink: 0, transition: 'all 0.15s' }}
            onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = '#fff'; }}
            onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.5)'; }}
          >
            <ArrowLeft size={16} />
          </button>

          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
            <div style={{ width: 30, height: 30, borderRadius: 8, background: 'rgba(52,211,153,0.1)', border: '1px solid rgba(52,211,153,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Robot size={15} style={{ color: '#34d399' }} weight="duotone" />
            </div>
            <div style={{ minWidth: 0 }}>
              <p style={{ fontFamily: 'var(--font-exo)', fontWeight: 800, fontSize: 13, letterSpacing: '0.06em', textTransform: 'uppercase', color: '#fff', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                Whitelist Autotrade
              </p>
            </div>
          </div>

          <button
            onClick={() => setShowAddForm(v => !v)}
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '8px 13px', flexShrink: 0,
              background: showAddForm ? 'rgba(52,211,153,0.18)' : 'rgba(52,211,153,0.1)',
              border: `1px solid ${showAddForm ? 'rgba(52,211,153,0.5)' : 'rgba(52,211,153,0.28)'}`,
              color: '#34d399', borderRadius: 7, cursor: 'pointer',
              fontFamily: 'var(--font-exo)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.06em', textTransform: 'uppercase',
              transition: 'all 0.2s',
            }}
          >
            {showAddForm ? <X size={13} weight="bold" /> : <Plus size={13} weight="bold" />}
            {showAddForm ? 'Tutup' : 'Tambah'}
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 640, margin: '0 auto', padding: '16px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

        {/* ── Stat Bar ── */}
        <div style={{
          display: 'grid', gridTemplateColumns: '1fr 1fr',
          gap: 10,
        }}>
          {/* Total */}
          <div style={{ padding: '13px 14px', background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.18)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <Users size={13} style={{ color: 'rgba(52,211,153,0.6)' }} />
              <span style={{ fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(52,211,153,0.6)' }}>
                Total
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 26, fontWeight: 800, color: '#34d399', lineHeight: 1 }}>
              {loading ? '—' : totalWhitelisted}
            </p>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>user diwhitelist</p>
          </div>

          {/* Status */}
          <div style={{ padding: '13px 14px', background: C.card, border: `1px solid ${C.bdr}`, borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 6 }}>
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: '#34d399', display: 'inline-block', boxShadow: '0 0 6px rgba(52,211,153,0.8)', animation: 'pulse 2s ease infinite' }} />
              <span style={{ fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
                Status
              </span>
            </div>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 15, fontWeight: 800, color: '#34d399', lineHeight: 1 }}>
              AKTIF
            </p>
            <p style={{ fontFamily: 'var(--font-exo)', fontSize: 10, color: 'rgba(255,255,255,0.3)', marginTop: 4 }}>autotrade enabled</p>
          </div>
        </div>

        {/* ── Add Form ── */}
        {showAddForm && (
          <div style={{
            padding: '16px',
            background: 'rgba(52,211,153,0.04)',
            border: '1px solid rgba(52,211,153,0.2)',
            borderRadius: 12,
            animation: 'slide-up 0.2s ease',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
              <UserPlus size={15} style={{ color: '#34d399' }} />
              <span style={{ fontFamily: 'var(--font-exo)', fontSize: 12, fontWeight: 700, color: '#34d399', letterSpacing: '0.07em', textTransform: 'uppercase' }}>
                Tambah User ID
              </span>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>
                  User ID <span style={{ color: '#f87171' }}>*</span>
                </label>
                <input
                  className="ds-input"
                  placeholder="Contoh: 12345"
                  value={newUserId}
                  onChange={e => setNewUserId(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleAdd()}
                  autoComplete="off"
                />
              </div>

              <div>
                <label style={{ display: 'block', fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.4)', marginBottom: 5 }}>
                  Catatan <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400, textTransform: 'none', letterSpacing: 0 }}>(opsional)</span>
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
                  width: '100%', padding: '12px 0', marginTop: 2,
                  background: adding || !newUserId.trim() ? 'rgba(52,211,153,0.04)' : 'rgba(52,211,153,0.13)',
                  border: '1px solid rgba(52,211,153,0.3)', color: '#34d399',
                  borderRadius: 8, cursor: adding || !newUserId.trim() ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-exo)', fontSize: 13, fontWeight: 700,
                  letterSpacing: '0.08em', textTransform: 'uppercase',
                  opacity: adding || !newUserId.trim() ? 0.45 : 1,
                  transition: 'all 0.2s ease',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}
              >
                {adding ? (
                  <>
                    <span style={{ width: 13, height: 13, border: '2px solid #34d399', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                    Menambahkan...
                  </>
                ) : (
                  <>
                    <Plus size={14} weight="bold" />
                    Tambahkan ke Whitelist
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* ── Check ID ── */}
        <div style={{
          padding: '14px 15px',
          background: C.card,
          border: `1px solid ${C.bdr}`,
          borderRadius: 12,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 11 }}>
            <MagnifyingGlass size={13} style={{ color: 'rgba(255,255,255,0.35)' }} />
            <span style={{ fontFamily: 'var(--font-exo)', fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
              Cek Status User ID
            </span>
          </div>

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
                padding: '0 16px', flexShrink: 0, height: 42,
                background: checking || !checkId.trim() ? 'rgba(255,255,255,0.03)' : 'rgba(52,211,153,0.08)',
                border: `1px solid ${checking || !checkId.trim() ? 'rgba(255,255,255,0.08)' : 'rgba(52,211,153,0.25)'}`,
                color: checking || !checkId.trim() ? 'rgba(255,255,255,0.3)' : '#34d399',
                borderRadius: 6, cursor: checking || !checkId.trim() ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-exo)', fontSize: 12, fontWeight: 700,
                whiteSpace: 'nowrap', transition: 'all 0.2s',
                opacity: checking || !checkId.trim() ? 0.5 : 1,
              }}
            >
              {checking ? (
                <span style={{ width: 13, height: 13, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
              ) : 'Cek'}
            </button>
          </div>

          {checkResult && (
            <div style={{
              marginTop: 10, padding: '10px 12px',
              background: checkResult.isWhitelisted ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)',
              border: `1px solid ${checkResult.isWhitelisted ? 'rgba(52,211,153,0.22)' : 'rgba(248,113,113,0.22)'}`,
              borderRadius: 8, display: 'flex', alignItems: 'center', gap: 9,
              animation: 'slide-up 0.2s ease',
            }}>
              {checkResult.isWhitelisted
                ? <CheckCircle size={15} weight="fill" style={{ color: '#34d399', flexShrink: 0 }} />
                : <Warning size={15} weight="fill" style={{ color: '#f87171', flexShrink: 0 }} />
              }
              <span style={{ fontFamily: 'var(--font-exo)', fontSize: 13, color: checkResult.isWhitelisted ? '#34d399' : '#f87171' }}>
                ID <strong>{checkResult.userId}</strong> {checkResult.isWhitelisted ? 'sudah diwhitelist ✓' : 'belum diwhitelist ✗'}
              </span>
            </div>
          )}
        </div>

        {/* ── Info Banner ── */}
        <div style={{
          padding: '11px 13px',
          background: 'rgba(52,211,153,0.04)', border: '1px solid rgba(52,211,153,0.12)',
          borderRadius: 8, display: 'flex', gap: 9, alignItems: 'flex-start',
        }}>
          <Info size={14} style={{ color: 'rgba(52,211,153,0.5)', flexShrink: 0, marginTop: 1 }} />
          <p style={{ fontFamily: 'var(--font-exo)', fontSize: 11.5, color: 'rgba(255,255,255,0.4)', lineHeight: 1.6 }}>
            Hanya User ID yang terdaftar di sini yang bisa login ke bot autotrade kamu.
          </p>
        </div>

        {/* ── Whitelist List ── */}
        <div style={{ borderRadius: 12, overflow: 'hidden', border: `1px solid ${C.bdr}` }}>

          {/* Header */}
          <div style={{
            padding: '10px 16px',
            background: 'rgba(52,211,153,0.04)',
            borderBottom: '1px solid rgba(52,211,153,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <span style={{ fontFamily: 'var(--font-exo)', fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)' }}>
              Daftar User
            </span>
            {!loading && (
              <span style={{ fontFamily: 'var(--font-exo)', fontSize: 10, color: 'rgba(52,211,153,0.6)', fontWeight: 700 }}>
                {entries.length} user
              </span>
            )}
          </div>

          {/* Rows */}
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <SkeletonRow key={i} />)
          ) : entries.length === 0 ? (
            <div style={{ padding: '40px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Users size={22} style={{ color: 'rgba(255,255,255,0.12)' }} />
              </div>
              <div style={{ textAlign: 'center' }}>
                <p style={{ fontFamily: 'var(--font-exo)', fontSize: 13, color: 'rgba(255,255,255,0.3)', marginBottom: 4 }}>Whitelist masih kosong</p>
                <p style={{ fontFamily: 'var(--font-exo)', fontSize: 11, color: 'rgba(255,255,255,0.18)' }}>Tambahkan User ID dengan tombol + Tambah</p>
              </div>
            </div>
          ) : (
            entries.map((entry, idx) => (
              <div
                key={entry.id}
                style={{
                  padding: '13px 16px',
                  borderBottom: idx < entries.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                  display: 'flex', alignItems: 'center', gap: 12,
                  background: 'transparent',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.03)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                {/* Avatar / index */}
                <div style={{
                  width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                  background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.15)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: 'var(--font-exo)', fontSize: 11, fontWeight: 800, color: 'rgba(52,211,153,0.7)' }}>
                    {String(idx + 1).padStart(2, '0')}
                  </span>
                </div>

                {/* Main info */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  {/* User ID row */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                    <span style={{ fontFamily: 'monospace', fontSize: 14, fontWeight: 700, color: '#34d399' }}>
                      {entry.userId}
                    </span>
                    <button
                      onClick={() => copyId(entry.userId)}
                      style={{ background: 'none', border: 'none', color: copied === entry.userId ? '#34d399' : 'rgba(255,255,255,0.2)', cursor: 'pointer', display: 'flex', padding: 2, transition: 'color 0.15s' }}
                    >
                      {copied === entry.userId ? <Check size={11} /> : <Copy size={11} />}
                    </button>
                  </div>

                  {/* Email + note */}
                  <p style={{ fontFamily: 'var(--font-exo)', fontSize: 11, color: 'rgba(255,255,255,0.3)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {maskEmail(entry.userEmail)}
                    {entry.note && <span style={{ color: 'rgba(255,255,255,0.2)' }}> · {entry.note}</span>}
                  </p>

                  {/* Date — shown below on mobile */}
                  <p style={{ fontFamily: 'var(--font-exo)', fontSize: 10, color: 'rgba(255,255,255,0.2)', marginTop: 2 }}>
                    {formatDate(entry.addedAt)}
                  </p>
                </div>

                {/* Active badge */}
                {entry.isActive && (
                  <span style={{
                    fontSize: 9, fontFamily: 'var(--font-exo)', fontWeight: 700,
                    padding: '3px 7px', borderRadius: 4,
                    color: '#34d399', background: 'rgba(52,211,153,0.08)',
                    border: '1px solid rgba(52,211,153,0.18)',
                    letterSpacing: '0.06em', textTransform: 'uppercase',
                    flexShrink: 0,
                    display: 'none', // hidden on very small screens via JS style below
                  }}
                    className="hidden sm:inline-flex"
                  >
                    Aktif
                  </span>
                )}

                {/* Delete button */}
                <button
                  onClick={() => setDeleteTarget(entry)}
                  style={{
                    width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(248,113,113,0.05)', border: '1px solid rgba(248,113,113,0.12)',
                    color: 'rgba(248,113,113,0.45)', borderRadius: 7, cursor: 'pointer', flexShrink: 0,
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = 'rgba(248,113,113,0.14)';
                    b.style.color = '#f87171';
                    b.style.borderColor = 'rgba(248,113,113,0.3)';
                  }}
                  onMouseLeave={e => {
                    const b = e.currentTarget as HTMLButtonElement;
                    b.style.background = 'rgba(248,113,113,0.05)';
                    b.style.color = 'rgba(248,113,113,0.45)';
                    b.style.borderColor = 'rgba(248,113,113,0.12)';
                  }}
                >
                  <Trash size={13} />
                </button>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}