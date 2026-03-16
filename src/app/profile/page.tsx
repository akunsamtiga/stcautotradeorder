'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import type { AffiliatorDashboard } from '@/lib/types';
import {
  User, At, Phone, IdentificationCard, Copy, Check,
  SignOut, CaretRight, UsersThree, Wallet, ChartBar,
  Gift, ShieldCheck,
} from '@phosphor-icons/react';

// ─── DESIGN TOKENS ───────────────────────────────────────────
const C = {
  bg:    '#0f0f0f',
  card:  '#1a1a1a',
  bdrLo: 'rgba(255,255,255,0.06)',
  bdr:   'rgba(52,211,153,0.18)',
  cyan:  '#34d399',
  coral: '#f87171',
  amber: '#fbbf24',
  text:  '#ffffff',
  sub:   'rgba(255,255,255,0.85)',
  muted: 'rgba(255,255,255,0.40)',
  faint: 'rgba(255,255,255,0.04)',
};

// ─── HELPERS ─────────────────────────────────────────────────
const idr = (n: number) =>
  n >= 1_000_000
    ? `Rp ${(n / 1_000_000).toFixed(2)}jt`
    : `Rp ${n.toLocaleString('id-ID')}`;

const initials = (name?: string, email?: string) => {
  if (name) return name.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (email?.[0] ?? '?').toUpperCase();
};

// ─── COPY BUTTON ─────────────────────────────────────────────
const CopyBtn = ({ value }: { value: string }) => {
  const [done, setDone] = useState(false);
  const handle = () => {
    navigator.clipboard.writeText(value).then(() => {
      setDone(true);
      setTimeout(() => setDone(false), 1800);
    });
  };
  return (
    <button
      onClick={handle}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px',
        color: done ? C.cyan : 'rgba(255,255,255,0.22)',
        display: 'flex', alignItems: 'center',
        transition: 'color 0.15s ease',
      }}
    >
      {done ? <Check size={12} weight="bold" /> : <Copy size={12} />}
    </button>
  );
};

// ─── SECTION HEADER ──────────────────────────────────────────
const SectionLabel = ({ children }: { children: React.ReactNode }) => (
  <p style={{
    fontSize: 10, fontWeight: 700, letterSpacing: '0.12em',
    textTransform: 'uppercase', color: 'rgba(255,255,255,0.20)',
    marginBottom: 8, paddingLeft: 2,
  }}>
    {children}
  </p>
);

// ─── INFO ROW ────────────────────────────────────────────────
const InfoRow = ({
  icon, label, value, copyable, mono,
}: {
  icon: React.ReactNode; label: string; value: string; copyable?: boolean; mono?: boolean;
}) => (
  <div style={{
    display: 'flex', alignItems: 'center', gap: 12,
    padding: '11px 14px',
    borderBottom: `1px solid ${C.bdrLo}`,
  }}>
    <div style={{ color: 'rgba(255,255,255,0.20)', flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center' }}>
      {icon}
    </div>
    <div style={{ flex: 1, minWidth: 0 }}>
      <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.06em', marginBottom: 2 }}>{label}</p>
      <p style={{
        fontSize: 13, color: C.text, fontFamily: mono ? 'monospace' : 'inherit',
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {value || '—'}
      </p>
    </div>
    {copyable && value && <CopyBtn value={value} />}
  </div>
);

// ─── SKELETON ────────────────────────────────────────────────
const skBase: React.CSSProperties = {
  background: 'linear-gradient(90deg, rgba(255,255,255,0.04) 25%, rgba(255,255,255,0.07) 50%, rgba(255,255,255,0.04) 75%)',
  backgroundSize: '200% 100%',
  animation: 'skeleton-pulse 1.6s ease infinite',
  borderRadius: 5,
};
const Sk = ({ w = '100%', h = 12 }: { w?: string | number; h?: number }) => (
  <div style={{ width: w, height: h, ...skBase }} />
);

// ─── AFFILIATE STAT ──────────────────────────────────────────
const AffStat = ({ label, value, accent = C.muted }: { label: string; value: string | number; accent?: string }) => (
  <div style={{ flex: 1, textAlign: 'center' }}>
    <p style={{ fontSize: 16, fontWeight: 700, color: accent, lineHeight: 1 }}>{value}</p>
    <p style={{ fontSize: 10, color: C.muted, marginTop: 3, letterSpacing: '0.04em' }}>{label}</p>
  </div>
);

// ─── PAGE ─────────────────────────────────────────────────────
export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, hasHydrated, clearAuth } = useAuthStore();

  const [affiliate, setAffiliate]       = useState<AffiliatorDashboard | null>(null);
  const [affiliateLoading, setAffiliateLoading] = useState(true);

  // ── Redirect if not authenticated ──────────────────────────
  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) router.push('/');
  }, [hasHydrated, isAuthenticated, router]);

  // ── Load affiliate data ─────────────────────────────────────
  const loadAffiliate = useCallback(async () => {
    setAffiliateLoading(true);
    try {
      const data = await api.getMyAffiliateProgram();
      setAffiliate(data ?? null);
    } catch {
      setAffiliate(null);
    } finally {
      setAffiliateLoading(false);
    }
  }, []);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) loadAffiliate();
  }, [hasHydrated, isAuthenticated, loadAffiliate]);

  const handleLogout = () => {
    clearAuth();
    router.push('/');
  };

  // ── Loading gate ────────────────────────────────────────────
  if (!hasHydrated) return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: C.bg }}>
      <div style={{
        width: 22, height: 22, borderRadius: '50%',
        border: '2px solid rgba(52,211,153,0.15)',
        borderTopColor: C.cyan,
        animation: 'spin 0.8s linear infinite',
      }} />
    </div>
  );
  if (!isAuthenticated || !user) return null;

  const displayName = user.fullName || user.email.split('@')[0];
  const avatarLabel = initials(user.fullName, user.email);
  const roleLabel   = user.role === 'superadmin' ? 'Super Admin' : user.role === 'admin' ? 'Admin' : 'User';

  return (
    <div style={{ minHeight: '100vh', paddingBottom: 88, background: C.bg }}>

      {/* ── Header ───────────────────────────────────────────── */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 40,
        background: 'rgba(15,15,15,0.92)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderBottom: `1px solid ${C.bdrLo}`,
      }}>
        <div style={{ maxWidth: 540, margin: '0 auto', padding: '14px 16px' }}>
          <h1 style={{ fontSize: 14, fontWeight: 700, color: C.text }}>Profil</h1>
        </div>
      </div>

      <div style={{ maxWidth: 540, margin: '0 auto', padding: '20px 16px', display: 'flex', flexDirection: 'column', gap: 24 }}>

        {/* ══════════════════════════════════════════════════════
            SECTION 1 — PROFIL PENGGUNA
        ══════════════════════════════════════════════════════ */}
        <div>
          <SectionLabel>Profil Pengguna</SectionLabel>

          <div style={{
            background: C.card,
            border: `1px solid ${C.bdrLo}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            {/* Avatar + name hero */}
            <div style={{
              padding: '20px 16px',
              display: 'flex', alignItems: 'center', gap: 14,
              borderBottom: `1px solid ${C.bdrLo}`,
            }}>
              {/* Avatar */}
              <div style={{
                width: 52, height: 52, borderRadius: 14, flexShrink: 0,
                background: 'rgba(52,211,153,0.10)',
                border: '1px solid rgba(52,211,153,0.20)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <span style={{ fontSize: 18, fontWeight: 800, color: C.cyan }}>
                  {avatarLabel}
                </span>
              </div>

              {/* Name & role */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: 16, fontWeight: 700, color: C.text, marginBottom: 4, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {displayName}
                </p>
                <span style={{
                  display: 'inline-block',
                  fontSize: 9, fontWeight: 700, letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  padding: '2px 7px', borderRadius: 4,
                  color: user.role === 'user' ? C.muted : C.cyan,
                  background: user.role === 'user' ? C.faint : 'rgba(52,211,153,0.10)',
                  border: `1px solid ${user.role === 'user' ? 'rgba(255,255,255,0.08)' : 'rgba(52,211,153,0.22)'}`,
                }}>
                  {roleLabel}
                </span>
              </div>
            </div>

            {/* Info rows */}
            <InfoRow icon={<At size={15} />}   label="Email"        value={user.email}         copyable />
            <InfoRow icon={<Phone size={15} />} label="No. Telepon"  value={user.phoneNumber ?? ''} />
            <div style={{ borderBottom: 'none' }}>
              <InfoRow icon={<Gift size={15} />} label="Kode Referral" value={user.referralCode} copyable mono />
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 2 — PANEL AFFILIATE
        ══════════════════════════════════════════════════════ */}
        <div>
          <SectionLabel>Panel Affiliate</SectionLabel>

          {affiliateLoading ? (
            <div style={{ background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12, padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Sk w="45%" h={14} /><Sk w="70%" h={10} />
              <div style={{ display: 'flex', gap: 12, marginTop: 4 }}>
                <Sk h={40} /><Sk h={40} /><Sk h={40} />
              </div>
            </div>
          ) : !affiliate ? (
            /* Not an affiliate yet */
            <div
              onClick={() => router.push('/affiliate')}
              style={{
                background: C.card, border: `1px solid ${C.bdrLo}`, borderRadius: 12,
                padding: '16px 14px', display: 'flex', alignItems: 'center', gap: 12,
                cursor: 'pointer', transition: 'border-color 0.15s ease',
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = C.bdr)}
              onMouseLeave={e => (e.currentTarget.style.borderColor = C.bdrLo)}
            >
              <div style={{
                width: 38, height: 38, borderRadius: 10, flexShrink: 0,
                background: C.faint, border: `1px solid ${C.bdrLo}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <UsersThree size={17} color={C.muted} />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 13, fontWeight: 600, color: C.sub, marginBottom: 2 }}>Program Affiliate</p>
                <p style={{ fontSize: 11, color: C.muted }}>Bergabung & dapatkan komisi referral</p>
              </div>
              <CaretRight size={14} color={C.muted} />
            </div>
          ) : (
            /* Affiliate dashboard */
            <div style={{
              background: C.card, border: `1px solid ${C.bdrLo}`,
              borderRadius: 12, overflow: 'hidden',
            }}>
              {/* Affiliate code header */}
              <div style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${C.bdrLo}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              }}>
                <div>
                  <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.06em', marginBottom: 3 }}>Kode Affiliate</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.cyan, fontFamily: 'monospace', letterSpacing: '0.06em' }}>
                      {affiliate.affiliateCode}
                    </span>
                    <CopyBtn value={affiliate.affiliateCode} />
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <p style={{ fontSize: 10, color: C.muted, marginBottom: 3 }}>Revenue Share</p>
                  <p style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                    {affiliate.revenueSharePercentage}%
                  </p>
                </div>
              </div>

              {/* Stats row */}
              <div style={{
                padding: '14px 16px',
                display: 'flex', alignItems: 'center',
                borderBottom: `1px solid ${C.bdrLo}`,
              }}>
                <AffStat label="Undangan"  value={affiliate.stats.totalInvited} />
                <div style={{ width: 1, height: 32, background: C.bdrLo }} />
                <AffStat label="Deposit"   value={affiliate.stats.depositedInvites} accent={C.cyan} />
                <div style={{ width: 1, height: 32, background: C.bdrLo }} />
                <AffStat label="Pending"   value={affiliate.stats.pendingInvites} accent={C.amber} />
              </div>

              {/* Commission balance */}
              <div style={{
                padding: '14px 16px',
                borderBottom: `1px solid ${C.bdrLo}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                  <p style={{ fontSize: 10, color: C.muted, letterSpacing: '0.06em' }}>Saldo Komisi</p>
                  <Wallet size={13} color="rgba(255,255,255,0.20)" />
                </div>
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 6 }}>
                  <p style={{ fontSize: 20, fontWeight: 700, color: C.text }}>
                    {idr(affiliate.balances.commissionBalance)}
                  </p>
                  {affiliate.balances.lockedCommissionBalance > 0 && (
                    <p style={{ fontSize: 11, color: C.muted }}>
                      + {idr(affiliate.balances.lockedCommissionBalance)} terkunci
                    </p>
                  )}
                </div>
              </div>

              {/* Unlock progress — only if not yet unlocked */}
              {!affiliate.unlockProgress.isUnlocked && (
                <div style={{ padding: '12px 16px', borderBottom: `1px solid ${C.bdrLo}` }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <p style={{ fontSize: 10, color: C.muted }}>Progress Unlock</p>
                    <p style={{ fontSize: 10, color: C.muted }}>
                      {affiliate.unlockProgress.current}/{affiliate.unlockProgress.required}
                    </p>
                  </div>
                  <div style={{
                    height: 4, borderRadius: 99,
                    background: 'rgba(255,255,255,0.06)',
                    overflow: 'hidden',
                  }}>
                    <div style={{
                      height: '100%', borderRadius: 99,
                      width: `${Math.min(100, affiliate.unlockProgress.percentage)}%`,
                      background: `linear-gradient(90deg, ${C.cyan}, rgba(52,211,153,0.7))`,
                      transition: 'width 0.4s ease',
                    }} />
                  </div>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.20)', marginTop: 5 }}>
                    {affiliate.unlockProgress.message}
                  </p>
                </div>
              )}

              {/* Go to affiliate panel CTA */}
              <button
                onClick={() => router.push('/affiliate')}
                style={{
                  width: '100%', padding: '12px 16px',
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  color: C.cyan, fontSize: 12, fontWeight: 500,
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.04)')}
                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
                  <ChartBar size={14} />
                  Lihat panel affiliate lengkap
                </span>
                <CaretRight size={13} />
              </button>
            </div>
          )}
        </div>

        {/* ══════════════════════════════════════════════════════
            SECTION 3 — INFORMASI AKUN
        ══════════════════════════════════════════════════════ */}
        <div>
          <SectionLabel>Informasi Akun</SectionLabel>

          <div style={{
            background: C.card,
            border: `1px solid ${C.bdrLo}`,
            borderRadius: 12,
            overflow: 'hidden',
          }}>
            <InfoRow
              icon={<IdentificationCard size={15} />}
              label="User ID"
              value={user.id}
              copyable
              mono
            />
            <InfoRow
              icon={<At size={15} />}
              label="Email Terdaftar"
              value={user.email}
            />
            <div style={{ padding: '11px 14px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ color: 'rgba(255,255,255,0.20)', flexShrink: 0, width: 16, display: 'flex', justifyContent: 'center' }}>
                <ShieldCheck size={15} />
              </div>
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
          onClick={handleLogout}
          style={{
            width: '100%', padding: '12px 16px',
            background: 'transparent',
            border: '1px solid rgba(248,113,113,0.12)',
            borderRadius: 10, cursor: 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            color: 'rgba(248,113,113,0.55)', fontSize: 13,
            transition: 'all 0.15s ease',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = 'rgba(248,113,113,0.06)';
            e.currentTarget.style.borderColor = 'rgba(248,113,113,0.25)';
            e.currentTarget.style.color = C.coral;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = 'transparent';
            e.currentTarget.style.borderColor = 'rgba(248,113,113,0.12)';
            e.currentTarget.style.color = 'rgba(248,113,113,0.55)';
          }}
        >
          <SignOut size={15} />
          Keluar
        </button>

      </div>

      <BottomNav />
    </div>
  );
}