'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, History, User } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'DASHBOARD', icon: LayoutDashboard },
  { href: '/history',   label: 'HISTORY',   icon: History },
  { href: '/profile',   label: 'PROFIL',    icon: User },
];

const CYAN  = '#34d399';
const BG    = '#02090a';
const S1    = '#06110e';
const BDR   = 'rgba(52,211,153,0.12)';

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <>
      <style>{`
        @keyframes ping { 0%{transform:scale(1);opacity:.8} 70%{transform:scale(2);opacity:0} 100%{transform:scale(2);opacity:0} }
        .bnav-item { transition: color .15s; text-decoration: none; }
        .bnav-item:not(.active):hover { color: rgba(52,211,153,.55) !important; }
      `}</style>

      <nav style={{
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
        background: BG,
        borderTop: `1px solid ${BDR}`,
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}>
        {/* Cyan edge glow line */}
        <div style={{
          height: 1, marginTop: -1,
          background: `linear-gradient(to right, transparent 5%, ${CYAN}35 35%, ${CYAN}55 50%, ${CYAN}35 65%, transparent 95%)`,
        }}/>

        <div style={{ display: 'flex', justifyContent: 'space-around', padding: '5px 8px 7px' }}>
          {navItems.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href;
            return (
              <Link key={href} href={href}
                className={`bnav-item${isActive ? ' active' : ''}`}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                  padding: '7px 22px', position: 'relative',
                  color: isActive ? CYAN : 'rgba(234,247,242,.45)',
                }}
              >
                {/* Active bg */}
                {isActive && (
                  <div style={{
                    position: 'absolute', inset: 0,
                    background: 'rgba(0,212,255,.04)',
                    border: `1px solid ${BDR}`,
                    clipPath: 'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))',
                  }}/>
                )}

                {/* Live ping for active item */}
                {isActive && (
                  <span style={{ position: 'absolute', top: 4, right: 6, display: 'inline-flex', width: 6, height: 6 }}>
                    <span style={{ width: 6, height: 6, background: CYAN, borderRadius: '50%', display: 'block', boxShadow: `0 0 5px ${CYAN}` }}/>
                    <span style={{ position: 'absolute', inset: 0, background: CYAN, borderRadius: '50%', animation: 'ping 2s cubic-bezier(0,0,.2,1) infinite' }}/>
                  </span>
                )}

                <Icon size={18} strokeWidth={isActive ? 2.5 : 1.6}
                  style={{
                    position: 'relative',
                    filter: isActive ? `drop-shadow(0 0 5px rgba(0,212,255,.5))` : 'none',
                  }}
                />
                <span style={{
                  fontFamily: 'var(--font-exo)',
                  fontSize: 10, fontWeight: isActive ? 700 : 600,
                  letterSpacing: '0.18em',
                  position: 'relative',
                }}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
};