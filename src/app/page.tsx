'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
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

    .feature-row {
      position: relative;
      border-top: 1px solid rgba(192, 192, 192, 0.12);
      transition: all 0.3s ease;
      cursor: default;
    }

    .feature-row::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 3px;
      background: #10B981;
      transform: scaleY(0);
      transition: transform 0.3s ease;
    }

    .feature-row:hover::before {
      transform: scaleY(1);
    }

    .feature-row:hover {
      background: rgba(16, 185, 129, 0.03);
    }

    .feature-row:hover .feat-num {
      color: #10B981;
    }

    .feat-num {
      font-family: 'Courier New', monospace;
      transition: color 0.3s ease;
    }

    @keyframes countUp {
      from { opacity: 0; transform: translateY(8px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .cta-ticker span {
      display: inline-block;
      animation: countUp 0.4s ease both;
    }

    @keyframes scanline {
      0% { transform: translateY(-100%); }
      100% { transform: translateY(400%); }
    }

    .scanline {
      animation: scanline 4s linear infinite;
    }

    .slash-divider {
      position: relative;
    }

    .slash-divider::after {
      content: '';
      position: absolute;
      right: 0;
      top: 10%;
      height: 80%;
      width: 1px;
      background: linear-gradient(to bottom, transparent, rgba(16, 185, 129, 0.4), transparent);
    }

    /* Logo animation */
    @keyframes logoFloat {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-5px); }
    }

    .form-logo-mobile {
      animation: logoFloat 3s ease-in-out infinite;
    }

    /* ── HERO COLUMN ORDER: form first on mobile/tablet ── */
    @media (max-width: 1023px) {
      .hero-left  { order: 2; }
      .hero-right { order: 1; }
    }

    /* Hero */
    @media (max-width: 1023px) {
      .hero-grid { gap: 2.5rem !important; }
    }

    @media (max-width: 639px) {
      .hero-section { padding-top: 2rem !important; padding-bottom: 2rem !important; }
      .hero-title { font-size: 2.4rem !important; line-height: 1.0 !important; }
      .hero-sub { font-size: 14px !important; margin-bottom: 1.5rem !important; }
      .data-strip { max-width: 100% !important; }
      .auth-card { padding: 1.25rem !important; border-radius: 1.25rem !important; }
    }

    @media (min-width: 640px) and (max-width: 1023px) {
      .hero-section { padding-top: 3rem !important; padding-bottom: 3rem !important; }
      .auth-card { padding: 1.75rem !important; }
    }

    /* Chart */
    .chart-canvas-wrap { height: 400px; }

    @media (max-width: 639px) {
      .chart-canvas-wrap { height: 240px !important; }
      .chart-section-header { flex-direction: column !important; align-items: flex-start !important; gap: 0.5rem !important; }
      .chart-stream-badge { display: none !important; }
    }

    @media (min-width: 640px) and (max-width: 1023px) {
      .chart-canvas-wrap { height: 320px !important; }
    }

    /* Feature rows */
    @media (max-width: 639px) {
      .feature-row { padding-top: 1.25rem !important; padding-bottom: 1.25rem !important; padding-left: 1rem !important; }
      .feature-row .feat-desc { max-width: 100% !important; }
      .features-header { padding-left: 1rem !important; padding-right: 1rem !important; }
    }

    /* CTA section */
    @media (max-width: 1023px) {
      .cta-grid { gap: 2.5rem !important; }
      .cta-right-col { border-left: none !important; padding-left: 0 !important; border-top: 1px solid rgba(192,192,192,0.1) !important; padding-top: 2rem !important; }
    }

    @media (max-width: 639px) {
      .cta-section { padding-top: 3.5rem !important; padding-bottom: 3.5rem !important; }
      .cta-headline { font-size: 2.4rem !important; }
      .cta-btn { width: 100% !important; justify-content: center !important; }
      .cta-trust-grid { grid-template-columns: repeat(3, 1fr) !important; }
    }

    /* Section header font on mobile */
    @media (max-width: 639px) {
      .section-headline { font-size: 1.8rem !important; }
      .section-headline-market { font-size: 1.75rem !important; }
    }

    /* Global overflow guard */
    html { overflow-x: hidden; }
    body { overflow-x: hidden; max-width: 100vw; }
  `;
  document.head.appendChild(style);
};

// ============================================================================
// BTC LIVE TICKER HOOK — Binance public API, no key needed
// ============================================================================

interface BtcTickerData {
  price: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  volume: number;
  isUp: boolean;
}

const useBtcTicker = (): BtcTickerData | null => {
  const [ticker, setTicker] = useState<BtcTickerData | null>(null);

  useEffect(() => {
    // Fetch initial 24hr stats
    fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=BTCUSDT')
      .then(r => r.json())
      .then(d => {
        setTicker({
          price: parseFloat(d.lastPrice),
          changePercent: parseFloat(d.priceChangePercent),
          open: parseFloat(d.openPrice),
          high: parseFloat(d.highPrice),
          low: parseFloat(d.lowPrice),
          volume: parseFloat(d.quoteVolume),
          isUp: parseFloat(d.priceChangePercent) >= 0,
        });
      })
      .catch(console.error);

    // WebSocket for real-time price tick
    const ws = new WebSocket('wss://stream.binance.com:9443/ws/btcusdt@aggTrade');
    ws.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        const newPrice = parseFloat(msg.p);
        setTicker(prev => {
          if (!prev) return prev;
          return { ...prev, price: newPrice, isUp: newPrice >= prev.open };
        });
      } catch {}
    };

    return () => ws.close();
  }, []);

  return ticker;
};

// ============================================================================
// LIVE CHART COMPONENT
// ============================================================================

const ProfessionalChart: React.FC<{ seedPrice?: number }> = ({ seedPrice }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [data, setData] = useState<number[]>([]);
  const seededRef = useRef(false);

  useEffect(() => {
    // Wait for real price, initialize only once
    if (seededRef.current) return;
    const basePrice = seedPrice || 0;
    if (!basePrice) return;
    seededRef.current = true;

    const points = 60;
    const newData: number[] = [];
    let value = basePrice;
    const swing = basePrice * 0.005; // 0.5% swing range
    
    for (let i = 0; i < points; i++) {
      value += (Math.random() - 0.48) * swing;
      value = Math.max(basePrice * 0.97, Math.min(basePrice * 1.03, value));
      newData.push(value);
    }
    setData(newData);

    // Update data every 2s — drift around real price
    const interval = setInterval(() => {
      setData(prev => {
        const lastValue = prev[prev.length - 1];
        const drift = (basePrice - lastValue) * 0.05; // gentle pull toward real price
        const newValue = lastValue + drift + (Math.random() - 0.48) * swing * 0.6;
        return [...prev.slice(1), newValue];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [seedPrice]);

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
// TICKER TYPES & MULTI-TICKER HOOK
// ============================================================================

interface TickerItem {
  symbol: string;
  price: number;
  change: number;
  isUp: boolean;
  isLive: boolean;
}

const useMultiTicker = (): TickerItem[] => {
  const [tickers, setTickers] = useState<TickerItem[]>([
    { symbol: 'ETH/USD',  price: 0,      change: 0,     isUp: true,  isLive: false },
    { symbol: 'EUR/USD',  price: 0,      change: 0,     isUp: true,  isLive: false },
    { symbol: 'GBP/USD',  price: 0,      change: 0,     isUp: true,  isLive: false },
    { symbol: 'GOLD',     price: 0,      change: 0,     isUp: true,  isLive: false },
    { symbol: 'SPX',      price: 4789,   change: 0.67,  isUp: true,  isLive: false },
  ]);

  const update = (symbol: string, patch: Partial<TickerItem>) =>
    setTickers(prev => prev.map(t => t.symbol === symbol ? { ...t, ...patch, isLive: true } : t));

  useEffect(() => {
    // ── ETH: Binance 24hr REST ──────────────────────────────────────────
    fetch('https://api.binance.com/api/v3/ticker/24hr?symbol=ETHUSDT')
      .then(r => r.json())
      .then(d => update('ETH/USD', {
        price:  parseFloat(d.lastPrice),
        change: parseFloat(d.priceChangePercent),
        isUp:   parseFloat(d.priceChangePercent) >= 0,
      })).catch(() => update('ETH/USD', { price: 2456, change: 1.82, isUp: true }));

    // ── ETH: Binance WebSocket live price ───────────────────────────────
    const ethWs = new WebSocket('wss://stream.binance.com:9443/ws/ethusdt@aggTrade');
    ethWs.onmessage = (e) => {
      try {
        const msg = JSON.parse(e.data);
        update('ETH/USD', { price: parseFloat(msg.p) });
      } catch {}
    };

    // ── EUR/USD & GBP/USD: frankfurter.app (free, no key) ───────────────
    fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP')
      .then(r => r.json())
      .then(d => {
        // frankfurter returns EUR and GBP per 1 USD, so price = 1/rate
        const eur = d.rates?.EUR ? +(1 / d.rates.EUR).toFixed(4) : 1.0842;
        const gbp = d.rates?.GBP ? +(1 / d.rates.GBP).toFixed(4) : 1.2634;
        update('EUR/USD', { price: eur, change: 0, isUp: true });
        update('GBP/USD', { price: gbp, change: 0, isUp: true });
      }).catch(() => {
        update('EUR/USD', { price: 1.0842, change: -0.23, isUp: false });
        update('GBP/USD', { price: 1.2634, change:  0.45, isUp: true  });
      });

    // ── GOLD: goldprice.org (free, no key) ──────────────────────────────
    fetch('https://data-asg.goldprice.org/dbXRates/USD')
      .then(r => r.json())
      .then(d => {
        const price = d?.items?.[0]?.xauPrice;
        if (price) update('GOLD', { price: +parseFloat(price).toFixed(2), change: -0.12, isUp: false });
        else update('GOLD', { price: 2034, change: -0.12, isUp: false });
      }).catch(() => update('GOLD', { price: 2034, change: -0.12, isUp: false }));

    // ── Refresh forex & gold every 60s ──────────────────────────────────
    const interval = setInterval(() => {
      fetch('https://api.frankfurter.app/latest?from=USD&to=EUR,GBP')
        .then(r => r.json())
        .then(d => {
          if (d.rates?.EUR) update('EUR/USD', { price: +(1 / d.rates.EUR).toFixed(4) });
          if (d.rates?.GBP) update('GBP/USD', { price: +(1 / d.rates.GBP).toFixed(4) });
        }).catch(() => {});
      fetch('https://data-asg.goldprice.org/dbXRates/USD')
        .then(r => r.json())
        .then(d => {
          const price = d?.items?.[0]?.xauPrice;
          if (price) update('GOLD', { price: +parseFloat(price).toFixed(2) });
        }).catch(() => {});
    }, 60_000);

    return () => {
      ethWs.close();
      clearInterval(interval);
    };
  }, []);

  return tickers;
};

// ============================================================================
// MARKET TICKER
// ============================================================================

const MarketTicker: React.FC<{ btcPrice?: number; btcChange?: number; btcUp?: boolean }> = ({
  btcPrice, btcChange, btcUp
}) => {
  const multiTickers = useMultiTicker();

  const btcTicker: TickerItem = {
    symbol: 'BTC/USD',
    price:  btcPrice  ?? 0,
    change: btcChange ?? 0,
    isUp:   btcUp     ?? true,
    isLive: !!btcPrice,
  };

  const tickers: TickerItem[] = btcPrice
    ? [btcTicker, ...multiTickers]
    : multiTickers;

  return (
    <div className="market-ticker py-2" style={{ background: '#22252B', borderTop: '1px solid rgba(192, 192, 192, 0.15)' }}>
      <div className="ticker-content">
        {[...tickers, ...tickers].map((ticker, i) => (
          <div key={i} className="flex items-center gap-2 px-6 whitespace-nowrap">
            <span className="text-xs font-semibold flex items-center gap-1.5" style={{ color: '#E5E5E5' }}>
              {ticker.symbol}
              {ticker.isLive && (
                <span style={{
                  width: '5px', height: '5px', borderRadius: '50%',
                  background: '#10B981',
                  boxShadow: '0 0 4px rgba(16,185,129,0.8)',
                  display: 'inline-block',
                  animation: 'pulse 2s infinite',
                }} />
              )}
            </span>
            <span className="text-xs" style={{ color: '#9CA3AF' }}>
              {ticker.price > 0
                ? `$${ticker.price.toLocaleString(undefined, {
                    minimumFractionDigits: ticker.price < 100 ? 4 : 2,
                    maximumFractionDigits: ticker.price < 100 ? 4 : 2,
                  })}`
                : '—'}
            </span>
            <span
              className="text-xs font-semibold flex items-center gap-1"
              style={{ color: ticker.isUp ? '#10B981' : '#EF4444' }}
            >
              {ticker.isUp
                ? <TrendingUp className="w-3 h-3" />
                : <TrendingDown className="w-3 h-3" />}
              {ticker.change !== 0
                ? `${ticker.change > 0 ? '+' : ''}${ticker.change.toFixed(2)}%`
                : '—'}
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
// FEATURE ROW — editorial numbered list style
// ============================================================================

const FeatureRow: React.FC<{ 
  index: string;
  title: string; 
  description: string;
  tag: string;
}> = ({ index, title, description, tag }) => {
  return (
    <div className="feature-row pl-6 pr-4 py-8 flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-8">
      <div className="feat-num text-xs tracking-widest" style={{ 
        color: 'rgba(192,192,192,0.35)',
        minWidth: '2.5rem'
      }}>
        {index}
      </div>

      <div className="flex-1 sm:flex sm:items-center sm:gap-8">
        <div style={{ minWidth: '220px' }}>
          <h3 className="text-lg font-bold tracking-tight" style={{ color: '#E5E5E5', letterSpacing: '-0.02em' }}>
            {title}
          </h3>
          <span className="text-xs tracking-widest uppercase mt-1 inline-block" style={{ color: 'rgba(16,185,129,0.7)' }}>
            {tag}
          </span>
        </div>
        <p className="feat-desc text-sm leading-relaxed mt-2 sm:mt-0" style={{ color: '#6B7280', maxWidth: '480px' }}>
          {description}
        </p>
      </div>

      <div className="hidden sm:flex items-center justify-center w-6 h-6 rounded-full opacity-0 group-hover:opacity-100" style={{
        border: '1px solid rgba(16, 185, 129, 0.4)',
        color: '#10B981',
        fontSize: '10px'
      }}>
        →
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
  const btc = useBtcTicker();

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
    <div className="min-h-screen overflow-x-hidden" style={{ background: '#1A1D23' }}>
      {/* Market Ticker */}
      <MarketTicker btcPrice={btc?.price} btcChange={btc?.changePercent} btcUp={btc?.isUp} />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        
        {/* Decorative Blobs — isolated in overflow-hidden wrapper so blur never escapes the container */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute top-20 -left-8 w-64 h-64 rounded-full opacity-15 blur-3xl blob-decoration" style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.3) 0%, transparent 70%)'
          }} />
          <div className="absolute top-48 -right-8 w-72 h-72 rounded-full opacity-10 blur-3xl blob-decoration" style={{
            background: 'radial-gradient(circle, rgba(16, 185, 129, 0.2) 0%, transparent 70%)',
            animationDelay: '2s'
          }} />
        </div>
        
        {/* Hero Section */}
        <div className="hero-section py-8 sm:py-12 lg:py-20 relative" style={{ zIndex: 1 }}>
          <div className="hero-grid grid lg:grid-cols-2 gap-10 lg:gap-12 items-center">
            
            {/* Left Content */}
            <div className="hero-left animate-fade-in">

              {/* Monospace label */}
              <p className="text-xs tracking-widest uppercase mb-6" style={{ 
                color: 'rgba(16,185,129,0.7)',
                fontFamily: 'Courier New, monospace'
              }}>
                TRADING AUTOMATION
              </p>

              {/* Oversized headline */}
              <h1 className="hero-title" style={{
                fontSize: 'clamp(2.6rem, 5.5vw, 4.8rem)',
                fontWeight: 900,
                color: '#E5E5E5',
                letterSpacing: '-0.05em',
                lineHeight: '0.95',
                marginBottom: '2rem'
              }}>
                Platform.<br />
                Algoritma.<br />
                <span style={{ 
                  color: '#10B981',
                  position: 'relative',
                  display: 'inline-block'
                }}>
                  Hasil nyata.
                  <span style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: 0,
                    right: 0,
                    height: '3px',
                    background: 'linear-gradient(to right, #10B981, transparent)'
                  }} />
                </span>
              </h1>

              {/* Subtext — clean, no fluff */}
              <p className="hero-sub" style={{ 
                color: '#6B7280',
                fontSize: '15px',
                lineHeight: '1.7',
                maxWidth: '400px',
                marginBottom: '2.5rem'
              }}>
                Eksekusi order otomatis dengan risk management presisi,
                analitik real-time, dan kontrol penuh di tangan Anda.
              </p>

              {/* Horizontal data strip */}
              <div className="data-strip flex items-stretch gap-0" style={{
                border: '1px solid rgba(192,192,192,0.1)',
                borderRadius: '4px',
                overflow: 'hidden',
                maxWidth: '380px'
              }}>
                {[
                  { val: '0.3ms', label: 'Latency' },
                  { val: '99.9%', label: 'Uptime' },
                  { val: '24/7', label: 'Aktif' },
                ].map((item, i) => (
                  <div key={i} className="flex-1 py-4 px-3 slash-divider" style={{
                    borderRight: i < 2 ? '1px solid rgba(192,192,192,0.1)' : 'none',
                    textAlign: 'center'
                  }}>
                    <div style={{
                      fontSize: '1.1rem',
                      fontWeight: 800,
                      color: '#E5E5E5',
                      letterSpacing: '-0.02em',
                      fontFamily: 'Courier New, monospace'
                    }}>{item.val}</div>
                    <div style={{
                      fontSize: '10px',
                      color: '#4B5563',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                      marginTop: '2px'
                    }}>{item.label}</div>
                  </div>
                ))}
              </div>

            </div>

            {/* Right - Auth Card */}
            <div className="hero-right animate-slide-up delay-200">
              <div className="auth-card professional-card p-8 rounded-3xl" style={{
                boxShadow: '0 10px 40px rgba(0, 0, 0, 0.3)'
              }}>
                <div className="flex items-center justify-between mb-6 pb-6" style={{
                  borderBottom: '1px solid rgba(192, 192, 192, 0.15)'
                }}>
                  <div className="flex items-center gap-3">
                    {/* Logo - Only visible on mobile and tablet */}
                    <Image 
                      src="/logostc.png" 
                      alt="Logo" 
                      width={48}
                      height={48}
                      className="object-contain lg:hidden"
                      style={{
                        filter: 'drop-shadow(0 4px 12px rgba(16, 185, 129, 0.3))'
                      }}
                      priority
                    />
                    <div>
                      <h2 className="text-2xl font-bold" style={{ color: '#E5E5E5' }}>
                        {view === 'login' ? 'Welcome Back' : 'Get Started'}
                      </h2>
                      <p className="text-sm mt-1" style={{ color: '#9CA3AF' }}>
                        {view === 'login' ? 'Sign in to your account' : 'Create your professional account'}
                      </p>
                    </div>
                  </div>
                  <Briefcase className="w-8 h-8 hidden lg:block" style={{ color: '#10B981' }} />
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

        {/* Chart Section */}
        <div className="py-12 sm:py-16 animate-slide-up delay-300" style={{
          borderTop: '1px solid rgba(192, 192, 192, 0.1)'
        }}>
          <div className="chart-section-header flex items-end justify-between mb-10">
            <div>
              <p className="text-xs tracking-widest uppercase mb-3" style={{
                color: 'rgba(16,185,129,0.7)',
                fontFamily: 'Courier New, monospace'
              }}>
                MARKET FEED
              </p>
              <h2 className="section-headline-market" style={{
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 900,
                color: '#E5E5E5',
                letterSpacing: '-0.04em',
                lineHeight: 1
              }}>
                Data pasar,<br />
                <span style={{ color: '#10B981' }}>tanpa delay.</span>
              </h2>
            </div>
            <div className="chart-stream-badge hidden sm:flex items-center gap-2 pb-1" style={{
              fontFamily: 'Courier New, monospace'
            }}>
              <span style={{
                width: '8px', height: '8px', borderRadius: '50%',
                background: '#10B981',
                boxShadow: '0 0 8px rgba(16,185,129,0.9)',
                display: 'inline-block',
                animation: 'pulse 2s infinite'
              }} />
              <span style={{ fontSize: '11px', color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                STREAM AKTIF
              </span>
            </div>
          </div>

          <div className="professional-card p-6 rounded-3xl">
            <div className="flex items-center justify-between mb-6">
              <div>
                <div className="text-sm font-semibold mb-1 flex items-center gap-2" style={{ color: '#9CA3AF' }}>
                  BTC/USD
                  {btc && (
                    <span style={{
                      width: '6px', height: '6px', borderRadius: '50%',
                      background: '#10B981',
                      boxShadow: '0 0 6px rgba(16,185,129,0.9)',
                      display: 'inline-block',
                      animation: 'pulse 2s infinite'
                    }} />
                  )}
                </div>
                <div className="flex items-baseline gap-3">
                  <span className="text-3xl font-bold" style={{ color: '#E5E5E5', fontFamily: 'Courier New, monospace' }}>
                    {btc ? `$${btc.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '—'}
                  </span>
                  {btc && (
                    <span className="text-sm font-semibold flex items-center gap-1" style={{ color: btc.isUp ? '#10B981' : '#EF4444' }}>
                      {btc.isUp ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      {btc.changePercent > 0 ? '+' : ''}{btc.changePercent.toFixed(2)}%
                    </span>
                  )}
                </div>
              </div>
              <div className="text-right" style={{ fontFamily: 'Courier New, monospace' }}>
                <div className="text-xs mb-1" style={{ color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>24H</div>
                <div className="text-xs font-semibold" style={{ color: btc?.isUp ? '#10B981' : '#EF4444' }}>
                  {btc ? `${btc.isUp ? '▲' : '▼'} LIVE` : 'LOADING'}
                </div>
              </div>
            </div>

            <div className="chart-canvas-wrap rounded-2xl overflow-hidden" style={{ 
              background: '#1A1D23'
            }}>
              <ProfessionalChart seedPrice={btc?.price} />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6" style={{
              borderTop: '1px solid rgba(192, 192, 192, 0.15)'
            }}>
              {[
                { label: 'Open', value: btc ? `$${btc.open.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—' },
                { label: 'High', value: btc ? `$${btc.high.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—' },
                { label: 'Low', value: btc ? `$${btc.low.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—' },
                { label: 'Volume', value: btc ? `$${(btc.volume / 1e9).toFixed(2)}B` : '—' },
              ].map((stat, i) => (
                <div key={i} className="text-center">
                  <div className="text-xs mb-1" style={{ color: '#4B5563', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{stat.label}</div>
                  <div className="text-sm font-semibold" style={{ color: '#E5E5E5', fontFamily: 'Courier New, monospace' }}>{stat.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Features Section — editorial numbered list */}
        <div className="py-12 sm:py-16 lg:py-20 animate-slide-up delay-400" style={{
          borderTop: '1px solid rgba(192, 192, 192, 0.1)'
        }}>
          {/* Section header */}
          <div className="features-header flex items-end justify-between mb-2 px-6">
            <div>
              <p className="text-xs tracking-widest uppercase mb-3" style={{ 
                color: 'rgba(16,185,129,0.7)',
                fontFamily: 'Courier New, monospace'
              }}>
                CAPABILITIES
              </p>
              <h2 className="section-headline" style={{ 
                color: '#E5E5E5',
                fontSize: 'clamp(2rem, 4vw, 3rem)',
                fontWeight: 800,
                letterSpacing: '-0.04em',
                lineHeight: 1
              }}>
                Apa yang kami<br />
                <span style={{ color: '#10B981' }}>sediakan.</span>
              </h2>
            </div>
            <div className="hidden lg:block text-right" style={{ color: 'rgba(192,192,192,0.25)', fontFamily: 'Courier New, monospace', fontSize: '11px' }}>
              <div>SYS.STATUS: ONLINE</div>
              <div>ENGINE: v4.2.1</div>
              <div>LATENCY: 0.3ms</div>
            </div>
          </div>

          {/* Numbered rows */}
          <div className="mt-10">
            <FeatureRow
              index="01"
              title="AI-Powered Analysis"
              tag="Machine Learning"
              description="Algoritma pembelajaran mesin menganalisis kondisi pasar dan mengeksekusi order dengan presisi waktu yang tidak bisa dilakukan secara manual."
            />
            <FeatureRow
              index="02"
              title="Risk Management"
              tag="Proteksi Modal"
              description="Stop-loss otomatis, take-profit dinamis, dan diversifikasi portofolio yang menjaga modal Anda tetap aman di kondisi pasar apapun."
            />
            <FeatureRow
              index="03"
              title="Martingale Strategy"
              tag="Loss Recovery"
              description="Sistem pemulihan kerugian otomatis dengan multiplier yang bisa dikonfigurasi dan safety limit untuk mencegah overexposure."
            />
            <FeatureRow
              index="04"
              title="Real-Time Monitoring"
              tag="Live Dashboard"
              description="Dashboard profesional dengan metrik performa live, win rate aktual, dan riwayat eksekusi lengkap dalam satu tampilan."
            />
            <FeatureRow
              index="05"
              title="Automated Scheduling"
              tag="Smart Execution"
              description="Jadwalkan hingga 10 waktu order per hari dengan eksekusi presisi dan prediksi tren berbasis data historis."
            />
            <FeatureRow
              index="06"
              title="Performance Analytics"
              tag="Deep Insights"
              description="Laporan detail, backtesting komprehensif, dan tools optimisasi strategi untuk terus meningkatkan performa trading Anda."
            />
            {/* Bottom border */}
            <div style={{ borderTop: '1px solid rgba(192, 192, 192, 0.12)' }} />
          </div>
        </div>

        {/* Final CTA — asymmetric raw layout */}
        <div className="cta-section py-16 sm:py-20 lg:py-24 animate-slide-up delay-500" style={{
          borderTop: '1px solid rgba(192, 192, 192, 0.1)'
        }}>
          <div className="relative">
            {/* Background decorative text */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden select-none">
              <span style={{
                fontSize: 'clamp(6rem, 18vw, 14rem)',
                fontWeight: 900,
                color: 'rgba(16, 185, 129, 0.03)',
                letterSpacing: '-0.08em',
                lineHeight: 1,
                whiteSpace: 'nowrap'
              }}>
                TRADE
              </span>
            </div>

            {/* Main content */}
            <div className="cta-grid relative grid lg:grid-cols-2 gap-10 lg:gap-16 items-end">
              
              {/* Left — oversized headline */}
              <div>
                <p className="text-xs tracking-widest uppercase mb-6" style={{ 
                  color: 'rgba(16,185,129,0.6)',
                  fontFamily: 'Courier New, monospace'
                }}>
                  MULAI SEKARANG
                </p>
                <h2 className="cta-headline" style={{
                  fontSize: 'clamp(2.8rem, 6vw, 5.5rem)',
                  fontWeight: 900,
                  color: '#E5E5E5',
                  letterSpacing: '-0.05em',
                  lineHeight: '0.95',
                  marginBottom: '2rem'
                }}>
                  Pasar tidak<br />
                  menunggu.<br />
                  <span style={{ 
                    color: '#10B981',
                    position: 'relative',
                    display: 'inline-block'
                  }}>
                    Kamu juga tidak perlu.
                    {/* Underline accent */}
                    <span style={{
                      position: 'absolute',
                      bottom: '-4px',
                      left: 0,
                      right: 0,
                      height: '3px',
                      background: 'linear-gradient(to right, #10B981, transparent)'
                    }} />
                  </span>
                </h2>
                
                {/* Live counter */}
                <div className="flex items-center gap-3">
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#10B981',
                    boxShadow: '0 0 10px rgba(16,185,129,0.8)',
                    animation: 'pulse 2s infinite'
                  }} />
                  <span className="text-sm" style={{ color: '#6B7280', fontFamily: 'Courier New, monospace' }}>
                    1,247 trader aktif saat ini
                  </span>
                </div>
              </div>

              {/* Right — action block */}
              <div className="cta-right-col lg:pl-16" style={{ borderLeft: '1px solid rgba(192,192,192,0.1)' }}>
                <p className="text-base mb-8 leading-relaxed" style={{ color: '#6B7280' }}>
                  Akun demo gratis. Tidak perlu kartu kredit. 
                  Akses penuh ke semua fitur platform — mulai dalam 60 detik.
                </p>

                {/* Raw CTA button */}
                <button
                  className="cta-btn"
                  onClick={() => {
                    setView('register');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '16px',
                    padding: '18px 32px',
                    background: '#10B981',
                    color: '#0A0D10',
                    fontWeight: 800,
                    fontSize: '15px',
                    letterSpacing: '0.04em',
                    textTransform: 'uppercase',
                    border: 'none',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    clipPath: 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#059669';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.background = '#10B981';
                    (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                  }}
                >
                  Buat Akun Demo
                  <span style={{ fontSize: '20px', fontWeight: 300 }}>→</span>
                </button>

                {/* Minimal trust line */}
                <div className="mt-8 pt-8" style={{ borderTop: '1px solid rgba(192,192,192,0.1)' }}>
                  <div className="cta-trust-grid grid grid-cols-3 gap-4">
                    {[
                      { num: '60s', label: 'Setup time' },
                      { num: '$0', label: 'Biaya awal' },
                      { num: '∞', label: 'Free trial' },
                    ].map((item, i) => (
                      <div key={i}>
                        <div style={{ 
                          fontSize: '1.5rem', 
                          fontWeight: 800, 
                          color: '#E5E5E5',
                          letterSpacing: '-0.03em'
                        }}>{item.num}</div>
                        <div style={{ 
                          fontSize: '11px', 
                          color: '#4B5563',
                          textTransform: 'uppercase',
                          letterSpacing: '0.08em',
                          marginTop: '2px'
                        }}>{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer */}
      <div className="border-t py-6 sm:py-8" style={{ borderColor: 'rgba(192, 192, 192, 0.15)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <p className="text-xs sm:text-sm text-center sm:text-left" style={{ color: '#4B5563' }}>
              © {new Date().getFullYear()} Professional Trading Platform. All rights reserved.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-6 text-xs sm:text-sm" style={{ color: '#4B5563' }}>
              <a href="#" className="hover:underline transition-colors" style={{ color: '#4B5563' }}>Privacy Policy</a>
              <a href="#" className="hover:underline transition-colors" style={{ color: '#4B5563' }}>Terms of Service</a>
              <a href="#" className="hover:underline transition-colors" style={{ color: '#4B5563' }}>Contact Support</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}