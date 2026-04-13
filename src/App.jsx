import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, Clock, MessageSquare, Mail, LayoutDashboard, Terminal, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, Zap, Loader2, Sparkles, TrendingUp, PenSquare, RefreshCw, AlertOctagon, Info, Pause, Play, Filter, Copy, Check, X, BellRing, Pin, PinOff, ChevronDown, ChevronUp, Search, History, Maximize2, Minimize2, Download, Sun, Moon, Tag, EyeOff, Eye, BarChart2, GitCompare, Timer, Gauge, Command, Zap as ZapIcon, TrendingDown, Radio, Pencil, StickyNote, CornerDownLeft, SendHorizonal } from 'lucide-react';
import { rawDataStream, getHeartbeatDigest } from './mockData';

// ─── THEME CONTEXT ────────────────────────────────────────────────────────────
const ThemeContext = React.createContext('dark');

// ─── SOURCE ICONS ─────────────────────────────────────────────────────────────
const getSourceIcon = (type) => {
  switch(type) {
    case 'slack': return <MessageSquare className="w-4 h-4 text-pink-400" />;
    case 'email': return <Mail className="w-4 h-4 text-blue-400" />;
    case 'jira': return <LayoutDashboard className="w-4 h-4 text-blue-500" />;
    case 'system': return <Terminal className="w-4 h-4 text-emerald-400" />;
    default: return <Activity className="w-4 h-4 text-slate-400" />;
  }
};

// ─── STATUS BADGE ─────────────────────────────────────────────────────────────
const getStatusBadge = (status, text) => {
  switch(status) {
    case 'healthy': return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] uppercase font-semibold tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
        {text}
      </span>
    );
    case 'watch': return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[10px] uppercase font-semibold tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        {text}
      </span>
    );
    case 'risk': return (
      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] uppercase font-semibold tracking-wider">
        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse"></span>
        {text}
      </span>
    );
    default: return null;
  }
};

// ─── SENTIMENT ────────────────────────────────────────────────────────────────
const RISK_KEYWORDS = ['blocked', 'failure', 'risk', 'urgent', 'delay', 'escalation', 'silent failure', 'slipping'];
const POSITIVE_KEYWORDS = ['resolved', 'cleared', 'success', 'completed', 'great', 'working', 'upgrade', 'expansion', 'on-track', 'processed'];

const getSentiment = (text) => {
  const lower = text.toLowerCase();
  if (RISK_KEYWORDS.some(k => lower.includes(k))) return 'critical';
  if (POSITIVE_KEYWORDS.some(k => lower.includes(k))) return 'positive';
  return 'neutral';
};

// ─── URGENCY SCORE (1–10) ────────────────────────────────────────────────────
const getUrgencyScore = (item) => {
  let score = 3; // baseline
  const lower = item.text.toLowerCase();
  // source weight
  if (item.type === 'system') score += 3;
  else if (item.type === 'email') score += 1;
  // risk keyword hits
  const riskHits = RISK_KEYWORDS.filter(k => lower.includes(k)).length;
  score += riskHits * 2;
  // positive keywords reduce urgency
  const positiveHits = POSITIVE_KEYWORDS.filter(k => lower.includes(k)).length;
  score -= positiveHits * 1;
  return Math.min(10, Math.max(1, score));
};

const UrgencyBadge = ({ score }) => {
  const flames = score >= 8 ? 3 : score >= 5 ? 2 : score >= 3 ? 1 : 0;
  const color  = score >= 8 ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
               : score >= 5 ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
               : 'text-slate-500 bg-white/[0.03] border-white/[0.06]';
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold border ${color}`}>
      {'🔥'.repeat(flames) || '·'}
      <span className="font-mono">{score}</span>
    </span>
  );
};

const SentimentBadge = ({ text }) => {
  const s = getSentiment(text);
  if (s === 'critical') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">⚑ Critical</span>;
  if (s === 'positive') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">↑ Positive</span>;
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-slate-500/10 text-slate-500 border border-slate-500/20">– Neutral</span>;
};

// ─── WATCHLIST ─────────────────────────────────────────────────────────────────
const getWatchlistMatch = (text, watchlist) => {
  if (!watchlist.length) return null;
  const lower = text.toLowerCase();
  return watchlist.find(w => lower.includes(w.toLowerCase())) || null;
};

const WatchlistBadge = ({ match }) => (
  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-violet-500/10 text-violet-300 border border-violet-500/20">
    👁 {match}
  </span>
);

// ─── KEYWORD HIGHLIGHT ────────────────────────────────────────────────────────
const ALL_HIGHLIGHT_KEYWORDS = [
  ...RISK_KEYWORDS.map(k => ({ k, type: 'risk' })),
  ...POSITIVE_KEYWORDS.map(k => ({ k, type: 'positive' })),
];

const HighlightedText = ({ text, baseClass }) => {
  const pattern = new RegExp(`(${ALL_HIGHLIGHT_KEYWORDS.map(({ k }) => k.replace(/[-/\\^$*+?.()|[\]{}]/g, '\\$&')).join('|')})`, 'gi');
  const parts = text.split(pattern);
  return (
    <p className={baseClass}>
      {parts.map((part, i) => {
        const match = ALL_HIGHLIGHT_KEYWORDS.find(({ k }) => k.toLowerCase() === part.toLowerCase());
        if (!match) return part;
        return match.type === 'risk'
          ? <mark key={i} className="bg-rose-500/15 text-rose-300 rounded px-0.5 not-italic font-semibold">{part}</mark>
          : <mark key={i} className="bg-emerald-500/15 text-emerald-300 rounded px-0.5 not-italic font-semibold">{part}</mark>;
      })}
    </p>
  );
};

// ─── ALERT TOAST ──────────────────────────────────────────────────────────────
function AlertToast({ toasts, onDismiss }) {
  if (!toasts.length) return null;
  return (
    <div className="fixed top-5 right-5 z-[100] flex flex-col gap-3 pointer-events-none">
      {toasts.map(t => (
        <div
          key={t.id}
          className="pointer-events-auto flex items-start gap-3 px-4 py-3.5 rounded-xl bg-rose-950 border border-rose-500/40 shadow-2xl shadow-rose-900/30 animate-in slide-in-from-right-4 fade-in duration-300 max-w-sm"
        >
          <div className="mt-0.5 shrink-0 p-1.5 rounded-md bg-rose-500/20 border border-rose-500/30">
            <BellRing className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-widest text-rose-400 mb-0.5">Critical Signal</p>
            <p className="text-xs text-rose-100/90 leading-relaxed font-light">{t.text}</p>
            <p className="text-[10px] text-rose-500/70 mt-1 font-mono">{t.source} · {t.time}</p>
          </div>
          <button
            onClick={() => onDismiss(t.id)}
            className="shrink-0 mt-0.5 p-1 rounded hover:bg-rose-500/20 text-rose-500 hover:text-rose-300 transition-colors"
          >
            <X className="w-3 h-3" />
          </button>
        </div>
      ))}
    </div>
  );
}

// ─── FEATURE 1: LIVE TICKER COMPONENT ─────────────────────────────────────────
function LiveTicker({ count, critical }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.03] border border-white/[0.06]">
      <span className="relative flex h-2 w-2">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
      </span>
      <span className="text-[10px] font-mono font-bold text-slate-400">
        <span className="text-white">{count}</span> signals live
        {critical > 0 && (
          <span className="ml-2 text-rose-400">· {critical} critical</span>
        )}
      </span>
    </div>
  );
}

// ─── FEATURE 3: SIGNAL TAG BADGE ──────────────────────────────────────────────
const TAG_CONFIG = {
  'action': { label: 'Action Required', bg: 'bg-rose-500/10', border: 'border-rose-500/30', text: 'text-rose-400' },
  'fyi': { label: 'FYI', bg: 'bg-blue-500/10', border: 'border-blue-500/30', text: 'text-blue-400' },
  'bd': { label: 'BD', bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400' },
};

function SignalTagBadge({ tag }) {
  if (!tag) return null;
  const cfg = TAG_CONFIG[tag];
  return (
    <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest ${cfg.bg} ${cfg.text} border ${cfg.border}`}>
      <Tag className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

// ─── FEATURE 7: SIGNAL HEATMAP ────────────────────────────────────────────────
function SignalHeatmap({ stream }) {
  const buckets = Array.from({ length: 10 }, (_, i) => ({ idx: i, count: 0 }));
  stream.forEach((_, i) => {
    const bucket = Math.floor((i / stream.length) * 10);
    if (buckets[Math.min(bucket, 9)]) buckets[Math.min(bucket, 9)].count++;
  });
  const max = Math.max(...buckets.map(b => b.count), 1);
  return (
    <div className="flex items-end gap-0.5 h-6">
      {buckets.map((b, i) => (
        <div
          key={i}
          className="flex-1 rounded-sm bg-indigo-500 transition-all duration-500"
          style={{ height: `${Math.max(10, (b.count / max) * 100)}%`, opacity: 0.2 + (b.count / max) * 0.8 }}
          title={`${b.count} signals`}
        />
      ))}
    </div>
  );
}

// ─── ANIMATED 3D BACKGROUND ─────────────────────────────────────────────────
function AnimatedBackground() {
  return (
    <>
      <div className="orb orb-1" />
      <div className="orb orb-2" />
      <div className="orb orb-3" />
      <div className="orb orb-4" />
      <div className="mesh-grid" />
    </>
  );
}

// ─── CARD 3D TILT WRAPPER COMPONENT ──────────────────────────────────────────────────────
// Using a component (not a hook) to avoid calling hooks inside .map()
function Card3D({ children, strength = 6, className = '' }) {
  const ref = useRef(null);
  const handleMouseMove = (e) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const dx = (e.clientX - rect.left - rect.width  / 2) / (rect.width  / 2);
    const dy = (e.clientY - rect.top  - rect.height / 2) / (rect.height / 2);
    ref.current.style.transform =
      `perspective(700px) rotateY(${dx * strength}deg) rotateX(${-dy * strength}deg) translateZ(6px) scale(1.01)`;
  };
  const handleMouseLeave = () => {
    if (!ref.current) return;
    ref.current.style.transform = 'perspective(700px) rotateY(0deg) rotateX(0deg) translateZ(0) scale(1)';
  };
  return (
    <div
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`card-3d ${className}`}
    >
      {children}
    </div>
  );
}

// ─── FEATURE 13: SIGNAL RADAR ────────────────────────────────────────────────
const RADAR_SOURCES = ['slack', 'email', 'jira', 'system'];
const RADAR_COLORS  = { slack:'#ec4899', email:'#60a5fa', jira:'#818cf8', system:'#34d399' };

function SignalRadar({ stream }) {
  const SIZE = 120;
  const C    = SIZE / 2; // centre
  const R    = 38;       // max radius

  const counts = useMemo(() => {
    const totals = {};
    RADAR_SOURCES.forEach(s => { totals[s] = stream.filter(x => x.type === s).length; });
    return totals;
  }, [stream]);

  const urgencyBySource = useMemo(() => {
    const scores = {};
    RADAR_SOURCES.forEach(src => {
      const items = stream.filter(x => x.type === src);
      scores[src] = items.length ? items.reduce((a, x) => a + getUrgencyScore(x), 0) / items.length : 0;
    });
    return scores;
  }, [stream]);

  const maxCount = Math.max(...Object.values(counts), 1);

  // Grid hex levels
  const gridLevels = [0.33, 0.66, 1];

  const axisPoints = (lvl) => RADAR_SOURCES.map((_, i) => {
    const angle = (i / RADAR_SOURCES.length) * Math.PI * 2 - Math.PI / 2;
    return { x: C + Math.cos(angle) * R * lvl, y: C + Math.sin(angle) * R * lvl };
  });

  const dataPoints = RADAR_SOURCES.map((src, i) => {
    const angle = (i / RADAR_SOURCES.length) * Math.PI * 2 - Math.PI / 2;
    const r = (counts[src] / maxCount) * R;
    return { x: C + Math.cos(angle) * r, y: C + Math.sin(angle) * r, src };
  });

  const labelPoints = RADAR_SOURCES.map((src, i) => {
    const angle = (i / RADAR_SOURCES.length) * Math.PI * 2 - Math.PI / 2;
    return { x: C + Math.cos(angle) * (R + 13), y: C + Math.sin(angle) * (R + 13), src };
  });

  const sweepPath = RADAR_SOURCES.map((src, i) => {
    const angle = (i / RADAR_SOURCES.length) * Math.PI * 2 - Math.PI / 2;
    const r = (urgencyBySource[src] / 10) * R;
    return `${C + Math.cos(angle) * r},${C + Math.sin(angle) * r}`;
  }).join(' ');

  const polygon = dataPoints.map(p => `${p.x},${p.y}`).join(' ');

  if (stream.length === 0) return (
    <div className="flex items-center justify-center w-[120px] h-[120px]">
      <span className="text-[9px] text-slate-700 font-mono uppercase tracking-widest">awaiting signals</span>
    </div>
  );

  return (
    <div className="relative" title="Signal Radar — source distribution &amp; urgency posture">
      <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`} overflow="visible">
        {/* --- grid rings --- */}
        {gridLevels.map(lvl => (
          <polygon
            key={lvl}
            points={axisPoints(lvl).map(p => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(99,102,241,0.08)"
            strokeWidth="1"
          />
        ))}
        {/* --- axis lines --- */}
        {RADAR_SOURCES.map((_, i) => {
          const angle = (i / RADAR_SOURCES.length) * Math.PI * 2 - Math.PI / 2;
          return (
            <line
              key={i}
              x1={C} y1={C}
              x2={C + Math.cos(angle) * R}
              y2={C + Math.sin(angle) * R}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          );
        })}
        {/* --- urgency sweep (secondary polygon) --- */}
        <polygon
          points={sweepPath}
          fill="rgba(244,63,94,0.07)"
          stroke="rgba(244,63,94,0.25)"
          strokeWidth="1"
          strokeDasharray="4 2"
          className="radar-pulse"
        />
        {/* --- data polygon --- */}
        <polygon
          points={polygon}
          fill="rgba(99,102,241,0.18)"
          stroke="rgba(99,102,241,0.7)"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        {/* --- data dots --- */}
        {dataPoints.map(p => (
          <circle key={p.src} cx={p.x} cy={p.y} r="3" fill={RADAR_COLORS[p.src]} opacity="0.9">
            <animate attributeName="r" values="3;3.8;3" dur="2s" repeatCount="indefinite" />
          </circle>
        ))}
        {/* --- labels --- */}
        {labelPoints.map(p => (
          <text
            key={p.src}
            x={p.x} y={p.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize="5.5"
            fontFamily="'Inter', monospace"
            fontWeight="600"
            fill={RADAR_COLORS[p.src]}
            opacity="0.8"
          >
            {p.src}
          </text>
        ))}
        {/* --- centre dot --- */}
        <circle cx={C} cy={C} r="2" fill="rgba(99,102,241,0.5)" />
      </svg>
      {/* legend */}
      <p className="text-[8px] font-mono text-slate-600 text-center mt-0.5 uppercase tracking-widest">Signal Radar</p>
    </div>
  );
}

// ─── FEATURE 12: SIGNAL ANNOTATIONS ────────────────────────────────────────
function SignalNoteEditor({ itemId, notes, onSave, onClose }) {
  const [draft, setDraft] = useState(notes[itemId] || '');
  const taRef = useRef(null);

  useEffect(() => { setTimeout(() => taRef.current?.focus(), 30); }, []);

  const handleKey = (e) => {
    if (e.key === 'Escape') { onClose(); }
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { onSave(itemId, draft); onClose(); }
  };

  return (
    <div className="mt-3 rounded-lg border border-amber-500/25 bg-amber-500/[0.04] overflow-hidden">
      <div className="flex items-center gap-2 px-3 py-1.5 border-b border-amber-500/15">
        <StickyNote className="w-3 h-3 text-amber-400" />
        <span className="text-[9px] font-bold uppercase tracking-widest text-amber-400">Private Note</span>
        <span className="ml-auto text-[9px] text-slate-600 font-mono">Ctrl+↵ save · Esc cancel</span>
      </div>
      <textarea
        ref={taRef}
        value={draft}
        onChange={e => setDraft(e.target.value)}
        onKeyDown={handleKey}
        placeholder="Add context, next steps, or observations…"
        rows={2}
        className="w-full bg-transparent px-3 py-2 text-xs text-amber-100/80 placeholder-amber-900/60 resize-none focus:outline-none leading-relaxed"
      />
      <div className="flex items-center gap-2 px-3 py-1.5 border-t border-amber-500/15">
        <button
          onClick={() => { onSave(itemId, draft); onClose(); }}
          className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded bg-amber-500/20 text-amber-300 border border-amber-500/20 hover:bg-amber-500/30 transition-colors"
        >
          <Check className="w-2.5 h-2.5" /> Save
        </button>
        {notes[itemId] && (
          <button
            onClick={() => { onSave(itemId, ''); onClose(); }}
            className="flex items-center gap-1 text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded text-slate-500 hover:text-rose-400 transition-colors"
          >
            <X className="w-2.5 h-2.5" /> Clear
          </button>
        )}
        <button onClick={onClose} className="ml-auto text-[9px] text-slate-600 hover:text-slate-300 transition-colors">Cancel</button>
      </div>
    </div>
  );
}

// ─── FEATURE 11: SIGNAL VELOCITY TIMELINE ────────────────────────────────────
const SOURCE_COLORS = {
  slack:  { bar: '#ec4899', bg: 'rgba(236,72,153,0.15)', label: 'text-pink-400' },
  email:  { bar: '#60a5fa', bg: 'rgba(96,165,250,0.15)',  label: 'text-blue-400' },
  jira:   { bar: '#3b82f6', bg: 'rgba(59,130,246,0.15)',  label: 'text-blue-500' },
  system: { bar: '#34d399', bg: 'rgba(52,211,153,0.15)',  label: 'text-emerald-400' },
};

function SignalVelocityTimeline({ stream, open, onToggle, mutedSources }) {
  // Bucket signals into 30-second slots (max 12 buckets = last 6 minutes)
  const BUCKET_MS = 30_000;
  const NUM_BUCKETS = 12;

  const buckets = useMemo(() => {
    const now = Date.now();
    const slots = Array.from({ length: NUM_BUCKETS }, (_, i) => ({
      start: now - (NUM_BUCKETS - i) * BUCKET_MS,
      end:   now - (NUM_BUCKETS - i - 1) * BUCKET_MS,
      by: { slack: 0, email: 0, jira: 0, system: 0 },
      total: 0,
    }));
    // Since stream items have a human-readable .time string (not full timestamp),
    // we distribute by insertion order as a proxy for recency
    const recencyFraction = stream.length > 0
      ? stream.map((_, i) => i / stream.length)
      : [];
    stream.forEach((item, i) => {
      const fraction = recencyFraction[i];
      const bucketIdx = Math.min(Math.floor(fraction * NUM_BUCKETS), NUM_BUCKETS - 1);
      if (slots[bucketIdx] && SOURCE_COLORS[item.type]) {
        slots[bucketIdx].by[item.type] = (slots[bucketIdx].by[item.type] || 0) + 1;
        slots[bucketIdx].total++;
      }
    });
    return slots;
  }, [stream]);

  const maxTotal = Math.max(...buckets.map(b => b.total), 1);
  const lastBucket = buckets[NUM_BUCKETS - 1];
  const prevBucket = buckets[NUM_BUCKETS - 2];
  const isSurging = lastBucket.total > 0 && lastBucket.total >= prevBucket.total * 1.5 && lastBucket.total >= 2;
  const isCooling = lastBucket.total === 0 && prevBucket.total > 0;
  const totalRecentCritical = stream.filter(s => getSentiment(s.text) === 'critical').length;

  const velocityLabel = isSurging
    ? `⚡ Surge detected — ${lastBucket.total} signals in last 30s`
    : isCooling
    ? '✓ Signal tempo cooling'
    : `${stream.length} signals captured`;

  const velocityColor = isSurging ? 'text-rose-400' : isCooling ? 'text-emerald-400' : 'text-slate-500';

  return (
    <div className={`rounded-xl border overflow-hidden transition-all ${
      open ? 'border-indigo-500/20 bg-indigo-500/[0.02]' : 'border-white/[0.05]'
    }`}>
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-white/[0.03] transition-colors"
      >
        <span className="flex items-center gap-2">
          <Radio className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">Velocity Timeline</span>
          {isSurging && (
            <span className="px-1.5 py-0 rounded bg-rose-500/20 text-rose-300 font-mono text-[9px] border border-rose-500/20 animate-pulse">SURGE</span>
          )}
        </span>
        {open ? <ChevronUp className="w-3 h-3 text-indigo-400/60" /> : <ChevronDown className="w-3 h-3 text-slate-600" />}
      </button>

      {open && (
        <div className="px-3 pb-3 space-y-2">
          {/* Velocity label */}
          <p className={`text-[9px] font-mono font-bold tracking-widest uppercase ${velocityColor}`}>
            {velocityLabel}
          </p>

          {/* Stacked bar chart */}
          <div className="flex items-end gap-px h-12" title="Signal velocity over time (30s buckets)">
            {buckets.map((bucket, i) => {
              const heightPct = maxTotal > 0 ? (bucket.total / maxTotal) * 100 : 0;
              const isLatest = i === NUM_BUCKETS - 1;
              return (
                <div
                  key={i}
                  className={`relative flex-1 flex flex-col-reverse rounded-sm overflow-hidden transition-all duration-700 ${
                    isLatest ? 'ring-1 ring-indigo-500/30' : ''
                  }`}
                  style={{ height: `${Math.max(4, heightPct)}%`, backgroundColor: 'rgba(255,255,255,0.03)' }}
                  title={`${bucket.total} signal${bucket.total !== 1 ? 's' : ''}`}
                >
                  {Object.entries(bucket.by).map(([src, cnt]) => {
                    if (!cnt || mutedSources?.has(src)) return null;
                    const frac = cnt / Math.max(bucket.total, 1);
                    return (
                      <div
                        key={src}
                        style={{
                          height: `${frac * 100}%`,
                          backgroundColor: SOURCE_COLORS[src]?.bar || '#6366f1',
                          opacity: isLatest ? 1 : 0.55,
                        }}
                        className="transition-all duration-500"
                      />
                    );
                  })}
                </div>
              );
            })}
          </div>

          {/* X-axis labels */}
          <div className="flex justify-between">
            <span className="text-[8px] text-slate-700 font-mono">−6m</span>
            <span className="text-[8px] text-slate-700 font-mono">−3m</span>
            <span className="text-[8px] text-indigo-500 font-mono font-bold">now</span>
          </div>

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap pt-1 border-t border-white/[0.04]">
            {Object.entries(SOURCE_COLORS).map(([src, cfg]) => {
              const cnt = stream.filter(s => s.type === src).length;
              const isMuted = mutedSources?.has(src);
              return (
                <span key={src} className={`flex items-center gap-1 text-[9px] font-mono ${isMuted ? 'opacity-30' : ''} ${cfg.label}`}>
                  <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: cfg.bar }} />
                  {src} <span className="text-slate-600">({cnt})</span>
                </span>
              );
            })}
            {totalRecentCritical > 0 && (
              <span className="ml-auto text-[9px] font-bold text-rose-400 flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
                {totalRecentCritical} critical
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── FEATURE 8: DIGEST CONFIDENCE SCORE ──────────────────────────────────────
function DigestConfidenceScore({ digest }) {
  if (!digest) return null;
  const highCount = digest.focus.filter(f => f.confidence === 'High' || f.confidence === 'Very High').length;
  const score = Math.round((highCount / Math.max(digest.focus.length, 1)) * 100);
  const color = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-amber-400' : 'text-rose-400';
  const barColor = score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-500' : 'bg-rose-500';
  return (
    <div className="flex items-center gap-3 px-4 py-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05]">
      <Gauge className="w-3.5 h-3.5 text-slate-500 shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between items-center mb-1">
          <span className="text-[9px] font-bold uppercase tracking-widest text-slate-500">Digest Confidence</span>
          <span className={`text-[11px] font-bold font-mono ${color}`}>{score}%</span>
        </div>
        <div className="h-1 rounded-full bg-white/5 overflow-hidden">
          <div className={`h-full rounded-full ${barColor} transition-all duration-700`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}

// ─── FEATURE 9: WHAT'S CHANGED DIFF ──────────────────────────────────────────
function DigestDiff({ current, previous }) {
  if (!current || !previous) return null;

  const prevStatuses = {};
  previous.projects.forEach(p => { prevStatuses[p.name] = p.status; });

  const changes = current.projects
    .filter(p => prevStatuses[p.name] && prevStatuses[p.name] !== p.status)
    .map(p => ({
      name: p.name,
      from: prevStatuses[p.name],
      to: p.status,
    }));

  const newDeltas = current.globalDeltas.filter(d => !previous.globalDeltas.includes(d));

  if (!changes.length && !newDeltas.length) return null;

  const statusColor = { risk: 'text-rose-400', watch: 'text-amber-400', healthy: 'text-emerald-400' };

  return (
    <div className="mb-6 p-4 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.03]">
      <h4 className="text-[10px] font-bold uppercase tracking-widest text-indigo-300 mb-3 flex items-center gap-2">
        <GitCompare className="w-3 h-3" /> What Changed Since Last Digest
      </h4>
      <div className="space-y-2">
        {changes.map((c, i) => (
          <div key={i} className="flex items-center gap-2 text-xs">
            <span className="text-slate-300 font-semibold">{c.name}</span>
            <span className={`font-bold ${statusColor[c.from]}`}>{c.from}</span>
            <ArrowRight className="w-3 h-3 text-slate-600" />
            <span className={`font-bold ${statusColor[c.to]}`}>{c.to}</span>
          </div>
        ))}
        {newDeltas.map((d, i) => (
          <div key={`d-${i}`} className="flex items-start gap-2 text-xs">
            <span className="text-indigo-400 mt-0.5 shrink-0">+</span>
            <span className="text-slate-400">{d}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── FEATURE 10: AUTO-REFRESH COUNTDOWN ───────────────────────────────────────
function AutoRefreshCountdown({ onRefresh, isGenerating, digest }) {
  const [seconds, setSeconds] = useState(60);
  const [active, setActive] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (seconds <= 0) {
      onRefresh();
      setSeconds(60);
      return;
    }
    const t = setTimeout(() => setSeconds(s => s - 1), 1000);
    return () => clearTimeout(t);
  }, [active, seconds, onRefresh]);

  return (
    <div className="flex items-center gap-2">
      <button
        onClick={() => setActive(a => !a)}
        className={`flex items-center gap-1.5 text-[9px] font-bold tracking-widest uppercase px-2.5 py-1.5 rounded-md border transition-all ${
          active
            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
            : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:text-slate-300'
        }`}
        title={active ? 'Disable auto-refresh' : 'Enable auto-refresh every 60s'}
      >
        <Timer className="w-3 h-3" />
        {active ? `Auto ${seconds}s` : 'Auto'}
      </button>
    </div>
  );
}

// ─── COMMAND PALETTE ─────────────────────────────────────────────────────────
function CommandPalette({ open, onClose, stream, onGenerate, onTogglePause, isPaused, onToggleFocus, onToggleTheme, theme, onFilterSource, onExport, digest, onToggleVelocity }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const staticActions = useMemo(() => [
    { id: 'generate',     icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,         label: 'Generate Intelligence Digest',        group: 'Actions',  action: () => { onGenerate(); onClose(); } },
    { id: 'pause',        icon: isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />, label: isPaused ? 'Resume Signal Stream' : 'Pause Signal Stream', group: 'Actions', action: () => { onTogglePause(); onClose(); } },
    { id: 'focus',        icon: <Maximize2 className="w-3.5 h-3.5 text-slate-400" />,         label: 'Toggle Focus Mode',                   group: 'Actions',  action: () => { onToggleFocus(); onClose(); } },
    { id: 'velocity',     icon: <Radio className="w-3.5 h-3.5 text-indigo-400" />,             label: 'Toggle Velocity Timeline',            group: 'Actions',  action: () => { onToggleVelocity(); onClose(); } },
    { id: 'theme',        icon: theme === 'dark' ? <Sun className="w-3.5 h-3.5 text-yellow-400" /> : <Moon className="w-3.5 h-3.5 text-indigo-400" />, label: `Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Theme`, group: 'Actions', action: () => { onToggleTheme(); onClose(); } },
    { id: 'export',       icon: <Download className="w-3.5 h-3.5 text-slate-400" />,          label: 'Export Digest as Markdown',           group: 'Actions',  action: () => { onExport(); onClose(); } },
    { id: 'filter-all',   icon: <Filter className="w-3.5 h-3.5 text-slate-400" />,            label: 'Filter: Show All Sources',            group: 'Filters',  action: () => { onFilterSource('all'); onClose(); } },
    { id: 'filter-slack', icon: <MessageSquare className="w-3.5 h-3.5 text-pink-400" />,      label: 'Filter: Slack Only',                  group: 'Filters',  action: () => { onFilterSource('slack'); onClose(); } },
    { id: 'filter-email', icon: <Mail className="w-3.5 h-3.5 text-blue-400" />,               label: 'Filter: Email Only',                  group: 'Filters',  action: () => { onFilterSource('email'); onClose(); } },
    { id: 'filter-jira',  icon: <LayoutDashboard className="w-3.5 h-3.5 text-blue-500" />,    label: 'Filter: Jira Only',                   group: 'Filters',  action: () => { onFilterSource('jira'); onClose(); } },
    { id: 'filter-sys',   icon: <Terminal className="w-3.5 h-3.5 text-emerald-400" />,        label: 'Filter: System Alerts Only',          group: 'Filters',  action: () => { onFilterSource('system'); onClose(); } },
  ], [isPaused, theme, digest]);

  const signalResults = useMemo(() => {
    if (!query.trim() || query.length < 2) return [];
    return stream
      .filter(s => `${s.text} ${s.author} ${s.source}`.toLowerCase().includes(query.toLowerCase()))
      .slice(0, 5)
      .map(s => ({
        id: `sig-${s.id}`,
        icon: getSourceIcon(s.type),
        label: s.text.length > 72 ? s.text.slice(0, 72) + '…' : s.text,
        sublabel: `${s.source} · ${s.author} · ${s.time}`,
        group: 'Live Signals',
        action: onClose,
      }));
  }, [query, stream]);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const actions = q ? staticActions.filter(a => a.label.toLowerCase().includes(q)) : staticActions;
    return [...actions, ...signalResults];
  }, [query, staticActions, signalResults]);

  useEffect(() => { setSelected(0); }, [filtered.length]);

  useEffect(() => {
    if (open) { setTimeout(() => inputRef.current?.focus(), 30); setQuery(''); setSelected(0); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected(s => Math.min(s + 1, filtered.length - 1)); }
      if (e.key === 'ArrowUp')   { e.preventDefault(); setSelected(s => Math.max(s - 1, 0)); }
      if (e.key === 'Enter')     { e.preventDefault(); filtered[selected]?.action(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, filtered, selected]);

  if (!open) return null;

  const groups = [...new Set(filtered.map(f => f.group))];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-xl mx-4 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl shadow-black/60 overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-white/[0.06]">
          <Command className="w-4 h-4 text-indigo-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search actions or signals…"
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
          />
          <kbd className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-slate-500">ESC</kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 && (
            <p className="text-center text-xs text-slate-600 py-8">No results for "{query}"</p>
          )}
          {groups.map(group => (
            <div key={group}>
              <p className="px-4 pt-3 pb-1.5 text-[9px] font-bold uppercase tracking-widest text-slate-600">{group}</p>
              {filtered.filter(f => f.group === group).map((item) => {
                const globalIdx = filtered.indexOf(item);
                return (
                  <button
                    key={item.id}
                    onClick={item.action}
                    onMouseEnter={() => setSelected(globalIdx)}
                    className={`w-full flex items-start gap-3 px-4 py-2.5 transition-colors text-left ${
                      selected === globalIdx ? 'bg-indigo-500/15' : 'hover:bg-white/[0.03]'
                    }`}
                  >
                    <span className="mt-0.5 shrink-0">{item.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${ selected === globalIdx ? 'text-white' : 'text-slate-300' }`}>{item.label}</p>
                      {item.sublabel && <p className="text-[10px] text-slate-600 font-mono truncate mt-0.5">{item.sublabel}</p>}
                    </div>
                    {selected === globalIdx && (
                      <kbd className="shrink-0 text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 mt-0.5">↵</kbd>
                    )}
                  </button>
                );
              })}
            </div>
          ))}
        </div>

        {/* Footer hint bar */}
        <div className="flex items-center gap-4 px-4 py-2.5 border-t border-white/[0.06] bg-black/20">
          {[['↑↓', 'Navigate'], ['↵', 'Select'], ['Esc', 'Close']].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5">
              <kbd className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-slate-400">{key}</kbd>
              <span className="text-[9px] text-slate-600 uppercase tracking-widest">{label}</span>
            </span>
          ))}
          <span className="ml-auto text-[9px] text-slate-700 font-mono">{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
        </div>
      </div>
    </div>
  );
}

// ─── FEATURE 14: QUICK REPLY DRAFT GENERATOR ─────────────────────────────────
function generateDraft(item, urgency) {
  const isEmailLike = item.type === 'email';
  const isSlack     = item.type === 'slack';
  const isSystem    = item.type === 'system';
  const sentiment   = getSentiment(item.text);
  const isUrgent    = urgency >= 7;

  if (isEmailLike) {
    return (
      `Subject: Re: ${item.source} — ${isUrgent ? 'Urgent Follow-Up' : 'Acknowledgement'}\n\n` +
      `Hi ${item.author.split(' ')[0]},\n\n` +
      (isUrgent
        ? `I've been flagged on this issue and I'm treating it as a priority. I'd like to connect in the next 30 minutes to align on next steps.\n\n` +
          `Quick context from my end:\n• This has been escalated to the delivery team\n• We're targeting a resolution by EOD\n\nPlease confirm your availability.`
        : `Thanks for the update. I've noted the status and will follow up with the team to ensure this stays on track.\n\nI'll share a progress update within 2 hours.`
      ) +
      `\n\nBest,\n[Your Name]`
    );
  }

  if (isSlack) {
    return (
      isUrgent
        ? `👋 @${item.author.split(' ')[0]} — picking this up now. Looping in the team. Can we jump on a quick call?\n\n` +
          `Flagged for immediate attention: _${item.text.slice(0, 80)}${item.text.length > 80 ? '…' : ''}_\n\n` +
          `:red_circle: Priority: **High** | :clock2: Target: EOD`
        : `Got it, thanks for the heads-up. I'll track this and update by EOD.\n\ncc: @team-leads`
    );
  }

  if (isSystem) {
    return (
      `[INCIDENT RESPONSE LOG]\n` +
      `Time: ${item.time}\n` +
      `Source: ${item.source}\n` +
      `Severity: ${isUrgent ? 'HIGH' : 'MEDIUM'}\n\n` +
      `Summary: ${item.text}\n\n` +
      `Immediate Actions:\n` +
      `1. Notify engineering on-call\n` +
      `2. Assess client impact scope\n` +
      `3. Set ETA and communicate to stakeholders\n\n` +
      `Owner: [Assign]\nETA: [Set]`
    );
  }

  // Jira / default
  return (
    `Re: ${item.source} — Ticket Update\n\n` +
    `Hi team,\n\n` +
    `I've reviewed the latest update from ${item.author}. ` +
    (sentiment === 'critical'
      ? `This looks like a blocker — requesting immediate triage.`
      : `Looks like we're making progress. Keep the momentum going.`) +
    `\n\nPlease update the ticket status and flag any risks by EOD.\n\nThanks`
  );
}

function QuickReplyModal({ item, urgency, onClose }) {
  const [draft, setDraft] = useState(() => generateDraft(item, urgency));
  const [copied, setCopied] = useState(false);
  const isUrgent = urgency >= 7;

  const handleCopy = () => {
    navigator.clipboard.writeText(draft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const typeLabel = { email: 'Email Draft', slack: 'Slack Message', system: 'Incident Log', jira: 'Jira Reply' }[item.type] || 'Draft';
  const typeColor = { email: 'text-blue-400 border-blue-500/20 bg-blue-500/10', slack: 'text-pink-400 border-pink-500/20 bg-pink-500/10', system: 'text-amber-400 border-amber-500/20 bg-amber-500/10', jira: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10' }[item.type] || 'text-slate-400 border-white/10 bg-white/5';

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg mx-4 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl shadow-black/70 overflow-hidden flex flex-col"
        style={{ maxHeight: '85vh' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/[0.06]">
          <div className="p-1.5 rounded-md bg-white/5 border border-white/10">
            <CornerDownLeft className="w-3.5 h-3.5 text-indigo-400" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-white tracking-wide">Quick Reply Draft</p>
            <p className="text-[10px] text-slate-500 font-mono mt-0.5 truncate">{item.source} · {item.author}</p>
          </div>
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest border ${typeColor}`}>
            {getSourceIcon(item.type)}
            {typeLabel}
          </span>
          {isUrgent && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse">
              🔥 Urgent
            </span>
          )}
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-white/10 text-slate-500 hover:text-white transition-colors ml-1"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Context strip */}
        <div className="px-5 py-2.5 bg-white/[0.015] border-b border-white/[0.04]">
          <p className="text-[11px] text-slate-500 font-light leading-snug line-clamp-2">
            <span className="text-slate-400 font-semibold">Signal: </span>{item.text}
          </p>
        </div>

        {/* Draft textarea */}
        <div className="flex-1 overflow-hidden p-4">
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            rows={10}
            className="w-full h-full min-h-[180px] bg-white/[0.03] border border-white/[0.08] rounded-xl px-4 py-3 text-xs text-slate-200 placeholder-slate-600 font-mono leading-relaxed resize-none focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all"
            placeholder="Draft will appear here…"
          />
        </div>

        {/* Footer actions */}
        <div className="flex items-center gap-2 px-5 py-3.5 border-t border-white/[0.06] bg-black/20">
          <span className="text-[9px] text-slate-600 font-mono tracking-widest uppercase">Edit before sending · Esc to close</span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={onClose}
              className="text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md text-slate-500 hover:text-slate-200 border border-white/[0.06] hover:bg-white/5 transition-colors"
            >
              Dismiss
            </button>
            <button
              onClick={handleCopy}
              className={`flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest px-3 py-1.5 rounded-md border transition-all ${
                copied
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                  : 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30'
              }`}
            >
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? 'Copied!' : 'Copy Draft'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── FEATURE 15: LIVE ORG RISK GAUGE ─────────────────────────────────────────
function OrgRiskGauge({ stream, watchlist, digest }) {
  const score = useMemo(() => {
    if (!stream.length) return 0;
    // Factor 1: critical signal ratio (0-40 pts)
    const critRatio = stream.filter(s => getSentiment(s.text) === 'critical').length / stream.length;
    const critScore = Math.round(critRatio * 40);
    // Factor 2: average urgency (0-30 pts)
    const avgUrgency = stream.reduce((a, s) => a + getUrgencyScore(s), 0) / stream.length;
    const urgScore = Math.round(((avgUrgency - 1) / 9) * 30);
    // Factor 3: watchlist hit rate (0-20 pts)
    const watchHits = stream.filter(s =>
      watchlist.some(w => `${s.text} ${s.author} ${s.source}`.toLowerCase().includes(w.toLowerCase()))
    ).length;
    const watchScore = Math.round(Math.min(watchHits / Math.max(stream.length, 1), 1) * 20);
    // Factor 4: low confidence penalty from digest (0-10 pts)
    let confPenalty = 0;
    if (digest) {
      const lowConf = digest.focus.filter(f => f.confidence === 'Low' || f.confidence === 'Medium').length;
      confPenalty = Math.round((lowConf / Math.max(digest.focus.length, 1)) * 10);
    }
    return Math.min(100, critScore + urgScore + watchScore + confPenalty);
  }, [stream, watchlist, digest]);

  const prevScore = useRef(score);
  const [displayScore, setDisplayScore] = useState(score);
  const [trending, setTrending] = useState('stable'); // 'up' | 'down' | 'stable'

  useEffect(() => {
    if (score > prevScore.current) setTrending('up');
    else if (score < prevScore.current) setTrending('down');
    else setTrending('stable');
    prevScore.current = score;

    // Animate display score
    const start = displayScore;
    const diff = score - start;
    if (Math.abs(diff) < 1) { setDisplayScore(score); return; }
    let frame = 0;
    const FRAMES = 20;
    const id = setInterval(() => {
      frame++;
      setDisplayScore(Math.round(start + diff * (frame / FRAMES)));
      if (frame >= FRAMES) clearInterval(id);
    }, 30);
    return () => clearInterval(id);
  }, [score]);

  // SVG ring params
  const SIZE = 96;
  const R = 38;
  const C = SIZE / 2;
  const CIRC = 2 * Math.PI * R;
  const dashOffset = CIRC * (1 - displayScore / 100);

  const riskLevel  = displayScore >= 70 ? 'critical' : displayScore >= 40 ? 'elevated' : 'nominal';
  const ringColor  = riskLevel === 'critical' ? '#f43f5e' : riskLevel === 'elevated' ? '#f59e0b' : '#10b981';
  const glowColor  = riskLevel === 'critical' ? 'rgba(244,63,94,0.25)' : riskLevel === 'elevated' ? 'rgba(245,158,11,0.2)' : 'rgba(16,185,129,0.15)';
  const labelColor = riskLevel === 'critical' ? 'text-rose-400' : riskLevel === 'elevated' ? 'text-amber-400' : 'text-emerald-400';
  const bgColor    = riskLevel === 'critical' ? 'bg-rose-500/[0.04] border-rose-500/20' : riskLevel === 'elevated' ? 'bg-amber-500/[0.03] border-amber-500/15' : 'bg-emerald-500/[0.03] border-emerald-500/10';

  const trendIcon = trending === 'up' ? '↑' : trending === 'down' ? '↓' : '–';
  const trendColor = trending === 'up' ? 'text-rose-400' : trending === 'down' ? 'text-emerald-400' : 'text-slate-500';

  const subMetrics = [
    { label: 'Crit %', value: `${stream.length ? Math.round(stream.filter(s => getSentiment(s.text) === 'critical').length / stream.length * 100) : 0}%`, color: 'text-rose-400' },
    { label: 'Avg Urg', value: stream.length ? (stream.reduce((a, s) => a + getUrgencyScore(s), 0) / stream.length).toFixed(1) : '—', color: 'text-amber-400' },
    { label: 'Watch', value: stream.filter(s => watchlist.some(w => `${s.text} ${s.author} ${s.source}`.toLowerCase().includes(w.toLowerCase()))).length, color: 'text-violet-400' },
    { label: 'Signals', value: stream.length, color: 'text-indigo-400' },
  ];

  return (
    <div className={`rounded-2xl border p-4 mb-6 ${bgColor} transition-all duration-700`}
      style={{ boxShadow: `0 0 40px 0 ${glowColor}` }}
    >
      <div className="flex items-center gap-5">
        {/* Ring meter */}
        <div className="relative shrink-0">
          <svg width={SIZE} height={SIZE} viewBox={`0 0 ${SIZE} ${SIZE}`}>
            {/* Track */}
            <circle cx={C} cy={C} r={R} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="7" />
            {/* Filled arc */}
            <circle
              cx={C} cy={C} r={R}
              fill="none"
              stroke={ringColor}
              strokeWidth="7"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              strokeDashoffset={dashOffset}
              transform={`rotate(-90 ${C} ${C})`}
              style={{ transition: 'stroke-dashoffset 0.6s ease, stroke 0.6s ease', filter: `drop-shadow(0 0 6px ${ringColor}88)` }}
              className={riskLevel === 'critical' ? 'risk-ring-pulse' : ''}
            />
            {/* Centre score */}
            <text x={C} y={C - 4} textAnchor="middle" dominantBaseline="middle"
              fontSize="18" fontWeight="800" fontFamily="'Inter', monospace" fill={ringColor}
            >{displayScore}</text>
            <text x={C} y={C + 10} textAnchor="middle" dominantBaseline="middle"
              fontSize="6" fontWeight="600" fontFamily="'Inter', monospace" fill="rgba(255,255,255,0.3)" letterSpacing="1"
            >RISK</text>
          </svg>
        </div>

        {/* Right side */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase tracking-widest ${labelColor}`}>
              {riskLevel === 'critical' ? 'Critical Risk' : riskLevel === 'elevated' ? 'Elevated Risk' : 'Nominal'}
            </span>
            <span className={`text-[10px] font-bold font-mono ${trendColor}`}>{trendIcon}</span>
          </div>
          <p className="text-[10px] text-slate-500 font-light leading-snug mb-3">
            {riskLevel === 'critical'
              ? 'Multiple high-urgency signals detected. Immediate attention required.'
              : riskLevel === 'elevated'
              ? 'Watch-level signals active. Monitor for escalation.'
              : 'Signal posture within acceptable bounds.'}
          </p>
          {/* Sub-metrics row */}
          <div className="grid grid-cols-4 gap-2">
            {subMetrics.map(m => (
              <div key={m.label} className="flex flex-col items-center px-1.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
                <span className={`text-xs font-bold font-mono ${m.color}`}>{m.value}</span>
                <span className="text-[8px] text-slate-600 uppercase tracking-widest mt-0.5">{m.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
function App() {
  const [stream, setStream] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [digest, setDigest] = useState(null);
  const [prevDigest, setPrevDigest] = useState(null);  // Feature 9: diff
  const [activeDraft, setActiveDraft] = useState(null);
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  const [filterSource, setFilterSource] = useState('all');
  const [isCopied, setIsCopied] = useState(false);
  const [alertToasts, setAlertToasts] = useState([]);
  const [pinnedSignals, setPinnedSignals] = useState([]);
  const [pinnedOpen, setPinnedOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [digestHistory, setDigestHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [streamSpeed, setStreamSpeed] = useState('normal');
  const speedRef = useRef(streamSpeed);

  // Feature 1: Theme
  const [theme, setTheme] = useState('dark');

  // Feature 3: Signal tags
  const [signalTags, setSignalTags] = useState({});
  const [showTagMenu, setShowTagMenu] = useState(null);

  // Feature 4: Muted sources
  const [mutedSources, setMutedSources] = useState(new Set());

  // Feature 6: Show diff
  const [showDiff, setShowDiff] = useState(false);

  // Command Palette
  const [paletteOpen, setPaletteOpen] = useState(false);

  // Urgency Priority Sort
  const [prioritySort, setPrioritySort] = useState(false);

  // Feature 11: Velocity Timeline
  const [velocityOpen, setVelocityOpen] = useState(true);

  // Feature 12: Signal Annotations
  const [signalNotes, setSignalNotes] = useState({});
  const [activeNoteId, setActiveNoteId] = useState(null);

  // Feature 14: Quick Reply Drafts
  const [replySignal, setReplySignal] = useState(null);

  const saveNote = useCallback((id, text) => {
    setSignalNotes(prev => {
      const next = { ...prev };
      if (text.trim()) next[id] = text.trim();
      else delete next[id];
      return next;
    });
  }, []);

  // Client Watchlist
  const [watchlist, setWatchlist] = useState(['PharmaTech', 'GlobalBank', 'Acme']);
  const [watchlistOpen, setWatchlistOpen] = useState(false);
  const [watchlistInput, setWatchlistInput] = useState('');

  useEffect(() => { speedRef.current = streamSpeed; }, [streamSpeed]);

  const dismissToast = (id) => setAlertToasts(prev => prev.filter(t => t.id !== id));

  // Live signal counts
  const signalStats = ['slack', 'email', 'jira', 'system'].map(type => ({
    type,
    count: stream.filter(s => s.type === type).length,
  }));
  const totalSignals = stream.length;
  const criticalSignals = stream.filter(s => getSentiment(s.text) === 'critical').length;

  const togglePin = (item) => {
    setPinnedSignals(prev => {
      const alreadyPinned = prev.some(p => p.id === item.id);
      return alreadyPinned ? prev.filter(p => p.id !== item.id) : [item, ...prev];
    });
  };

  // Feature 4: Mute source toggle
  const toggleMute = (source) => {
    setMutedSources(prev => {
      const next = new Set(prev);
      if (next.has(source)) next.delete(source);
      else next.add(source);
      return next;
    });
  };

  // Feature 3: Tag a signal
  const tagSignal = (id, tag) => {
    setSignalTags(prev => ({ ...prev, [id]: tag }));
    setShowTagMenu(null);
  };

  // Feature 8: Drag-to-reorder pinned signals
  const dragItem = useRef(null);
  const dragOver = useRef(null);
  const handleDragStart = (i) => { dragItem.current = i; };
  const handleDragEnter = (i) => { dragOver.current = i; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOver.current === null) return;
    const copy = [...pinnedSignals];
    const [dragged] = copy.splice(dragItem.current, 1);
    copy.splice(dragOver.current, 0, dragged);
    setPinnedSignals(copy);
    dragItem.current = null;
    dragOver.current = null;
  };

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    let index = 0;
    const SPEED_MAP = { slow: 4000, normal: 2000, fast: 800 };
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      const baseItem = rawDataStream[index % rawDataStream.length];
      // Feature 4: skip muted sources
      if (mutedSources.has(baseItem.type)) { index++; return; }
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const currentItem = {
        ...baseItem,
        id: Date.now() + Math.random().toString(),
        time: timeStr
      };
      const isRisk = currentItem.type === 'system' ||
        RISK_KEYWORDS.some(kw => currentItem.text.toLowerCase().includes(kw));
      if (isRisk) {
        const toastId = currentItem.id;
        setAlertToasts(prev => [...prev.slice(-3), { id: toastId, text: currentItem.text, source: currentItem.source, time: timeStr }]);
        setTimeout(() => setAlertToasts(prev => prev.filter(t => t.id !== toastId)), 5000);
      }
      setStream((prev) => {
        const newStream = [...prev, currentItem];
        if (newStream.length > 25) newStream.shift();
        return newStream;
      });
      index++;
    }, SPEED_MAP[streamSpeed]);
    return () => clearInterval(interval);
  }, [streamSpeed, mutedSources]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stream]);

  const handleGenerateHeartbeat = useCallback(() => {
    setIsGenerating(true);
    setTimeout(() => {
      const newDigest = getHeartbeatDigest();
      setPrevDigest(digest);  // Save for diff
      setDigest(newDigest);
      setDigestHistory(prev => [{ ...newDigest, idx: prev.length + 1 }, ...prev].slice(0, 10));
      setIsGenerating(false);
    }, 2400);
  }, [digest]);

  const handleDraftAction = (id) => {
    setActiveDraft(id);
    setTimeout(() => setActiveDraft(null), 2000);
  };

  const handleCopyDigest = () => {
    if (!digest) return;
    const text = `Executive Digest - ${digest.timestamp}\n\n` +
      `Global Deltas:\n${digest.globalDeltas.map(d => '- ' + d).join('\n')}\n\n` +
      `Focus:\n${digest.focus.map(f => `- ${f.client || 'Internal'}: ${f.text} (${f.impact})`).join('\n')}\n`;
    navigator.clipboard.writeText(text);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  // Feature 2: Export digest as Markdown file
  const handleExportMarkdown = () => {
    if (!digest) return;
    const md = `# Executive Digest — ${digest.timestamp}\n\n` +
      `## Risk Posture\n${digest.projects.filter(p => p.status === 'risk').length >= 2 ? '**HIGH**' : 'STABLE'}\n\n` +
      `## Global Deltas\n${digest.globalDeltas.map(d => `- ${d}`).join('\n')}\n\n` +
      `## Focus Areas\n${digest.focus.map(f => `### ${f.client || 'Internal'}\n${f.text}\n- **Impact:** ${f.impact}\n- **Confidence:** ${f.confidence}\n- **Reason:** ${f.reason}\n`).join('\n')}\n\n` +
      `## Project Delivery\n${digest.projects.map(p => `### ${p.name} (${p.client})\n- **Status:** ${p.status}\n- **ETA:** ${p.eta}\n- ${p.summary}\n`).join('\n')}`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `digest-${digest.timestamp.replace(/[: ]/g, '-')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // KEYBOARD SHORTCUTS
  useEffect(() => {
    const handler = (e) => {
      const tag = document.activeElement?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;
      if (e.key === ' ' || e.code === 'Space') { e.preventDefault(); setIsPaused(p => !p); }
      if (e.key === 'g' || e.key === 'G') { if (!digest && stream.length > 0 && !isGenerating) handleGenerateHeartbeat(); }
      if (e.key === 'f' || e.key === 'F') { setFocusMode(f => !f); }
      if (e.key === 't' || e.key === 'T') { setTheme(th => th === 'dark' ? 'light' : 'dark'); }
      if (e.key === 'v' || e.key === 'V') { setVelocityOpen(v => !v); }
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(p => !p); return; }
      if (e.key === 'Escape') { setSearchQuery(''); setShowTagMenu(null); setPaletteOpen(false); setActiveNoteId(null); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [digest, stream.length, isGenerating, handleGenerateHeartbeat]);

  // Theme classes
  const th = {
    bg: theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100',
    text: theme === 'dark' ? 'text-slate-300' : 'text-slate-700',
    panelL: theme === 'dark' ? 'bg-[#050505]' : 'bg-white',
    panelR: theme === 'dark' ? 'bg-[#0B0F19]' : 'bg-slate-50',
    border: theme === 'dark' ? 'border-white/5' : 'border-slate-200',
    card: theme === 'dark' ? 'bg-white/[0.02] border-white/5' : 'bg-white border-slate-200',
    inputBg: theme === 'dark' ? 'bg-white/[0.03] border-white/[0.06]' : 'bg-white border-slate-200',
    muted: theme === 'dark' ? 'text-slate-500' : 'text-slate-400',
  };

  return (
    <ThemeContext.Provider value={theme}>
      <div className={`flex h-screen ${th.bg} ${th.text} font-sans selection:bg-indigo-500/30 relative overflow-hidden`}>
        <AnimatedBackground />
        <AlertToast toasts={alertToasts} onDismiss={dismissToast} />

        {/* Feature 14: Quick Reply Modal */}
        {replySignal && (
          <QuickReplyModal
            item={replySignal}
            urgency={getUrgencyScore(replySignal)}
            onClose={() => setReplySignal(null)}
          />
        )}

        <CommandPalette
          open={paletteOpen}
          onClose={() => setPaletteOpen(false)}
          stream={stream}
          onGenerate={handleGenerateHeartbeat}
          onTogglePause={() => setIsPaused(p => !p)}
          isPaused={isPaused}
          onToggleFocus={() => setFocusMode(f => !f)}
          onToggleTheme={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
          theme={theme}
          onFilterSource={setFilterSource}
          onExport={handleExportMarkdown}
          digest={digest}
          onToggleVelocity={() => setVelocityOpen(v => !v)}
        />

        {/* KEYBOARD SHORTCUT LEGEND */}
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/80 border border-white/[0.06] backdrop-blur pointer-events-none">
          {[['Space','Pause'],['G','Generate'],['F','Focus'],['V','Velocity'],['T','Theme'],['Ctrl+K','Palette'],['R','Reply'],['Esc','Clear']].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5">
              <kbd className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-slate-400">{key}</kbd>
              <span className="text-[9px] text-slate-600 uppercase tracking-widest">{label}</span>
            </span>
          ))}
        </div>

        <div className="absolute top-0 w-full h-[1px] bg-gradient-to-r from-transparent via-indigo-500/40 to-transparent z-50 pointer-events-none" />

        {/* LEFT PANEL */}
        <div className={`flex flex-col glass-panel-l relative z-10 transition-all duration-500 ease-in-out overflow-hidden ${ focusMode ? 'w-0 min-w-0 opacity-0' : 'w-1/2 opacity-100' }`}>
          <div className={`px-8 py-5 flex flex-col gap-4 glass-header z-20`}>
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                <div>
                  <h2 className="text-sm font-semibold text-white flex items-center gap-2 tracking-wide uppercase">
                    <Activity className="w-4 h-4 text-indigo-400" />
                    <span className="gradient-text-indigo">Signal Stream</span>
                  </h2>
                  <p className={`text-xs ${th.muted} mt-1 tracking-wide`}>Intercepting integration events &amp; communications</p>
                </div>
                {/* Feature 13: Signal Radar */}
                <div className="hidden lg:block shrink-0">
                  <SignalRadar stream={stream} />
                </div>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Feature 1: Live Ticker */}
                <LiveTicker count={totalSignals} critical={criticalSignals} />

                {/* Feature 5: Heatmap inline */}
                <div className="w-16 hidden sm:block">
                  <SignalHeatmap stream={stream} />
                </div>

                {/* Feature 1: Theme Toggle */}
                <button
                  onClick={() => setTheme(t => t === 'dark' ? 'light' : 'dark')}
                  title="Toggle theme (T)"
                  className="p-1.5 rounded-md border border-white/[0.06] bg-white/[0.02] text-slate-400 hover:text-white hover:bg-white/[0.08] transition-colors"
                >
                  {theme === 'dark' ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
                </button>

                {/* Speed controls */}
                <div className="flex items-center gap-1 bg-white/[0.02] border border-white/5 rounded-md p-0.5">
                  {['slow','normal','fast'].map(s => (
                    <button key={s} onClick={() => setStreamSpeed(s)}
                      className={`text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded transition-all ${ streamSpeed === s ? 'bg-indigo-500/30 text-indigo-300' : 'text-slate-600 hover:text-slate-400' }`}>{s}</button>
                  ))}
                </div>
                <button
                  onClick={() => setIsPaused(!isPaused)}
                  className={`flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase px-3 py-1.5 rounded-md border transition-colors ${
                    isPaused
                      ? 'bg-amber-500/10 text-amber-500 border-amber-500/20 hover:bg-amber-500/20'
                      : 'bg-white/[0.03] text-emerald-400 border-white/[0.05] hover:bg-white/[0.08]'
                  }`}
                >
                  {isPaused ? (
                    <><Play className="w-3 h-3" /> Paused</>
                  ) : (
                    <><span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span> Streaming</>
                  )}
                </button>
              </div>
            </div>

            {/* LIVE SIGNAL STATS */}
            {totalSignals > 0 && (
              <div className={`flex items-center gap-3 py-2.5 px-3 rounded-lg bg-white/[0.02] border ${th.border}`}>
                <span className={`text-[9px] font-bold uppercase tracking-widest ${th.muted} shrink-0`}>Signal Mix</span>
                <div className="flex items-center gap-2 flex-wrap">
                  {signalStats.map(({ type, count }) => {
                    const pct = totalSignals > 0 ? Math.round((count / totalSignals) * 100) : 0;
                    const colors = {
                      slack:  { bar: 'bg-pink-500',    text: 'text-pink-400' },
                      email:  { bar: 'bg-blue-400',    text: 'text-blue-400' },
                      jira:   { bar: 'bg-blue-600',    text: 'text-blue-500' },
                      system: { bar: 'bg-emerald-500', text: 'text-emerald-400' },
                    }[type];
                    const isMuted = mutedSources.has(type);
                    return (
                      <div key={type} className="flex items-center gap-1.5">
                        {/* Feature 4: Mute source button */}
                        <button
                          onClick={() => toggleMute(type)}
                          title={isMuted ? `Unmute ${type}` : `Mute ${type}`}
                          className={`transition-opacity ${isMuted ? 'opacity-30' : 'opacity-100'}`}
                        >
                          <span className={`text-[9px] font-bold uppercase tracking-widest ${colors.text} flex items-center gap-0.5`}>
                            {isMuted ? <EyeOff className="w-2.5 h-2.5" /> : null}
                            {type}
                          </span>
                        </button>
                        <div className="w-16 h-1 rounded-full bg-white/5 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${colors.bar} transition-all duration-500 ${isMuted ? 'opacity-20' : ''}`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                        <span className={`text-[9px] ${th.muted} font-mono`}>{count}</span>
                      </div>
                    );
                  })}
                </div>
                <span className={`ml-auto text-[9px] font-mono text-slate-700 shrink-0`}>{totalSignals} total</span>
              </div>
            )}

            {/* FILTER BUTTONS */}
            <div className="flex gap-2 flex-wrap">
              {['all', 'slack', 'email', 'jira', 'system'].map(source => {
                const cnt = source === 'all' ? stream.length : stream.filter(s => s.type === source).length;
                const isMuted = source !== 'all' && mutedSources.has(source);
                return (
                  <button
                    key={source}
                    onClick={() => setFilterSource(source)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                      filterSource === source
                        ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                        : 'bg-white/[0.02] text-slate-500 border border-white/5 hover:bg-white/[0.05]'
                    } ${isMuted ? 'opacity-40 line-through' : ''}`}
                  >
                    {source === 'all' && <Filter className="w-3 h-3" />}
                    {source !== 'all' && getSourceIcon(source)}
                    {source}
                    {cnt > 0 && (
                      <span className={`ml-0.5 px-1 py-0 rounded text-[9px] font-mono ${filterSource === source ? 'bg-indigo-500/30 text-indigo-200' : 'bg-white/5 text-slate-600'}`}>{cnt}</span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* PRIORITY SORT TOGGLE */}
            <div className="flex items-center justify-between">
              <button
                onClick={() => setPrioritySort(p => !p)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider border transition-all ${
                  prioritySort
                    ? 'bg-rose-500/10 text-rose-300 border-rose-500/20'
                    : 'bg-white/[0.02] text-slate-500 border border-white/5 hover:bg-white/[0.05]'
                }`}
              >
                🔥 {prioritySort ? 'Priority Sort: On' : 'Priority Sort'}
              </button>
              {prioritySort && (
                <span className="text-[9px] text-rose-400/70 font-mono tracking-widest uppercase animate-pulse">
                  Ranked by urgency score
                </span>
              )}
            </div>

            {/* FEATURE 11: VELOCITY TIMELINE */}
            <SignalVelocityTimeline
              stream={stream}
              open={velocityOpen}
              onToggle={() => setVelocityOpen(v => !v)}
              mutedSources={mutedSources}
            />

            {/* CLIENT WATCHLIST */}
            <div className={`rounded-xl border overflow-hidden transition-all ${watchlistOpen ? 'border-violet-500/20 bg-violet-500/[0.03]' : 'border-white/[0.05] bg-transparent'}`}>
              <button
                onClick={() => setWatchlistOpen(o => !o)}
                className="w-full flex items-center justify-between px-3 py-2 hover:bg-violet-500/10 transition-colors"
              >
                <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-violet-300">
                  👁 Watchlist
                  <span className="px-1.5 py-0 rounded bg-violet-500/20 text-violet-200 font-mono text-[9px]">{watchlist.length}</span>
                </span>
                {watchlistOpen ? <ChevronUp className="w-3 h-3 text-violet-400/60" /> : <ChevronDown className="w-3 h-3 text-slate-600" />}
              </button>
              {watchlistOpen && (
                <div className="px-3 pb-3 space-y-2">
                  {/* Add entry */}
                  <form
                    onSubmit={e => {
                      e.preventDefault();
                      const trimmed = watchlistInput.trim();
                      if (trimmed && !watchlist.includes(trimmed)) {
                        setWatchlist(w => [...w, trimmed]);
                      }
                      setWatchlistInput('');
                    }}
                    className="flex gap-2"
                  >
                    <input
                      type="text"
                      value={watchlistInput}
                      onChange={e => setWatchlistInput(e.target.value)}
                      placeholder="Add client or name…"
                      className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-md px-2.5 py-1.5 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-violet-500/40 transition-all"
                    />
                    <button
                      type="submit"
                      className="px-2.5 py-1.5 rounded-md bg-violet-500/20 text-violet-300 text-[10px] font-bold border border-violet-500/20 hover:bg-violet-500/30 transition-colors"
                    >
                      + Add
                    </button>
                  </form>
                  {/* Watchlist chips */}
                  <div className="flex flex-wrap gap-1.5">
                    {watchlist.map(w => (
                      <span key={w} className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-[10px] font-semibold">
                        {w}
                        <button
                          onClick={() => setWatchlist(prev => prev.filter(x => x !== w))}
                          className="text-violet-500 hover:text-rose-400 transition-colors ml-0.5"
                        >
                          <X className="w-2.5 h-2.5" />
                        </button>
                      </span>
                    ))}
                    {watchlist.length === 0 && (
                      <span className="text-[10px] text-slate-600">No entries yet — add a client name above.</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* SEARCH BAR */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500 pointer-events-none" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search signals..."
                className={`w-full ${th.inputBg} border rounded-lg pl-9 pr-9 py-2 text-xs text-slate-300 placeholder-slate-600 focus:outline-none focus:border-indigo-500/40 focus:bg-white/[0.05] transition-all`}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-3 scroll-smooth pb-32">

            {/* PINNED SIGNALS SECTION — Feature 8: Drag to reorder */}
            {pinnedSignals.length > 0 && (
              <div className={`mb-2 rounded-xl border border-indigo-500/20 bg-indigo-500/[0.04] overflow-hidden`}>
                <button
                  onClick={() => setPinnedOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-2.5 hover:bg-indigo-500/10 transition-colors"
                >
                  <span className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-widest text-indigo-300">
                    <Pin className="w-3 h-3" /> Pinned Signals ({pinnedSignals.length}) — drag to reorder
                  </span>
                  {pinnedOpen ? <ChevronUp className="w-3.5 h-3.5 text-indigo-400/60" /> : <ChevronDown className="w-3.5 h-3.5 text-indigo-400/60" />}
                </button>
                {pinnedOpen && (
                  <div className="px-4 pb-3 space-y-2">
                    {pinnedSignals.map((p, i) => (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => handleDragStart(i)}
                        onDragEnter={() => handleDragEnter(i)}
                        onDragEnd={handleDragEnd}
                        onDragOver={e => e.preventDefault()}
                        className="flex items-start gap-2.5 p-3 rounded-lg bg-black/30 border border-white/5 cursor-grab active:cursor-grabbing select-none"
                      >
                        <div className="mt-0.5 p-1.5 rounded bg-black border border-white/10 shrink-0">{getSourceIcon(p.type)}</div>
                        <div className="flex-1 min-w-0">
                          <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">{p.source} · {p.author}</span>
                          <p className="text-xs text-slate-300 leading-relaxed font-light truncate">{p.text}</p>
                          {signalTags[p.id] && <div className="mt-1"><SignalTagBadge tag={signalTags[p.id]} /></div>}
                          {signalNotes[p.id] && (
                            <div className="flex items-start gap-1.5 mt-1.5 px-2 py-1 rounded bg-amber-500/[0.06] border border-amber-500/15">
                              <StickyNote className="w-2.5 h-2.5 text-amber-500/60 mt-0.5 shrink-0" />
                              <p className="text-[10px] text-amber-200/60 italic leading-snug">{signalNotes[p.id]}</p>
                            </div>
                          )}
                        </div>
                        <button onClick={() => togglePin(p)} className="mt-0.5 shrink-0 p-1 rounded hover:bg-rose-500/20 text-slate-600 hover:text-rose-400 transition-colors">
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SEARCH RESULT COUNT */}
            {searchQuery && (() => {
              const count = stream.filter(item =>
                (filterSource === 'all' || item.type === filterSource) &&
                `${item.text} ${item.author} ${item.source}`.toLowerCase().includes(searchQuery.toLowerCase())
              ).length;
              return (
                <div className="flex items-center gap-2 px-1 pb-1">
                  <Search className="w-3 h-3 text-indigo-400/60" />
                  <span className={`text-[10px] ${th.muted} font-mono`}>
                    {count} result{count !== 1 ? 's' : ''} for <span className="text-indigo-400">"{searchQuery}"</span>
                  </span>
                </div>
              );
            })()}

            {(() => {
              let items = stream.filter(item => {
                const matchesSource = filterSource === 'all' || item.type === filterSource;
                const matchesSearch = !searchQuery || `${item.text} ${item.author} ${item.source}`.toLowerCase().includes(searchQuery.toLowerCase());
                return matchesSource && matchesSearch;
              });
              if (prioritySort) {
                items = [...items].sort((a, b) => getUrgencyScore(b) - getUrgencyScore(a));
              }
              return items;
            })().map((item) => {
              if (!item) return null;
              const isPinned = pinnedSignals.some(p => p.id === item.id);
              const currentTag = signalTags[item.id];
              const urgency = getUrgencyScore(item);
              const watchedBy = getWatchlistMatch(`${item.text} ${item.author} ${item.source}`, watchlist);
              const cardClass = `animate-3d-slide group p-5 rounded-2xl border relative overflow-hidden transition-all duration-200 depth-shadow ${
                isPinned   ? 'bg-indigo-500/[0.05] border-indigo-500/25'
              : watchedBy  ? 'bg-violet-500/[0.04] border-violet-500/20'
              : urgency >= 8 ? 'bg-rose-500/[0.04] border-rose-500/15 glow-rose'
              : 'glass-card'
              }`;
              return (
                <Card3D key={item.id} strength={urgency >= 8 ? 4 : 6} className={cardClass}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-black border border-white/10 shadow-sm">
                        {getSourceIcon(item.type)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {/* Feature 14: Quick Reply button */}
                      <button
                        onClick={() => setReplySignal(item)}
                        title="Draft a reply (R)"
                        className={`transition-all p-1 rounded flex items-center gap-1 ${
                          urgency >= 7
                            ? 'text-indigo-400 opacity-80 hover:opacity-100 hover:bg-indigo-500/15 border border-indigo-500/20'
                            : 'opacity-0 group-hover:opacity-100 text-slate-600 hover:bg-white/10 hover:text-indigo-300'
                        }`}
                      >
                        <CornerDownLeft className="w-3.5 h-3.5" />
                        {urgency >= 7 && <span className="text-[9px] font-bold uppercase tracking-widest">Reply</span>}
                      </button>

                      {/* Feature 12: Annotate button */}
                      <button
                        onClick={() => setActiveNoteId(activeNoteId === item.id ? null : item.id)}
                        title="Add private note"
                        className={`transition-all p-1 rounded ${
                          signalNotes[item.id]
                            ? 'text-amber-400 opacity-100 hover:bg-amber-500/10'
                            : 'opacity-0 group-hover:opacity-100 text-slate-600 hover:bg-white/10 hover:text-amber-300'
                        }`}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>

                      {/* Feature 3: Tag button */}
                      <div className="relative">
                        <button
                          onClick={() => setShowTagMenu(showTagMenu === item.id ? null : item.id)}
                          title="Tag signal"
                          className="opacity-0 group-hover:opacity-100 transition-all p-1 rounded text-slate-600 hover:bg-white/10 hover:text-indigo-300"
                        >
                          <Tag className="w-3.5 h-3.5" />
                        </button>
                        {showTagMenu === item.id && (
                          <div className="absolute right-0 top-7 z-50 bg-slate-900 border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[140px]">
                            {Object.entries(TAG_CONFIG).map(([key, cfg]) => (
                              <button
                                key={key}
                                onClick={() => tagSignal(item.id, key)}
                                className={`w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest ${cfg.text} hover:bg-white/5 transition-colors`}
                              >
                                <Tag className="w-2.5 h-2.5" />
                                {cfg.label}
                              </button>
                            ))}
                            {currentTag && (
                              <button
                                onClick={() => { setSignalTags(p => { const n = {...p}; delete n[item.id]; return n; }); setShowTagMenu(null); }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-slate-500 hover:bg-white/5 transition-colors border-t border-white/5"
                              >
                                <X className="w-2.5 h-2.5" />
                                Remove Tag
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                      <button
                        onClick={() => togglePin(item)}
                        title={isPinned ? 'Unpin' : 'Pin this signal'}
                        className={`opacity-0 group-hover:opacity-100 transition-all p-1 rounded ${ isPinned ? 'opacity-100 text-indigo-400 hover:bg-indigo-500/20' : 'text-slate-600 hover:bg-white/10 hover:text-indigo-300' }`}
                      >
                        {isPinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                      </button>
                      <span className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium tracking-wide">
                        <Clock className="w-3 h-3 opacity-40" /> {item.time}
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-1.5 ml-1">
                    <div className="flex items-center justify-between flex-wrap gap-1">
                      <span className="text-xs font-bold text-slate-200">{item.author}</span>
                      <div className="flex items-center gap-1.5">
                        {currentTag && <SignalTagBadge tag={currentTag} />}
                        {watchedBy && <WatchlistBadge match={watchedBy} />}
                        {signalNotes[item.id] && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <StickyNote className="w-2.5 h-2.5" /> Annotated
                          </span>
                        )}
                        <UrgencyBadge score={urgency} />
                        <SentimentBadge text={item.text} />
                      </div>
                    </div>
                    <HighlightedText
                      text={item.text}
                      baseClass={`text-sm leading-relaxed font-light ${item.type === 'system' ? 'text-amber-200/90 font-medium' : 'text-slate-400'}`}
                    />
                    {/* Feature 12: Inline note display */}
                    {signalNotes[item.id] && activeNoteId !== item.id && (
                      <div className="flex items-start gap-2 mt-2 px-2.5 py-1.5 rounded-md bg-amber-500/[0.06] border border-amber-500/15">
                        <StickyNote className="w-3 h-3 text-amber-500/60 mt-0.5 shrink-0" />
                        <p className="text-[11px] text-amber-200/70 leading-relaxed font-light italic">{signalNotes[item.id]}</p>
                      </div>
                    )}
                    {/* Feature 12: Note editor */}
                    {activeNoteId === item.id && (
                      <SignalNoteEditor
                        itemId={item.id}
                        notes={signalNotes}
                        onSave={saveNote}
                        onClose={() => setActiveNoteId(null)}
                      />
                    )}
                  </div>
                </Card3D>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL - Digest */}
        <div className={`flex flex-col relative overflow-y-auto glass-panel-r scroll-smooth transition-all duration-500 ease-in-out ${ focusMode ? 'w-full' : 'w-1/2' }`}>
          <div className="p-12 flex-1 flex flex-col max-w-3xl mx-auto w-full relative z-10">

            <div className="mb-10 mt-8 flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-bold mb-2 tracking-tight gradient-text-indigo">Briefly</h1>
                <p className="text-slate-400 text-sm tracking-wide font-light">
                  Synthesizing noise into decisive operational intelligence.
                </p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {/* Feature 10: Auto-refresh countdown */}
                <AutoRefreshCountdown
                  onRefresh={handleGenerateHeartbeat}
                  isGenerating={isGenerating}
                  digest={digest}
                />
                <button
                  onClick={() => setFocusMode(f => !f)}
                  title={focusMode ? 'Exit Focus Mode' : 'Focus Mode'}
                  className={`flex items-center gap-1.5 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-md border transition-all duration-200 ${
                    focusMode
                      ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30 hover:bg-indigo-500/30'
                      : 'bg-white/[0.03] text-slate-500 border-white/[0.06] hover:text-slate-200 hover:bg-white/[0.08]'
                  }`}
                >
                  {focusMode ? <Minimize2 className="w-3 h-3" /> : <Maximize2 className="w-3 h-3" />}
                  {focusMode ? 'Exit Focus' : 'Focus'}
                </button>
                <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md shadow-sm">
                  <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-2">
                    <Activity className="w-3 h-3 text-emerald-500/70" />
                    macOS Local Node
                  </p>
                </div>
              </div>
            </div>

            {/* FEATURE 15: ORG RISK GAUGE */}
            <OrgRiskGauge stream={stream} watchlist={watchlist} digest={digest} />

            {/* DIGEST HISTORY DROPDOWN */}
            {digestHistory.length > 1 && (
              <div className="mb-6 relative">
                <button
                  onClick={() => setShowHistory(h => !h)}
                  className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 bg-white/[0.03] hover:bg-white/[0.06] text-slate-400 hover:text-slate-200 rounded-md border border-white/[0.06] transition-colors"
                >
                  <History className="w-3 h-3" />
                  History ({digestHistory.length})
                  {showHistory ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                </button>
                {showHistory && (
                  <div className="mt-2 rounded-xl border border-white/[0.06] bg-slate-900/80 backdrop-blur overflow-hidden">
                    {digestHistory.map((d, i) => (
                      <button
                        key={i}
                        onClick={() => { setDigest(d); setShowHistory(false); }}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-white/5 transition-colors border-b border-white/[0.04] last:border-0 ${ d.timestamp === digest?.timestamp ? 'bg-indigo-500/10' : '' }`}
                      >
                        <span className="flex items-center gap-2 text-xs text-slate-300">
                          <Clock className="w-3 h-3 text-slate-600" />
                          Digest #{digestHistory.length - i}
                        </span>
                        <span className="text-[10px] font-mono text-slate-500">{d.timestamp}</span>
                        {d.timestamp === digest?.timestamp && (
                          <span className="text-[9px] font-bold uppercase tracking-widest text-indigo-400 ml-2">Current</span>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            )}

            {!digest ? (
               <div className="flex-1 flex flex-col items-center justify-center pb-24">
                <button
                  onClick={handleGenerateHeartbeat}
                  disabled={isGenerating || stream.length === 0}
                  className="group flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold text-white transition-all duration-300 bg-indigo-600 hover:bg-indigo-500 border border-white/10 rounded-xl shadow-md focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <><Loader2 className="w-4 h-4 animate-spin text-white/80" /> Compressing Context...</>
                  ) : (
                    <><Sparkles className="w-4 h-4 text-white" /> Generate Intelligence</>
                  )}
                </button>
               </div>
            ) : (
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">

                {/* Feature 8: Digest Confidence Score */}
                <div className="mb-6">
                  <DigestConfidenceScore digest={digest} />
                </div>

                {/* Header */}
                <div className="flex justify-between items-end mb-6 border-b border-white/5 pb-4">
                  <div>
                    <h3 className="text-xl font-semibold text-white tracking-tight">Executive Digest</h3>
                    <div className="flex items-center gap-3 mt-1.5">
                      <p className="text-[11px] text-slate-400 uppercase tracking-widest font-bold flex items-center gap-1.5">
                        <Clock className="w-3 h-3" /> {digest.timestamp}
                      </p>
                      <span className="text-slate-700">•</span>
                      <p className="text-[10px] text-indigo-400 font-bold tracking-widest uppercase">
                        2 Risks, 1 Opportunity, 2 Stable
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 flex-wrap">
                    {/* Feature 9: Show diff toggle */}
                    {prevDigest && (
                      <button
                        onClick={() => setShowDiff(d => !d)}
                        className={`flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 rounded-md border transition-colors ${
                          showDiff
                            ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30'
                            : 'bg-white/5 hover:bg-white/10 text-slate-400 border-white/10'
                        }`}
                      >
                        <GitCompare className="w-3 h-3" />
                        {showDiff ? 'Hide Diff' : 'What Changed'}
                      </button>
                    )}
                    {/* Feature 2: Export Markdown */}
                    <button
                      onClick={handleExportMarkdown}
                      title="Export as Markdown"
                      className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md border border-white/10 transition-colors"
                    >
                      <Download className="w-3 h-3" />
                      Export
                    </button>
                    <button
                      onClick={handleCopyDigest}
                      className="flex items-center gap-2 text-[10px] font-bold tracking-widest uppercase px-3 py-1.5 bg-white/5 hover:bg-white/10 text-slate-300 rounded-md border border-white/10 transition-colors"
                    >
                      {isCopied ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Share</>}
                    </button>
                    <div className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 px-3 py-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/20">
                      LLM Evaluated
                    </div>
                  </div>
                </div>

                {/* Feature 9: What Changed Diff */}
                {showDiff && prevDigest && (
                  <DigestDiff current={digest} previous={prevDigest} />
                )}

                {/* RISK POSTURE BANNER */}
                {(() => {
                  const riskCount = digest.projects.filter(p => p.status === 'risk').length;
                  const watchCount = digest.projects.filter(p => p.status === 'watch').length;
                  const posture = riskCount >= 2 ? 'HIGH' : riskCount === 1 || watchCount >= 2 ? 'ELEVATED' : 'STABLE';
                  const cfg = {
                    HIGH:     { bg: 'bg-rose-500/10',    border: 'border-rose-500/30',    bar: 'bg-rose-500',    text: 'text-rose-300',    sub: 'text-rose-400/70',    msg: `${riskCount} active risks require immediate attention.` },
                    ELEVATED: { bg: 'bg-amber-500/10',   border: 'border-amber-500/30',   bar: 'bg-amber-500',   text: 'text-amber-300',   sub: 'text-amber-400/70',   msg: 'Monitor closely — situations could escalate.' },
                    STABLE:   { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', bar: 'bg-emerald-500', text: 'text-emerald-300', sub: 'text-emerald-400/70', msg: 'All projects tracking well. No immediate action needed.' },
                  }[posture];
                  return (
                    <div className={`mb-8 flex items-center gap-4 px-5 py-3.5 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <div className={`shrink-0 w-1 h-10 rounded-full ${cfg.bar}`} />
                      <div className="flex-1">
                        <p className={`text-[10px] font-bold uppercase tracking-widest ${cfg.sub} mb-0.5`}>Overall Risk Posture</p>
                        <p className={`text-lg font-bold tracking-tight ${cfg.text}`}>{posture}</p>
                      </div>
                      <p className="text-xs text-slate-500 font-light leading-relaxed max-w-[200px] text-right">{cfg.msg}</p>
                    </div>
                  );
                })()}

                {/* TEMPORAL AWARENESS: Global Deltas */}
                <div className="mb-10 p-5 rounded-xl bg-indigo-500/[0.03] border border-indigo-500/10 shadow-sm relative overflow-hidden">
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-indigo-500/50"></div>
                  <h4 className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <RefreshCw className="w-3 h-3" /> Since last update
                  </h4>
                  <div className="space-y-1.5">
                    {digest.globalDeltas.map((delta, i) => (
                      <div key={i} className="flex items-start gap-2 text-[13px] text-slate-300">
                        <span className="text-indigo-500 mt-0.5">•</span>
                        <span className="font-medium">{delta}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Where to Focus */}
                <div className="mb-10">
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Where should I focus?
                  </h4>
                  <div className="space-y-4">
                    {digest.focus.map((item, i) => (
                      <div key={i} className="group flex flex-col p-5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-indigo-500/30 hover:bg-white/[0.04] transition-all duration-300 relative overflow-hidden">
                        <div className={`absolute left-0 top-0 bottom-0 w-1 ${item.isPositive ? 'bg-emerald-500/50' : 'bg-indigo-500/50'} opacity-0 group-hover:opacity-100 transition-opacity`}></div>

                        <div className="flex items-start justify-between gap-4 mb-2">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="mt-0.5 bg-slate-900 p-1.5 rounded border border-white/5">
                              {item.isPositive ? <TrendingUp className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                            </div>
                            <div>
                              <p className="text-sm text-slate-200 mt-1">
                                {item.client && <span className="font-bold text-white">{item.client}: </span>}
                                {item.text}
                              </p>
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-1.5 flex-shrink-0 mt-1">
                            <span className="text-[10px] text-slate-400 tracking-wide font-medium">{item.timeAgo}</span>
                            <span className="text-[10px] uppercase font-bold text-slate-500" title={item.confidenceContext || ''}>
                              {item.confidence} Confidence
                              {item.confidenceContext && <Info className="w-3 h-3 inline ml-1 opacity-50" />}
                            </span>
                          </div>
                        </div>

                        {/* CONSEQUENCE MODELING */}
                        {item.consequence && (
                          <div className="ml-10 mb-3 flex items-center gap-2">
                             <AlertOctagon className="w-3 h-3 text-rose-400/80" />
                             <span className="text-[11px] font-medium text-rose-300/80">{item.consequence}</span>
                          </div>
                        )}

                        <div className="ml-10 flex flex-wrap gap-3 items-center">
                          <div className="flex items-center gap-2 bg-black/20 w-fit px-3 py-1.5 rounded-lg border border-white/5">
                            <ArrowRight className="w-3 h-3 text-slate-500" />
                            <span className={`text-xs font-semibold ${item.isPositive ? 'text-emerald-300' : 'text-slate-300'}`}>{item.impact}</span>
                          </div>

                          {item.action && (
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleDraftAction(item.id)}
                                className="flex items-center gap-2 bg-indigo-600/10 hover:bg-indigo-600/20 text-indigo-300 w-fit px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-all font-semibold text-xs relative overflow-hidden"
                              >
                                {activeDraft === item.id ? (
                                   <><Loader2 className="w-3 h-3 animate-spin" /> Drafting in background...</>
                                ) : (
                                   <><PenSquare className="w-3 h-3" /> {item.action}</>
                                )}
                              </button>
                              {item.actionContext && (
                                <span className="text-[10px] text-slate-500 italic">({item.actionContext})</span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="ml-10 mt-3 flex items-start gap-2">
                          <span className="shrink-0 text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">Why flagged:</span>
                          <p className="text-[10px] text-slate-400 font-mono tracking-tight bg-black/20 px-2.5 py-1 rounded inline-block border border-white/5">
                            {item.reason}
                          </p>
                        </div>

                      </div>
                    ))}
                  </div>
                </div>

                {/* Projects List */}
                <div>
                  <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                    Project Delivery Trajectories
                  </h4>
                  <div className="grid grid-cols-1 gap-5">
                    {digest.projects.map((proj, i) => (
                      <div key={i} className="p-6 rounded-2xl bg-white/[0.02] border border-white/5 shadow-sm">

                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-3">
                            <h5 className="text-base font-bold text-white tracking-wide">{proj.name}</h5>
                            <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[9px] uppercase font-bold tracking-widest border border-white/5">
                              {proj.client}
                            </span>
                          </div>
                          {getStatusBadge(proj.status, proj.statusReason)}
                        </div>

                        <div className="mb-5 flex items-center justify-between bg-black/20 p-3 rounded-lg border border-white/5">
                          <span className="text-sm text-slate-300 leading-relaxed font-light">{proj.summary}</span>
                          <div className="text-right flex flex-col justify-center border-l border-white/5 pl-4 ml-4 min-w-max">
                            <p className="text-[9px] uppercase font-bold text-slate-500 tracking-widest mb-1">ETA Delivery</p>
                            <p className={`text-xs font-bold truncate ${proj.status === 'risk' ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {proj.eta}
                            </p>
                          </div>
                        </div>

                        <div className="space-y-2 mb-5">
                          <h6 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Recent Deltas</h6>
                          {proj.deltas.map((delta, j) => (
                            <div key={j} className="flex items-start gap-2 text-sm text-slate-300">
                              <span className="text-indigo-500 mt-0.5">•</span>
                              <span className="font-light">{delta}</span>
                            </div>
                          ))}
                        </div>

                        {/* MISSING DATA SIGNAL */}
                        {proj.missingData && (
                          <div className="mt-5 mb-1 flex items-center gap-2 bg-amber-500/10 w-fit px-3 py-1.5 rounded-md border border-amber-500/20">
                            <AlertTriangle className="w-3 h-3 text-amber-500/80" />
                            <span className="text-[10px] text-amber-400/90 font-medium">Missing: {proj.missingData}</span>
                          </div>
                        )}

                        {/* ACCOUNTABILITY OWNER / CTA */}
                        {proj.recommendation && (
                          <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-2">
                            <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5" />
                            <p className="text-sm text-rose-300 font-semibold tracking-wide">{proj.recommendation}</p>
                          </div>
                        )}

                        {proj.status === 'healthy' && !proj.recommendation && (
                           <div className="mt-4 pt-4 border-t border-white/5 flex items-start gap-2">
                              <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                              <p className="text-sm text-emerald-300 font-semibold tracking-wide">Stable — no action needed, delivery on track.</p>
                           </div>
                        )}

                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-12 text-center">
                  <button
                    onClick={() => setDigest(null)}
                    className="text-[11px] font-bold tracking-widest uppercase text-slate-500 hover:text-white transition-colors"
                  >
                    Clear Screen
                  </button>
                </div>

              </div>
            )}
          </div>
        </div>
      </div>
    </ThemeContext.Provider>
  );
}

export default App;
