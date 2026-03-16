'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import type { AffiliatorDashboard } from '@/lib/types';
import {
  At, Phone, Gift, IdentificationCard,
  Copy, Check, SignOut, ShieldCheck,
  Plus, Trash, MagnifyingGlass, X,
  CheckCircle, Warning, UsersThree,
} from '@phosphor-icons/react';

// ─── DESIGN TOKENS ───────────────────────────────────────────
const C = {
  bg:    '#0f0f0f',
  card:  '#1a1a1a',
  bdrLo: 'rgba(255,255,255,0.06)',
  bdr:   'rgba(52,211,153,0.18)',
  cyan:  '#34d399',
  coral: '#f87171',
  text:  '#ffffff',
  sub:   'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.40)',
  faint: 'rgba(255,255,255,0.04)',
};

// ─── HELPERS ─────────────────────────────────────────────────
const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    const { state } = JSON.parse(localStorage.getItem('auth-storage') || '{}');
    return state?.token ?? null;
  } catch { return null; }
}

const initials = (name?: string, email?: string) => {
  if (name) return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (email?.[0] ?? '?').toUpperCase();
};

const maskEmail = (email: string) => {
  const [user, domain] = email.split('@');
  if (!domain) return email;
  const masked = user.length <= 2 ? user[0] + '*' : user[0] + '***' + user[user.length - 1];
  return `${masked}@${domain}`;
};

// ─── TYPES ───────────────────────────────────────────────────
interface WhitelistEntry {
  id: string; userId: string; userEmail: string;
  note?: string; addedAt: string; isActive: boolean;
}

// ─── COPY BUTTON ─────────────────────────────────────────────
const CopyBtn = ({ value, size = 12 }: { value: string; size?: number }) => {
  const [done, setDone] = useState(false);
  return (
    <button
      onClick={() => navigator.clipboard.writeText(value).then(() => { setDone(true); setTimeout(() => setDone(false), 1800); })}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', color: done ? C.cyan : 'rgba(255,255,255,0.22)', display: 'flex', alignItems: 'center', transition: 'color 0.15s' }}
    >
      {done ? <Check size={size} weight="bold" /> : <Copy size={size} />}
    </button>
  );
};

// ─── SECTION LABEL ───────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)', marginBottom: 8, paddingLeft: 2 }}>
    {children}
  </p>
);

// ─── INFO ROW ────────────────────────────────────────────────
const InfoRow = ({ icon, label, value, copyable, mono, last }: {
  icon: React.ReactNode; label: string; value: string;
  copyable?: boolean; mono?: boolean; last?: boolean;
}) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px', borderBottom: last ? 'none' : `1px solid ${C.bdrLo}` }}>
    <div style={{ color: 'rgba(255,255,255,0.20)', flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center' }}>{icon}</div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.06em', marginBottom: 2 }}>{label}</p>
      <p style={{ fontSize: 13, color: C.text, fontFamily: mono ? 'monospace' : 'inherit', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {value || '—'}
      </p>
    </div>
    {copyable && value && <CopyBtn value={value} />}
  </div>
);

// ─── SKELETON ────────────────────────────────────────────────
const skBase: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%', animation: 'skeleton-pulse 1.6s ease infinite', borderRadius: 5,
};
const Sk = ({ w = '100%', h = 12 }: { w?: string | number; h?: number }) => (
  <div style={{ width: w, height: h, ...skBase }} />
);

// ─── PAGE ─────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();

  // ── Affiliate state ──────────────────────────────────────────
  const [affiliate, setAffiliate]               = useState<AffiliatorDashboard | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(true);

  // ── Whitelist state ──────────────────────────────────────────
  const [entries, setEntries]   = useState<WhitelistEntry[]>([]);
  const [wlLoading, setWlLoading] = useState(true);
  const [wlAccess, setWlAccess]   = useState(false);

  // Add form
  const [showAdd, setShowAdd] = useState(false);
  const [newId, setNewId]     = useState('');
  const [newNote, setNewNote] = useState('');
  const [adding, setAdding]   = useState(false);

  // Check ID
  const [checkId, setCheckId]         = useState('');
  const [checking, setChecking]       = useState(false);
  const [checkResult, setCheckResult] = useState<{ userId: string; isWhitelisted: boolean } | null>(null);

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<WhitelistEntry | null>(null);
  const [deleting, setDeleting]         = useState(false);

  // Toast
  const [toast, setToast] = useState<{ type: 'success' | 'error'; msg: string } | null>(null);
  const showToast = (type: 'success' | 'error', msg: string) => {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  };

  // ── Auth gate ────────────────────────────────────────────────
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.push('/');
  }, [hasHydrated, isAuthenticated, router]);

  // ── Load affiliate ───────────────────────────────────────────
  useEffect(() => {
    if (!hasHydrated || !isAuthenticated) return;
    (async () => {
      setAffiliateLoading(true);
      try { setAffiliate(await api.getMyAffiliateProgram() ?? null); }
      catch { setAffiliate(null); }
      finally { setAffiliateLoading(false); }
    })();
  }, [hasHydrated, isAuthenticated]);

  // ── Load whitelist ───────────────────────────────────────────
  const fetchWhitelist = useCallback(async () => {
    setWlLoading(true);
    try {
      const res  = await fetch(`${API}/affiliate-program/autotrade/whitelist`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (res.status === 403) { setWlAccess(false); return; }
      if (!json.success || !json.data) throw new Error();
      setEntries(json.data.whitelist);
      setWlAccess(true);
    } catch { setWlAccess(false); }
    finally { setWlLoading(false); }
  }, []);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) fetchWhitelist();
  }, [hasHydrated, isAuthenticated, fetchWhitelist]);

  // ── Whitelist actions ────────────────────────────────────────
  const handleAdd = async () => {
    if (!newId.trim()) return;
    setAdding(true);
    try {
      const res  = await fetch(`${API}/affiliate-program/autotrade/whitelist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify({ userId: newId.trim(), note: newNote.trim() || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || json.message || 'Gagal menambahkan');
      showToast('success', `User ${newId} ditambahkan`);
      setNewId(''); setNewNote(''); setShowAdd(false);
      fetchWhitelist();
    } catch (e: any) { showToast('error', e.message); }
    finally { setAdding(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res  = await fetch(`${API}/affiliate-program/autotrade/whitelist/${deleteTarget.userId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal menghapus');
      showToast('success', `User ${deleteTarget.userId} dihapus`);
      setDeleteTarget(null);
      fetchWhitelist();
    } catch (e: any) { showToast('error', e.message); }
    finally { setDeleting(false); }
  };

  const handleCheck = async () => {
    if (!checkId.trim()) return;
    setChecking(true); setCheckResult(null);
    try {
      const res  = await fetch(`${API}/affiliate-program/autotrade/whitelist/check/${checkId.trim()}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Gagal memeriksa');
      setCheckResult(json.data);
    } catch (e: any) { showToast('error', e.message); }
    finally { setChecking(false); }
  };

  // ── Loading gate ─────────────────────────────────────────────
  if (!hasHydrated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid rgba(52,211,153,0.15)', borderTopColor: C.cyan, animation: 'spin 0.8s linear infinite' }} />
    </div>
  );
  if (!isAuthenticated || !user) return null;

  const displayName = user.fullName || user.email.split('@')[0];
  const roleLabel   = user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User';

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 88, background: C.bg }}>

      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: 96, left: '50%', transform: 'translateX(-50%)',
          zIndex: 9999, width: 'calc(100% - 32px)', maxWidth: 400,
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px',
          background: toast.type === 'success' ? 'rgba(52,211,153,0.1)' : 'rgba(248,113,113,0.1)',
          border: `1px solid ${toast.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(248,113,113,0.3)'}`,
          borderRadius: 10, backdropFilter: 'blur(12px)',
          animation: 'slide-up 0.25s ease', boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        }}>
          {toast.type === 'success'
            ? <CheckCircle size={15} weight="fill" color={C.cyan} style={{ flexShrink: 0 }} />
            : <Warning     size={15} weight="fill" color={C.coral} style={{ flexShrink: 0 }} />}
          <span style={{ fontSize: 13, color: C.sub, flex: 1 }}>{toast.msg}</span>
        </div>
      )}

      {/* Delete confirm bottom sheet */}
      {deleteTarget && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'flex-end', justifyContent: 'center' }}>
          <div onClick={() => setDeleteTarget(null)} style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(6px)' }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#1a1a1a', border: '1px solid rgba(248,113,113,0.18)', borderRadius: '16px 16px 0 0', padding: '20px 18px 36px', animation: 'slide-up 0.22s ease' }}>
            <div style={{ width: 32, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.10)', margin: '0 auto 18px' }} />
            <p style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 6 }}>Hapus dari Whitelist?</p>
            <p style={{ fontSize: 12, color: C.muted, marginBottom: 16, lineHeight: 1.5 }}>
              User <span style={{ color: C.cyan, fontWeight: 600 }}>{deleteTarget.userId}</span> tidak bisa menggunakan autotrade setelah dihapus.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button onClick={() => setDeleteTarget(null)} style={{ flex: 1, padding: '11px 0', background: C.faint, border: `1px solid ${C.bdrLo}`, color: C.muted, borderRadius: 8, cursor: 'pointer', fontSize: 13 }}>Batal</button>
              <button onClick={handleDelete} disabled={deleting} style={{ flex: 1, padding: '11px 0', background: 'rgba(248,113,113,0.12)', border: '1px solid rgba(248,113,113,0.28)', color: C.coral, borderRadius: 8, cursor: 'pointer', fontSize: 13, fontWeight: 700, opacity: deleting ? 0.6 : 1 }}>
                {deleting ? 'Menghapus...' : 'Hapus'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{ position: 'sticky', top: 0, zIndex: 40, background: 'rgba(15,15,15,0.92)', backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', borderBottom: `1px solid ${C.bdrLo}` }}>
        <div style={{ maxWidth: 540, margin: '0 auto', padding: '14px 16px' }}>
          <h1 style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Profil</h1>
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ══════════════════════════════════════════════════════
            1 — PROFIL PENGGUNA
        ══════════════════════════════════════════════════════ */}
        <div>
          <SectionLabel>Profil Pengguna</SectionLabel>
          <div style={{ background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, overflow: 'hidden' }}>

            {/* Avatar hero */}
            <div style={{ padding: '18px 16px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: `1px solid ${C.bdrLo}` }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'rgba(52,211,153,0.10)', border: '1px solid rgba(52,211,153,0.20)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: 17, fontWeight: 800, color: C.cyan }}>{initials(user.fullName, user.email)}</span>
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayName}</p>
                <span style={{ display: 'inline-block', fontSize: 9, fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', padding: '2px 7px', borderRadius: 4, color: user.role === 'user' ? C.muted : C.cyan, background: user.role === 'user' ? C.faint : 'rgba(52,211,153,0.10)', border: `1px solid ${user.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(52,211,153,0.22)'}` }}>
                  {roleLabel}
                </span>
              </div>
            </div>

            <InfoRow icon={<At size={15} />}   label="Email"         value={user.email}             copyable />
            <InfoRow icon={<Phone size={15} />} label="No. Telepon"   value={user.phoneNumber ?? ''} />
            <InfoRow icon={<Gift size={15} />}  label="Kode Referral" value={user.referralCode}      copyable mono last />
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            2 — AFFILIATE (compact one-liner)
        ══════════════════════════════════════════════════════ */}
        <div>
          <SectionLabel>Affiliate</SectionLabel>

          {affiliateLoading ? (
            <div style={{ background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, padding: '14px 16px', display: 'flex', gap: 16 }}>
              <Sk w={80} h={11} /><Sk w={60} h={11} /><Sk w={60} h={11} />
            </div>
          ) : !affiliate ? (
            <div style={{ background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UsersThree size={14} color={C.muted} />
              <span style={{ fontSize: 12, color: C.muted }}>Belum terdaftar sebagai affiliator</span>
            </div>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap' }}>
              {/* Code */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                <span style={{ fontSize: 10, color: C.muted }}>Kode</span>
                <span style={{ fontSize: 13, fontWeight: 700, color: C.cyan, fontFamily: 'monospace', letterSpacing: '0.05em' }}>{affiliate.affiliateCode}</span>
                <CopyBtn value={affiliate.affiliateCode} />
              </div>

              <div style={{ width: 1, height: 18, background: C.bdrLo, flexShrink: 0 }} />

              {/* Stats */}
              <div style={{ display: 'flex', gap: 12 }}>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.text, lineHeight: 1 }}>{affiliate.stats.totalInvited}</p>
                  <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>Undangan</p>
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: C.cyan, lineHeight: 1 }}>{affiliate.stats.depositedInvites}</p>
                  <p style={{ fontSize: 9, color: C.muted, marginTop: 2 }}>Deposit</p>
                </div>
              </div>

              <div style={{ width: 1, height: 18, background: C.bdrLo, flexShrink: 0 }} />

              {/* Commission */}
              <div>
                <p style={{ fontSize: 9, color: C.muted, marginBottom: 2 }}>Komisi</p>
                <p style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  Rp {affiliate.balances.commissionBalance.toLocaleString('id-ID')}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            3 — PANEL WHITELIST
        ══════════════════════════════════════════════════════ */}
        <div>
          {/* Label + Tambah button side by side */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <SectionLabel>Whitelist Autotrade</SectionLabel>
            {!wlLoading && wlAccess && (
              <button
                onClick={() => { setShowAdd(v => !v); setNewId(''); setNewNote(''); }}
                style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '4px 10px', background: showAdd ? 'rgba(52,211,153,0.10)' : 'transparent', border: `1px solid ${showAdd ? 'rgba(52,211,153,0.30)' : C.bdrLo}`, borderRadius: 6, color: showAdd ? C.cyan : C.muted, fontSize: 11, cursor: 'pointer', transition: 'all 0.15s', marginBottom: 8 }}
              >
                {showAdd ? <X size={11} weight="bold" /> : <Plus size={11} weight="bold" />}
                {showAdd ? 'Tutup' : 'Tambah'}
              </button>
            )}
          </div>

          {wlLoading ? (
            <div style={{ background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[1,2,3].map(i => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 7, ...skBase, flexShrink: 0 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 5 }}><Sk w="40%" h={11} /><Sk w="60%" h={9} /></div>
                </div>
              ))}
            </div>
          ) : !wlAccess ? (
            <div style={{ background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, padding: '16px', display: 'flex', alignItems: 'center', gap: 8 }}>
              <UsersThree size={14} color={C.muted} />
              <span style={{ fontSize: 12, color: C.muted }}>Fitur whitelist autotrade tidak aktif</span>
            </div>
          ) : (
            <div style={{ background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, overflow: 'hidden' }}>

              {/* Add form */}
              {showAdd && (
                <div style={{ padding: '14px 16px', borderBottom: `1px solid ${C.bdrLo}`, display: 'flex', flexDirection: 'column', gap: 10, background: 'rgba(52,211,153,0.03)', animation: 'slide-up 0.18s ease' }}>
                  <input
                    className="ds-input"
                    placeholder="User ID *"
                    value={newId}
                    onChange={e => setNewId(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleAdd()}
                    autoComplete="off"
                  />
                  <input
                    className="ds-input"
                    placeholder="Catatan (opsional)"
                    value={newNote}
                    onChange={e => setNewNote(e.target.value)}
                  />
                  <button
                    onClick={handleAdd}
                    disabled={adding || !newId.trim()}
                    style={{ padding: '10px 0', background: adding || !newId.trim() ? C.faint : 'rgba(52,211,153,0.12)', border: `1px solid ${adding || !newId.trim() ? C.bdrLo : 'rgba(52,211,153,0.30)'}`, borderRadius: 7, color: C.cyan, fontSize: 12, fontWeight: 700, cursor: adding || !newId.trim() ? 'not-allowed' : 'pointer', opacity: adding || !newId.trim() ? 0.45 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }}
                  >
                    {adding
                      ? <><span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />Menambahkan...</>
                      : <><Plus size={12} weight="bold" />Tambahkan</>}
                  </button>
                </div>
              )}

              {/* Check ID */}
              <div style={{ padding: '12px 14px', borderBottom: `1px solid ${C.bdrLo}` }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <MagnifyingGlass size={12} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: C.muted }} />
                    <input
                      className="ds-input"
                      style={{ paddingLeft: 28 }}
                      placeholder="Cek User ID..."
                      value={checkId}
                      onChange={e => { setCheckId(e.target.value); setCheckResult(null); }}
                      onKeyDown={e => e.key === 'Enter' && handleCheck()}
                    />
                  </div>
                  <button
                    onClick={handleCheck}
                    disabled={checking || !checkId.trim()}
                    style={{ padding: '0 14px', flexShrink: 0, height: 42, background: !checkId.trim() ? 'transparent' : 'rgba(52,211,153,0.08)', border: `1px solid ${!checkId.trim() ? C.bdrLo : 'rgba(52,211,153,0.25)'}`, borderRadius: 7, color: !checkId.trim() ? C.muted : C.cyan, fontSize: 12, fontWeight: 600, cursor: !checkId.trim() ? 'not-allowed' : 'pointer', opacity: checking || !checkId.trim() ? 0.5 : 1, whiteSpace: 'nowrap' }}
                  >
                    {checking
                      ? <span style={{ width: 12, height: 12, border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'spin 0.7s linear infinite' }} />
                      : 'Cek'}
                  </button>
                </div>
                {checkResult && (
                  <div style={{ marginTop: 8, padding: '8px 11px', background: checkResult.isWhitelisted ? 'rgba(52,211,153,0.07)' : 'rgba(248,113,113,0.07)', border: `1px solid ${checkResult.isWhitelisted ? 'rgba(52,211,153,0.20)' : 'rgba(248,113,113,0.20)'}`, borderRadius: 7, display: 'flex', alignItems: 'center', gap: 8, animation: 'slide-up 0.18s ease' }}>
                    {checkResult.isWhitelisted
                      ? <CheckCircle size={13} weight="fill" color={C.cyan} style={{ flexShrink: 0 }} />
                      : <Warning     size={13} weight="fill" color={C.coral} style={{ flexShrink: 0 }} />}
                    <span style={{ fontSize: 12, color: checkResult.isWhitelisted ? C.cyan : C.coral }}>
                      <strong>{checkResult.userId}</strong> {checkResult.isWhitelisted ? '✓ diwhitelist' : '✗ belum diwhitelist'}
                    </span>
                  </div>
                )}
              </div>

              {/* List header */}
              <div style={{ padding: '9px 14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${C.bdrLo}` }}>
                <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.22)', letterSpacing: '0.08em', textTransform: 'uppercase' }}>Daftar User</span>
                <span style={{ fontSize: 10, color: 'rgba(52,211,153,0.50)', fontWeight: 700 }}>{entries.length} user</span>
              </div>

              {/* Entries */}
              {entries.length === 0 ? (
                <div style={{ padding: '28px 16px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <UsersThree size={20} color="rgba(255,255,255,0.10)" />
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.18)', marginTop: 4 }}>Whitelist masih kosong</p>
                </div>
              ) : entries.map((entry, idx) => (
                <div
                  key={entry.id}
                  style={{ padding: '11px 14px', borderBottom: idx < entries.length - 1 ? `1px solid ${C.bdrLo}` : 'none', display: 'flex', alignItems: 'center', gap: 10, transition: 'background 0.12s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.02)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 7, flexShrink: 0, background: 'rgba(52,211,153,0.07)', border: '1px solid rgba(52,211,153,0.14)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span style={{ fontSize: 10, fontWeight: 800, color: 'rgba(52,211,153,0.55)' }}>{String(idx + 1).padStart(2, '0')}</span>
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: C.cyan, fontFamily: 'monospace' }}>{entry.userId}</span>
                      <CopyBtn value={entry.userId} size={11} />
                    </div>
                    <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.26)', marginTop: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {maskEmail(entry.userEmail)}{entry.note && ` · ${entry.note}`}
                    </p>
                  </div>
                  <button
                    onClick={() => setDeleteTarget(entry)}
                    style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'transparent', border: '1px solid transparent', borderRadius: 6, color: 'rgba(248,113,113,0.30)', cursor: 'pointer', flexShrink: 0, transition: 'all 0.12s' }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'rgba(248,113,113,0.08)'; b.style.borderColor = 'rgba(248,113,113,0.20)'; b.style.color = C.coral; }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.borderColor = 'transparent'; b.style.color = 'rgba(248,113,113,0.30)'; }}
                  >
                    <Trash size={13} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            4 — INFORMASI AKUN
        ══════════════════════════════════════════════════════ */}
        <div>
          <SectionLabel>Informasi Akun</SectionLabel>
          <div style={{ background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, overflow: 'hidden' }}>
            <InfoRow icon={<IdentificationCard size={15} />} label="User ID"         value={user.id}    copyable mono />
            <InfoRow icon={<At size={15} />}                 label="Email Terdaftar" value={user.email} />
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px' }}>
              <div style={{ color: 'rgba(255,255,255,0.20)', flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center' }}><ShieldCheck size={15} /></div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.06em', marginBottom: 2 }}>Verifikasi Email</p>
                <p style={{ fontSize: 13, color: user.isEmailVerified ? C.cyan : C.coral }}>
                  {user.isEmailVerified ? 'Terverifikasi' : 'Belum diverifikasi'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Logout ───────────────────────────────────────── */}
        <button
          onClick={() => { clearAuth(); router.push('/'); }}
          style={{ width: '100%', padding: '12px 16px', background: 'transparent', border: '1px solid rgba(248,113,113,0.12)', borderRadius: 10, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, color: 'rgba(248,113,113,0.50)', fontSize: 13, transition: 'all 0.15s' }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(248,113,113,0.06)'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)'; e.currentTarget.style.color = C.coral; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.borderColor = 'rgba(248,113,113,0.12)'; e.currentTarget.style.color = 'rgba(248,113,113,0.50)'; }}
        >
          <SignOut size={15} />
          Keluar
        </button>

      </div>
      <BottomNav />
    </div>
  );
}