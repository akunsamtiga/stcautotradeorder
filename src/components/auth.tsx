'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/lib/store';

const S = {
  label: {
    display: 'block' as const,
    fontFamily: 'var(--font-exo)',
    fontSize: 11, fontWeight: 700,
    letterSpacing: '0.14em',
    textTransform: 'uppercase' as const,
    color: 'rgba(255,255,255,0.65)',
    marginBottom: 6,
  },
  error: {
    padding: '10px 13px',
    background: 'rgba(255,82,99,0.08)',
    border: '1px solid rgba(255,82,99,0.25)',
    borderLeft: '2px solid #ff5263',
    fontFamily: 'var(--font-mono)',
    fontSize: 12,
    color: '#ff8a94',
    marginBottom: 14,
  },
};

// ============================================================================
// LOGIN FORM
// ============================================================================
interface LoginFormProps { onSwitchToRegister: () => void; }

export const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api.login(email, password);
      if (!response.data) throw new Error('Invalid response from server');
      const { user, token } = response.data;
      if (!user || !token) throw new Error('Invalid credentials received');
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && <div style={S.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={S.label}>Email</label>
          <input
            type="email"
            className="ds-input"
            placeholder="your@email.com"
            value={email}
            onChange={e => setEmail(e.target.value)}
            required
          />
        </div>

        <div>
          <label style={S.label}>Password</label>
          <input
            type="password"
            className="ds-input"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="ds-btn-cyan"
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.3)',
            color: '#34d399',
            fontFamily: 'var(--font-exo)',
            fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {isLoading ? (
            <>
              <span style={{
                width: 14, height: 14,
                border: '2px solid #34d399', borderTopColor: 'transparent',
                borderRadius: '50%', display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }} />
              MASUK...
            </>
          ) : 'MASUK'}
        </button>
      </form>

      <div style={{
        marginTop: 18, paddingTop: 18,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'var(--font-exo)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Belum punya akun?{' '}
          <button
            onClick={onSwitchToRegister}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#34d399', fontFamily: 'var(--font-exo)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.06em', textDecoration: 'underline',
            }}
          >
            Daftar
          </button>
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// REGISTER FORM
// ============================================================================
interface RegisterFormProps { onSwitchToLogin: () => void; }

export const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const router = useRouter();
  const setAuth = useAuthStore(s => s.setAuth);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    try {
      const response = await api.register(formData);
      if (!response.data) throw new Error('Invalid response from server');
      const { user, token } = response.data;
      if (!user || !token) throw new Error('Invalid registration response');
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && <div style={S.error}>{error}</div>}

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div>
          <label style={S.label}>Nama Lengkap</label>
          <input
            type="text"
            name="fullName"
            className="ds-input"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleChange}
          />
        </div>

        <div>
          <label style={S.label}>Email</label>
          <input
            type="email"
            name="email"
            className="ds-input"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
          />
        </div>

        <div>
          <label style={S.label}>Password</label>
          <input
            type="password"
            name="password"
            className="ds-input"
            placeholder="Min. 8 karakter, huruf besar, angka"
            value={formData.password}
            onChange={handleChange}
            required
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="ds-btn-cyan"
          style={{
            width: '100%',
            padding: '12px',
            background: 'rgba(52,211,153,0.1)',
            border: '1px solid rgba(52,211,153,0.3)',
            color: '#34d399',
            fontFamily: 'var(--font-exo)',
            fontSize: 12, fontWeight: 700,
            letterSpacing: '0.18em', textTransform: 'uppercase',
            cursor: isLoading ? 'not-allowed' : 'pointer',
            opacity: isLoading ? 0.6 : 1,
            clipPath: 'polygon(0 0, calc(100% - 8px) 0, 100% 8px, 100% 100%, 8px 100%, 0 calc(100% - 8px))',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
        >
          {isLoading ? (
            <>
              <span style={{
                width: 14, height: 14,
                border: '2px solid #34d399', borderTopColor: 'transparent',
                borderRadius: '50%', display: 'inline-block',
                animation: 'spin 0.8s linear infinite',
              }} />
              MEMPROSES...
            </>
          ) : 'BUAT AKUN'}
        </button>
      </form>

      <div style={{
        marginTop: 18, paddingTop: 18,
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center',
      }}>
        <p style={{ fontFamily: 'var(--font-exo)', fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
          Sudah punya akun?{' '}
          <button
            onClick={onSwitchToLogin}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#34d399', fontFamily: 'var(--font-exo)', fontSize: 12, fontWeight: 700,
              letterSpacing: '0.06em', textDecoration: 'underline',
            }}
          >
            Masuk
          </button>
        </p>
      </div>
    </div>
  );
};