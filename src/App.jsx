import React, { useState, useEffect, useRef } from 'react';
import { Activity, Clock, MessageSquare, Mail, LayoutDashboard, Terminal, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, Zap, Loader2, Sparkles, TrendingUp, PenSquare, RefreshCw, AlertOctagon, Info, Pause, Play, Filter, Copy, Check, X, BellRing } from 'lucide-react';
import { rawDataStream, getHeartbeatDigest } from './mockData';

const getSourceIcon = (type) => {
  switch(type) {
    case 'slack': return <MessageSquare className="w-4 h-4 text-pink-400" />;
    case 'email': return <Mail className="w-4 h-4 text-blue-400" />;
    case 'jira': return <LayoutDashboard className="w-4 h-4 text-blue-500" />;
    case 'system': return <Terminal className="w-4 h-4 text-emerald-400" />;
    default: return <Activity className="w-4 h-4 text-slate-400" />;
  }
};

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

const RISK_KEYWORDS = ['blocked', 'failure', 'risk', 'urgent', 'delay', 'escalation', 'silent failure', 'slipping'];

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

function App() {
  const [stream, setStream] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [digest, setDigest] = useState(null);
  const [activeDraft, setActiveDraft] = useState(null);
  const scrollRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  const isPausedRef = useRef(isPaused);
  const [filterSource, setFilterSource] = useState('all');
  const [isCopied, setIsCopied] = useState(false);
  const [alertToasts, setAlertToasts] = useState([]);

  const dismissToast = (id) => setAlertToasts(prev => prev.filter(t => t.id !== id));

  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (isPausedRef.current) return;
      const baseItem = rawDataStream[index % rawDataStream.length];
      const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      
      const currentItem = { 
        ...baseItem, 
        id: Date.now() + Math.random().toString(), 
        time: timeStr 
      };

      // Fire a toast for system alerts or risk-keyword signals
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
    }, 2000); 
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stream]);

  const handleGenerateHeartbeat = () => {
    setIsGenerating(true);
    setTimeout(() => {
      setDigest(getHeartbeatDigest());
      setIsGenerating(false);
    }, 2400);
  };

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

  return (
    <div className="flex h-screen bg-slate-950 text-slate-300 font-sans selection:bg-indigo-500/30">
      <AlertToast toasts={alertToasts} onDismiss={dismissToast} />
      
      <div className="absolute top-0 w-full h-[2px] bg-gradient-to-r from-indigo-500/0 via-indigo-500/20 to-indigo-500/0 z-50 pointer-events-none"></div>

      {/* LEFT PANEL */}
      <div className="w-1/2 border-r border-white/5 flex flex-col bg-[#050505] relative z-10">
        <div className="px-8 py-6 border-b border-white/5 flex flex-col gap-4 bg-[#050505] z-20">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-sm font-semibold text-white flex items-center gap-2 tracking-wide uppercase">
                <Activity className="w-4 h-4 text-indigo-400" />
                Signal Stream
              </h2>
              <p className="text-xs text-slate-500 mt-1.5 tracking-wide">Intercepting integration events & communications</p>
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
          
          <div className="flex gap-2">
            {['all', 'slack', 'email', 'jira', 'system'].map(source => (
              <button
                key={source}
                onClick={() => setFilterSource(source)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px] font-bold uppercase tracking-wider transition-all ${
                  filterSource === source 
                    ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' 
                    : 'bg-white/[0.02] text-slate-500 border border-white/5 hover:bg-white/[0.05]'
                }`}
              >
                {source === 'all' && <Filter className="w-3 h-3" />}
                {source !== 'all' && getSourceIcon(source)}
                {source}
              </button>
            ))}
          </div>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-4 scroll-smooth pb-32">
          {stream.filter(item => filterSource === 'all' || item.type === filterSource).map((item, idx) => {
            if (!item) return null;
            return (
            <div key={item.id} className="animate-3d-slide group p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-slate-800 hover:bg-white/[0.04] transition-all duration-300">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-black border border-white/10 shadow-sm">
                    {getSourceIcon(item.type)}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.source}</span>
                </div>
                <span className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium tracking-wide">
                  <Clock className="w-3 h-3 opacity-40" /> {item.time}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 ml-1">
                <span className="text-xs font-bold text-slate-200">{item.author}</span>
                <p className={`text-sm leading-relaxed font-light ${item.type === 'system' ? 'text-amber-200/90 font-medium' : 'text-slate-400'}`}>
                  {item.text}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL - Digest */}
      <div className="w-1/2 flex flex-col relative overflow-y-auto bg-[#0B0F19] scroll-smooth">
        <div className="p-12 flex-1 flex flex-col max-w-3xl mx-auto w-full relative z-10">
          
          <div className="mb-10 mt-8 flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">Briefly</h1>
              <p className="text-slate-400 text-sm tracking-wide font-light">
                Synthesizing noise into decisive operational intelligence.
              </p>
            </div>
            <div className="px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-md shadow-sm">
              <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase flex items-center gap-2">
                <Activity className="w-3 h-3 text-emerald-500/70" />
                macOS Local Node
              </p>
            </div>
          </div>

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
                <div className="flex items-center gap-3">
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
                            {/* ACTION CONTEXT */}
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

                      {/* MISSING DATA SIGNAL (Advanced) */}
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
  );
}

export default App;
