import React, { useState, useEffect, useRef } from 'react';
import { Activity, Clock, MessageSquare, Mail, LayoutDashboard, Terminal, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, Zap, Loader2 } from 'lucide-react';
import { rawDataStream, getHeartbeatDigest } from './mockData';

const getSourceIcon = (type) => {
  switch(type) {
    case 'slack': return <MessageSquare className="w-4 h-4 text-slate-400" />;
    case 'email': return <Mail className="w-4 h-4 text-slate-400" />;
    case 'jira': return <LayoutDashboard className="w-4 h-4 text-slate-400" />;
    case 'system': return <Terminal className="w-4 h-4 text-slate-400" />;
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

function App() {
  const [stream, setStream] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [digest, setDigest] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < rawDataStream.length) {
        const currentItem = rawDataStream[index]; 
        setStream((prev) => [...prev, currentItem]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1200);
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
    }, 2800);
  };

  return (
    <div className="flex h-screen bg-[#0A0A0A] text-slate-300 font-sans selection:bg-indigo-500/30">
      
      {/* LEFT PANEL - Firehose */}
      <div className="w-1/2 border-r border-white/[0.04] flex flex-col bg-[#0A0A0A]">
        <div className="px-8 py-6 border-b border-white/[0.04] flex justify-between items-center bg-[#0A0A0A]/80 backdrop-blur-md z-10">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 tracking-wide uppercase">
              <Activity className="w-4 h-4 text-indigo-400" />
              Signal Stream
            </h2>
            <p className="text-xs text-slate-500 mt-1.5 tracking-wide">Intercepting integration events & communications</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 bg-white/[0.03] text-slate-400 rounded-md border border-white/[0.05]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            Live
          </div>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-4 scroll-smooth pb-32">
          {stream.map((item, idx) => {
            if (!item) return null;
            return (
            <div key={item.id || idx} className="group p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] hover:border-white/[0.08] hover:bg-white/[0.03] transition-all duration-300 animate-in fade-in slide-in-from-bottom-2">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-1.5 rounded-md bg-white/[0.03] text-slate-400 group-hover:bg-white/[0.06] transition-colors">
                    {getSourceIcon(item.type)}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-widest">{item.source}</span>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium tracking-wide">
                  <Clock className="w-3 h-3 opacity-60" /> {item.time}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-xs font-semibold text-slate-200">{item.author}</span>
                <p className="text-sm text-slate-400 leading-relaxed font-light">
                  {item.text}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL - Digest */}
      <div className="w-1/2 flex flex-col bg-[#0A0A0A] relative overflow-y-auto">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/[0.02] via-[#0A0A0A] to-[#0A0A0A] pointer-events-none"></div>
        
        <div className="p-12 flex-1 flex flex-col max-w-3xl mx-auto w-full relative z-10">
          
          <div className="mb-10 mt-8">
            <h1 className="text-2xl font-semibold text-white mb-2 tracking-tight">Briefly</h1>
            <p className="text-slate-500 text-sm tracking-wide font-light">
              Synthesizing noise into decisive operational intelligence.
            </p>
          </div>

          {!digest ? (
             <div className="flex-1 flex flex-col items-start justify-center pb-24">
              <button
                onClick={handleGenerateHeartbeat}
                disabled={isGenerating || stream.length === 0}
                className="group flex items-center justify-center gap-3 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 bg-white/[0.05] border border-white/[0.1] rounded-lg focus:outline-none hover:bg-white/[0.08] hover:border-white/[0.2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-slate-400" /> Compressing Context...</>
                ) : (
                  <><Zap className="w-4 h-4 text-indigo-400" /> Generate Intelligence</>
                )}
              </button>
             </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Header */}
              <div className="flex justify-between items-end mb-8 border-b border-white/[0.06] pb-4">
                <div>
                  <h3 className="text-lg font-medium text-white tracking-tight">Executive Digest</h3>
                  <p className="text-[11px] text-slate-500 mt-1 uppercase tracking-widest font-semibold flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Last updated: {digest.timestamp}
                  </p>
                </div>
                <div className="text-[10px] font-semibold tracking-widest uppercase text-indigo-400/80 px-2 py-1 bg-indigo-500/10 rounded border border-indigo-500/20">
                  LLM Evaluated
                </div>
              </div>
              
              {/* Where to Focus */}
              <div className="mb-10">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Where should I focus?
                </h4>
                <div className="space-y-3">
                  {digest.focus.map((item, i) => (
                    <div key={i} className="group flex flex-col p-4 rounded-xl bg-white/[0.02] border border-white/[0.04] transition-colors relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-transparent via-white/[0.05] to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-start justify-between gap-4 mb-2">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-0.5">
                            {item.isPositive ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
                          </div>
                          <div>
                            <p className="text-sm text-slate-200">
                              {item.client && <span className="font-semibold text-white">{item.client}: </span>}
                              {item.text}
                            </p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 flex-shrink-0">
                          <span className="text-[10px] text-slate-500 tracking-wide">{item.timeAgo}</span>
                          <span className="text-[10px] uppercase font-bold text-slate-500/70">{item.confidence} Confidence</span>
                        </div>
                      </div>
                      
                      <div className="ml-7 flex items-center gap-2">
                        <ArrowRight className="w-3 h-3 text-slate-600" />
                        <span className="text-xs font-medium text-slate-400">{item.impact}</span>
                      </div>

                      {/* Explainable AI */}
                      <div className="ml-7 mt-3 overflow-hidden max-h-0 group-hover:max-h-10 transition-all duration-300 opacity-0 group-hover:opacity-100">
                        <span className="inline-block px-2 py-1 rounded bg-white/[0.03] text-[10px] font-mono text-slate-500 border border-white/[0.02]">
                          {item.reason}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects List */}
              <div>
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Project Risks & Updates
                </h4>
                <div className="grid grid-cols-1 gap-4">
                  {digest.projects.map((proj, i) => (
                    <div key={i} className="p-5 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                      
                      <div className="flex justify-between items-center mb-3">
                        <h5 className="text-sm font-semibold text-white tracking-wide">{proj.name}</h5>
                        {getStatusBadge(proj.status, proj.statusReason)}
                      </div>

                      <p className="text-sm text-slate-400 leading-relaxed font-light mb-4">{proj.summary}</p>

                      <div className="space-y-1.5 mb-4">
                        <h6 className="text-[10px] uppercase tracking-widest font-semibold text-slate-500 mb-2">Recent Deltas</h6>
                        {proj.deltas.map((delta, j) => (
                          <div key={j} className="flex items-start gap-2 text-xs text-slate-300">
                            <span className="text-indigo-400/50 mt-0.5">•</span> 
                            <span className="font-light">{delta}</span>
                          </div>
                        ))}
                      </div>

                      {proj.recommendation && (
                        <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400/80 mt-0.5" />
                          <p className="text-xs text-rose-200/80 font-medium">{proj.recommendation}</p>
                        </div>
                      )}
                      
                      {proj.status === 'healthy' && !proj.recommendation && (
                         <div className="mt-4 pt-4 border-t border-white/[0.04] flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400/80 mt-0.5" />
                            <p className="text-xs text-emerald-200/80 font-medium">Stable — no intervention required.</p>
                         </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-12 text-center">
                <button 
                  onClick={() => setDigest(null)}
                  className="text-[11px] font-semibold tracking-widest uppercase text-slate-500 hover:text-white transition-colors"
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
