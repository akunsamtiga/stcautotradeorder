'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SquaresFour, ClockCounterClockwise, User } from '@phosphor-icons/react';

const navItems = [
  { href: '/dashboard', label: 'DASHBOARD', Icon: SquaresFour },
  { href: '/history',   label: 'HISTORY',   Icon: ClockCounterClockwise },
  { href: '/profile',   label: 'PROFIL',    Icon: User },
];

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
      background: '#02090a',
      borderTop: '1px solid rgba(52,211,153,0.12)',
      paddingBottom: 'env(safe-area-inset-bottom)',
    }}>
      {/* Top edge glow */}
      <div style={{
        height: 2, marginTop: -2,
        background: 'linear-gradient(to right, transparent 5%, rgba(52,211,153,0.4) 30%, rgba(52,211,153,0.75) 50%, rgba(52,211,153,0.4) 70%, transparent 95%)',
        boxShadow: '0 0 6px rgba(52,211,153,0.45)',
      }} />

      <div style={{ display: 'flex', justifyContent: 'space-around', padding: '5px 8px 7px' }}>
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`bnav-item${isActive ? ' active' : ''}`}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4,
                padding: '7px 22px', position: 'relative',
                color: isActive ? '#34d399' : 'rgba(234,247,242,0.4)',
              }}
            >
              {/* Active background */}
              {isActive && (
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'rgba(52,211,153,0.04)',
                  border: '1px solid rgba(52,211,153,0.12)',
                  clipPath: 'polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
                }} />
              )}

              {/* Live ping dot */}
              {isActive && (
                <span style={{ position: 'absolute', top: 4, right: 6, display: 'inline-flex', width: 6, height: 6 }}>
                  <span style={{
                    width: 6, height: 6, background: '#34d399', borderRadius: '50%',
                    display: 'block', boxShadow: '0 0 5px #34d399',
                  }} />
                  <span style={{
                    position: 'absolute', inset: 0, background: '#34d399', borderRadius: '50%',
                    animation: 'ping 2s cubic-bezier(0,0,.2,1) infinite',
                  }} />
                </span>
              )}

              <Icon
                size={18}
                weight={isActive ? 'bold' : 'regular'}
                style={{
                  position: 'relative',
                  filter: isActive ? 'drop-shadow(0 0 5px rgba(52,211,153,0.55))' : 'none',
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
  );
};