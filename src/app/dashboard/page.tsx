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
  bg:    '#02090a',
  s1:    '#06110e',
  s2:    '#091a14',
  s3:    '#0c2119',
  cyan:  '#34d399',
  cyand: 'rgba(52,211,153,0.12)',
  cyang: 'rgba(52,211,153,0.06)',
  coral: '#ff5263',
  cord:  'rgba(255,82,99,0.1)',
  text:  '#eaf7f2',        // brighter — was #eaf7f2
  sub:   '#9ecfbe',        // new: secondary text, readable
  muted: 'rgba(234,247,242,0.55)', // was 0.45
  faint: 'rgba(234,247,242,0.07)',
  bdr:   'rgba(52,211,153,0.15)', // slightly stronger border
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

    *{box-sizing:border-box}
    body{background:${C.bg};color:${C.text};-webkit-font-smoothing:antialiased}
    ::-webkit-scrollbar{width:3px}
    ::-webkit-scrollbar-thumb{background:${C.bdr}}

    /* inputs */
    .ds-input{
      width:100%;padding:10px 13px;
      background:${C.s2}!important;color:${C.text}!important;
      border:1px solid ${C.bdr}!important;
      font-family:var(--font-mono)!important;font-size:13px!important;
      outline:none!important;border-radius:0!important;
      transition:border-color .15s,box-shadow .15s;
      line-height:1.4;
    }
    .ds-input:focus{
      border-color:rgba(52,211,153,.5)!important;
      box-shadow:0 0 0 2px rgba(52,211,153,.07)!important;
    }
    select.ds-input option{background:${C.s1};color:${C.text}}
    .ds-input::placeholder{color:rgba(234,247,242,.65)!important}
    input[type=number]::-webkit-inner-spin-button{opacity:.25}

    .ds-card{animation:slide-up .25s ease both}

    /* hover helpers */
    .ds-btn-cyan:hover:not(:disabled){
      background:rgba(52,211,153,.12)!important;
      box-shadow:0 0 24px rgba(52,211,153,.14)!important;
    }
    .ds-btn-coral:hover:not(:disabled){background:rgba(255,82,99,.12)!important}
    .ds-ghost:hover:not(:disabled){
      color:rgba(234,247,242,.75)!important;
      border-color:rgba(234,247,242,.68)!important;
    }

    textarea.ds-input{resize:none}
  `}</style>
);

// ═══════════════════════════════════════════════════════════════
// PRIMITIVES
// ═══════════════════════════════════════════════════════════════

/* Clipped corner card */
const Card: React.FC<{
  children:React.ReactNode; style?:React.CSSProperties;
  glowColor?:string; clip?:boolean;
}> = ({children, style, glowColor, clip=true}) => (
  <div className="ds-card" style={{
    background:C.s1,
    border:`1px solid ${C.bdr}`,
    boxShadow: glowColor ? `0 0 30px ${glowColor}14, inset 0 1px 0 ${glowColor}10` : 'none',
    clipPath: clip
      ? 'polygon(0 0, calc(100% - 12px) 0, 100% 12px, 100% 100%, 12px 100%, 0 calc(100% - 12px))'
      : undefined,
    position:'relative', overflow:'hidden', ...style,
  }}>
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
const SL: React.FC<{children:React.ReactNode; color?:string}> = ({children, color='rgba(234,247,242,.6)'}) => (
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
    color:'rgba(234,247,242,.5)',marginBottom:6,
  }}>{children}</label>
);

/* Toggle */
const Toggle: React.FC<{checked:boolean;onChange:(v:boolean)=>void;disabled?:boolean}> =
({checked,onChange,disabled=false}) => (
  <label style={{display:'inline-flex',alignItems:'center',cursor:disabled?'not-allowed':'pointer',opacity:disabled?.4:1}}>
    <input type="checkbox" checked={checked} onChange={e=>onChange(e.target.checked)}
      disabled={disabled} style={{position:'absolute',opacity:0,width:0,height:0}}/>
    <div style={{
      width:42,height:20,
      background:checked?C.cyand:'rgba(234,247,242,.05)',
      border:`1px solid ${checked?C.cyan:C.bdr}`,
      position:'relative',transition:'all .2s',
      clipPath:'polygon(0 0,calc(100% - 6px) 0,100% 6px,100% 100%,6px 100%,0 calc(100% - 6px))',
      boxShadow:checked?`0 0 12px rgba(52,211,153,.3)`:'none',
    }}>
      <div style={{
        position:'absolute',top:2,left:checked?22:2,
        width:14,height:14,
        background:checked?C.cyan:'rgba(234,247,242,.65)',
        transition:'all .2s',
        boxShadow:checked?`0 0 8px ${C.cyan}`:'none',
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
    <Card glowColor={C.cyan} style={{padding:'16px 18px',height:'100%'}}>
      {/* Scanline sweep */}
      <div style={{
        position:'absolute',left:0,right:0,height:'30%',
        background:`linear-gradient(to bottom,transparent,rgba(52,211,153,.03),transparent)`,
        animation:'scanline 4s linear infinite',pointerEvents:'none',
      }}/>
      {/* Corner hex decoration */}
      <div style={{
        position:'absolute',top:6,right:6,width:20,height:20,
        border:`1px solid rgba(52,211,153,.2)`,
        transform:'rotate(45deg)',
      }}/>

      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:10,position:'relative'}}>
        <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.2em',textTransform:'uppercase',color:'rgba(234,247,242,.72)'}}>
          WAKTU LOKAL
        </span>
        <span style={{display:'flex',alignItems:'center',gap:5}}>
          <span style={{position:'relative',display:'inline-flex'}}>
            <span style={{width:7,height:7,background:C.cyan,display:'block',borderRadius:'50%',boxShadow:`0 0 6px ${C.cyan}`}}/>
            <span style={{position:'absolute',inset:0,background:C.cyan,borderRadius:'50%',animation:'ping 1.8s cubic-bezier(0,0,.2,1) infinite'}}/>
          </span>
          <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.2em',color:C.cyan}}>LIVE</span>
        </span>
      </div>

      <p suppressHydrationWarning style={{
        fontFamily:'var(--font-mono)',fontSize:28,fontWeight:600,
        color:C.text,letterSpacing:'0.05em',lineHeight:1,position:'relative',
        textShadow:`0 0 24px rgba(52,211,153,.25)`,
      }}>{time?fmt(time):'--:--:--'}</p>

      <div style={{display:'flex',justifyContent:'space-between',marginTop:9,position:'relative'}}>
        <span suppressHydrationWarning style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:500,color:'rgba(234,247,242,.72)'}}>
          {time?fmtD(time):''}
        </span>
        <span suppressHydrationWarning style={{fontFamily:'var(--font-mono)',fontSize:10,color:`${C.cyan}cc`}}>
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
        <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.22em',textTransform:'uppercase',color:'rgba(234,247,242,.72)'}}>WAKTU</span>
        <span style={{position:'relative',display:'inline-flex',alignItems:'center'}}>
          <span style={{width:5,height:5,background:C.cyan,borderRadius:'50%',display:'block',boxShadow:`0 0 5px ${C.cyan}`}}/>
          <span style={{position:'absolute',inset:0,background:C.cyan,borderRadius:'50%',animation:'ping 1.8s cubic-bezier(0,0,.2,1) infinite'}}/>
        </span>
      </div>
      <p suppressHydrationWarning style={{fontFamily:'var(--font-mono)',fontSize:14,fontWeight:600,color:C.text,letterSpacing:'0.05em',lineHeight:1}}>
        {time?fmt(time):'--:--:--'}
      </p>
      <p suppressHydrationWarning style={{fontFamily:'var(--font-mono)',fontSize:10,color:`${C.cyan}bb`,marginTop:4}}>{tz()}</p>
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
    <Card style={{padding:'14px 16px'}}>
      <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
        <div style={{flex:1}}>
          <p style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(234,247,242,.62)',marginBottom:9}}>
            {title}
          </p>
          {isLoading
            ? <div style={{height:26,width:52,background:C.faint,animation:'pulse 1.5s ease infinite'}}/>
            : <p style={{
                fontFamily:'var(--font-mono)',fontSize:22,fontWeight:600,color:col,
                letterSpacing:'-0.01em',lineHeight:1,
                textShadow: trend==='up'?`0 0 20px rgba(52,211,153,.35)`
                          : trend==='down'?`0 0 20px rgba(255,71,87,.25)`:'none',
              }}>{value}</p>
          }
        </div>
        <div style={{color:col,opacity:.4,marginTop:2}}>{icon}</div>
      </div>
      {/* bottom glow strip */}
      <div style={{
        position:'absolute',bottom:0,left:0,right:0,height:1,
        background:`linear-gradient(to right,transparent,${col}40,transparent)`,
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
    <Card glowColor={col} style={{padding:'20px 24px'}}>
      {/* Background gradient */}
      <div style={{
        position:'absolute',inset:0,
        background:`radial-gradient(ellipse at 10% 50%,${col}08 0%,transparent 55%)`,
        pointerEvents:'none',
      }}/>
      {/* Diagonal grid pattern */}
      <div style={{
        position:'absolute',right:0,top:0,bottom:0,width:'50%',
        backgroundImage:`repeating-linear-gradient(60deg,${col}06 0px,${col}06 1px,transparent 1px,transparent 12px)`,
        pointerEvents:'none',
      }}/>

      <div style={{position:'relative'}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:8}}>
          <div style={{width:3,height:12,background:col,opacity:.6}}/>
          <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.25em',textTransform:'uppercase',color:'rgba(234,247,242,.75)'}}>
            PROFIT HARI INI
          </span>
        </div>
        {isLoading
          ? <div style={{height:44,width:220,background:C.faint}}/>
          : <>
              <p style={{
                fontFamily:'var(--font-mono)',fontWeight:600,
                fontSize:'clamp(26px,5vw,42px)',
                color:col,letterSpacing:'-0.02em',lineHeight:1,
                textShadow:`0 0 40px ${col}50`,
              }}>
                {isPos?'+':'-'}Rp {Math.abs(todayProfit).toLocaleString('id-ID')}
              </p>
              {/* sub-indicator bar */}
              <div style={{
                marginTop:12,height:2,width:'100%',
                background:`linear-gradient(to right,${col}80,${col}20,transparent)`,
              }}/>
            </>
        }
      </div>
    </Card>
  );
};

// ═══════════════════════════════════════════════════════════════
// SCHEDULE PANEL
// ═══════════════════════════════════════════════════════════════
const SchedulePanel: React.FC<{
  schedules:{time:string;trend:'buy'|'sell'}[];
  onOpenModal:()=>void; isDisabled?:boolean; maxCount?:number;
}> = ({schedules,onOpenModal,isDisabled=false,maxCount=50}) => (
  <Card style={{display:'flex',flexDirection:'column',height:'100%'}}>
    <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'12px 14px',borderBottom:`1px solid ${C.faint}`}}>
      <div style={{display:'flex',alignItems:'center',gap:7}}>
        <div style={{width:3,height:13,background:C.cyan,opacity:.6}}/>
        <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',color:'rgba(234,247,242,.78)'}}>JADWAL</span>
      </div>
    </div>

    {schedules.length===0 ? (
      <div style={{flex:1,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',padding:20,gap:8}}>
        <p style={{fontFamily:'var(--font-exo)',fontSize:12,fontWeight:500,color:'rgba(234,247,242,.55)'}}>Belum ada jadwal</p>
      </div>
    ) : (
      <div style={{flex:1,overflowY:'auto',maxHeight:200}}>
        {schedules.map((s,i)=>(
          <div key={i} style={{
            display:'flex',alignItems:'center',gap:8,
            padding:'7px 12px',
            borderBottom:`1px solid ${C.faint}`,
            background: i%2===0?C.s2:'transparent',
          }}>
            <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(234,247,242,.68)',width:16,textAlign:'right',flexShrink:0}}>{String(i+1).padStart(2,'0')}</span>
            <span style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:500,color:C.text,flex:1}}>{s.time}</span>
            <span style={{
              fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.12em',textTransform:'uppercase',
              color:s.trend==='buy'?C.cyan:C.coral,
              padding:'2px 6px',
              background:s.trend==='buy'?C.cyand:C.cord,
            }}>{s.trend}</span>
          </div>
        ))}
      </div>
    )}

    <div style={{padding:'8px 10px',borderTop:`1px solid ${C.faint}`}}>
      <button onClick={onOpenModal} disabled={isDisabled||schedules.length>=maxCount}
        className="ds-btn-cyan"
        style={{
          width:'100%',padding:'9px',
          background:'transparent',border:`1px solid rgba(52,211,153,.22)`,color:C.cyan,
          fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',
          cursor:isDisabled?'not-allowed':'pointer',
          opacity:isDisabled?.3:1,
          display:'flex',alignItems:'center',justifyContent:'center',gap:6,
          transition:'all .15s',
          clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',
        }}>
        <Plus style={{width:12,height:12}}/>
        {schedules.length===0?'TAMBAH':'KELOLA'}
      </button>
    </div>
  </Card>
);

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
    if(schedules.length+result.length>maxCount){setError(`Melebihi batas ${maxCount}`);return}
    if(!result.length){setError('Tidak ada jadwal valid');return}
    onAddSchedules(result);setInput('');
  };

  return (
    <div style={{position:'fixed',inset:0,zIndex:50,display:'flex',alignItems:'flex-end',justifyContent:'center',padding:16}}>
      <div style={{position:'absolute',inset:0,background:'rgba(3,11,18,.9)',backdropFilter:'blur(8px)'}} onClick={onClose}/>
      <div style={{
        position:'relative',width:'100%',maxWidth:500,
        background:C.s1,border:`1px solid ${C.bdr}`,
        borderTop:`2px solid ${C.cyan}`,
        display:'flex',flexDirection:'column',maxHeight:'90vh',
        clipPath:'polygon(0 0,calc(100% - 14px) 0,100% 14px,100% 100%,0 100%)',
        boxShadow:`0 -16px 60px rgba(52,211,153,.08)`,
        animation:'slide-up .2s ease',
      }}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',borderBottom:`1px solid ${C.faint}`}}>
          <div>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:4}}>
              <div style={{width:3,height:14,background:C.cyan,opacity:.6}}/>
              <h2 style={{fontFamily:'var(--font-exo)',fontSize:16,fontWeight:800,letterSpacing:'0.08em',textTransform:'uppercase',color:C.text}}>INPUT JADWAL</h2>
            </div>
            <p style={{fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(234,247,242,.62)',paddingLeft:11}}>
              Format: <span style={{color:C.cyan}}>09:30 buy</span> · satu per baris
            </p>
          </div>
          <button onClick={onClose} style={{width:28,height:28,background:C.faint,border:`1px solid ${C.bdr}`,color:C.muted,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}>
            <X style={{width:13,height:13}}/>
          </button>
        </div>

        <div style={{flex:1,overflowY:'auto',padding:'14px 18px'}}>
          {schedules.length>0&&(
            <div style={{marginBottom:14}}>
              <div style={{display:'flex',justifyContent:'space-between',marginBottom:6}}>
                <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(234,247,242,.75)'}}>{schedules.length}/{maxCount} jadwal</span>
                <button onClick={()=>window.confirm('Hapus semua?')&&onClearAll()} style={{display:'flex',alignItems:'center',gap:4,fontFamily:'var(--font-mono)',fontSize:10,color:`${C.coral}80`,background:'none',border:'none',cursor:'pointer'}}>
                  <Trash2 style={{width:10,height:10}}/> Hapus semua
                </button>
              </div>
              <div style={{maxHeight:130,overflowY:'auto',border:`1px solid ${C.faint}`}}>
                {schedules.map((s,i)=>(
                  <div key={i} style={{display:'flex',alignItems:'center',gap:8,padding:'6px 10px',background:i%2===0?C.s2:'transparent',borderBottom:`1px solid ${C.faint}`}}>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:11,color:'rgba(234,247,242,.58)',width:16}}>{i+1}</span>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:12,color:C.text,flex:1}}>{s.time}</span>
                    <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.1em',color:s.trend==='buy'?C.cyan:C.coral,padding:'1px 5px',background:s.trend==='buy'?C.cyand:C.cord}}>{s.trend.toUpperCase()}</span>
                    <button onClick={()=>onRemoveSchedule(i)} style={{background:'none',border:'none',cursor:'pointer',color:'rgba(234,247,242,.58)',padding:2}}><X style={{width:12,height:12}}/></button>
                  </div>
                ))}
              </div>
            </div>
          )}
          <div style={{marginBottom:10}}>
            <p style={{fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(234,247,242,.58)',marginBottom:6}}>
              <span style={{color:C.cyan}}>09:30 buy</span>{'  '}
              <span style={{color:'rgba(234,247,242,.78)'}}>14.15 s</span>{'  '}
              <span style={{color:'rgba(234,247,242,.78)'}}>1600 sell</span>
            </p>
            <textarea className="ds-input" value={input} onChange={e=>setInput(e.target.value)}
              placeholder={"09:00 buy\n09:30 sell\n1000 b"} rows={6}/>
          </div>
          {error&&(
            <div style={{display:'flex',gap:8,padding:'10px 12px',background:C.cord,border:`1px solid rgba(255,71,87,.2)`,borderLeft:`2px solid ${C.coral}`}}>
              <AlertCircle style={{width:13,height:13,color:C.coral,flexShrink:0,marginTop:1}}/>
              <p style={{fontFamily:'var(--font-mono)',fontSize:11,color:'#ff8a94',whiteSpace:'pre-line'}}>{error}</p>
            </div>
          )}
        </div>

        <div style={{display:'flex',gap:8,padding:'12px 18px',borderTop:`1px solid ${C.faint}`}}>
          <button onClick={handleAdd} disabled={!input.trim()||schedules.length>=maxCount}
            className="ds-btn-cyan"
            style={{
              flex:1,padding:'10px',background:C.cyand,border:`1px solid rgba(52,211,153,.3)`,color:C.cyan,
              fontFamily:'var(--font-exo)',fontSize:12,fontWeight:700,letterSpacing:'0.18em',textTransform:'uppercase',
              cursor:!input.trim()?'not-allowed':'pointer',opacity:!input.trim()?.4:1,transition:'all .15s',
              clipPath:'polygon(0 0,calc(100% - 8px) 0,100% 8px,100% 100%,8px 100%,0 calc(100% - 8px))',
            }}>TAMBAH</button>
          <button onClick={onClose} className="ds-ghost" style={{
            padding:'10px 20px',background:'transparent',border:`1px solid ${C.bdr}`,color:'rgba(234,247,242,.68)',
            fontFamily:'var(--font-exo)',fontSize:12,fontWeight:600,letterSpacing:'0.15em',textTransform:'uppercase',
            cursor:'pointer',transition:'all .15s',
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
            <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:C.cyan,background:C.cyand,border:`1px solid rgba(52,211,153,.2)`,padding:'2px 8px'}}>
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
            <select className="ds-input" value={settings.assetSymbol} onChange={e=>{
              const a=assets.find((x:any)=>x.symbol===e.target.value);
              if(a){onChange({...settings,assetSymbol:a.symbol,assetName:a.name||a.symbol});onAssetSelect?.(a);}
            }} disabled={isDisabled}>
              <option value="">Pilih aset trading</option>
              {assets.map((a:any)=><option key={a.id} value={a.symbol}>{a.name||a.symbol}</option>)}
            </select>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:10}}>
            <div>
              <FL>Tipe Akun</FL>
              <select className="ds-input" value={settings.accountType} onChange={e=>set('accountType',e.target.value)} disabled={isDisabled}>
                <option value="demo">Demo</option><option value="real">Real</option>
              </select>
            </div>
            <div>
              <FL>Timeframe</FL>
              <select className="ds-input" value={settings.duration.toString()} onChange={e=>set('duration',+e.target.value)} disabled={isDisabled}>
                {DURATIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:16}}>
            <FL>Jumlah per Order</FL>
            <div style={{position:'relative'}}>
              <span style={{position:'absolute',left:12,top:'50%',transform:'translateY(-50%)',fontFamily:'var(--font-mono)',fontSize:11,color:'rgba(234,247,242,.62)',zIndex:1,pointerEvents:'none'}}>Rp</span>
              <input type="number" className="ds-input" value={settings.amount}
                onChange={e=>set('amount',+e.target.value||0)} disabled={isDisabled}
                min="1000" step="1000" style={{paddingLeft:36}}/>
            </div>
          </div>

          <Divider/>
          <SL color="rgba(52,211,153,.45)">Strategi Martingale</SL>
          <div style={{background:C.s2,border:`1px solid ${C.faint}`,padding:'12px',marginBottom:14}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between'}}>
              <div>
                <p style={{fontFamily:'var(--font-exo)',fontSize:13,fontWeight:600,color:C.muted}}>Martingale</p>
                <p style={{fontFamily:'var(--font-exo)',fontSize:12,color:'rgba(234,247,242,.65)',marginTop:3}}>Gandakan amount setelah loss</p>
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
                <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(234,247,242,.68)',zIndex:1,pointerEvents:'none'}}>Rp</span>
                <input type="number" className="ds-input" value={settings.stopLossProfit.stopLoss||''} onChange={e=>nest('stopLossProfit','stopLoss',e.target.value?+e.target.value:undefined)} disabled={isDisabled} placeholder="Opsional" style={{paddingLeft:32}}/>
              </div>
            </div>
            <div><FL>Take Profit</FL>
              <div style={{position:'relative'}}>
                <span style={{position:'absolute',left:10,top:'50%',transform:'translateY(-50%)',fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(234,247,242,.68)',zIndex:1,pointerEvents:'none'}}>Rp</span>
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
    :{label:'NONAKTIF', col:'rgba(234,247,242,.65)', dim:C.faint};

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
                <p style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:700,letterSpacing:'0.16em',textTransform:'uppercase',color:'rgba(234,247,242,.72)'}}>{s.l}</p>
                <p style={{fontFamily:'var(--font-mono)',fontSize:20,fontWeight:600,color:s.c,marginTop:5,lineHeight:1}}>{s.v}</p>
              </div>
            ))}
          </div>

          {status.nextExecutionTime&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:C.s2,marginBottom:6,borderLeft:`2px solid rgba(110,231,183,.35)`}}>
              <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:600,letterSpacing:'0.15em',color:'rgba(234,247,242,.72)'}}>BERIKUTNYA</span>
              <span style={{fontFamily:'var(--font-mono)',fontSize:13,fontWeight:600,color:'#6ee7b7'}}>{status.nextExecutionTime}</span>
            </div>
          )}
          {status.lastExecutionTime&&(
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'7px 10px',background:C.s2,marginBottom:10}}>
              <span style={{fontFamily:'var(--font-exo)',fontSize:11,fontWeight:600,letterSpacing:'0.15em',color:'rgba(234,247,242,.72)'}}>TERAKHIR</span>
              <span style={{fontFamily:'var(--font-mono)',fontSize:12,color:'rgba(234,247,242,.78)'}}>{status.lastExecutionTime}</span>
            </div>
          )}

          {errorMessage&&(
            <div style={{display:'flex',gap:8,padding:'10px 12px',marginBottom:10,background:C.cord,border:`1px solid rgba(255,71,87,.2)`,borderLeft:`2px solid ${C.coral}`}}>
              <AlertCircle style={{width:12,height:12,color:C.coral,flexShrink:0,marginTop:1}}/>
              <p style={{fontFamily:'var(--font-mono)',fontSize:11,color:'#ff8a94'}}>{errorMessage}</p>
            </div>
          )}

          <div style={{display:'flex',flexDirection:'column',gap:6}}>
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
              <Info style={{width:13,height:13,color:'rgba(234,247,242,.55)',flexShrink:0,marginTop:1}}/>
              <p style={{fontFamily:'var(--font-exo)',fontSize:12,fontWeight:500,color:'rgba(234,247,242,.65)',lineHeight:1.6}}>
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

  useEffect(()=>{
    if(!hasHydrated)return;
    if(!isAuthenticated){router.push('/');return}
    loadData();
    api.getActiveAssets().then((d:any)=>setAssets(d||[])).catch(()=>{});
    const iv=setInterval(loadData,30000);
    return()=>clearInterval(iv);
  },[hasHydrated,isAuthenticated]); // eslint-disable-line

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
  const g=12,px=16;

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
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:100,background:`linear-gradient(to bottom,transparent,${C.bg})`}}/>
          <div style={{position:'absolute',bottom:0,left:0,right:0,height:1,background:`linear-gradient(to right,transparent,${C.cyan}50,${C.cyan}80,${C.cyan}50,transparent)`}}/>
        </div>

        <div style={{maxWidth:1280,margin:'0 auto',padding:`0 ${px}px`}}>

          {/* ERROR */}
          {error&&(
            <div style={{display:'flex',alignItems:'flex-start',gap:10,padding:'11px 14px',margin:`0 0 ${g}px`,background:C.cord,border:`1px solid rgba(255,71,87,.2)`,borderLeft:`2px solid ${C.coral}`,animation:'slide-up .2s ease'}}>
              <AlertCircle style={{width:13,height:13,color:C.coral,flexShrink:0,marginTop:2}}/>
              <span style={{fontFamily:'var(--font-mono)',fontSize:12,color:'#ff8a94',flex:1}}>{error}</span>
              <button onClick={()=>setError(null)} style={{background:'none',border:'none',cursor:'pointer',color:`${C.coral}60`}}><X style={{width:13,height:13}}/></button>
            </div>
          )}

          {/* ── DESKTOP ── */}
          <div className="hidden lg:grid" style={{gridTemplateColumns:'1fr 356px',gap:g}}>
            <div style={{display:'flex',flexDirection:'column',gap:g}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr 1fr',gap:g}}>
                <StatCard title="Eksekusi Hari Ini" value={todayStats.executions} icon={<Activity style={{width:15,height:15}}/>} isLoading={isLoading}/>
                <StatCard title="Win Rate" value={`${todayStats.winRate.toFixed(1)}%`} icon={<BarChart2 style={{width:15,height:15}}/>} trend={todayStats.winRate>50?'up':'down'} isLoading={isLoading}/>
                <div style={{height:'100%'}}><RealtimeClock/></div>
              </div>
              <ProfitCard todayProfit={todayStats.profit} isLoading={isLoading}/>
              <Card style={{padding:14}}>
                <ChartCard assetSymbol={settings.assetSymbol} height={280}/>
                {settings.assetSymbol&&(
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center',gap:6,marginTop:8}}>
                    <span style={{width:4,height:4,background:C.cyan,opacity:.5,display:'inline-block',borderRadius:'50%'}}/>
                    <span style={{fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(234,247,242,.72)'}}>{settings.assetSymbol} · {settings.assetName}</span>
                  </div>
                )}
              </Card>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:g}}>
              <div style={{minHeight:200}}><SchedulePanel schedules={settings.schedules} onOpenModal={()=>setIsModalOpen(true)} isDisabled={botStatus.isRunning&&!botStatus.isPaused} maxCount={10}/></div>
              <OrderSettingsCard settings={settings} onChange={setSettings} isDisabled={botStatus.isRunning&&!botStatus.isPaused} assets={assets}/>
              <BotControlCard status={botStatus} onStart={handleStart} onPause={handlePause} onStop={handleStop} isLoading={isActionLoad} canStart={canStart} errorMessage={error||undefined}/>
            </div>
          </div>

          {/* ── TABLET ── */}
          <div className="hidden md:grid lg:hidden" style={{gridTemplateColumns:'1fr 1fr',gap:g}}>
            <div style={{display:'flex',flexDirection:'column',gap:g}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(3,1fr)',gap:g}}>
                <StatCard title="Eksekusi" value={todayStats.executions} icon={<Activity style={{width:13,height:13}}/>} isLoading={isLoading}/>
                <StatCard title="Win Rate" value={`${todayStats.winRate.toFixed(1)}%`} icon={<BarChart2 style={{width:13,height:13}}/>} trend={todayStats.winRate>50?'up':'down'} isLoading={isLoading}/>
                <div style={{height:'100%'}}><RealtimeClock/></div>
              </div>
              <ProfitCard todayProfit={todayStats.profit} isLoading={isLoading}/>
              <Card style={{padding:12}}><ChartCard assetSymbol={settings.assetSymbol} height={220}/></Card>
            </div>
            <div style={{display:'flex',flexDirection:'column',gap:g}}>
              <div style={{minHeight:180}}><SchedulePanel schedules={settings.schedules} onOpenModal={()=>setIsModalOpen(true)} isDisabled={botStatus.isRunning&&!botStatus.isPaused} maxCount={10}/></div>
              <OrderSettingsCard settings={settings} onChange={setSettings} isDisabled={botStatus.isRunning&&!botStatus.isPaused} assets={assets}/>
              <BotControlCard status={botStatus} onStart={handleStart} onPause={handlePause} onStop={handleStop} isLoading={isActionLoad} canStart={canStart} errorMessage={error||undefined}/>
            </div>
          </div>

          {/* ── MOBILE ── */}
          <div className="md:hidden" style={{display:'flex',flexDirection:'column',gap:g}}>
            <ProfitCard todayProfit={todayStats.profit} isLoading={isLoading}/>
            <div style={{display:'grid',gridTemplateColumns:'3fr 2fr',gap:g,alignItems:'stretch'}}>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                <RealtimeClockCompact/>
                <Card style={{padding:10,flex:1}}>
                  <ChartCard assetSymbol={settings.assetSymbol} height={110}/>
                  {settings.assetSymbol&&<p style={{fontFamily:'var(--font-mono)',fontSize:10,color:'rgba(234,247,242,.58)',textAlign:'center',marginTop:5}}>{settings.assetSymbol}</p>}
                </Card>
              </div>
              <SchedulePanel schedules={settings.schedules} onOpenModal={()=>setIsModalOpen(true)} isDisabled={botStatus.isRunning&&!botStatus.isPaused} maxCount={10}/>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:g}}>
              <StatCard title="Eksekusi" value={todayStats.executions} icon={<Activity style={{width:12,height:12}}/>} isLoading={isLoading}/>
              <StatCard title="Win Rate" value={`${todayStats.winRate.toFixed(1)}%`} icon={<BarChart2 style={{width:12,height:12}}/>} trend={todayStats.winRate>50?'up':'down'} isLoading={isLoading}/>
            </div>
            <OrderSettingsCard settings={settings} onChange={setSettings} isDisabled={botStatus.isRunning&&!botStatus.isPaused} assets={assets}/>
            <BotControlCard status={botStatus} onStart={handleStart} onPause={handlePause} onStop={handleStop} isLoading={isActionLoad} canStart={canStart} errorMessage={error||undefined}/>
          </div>
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