import React, { useState, useEffect, useRef } from 'react';
import { rawDataStream, getHeartbeatDigest } from './mockData';

const getIconForType = (type) => {
  switch(type) {
    case 'slack': return <span className="text-pink-400 text-lg">💬</span>;
    case 'email': return <span className="text-blue-400 text-lg">📧</span>;
    case 'jira': return <span className="text-blue-500 text-lg">📋</span>;
    case 'system': return <span className="text-emerald-400 text-lg">⚙️</span>;
    default: return <span className="text-slate-400 text-lg">📌</span>;
  }
};

const getStatusIcon = (status) => {
  switch(status) {
    case 'healthy': return '🟢';
    case 'watch': return '🟡';
    case 'risk': return '🔴';
    default: return '⚪';
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
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden font-sans">
      
      {/* LEFT PANEL */}
      <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-950">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <span className="text-xl">🌊</span>
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
          {stream.map((item, idx) => {
            if (!item) return null;
            return (
            <div key={item.id || idx} className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getIconForType(item.type)}
                  <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider ml-1">{item.source}</span>
                </div>
                <span className="text-xs text-slate-500 flex items-center gap-1">
                  ⏳ {item.time}
                </span>
              </div>
              <div className="mb-1 text-sm font-medium text-slate-300">{item.author}</div>
              <p className={`text-sm leading-relaxed ${item.type === 'system' ? 'text-amber-400 font-medium' : 'text-slate-400'}`}>
                {item.text}
              </p>
            </div>
            );
          })}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="w-1/2 flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950 overflow-y-auto">
        <div className="p-8 flex-1 flex flex-col max-w-2xl mx-auto w-full">
          
          <div className="mb-8 text-center mt-8">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-4 border border-indigo-500/20">
              <span className="text-3xl">⚡</span>
            </div>
            <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Briefly</h1>
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
                  {isGenerating ? <>⏳ Analyzing 10k+ Tokens...</> : <>⚡ Generate Heartbeat</>}
                </span>
              </button>
             </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden pb-4">
              
              {/* Header */}
              <div className="p-5 border-b border-white/5 flex justify-between items-center bg-slate-800/40">
                <div>
                  <h3 className="text-lg font-bold text-white tracking-tight">Executive Digest</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Last updated: {digest.timestamp}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                  🧠 LLM Aggregated
                </div>
              </div>
              
              {/* Where to Focus */}
              <div className="p-5 border-b border-white/5 bg-opacity-50 bg-indigo-950/20">
                <h4 className="flex items-center gap-2 text-sm font-bold text-indigo-300 uppercase tracking-widest mb-4">
                  🎯 Where should I focus?
                </h4>
                <div className="space-y-4">
                  {digest.focus.map((item, i) => (
                    <div key={i} className="flex gap-3 items-start bg-slate-950/60 p-4 rounded-lg border border-indigo-500/10 group">
                      <span className="text-sm mt-0.5">{item.isPositive ? '✅' : '🔴'}</span>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-sm text-slate-200">
                            {item.client && <strong className="text-white font-bold">{item.client}: </strong>}
                            {item.text} <span className="text-slate-500 text-xs font-medium ml-1">(confidence: {item.confidence.toLowerCase()})</span>
                          </p>
                          <span className="text-[10px] text-slate-500 font-medium ml-3 flex-shrink-0">{item.timeAgo}</span>
                        </div>
                        <p className="text-xs font-medium text-emerald-400/90 mt-1">
                          <span className="text-slate-500 mr-1">→</span> {item.impact}
                        </p>
                        
                        {/* Why am I seeing this? (Reveal on Hover) */}
                        <div className="mt-2 text-[10px] text-slate-500/80 font-mono tracking-tight opacity-0 group-hover:opacity-100 transition-opacity">
                          {item.reason}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Projects List */}
              <div className="p-5">
                <h4 className="flex items-center gap-2 text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">
                  Project risks & updates
                </h4>
                <div className="space-y-6">
                  {digest.projects.map((proj, i) => (
                    <div key={i} className="group p-5 rounded-xl bg-slate-800/30 border border-slate-700/50 hover:border-slate-600 transition-all">
                      
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">{getStatusIcon(proj.status)}</span>
                          <h5 className="text-lg font-bold text-white tracking-tight">{proj.name}</h5>
                        </div>
                        <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded border ${getStatusColor(proj.status)}`}>
                          {proj.statusReason.toUpperCase()}
                        </span>
                      </div>

                      <p className="text-sm text-slate-300 leading-relaxed mb-4 pl-6">{proj.summary}</p>

                      {/* Deltas */}
                      <div className="mb-4 pl-6 space-y-1.5">
                        <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2">Delta (Since Last Update):</p>
                        {proj.deltas.map((delta, j) => (
                          <div key={j} className="flex items-center gap-2 text-xs text-slate-300">
                            <span className="text-indigo-400 font-bold opacity-70">+</span> {delta}
                          </div>
                        ))}
                      </div>

                      {/* Escalation & Confidence */}
                      {proj.recommendation && (
                        <div className="ml-6 flex flex-col gap-2 pt-3 border-t border-slate-700/30 mt-3">
                          <div className="flex gap-2 items-center text-xs font-bold text-rose-300 bg-rose-500/10 px-3 py-2 rounded-lg border border-rose-500/20">
                            {proj.recommendation}
                          </div>
                        </div>
                      )}
                      
                      {/* Sub-signals */}
                      {proj.status === 'healthy' && !proj.recommendation && (
                         <div className="ml-6 flex gap-2 items-center text-xs font-bold text-emerald-400/80 bg-emerald-500/10 px-3 py-2 rounded-lg border border-emerald-500/10 mt-3">
                            All stable — no action required.
                         </div>
                      )}

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
