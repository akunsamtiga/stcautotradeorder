'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { 
  TrendingUp,
  TrendingDown,
  Shield,
  BarChart3,
  Clock,
  Lock,
  CheckCircle,
  ArrowRight,
  Briefcase,
  Target,
  Award,
  Activity,
  DollarSign,
  Users,
  Zap,
  Eye
} from 'lucide-react';

// ============================================================================
// PROFESSIONAL FINANCE STYLES
// ============================================================================

const injectProfessionalStyles = () => {
  if (typeof document === 'undefined') return;
  
  const styleId = 'professional-styles';
  if (document.getElementById(styleId)) return;
  
  const style = document.createElement('style');
  style.id = styleId;
  style.textContent = `
    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    
    @keyframes slideUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    @keyframes shimmer {
      0% { transform: translateX(-100%); }
      100% { transform: translateX(100%); }
    }
    
    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.7; }
    }
    
    .animate-fade-in {
      animation: fadeIn 0.6s ease-out both;
    }
    
    .animate-slide-up {
      animation: slideUp 0.6s ease-out both;
    }
    
    .delay-100 { animation-delay: 100ms; }
    .delay-200 { animation-delay: 200ms; }
    .delay-300 { animation-delay: 300ms; }
    .delay-400 { animation-delay: 400ms; }
    .delay-500 { animation-delay: 500ms; }
    
    .professional-card {
      background: linear-gradient(135deg, #1A1D23 0%, #22252B 100%);
      border: 1px solid rgba(192, 192, 192, 0.15);
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }
    
    .professional-card:hover {
      border-color: rgba(16, 185, 129, 0.4);
      box-shadow: 0 8px 30px rgba(16, 185, 129, 0.15), 0 0 40px rgba(16, 185, 129, 0.05);
      transform: translateY(-4px) scale(1.01);
    }
    
    .shimmer-effect {
      position: relative;
      overflow: hidden;
    }
    
    .shimmer-effect::after {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: linear-gradient(
        90deg,
        transparent,
        rgba(16, 185, 129, 0.1),
        transparent
      );
      animation: shimmer 3s infinite;
    }
    
    .market-ticker {
      display: flex;
      overflow: hidden;
      position: relative;
    }
    
    .ticker-content {
      display: flex;
      animation: ticker 30s linear infinite;
    }
    
    @keyframes ticker {
      0% { transform: translateX(0); }
      100% { transform: translateX(-50%); }
    }
    
    @keyframes float {
      0%, 100% { transform: translateY(0px) rotate(0deg); }
      50% { transform: translateY(-20px) rotate(5deg); }
    }
    
    @keyframes blob {
      0%, 100% { border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%; }
      50% { border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%; }
    }
    
    .floating {
      animation: float 6s ease-in-out infinite;
    }
    
    .blob-decoration {
      animation: blob 8s ease-in-out infinite;
    }
  `;
  document.head.appendChild(style);
};

// ============================================================================
// LIVE CHART COMPONENT
// ============================================================================

const ProfessionalChart: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<number[]>([]);

  useEffect(() => {
    // Generate initial data
    const points = 60;
    const newData: number[] = [];
    let value = 45000 + Math.random() * 5000;
    
    for (let i = 0; i < points; i++) {
      value += (Math.random() - 0.48) * 200;
      value = Math.max(43000, Math.min(52000, value));
      newData.push(value);
    }
    setData(newData);

    // Update data
    const interval = setInterval(() => {
      setData(prev => {
        const lastValue = prev[prev.length - 1];
        const newValue = lastValue + (Math.random() - 0.48) * 150;
        const clampedValue = Math.max(43000, Math.min(52000, newValue));
        return [...prev.slice(1), clampedValue];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || data.length === 0) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const width = rect.width;
    const height = rect.height;
    const padding = { top: 20, right: 60, bottom: 30, left: 60 };
    const chartWidth = width - padding.left - padding.right;
    const chartHeight = height - padding.top - padding.bottom;

    // Clear
    ctx.fillStyle = '#1A1D23';
    ctx.fillRect(0, 0, width, height);

    // Grid
    ctx.strokeStyle = 'rgba(192, 192, 192, 0.1)';
    ctx.lineWidth = 1;
    
    // Horizontal grid lines
    for (let i = 0; i <= 5; i++) {
      const y = padding.top + (chartHeight / 5) * i;
      ctx.beginPath();
      ctx.moveTo(padding.left, y);
      ctx.lineTo(width - padding.right, y);
      ctx.stroke();
      
      // Price labels
      const price = Math.max(...data) - ((Math.max(...data) - Math.min(...data)) / 5) * i;
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '10px Inter, sans-serif';
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillText(`$${price.toFixed(0)}`, padding.left - 10, y);
    }

    // Vertical grid lines
    const timeLabels = 6;
    for (let i = 0; i <= timeLabels; i++) {
      const x = padding.left + (chartWidth / timeLabels) * i;
      ctx.beginPath();
      ctx.moveTo(x, padding.top);
      ctx.lineTo(x, height - padding.bottom);
      ctx.stroke();
    }

    // Calculate positions
    const minPrice = Math.min(...data);
    const maxPrice = Math.max(...data);
    const priceRange = maxPrice - minPrice;

    const getX = (index: number) => {
      return padding.left + (index / (data.length - 1)) * chartWidth;
    };

    const getY = (price: number) => {
      const ratio = (price - minPrice) / priceRange;
      return padding.top + chartHeight - ratio * chartHeight;
    };

    // Draw candlesticks
    const candleWidth = chartWidth / data.length * 0.6;
    data.forEach((price, i) => {
      const x = getX(i);
      const open = i > 0 ? data[i - 1] : price;
      const close = price;
      const high = Math.max(open, close) + Math.random() * 100;
      const low = Math.min(open, close) - Math.random() * 100;
      
      const isGreen = close >= open;
      const color = isGreen ? '#10B981' : '#EF4444';
      
      // Wick
      ctx.strokeStyle = color;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x, getY(high));
      ctx.lineTo(x, getY(low));
      ctx.stroke();
      
      // Body
      ctx.fillStyle = color;
      const bodyTop = Math.min(getY(open), getY(close));
      const bodyHeight = Math.abs(getY(open) - getY(close));
      ctx.fillRect(
        x - candleWidth / 2,
        bodyTop,
        candleWidth,
        Math.max(bodyHeight, 1)
      );
    });

    // Current price line
    const currentPrice = data[data.length - 1];
    const currentY = getY(currentPrice);
    
    ctx.strokeStyle = '#10B981';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(padding.left, currentY);
    ctx.lineTo(width - padding.right, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price label
    ctx.fillStyle = '#10B981';
    ctx.fillRect(width - padding.right + 5, currentY - 10, 50, 20);
    ctx.fillStyle = '#1A1D23';
    ctx.font = 'bold 10px Inter, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`$${currentPrice.toFixed(0)}`, width - padding.right + 30, currentY);

  }, [data]);

  return <canvas ref={canvasRef} className="w-full h-full" />;
};

// ============================================================================
// MARKET TICKER
// ============================================================================

const MarketTicker: React.FC = () => {
  const tickers = [
    { symbol: 'BTC/USD', price: 47234, change: 2.34, isUp: true },
    { symbol: 'ETH/USD', price: 2456, change: 1.82, isUp: true },
    { symbol: 'EUR/USD', price: 1.0842, change: -0.23, isUp: false },
    { symbol: 'GBP/USD', price: 1.2634, change: 0.45, isUp: true },
    { symbol: 'GOLD', price: 2034, change: -0.12, isUp: false },
    { symbol: 'SPX', price: 4789, change: 0.67, isUp: true },
  ];

  return (
    <div className="market-ticker py-2" style={{ background: '#22252B', borderTop: '1px solid rgba(192, 192, 192, 0.15)' }}>
      <div className="ticker-content">
        {[...tickers, ...tickers].map((ticker, i) => (
          <div key={i} className="flex items-center gap-2 px-6 whitespace-nowrap">
            <span className="text-xs font-semibold" style={{ color: '#E5E5E5' }}>
              {ticker.symbol}
            </span>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              ${ticker.price.toLocaleString()}
            </span>
            <span 
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: ticker.isUp ? '#10B981' : '#EF4444' }}
            >
              {ticker.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {ticker.change}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

// ============================================================================
// LOGIN FORM
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
      if (!response.data) throw new Error('Invalid response from server');
      const { user, token } = response.data;
      if (!user || !token) throw new Error('Invalid credentials received');
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Login failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="p-3 rounded-xl border" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: '#FCA5A5'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#E5E5E5' }}>
            Email Address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
            style={{
              background: '#22252B',
              borderColor: 'rgba(192, 192, 192, 0.2)',
              color: '#E5E5E5'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10B981'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(192, 192, 192, 0.2)'}
            placeholder="you@company.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#E5E5E5' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
            style={{
              background: '#22252B',
              borderColor: 'rgba(192, 192, 192, 0.2)',
              color: '#E5E5E5'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10B981'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(192, 192, 192, 0.2)'}
            placeholder="••••••••"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          {isLoading ? 'Signing in...' : 'Sign In'}
        </button>
      </form>

      <div className="text-center pt-4" style={{ borderTop: '1px solid rgba(192, 192, 192, 0.15)' }}>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Don&apos;t have an account?{' '}
          <button
            onClick={onSwitchToRegister}
            className="font-semibold hover:underline"
            style={{ color: '#10B981' }}
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
};

// ============================================================================
// REGISTER FORM
// ============================================================================

interface RegisterFormProps {
  onSwitchToLogin: () => void;
}

const RegisterForm: React.FC<RegisterFormProps> = ({ onSwitchToLogin }) => {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [formData, setFormData] = useState({ email: '', password: '', fullName: '' });
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
      if (!response.data) throw new Error('Invalid response from server');
      const { user, token } = response.data;
      if (!user || !token) throw new Error('Invalid registration response');
      setAuth(user, token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-4">
      {error && (
        <div className="p-3 rounded-xl border" style={{
          background: 'rgba(239, 68, 68, 0.1)',
          borderColor: 'rgba(239, 68, 68, 0.3)',
          color: '#FCA5A5'
        }}>
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#E5E5E5' }}>
            Full Name
          </label>
          <input
            type="text"
            name="fullName"
            value={formData.fullName}
            onChange={handleChange}
            className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
            style={{
              background: '#22252B',
              borderColor: 'rgba(192, 192, 192, 0.2)',
              color: '#E5E5E5'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10B981'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(192, 192, 192, 0.2)'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#E5E5E5' }}>
            Email Address
          </label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
            style={{
              background: '#22252B',
              borderColor: 'rgba(192, 192, 192, 0.2)',
              color: '#E5E5E5'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10B981'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(192, 192, 192, 0.2)'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: '#E5E5E5' }}>
            Password
          </label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            required
            className="w-full px-4 py-3 rounded-xl border outline-none transition-all"
            style={{
              background: '#22252B',
              borderColor: 'rgba(192, 192, 192, 0.2)',
              color: '#E5E5E5'
            }}
            onFocus={(e) => e.target.style.borderColor = '#10B981'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(192, 192, 192, 0.2)'}
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-xl"
          style={{
            background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
            color: '#FFFFFF',
            boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
          }}
        >
          {isLoading ? 'Creating Account...' : 'Create Account'}
        </button>
      </form>

      <div className="text-center pt-4" style={{ borderTop: '1px solid rgba(192, 192, 192, 0.15)' }}>
        <p className="text-sm" style={{ color: '#9CA3AF' }}>
          Already have an account?{' '}
          <button
            onClick={onSwitchToLogin}
            className="font-semibold hover:underline"
            style={{ color: '#10B981' }}
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
};

const AuthPanel: React.FC<{ view: 'login' | 'register'; setView: (v: 'login' | 'register') => void }> = ({ view, setView }) => {
  return view === 'login' ? (
    <LoginForm onSwitchToRegister={() => setView('register')} />
  ) : (
    <RegisterForm onSwitchToLogin={() => setView('login')} />
  );
};

// ============================================================================
// STAT CARD
// ============================================================================

const StatCard: React.FC<{ 
  icon: React.ReactNode; 
  label: string; 
  value: string; 
  change?: string;
  isPositive?: boolean;
}> = ({ icon, label, value, change, isPositive = true }) => {
  return (
    <div className="professional-card p-6 rounded-3xl">
      <div className="flex items-start justify-between mb-4">
        <div className="p-3 rounded-2xl" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
          <div style={{ color: '#10B981' }}>
            {icon}
          </div>
        </div>
        {change && (
          <div className="flex items-center gap-1 px-3 py-1 rounded-full text-sm font-semibold" style={{ 
            color: isPositive ? '#10B981' : '#EF4444',
            background: isPositive ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)'
          }}>
            {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
            {change}
          </div>
        )}
      </div>
      <div className="text-3xl font-bold mb-1" style={{ color: '#E5E5E5' }}>
        {value}
      </div>
      <div className="text-sm" style={{ color: '#9CA3AF' }}>
        {label}
      </div>
    </div>
  );
};

// ============================================================================
// FEATURE CARD
// ============================================================================

const FeatureCard: React.FC<{ 
  icon: React.ReactNode; 
  title: string; 
  description: string;
}> = ({ icon, title, description }) => {
  return (
    <div className="professional-card p-6 rounded-3xl">
      <div className="flex items-start gap-4">
        <div className="p-3 rounded-2xl flex-shrink-0" style={{ background: 'rgba(16, 185, 129, 0.15)' }}>
          <div style={{ color: '#10B981' }}>
            {icon}
          </div>
        </div>
        <div>
          <h3 className="font-semibold mb-2 text-lg" style={{ color: '#E5E5E5' }}>
            {title}
          </h3>
          <p className="text-sm leading-relaxed" style={{ color: '#9CA3AF' }}>
            {description}
          </p>
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// MAIN LANDING PAGE
// ============================================================================

export default function LandingPage() {
  const router = useRouter();
  const { isAuthenticated, hasHydrated } = useAuthStore();
  const [view, setView] = useState<'login' | 'register'>('login');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    injectProfessionalStyles();
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && hasHydrated && isAuthenticated) {
      router.push('/dashboard');
    }
  }, [isAuthenticated, hasHydrated, router, mounted]);

  if (!mounted || !hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: '#1A1D23' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 rounded-full mx-auto mb-4 animate-spin" style={{
            borderColor: '#10B981',
            borderTopColor: 'transparent'
          }} />
          <div className="text-sm" style={{ color: '#9CA3AF' }}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ background: '#1A1D23' }}>
      {/* Market Ticker */}
      <MarketTicker />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Decorative Blobs */}
        <div className="absolute top-20 left-0 w-72 h-72 rounded-full opacity-20 blur-3xl blob-decoration pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
        }} />
        <div className="absolute top-40 right-0 w-96 h-96 rounded-full opacity-15 blur-3xl blob-decoration pointer-events-none" style={{
          background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
          animationDelay: '2s'
        }} />
        
        {/* Hero Section */}
        <div className="py-16 lg:py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            
            {/* Left Content */}
            <div className="space-y-8 animate-fade-in">
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full floating" style={{
                background: 'rgba(16, 185, 129, 0.15)',
                border: '2px solid rgba(16, 185, 129, 0.3)',
                boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
              }}>
                <Award className="w-4 h-4" style={{ color: '#10B981' }} />
                <span className="text-sm font-semibold" style={{ color: '#10B981' }}>
                  Trusted by 10,000+ Professional Traders
                </span>
              </div>

              {/* Heading */}
              <div>
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6" style={{ color: '#E5E5E5' }}>
                  Professional Trading
                  <br />
                  <span style={{ color: '#10B981' }}>Automation Platform</span>
                </h1>
                <p className="text-lg leading-relaxed" style={{ color: '#9CA3AF' }}>
                  Enterprise-grade algorithmic trading with advanced risk management, 
                  real-time analytics, and institutional-level execution.
                </p>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-3 gap-4">
                {[
                  { icon: <Shield className="w-5 h-5" />, text: 'Bank-Grade Security' },
                  { icon: <CheckCircle className="w-5 h-5" />, text: 'ISO Certified' },
                  { icon: <Users className="w-5 h-5" />, text: '24/7 Support' }
                ].map((item, i) => (
                  <div key={i} className="flex flex-col items-center gap-3 p-5 rounded-2xl transition-all hover:scale-105" style={{
                    background: 'rgba(16, 185, 129, 0.05)',
                    border: '1px solid rgba(16, 185, 129, 0.15)'
                  }}>
                    <div className="p-2 rounded-full" style={{ 
                      background: 'rgba(16, 185, 129, 0.1)',
                      color: '#10B981' 
                    }}>
                      {item.icon}
                    </div>
                    <span className="text-xs text-center font-medium" style={{ color: '#9CA3AF' }}>
                      {item.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA Buttons */}
              <div className="flex flex-wrap gap-4">
                <button
                  onClick={() => setView('register')}
                  className="px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105 hover:shadow-xl flex items-center gap-2"
                  style={{
                    background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                    color: '#FFFFFF',
                    boxShadow: '0 4px 20px rgba(16, 185, 129, 0.3)'
                  }}
                >
                  Start Demo Account
                  <ArrowRight className="w-5 h-5" />
                </button>
                <button
                  onClick={() => setView('login')}
                  className="px-8 py-4 rounded-2xl font-semibold transition-all hover:scale-105 hover:bg-opacity-90"
                  style={{
                    background: 'rgba(16, 185, 129, 0.1)',
                    border: '2px solid rgba(16, 185, 129, 0.3)',
                    color: '#10B981'
                  }}
                >
                  Sign In
                </button>
              </div>
            </div>

            {/* Right - Auth Card */}
            <div className="animate-slide-up delay-200">
              <div className="professional-card p-8 rounded-3xl" style={{
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
              }}>
                <div className="flex items-center justify-between mb-6 pb-6" style={{
                  borderBottom: '1px solid rgba(192, 192, 192, 0.15)'
                }}>
                  <div>
                    <h2 className="text-2xl font-bold" style={{ color: '#E5E5E5' }}>
                      {view === 'login' ? 'Welcome Back' : 'Get Started'}
                    </h2>
                    <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                      {view === 'login' ? 'Sign in to your account' : 'Create your professional account'}
                    </p>
                  </div>
                  <Briefcase className="w-8 h-8" style={{ color: '#10B981' }} />
                </div>

                <AuthPanel view={view} setView={setView} />

                <div className="mt-6 pt-6 flex items-center gap-2" style={{
                  borderTop: '1px solid rgba(192, 192, 192, 0.15)'
                }}>
                  <Lock className="w-4 h-4" style={{ color: '#10B981' }} />
                  <span className="text-xs" style={{ color: '#9CA3AF' }}>
                    256-bit SSL encryption. Your data is secure.
                  </span>
                </div>
              </div>
            </div>

          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 animate-slide-up delay-300" style={{
          borderTop: '1px solid rgba(192, 192, 192, 0.15)',
          borderBottom: '1px solid rgba(192, 192, 192, 0.15)'
        }}>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
              icon={<BarChart3 className="w-6 h-6" />}
              label="Average Win Rate"
              value="92%"
              change="+2.3%"
              isPositive={true}
            />
            <StatCard
              icon={<DollarSign className="w-6 h-6" />}
              label="Daily Volume"
              value="$2.4M"
              change="+18%"
              isPositive={true}
            />
            <StatCard
              icon={<Users className="w-6 h-6" />}
              label="Active Users"
              value="10.2K"
              change="+5.7%"
              isPositive={true}
            />
            <StatCard
              icon={<Target className="w-6 h-6" />}
              label="Avg ROI"
              value="34%"
              change="+12%"
              isPositive={true}
            />
          </div>
        </div>

        {/* Chart Section */}
        <div className="py-16 animate-slide-up delay-400">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6" style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
            }}>
              <Activity className="w-4 h-4" style={{ color: '#10B981' }} />
              <span className="text-sm font-semibold" style={{ color: '#10B981' }}>
                Live Market Data
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#E5E5E5' }}>
              Real-Time Performance Overview
            </h2>
            <p className="text-lg" style={{ color: '#9CA3AF' }}>
              Professional-grade analytics and market insights
            </p>
          </div>

          <div className="professional-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm font-semibold mb-1" style={{ color: '#9CA3AF' }}>
                  BTC/USD
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold" style={{ color: '#E5E5E5' }}>
                    $47,234.00
                  </span>
                  <span className="text-sm font-semibold flex items-center gap-1" style={{ color: '#10B981' }}>
                    <TrendingUp className="w-4 h-4" />
                    +2.34%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-xs mb-1" style={{ color: '#9CA3AF' }}>Last 30 days</div>
                <div className="text-sm font-semibold" style={{ color: '#10B981' }}>Live</div>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden" style={{ 
              height: '400px',
              background: '#1A1D23'
            }}>
              <ProfessionalChart />
            </div>

            <div className="grid grid-cols-4 gap-4 mt-6 pt-6" style={{
              borderTop: '1px solid rgba(192, 192, 192, 0.15)'
            }}>
              {[
                { label: 'Open', value: '$46,892' },
                { label: 'High', value: '$48,123' },
                { label: 'Low', value: '$46,234' },
                { label: 'Volume', value: '$2.4B' }
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs mb-1" style={{ color: '#9CA3AF' }}>{stat.label}</div>
                  <div className="text-sm font-semibold" style={{ color: '#E5E5E5' }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 animate-slide-up delay-500">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full mb-6" style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '2px solid rgba(16, 185, 129, 0.3)',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.1)'
            }}>
              <Zap className="w-4 h-4" style={{ color: '#10B981' }} />
              <span className="text-sm font-semibold" style={{ color: '#10B981' }}>
                Enterprise Features
              </span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#E5E5E5' }}>
              Institutional-Grade Trading Tools
            </h2>
            <p className="text-lg max-w-3xl mx-auto" style={{ color: '#9CA3AF' }}>
              Advanced features designed for professional traders and institutions
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            <FeatureCard
              icon={<Briefcase className="w-6 h-6" />}
              title="AI-Powered Analysis"
              description="Machine learning algorithms analyze market conditions and execute trades with precision timing."
            />
            <FeatureCard
              icon={<Shield className="w-6 h-6" />}
              title="Advanced Risk Management"
              description="Comprehensive risk controls including stop-loss, take-profit, and portfolio diversification."
            />
            <FeatureCard
              icon={<TrendingUp className="w-6 h-6" />}
              title="Martingale Strategy"
              description="Automated loss recovery system with configurable multipliers and safety limits."
            />
            <FeatureCard
              icon={<Eye className="w-6 h-6" />}
              title="Real-Time Monitoring"
              description="Professional dashboard with live performance metrics, win rates, and execution history."
            />
            <FeatureCard
              icon={<Clock className="w-6 h-6" />}
              title="Automated Scheduling"
              description="Set up to 10 order times per day with precise execution and trend prediction."
            />
            <FeatureCard
              icon={<BarChart3 className="w-6 h-6" />}
              title="Performance Analytics"
              description="Detailed reports, backtesting, and optimization tools for strategy refinement."
            />
          </div>
        </div>

        {/* Final CTA */}
        <div className="py-16 animate-slide-up delay-600">
          <div className="professional-card p-12 rounded-3xl text-center shimmer-effect" style={{
            boxShadow: '0 20px 60px rgba(16, 185, 129, 0.2)'
          }}>
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: '#E5E5E5' }}>
              Ready to Start Professional Trading?
            </h2>
            <p className="text-lg mb-8 max-w-2xl mx-auto" style={{ color: '#9CA3AF' }}>
              Join thousands of traders who trust our platform for automated, intelligent trading
            </p>
            <button
              onClick={() => setView('register')}
              className="px-12 py-5 rounded-2xl font-bold text-lg transition-all hover:scale-105 hover:shadow-2xl inline-flex items-center gap-3"
              style={{
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: '#FFFFFF',
                boxShadow: '0 10px 30px rgba(16, 185, 129, 0.4)'
              }}
            >
              Open Free Demo Account
              <ArrowRight className="w-6 h-6" />
            </button>
            <div className="flex items-center justify-center gap-6 mt-8 text-sm" style={{ color: '#9CA3AF' }}>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
                background: 'rgba(16, 185, 129, 0.05)'
              }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />
                No credit card required
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
                background: 'rgba(16, 185, 129, 0.05)'
              }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />
                Full access to demo
              </div>
              <div className="flex items-center gap-2 px-4 py-2 rounded-full" style={{
                background: 'rgba(16, 185, 129, 0.05)'
              }}>
                <CheckCircle className="w-4 h-4" style={{ color: '#10B981' }} />
                Cancel anytime
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t py-8" style={{ borderColor: 'rgba(192, 192, 192, 0.15)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-sm" style={{ color: '#9CA3AF' }}>
              © {new Date().getFullYear()} Professional Trading Platform. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm" style={{ color: '#9CA3AF' }}>
              <a href="#" className="hover:underline transition-colors" style={{ color: '#9CA3AF' }}>Privacy Policy</a>
              <a href="#" className="hover:underline transition-colors" style={{ color: '#9CA3AF' }}>Terms of Service</a>
              <a href="#" className="hover:underline transition-colors" style={{ color: '#9CA3AF' }}>Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}