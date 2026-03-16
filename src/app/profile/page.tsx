'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import type { AffiliatorDashboard } from '@/lib/types';
import {
  At, Phone, Gift, IdentificationCard,
  Copy, Check, SignOut, ShieldCheck, UsersThree,
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
const initials = (name?: string, email?: string) => {
  if (name) return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (email?.[0] ?? '?').toUpperCase();
};

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
            3 — PANEL WHITELIST (tombol navigasi)
        ══════════════════════════════════════════════════════ */}
        {!affiliateLoading && affiliate?.autotradeEnabled === true && <div>
          <SectionLabel>Whitelist Autotrade</SectionLabel>
          <button
            onClick={() => router.push('/whitelist')}
            style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '13px 14px', background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, cursor: 'pointer', textAlign: 'left', transition: 'border-color 0.15s ease' }}
            onMouseEnter={e => (e.currentTarget.style.borderColor = C.bdr)}
            onMouseLeave={e => (e.currentTarget.style.borderColor = C.bdrLo)}
          >
            <div style={{ width: 32, height: 32, borderRadius: 8, flexShrink: 0, background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.16)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <UsersThree size={15} color={C.cyan} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 2 }}>Panel Whitelist</p>
              <p style={{ fontSize: 11, color: C.muted }}>Kelola akses autotrade pengguna</p>
            </div>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ color: C.muted, flexShrink: 0 }}><path d="M9 18l6-6-6-6"/></svg>
          </button>
        </div>}

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