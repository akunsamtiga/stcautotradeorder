'use client';
import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { SquaresFour, ClockCounterClockwise, User, Globe } from '@phosphor-icons/react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', Icon: SquaresFour },
  { href: '/history',   label: 'History',   Icon: ClockCounterClockwise },
  { href: '/webview',   label: 'Trade',     Icon: Globe },
  { href: '/profile',   label: 'Profil',    Icon: User },
];

export const BottomNav = () => {
  const pathname = usePathname();

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(5, 8, 7, 0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      {/* Active tab top indicator line */}
      <div className="relative flex">
        {navItems.map(({ href }) => {
          const isActive = pathname === href;
          return (
            <div
              key={href}
              className="flex-1 h-[1.5px] transition-all duration-300"
              style={{
                background: isActive
                  ? 'linear-gradient(to right, transparent, rgba(52,211,153,0.9), transparent)'
                  : 'transparent',
                boxShadow: isActive ? '0 0 8px rgba(52,211,153,0.4)' : 'none',
              }}
            />
          );
        })}
      </div>

      {/* Nav items */}
      <div className="flex items-stretch">
        {navItems.map(({ href, label, Icon }) => {
          const isActive = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-[5px] py-3 relative transition-all duration-200"
              style={{
                color: isActive ? '#34d399' : 'rgba(255,255,255,0.3)',
                textDecoration: 'none',
              }}
            >
              {/* Icon */}
              <div
                className="relative flex items-center justify-center transition-transform duration-200"
                style={{ transform: isActive ? 'translateY(-1px)' : 'translateY(0)' }}
              >
                <Icon
                  size={20}
                  weight={isActive ? 'fill' : 'regular'}
                  style={{
                    filter: isActive
                      ? 'drop-shadow(0 0 6px rgba(52,211,153,0.5))'
                      : 'none',
                    transition: 'filter 0.2s ease',
                  }}
                />
              </div>

              {/* Label */}
              <span
                className="transition-all duration-200"
                style={{
                  fontFamily: 'var(--font-exo)',
                  fontSize: 10,
                  fontWeight: isActive ? 600 : 400,
                  letterSpacing: '0.06em',
                  opacity: isActive ? 1 : 0.7,
                }}
              >
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};