'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';

// ============================================================================
// LOGIN FORM COMPONENT
// ============================================================================

interface LoginFormProps {
  onSwitchToRegister: () => void;
}

const LoginForm: React.FC<LoginFormProps> = ({ onSwitchToRegister }) => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
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
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      const { user, token } = response.data;
      
      if (!user || !token) {
        throw new Error('Invalid credentials received');
      }

      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Login failed. Please check your credentials.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-emerald-500/20 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-gray-100 placeholder-gray-600 transition-all"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-emerald-500/20 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-gray-100 placeholder-gray-600 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Don&apos;t have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// REGISTER FORM COMPONENT
// ============================================================================

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    fullName: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await api.register(formData);
      
      if (!response.data) {
        throw new Error('Invalid response from server');
      }

      const { user, token } = response.data;
      
      if (!user || !token) {
        throw new Error('Invalid registration response');
      }

      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(
        err.response?.data?.message || 
        err.message || 
        'Registration failed. Please try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {error && (
        <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-300 mb-1">
            Full Name
          </label>
          <input
            id="fullName"
            type="text"
            name="fullName"
            placeholder="John Doe"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-emerald-500/20 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-gray-100 placeholder-gray-600 transition-all"
          />
        </div>

        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            name="email"
            placeholder="your@email.com"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-emerald-500/20 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-gray-100 placeholder-gray-600 transition-all"
          />
        </div>

        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
            Password
          </label>
          <input
            id="password"
            type="password"
            name="password"
            placeholder="Min 8 chars, uppercase, lowercase, number"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 bg-[#0a0a0a] border border-emerald-500/20 rounded-lg focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500/30 text-gray-100 placeholder-gray-600 transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-4 py-3 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all"
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-400">
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="text-emerald-400 hover:text-emerald-300 font-medium transition-colors"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// TICKER - ENHANCED
// ============================================================================

const TickerItem = ({ symbol, price, change }: { symbol: string; price: string; change: string }) => {
  const isPositive = change.startsWith('+');
  return (
    <span className="inline-flex items-center gap-3 px-6 py-2 hover:bg-white/5 transition-colors duration-300 rounded-lg cursor-default">
      <span className="text-gray-500 font-mono text-xs tracking-widest uppercase">{symbol}</span>
      <span className="text-white font-mono text-sm font-semibold tabular-nums">{price}</span>
      <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-full ${
        isPositive ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
      }`}>
        {change}
      </span>
    </span>
  );
};

const Ticker = () => {
  const items = [
    { symbol: 'EUR/USD', price: '1.08432', change: '+0.12%' },
    { symbol: 'BTC/USD', price: '67,234', change: '+2.41%' },
    { symbol: 'GBP/USD', price: '1.26891', change: '-0.08%' },
    { symbol: 'ETH/USD', price: '3,521',   change: '+1.87%' },
    { symbol: 'XAU/USD', price: '2,312.5', change: '+0.33%' },
    { symbol: 'AUD/USD', price: '0.65412', change: '-0.21%' },
    { symbol: 'USD/JPY', price: '154.32',  change: '+0.15%' },
    { symbol: 'SOL/USD', price: '178.44',  change: '+3.22%' },
  ];
  return (
    <div className="relative overflow-hidden border-y border-emerald-500/10 bg-[#050505]/80 backdrop-blur-sm py-3">
      <div className="flex animate-ticker whitespace-nowrap">
        {[...items, ...items, ...items].map((item, i) => <TickerItem key={i} {...item} />)}
      </div>
    </div>
  );
};

// ============================================================================
// MINI LIVE CHART - ENHANCED WITH SMOOTHER ANIMATIONS
// ============================================================================

const MiniChart = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const points = useRef<number[]>([]);
  const animationRef = useRef<number>(0);
  const lastUpdateRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let price = 100;
    for (let i = 0; i < 80; i++) {
      price += (Math.random() - 0.47) * 2;
      points.current.push(price);
    }

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.scale(dpr, dpr);

    const draw = (timestamp: number) => {
      if (timestamp - lastUpdateRef.current > 500) {
        const last = points.current[points.current.length - 1];
        points.current.push(last + (Math.random() - 0.47) * 2);
        if (points.current.length > 120) points.current.shift();
        lastUpdateRef.current = timestamp;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      const W = canvas.width / dpr;
      const H = canvas.height / dpr;
      
      ctx.clearRect(0, 0, W, H);
      const data = points.current;
      const min = Math.min(...data), max = Math.max(...data);
      const range = max - min || 1;
      const getX = (i: number) => (i / (data.length - 1)) * W;
      const getY = (v: number) => H - ((v - min) / range) * H * 0.8 - H * 0.1;

      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, 'rgba(52,211,153,0.2)');
      grad.addColorStop(0.5, 'rgba(52,211,153,0.1)');
      grad.addColorStop(1, 'rgba(52,211,153,0)');

      ctx.beginPath();
      ctx.moveTo(getX(0), H);
      ctx.lineTo(getX(0), getY(data[0]));
      for (let i = 1; i < data.length; i++) {
        const cpX = (getX(i - 1) + getX(i)) / 2;
        ctx.quadraticCurveTo(cpX, getY(data[i - 1]), getX(i), getY(data[i]));
      }
      ctx.lineTo(getX(data.length - 1), H);
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(getX(0), getY(data[0]));
      for (let i = 1; i < data.length; i++) {
        const cpX = (getX(i - 1) + getX(i)) / 2;
        ctx.quadraticCurveTo(cpX, getY(data[i - 1]), getX(i), getY(data[i]));
      }
      ctx.strokeStyle = '#34d399';
      ctx.lineWidth = 2.5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.shadowColor = '#34d399';
      ctx.shadowBlur = 10;
      ctx.stroke();
      ctx.shadowBlur = 0;

      const lx = getX(data.length - 1), ly = getY(data[data.length - 1]);
      
      ctx.beginPath();
      ctx.arc(lx, ly, 6, 0, Math.PI * 2);
      ctx.fillStyle = 'rgba(52,211,153,0.3)';
      ctx.fill();
      
      ctx.beginPath();
      ctx.arc(lx, ly, 3, 0, Math.PI * 2);
      ctx.fillStyle = '#34d399';
      ctx.fill();

      animationRef.current = requestAnimationFrame(draw);
    };
    
    animationRef.current = requestAnimationFrame(draw);
    
    return () => { 
      if (animationRef.current) cancelAnimationFrame(animationRef.current); 
    };
  }, []);

  return <canvas ref={canvasRef} className="w-full h-full" style={{ display: 'block' }} />;
};

// ============================================================================
// STAT COUNTER - ENHANCED WITH SMOOTHER ANIMATION
// ============================================================================

const StatCounter = ({ value, label, suffix = '' }: { value: number; label: string; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const [hasAnimated, setHasAnimated] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting && !hasAnimated) {
        setHasAnimated(true);
        const duration = 1500;
        const steps = 60;
        const increment = value / steps;
        let current = 0;
        let step = 0;
        
        const timer = setInterval(() => {
          step++;
          current = Math.min(Math.round(increment * step), value);
          setCount(current);
          if (step >= steps) {
            clearInterval(timer);
            setCount(value);
          }
        }, duration / steps);
        
        observer.disconnect();
      }
    }, { threshold: 0.5 });
    
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, hasAnimated]);

  return (
    <div ref={ref} className="text-center group cursor-default">
      <div className="text-3xl font-bold text-white font-mono tabular-nums transition-transform duration-300 group-hover:scale-110">
        {count.toLocaleString('id-ID')}{suffix}
      </div>
      <div className="text-xs text-gray-600 mt-2 tracking-wide uppercase group-hover:text-emerald-400 transition-colors duration-300">{label}</div>
    </div>
  );
};

// ============================================================================
// FEATURE CARD - ENHANCED WITH MICRO-INTERACTIONS
// ============================================================================

const FeatureCard = ({ icon, title, desc, delay }: { icon: React.ReactNode; title: string; desc: string; delay: number }) => (
  <div 
    className="group p-5 rounded-xl border border-white/5 bg-white/[0.02] hover:border-emerald-500/30 hover:bg-emerald-500/[0.03] transition-all duration-500 ease-out hover:-translate-y-1 hover:shadow-lg hover:shadow-emerald-500/5"
    style={{ animationDelay: `${delay}ms` }}
  >
    <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 group-hover:scale-110 transition-all duration-300">
      <div className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">{icon}</div>
    </div>
    <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-emerald-400 transition-colors duration-300">{title}</h3>
    <p className="text-xs text-gray-500 leading-relaxed group-hover:text-gray-400 transition-colors duration-300">{desc}</p>
  </div>
);

// ============================================================================
// AUTH PANEL - ENHANCED WITH SMOOTHER TRANSITIONS
// ============================================================================

const AuthPanel = ({ view, setView }: { view: 'login' | 'register'; setView: (v: 'login' | 'register') => void }) => (
  <div className="w-full">
    {/* Tab switcher */}
    <div className="flex rounded-xl bg-[#0a0a0a] border border-white/5 p-1 mb-7">
      {(['login', 'register'] as const).map((tab) => (
        <button
          key={tab}
          onClick={() => setView(tab)}
          className={`flex-1 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ease-out ${
            view === tab
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/25 shadow-lg shadow-emerald-500/10'
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          {tab === 'login' ? 'Masuk' : 'Daftar'}
        </button>
      ))}
    </div>

    {/* Dark-theme override untuk auth forms */}
    <style jsx global>{`
      .dark-auth input,
      .dark-auth select {
        background-color: #0d0d0d !important;
        border-color: rgba(52,211,153,0.18) !important;
        color: #e5e7eb !important;
        border-radius: 0.625rem !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .dark-auth input:focus, .dark-auth select:focus {
        border-color: rgba(52,211,153,0.5) !important;
        box-shadow: 0 0 0 3px rgba(52,211,153,0.1) !important;
        outline: none !important;
        transform: translateY(-1px);
      }
      .dark-auth input:hover:not(:focus) {
        border-color: rgba(52,211,153,0.3) !important;
      }
      .dark-auth input::placeholder { color: rgba(107,114,128,0.6) !important; }
      .dark-auth label { color: #9ca3af !important; }
      .dark-auth h2 { color: #f9fafb !important; font-size: 1.2rem !important; }
      .dark-auth > div > p, .dark-auth .mt-6 p { color: #6b7280 !important; }
      .dark-auth button[type="submit"] {
        background: linear-gradient(135deg, #059669 0%, #047857 100%) !important;
        border: 1px solid rgba(52,211,153,0.3) !important;
        border-radius: 0.625rem !important;
        font-weight: 600 !important;
        box-shadow: 0 4px 20px rgba(5,150,105,0.25) !important;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1) !important;
      }
      .dark-auth button[type="submit"]:hover:not(:disabled) {
        background: linear-gradient(135deg, #047857 0%, #065f46 100%) !important;
        box-shadow: 0 4px 24px rgba(5,150,105,0.4) !important;
        transform: translateY(-2px);
      }
      .dark-auth button[type="submit"]:active:not(:disabled) {
        transform: translateY(0);
      }
      .dark-auth .mb-4.p-3 {
        background-color: rgba(239,68,68,0.08) !important;
        border-color: rgba(239,68,68,0.2) !important;
      }
      .dark-auth .text-primary-600 { color: #34d399 !important; }
      .dark-auth .hover\\:text-primary-700:hover { color: #6ee7b7 !important; }
    `}</style>

    <div className="dark-auth">
      {view === 'login'
        ? <LoginForm onSwitchToRegister={() => setView('register')} />
        : <RegisterForm onSwitchToLogin={() => setView('login')} />
      }
    </div>
  </div>
);

// ============================================================================
// MAIN PAGE - ENHANCED WITH SMOOTH ANIMATIONS
// ============================================================================

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [scrollY, setScrollY] = useState(0);

  useEffect(() => {
    if (hasHydrated && isAuthenticated) router.push('/dashboard');
  }, [hasHydrated, isAuthenticated, router]);

  useEffect(() => {
    const handleScroll = () => {
      setScrollY(window.scrollY);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-[#080808] flex items-center justify-center">
        <div className="relative">
          <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-400 rounded-full animate-spin" />
          <div className="absolute inset-0 w-10 h-10 border-4 border-emerald-500/10 rounded-full animate-ping" />
        </div>
      </div>
    );
  }

  if (isAuthenticated) return null;

  return (
    <div className="min-h-screen bg-[#080808] text-white overflow-x-hidden selection:bg-emerald-500/30 selection:text-emerald-200">

      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Mono:wght@400;500&family=Syne:wght@600;700;800&display=swap');

        @keyframes ticker {
          from { transform: translateX(0); }
          to   { transform: translateX(-33.33%); }
        }
        .animate-ticker { 
          animation: ticker 30s linear infinite;
        }
        .animate-ticker:hover {
          animation-play-state: paused;
        }

        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(25px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .fu  { animation: fadeUp 0.7s cubic-bezier(0.16, 1, 0.3, 1) both; }
        .fu1 { animation-delay: 0.05s; }
        .fu2 { animation-delay: 0.15s; }
        .fu3 { animation-delay: 0.25s;  }
        .fu4 { animation-delay: 0.35s; }
        .fu5 { animation-delay: 0.45s; }

        @keyframes pulse-ring {
          0%   { transform: scale(0.9); opacity: 0.7; }
          70%  { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        .live-ring { animation: pulse-ring 2.5s cubic-bezier(0.215,0.61,0.355,1) infinite; }

        .syne    { font-family: 'Syne', system-ui, sans-serif; }
        .dm-mono { font-family: 'DM Mono', monospace; }

        .scanline::after {
          content: '';
          position: absolute; inset: 0;
          background: repeating-linear-gradient(
            to bottom,
            transparent 0px, transparent 2px,
            rgba(0,0,0,0.06) 2px, rgba(0,0,0,0.06) 4px
          );
          pointer-events: none;
          border-radius: inherit;
        }

        /* Smooth scroll behavior */
        html {
          scroll-behavior: smooth;
        }

        /* Custom scrollbar */
        ::-webkit-scrollbar {
          width: 8px;
        }
        ::-webkit-scrollbar-track {
          background: #080808;
        }
        ::-webkit-scrollbar-thumb {
          background: rgba(52,211,153,0.2);
          border-radius: 4px;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: rgba(52,211,153,0.4);
        }
      `}</style>

      {/* ── TOP NAV ── */}
      <nav 
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 transition-all duration-500"
        style={{
          backgroundColor: scrollY > 50 ? 'rgba(8,8,8,0.9)' : 'rgba(8,8,8,0.5)',
          backdropFilter: scrollY > 50 ? 'blur(20px)' : 'blur(10px)',
        }}
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 group cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center group-hover:bg-emerald-500/30 transition-all duration-300 group-hover:scale-110">
              <svg className="w-4 h-4 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <span className="syne font-bold text-sm text-white tracking-tight group-hover:text-emerald-400 transition-colors duration-300">OrderBot</span>
          </div>
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 hover:bg-emerald-500/20 transition-all duration-300 cursor-default">
            <span className="relative flex h-1.5 w-1.5">
              <span className="live-ring absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-400" />
            </span>
            <span className="text-emerald-400 text-xs dm-mono font-medium tracking-wider">Live</span>
          </div>
        </div>
      </nav>

      {/* ── TICKER ── */}
      <div className="pt-[57px]"><Ticker /></div>

      {/* ── BACKGROUND MESH ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: 0 }}>
        <div className="absolute inset-0 opacity-[0.02]" style={{
          backgroundImage: 'linear-gradient(rgba(52,211,153,1) 1px, transparent 1px), linear-gradient(90deg, rgba(52,211,153,1) 1px, transparent 1px)',
          backgroundSize: '64px 64px',
        }} />
        <div 
          className="absolute -top-48 -right-48 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-3xl transition-transform duration-1000"
          style={{ transform: `translate(${scrollY * 0.1}px, ${scrollY * 0.05}px)` }}
        />
        <div 
          className="absolute top-1/3 -left-48 w-[400px] h-[400px] bg-emerald-600/5 rounded-full blur-3xl transition-transform duration-1000"
          style={{ transform: `translate(${-scrollY * 0.08}px, ${scrollY * 0.03}px)` }}
        />
        <div 
          className="absolute bottom-0 right-1/3 w-[300px] h-[300px] bg-emerald-500/4 rounded-full blur-3xl transition-transform duration-1000"
          style={{ transform: `translate(${-scrollY * 0.05}px, ${-scrollY * 0.1}px)` }}
        />
      </div>

      {/* ── MAIN LAYOUT ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10 py-16 lg:py-20">
        <div className="grid lg:grid-cols-[1fr_420px] gap-16 xl:gap-24 items-start">

          {/* ── KIRI: Marketing Content ── */}
          <div className="space-y-14">

            {/* Hero */}
            <div className="space-y-6">
              <div className="fu fu1 inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/5 text-emerald-400 text-xs dm-mono tracking-wide hover:border-emerald-500/40 hover:bg-emerald-500/10 transition-all duration-300 cursor-default">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Automated Order Scheduling Platform
              </div>

              <h1 className="syne fu fu2 text-4xl xl:text-[3.25rem] font-extrabold leading-[1.1] tracking-tight">
                Jadwalkan Order.{' '}
                <span className="relative inline-block group cursor-default">
                  <span className="text-emerald-400 group-hover:text-emerald-300 transition-colors duration-300">Otomatis.</span>
                  <svg className="absolute -bottom-1 left-0 w-full" viewBox="0 0 200 8" fill="none" preserveAspectRatio="none">
                    <path d="M0 6 Q50 0 100 4 Q150 8 200 2" stroke="#34d399" strokeWidth="2" strokeLinecap="round" opacity="0.5" className="group-hover:opacity-80 transition-opacity duration-300" />
                  </svg>
                </span>
                {' '}24 Jam.
              </h1>

              <p className="fu fu3 text-gray-400 text-[15px] leading-relaxed max-w-lg">
                Platform trading cerdas yang mengeksekusi order sesuai jadwal yang kamu tentukan.
                Dilengkapi Martingale, Stop Loss/Profit, dan monitoring realtime — tanpa harus memantau layar terus-menerus.
              </p>

              <div className="fu fu4 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-gray-600">
                {['Tanpa biaya setup', 'Akun Demo tersedia', 'Support 24/7'].map((t, i) => (
                  <span key={t} className="flex items-center gap-1.5 group cursor-default">
                    <svg className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 group-hover:scale-110 transition-transform duration-300" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    <span className="group-hover:text-gray-400 transition-colors duration-300">{t}</span>
                  </span>
                ))}
              </div>
            </div>

            {/* Stats */}
            <div className="fu fu5 grid grid-cols-3 gap-6 py-8 border-y border-white/5">
              <StatCounter value={12400} label="Eksekusi Hari Ini" suffix="+" />
              <StatCounter value={89}    label="Win Rate Rata-rata" suffix="%" />
              <StatCounter value={3200}  label="Pengguna Aktif" suffix="+" />
            </div>

            {/* Live chart preview */}
            <div className="fu fu5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] text-gray-600 dm-mono uppercase tracking-widest mb-1">Live Preview</div>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-white dm-mono">BTC/USD</span>
                    <span className="text-emerald-400 text-sm dm-mono">+2.41%</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] text-gray-600 mb-1">Bot Status</div>
                  <div className="flex items-center gap-1.5 text-emerald-400 text-xs dm-mono">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Running
                  </div>
                </div>
              </div>
              <div className="relative rounded-xl border border-white/5 bg-[#0a0a0a] scanline overflow-hidden group" style={{ height: 180 }}>
                <MiniChart />
                <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded-md bg-black/60 border border-white/5 dm-mono text-[10px] text-gray-400 group-hover:border-emerald-500/20 transition-colors duration-300">
                  <span className="text-emerald-400">▲</span> Realtime
                </div>
                <div className="absolute bottom-3 left-3 dm-mono text-[9px] text-gray-700">
                  Simulated · Bukan saran investasi
                </div>
              </div>
            </div>

            {/* Features */}
            <div className="fu fu5">
              <div className="text-[10px] text-gray-600 dm-mono uppercase tracking-widest mb-5">Fitur Unggulan</div>
              <div className="grid sm:grid-cols-2 gap-3">
                <FeatureCard
                  delay={0}
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}
                  title="Jadwal Fleksibel"
                  desc="Atur hingga 10 waktu order per hari. Bulk import tersedia."
                />
                <FeatureCard
                  delay={100}
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>}
                  title="Martingale Otomatis"
                  desc="Recovery loss otomatis dengan multiplier 1.1× – 5×."
                />
                <FeatureCard
                  delay={200}
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>}
                  title="Stop Loss / Take Profit"
                  desc="Lindungi modal dengan batas kerugian & target profit otomatis."
                />
                <FeatureCard
                  delay={300}
                  icon={<svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>}
                  title="Monitoring Realtime"
                  desc="Dashboard live: win rate, profit harian, history eksekusi lengkap."
                />
              </div>
            </div>
          </div>

          {/* ── KANAN: Auth Card (sticky) ── */}
          <div className="lg:sticky lg:top-24">
            <div className="relative rounded-2xl border border-white/8 bg-gradient-to-b from-[#131313] to-[#0e0e0e] p-8 shadow-2xl shadow-black/70 overflow-hidden group hover:border-white/12 transition-all duration-500">
              {/* Glow corners */}
              <div className="absolute -top-16 -right-16 w-48 h-48 bg-emerald-500/6 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/10 transition-all duration-500" />
              <div className="absolute -bottom-16 -left-16 w-48 h-48 bg-emerald-500/4 rounded-full blur-2xl pointer-events-none group-hover:bg-emerald-500/8 transition-all duration-500" />

              <div className="relative">
                <div className="mb-6">
                  <h2 className="syne text-xl font-bold text-white">
                    {view === 'login' ? 'Selamat Datang Kembali' : 'Buat Akun Baru'}
                  </h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {view === 'login'
                      ? 'Masuk dan mulai jadwalkan order kamu'
                      : 'Gratis. Tidak perlu kartu kredit.'}
                  </p>
                </div>

                <AuthPanel view={view} setView={setView} />

                <div className="mt-6 pt-5 border-t border-white/5 flex items-center gap-2 text-gray-600">
                  <svg className="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="text-[11px]">Enkripsi end-to-end. Data kamu aman bersama kami.</span>
                </div>
              </div>
            </div>

            {/* Social proof */}
            <div className="mt-4 flex items-center justify-center gap-3">
              <div className="flex -space-x-2">
                {['#34d399', '#6ee7b7', '#a7f3d0'].map((c, i) => (
                  <div
                    key={i}
                    className="w-7 h-7 rounded-full border-2 flex items-center justify-center text-[10px] font-bold hover:scale-110 hover:-translate-y-1 transition-transform duration-300 cursor-default"
                    style={{ background: c + '22', color: c, borderColor: '#080808' }}
                  >
                    {String.fromCharCode(65 + i * 4)}
                  </div>
                ))}
              </div>
              <span className="text-gray-600 text-xs">+3.200 trader sudah bergabung</span>
            </div>
          </div>

        </div>
      </div>

      {/* ── FOOTER ── */}
      <div className="relative z-10 border-t border-white/5 py-6 text-center">
        <p className="text-gray-700 text-xs dm-mono">
          © {new Date().getFullYear()} OrderBot Platform · All rights reserved
        </p>
      </div>

    </div>
  );
}