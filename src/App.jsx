import React, { useState, useEffect, useRef } from 'react';
import { Activity, Clock, MessageSquare, Mail, LayoutDashboard, Terminal, AlertCircle, CheckCircle2, AlertTriangle, ArrowRight, Zap, Loader2 } from 'lucide-react';
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
    <div className="flex h-screen bg-slate-950 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-900 via-slate-950 to-black text-slate-300 font-sans selection:bg-indigo-500/30">
      
      {/* LEFT PANEL - Firehose */}
      <div className="w-1/2 border-r border-slate-800/50 flex flex-col bg-slate-950/40 relative z-10 shadow-2xl">
        <div className="px-8 py-6 border-b border-slate-800/50 flex justify-between items-center bg-slate-900/60 backdrop-blur-md z-20">
          <div>
            <h2 className="text-sm font-semibold text-white flex items-center gap-2 tracking-wide uppercase">
              <Activity className="w-4 h-4 text-indigo-400" />
              Signal Stream
            </h2>
            <p className="text-xs text-slate-400 mt-1.5 tracking-wide">Intercepting integration events & communications</p>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold tracking-widest uppercase px-2.5 py-1 bg-slate-800/80 text-slate-300 rounded-md border border-slate-700/50 shadow-inner">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
            Live
          </div>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-8 py-6 space-y-5 scroll-smooth pb-32">
          {stream.map((item, idx) => {
            if (!item) return null;
            return (
            <div key={item.id || idx} className="animate-3d-slide group p-5 rounded-2xl bg-slate-800/40 backdrop-blur-sm border border-slate-700/50 hover:border-slate-600 hover:bg-slate-800/60 transition-all duration-300 shadow-lg">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2 rounded-lg bg-slate-900/80 shadow-inner border border-slate-700/50">
                    {getSourceIcon(item.type)}
                  </div>
                  <span className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">{item.source}</span>
                </div>
                <span className="text-[11px] text-slate-500 flex items-center gap-1.5 font-medium tracking-wide">
                  <Clock className="w-3 h-3 opacity-60" /> {item.time}
                </span>
              </div>
              <div className="flex flex-col gap-1.5 ml-1">
                <span className="text-xs font-bold text-slate-200">{item.author}</span>
                <p className={`text-sm leading-relaxed font-light ${item.type === 'system' ? 'text-amber-200 font-medium' : 'text-slate-300'}`}>
                  {item.text}
                </p>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL - Digest */}
      <div className="w-1/2 flex flex-col relative overflow-y-auto bg-slate-950/20">
        <div className="p-12 flex-1 flex flex-col max-w-3xl mx-auto w-full relative z-10">
          
          <div className="mb-10 mt-8">
            <h1 className="text-3xl font-semibold text-white mb-2 tracking-tight">Briefly</h1>
            <p className="text-slate-400 text-sm tracking-wide font-light">
              Synthesizing noise into decisive operational intelligence.
            </p>
          </div>

          {!digest ? (
             <div className="flex-1 flex flex-col items-start justify-center pb-24">
              <button
                onClick={handleGenerateHeartbeat}
                disabled={isGenerating || stream.length === 0}
                className="group flex items-center justify-center gap-3 px-8 py-4 text-sm font-bold text-white transition-all duration-300 bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_20px_rgba(79,70,229,0.2)] hover:shadow-[0_0_30px_rgba(79,70,229,0.4)] border border-indigo-500/30 rounded-xl focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isGenerating ? (
                  <><Loader2 className="w-4 h-4 animate-spin text-white/80" /> Compressing Context...</>
                ) : (
                  <><Zap className="w-4 h-4 text-indigo-300" /> Generate Intelligence</>
                )}
              </button>
             </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
              
              {/* Header */}
              <div className="flex justify-between items-end mb-8 border-b border-slate-800 pb-4">
                <div>
                  <h3 className="text-xl font-semibold text-white tracking-tight">Executive Digest</h3>
                  <p className="text-[11px] text-slate-400 mt-1.5 uppercase tracking-widest font-bold flex items-center gap-1.5">
                    <Clock className="w-3 h-3" /> Last updated: {digest.timestamp}
                  </p>
                </div>
                <div className="text-[10px] font-bold tracking-widest uppercase text-indigo-400 px-3 py-1.5 bg-indigo-500/10 rounded-md border border-indigo-500/20 shadow-inner">
                  LLM Evaluated
                </div>
              </div>
              
              {/* Where to Focus */}
              <div className="mb-10">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Where should I focus?
                </h4>
                <div className="space-y-4">
                  {digest.focus.map((item, i) => (
                    <div key={i} className="group flex flex-col p-5 rounded-xl bg-slate-900/50 border border-slate-800/80 hover:border-indigo-500/30 hover:bg-slate-800/50 transition-all duration-300 shadow-md relative overflow-hidden">
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-500/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                      
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-start gap-3 flex-1">
                          <div className="mt-0.5 bg-slate-950 p-1.5 rounded shadow-inner">
                            {item.isPositive ? <CheckCircle2 className="w-4 h-4 text-emerald-400" /> : <AlertCircle className="w-4 h-4 text-rose-400" />}
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
                          <span className="text-[10px] uppercase font-bold text-slate-500">{item.confidence} Confidence</span>
                        </div>
                      </div>
                      
                      <div className="ml-10 flex items-center gap-2 bg-slate-950/30 w-fit px-3 py-1.5 rounded-lg border border-slate-800/80">
                        <ArrowRight className="w-3 h-3 text-slate-500" />
                        <span className="text-xs font-semibold text-slate-300">{item.impact}</span>
                      </div>

                      {/* Explainable AI */}
                      <div className="ml-10 mt-3 overflow-hidden max-h-0 group-hover:max-h-20 transition-all duration-300 opacity-0 group-hover:opacity-100 text-[10px] text-slate-500 font-mono tracking-tight bg-black/20 p-2 rounded border border-white/5">
                        {item.reason}
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
                <div className="grid grid-cols-1 gap-5">
                  {digest.projects.map((proj, i) => (
                    <div key={i} className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800/80 shadow-lg">
                      
                      <div className="flex justify-between items-center mb-4">
                        <h5 className="text-base font-bold text-white tracking-wide">{proj.name}</h5>
                        {getStatusBadge(proj.status, proj.statusReason)}
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed font-light mb-5 bg-slate-950/30 p-3 rounded-lg border border-slate-800/50">{proj.summary}</p>

                      <div className="space-y-2 mb-5">
                        <h6 className="text-[10px] uppercase tracking-widest font-bold text-slate-500 mb-2">Recent Deltas</h6>
                        {proj.deltas.map((delta, j) => (
                          <div key={j} className="flex items-start gap-2 text-sm text-slate-300">
                            <span className="text-indigo-500 mt-0.5">•</span> 
                            <span className="font-light">{delta}</span>
                          </div>
                        ))}
                      </div>

                      {proj.recommendation && (
                        <div className="mt-5 pt-4 border-t border-slate-800 flex items-start gap-2">
                          <AlertTriangle className="w-4 h-4 text-rose-400 mt-0.5" />
                          <p className="text-sm text-rose-300 font-semibold tracking-wide">{proj.recommendation}</p>
                        </div>
                      )}
                      
                      {proj.status === 'healthy' && !proj.recommendation && (
                         <div className="mt-5 pt-4 border-t border-slate-800 flex items-start gap-2">
                            <CheckCircle2 className="w-4 h-4 text-emerald-400 mt-0.5" />
                            <p className="text-sm text-emerald-300 font-semibold tracking-wide">Stable — no intervention required.</p>
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
