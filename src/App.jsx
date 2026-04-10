import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { Activity, Clock, MessageSquare, Mail, LayoutDashboard, Terminal, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, Zap, Loader2, Sparkles, TrendingUp, PenSquare, RefreshCw, AlertOctagon, Info, Pause, Play, Filter, Copy, Check, X, BellRing, Pin, PinOff, ChevronDown, ChevronUp, Search, History, Maximize2, Minimize2, Download, Sun, Moon, Tag, EyeOff, Eye, BarChart2, GitCompare, Timer, Gauge, Command, Zap as ZapIcon } from 'lucide-react';
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

const SentimentBadge = ({ text }) => {
  const s = getSentiment(text);
  if (s === 'critical') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-rose-500/10 text-rose-400 border border-rose-500/20">⚑ Critical</span>;
  if (s === 'positive') return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">↑ Positive</span>;
  return <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold uppercase tracking-widest bg-slate-500/10 text-slate-500 border border-slate-500/20">– Neutral</span>;
};

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
function CommandPalette({ open, onClose, stream, onGenerate, onTogglePause, isPaused, onToggleFocus, onToggleTheme, theme, onFilterSource, onExport, digest }) {
  const inputRef = useRef(null);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);

  const staticActions = useMemo(() => [
    { id: 'generate',     icon: <Sparkles className="w-3.5 h-3.5 text-indigo-400" />,         label: 'Generate Intelligence Digest',        group: 'Actions',  action: () => { onGenerate(); onClose(); } },
    { id: 'pause',        icon: isPaused ? <Play className="w-3.5 h-3.5 text-emerald-400" /> : <Pause className="w-3.5 h-3.5 text-amber-400" />, label: isPaused ? 'Resume Signal Stream' : 'Pause Signal Stream', group: 'Actions', action: () => { onTogglePause(); onClose(); } },
    { id: 'focus',        icon: <Maximize2 className="w-3.5 h-3.5 text-slate-400" />,         label: 'Toggle Focus Mode',                   group: 'Actions',  action: () => { onToggleFocus(); onClose(); } },
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
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') { e.preventDefault(); setPaletteOpen(p => !p); return; }
      if (e.key === 'Escape') { setSearchQuery(''); setShowTagMenu(null); setPaletteOpen(false); }
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
      <div className={`flex h-screen ${th.bg} ${th.text} font-sans selection:bg-indigo-500/30`}>
        <AlertToast toasts={alertToasts} onDismiss={dismissToast} />

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
        />

        {/* KEYBOARD SHORTCUT LEGEND */}
        <div className="fixed bottom-5 left-5 z-50 flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-900/80 border border-white/[0.06] backdrop-blur pointer-events-none">
          {[['Space','Pause'],['G','Generate'],['F','Focus'],['T','Theme'],['Ctrl+K','Palette'],['Esc','Clear']].map(([key, label]) => (
            <span key={key} className="flex items-center gap-1.5">
              <kbd className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-white/[0.06] border border-white/10 text-slate-400">{key}</kbd>
              <span className="text-[9px] text-slate-600 uppercase tracking-widest">{label}</span>
            </span>
          ))}
        </div>

        <div className="absolute top-0 w-full h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 z-50 pointer-events-none"></div>

        {/* LEFT PANEL */}
        <div className={`border-r ${th.border} flex flex-col ${th.panelL} relative z-10 transition-all duration-500 ease-in-out overflow-hidden ${ focusMode ? 'w-0 min-w-0 opacity-0' : 'w-1/2 opacity-100' }`}>
          <div className={`px-8 py-6 border-b ${th.border} flex flex-col gap-4 ${th.panelL} z-20`}>
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-sm font-semibold text-white flex items-center gap-2 tracking-wide uppercase">
                  <Activity className="w-4 h-4 text-indigo-400" />
                  Signal Stream
                </h2>
                <p className={`text-xs ${th.muted} mt-1.5 tracking-wide`}>Intercepting integration events & communications</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap justify-end">
                {/* Feature 1: Live Ticker */}
                <LiveTicker count={totalSignals} critical={criticalSignals} />

                {/* Feature 5: Heatmap inline */}
                <div className="w-20 hidden sm:block">
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

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-4 scroll-smooth pb-32">

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

            {stream.filter(item => {
              const matchesSource = filterSource === 'all' || item.type === filterSource;
              const matchesSearch = !searchQuery || `${item.text} ${item.author} ${item.source}`.toLowerCase().includes(searchQuery.toLowerCase());
              return matchesSource && matchesSearch;
            }).map((item) => {
              if (!item) return null;
              const isPinned = pinnedSignals.some(p => p.id === item.id);
              const currentTag = signalTags[item.id];
              return (
                <div key={item.id} className={`animate-3d-slide group p-5 rounded-2xl border transition-all duration-300 ${ isPinned ? 'bg-indigo-500/[0.04] border-indigo-500/20' : `${th.card} hover:border-slate-800 hover:bg-white/[0.04]`}`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                      <div className="p-2 rounded-lg bg-black border border-white/10 shadow-sm">
                        {getSourceIcon(item.type)}
                      </div>
                      <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.source}</span>
                    </div>
                    <div className="flex items-center gap-2">
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
                        <SentimentBadge text={item.text} />
                      </div>
                    </div>
                    <HighlightedText
                      text={item.text}
                      baseClass={`text-sm leading-relaxed font-light ${item.type === 'system' ? 'text-amber-200/90 font-medium' : 'text-slate-400'}`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* RIGHT PANEL - Digest */}
        <div className={`flex flex-col relative overflow-y-auto ${th.panelR} scroll-smooth transition-all duration-500 ease-in-out ${ focusMode ? 'w-full' : 'w-1/2' }`}>
          <div className="p-12 flex-1 flex flex-col max-w-3xl mx-auto w-full relative z-10">

            <div className="mb-10 mt-8 flex justify-between items-start flex-wrap gap-4">
              <div>
                <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">Briefly</h1>
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
