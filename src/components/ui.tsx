import React, { useEffect } from 'react';
import { X } from '@phosphor-icons/react';

// ============================================================================
// BUTTON
// ============================================================================
interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children, variant = 'primary', size = 'md', isLoading = false,
  className = '', disabled, ...props
}) => {
  const base = 'font-medium transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed';

  const variants: Record<string, string> = {
    primary:   'bg-[rgba(52,211,153,0.12)] border border-[rgba(52,211,153,0.3)] text-[#34d399] hover:bg-[rgba(52,211,153,0.18)] hover:shadow-[0_0_18px_rgba(52,211,153,0.18)]',
    secondary: 'bg-[rgba(255,255,255,0.06)] border border-[rgba(255,255,255,0.12)] text-white/70 hover:text-white hover:border-white/25',
    danger:    'bg-[rgba(255,82,99,0.10)] border border-[rgba(255,82,99,0.25)] text-[#ff5263] hover:bg-[rgba(255,82,99,0.18)]',
    ghost:     'bg-transparent border border-[rgba(52,211,153,0.2)] text-white/60 hover:text-white/90 hover:border-white/40',
  };

  const sizes: Record<string, string> = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  const clip = '[clip-path:polygon(0_0,calc(100%-8px)_0,100%_8px,100%_100%,8px_100%,0_calc(100%-8px))]';

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${clip} ${className}`}
      disabled={disabled || isLoading}
      style={{ fontFamily: 'var(--font-exo)', letterSpacing: '0.12em', textTransform: 'uppercase' }}
      {...props}
    >
      {isLoading ? (
        <span className="flex items-center justify-center gap-2">
          <span style={{
            width: 14, height: 14,
            border: '2px solid currentColor', borderTopColor: 'transparent',
            borderRadius: '50%', display: 'inline-block',
            animation: 'spin 0.8s linear infinite',
          }} />
          Loading...
        </span>
      ) : children}
    </button>
  );
};

// ============================================================================
// INPUT
// ============================================================================
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, error, className = '', ...props }) => (
  <div className="w-full">
    {label && (
      <label style={{
        display: 'block', fontFamily: 'var(--font-exo)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.65)', marginBottom: 6,
      }}>
        {label}
      </label>
    )}
    <input
      className={`ds-input ${className}`}
      style={error ? { borderColor: 'rgba(255,82,99,0.5) !important' } : undefined}
      {...props}
    />
    {error && (
      <p style={{ marginTop: 5, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff8a94' }}>
        {error}
      </p>
    )}
  </div>
);

// ============================================================================
// SELECT
// ============================================================================
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({ label, error, options, className = '', ...props }) => (
  <div className="w-full">
    {label && (
      <label style={{
        display: 'block', fontFamily: 'var(--font-exo)', fontSize: 11, fontWeight: 700,
        letterSpacing: '0.14em', textTransform: 'uppercase',
        color: 'rgba(255,255,255,0.65)', marginBottom: 6,
      }}>
        {label}
      </label>
    )}
    <select className={`ds-input ${className}`} {...props}>
      {options.map(o => (
        <option key={o.value} value={o.value}>{o.label}</option>
      ))}
    </select>
    {error && (
      <p style={{ marginTop: 5, fontFamily: 'var(--font-mono)', fontSize: 11, color: '#ff8a94' }}>
        {error}
      </p>
    )}
  </div>
);

// ============================================================================
// MODAL
// ============================================================================
interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, size = 'md' }) => {
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen) return null;

  const maxWidths: Record<string, number> = { sm: 480, md: 560, lg: 720, xl: 960 };

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 50,
      display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16,
      animation: 'fade-in 0.2s ease',
    }}>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: 'absolute', inset: 0,
          background: 'rgba(0,0,0,0.75)',
          backdropFilter: 'blur(8px)',
          WebkitBackdropFilter: 'blur(8px)',
        }}
      />

      {/* Panel */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: maxWidths[size],
        background: 'linear-gradient(135deg, #06110e 0%, #091a14 100%)',
        border: '1px solid rgba(52,211,153,0.2)',
        borderTop: '2px solid #34d399',
        boxShadow: '0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(52,211,153,0.08)',
        clipPath: 'polygon(0 0, calc(100% - 14px) 0, 100% 14px, 100% 100%, 0 100%)',
        animation: 'slide-up 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        {/* Top glow */}
        <div style={{
          position: 'absolute', top: 0, left: '20%', right: '20%', height: 2,
          background: 'linear-gradient(90deg, transparent, rgba(52,211,153,0.8), transparent)',
          boxShadow: '0 0 8px rgba(52,211,153,0.5)',
        }} />

        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '16px 20px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}>
          <h3 style={{
            fontFamily: 'var(--font-exo)', fontSize: 15, fontWeight: 800,
            letterSpacing: '0.08em', textTransform: 'uppercase', color: '#ffffff',
          }}>
            {title}
          </h3>
          <button
            onClick={onClose}
            style={{
              width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
              color: 'rgba(255,255,255,0.45)', cursor: 'pointer',
              clipPath: 'polygon(0 0, calc(100% - 5px) 0, 100% 5px, 100% 100%, 5px 100%, 0 calc(100% - 5px))',
              transition: 'all 0.2s ease',
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,82,99,0.12)';
              (e.currentTarget as HTMLButtonElement).style.color = '#ff5263';
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.background = 'rgba(255,255,255,0.05)';
              (e.currentTarget as HTMLButtonElement).style.color = 'rgba(255,255,255,0.45)';
            }}
          >
            <X size={14} weight="bold" />
          </button>
        </div>

        {/* Body */}
        <div style={{ padding: '20px' }}>
          {children}
        </div>
      </div>
    </div>
  );
};