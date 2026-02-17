'use client';
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/store';
import { api } from '@/lib/api';
import { BottomNav } from '@/components/BottomNav';
import { ChartCard } from '@/components/ChartCard';
import {
  Activity, AlertCircle, BarChart2, Calendar,
  ChevronDown, ChevronUp, Info, Play, Pause, Plus,
  RefreshCw, Settings, Square, Trash2, X, Zap,
} from 'lucide-react';

// ═══════════════════════════════════════════════════════════════
// TOKENS
// ═══════════════════════════════════════════════════════════════
const C = {
  bg:    '#000000',
  s1:    '#06110e',
  s2:    '#091a14',
  s3:    '#0c2119',
  cyan:  '#34d399',
  cyand: 'rgba(52,211,153,0.12)',
  cyang: 'rgba(52,211,153,0.06)',
  coral: '#ff5263',
  cord:  'rgba(255,82,99,0.1)',
  text:  '#ffffff',        // pure white untuk text utama
  sub:   '#e8f5f1',        // off-white untuk secondary text
  muted: 'rgba(255,255,255,0.65)', // white dengan opacity untuk muted text
  faint: 'rgba(255,255,255,0.08)',
  bdr:   'rgba(52,211,153,0.15)',
};

// ═══════════════════════════════════════════════════════════════
// TYPES
// ═══════════════════════════════════════════════════════════════
interface OrderSettings {
  assetSymbol: string; assetName: string;
  accountType: 'demo'|'real'; duration: number; amount: number;
  schedules: {time:string; trend:'buy'|'sell'}[];
  martingaleSetting: {maxStep:number; multiplier:number};
  stopLossProfit: {stopProfit?:number; stopLoss?:number};
}
interface BotStatus {
  isRunning:boolean; isPaused:boolean; activeSchedules:number;
  nextExecutionTime?:string; lastExecutionTime?:string; currentProfit:number;
}

// ═══════════════════════════════════════════════════════════════
// GLOBAL CSS
// ═══════════════════════════════════════════════════════════════
const G = () => (
  <style>{`
    @keyframes spin      { to{transform:rotate(360deg)} }
    @keyframes ping      { 0%{transform:scale(1);opacity:.8} 70%{transform:scale(2.2);opacity:0} 100%{transform:scale(2.2);opacity:0} }
    @keyframes slide-up  { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
    @keyframes scanline  { 0%{top:-10%} 100%{top:110%} }
    @keyframes float     { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-8px)} }
    @keyframes pulse     { 0%,100%{opacity:1} 50%{opacity:.5} }
    @keyframes glow      { 0%,100%{opacity:.3} 50%{opacity:.8} }
    @keyframes shimmer   { 0%{background-position:200% center} 100%{background-position:-200% center} }
    @keyframes shimmer-vertical { 0%{transform:translateY(-100%)} 100%{transform:translateY(100%)} }
    @keyframes fade-in   { from{opacity:0} to{opacity:1} }
    @keyframes skeleton-pulse { 0%,100%{opacity:.4} 50%{opacity:.7} }
    @keyframes active-pulse-buy  { 0%,100%{box-shadow:0 0 0 0 rgba(52,211,153,0)} 50%{box-shadow:0 0 0 3px rgba(52,211,153,0.25)} }
    @keyframes active-pulse-sell { 0%,100%{box-shadow:0 0 0 0 rgba(255,82,99,0)}  50%{box-shadow:0 0 0 3px rgba(255,82,99,0.25)} }
    @keyframes glow-border-buy  { 0%,100%{border-color:rgba(52,211,153,0.35)} 50%{border-color:rgba(52,211,153,0.75)} }
    @keyframes glow-border-sell { 0%,100%{border-color:rgba(255,82,99,0.35)}  50%{border-color:rgba(255,82,99,0.75)} }

    *{box-sizing:border-box}
    
    /* Dashboard pattern - lebih kuat dengan !important */
    html.dashboard-page,
    html.dashboard-page body {
      background: #000000 !important;
    }
    
    /* Pattern grid layer - sama seperti globals.css */
    html.dashboard-page body::before{
      content:'' !important;
      position:fixed !important;
      inset:0 !important;
      background-image:
        repeating-linear-gradient(
          90deg,
          transparent 0px,
          rgba(52,211,153,0.055) 1px,
          transparent 2px,
          transparent 32px
        ),
        repeating-linear-gradient(
          0deg,
          transparent 0px,
          rgba(52,211,153,0.04) 1px,
          transparent 2px,
          transparent 32px
        ) !important;
      pointer-events:none !important;
      z-index:0 !important;
      opacity:1 !important;
    }

    /* Animated shimmer overlay */
    html.dashboard-page body::after{
      content:'' !important;
      position:fixed !important;
      inset:0 !important;
      background:linear-gradient(
        180deg,
        rgba(52,211,153,0.07) 0%,
        transparent 18%,
        transparent 82%,
        rgba(52,211,153,0.05) 100%
      ) !important;
      background-size:100% 400% !important;
      animation:shimmer-vertical 12s ease-in-out infinite !important;
      pointer-events:none !important;
      z-index:0 !important;
      opacity:1 !important;
    }
    
    /* Ensure content above pattern */
    html.dashboard-page body > * {
      position:relative !important;
      z-index:1 !important;
    }

    /* Dashboard specific content z-index */
    html.dashboard-page body > *:not(style){
      position:relative;
      z-index:2;
    }

    /* Hide badge text on mobile */
    @media (max-width: 767px) {
      .badge-text-hide-mobile { display: none; }
    }

    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-thumb{background:${C.bdr};transition:background .2s}
    ::-webkit-scrollbar-thumb:hover{background:${C.cyan}80}

    /* inputs */
    .ds-input{
      width:100%;padding:10px 13px;
      background:${C.s2}!important;color:#ffffff!important;
      border:1px solid ${C.bdr}!important;
      font-family:var(--font-geist-sans)!important;font-size:13px!important;
      outline:none!important;border-radius:0!important;
      transition:all .3s cubic-bezier(0.4, 0, 0.2, 1);
      line-height:1.4;
    }
    .ds-input:focus{
      border-color:rgba(52,211,153,.6)!important;
      box-shadow:0 0 0 3px rgba(52,211,153,.1)!important;
      transform:translateY(-1px);
    }
    
    /* Select dropdown styling */
    .ds-input select,
    select.ds-input{
      cursor:pointer;
      appearance:none;
      background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 12 12'%3E%3Cpath fill='%2334d399' d='M6 9L1 4h10z'/%3E%3C/svg%3E");
      background-repeat:no-repeat;
      background-position:right 10px center;
      padding-right:35px!important;
      position:relative;
    }
    select.ds-input:hover{
      border-color:rgba(52,211,153,.4)!important;
      box-shadow:0 0 0 2px rgba(52,211,153,.08)!important;
    }
    select.ds-input:focus{
      border-color:rgba(52,211,153,.6)!important;
      box-shadow:0 0 0 3px rgba(52,211,153,.15), 0 4px 12px rgba(52,211,153,.1)!important;
    }
    select.ds-input option{
      background:${C.s1};
      color:#ffffff;
      padding:12px 16px;
      font-size:13px;
      font-weight:500;
      border-bottom:1px solid ${C.bdr};
    }
    select.ds-input option:hover{
      background:${C.s2};
      color:${C.cyan};
    }
    select.ds-input option:checked{
      background:${C.cyand};
      color:${C.cyan};
      font-weight:700;
    }
    
    .ds-input::placeholder{color:rgba(255,255,255,.6)!important}
    input[type=number]::-webkit-inner-spin-button,
    input[type=number]::-webkit-outer-spin-button{
      -webkit-appearance:none;
      margin:0;
    }
    input[type=number]{
      -moz-appearance:textfield;
    }

    .ds-card{
      animation:slide-up .4s cubic-bezier(0.4, 0, 0.2, 1) both;
      transition:transform .3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow .3s ease;
    }
    .ds-card:hover{
      transform:translateY(-2px);
      box-shadow:0 8px 30px rgba(52,211,153,.08), 0 0 1px rgba(52,211,153,.3)!important;
    }

    /* hover helpers */
    .ds-btn-cyan:hover:not(:disabled){
      background:rgba(52,211,153,.15)!important;
      box-shadow:0 0 28px rgba(52,211,153,.18)!important;
      transform:translateY(-1px);
    }
    .ds-btn-coral:hover:not(:disabled){
      background:rgba(255,82,99,.15)!important;
      transform:translateY(-1px);
    }
    .ds-ghost:hover:not(:disabled){
      color:rgba(234,247,242,.85)!important;
      border-color:rgba(234,247,242,.75)!important;
      transform:translateY(-1px);
    }

    textarea.ds-input{resize:none}

    /* Smooth transitions for all buttons */
    button{
      transition:all .3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Card hover glow effect */
    .ds-card:hover .card-glow{
      opacity:1;
    }

    /* Schedule item hover effects */
    .schedule-item:hover{
      background:${C.s3}!important;
      transform:translateX(2px);
    }

    /* Quick amount button styling */
    .quick-amount-btn{
      padding:8px 12px;
      background:${C.s2};
      border:1px solid ${C.bdr};
      color:rgba(255,255,255,.8);
      font-family:var(--font-geist-sans);
      font-size:11px;
      font-weight:600;
      cursor:pointer;
      transition:all .25s cubic-bezier(0.4, 0, 0.2, 1);
      clip-path:polygon(0 0, calc(100% - 6px) 0, 100% 6px, 100% 100%, 6px 100%, 0 calc(100% - 6px));
    }
    .quick-amount-btn:hover{
      background:rgba(52,211,153,.08);
      border-color:rgba(52,211,153,.3);
      color:${C.cyan};
      transform:translateY(-1px);
      box-shadow:0 4px 12px rgba(52,211,153,.12);
    }
    .quick-amount-btn.active{
      background:rgba(52,211,153,.12);
      border-color:${C.cyan};
      color:${C.cyan};
      box-shadow:0 0 16px rgba(52,211,153,.2);
    }
  `}</style>
);

// ═══════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════

/* Skeleton Loading Component */
const Skeleton: React.FC<{
  width?:string|number; height?:string|number; 
  style?:React.CSSProperties; variant?:'shimmer'|'pulse';
}> = ({width='100%',height=20,style,variant='pulse'}) => (
  <div style={{
    width,height,
    background: variant==='shimmer' 
      ? `linear-gradient(90deg, ${C.faint} 0%, rgba(52,211,153,.08) 50%, ${C.faint} 100%)`
      : C.faint,
    backgroundSize: variant==='shimmer' ? '200% 100%' : undefined,
    animation: variant==='shimmer' ? 'shimmer 2s ease infinite' : 'skeleton-pulse 2s ease infinite',
    borderRadius:2,
    ...style,
  }}/>
);

/* Clipped corner card */
const Card: React.FC<{
  children:React.ReactNode; style?:React.CSSProperties;
  glowColor?:string; clip?:boolean; noLine?:boolean;
}> = ({children, style, glowColor, clip=true, noLine=false}) => (
  <div className="ds-card" style={{
    background:`linear-gradient(135deg, ${C.s1} 0%, ${C.s2} 100%)`,
    border:`1px solid ${C.bdr}`,
    boxShadow: glowColor 
      ? `0 4px 20px ${glowColor}08, 0 0 40px ${glowColor}10, inset 0 1px 0 ${glowColor}12` 
      : '0 2px 8px rgba(0,0,0,.2)',
    clipPath: clip
      ? 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
      : undefined,
    position:'relative', overflow:'hidden',
    transition:'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
    ...style,
  }}>
    {/* Subtle animated gradient overlay - hide if noLine */}
    {!noLine && (
      <div style={{
        position:'absolute', inset:0,
        background:`linear-gradient(135deg, transparent 0%, ${C.cyan}03 50%, transparent 100%)`,
        opacity:0,
        transition:'opacity .3s ease',
        pointerEvents:'none',
      }} className="card-glow"/>
    )}
    {children}
  </div>
);

/* Dashed section divider */
const Divider = () => (
  <div style={{
    height:1, margin:'14px 0',
    background:`repeating-linear-gradient(to right, ${C.bdr} 0, ${C.bdr} 4px, transparent 4px, transparent 10px)`,
  }}/>
);

/* Section label */
const SL: React.FC<{children:React.ReactNode; color?:string}> = ({children, color='rgba(255,255,255,.75)'}) => (
  <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:12}}>
    <div style={{width:3,height:13,background:C.cyan,opacity:.65,flexShrink:0}}/>
    <span style={{
      fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
      letterSpacing:'0.18em',textTransform:'uppercase',color,
    }}>{children}</span>
    <div style={{flex:1,height:'1px',background:`${color}25`}}/>
  </div>
);

/* Field label */
const FL: React.FC<{children:React.ReactNode}> = ({children}) => (
  <label style={{
    display:'block',fontFamily:'var(--font-exo)',fontSize:11,fontWeight:600,
    letterSpacing:'0.14em',textTransform:'uppercase',
    color:'rgba(255,255,255,.7)',marginBottom:6,
  }}>{children}</label>
);

/* Toggle */
const Toggle: React.FC<{checked:boolean;onChange:(v:boolean)=>void;disabled?:boolean}> =
({checked,onChange,disabled=false}) => (
  <label style={{display:'inline-flex',alignItems:'center',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.4:1}}>
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}
      disabled={disabled} style={{position:'absolute',opacity:0,width:0,height:0}}/>
    <div style={{
      width:48,height:24,
      background:checked?C.cyand:'rgba(255,255,255,.08)',
      border:`1px solid ${checked?C.cyan:C.bdr}`,
      borderRadius:24,
      position:'relative',transition:'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
      boxShadow:checked?`0 0 16px rgba(52,211,153,.25)`:'none',
    }}>
      <div style={{
        position:'absolute',top:2,left:checked?26:2,
        width:18,height:18,
        background:checked?C.cyan:'rgba(255,255,255,.7)',
        borderRadius:'50%',
        transition:'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow:checked?`0 0 8px ${C.cyan}, 0 2px 4px rgba(0,0,0,.2)`:'0 2px 4px rgba(0,0,0,.1)',
      }}/>
    </div>
  </label>
);

// ═══════════════════════════════════════════════════════════════
// CLOCK — full
// ═══════════════════════════════════════════════════════════════
const RealtimeClock: React.FC = () => {
  const [time,setTime] = useState<Date|null>(null);
  useEffect(()=>{setTime(new Date());const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t)},[]);
  const fmt=(d:Date)=>d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  const fmtD=(d:Date)=>d.toLocaleDateString('id-ID',{weekday:'short',day:'2-digit',month:'short'});
  const tz=()=>{if(!time)return'UTC';const o=-time.getTimezoneOffset()/60;return`UTC${o>=0?'+':''}${o}`};

  return (
    <Card glowColor={C.cyan} style={{padding:'16px 18px',height:'100%',position:'relative'}}>
      {/* Animated scanline sweep */}
      <div style={{
        position:'absolute',left:0,right:0,height:'35%',
        background:`linear-gradient(to bottom,transparent,rgba(52,211,153,.04),transparent)`,
        animation:'scanline 5s linear infinite',pointerEvents:'none',
      }}/>
      
      {/* Corner hex decoration with pulse */}
      <div style={{
        position:'absolute',top:6,right:6,width:20,height:20,
        border:`1px solid rgba(52,211,153,.25)`,
        transform:'rotate(45deg)',
        transition:'all .3s ease',
      }}/>
      
      {/* Top glow line */}
      <div style={{
        position:'absolute',top:0,left:'20%',right:'20%',height:2,
        background:`linear-gradient(90deg, transparent, ${C.cyan}80, transparent)`,
        boxShadow:`0 0 6px ${C.cyan}40`,
      }}/>

      <div style={{
        display:'flex',alignItems:'center',justifyContent:'space-between',
        marginBottom:12,position:'relative',
      }}>
        <span style={{
          fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
          letterSpacing:'0.2em',textTransform:'uppercase',
          color:'rgba(255,255,255,.85)',
          transition:'color .3s ease',
        }}>
          WAKTU LOKAL
        </span>
        <span style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{position:'relative',display:'inline-flex'}}>
            <span style={{
              width:7,height:7,background:C.coral,display:'block',
              borderRadius:'50%',boxShadow:`0 0 8px ${C.coral}`,
            }}/>
            <span style={{
              position:'absolute',inset:0,background:C.coral,
              borderRadius:'50%',
              animation:'ping 2s cubic-bezier(0,0,.2,1) infinite',
            }}/>
          </span>
          <span style={{
            fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
            letterSpacing:'0.2em',color:C.coral,
            textShadow:`0 0 10px ${C.coral}40`,
          }}>LIVE</span>
        </span>
      </div>

      <p suppressHydrationWarning style={{
        fontFamily:'var(--font-geist-sans)',fontSize:28,fontWeight:600,
        color:C.text,letterSpacing:'0.05em',lineHeight:1,position:'relative',
        textShadow:`0 0 30px rgba(52,211,153,.3), 0 0 15px rgba(52,211,153,.2)`,
        transition:'all .5s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>{time?fmt(time):'--:--:--'}</p>

      <div style={{
        display:'flex',justifyContent:'space-between',
        marginTop:10,position:'relative',
      }}>
        <span suppressHydrationWarning style={{
          fontFamily:'var(--font-exo)',fontSize:11,fontWeight:500,
          color:'rgba(255,255,255,.85)',
          transition:'color .3s ease',
        }}>
          {time?fmtD(time):''}
        </span>
        <span suppressHydrationWarning style={{
          fontFamily:'var(--font-geist-sans)',fontSize:10,
          color:`${C.cyan}dd`,
          padding:'2px 6px',
          background:`${C.cyan}08`,
          border:`1px solid ${C.cyan}15`,
        }}>
          {tz()}
        </span>
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// CLOCK — compact
// ═══════════════════════════════════════════════════════════════
const RealtimeClockCompact: React.FC = () => {
  const [time,setTime]=useState<Date|null>(null);
  useEffect(()=>{setTime(new Date());const t=setInterval(()=>setTime(new Date()),1000);return()=>clearInterval(t)},[]);
  const fmt=(d:Date)=>d.toLocaleTimeString('id-ID',{hour:'2-digit',minute:'2-digit',second:'2-digit',hour12:false});
  const tz=()=>{if(!time)return'UTC';const o=-time.getTimezoneOffset()/60;return`UTC${o>=0?'+':''}${o}`};
  return (
    <div style={{
      background:C.s1,border:`1px solid ${C.bdr}`,
      borderTop:`2px solid ${C.cyan}`,padding:'10px 12px',
      boxShadow:`0 0 16px rgba(52,211,153,.06)`,
    }}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:4}}>
        <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(255,255,255,.85)'}}>WAKTU</span>
        <span style={{position:'relative',display:'inline-flex',alignItems:'center'}}>
          <span style={{width:5,height:5,background:C.coral,borderRadius:'50%',display:'block',boxShadow:`0 0 5px ${C.coral}`}}/>
          <span style={{position:'absolute',inset:0,background:C.coral,borderRadius:'50%',animation:'ping 1.8s cubic-bezier(0,0,.2,1) infinite'}}/>
        </span>
      </div>
      <p suppressHydrationWarning style={{fontFamily:'var(--font-geist-sans)',fontSize:14,fontWeight:600,color:C.text,letterSpacing:'0.05em',lineHeight:1}}>
        {time?fmt(time):'--:--:--'}
      </p>
      <p suppressHydrationWarning style={{fontFamily:'var(--font-geist-sans)',fontSize:10,color:`${C.cyan}bb`,marginTop:4}}>{tz()}</p>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// STAT CARD
// ═══════════════════════════════════════════════════════════════
const StatCard: React.FC<{
  title:string; value:string|number; icon:React.ReactNode;
  trend?:'up'|'down'|'neutral'; isLoading?:boolean;
}> = ({title,value,icon,trend='neutral',isLoading=false}) => {
  const col = trend==='up'?C.cyan : trend==='down'?C.coral : C.muted;
  return (
    <Card style={{padding:'14px 16px',position:'relative'}}>
      {/* Animated gradient border on top */}
      <div style={{
        position:'absolute',top:0,left:'15%',right:'15%',height:2,
        background:`linear-gradient(90deg, transparent, ${col}90 50%, transparent)`,
        opacity:trend==='neutral'?0:1,
        boxShadow:trend!=='neutral'?`0 0 8px ${col}50`:undefined,
        transition:'opacity .3s ease, box-shadow .3s ease',
      }}/>
      
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{flex:1}}>
          <p style={{
            fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
            letterSpacing:'0.18em',textTransform:'uppercase',
            color:'rgba(255,255,255,.75)',marginBottom:9,
            transition:'color .3s ease',
          }}>
            {title}
          </p>
          <div style={{position:'relative',minHeight:26}}>
            {/* Always render value, control visibility with opacity */}
            <p style={{
              fontFamily:'var(--font-geist-sans)',fontSize:22,fontWeight:600,color:col,
              letterSpacing:'-0.01em',lineHeight:1,
              textShadow: trend==='up'?`0 0 20px rgba(52,211,153,.4), 0 0 10px rgba(52,211,153,.2)`
                        : trend==='down'?`0 0 20px rgba(255,71,87,.3), 0 0 10px rgba(255,71,87,.15)`:'none',
              transition:'all .3s ease',
              opacity:isLoading?0:1,
            }}>{value}</p>
            {/* Skeleton overlay */}
            {isLoading && (
              <div style={{position:'absolute',top:0,left:0}}>
                <Skeleton width={60} height={26} variant="shimmer"/>
              </div>
            )}
          </div>
        </div>
        <div style={{
          color:col,opacity:.4,marginTop:2,
          transition:'all .3s ease',
          transform:'scale(1)',
        }} className="stat-icon">{icon}</div>
      </div>
      
      {/* bottom glow strip with animation */}
      <div style={{
        position:'absolute',bottom:0,left:'15%',right:'15%',height:2,
        background:`linear-gradient(to right,transparent,${col}90 50%,transparent)`,
        opacity:trend==='neutral'?0:1,
        boxShadow:trend!=='neutral'?`0 0 6px ${col}40`:undefined,
        transition:'opacity .3s ease, box-shadow .3s ease',
      }}/>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// PROFIT CARD
// ═══════════════════════════════════════════════════════════════
const ProfitCard: React.FC<{todayProfit:number;isLoading?:boolean}> = ({todayProfit,isLoading=false}) => {
  const isPos = todayProfit>=0;
  const col = isPos?C.cyan:C.coral;
  return (
    <Card glowColor={col} style={{padding:'20px 24px',position:'relative',overflow:'visible'}}>
      {/* Animated background gradient */}
      <div style={{
        position:'absolute',inset:0,
        background:`radial-gradient(ellipse at 10% 50%,${col}10 0%,transparent 60%)`,
        pointerEvents:'none',
        transition:'all .5s ease',
      }}/>
      
      {/* Animated diagonal grid pattern */}
      <div style={{
        position:'absolute',right:0,top:0,bottom:0,width:'50%',
        backgroundImage:`repeating-linear-gradient(60deg,${col}08 0px,${col}08 1px,transparent 1px,transparent 12px)`,
        pointerEvents:'none',
        opacity:.6,
        transition:'opacity .3s ease',
      }}/>

      {/* Top glow accent */}
      <div style={{
        position:'absolute',top:0,left:'15%',right:'15%',height:2,
        background:`linear-gradient(90deg, transparent, ${col}80, transparent)`,
        boxShadow:`0 0 8px ${col}50`,
      }}/>

      <div style={{position:'relative'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <div style={{
            width:3,height:12,background:col,opacity:.7,
            transition:'all .3s ease',
          }}/>
          <span style={{
            fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
            letterSpacing:'0.25em',textTransform:'uppercase',
            color:'rgba(255,255,255,.9)',
            transition:'color .3s ease',
          }}>
            PROFIT HARI INI
          </span>
          
          {/* Live indicator */}
          <div style={{
            display:'flex',alignItems:'center',gap:4,marginLeft:'auto',
          }}>
            <span style={{position:'relative',display:'inline-flex',width:8,height:8}}>
              <span style={{
                width:8,height:8,background:col,borderRadius:'50%',
                display:'block',boxShadow:`0 0 8px ${col}`,
              }}/>
              <span style={{
                position:'absolute',inset:0,background:col,
                borderRadius:'50%',animation:'ping 2s cubic-bezier(0,0,.2,1) infinite',
              }}/>
            </span>
            <span style={{
              fontFamily:'var(--font-exo)',fontSize:9,fontWeight:700,
              letterSpacing:'0.2em',color:col,opacity:.7,
            }}>LIVE</span>
          </div>
        </div>
        
        <div style={{position:'relative',minHeight:44}}>
          {/* Always render value, control visibility with opacity */}
          <p style={{
            fontFamily:'var(--font-geist-sans)',fontWeight:600,
            fontSize:'clamp(28px,5vw,42px)',
            color:col,letterSpacing:'-0.02em',lineHeight:1.1,
            textShadow:`0 0 40px ${col}60, 0 0 20px ${col}40`,
            transition:'all .4s cubic-bezier(0.4, 0, 0.2, 1)',
            transform:'scale(1)',
            opacity:isLoading?0:1,
          }}>
            {isPos?'+':'-'}Rp {Math.abs(todayProfit).toLocaleString('id-ID')}
          </p>
          
          {/* Skeleton overlay */}
          {isLoading && (
            <div style={{position:'absolute',top:0,left:0}}>
              <Skeleton width={240} height={44} variant="shimmer"/>
            </div>
          )}
        </div>
        
        {!isLoading && (
          <>
            {/* Animated sub-indicator bar */}
            <div style={{
              marginTop:14,height:2,width:'100%',position:'relative',
              background:C.faint,overflow:'hidden',
            }}>
              <div style={{
                position:'absolute',left:0,top:0,bottom:0,
                width:isPos?'70%':'30%',
                background:`linear-gradient(to right,${col}90,${col}40)`,
                transition:'width .5s cubic-bezier(0.4, 0, 0.2, 1)',
              }}/>
            </div>
            
            {/* Profit percentage indicator */}
            <div style={{
              marginTop:10,display:'flex',alignItems:'center',gap:6,
            }}>
              <span style={{
                fontFamily:'var(--font-geist-sans)',fontSize:11,
                color:'rgba(255,255,255,.75)',
              }}>
                Status:
              </span>
              <span style={{
                fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
                letterSpacing:'0.1em',color:col,
                padding:'2px 8px',
                background:`${col}12`,
                border:`1px solid ${col}25`,
                transition:'all .3s ease',
              }}>
                {isPos ? 'PROFIT' : 'LOSS'}
              </span>
            </div>
          </>
        )}
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCHEDULE PANEL — with active highlight + auto-scroll
// ═══════════════════════════════════════════════════════════════

/** Returns index of the next upcoming schedule from current time */
function getActiveScheduleIndex(schedules:{time:string;trend:'buy'|'sell'}[]): number {
  if (!schedules.length) return -1;
  const now = new Date();
  const nowMin = now.getHours() * 60 + now.getMinutes();

  let closestIdx = -1;
  let closestDiff = Infinity;

  schedules.forEach((s, i) => {
    const [h, m] = s.time.split(':').map(Number);
    let diff = (h * 60 + m) - nowMin;
    if (diff < 0) diff += 24 * 60; // sudah lewat hari ini → wrap ke esok
    if (diff < closestDiff) {
      closestDiff = diff;
      closestIdx = i;
    }
  });

  return closestIdx;
}

const SchedulePanel: React.FC<{
  schedules:{time:string;trend:'buy'|'sell'}[];
  executions?:{scheduledTime:string;result:'win'|'loss'|'draw'}[];
  onOpenModal:()=>void; isDisabled?:boolean; maxCount?:number; fillHeight?:boolean; tabletMaxItems?:number;
}> = ({schedules,executions=[],onOpenModal,isDisabled=false,maxCount=50,fillHeight=false,tabletMaxItems}) => {
  const listRef = React.useRef<HTMLDivElement>(null);
  const itemRefs = React.useRef<(HTMLDivElement|null)[]>([]);
  const [activeIdx, setActiveIdx] = React.useState<number>(-1);

  // Update active index every 10 s
  React.useEffect(() => {
    const update = () => setActiveIdx(getActiveScheduleIndex(schedules));
    update();
    const t = setInterval(update, 10_000);
    return () => clearInterval(t);
  }, [schedules]);

  // Auto-scroll whenever active index changes
  React.useEffect(() => {
    if (activeIdx < 0) return;
    const el = itemRefs.current[activeIdx];
    const container = listRef.current;
    if (!el || !container) return;
    // Scroll item into center of the scrollable container
    const elTop = el.offsetTop;
    const elH = el.offsetHeight;
    const cH = container.clientHeight;
    container.scrollTo({ top: elTop - cH / 2 + elH / 2, behavior: 'smooth' });
  }, [activeIdx]);

  return (
  <Card style={{display:'flex',flexDirection:'column',height: fillHeight ? '100%' : undefined, flex: fillHeight ? 1 : undefined}}>
    <div style={{
      display:'flex',alignItems:'center',justifyContent:'space-between',
      padding:'12px 14px',borderBottom:`1px solid ${C.faint}`,
    }}>
      <div style={{display:'flex',alignItems:'center',gap:7}}>
        <div style={{width:3,height:13,background:C.cyan,opacity:.6}}/>
        <span style={{
          fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
          letterSpacing:'0.18em',textTransform:'uppercase',
          color:'rgba(255,255,255,.9)',
        }}>JADWAL</span>
      </div>
      {/* Active badge */}
      {schedules.length > 0 && activeIdx >= 0 && (
        <span style={{
          display:'flex',alignItems:'center',gap:4,
          fontFamily:'var(--font-exo)',fontSize:9,fontWeight:700,
          letterSpacing:'0.16em',color:C.cyan,
          padding:'2px 7px',
          background:'rgba(52,211,153,0.08)',
          border:'1px solid rgba(52,211,153,0.25)',
          flexShrink:0,
        }}>
          <span style={{
            width:5,height:5,borderRadius:'50%',background:C.cyan,
            boxShadow:`0 0 6px ${C.cyan}`,
            animation:'pulse 1.5s ease infinite',display:'inline-block',
            flexShrink:0,
          }}/>
          <span className="badge-text-hide-mobile">BERIKUTNYA</span>
        </span>
      )}
    </div>

    {schedules.length===0 ? (
      <div style={{
        flex:1,display:'flex',flexDirection:'column',
        alignItems:'center',justifyContent:'center',padding:20,gap:10,
      }}>
        <Calendar style={{width:32,height:32,color:'rgba(255,255,255,.2)',strokeWidth:1.5}}/>
        <p style={{
          fontFamily:'var(--font-exo)',fontSize:12,fontWeight:500,
          color:'rgba(255,255,255,.65)',textAlign:'center',
        }}>Belum ada jadwal</p>
      </div>
    ) : (
      <div ref={listRef} style={{flex:1,overflowY:'auto',maxHeight: tabletMaxItems ? tabletMaxItems * 37 : fillHeight ? 'none' : 200}}>
        {schedules.map((s,i)=>{
          const isActive = i === activeIdx;
          const isBuy = s.trend === 'buy';
          const col = isBuy ? C.cyan : C.coral;
          // Find most recent execution result for this time slot (today)
          const execResult = executions.filter(e=>e.scheduledTime===s.time).slice(-1)[0]?.result;
          return (
            <div
              key={i}
              ref={el => { itemRefs.current[i] = el; }}
              style={{
                display:'flex',alignItems:'center',gap:8,
                padding: isActive ? '9px 12px' : '8px 12px',
                borderBottom:`1px solid ${C.faint}`,
                background: isActive
                  ? (isBuy ? 'rgba(52,211,153,0.07)' : 'rgba(255,82,99,0.07)')
                  : (i%2===0 ? C.s2 : 'transparent'),
                borderLeft: isActive ? `2px solid ${col}` : '2px solid transparent',
                transition:'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
                animation: isActive
                  ? `slide-up .3s ease both ${i*.05}s, ${isBuy ? 'active-pulse-buy' : 'active-pulse-sell'} 2s ease infinite`
                  : `slide-up .3s ease both ${i*.05}s`,
                cursor:'default',
                position:'relative',
              }}
              className="schedule-item">

              {/* Active shimmer sweep */}
              {isActive && (
                <div style={{
                  position:'absolute',inset:0,pointerEvents:'none',overflow:'hidden',
                }}>
                  <div style={{
                    position:'absolute',top:0,bottom:0,width:'40%',
                    background:`linear-gradient(to right, transparent, ${col}10, transparent)`,
                    animation:'shimmer 2.5s ease infinite',
                  }}/>
                </div>
              )}

              {/* Row number / active arrow */}
              <span style={{
                fontFamily:'var(--font-geist-sans)',fontSize:10,
                color: isActive ? col : 'rgba(255,255,255,.7)',
                width:18,textAlign:'right',flexShrink:0,
                fontWeight: isActive ? 700 : 400,
                textShadow: isActive ? `0 0 8px ${col}80` : 'none',
              }}>
                {isActive ? '▶' : String(i+1).padStart(2,'0')}
              </span>

              <span style={{
                fontFamily:'var(--font-geist-sans)',fontSize:13,fontWeight: isActive ? 700 : 500,
                color: isActive ? C.text : 'rgba(255,255,255,0.85)',
                flex:1,
                textShadow: isActive ? `0 0 12px ${col}40` : 'none',
                transition:'all .3s ease',
              }}>
                {s.time}
              </span>

              <span style={{
                fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
                letterSpacing:'0.12em',textTransform:'uppercase',
                color: col,
                padding:'3px 8px',
                background: isActive
                  ? (isBuy ? 'rgba(52,211,153,0.18)' : 'rgba(255,82,99,0.18)')
                  : (isBuy ? C.cyand : C.cord),
                border:`1px solid ${col}${isActive ? '60' : '20'}`,
                boxShadow: isActive ? `0 0 10px ${col}30` : 'none',
                transition:'all .3s ease',
                animation: isActive
                  ? `${isBuy ? 'glow-border-buy' : 'glow-border-sell'} 1.8s ease infinite`
                  : undefined,
                display: execResult && !isActive ? 'none' : undefined,
              }}>
                {s.trend}
              </span>

              {/* Result badge — teks saja, tanpa kotak */}
              {execResult && !isActive && (
                <span style={{
                  fontFamily:'var(--font-exo)',fontSize:10,fontWeight:700,
                  letterSpacing:'0.12em',textTransform:'uppercase',
                  color: execResult==='win' ? C.cyan : execResult==='loss' ? C.coral : 'rgba(255,255,255,0.4)',
                  flexShrink:0,
                }}>
                  {execResult==='win' ? 'WIN' : execResult==='loss' ? 'LOSE' : 'DRAW'}
                </span>
              )}

              {/* NEXT indicator */}
              {isActive && (
                <span style={{
                  fontFamily:'var(--font-exo)',fontSize:8,fontWeight:800,
                  letterSpacing:'0.16em',
                  color:col,padding:'2px 5px',
                  background:`${col}12`,border:`1px solid ${col}30`,
                  animation:`${isBuy ? 'glow-border-buy' : 'glow-border-sell'} 1.8s ease infinite`,
                  whiteSpace:'nowrap',
                }}>
                  NEXT
                </span>
              )}
            </div>
          );
        })}
      </div>
    )}

    <div style={{padding:'8px 10px',borderTop:`1px solid ${C.faint}`}}>
      <button onClick={onOpenModal} disabled={isDisabled}
        className="ds-btn-cyan"
        style={{
          width:'100%',padding:'10px',
          background:'transparent',border:`1px solid rgba(52,211,153,.25)`,color:C.cyan,
          fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
          letterSpacing:'0.18em',textTransform:'uppercase',
          cursor:isDisabled?'not-allowed':'pointer',
          opacity:isDisabled?.3:1,
          display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          transition:'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
          clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',
        }}>
        <Plus style={{width:12,height:12}}/>
        {schedules.length===0?'TAMBAH':'KELOLA'}
      </button>
    </div>
  </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// BULK SCHEDULE MODAL
// ═══════════════════════════════════════════════════════════════
const BulkScheduleModal: React.FC<{
  isOpen:boolean; onClose:()=>void;
  schedules:{time:string;trend:'buy'|'sell'}[];
  onAddSchedules:(s:{time:string;trend:'buy'|'sell'}[])=>void;
  onRemoveSchedule:(i:number)=>void;
  onClearAll:()=>void; maxCount?:number;
}> = ({isOpen,onClose,schedules,onAddSchedules,onRemoveSchedule,onClearAll,maxCount=50}) => {
  const [input,setInput]=useState('');
  const [error,setError]=useState('');
  if(!isOpen)return null;

  const parseTime=(s:string):string|null=>{
    s=s.trim();
    let m=s.match(/^(\d{1,2})[:.] ?(\d{1,2})$/);
    if(m){const h=+m[1],min=+m[2];if(h<=23&&min<=59)return`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`}
    m=s.match(/^(\d{3,4})$/);
    if(m){const ns=m[1].padStart(4,'0'),h=+ns.slice(0,2),min=+ns.slice(2);if(h<=23&&min<=59)return`${String(h).padStart(2,'0')}:${String(min).padStart(2,'0')}`}
    return null;
  };
  const parseTrend=(s:string):'buy'|'sell'|null=>{
    const n=s.toLowerCase().trim();
    if(n==='buy'||n==='b')return'buy';if(n==='sell'||n==='s')return'sell';return null;
  };
  const handleAdd=()=>{
    setError('');if(!input.trim()){setError('Input kosong');return}
    const result:{time:string;trend:'buy'|'sell'}[]=[],errs:string[]=[];
    input.trim().split('\n').forEach((line,i)=>{
      const parts=line.trim().split(/[\s,\t\-]+/).filter(Boolean);
      if(!parts.length)return;
      if(parts.length<2){errs.push(`Baris ${i+1}: format tidak lengkap`);return}
      const time=parseTime(parts[0]);if(!time){errs.push(`Baris ${i+1}: waktu salah "${parts[0]}"`);return}
      const trend=parseTrend(parts[1]);if(!trend){errs.push(`Baris ${i+1}: trend salah "${parts[1]}"`);return}
      if(result.some(r=>r.time===time)||schedules.some(r=>r.time===time)){errs.push(`Baris ${i+1}: ${time} sudah ada`);return}
      result.push({time,trend});
    });
    if(errs.length){setError(errs.join('\n'));return}
    if(!result.length){setError('Tidak ada jadwal valid');return}
    onAddSchedules(result);setInput('');
  };

  return (
    <div style={{
      position:'fixed',inset:0,zIndex:50,
      display:'flex',alignItems:'flex-end',justifyContent:'center',
      padding:16,paddingBottom:88,
      animation:'fade-in .2s ease',
    }}>
      <div style={{
        position:'absolute',inset:0,
        background:'rgba(3,11,18,.92)',
        backdropFilter:'blur(12px)',
      }} onClick={onClose}/>
      
      <div style={{
        position:'relative',width:'100%',maxWidth:500,
        background:`linear-gradient(135deg, ${C.s1} 0%, ${C.s2} 100%)`,
        border:`1px solid ${C.bdr}`,
        borderTop:`2px solid ${C.cyan}`,
        display:'flex',flexDirection:'column',maxHeight:'calc(100vh - 104px)',
        clipPath:'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%)',
        boxShadow:`
          0 -20px 80px rgba(52,211,153,.12),
          0 -10px 40px rgba(52,211,153,.08),
          0 0 0 1px rgba(52,211,153,.1)
        `,
        animation:'slide-up .3s cubic-bezier(0.4, 0, 0.2, 1)',
      }}>
        {/* Top glow accent */}
        <div style={{
          position:'absolute',top:0,left:'20%',right:'20%',height:2,
          background:`linear-gradient(90deg, transparent, ${C.cyan}90, transparent)`,
          boxShadow:`0 0 8px ${C.cyan}60`,
        }}/>
        
        {/* Header */}
        <div style={{
          display:'flex',alignItems:'center',justifyContent:'space-between',
          padding:'16px 18px',
          borderBottom:`1px solid ${C.faint}`,
          background:`linear-gradient(180deg, ${C.s2} 0%, transparent 100%)`,
        }}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:5}}>
              <div style={{
                width:3,height:16,background:C.cyan,opacity:.7,
                boxShadow:`0 0 8px ${C.cyan}60`,
              }}/>
              <h2 style={{
                fontFamily:'var(--font-exo)',fontSize:16,fontWeight:800,
                letterSpacing:'0.08em',textTransform:'uppercase',
                color:C.text,
                textShadow:`0 0 20px rgba(52,211,153,.2)`,
              }}>INPUT JADWAL</h2>
            </div>
            <p style={{
              fontFamily:'var(--font-geist-sans)',fontSize:10,
              color:'rgba(255,255,255,.75)',paddingLeft:11,
            }}>
              Format: <span style={{color:C.cyan,fontWeight:600}}>09:30 buy</span> · satu per baris
            </p>
          </div>
          <button onClick={onClose} style={{
            width:32,height:32,
            background:`${C.faint}`,
            border:`1px solid ${C.bdr}`,
            color:C.muted,
            cursor:'pointer',
            display:'flex',alignItems:'center',justifyContent:'center',
            transition:'all .25s cubic-bezier(0.4, 0, 0.2, 1)',
            clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = C.cord;
            e.currentTarget.style.borderColor = `${C.coral}40`;
            e.currentTarget.style.color = C.coral;
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = C.faint;
            e.currentTarget.style.borderColor = C.bdr;
            e.currentTarget.style.color = C.muted;
          }}>
            <X style={{width:14,height:14}}/>
          </button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'16px 18px'}}>
          {schedules.length>0&&(
            <div style={{marginBottom:16}}>
              <div style={{
                display:'flex',justifyContent:'space-between',alignItems:'center',
                marginBottom:8,
              }}>
                <span style={{
                  fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,
                  letterSpacing:'0.12em',textTransform:'uppercase',
                  color:'rgba(255,255,255,.85)',
                }}>
                  {schedules.length} Jadwal Aktif
                </span>
                <button 
                  onClick={()=>window.confirm('Hapus semua jadwal?')&&onClearAll()} 
                  style={{
                    display:'flex',alignItems:'center',gap:5,
                    fontFamily:'var(--font-geist-sans)',fontSize:10,fontWeight:600,
                    color:`${C.coral}bb`,
                    background:'transparent',
                    border:`1px solid ${C.coral}25`,
                    padding:'4px 10px',
                    cursor:'pointer',
                    transition:'all .25s cubic-bezier(0.4, 0, 0.2, 1)',
                    clipPath:'polygon(0 0,calc(100% - 4px) 0,100% 4px,100% 100%,4px 100%,0 calc(100% - 4px))',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.background = C.cord;
                    e.currentTarget.style.borderColor = `${C.coral}50`;
                    e.currentTarget.style.color = C.coral;
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.background = 'transparent';
                    e.currentTarget.style.borderColor = `${C.coral}25`;
                    e.currentTarget.style.color = `${C.coral}bb`;
                  }}>
                  <Trash2 style={{width:11,height:11}}/> Hapus semua
                </button>
              </div>
              <div style={{
                maxHeight:140,overflowY:'auto',
                border:`1px solid ${C.bdr}`,
                background:C.s2,
              }}>
                {schedules.map((s,i)=>(
                  <div key={i} style={{
                    display:'flex',alignItems:'center',gap:10,
                    padding:'8px 12px',
                    background:i%2===0?C.s3:'transparent',
                    borderBottom:i<schedules.length-1?`1px solid ${C.faint}`:'none',
                    transition:'all .2s ease',
                  }}
                  className="schedule-item">
                    <span style={{
                      fontFamily:'var(--font-geist-sans)',fontSize:10,
                      color:'rgba(255,255,255,.75)',
                      width:20,textAlign:'right',
                    }}>
                      {String(i+1).padStart(2,'0')}
                    </span>
                    <span style={{
                      fontFamily:'var(--font-geist-sans)',fontSize:13,fontWeight:600,
                      color:C.text,flex:1,
                    }}>
                      {s.time}
                    </span>
                    <span style={{
                      fontFamily:'var(--font-exo)',fontSize:10,fontWeight:700,
                      letterSpacing:'0.12em',
                      color:s.trend==='buy'?C.cyan:C.coral,
                      padding:'3px 8px',
                      background:s.trend==='buy'?C.cyand:C.cord,
                      border:`1px solid ${s.trend==='buy'?`${C.cyan}25`:`${C.coral}25`}`,
                    }}>
                      {s.trend.toUpperCase()}
                    </span>
                    <button 
                      onClick={()=>onRemoveSchedule(i)} 
                      style={{
                        background:'none',
                        border:`1px solid transparent`,
                        cursor:'pointer',
                        color:'rgba(255,255,255,.5)',
                        padding:4,
                        display:'flex',
                        alignItems:'center',
                        justifyContent:'center',
                        transition:'all .2s ease',
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.color = C.coral;
                        e.currentTarget.style.borderColor = `${C.coral}30`;
                        e.currentTarget.style.background = `${C.coral}08`;
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.color = 'rgba(255,255,255,.5)';
                        e.currentTarget.style.borderColor = 'transparent';
                        e.currentTarget.style.background = 'none';
                      }}>
                      <X style={{width:13,height:13}}/>
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{marginBottom:10}}>
            <p style={{
              fontFamily:'var(--font-geist-sans)',fontSize:10,
              color:'rgba(255,255,255,.7)',marginBottom:8,
              padding:'6px 10px',
              background:`${C.faint}`,
              border:`1px solid ${C.bdr}`,
            }}>
              Contoh: <span style={{color:C.cyan,fontWeight:600}}>09:30 buy</span>{' • '}
              <span style={{color:'rgba(255,255,255,.9)'}}>14:15 s</span>{' • '}
              <span style={{color:'rgba(255,255,255,.9)'}}>1600 sell</span>
            </p>
            <textarea className="ds-input" value={input} onChange={e=>setInput(e.target.value)}
              placeholder={"09:00 buy\n09:30 sell\n1000 b\n14:15 buy"} rows={7}
              style={{fontFamily:'var(--font-geist-sans)',fontSize:12}}/>
          </div>
          {error&&(
            <div style={{
              display:'flex',gap:8,padding:'11px 13px',
              background:C.cord,
              border:`1px solid rgba(255,71,87,.25)`,
              borderLeft:`3px solid ${C.coral}`,
              animation:'slide-up .2s ease',
            }}>
              <AlertCircle style={{width:14,height:14,color:C.coral,flexShrink:0,marginTop:1}}/>
              <p style={{
                fontFamily:'var(--font-geist-sans)',fontSize:11,
                color:'#ff8a94',whiteSpace:'pre-line',lineHeight:1.5,
              }}>{error}</p>
            </div>
          )}
        </div>

        <div style={{
          display:'flex',gap:10,padding:'14px 18px',
          borderTop:`1px solid ${C.faint}`,
          background:`linear-gradient(0deg, ${C.s2} 0%, transparent 100%)`,
        }}>
          <button onClick={handleAdd} disabled={!input.trim()}
            className="ds-btn-cyan"
            style={{
              flex:1,padding:'12px',
              background:!input.trim()?C.faint:C.cyand,
              border:`1px solid ${!input.trim()?C.bdr:'rgba(52,211,153,.35)'}`,
              color:!input.trim()?'rgba(255,255,255,.4)':C.cyan,
              fontFamily:'var(--font-exo)',fontSize:12,fontWeight:700,
              letterSpacing:'0.18em',textTransform:'uppercase',
              cursor:!input.trim()?'not-allowed':'pointer',
              opacity:!input.trim()?.5:1,
              transition:'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
              clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',
              boxShadow:!input.trim()?'none':`0 0 20px ${C.cyan}10`,
            }}>
            <Plus style={{width:13,height:13,display:'inline',marginRight:6,verticalAlign:'middle'}}/>
            TAMBAH
          </button>
          <button onClick={onClose} className="ds-ghost" style={{
            padding:'12px 24px',
            background:'transparent',
            border:`1px solid ${C.bdr}`,
            color:'rgba(255,255,255,.8)',
            fontFamily:'var(--font-exo)',fontSize:12,fontWeight:600,
            letterSpacing:'0.15em',textTransform:'uppercase',
            cursor:'pointer',
            transition:'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
            clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))',
          }}>TUTUP</button>
        </div>
      </div>
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════
// ORDER SETTINGS CARD
// ═══════════════════════════════════════════════════════════════
const DURATIONS=[
  {value:'60',label:'1 Menit'},{value:'120',label:'2 Menit'},
  {value:'300',label:'5 Menit'},{value:'600',label:'10 Menit'},
  {value:'900',label:'15 Menit'},{value:'1800',label:'30 Menit'},
  {value:'3600',label:'1 Jam'},
];

const OrderSettingsCard: React.FC<{
  settings:OrderSettings; onChange:(s:OrderSettings)=>void;
  isDisabled?:boolean; assets?:any[]; onAssetSelect?:(a:any)=>void;
}> = ({settings,onChange,isDisabled=false,assets=[],onAssetSelect}) => {
  const [open,setOpen]=useState(true);
  const [mg,setMg]=useState(settings.martingaleSetting.maxStep>0);
  useEffect(()=>setMg(settings.martingaleSetting.maxStep>0),[settings.martingaleSetting.maxStep]);
  const set=(k:keyof OrderSettings,v:any)=>onChange({...settings,[k]:v});
  const nest=(p:keyof OrderSettings,k:string,v:any)=>onChange({...settings,[p]:{...(settings[p] as any),[k]:v}});
  const toggleMg=(v:boolean)=>{setMg(v);onChange({...settings,martingaleSetting:v?{maxStep:3,multiplier:2}:{maxStep:0,multiplier:1}})};

  return (
    <Card style={{opacity:isDisabled?.65:1}}>
      <button onClick={()=>setOpen(!open)} style={{
        width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'13px 16px',background:'none',border:'none',cursor:'pointer',
        borderBottom:open?`1px solid ${C.faint}`:'none',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Settings style={{width:14,height:14,color:`${C.cyan}55`}}/>
          <span style={{fontFamily:'var(--font-exo)',fontSize:14,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:C.text}}>
            PENGATURAN ORDER
          </span>
          {settings.assetSymbol&&(
            <span style={{fontFamily:'var(--font-geist-sans)',fontSize:10,color:C.cyan,background:C.cyand,border:`1px solid rgba(52,211,153,.2)`,padding:'2px 8px'}}>
              {settings.assetSymbol}
            </span>
          )}
        </div>
        {open?<ChevronUp style={{width:14,height:14,color:C.muted}}/>
             :<ChevronDown style={{width:14,height:14,color:C.muted}}/>}
      </button>

      {open&&(
        <div style={{padding:'14px 16px',pointerEvents:isDisabled?'none':undefined}}>
          <SL>Pengaturan Dasar</SL>
          <div style={{marginBottom:10}}>
            <FL>Aset Trading</FL>
            <div style={{position:'relative'}}>
              <select className="ds-input" value={settings.assetSymbol} onChange={e=>{
                const a=assets.find((x:any)=>x.symbol===e.target.value);
                if(a){onChange({...settings,assetSymbol:a.symbol,assetName:a.name||a.symbol});onAssetSelect?.(a);}
              }} disabled={isDisabled}>
                <option value="">Pilih aset trading</option>
                {assets.map((a:any)=><option key={a.id} value={a.symbol}>{a.name||a.symbol}</option>)}
              </select>
              {/* Dropdown indicator overlay */}
              <div style={{
                position:'absolute',
                right:12,top:'50%',
                transform:'translateY(-50%)',
                pointerEvents:'none',
                display:'flex',
                alignItems:'center',
                gap:4,
              }}>
                <div style={{
                  width:1,height:16,
                  background:C.bdr,
                }}/>
              </div>
            </div>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <FL>Tipe Akun</FL>
              <div style={{position:'relative'}}>
                <select className="ds-input" value={settings.accountType} onChange={e=>set('accountType',e.target.value)} disabled={isDisabled}>
                  <option value="demo">Demo</option>
                  <option value="real">Real</option>
                </select>
                <div style={{
                  position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                  pointerEvents:'none',display:'flex',alignItems:'center',gap:4,
                }}>
                  <div style={{width:1,height:16,background:C.bdr}}/>
                </div>
              </div>
            </div>
            <div>
              <FL>Timeframe</FL>
              <div style={{position:'relative'}}>
                <select className="ds-input" value={settings.duration.toString()} onChange={e=>set('duration',+e.target.value)} disabled={isDisabled}>
                  {DURATIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <div style={{
                  position:'absolute',right:12,top:'50%',transform:'translateY(-50%)',
                  pointerEvents:'none',display:'flex',alignItems:'center',gap:4,
                }}>
                  <div style={{width:1,height:16,background:C.bdr}}/>
                </div>
              </div>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <FL>Jumlah per Order</FL>
            <div style={{position:'relative',marginBottom:8}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontFamily:'var(--font-geist-sans)',fontSize:11,color:'rgba(255,255,255,.75)',zIndex:1,pointerEvents:'none'}}>Rp</span>
              <input type="number" className="ds-input" value={settings.amount}
                onChange={e=>set('amount',+e.target.value||0)} disabled={isDisabled}
                min="1000" step="1000" style={{paddingLeft:36}}/>
            </div>
            {/* Quick Amount Buttons */}
            <div style={{display:'grid',gridTemplateColumns:'repeat(4,1fr)',gap:6}}>
              {[10000, 25000, 50000, 100000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => set('amount', amt)}
                  disabled={isDisabled}
                  className={`quick-amount-btn ${settings.amount === amt ? 'active' : ''}`}
                >
                  {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                </button>
              ))}
            </div>
            <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:6,marginTop:6}}>
              {[250000, 500000, 1000000].map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => set('amount', amt)}
                  disabled={isDisabled}
                  className={`quick-amount-btn ${settings.amount === amt ? 'active' : ''}`}
                >
                  {amt >= 1000000 ? `${amt / 1000000}M` : `${amt / 1000}K`}
                </button>
              ))}
                          </div>
          </div>

          <Divider/>
          <SL color="rgba(52,211,153,.45)">Strategi Martingale</SL>
          <div style={{background:C.s2,border:`1px solid ${C.faint}`,padding:'12px',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <p style={{fontFamily:'var(--font-exo)',fontSize:13,fontWeight:600,color:C.muted}}>Martingale</p>
                <p style={{fontFamily:'var(--font-exo)',fontSize:12,color:'rgba(255,255,255,.75)',marginTop:3}}>Gandakan amount setelah loss</p>
              </div>
              <Toggle checked={mg} onChange={toggleMg} disabled={isDisabled}/>
            </div>
            {mg&&(
              <div style={{marginTop:12,paddingTop:12,borderTop:`1px solid ${C.faint}`,display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div><FL>Max Step</FL><input type="number" className="ds-input" min="1" max="10" value={settings.martingaleSetting.maxStep} onChange={e=>nest('martingaleSetting','maxStep',+e.target.value||0)} disabled={isDisabled}/></div>
                <div><FL>Multiplier</FL><input type="number" className="ds-input" min="1" max="5" step="0.1" value={settings.martingaleSetting.multiplier} onChange={e=>nest('martingaleSetting','multiplier',+e.target.value||1)} disabled={isDisabled}/></div>
              </div>
            )}
          </div>

          <Divider/>
          <SL color="rgba(52,211,153,.35)">Risk Management</SL>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
            <div><FL>Stop Loss</FL>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontFamily:'var(--font-geist-sans)',fontSize:10,color:'rgba(255,255,255,.8)',zIndex:1,pointerEvents:'none'}}>Rp</span>
                <input type="number" className="ds-input" value={settings.stopLossProfit.stopLoss||''} onChange={e=>nest('stopLossProfit','stopLoss',e.target.value?+e.target.value:undefined)} disabled={isDisabled} placeholder="Opsional" style={{paddingLeft:32}}/>
              </div>
            </div>
            <div><FL>Take Profit</FL>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontFamily:'var(--font-geist-sans)',fontSize:10,color:'rgba(255,255,255,.8)',zIndex:1,pointerEvents:'none'}}>Rp</span>
                <input type="number" className="ds-input" value={settings.stopLossProfit.stopProfit||''} onChange={e=>nest('stopLossProfit','stopProfit',e.target.value?+e.target.value:undefined)} disabled={isDisabled} placeholder="Opsional" style={{paddingLeft:32}}/>
              </div>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// BOT CONTROL CARD
// ═══════════════════════════════════════════════════════════════
const BotControlCard: React.FC<{
  status:BotStatus; onStart:()=>void; onPause:()=>void; onStop:()=>void;
  isLoading?:boolean; canStart?:boolean; errorMessage?:string;
}> = ({status,onStart,onPause,onStop,isLoading=false,canStart=false,errorMessage}) => {
  const [open,setOpen]=useState(true);
  const running=status.isRunning&&!status.isPaused;
  const si=running
    ?{label:'AKTIF',    col:C.cyan, dim:C.cyand}
    :status.isPaused
    ?{label:'DIJEDA',   col:'#6ee7b7', dim:'rgba(110,231,183,.08)'}
    :{label:'NONAKTIF', col:'rgba(255,255,255,.75)', dim:C.faint};

  const BBtn:React.FC<{onClick:()=>void;disabled?:boolean;accent:string;icon:React.ReactNode;label:string;cls:string}>=
  ({onClick,disabled,accent,icon,label,cls})=>(
    <button onClick={onClick} disabled={disabled||isLoading} className={cls} style={{
      width:'100%',padding:'11px',
      background:`${accent}0d`,border:`1px solid ${accent}38`,color:accent,
      fontFamily:'var(--font-exo)',fontSize:12,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',
      cursor:(disabled||isLoading)?'not-allowed':'pointer',
      opacity:disabled?.35:1,transition:'all .15s',
      display:'flex',alignItems:'center',justifyContent:'center',gap:8,
      clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',
    }}>
      {isLoading?<><RefreshCw style={{width:13,height:13,animation:'spin 1s linear infinite'}}/> PROSES...</>
               :<>{icon}{label}</>}
    </button>
  );

  return (
    <Card glowColor={running?C.cyan:undefined} style={{
      borderTopWidth:running?2:1,
      borderTopColor:running?C.cyan:C.bdr,
    }}>
      <button onClick={()=>setOpen(!open)} style={{
        width:'100%',display:'flex',alignItems:'center',justifyContent:'space-between',
        padding:'13px 16px',background:'none',border:'none',cursor:'pointer',
        borderBottom:open?`1px solid ${C.faint}`:'none',
      }}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <Zap style={{width:14,height:14,color:`${C.cyan}55`}}/>
          <span style={{fontFamily:'var(--font-exo)',fontSize:14,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:C.text}}>KONTROL BOT</span>
        </div>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <span style={{display:'flex',alignItems:'center',gap:6,fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.18em',color:si.col}}>
            <span style={{position:'relative',display:'inline-flex',alignItems:'center',justifyContent:'center',width:10,height:10}}>
              <span style={{width:6,height:6,background:si.col,display:'block',borderRadius:'50%',boxShadow:running?`0 0 6px ${C.cyan}`:'none'}}/>
              {running&&<span style={{position:'absolute',inset:0,background:C.cyan,borderRadius:'50%',animation:'ping 1.8s cubic-bezier(0,0,.2,1) infinite'}}/>}
            </span>
            {si.label}
          </span>
          {open?<ChevronUp style={{width:13,height:13,color:C.muted}}/>:<ChevronDown style={{width:13,height:13,color:C.muted}}/>}
        </div>
      </button>

      {open&&(
        <div style={{padding:'14px 16px'}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8,marginBottom:10}}>
            {[
              {l:'JADWAL AKTIF',v:status.activeSchedules,c:C.text},
              {l:'PROFIT SESI',v:(status.currentProfit>=0?'+':'')+status.currentProfit.toLocaleString('id-ID'),c:status.currentProfit>=0?C.cyan:C.coral},
            ].map(s=>(
              <div key={s.l} style={{background:C.s2,padding:'10px 12px',clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,0 100%)'}}>
                <p style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(255,255,255,.85)'}}>{s.l}</p>
                <p style={{fontFamily:'var(--font-geist-sans)',fontSize:20,fontWeight:600,color:s.c,marginTop:5,lineHeight:1}}>{s.v}</p>
              </div>
            ))}
          </div>

          {status.nextExecutionTime&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:C.s2,marginBottom:10,borderLeft:`2px solid rgba(110,231,183,.35)`}}>
              <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:600,letterSpacing:'0.15em',color:'rgba(255,255,255,.85)'}}>BERIKUTNYA</span>
              <span style={{fontFamily:'var(--font-geist-sans)',fontSize:13,fontWeight:600,color:'#6ee7b7'}}>{status.nextExecutionTime}</span>
            </div>
          )}

          {errorMessage&&(
            <div style={{display:'flex',gap:8,padding:'10px 12px',marginBottom:10,background:C.cord,border:`1px solid rgba(255,71,87,.2)`,borderLeft:`2px solid ${C.coral}`}}>
              <AlertCircle style={{width:12,height:12,color:C.coral,flexShrink:0,marginTop:1}}/>
              <p style={{fontFamily:'var(--font-geist-sans)',fontSize:11,color:'#ff8a94'}}>{errorMessage}</p>
            </div>
          )}

          <div style={{display:'flex',flexDirection:'row',gap:6}}>
            {!status.isRunning&&(
              <BBtn onClick={onStart} disabled={isLoading||!canStart} accent={C.cyan}
                icon={<Play style={{width:13,height:13}}/>}
                label={status.isPaused?'LANJUTKAN BOT':'MULAI BOT'} cls="ds-btn-cyan"/>
            )}
            {status.isRunning&&!status.isPaused&&(
              <BBtn onClick={onPause} disabled={isLoading} accent="#6ee7b7"
                icon={<Pause style={{width:13,height:13}}/>} label="JEDA BOT" cls="ds-btn-cyan"/>
            )}
            {status.isRunning&&(
              <BBtn onClick={onStop} disabled={isLoading} accent={C.coral}
                icon={<Square style={{width:13,height:13}}/>} label="HENTIKAN BOT" cls="ds-btn-coral"/>
            )}
          </div>

          {!canStart&&!errorMessage&&(
            <div style={{display:'flex',gap:8,padding:'10px 12px',marginTop:8,background:C.faint,border:`1px solid ${C.bdr}`}}>
              <Info style={{width:13,height:13,color:'rgba(255,255,255,.65)',flexShrink:0,marginTop:1}}/>
              <p style={{fontFamily:'var(--font-exo)',fontSize:12,fontWeight:500,color:'rgba(255,255,255,.75)',lineHeight:1.6}}>
                Lengkapi pengaturan dan tambahkan jadwal untuk memulai bot
              </p>
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// PAGE
// ═══════════════════════════════════════════════════════════════
export default function DashboardPage() {
  const router=useRouter();
  const {isAuthenticated,hasHydrated}=useAuthStore();
  const clearAuth=useAuthStore(s=>s.clearAuth);
  const [isLoading,setIsLoading]=useState(true);
  const [error,setError]=useState<string|null>(null);
  const [activeSchedule,setActiveSchedule]=useState<any>(null);
  const [assets,setAssets]=useState<any[]>([]);
  const [isModalOpen,setIsModalOpen]=useState(false);
  const [isActionLoad,setIsActionLoad]=useState(false);
  const [settings,setSettings]=useState<OrderSettings>({
    assetSymbol:'',assetName:'',accountType:'demo',duration:60,amount:10000,
    schedules:[],martingaleSetting:{maxStep:0,multiplier:2},stopLossProfit:{},
  });
  const [botStatus,setBotStatus]=useState<BotStatus>({isRunning:false,isPaused:false,activeSchedules:0,currentProfit:0});
  const [todayStats,setTodayStats]=useState({profit:0,executions:0,winRate:0});
  const [executions,setExecutions]=useState<{scheduledTime:string;result:'win'|'loss'|'draw'}[]>([]);
  const [deviceType,setDeviceType]=useState<'mobile'|'tablet'|'desktop'>('desktop');

  useEffect(()=>{
    if(!hasHydrated)return;
    if(!isAuthenticated){router.push('/');return}
    // Add dashboard class for pattern
    document.documentElement.classList.add('dashboard-page');
    loadData();
    api.getActiveAssets().then((d:any)=>setAssets(d||[])).catch(()=>{});
    const iv=setInterval(loadData,30000);
    return()=>{
      clearInterval(iv);
      document.documentElement.classList.remove('dashboard-page');
    };
  },[hasHydrated,isAuthenticated]); // eslint-disable-line

  // Device detection
  useEffect(()=>{
    const checkDevice=()=>{
      const w=window.innerWidth;
      if(w<768)setDeviceType('mobile');
      else if(w<1024)setDeviceType('tablet');
      else setDeviceType('desktop');
    };
    checkDevice();
    window.addEventListener('resize',checkDevice);
    return()=>window.removeEventListener('resize',checkDevice);
  },[]);

  const getNextExecTime=(schedules:any[])=>{
    if(!schedules?.length)return undefined;
    const cur=new Date().getHours()*60+new Date().getMinutes();
    const future=schedules.map((s:any)=>{const[h,m]=s.time.split(':').map(Number);return h*60+m}).filter((t:number)=>t>cur).sort((a:number,b:number)=>a-b);
    if(future.length){const h=Math.floor(future[0]/60),m=future[0]%60;return`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`}
    return`Besok ${schedules[0].time}`;
  };

  const loadData=async()=>{
    setIsLoading(true);setError(null);
    try{
      const scheds=await api.getOrderSchedules().catch(()=>[]);
      const active=scheds.find((s:any)=>s.status==='active'&&s.isActive);
      setActiveSchedule(active||null);
      const ac=scheds.filter((s:any)=>s.status==='active').length;
      const pc=scheds.filter((s:any)=>s.status==='paused').length;
      setBotStatus({
        isRunning:ac>0,isPaused:pc>0&&ac===0,activeSchedules:ac,
        nextExecutionTime:active?getNextExecTime(active.schedules):undefined,
        lastExecutionTime:active?.lastExecutedAt?new Date(active.lastExecutedAt).toLocaleTimeString('id-ID'):undefined,
        currentProfit:scheds.reduce((s:number,x:any)=>s+(x.currentProfit||0),0),
      });
      const stats=await api.getTodayStats();setTodayStats(stats);
      if(active){try{const execs=await api.getOrderHistory(active.id,200);setExecutions((execs||[]).filter((e:any)=>e.result).map((e:any)=>({scheduledTime:e.scheduledTime,result:e.result})));}catch{setExecutions([]);}}else{setExecutions([]);}
      if(active)setSettings({assetSymbol:active.assetSymbol,assetName:active.assetName||active.assetSymbol,accountType:active.accountType,duration:active.duration,amount:active.amount,schedules:active.schedules,martingaleSetting:active.martingaleSetting,stopLossProfit:active.stopLossProfit});
    }catch(e:any){
      if(e?.response?.status===401){clearAuth();router.push('/');return}
      setError('Gagal memuat data. Silakan refresh.');
    }finally{setIsLoading(false)}
  };

  const handleStart=async()=>{
    setIsActionLoad(true);setError(null);
    try{await api.createOrderSchedule({assetSymbol:settings.assetSymbol,assetName:settings.assetName,accountType:settings.accountType,duration:settings.duration,amount:settings.amount,schedules:settings.schedules,martingaleSetting:settings.martingaleSetting,stopLossProfit:settings.stopLossProfit});await loadData()}
    catch(e:any){setError(e?.response?.data?.message||'Gagal memulai bot.')}
    finally{setIsActionLoad(false)}
  };
  const handlePause=async()=>{
    if(!activeSchedule)return;setIsActionLoad(true);setError(null);
    try{await api.pauseOrderSchedule(activeSchedule.id);await loadData()}
    catch(e:any){setError(e?.response?.data?.message||'Gagal menjeda bot.')}
    finally{setIsActionLoad(false)}
  };
  const handleStop=async()=>{
    if(!activeSchedule||!window.confirm('Yakin ingin menghentikan bot?'))return;
    setIsActionLoad(true);setError(null);
    try{await api.deleteOrderSchedule(activeSchedule.id);await loadData();setSettings({assetSymbol:'',assetName:'',accountType:'demo',duration:60,amount:10000,schedules:[],martingaleSetting:{maxStep:0,multiplier:2},stopLossProfit:{}})}
    catch(e:any){setError(e?.response?.data?.message||'Gagal menghentikan bot.')}
    finally{setIsActionLoad(false)}
  };

  const canStart=!!(settings.assetSymbol&&settings.schedules.length>0);
  
  // INCREASED GAP FROM 12 TO 20 FOR BETTER SPACING
  const g = deviceType === 'desktop' ? 20 : deviceType === 'tablet' ? 18 : 16;
  const px=16;

  if(!hasHydrated)return(
    <div style={{minHeight:'100vh',background:C.bg,display:'flex',alignItems:'center',justifyContent:'center'}}>
      <div style={{width:24,height:24,border:`2px solid ${C.cyand}`,borderTopColor:C.cyan,borderRadius:'50%',animation:'spin .8s linear infinite'}}/>
    </div>
  );
  if(!isAuthenticated)return null;

  return (
    <>
      <G/>
      <div style={{minHeight:'100vh',background:C.bg,paddingBottom:88}}>

        {/* HEADER */}
        <div style={{position:'relative'}}>
          <img src="/header3.jpg" alt="" style={{width:'100%',height:'auto',display:'block'}}/>
          {/* Fade overlay */}
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:100,background:`linear-gradient(to bottom,transparent,${C.bg})`,zIndex:1}}/>
        </div>

        <div style={{maxWidth:1280,margin:'0 auto',padding:`0 ${px}px`}}>

          {/* ERROR */}
          {error&&(
            <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 14px',margin:`0 0 ${g}px`,background:C.cord,border:`1px solid rgba(255,71,87,.2)`,borderLeft:`2px solid ${C.coral}`,animation:'slide-up .2s ease'}}>
              <AlertCircle style={{width:13,height:13,color:C.coral,flexShrink:0,marginTop:2}}/>
              <span style={{fontFamily:'var(--font-geist-sans)',fontSize:12,color:'#ff8a94',flex:1}}>{error}</span>
              <button onClick={()=>setError(null)} style={{background:'none',border:'none',cursor:'pointer',color:`${C.coral}60`}}><X style={{width:13,height:13}}/></button>
            </div>
          )}

          {/* ── DESKTOP ── */}
          {deviceType==='desktop'&&(
            <div style={{display:'grid',gridTemplateColumns:'1fr 356px',gap:g}}>
              <div style={{display:'flex',flexDirection:'column',gap:g}}>
                <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:g}}>
                  <StatCard title="Eksekusi Hari Ini" value={todayStats.executions} icon={<Activity style={{width:15,height:15}}/>} isLoading={isLoading}/>
                  <StatCard title="Win Rate" value={`${todayStats.winRate.toFixed(1)}%`} icon={<BarChart2 style={{width:15,height:15}}/>} trend={todayStats.winRate>50?'up':'down'} isLoading={isLoading}/>
                  <div style={{height:'100%'}}><RealtimeClock/></div>
                </div>
                <ProfitCard todayProfit={todayStats.profit} isLoading={isLoading}/>
                <Card noLine style={{padding:14}}>
                  <ChartCard assetSymbol={settings.assetSymbol} height={280}/>
                  {settings.assetSymbol&&(
                    <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:8}}>
                      <span style={{width:4,height:4,background:C.cyan,opacity:.5,display:'inline-block',borderRadius:'50%'}}/>
                      <span style={{fontFamily:'var(--font-geist-sans)',fontSize:10,color:'rgba(255,255,255,.85)'}}>{settings.assetSymbol} · {settings.assetName}</span>
                    </div>
                  )}
                </Card>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:g}}>
                <div style={{minHeight:200}}><SchedulePanel schedules={settings.schedules} executions={executions} onOpenModal={()=>setIsModalOpen(true)} isDisabled={botStatus.isRunning&&!botStatus.isPaused} maxCount={10}/></div>
                <OrderSettingsCard settings={settings} onChange={setSettings} isDisabled={botStatus.isRunning&&!botStatus.isPaused} assets={assets}/>
                <BotControlCard status={botStatus} onStart={handleStart} onPause={handlePause} onStop={handleStop} isLoading={isActionLoad} canStart={canStart} errorMessage={error||undefined}/>
              </div>
            </div>
          )}

          {/* ── TABLET ── */}
          {deviceType==='tablet'&&(
            <div style={{display:'flex',flexDirection:'column',gap:g}}>
              {/* Row 1: stat cards */}
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:g}}>
                <StatCard title="Eksekusi" value={todayStats.executions} icon={<Activity style={{width:13,height:13}}/>} isLoading={isLoading}/>
                <StatCard title="Win Rate" value={`${todayStats.winRate.toFixed(1)}%`} icon={<BarChart2 style={{width:13,height:13}}/>} trend={todayStats.winRate>50?'up':'down'} isLoading={isLoading}/>
                <div style={{height:'100%'}}><RealtimeClock/></div>
              </div>
              {/* Row 2: profit */}
              <ProfitCard todayProfit={todayStats.profit} isLoading={isLoading}/>
              {/* Row 3: chart + schedule — sejajar */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:g,alignItems:'stretch'}}>
                <Card noLine style={{padding:12}}><ChartCard assetSymbol={settings.assetSymbol} height={220}/></Card>
                <SchedulePanel schedules={settings.schedules} executions={executions} onOpenModal={()=>setIsModalOpen(true)} isDisabled={botStatus.isRunning&&!botStatus.isPaused} maxCount={10} tabletMaxItems={10}/>
              </div>
              {/* Row 4: settings + bot control */}
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:g}}>
                <OrderSettingsCard settings={settings} onChange={setSettings} isDisabled={botStatus.isRunning&&!botStatus.isPaused} assets={assets}/>
                <BotControlCard status={botStatus} onStart={handleStart} onPause={handlePause} onStop={handleStop} isLoading={isActionLoad} canStart={canStart} errorMessage={error||undefined}/>
              </div>
            </div>
          )}

          {/* ── MOBILE ── */}
          {deviceType==='mobile'&&(
            <div style={{display:'flex',flexDirection:'column',gap:g}}>
            <ProfitCard todayProfit={todayStats.profit} isLoading={isLoading}/>
            <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:g,alignItems:'stretch'}}>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <RealtimeClockCompact/>
                <Card noLine style={{padding:10,flex:1,display:'flex',flexDirection:'column'}}>
                  <ChartCard assetSymbol={settings.assetSymbol} height={110}/>
                  {/* Info pengisi ruang kosong */}
                  <div style={{
                    flex:1,display:'flex',flexDirection:'column',justifyContent:'flex-end',
                    gap:6,marginTop:8,
                  }}>
                    {settings.assetSymbol ? (
                      <div style={{
                        display:'flex',alignItems:'center',justifyContent:'center',gap:5,
                        padding:'4px 8px',
                        background:'rgba(52,211,153,0.05)',
                        border:'1px solid rgba(52,211,153,0.12)',
                      }}>
                        <span style={{width:4,height:4,borderRadius:'50%',background:C.cyan,opacity:.6,flexShrink:0}}/>
                        <span style={{fontFamily:'var(--font-geist-sans)',fontSize:9,color:'rgba(255,255,255,.75)',letterSpacing:'0.04em',whiteSpace:'nowrap',overflow:'hidden',textOverflow:'ellipsis'}}>
                          {settings.assetSymbol}
                        </span>
                      </div>
                    ) : null}
                    <div style={{
                      display:'flex',flexDirection:'column',gap:4,
                    }}>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontFamily:'var(--font-exo)',fontSize:8,fontWeight:600,letterSpacing:'0.14em',color:'rgba(255,255,255,.4)',textTransform:'uppercase'}}>Profit</span>
                        <span style={{fontFamily:'var(--font-geist-sans)',fontSize:10,fontWeight:600,color:botStatus.currentProfit>=0?C.cyan:C.coral}}>
                          {botStatus.currentProfit>=0?'+':''}{botStatus.currentProfit.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                        <span style={{fontFamily:'var(--font-exo)',fontSize:8,fontWeight:600,letterSpacing:'0.14em',color:'rgba(255,255,255,.4)',textTransform:'uppercase'}}>Status</span>
                        <span style={{
                          fontFamily:'var(--font-exo)',fontSize:8,fontWeight:700,letterSpacing:'0.1em',
                          color: botStatus.isRunning&&!botStatus.isPaused ? C.cyan : botStatus.isPaused ? '#6ee7b7' : 'rgba(255,255,255,.4)',
                        }}>
                          {botStatus.isRunning&&!botStatus.isPaused ? 'AKTIF' : botStatus.isPaused ? 'DIJEDA' : 'OFF'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
              <SchedulePanel schedules={settings.schedules} executions={executions} onOpenModal={()=>setIsModalOpen(true)} isDisabled={botStatus.isRunning&&!botStatus.isPaused} maxCount={10}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:g}}>
              <StatCard title="Eksekusi" value={todayStats.executions} icon={<Activity style={{width:12,height:12}}/>} isLoading={isLoading}/>
              <StatCard title="Win Rate" value={`${todayStats.winRate.toFixed(1)}%`} icon={<BarChart2 style={{width:12,height:12}}/>} trend={todayStats.winRate>50?'up':'down'} isLoading={isLoading}/>
            </div>
            <OrderSettingsCard settings={settings} onChange={setSettings} isDisabled={botStatus.isRunning&&!botStatus.isPaused} assets={assets}/>
            <BotControlCard status={botStatus} onStart={handleStart} onPause={handlePause} onStop={handleStop} isLoading={isActionLoad} canStart={canStart} errorMessage={error||undefined}/>
            </div>
          )}
        </div>

        <BulkScheduleModal isOpen={isModalOpen} onClose={()=>setIsModalOpen(false)}
          schedules={settings.schedules}
          onAddSchedules={s=>setSettings({...settings,schedules:[...settings.schedules,...s]})}
          onRemoveSchedule={i=>setSettings({...settings,schedules:settings.schedules.filter((_,j)=>j!==i)})}
          onClearAll={()=>setSettings({...settings,schedules:[]})} maxCount={10}/>
        <BottomNav/>
      </div>
    </>
  );
}