import React, { useState, useEffect, useRef } from 'react';
import { Mail, MessageSquare, Layout, Zap, Activity, Clock, Loader2 } from 'lucide-react';
import { rawDataStream, getHeartbeatDigest } from './mockData';

const getIconForType = (type) => {
  switch(type) {
    case 'slack': return <MessageSquare className="w-4 h-4 text-pink-400" />;
    case 'email': return <Mail className="w-4 h-4 text-blue-400" />;
    case 'jira': return <Layout className="w-4 h-4 text-blue-500" />;
    case 'system': return <Activity className="w-4 h-4 text-emerald-400" />;
    default: return <Activity className="w-4 h-4 text-slate-400" />;
  }
};

const getStatusColor = (status) => {
  switch(status) {
    case 'healthy': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
    case 'watch': return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
    case 'risk': return 'bg-rose-500/10 text-rose-500 border-rose-500/20';
    default: return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
  }
};

const getStatusDot = (status) => {
  switch(status) {
    case 'healthy': return 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]';
    case 'watch': return 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]';
    case 'risk': return 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)] animate-pulse';
    default: return 'bg-slate-500';
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
        setStream((prev) => [...prev, rawDataStream[index]]);
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
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden font-sans">
      
      {/* LEFT PANEL */}
      <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-950">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Raw Data Firehose
            </h2>
            <p className="text-sm text-slate-400 mt-1">Intercepting tool events, logs, and client emails</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Listening
          </div>
        </div>
        
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth pb-24">
          {stream.map((item) => (
            <div key={item.id} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getIconForType(item.type)}
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.source}</span>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  <Clock className="w-3 h-3" /> {item.time}
                </span>
              </div>
              <div className="mb-1 text-sm font-medium text-slate-300">{item.author}</div>
              <p className={`text-sm leading-relaxed ${item.type === 'system' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}>
                {item.text}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 overflow-y-auto">
        <div className="p-8 flex-1 flex flex-col max-w-2xl mx-auto w-full">
          
          <div className="mb-8 text-center mt-8">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
              <Zap className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Decision Latency Digest</h1>
            <p className="text-slate-400 text-sm max-w-sm mx-auto">
              Reducing operational noise into pure actionable intelligence.
            </p>
          </div>

          {!digest ? (
             <div className="flex-1 flex flex-col items-center justify-center">
              <button
                onClick={handleGenerateHeartbeat}
                disabled={isGenerating || stream.length === 0}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2 text-lg">
                  {isGenerating ? <><Loader2 className="w-5 h-5 animate-spin" /> Analyzing 10k+ Tokens...</> : <><Zap className="w-5 h-5" /> Generate Heartbeat</>}
                </span>
              </button>
             </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden pb-4">
              
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-800/40">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Executive Digest</h3>
                  <p className="text-xs text-slate-400">Batched at {digest.timestamp}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                  <Zap className="w-3 h-3" /> LLM Aggregated
                </div>
              </div>
              
              {/* Where to Focus */}
              <div className="p-5 border-b border-white/5 bg-indigo-500/5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4">
                  <Zap className="w-4 h-4" /> Where should I focus?
                </h4>
                <div className="space-y-3">
                  {digest.focus.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start bg-slate-950/50 p-3 rounded-lg border border-indigo-500/10">
                      <Activity className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />
                      <p className="text-sm text-slate-200 leading-snug">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects List */}
              <div className="p-5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Project Health & Deltas
                </h4>
                <div className="space-y-4">
                  {digest.projects.map((proj, i) => (
                    <div key={i} className="group p-4 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all">
                      
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className={`w-2.5 h-2.5 rounded-full ${getStatusDot(proj.status)}`} />
                          <h5 className="text-base font-bold text-white">{proj.name}</h5>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(proj.status)}`}>
                          {proj.status.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-xs font-medium text-slate-400 mb-2">— {proj.statusReason}</p>
                      <p className="text-sm text-slate-300 leading-relaxed mb-4">{proj.summary}</p>

                      {/* Deltas */}
                      <div className="mb-3 space-y-1">
                        <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">Delta (Since Last Update):</p>
                        {proj.deltas.map((delta, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="text-indigo-400 font-bold">+</span> {delta}
                          </div>
                        ))}
                      </div>

                      {/* Escalation & Confidence */}
                      <div className="flex flex-col gap-2 pt-3 border-t border-slate-700/50 mt-3">
                        {proj.recommendation && (
                          <div className="flex gap-2 items-center text-xs font-medium text-rose-300 bg-rose-500/10 p-2 rounded border border-rose-500/20">
                            <Zap className="w-3 h-3 flex-shrink-0" />
                            Escalation: {proj.recommendation}
                          </div>
                        )}
                        {proj.confidence && (
                          <p className="text-[10px] text-slate-500 font-medium tracking-wide">
                            {proj.confidence}
                          </p>
                        )}
                      </div>

                    </div>
                  ))}
                </div>
              </div>

              <div className="p-4 text-center border-t border-white/5">
                <button 
                  onClick={() => setDigest(null)}
                  className="text-xs font-medium text-slate-500 hover:text-white transition-colors"
                >
                  Clear & Resume Listening
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
