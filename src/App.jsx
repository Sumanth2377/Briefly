import React, { useState, useEffect, useRef } from 'react';
import { Mail, MessageSquare, Layout, Zap, Activity, Clock, CheckCircle, AlertTriangle, XCircle, Loader2 } from 'lucide-react';
import { rawDataStream, getHeartbeatDigest } from './mockData';

const getIconForType = (type) => {
  switch(type) {
    case 'slack': return <MessageSquare className="w-4 h-4 text-pink-400" />;
    case 'email': return <Mail className="w-4 h-4 text-blue-400" />;
    case 'jira': return <Layout className="w-4 h-4 text-blue-500" />;
    default: return <MessageSquare className="w-4 h-4" />;
  }
};

const getStatusIcon = (type) => {
  switch(type) {
    case 'critical': return <XCircle className="w-5 h-5 text-red-500" />;
    case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
    case 'success': return <CheckCircle className="w-5 h-5 text-emerald-500" />;
    default: return <Activity className="w-5 h-5 text-blue-500" />;
  }
};

function App() {
  const [stream, setStream] = useState([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [digest, setDigest] = useState(null);
  const scrollRef = useRef(null);

  // Simulate incoming data stream
  useEffect(() => {
    let index = 0;
    const interval = setInterval(() => {
      if (index < rawDataStream.length) {
        setStream((prev) => [...prev, rawDataStream[index]]);
        index++;
      } else {
        clearInterval(interval);
      }
    }, 1500); // New message every 1.5s
    return () => clearInterval(interval);
  }, []);

  // Auto-scroll the stream
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [stream]);

  const handleGenerateHeartbeat = () => {
    setIsGenerating(true);
    // Simulate LLM Processing time (3 seconds)
    setTimeout(() => {
      setDigest(getHeartbeatDigest());
      setIsGenerating(false);
    }, 3000);
  };

  return (
    <div className="flex h-screen bg-slate-900 text-slate-200 overflow-hidden font-sans">
      
      {/* LEFT PANEL: Raw Data Stream */}
      <div className="w-1/2 border-r border-slate-800 flex flex-col bg-slate-950">
        <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50 backdrop-blur-sm z-10">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-indigo-400" />
              Raw Data Firehose
            </h2>
            <p className="text-sm text-slate-400 mt-1">Intercepting Slack, Email, and Jira events</p>
          </div>
          <div className="flex items-center gap-2 text-xs font-medium px-3 py-1 bg-slate-800 rounded-full border border-slate-700">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Listening
          </div>
        </div>
        
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-6 space-y-4 scroll-smooth pb-24"
        >
          {stream.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-500">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-slate-700" />
              <p>Waiting for incoming events...</p>
            </div>
          ) : (
            stream.map((item) => (
              <div 
                key={item.id} 
                className="p-4 rounded-lg bg-slate-800/50 border border-slate-700/50 hover:border-slate-600 transition-colors animate-in fade-in slide-in-from-bottom-4 duration-500"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {getIconForType(item.type)}
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{item.source}</span>
                  </div>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {item.time}
                  </span>
                </div>
                <div className="mb-1 text-sm font-medium text-slate-300">
                  {item.author}
                </div>
                <p className="text-sm text-slate-400 leading-relaxed">
                  {item.text}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

      {/* RIGHT PANEL: Heartbeat Dashboard */}
      <div className="w-1/2 flex flex-col bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-slate-800 via-slate-900 to-slate-950">
        <div className="p-8 flex-1 flex flex-col max-w-2xl mx-auto w-full">
          
          <div className="mb-12 text-center mt-12">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-500/10 rounded-2xl mb-6 border border-indigo-500/20">
              <Zap className="w-8 h-8 text-indigo-400" />
            </div>
            <h1 className="text-4xl font-bold text-white mb-4 tracking-tight">Livo Heartbeat</h1>
            <p className="text-slate-400 text-lg max-w-md mx-auto">
              Distill the noise of continuous delivery into actionable intelligence.
            </p>
          </div>

          {!digest ? (
             <div className="flex-1 flex flex-col items-center justify-center">
              <button
                onClick={handleGenerateHeartbeat}
                disabled={isGenerating || stream.length === 0}
                className="group relative inline-flex items-center justify-center px-8 py-4 font-bold text-white transition-all duration-200 bg-indigo-600 font-pj rounded-xl focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-indigo-500 hover:shadow-lg hover:shadow-indigo-500/30 overflow-hidden"
              >
                <span className="relative z-10 flex items-center gap-2 text-lg">
                  {isGenerating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Analyzing Signal...
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Generate 30-Min Heartbeat
                    </>
                  )}
                </span>
                
                {/* Glow effect */}
                {!isGenerating && (
                  <div className="absolute inset-0 h-full w-full opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-indigo-400/40 via-transparent to-transparent"></div>
                )}
              </button>
              
              {!isGenerating && stream.length > 0 && (
                <p className="mt-6 text-sm text-slate-500 animate-pulse">
                  {stream.length} events intercepted in the last 30 minutes
                </p>
              )}
             </div>
          ) : (
            <div className="animate-in fade-in slide-in-from-bottom-8 duration-700 bg-slate-900/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl shadow-2xl overflow-hidden">
              <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-800/20">
                <div>
                  <h3 className="text-lg font-semibold text-white">Your Digest</h3>
                  <p className="text-xs text-slate-400">Generated at {digest.timestamp}</p>
                </div>
                <div className="flex items-center gap-2 text-xs font-semibold px-2 py-1 bg-indigo-500/10 text-indigo-400 rounded-md border border-indigo-500/20">
                  <Zap className="w-3 h-3" />
                  AI Summarized
                </div>
              </div>
              
              <div className="p-2">
                {digest.items.map((item, i) => (
                  <div key={i} className="p-4 flex gap-4 hover:bg-slate-800/30 transition-colors border-b border-slate-800/50 last:border-0">
                    <div className="flex-shrink-0 mt-1">
                      {getStatusIcon(item.type)}
                    </div>
                    <div>
                      <h4 className="text-base font-semibold text-slate-200 mb-1">{item.title}</h4>
                      <p className="text-sm text-slate-400 mb-2 leading-relaxed">{item.description}</p>
                      <span className="inline-flex items-center text-[10px] font-bold uppercase tracking-wider text-slate-500 bg-slate-800 px-2 py-1 rounded">
                        via {item.source}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="p-4 bg-slate-950/50 text-center border-t border-slate-800/50">
                <button 
                  onClick={() => setDigest(null)}
                  className="text-xs text-slate-400 hover:text-white transition-colors"
                >
                  Dismiss / Reset Simulator
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
