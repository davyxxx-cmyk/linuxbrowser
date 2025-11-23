import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, RotateCw, Lock, ShieldCheck, Globe, 
  Star, Download, Settings, Moon, Sun, X, FileJson, Upload, 
  Trash2, PlayCircle, HardDrive, ShieldAlert, Zap
} from 'lucide-react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

interface DownloadItem {
  id: string;
  filename: string;
  progress: number; // 0-100
  status: 'downloading' | 'completed' | 'error';
  size: string;
  type: 'video' | 'file';
}

export const BrowserView: React.FC = () => {
  // --- Core Browser State ---
  const [url, setUrl] = useState('https://www.wikipedia.org');
  const [inputValue, setInputValue] = useState('https://www.wikipedia.org');
  const [isLoading, setIsLoading] = useState(false);
  const [history, setHistory] = useState<string[]>(['https://www.wikipedia.org']);
  const [historyIndex, setHistoryIndex] = useState(0);

  // --- Feature State ---
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  
  // --- Data State ---
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([
    { id: '1', title: 'Wikipedia', url: 'https://www.wikipedia.org', createdAt: Date.now() },
    { id: '2', title: 'DuckDuckGo', url: 'https://duckduckgo.com', createdAt: Date.now() }
  ]);
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  
  // --- Ad Blocker State ---
  const [adBlockStats, setAdBlockStats] = useState({ enabled: true, totalBlocked: 1420, sessionBlocked: 0 });
  
  // --- Media Grabber State ---
  const [mediaUrl, setMediaUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Simulate Ad Blocking increments
  useEffect(() => {
    if (!adBlockStats.enabled || !isLoading) return;
    const interval = setInterval(() => {
      setAdBlockStats(prev => ({
        ...prev,
        totalBlocked: prev.totalBlocked + 1,
        sessionBlocked: prev.sessionBlocked + 1
      }));
    }, 1500);
    return () => clearInterval(interval);
  }, [isLoading, adBlockStats.enabled]);

  // Simulate Downloads
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads(prev => prev.map(dl => {
        if (dl.status === 'downloading') {
          const newProgress = dl.progress + Math.random() * 10;
          if (newProgress >= 100) {
            return { ...dl, progress: 100, status: 'completed' };
          }
          return { ...dl, progress: newProgress };
        }
        return dl;
      }));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  // --- Navigation Logic ---
  const navigate = (newUrl: string) => {
    let target = newUrl;
    if (!target.startsWith('http://') && !target.startsWith('https://')) {
        if (target.includes('.') && !target.includes(' ')) {
             target = 'https://' + target;
        } else {
             target = `https://www.bing.com/search?q=${encodeURIComponent(target)}`;
        }
    }
    
    setIsLoading(true);
    setUrl(target);
    setInputValue(target);
    setAdBlockStats(prev => ({ ...prev, sessionBlocked: 0 }));
    
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(target);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setTimeout(() => setIsLoading(false), 1500);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigate(inputValue);
  };

  // --- Bookmark Logic ---
  const toggleBookmark = () => {
    const exists = bookmarks.find(b => b.url === url);
    if (exists) {
      setBookmarks(prev => prev.filter(b => b.url !== url));
    } else {
      setBookmarks(prev => [...prev, {
        id: Date.now().toString(),
        title: new URL(url).hostname,
        url: url,
        createdAt: Date.now()
      }]);
    }
  };

  const exportBookmarks = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(bookmarks));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", "chimera_bookmarks.json");
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  };

  const importBookmarks = (event: React.ChangeEvent<HTMLInputElement>) => {
    const fileReader = new FileReader();
    if (event.target.files && event.target.files[0]) {
      fileReader.readAsText(event.target.files[0], "UTF-8");
      fileReader.onload = (e) => {
        try {
          const parsed = JSON.parse(e.target?.result as string);
          if (Array.isArray(parsed)) setBookmarks(prev => [...prev, ...parsed]);
        } catch (err) {
          console.error("Invalid bookmark file");
        }
      };
    }
  };

  // --- Download Logic ---
  const startDownload = (simulatedFilename: string, type: 'video' | 'file') => {
    const newDl: DownloadItem = {
      id: Date.now().toString(),
      filename: simulatedFilename,
      progress: 0,
      status: 'downloading',
      size: type === 'video' ? '145.2 MB' : '12.5 MB',
      type
    };
    setDownloads(prev => [newDl, ...prev]);
    setShowDownloads(true);
  };

  const handleMediaGrab = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mediaUrl) return;
    const filename = `video_${Math.floor(Math.random() * 1000)}.mp4`;
    startDownload(filename, 'video');
    setMediaUrl('');
  };

  // --- Styles ---
  const bgMain = theme === 'dark' ? 'bg-slate-900' : 'bg-slate-50';
  const bgPanel = theme === 'dark' ? 'bg-slate-800' : 'bg-white';
  const textMain = theme === 'dark' ? 'text-slate-200' : 'text-slate-800';
  const textMuted = theme === 'dark' ? 'text-slate-400' : 'text-slate-500';
  const border = theme === 'dark' ? 'border-slate-700' : 'border-slate-200';
  const inputBg = theme === 'dark' ? 'bg-slate-950' : 'bg-slate-100';

  return (
    <div className={`flex flex-col h-full ${bgMain} rounded-xl border ${border} shadow-2xl overflow-hidden transition-colors duration-300 relative`}>
      
      {/* Browser Toolbar */}
      <div className={`${bgPanel} p-2 flex items-center gap-2 border-b ${border}`}>
        {/* Navigation Controls */}
        <div className="flex items-center gap-1">
          <button 
            onClick={() => historyIndex > 0 && navigate(history[historyIndex - 1])}
            disabled={historyIndex === 0}
            className={`p-2 hover:bg-slate-700/50 disabled:opacity-30 rounded-lg transition-colors ${textMain}`}
          >
            <ArrowLeft size={18} />
          </button>
          <button 
            onClick={() => historyIndex < history.length - 1 && navigate(history[historyIndex + 1])}
            disabled={historyIndex === history.length - 1}
            className={`p-2 hover:bg-slate-700/50 disabled:opacity-30 rounded-lg transition-colors ${textMain}`}
          >
            <ArrowRight size={18} />
          </button>
          <button 
            onClick={() => { setIsLoading(true); setTimeout(() => setIsLoading(false), 800); }}
            className={`p-2 hover:bg-slate-700/50 rounded-lg transition-colors ${textMain} ${isLoading ? 'animate-spin' : ''}`}
          >
            <RotateCw size={18} />
          </button>
        </div>

        {/* Address Bar */}
        <form onSubmit={handleSubmit} className="flex-1 relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
             {url.startsWith('https') ? (
               <Lock size={14} className="text-emerald-500" />
             ) : (
               <Globe size={14} className="text-slate-500" />
             )}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className={`w-full ${inputBg} border ${border} group-focus-within:border-emerald-500/50 rounded-lg py-2 pl-9 pr-36 text-sm ${textMain} focus:outline-none font-mono transition-all placeholder:text-slate-600`}
            placeholder="Search or enter address"
          />
          <div className="absolute inset-y-0 right-2 flex items-center gap-2">
            {adBlockStats.enabled && (
               <span className="flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 cursor-help" title="Chimera Shield Active">
                  <ShieldCheck size={10} />
                  {adBlockStats.sessionBlocked}
               </span>
            )}
            <button 
              type="button"
              onClick={toggleBookmark}
              className={`p-1 rounded-md transition-colors ${bookmarks.find(b => b.url === url) ? 'text-yellow-400' : 'text-slate-500 hover:text-slate-300'}`}
            >
               <Star size={14} fill={bookmarks.find(b => b.url === url) ? "currentColor" : "none"} />
            </button>
          </div>
        </form>

        {/* Feature Buttons */}
        <div className="flex items-center gap-1 px-2 border-l border-slate-700/50 ml-1">
           <button 
              onClick={() => setShowDownloads(!showDownloads)}
              className={`p-2 rounded-lg transition-colors relative ${showDownloads ? 'bg-emerald-500/20 text-emerald-400' : `${textMain} hover:bg-slate-700/50`}`}
              title="Downloads"
           >
              <Download size={18} />
              {downloads.some(d => d.status === 'downloading') && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              )}
           </button>
           <button 
              onClick={() => setShowBookmarks(!showBookmarks)}
              className={`p-2 rounded-lg transition-colors ${showBookmarks ? 'bg-emerald-500/20 text-emerald-400' : `${textMain} hover:bg-slate-700/50`}`}
              title="Bookmarks"
           >
              <Star size={18} />
           </button>
           <button 
              onClick={() => setShowSettings(true)}
              className={`p-2 rounded-lg transition-colors ${textMain} hover:bg-slate-700/50`}
              title="Settings"
           >
              <Settings size={18} />
           </button>
        </div>
      </div>

      {/* Main Content Area (Iframe) */}
      <div className="flex-1 relative bg-white overflow-hidden">
        {isLoading && (
           <div className={`absolute inset-0 z-10 flex flex-col items-center justify-center ${theme === 'dark' ? 'bg-slate-900/90' : 'bg-slate-50/90'}`}>
              <div className="w-16 h-16 border-4 border-slate-700 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
              <div className="flex flex-col items-center gap-2">
                 <h3 className="text-emerald-400 font-bold tracking-wider">CHIMERA NETWORK</h3>
                 <p className="text-slate-400 font-mono text-xs">Anonymizing route via 3 nodes...</p>
                 <div className="flex gap-1 mt-2">
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                    <div className="w-2 h-2 bg-emerald-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                 </div>
              </div>
           </div>
        )}
        <iframe
          src={url}
          className="w-full h-full border-none"
          title="Content"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
          referrerPolicy="no-referrer"
        />
      </div>

      {/* Bookmarks Panel */}
      {showBookmarks && (
        <div className={`absolute top-[52px] right-0 w-80 bottom-0 ${bgPanel} border-l ${border} shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200`}>
           <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className={`font-bold ${textMain} flex items-center gap-2`}>
                 <Star className="text-yellow-500" size={16} /> Bookmarks
              </h3>
              <div className="flex gap-2">
                 <button onClick={exportBookmarks} title="Export JSON" className="p-1.5 hover:bg-slate-700 rounded text-slate-400"><Download size={14}/></button>
                 <label className="p-1.5 hover:bg-slate-700 rounded text-slate-400 cursor-pointer">
                    <Upload size={14}/>
                    <input type="file" ref={fileInputRef} onChange={importBookmarks} className="hidden" accept=".json"/>
                 </label>
                 <button onClick={() => setShowBookmarks(false)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-500"><X size={16}/></button>
              </div>
           </div>
           <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {bookmarks.map(b => (
                 <div key={b.id} className="group flex items-center justify-between p-2 hover:bg-slate-700/30 rounded-lg cursor-pointer">
                    <div onClick={() => navigate(b.url)} className="flex-1 overflow-hidden">
                       <div className={`text-sm font-medium ${textMain} truncate`}>{b.title}</div>
                       <div className="text-xs text-slate-500 truncate">{b.url}</div>
                    </div>
                    <button 
                       onClick={(e) => { e.stopPropagation(); setBookmarks(prev => prev.filter(x => x.id !== b.id)); }}
                       className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500/20 text-red-400 rounded transition-all"
                    >
                       <Trash2 size={14} />
                    </button>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Downloads / YTTD Panel */}
      {showDownloads && (
        <div className={`absolute top-[52px] right-0 w-96 bottom-0 ${bgPanel} border-l ${border} shadow-2xl z-20 flex flex-col animate-in slide-in-from-right duration-200`}>
           <div className="p-4 border-b border-slate-700 flex justify-between items-center">
              <h3 className={`font-bold ${textMain} flex items-center gap-2`}>
                 <Download className="text-emerald-500" size={16} /> Download Manager
              </h3>
              <button onClick={() => setShowDownloads(false)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-500"><X size={16}/></button>
           </div>
           
           {/* Media Grabber Tool */}
           <div className="p-4 border-b border-slate-700/50 bg-slate-900/20">
              <label className="text-xs font-bold text-slate-500 uppercase mb-2 block flex items-center gap-2">
                 <PlayCircle size={12}/> Media Grabber (YTTD)
              </label>
              <form onSubmit={handleMediaGrab} className="flex gap-2">
                 <input 
                   value={mediaUrl}
                   onChange={(e) => setMediaUrl(e.target.value)}
                   placeholder="Paste video URL here..."
                   className={`flex-1 text-xs ${inputBg} border ${border} rounded px-2 py-1.5 ${textMain} focus:outline-none focus:border-emerald-500`}
                 />
                 <button type="submit" disabled={!mediaUrl} className="bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white px-3 py-1 rounded text-xs font-medium">
                    Grab
                 </button>
              </form>
           </div>

           <div className="flex-1 overflow-y-auto p-2 space-y-2">
              {downloads.length === 0 && (
                 <div className="text-center py-10 text-slate-500 text-sm">No downloads yet.</div>
              )}
              {downloads.map(dl => (
                 <div key={dl.id} className={`p-3 rounded-lg border ${border} ${bgMain}`}>
                    <div className="flex items-center gap-3 mb-2">
                       <div className={`p-2 rounded-full ${dl.type === 'video' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                          {dl.type === 'video' ? <PlayCircle size={16} /> : <FileJson size={16} />}
                       </div>
                       <div className="flex-1 overflow-hidden">
                          <div className={`text-sm font-medium ${textMain} truncate`}>{dl.filename}</div>
                          <div className="text-xs text-slate-500">{dl.size} • {dl.status}</div>
                       </div>
                    </div>
                    {dl.status === 'downloading' ? (
                       <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${dl.progress}%` }}></div>
                       </div>
                    ) : (
                       <button className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 py-1 rounded transition-colors">
                          Open File
                       </button>
                    )}
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="absolute inset-0 z-30 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
           <div className={`w-full max-w-lg ${bgPanel} rounded-xl shadow-2xl border ${border} animate-in zoom-in-95 duration-200`}>
              <div className="p-6 border-b border-slate-700 flex justify-between items-center">
                 <h2 className={`text-xl font-bold ${textMain} flex items-center gap-2`}>
                    <Settings className="text-slate-400" /> Browser Settings
                 </h2>
                 <button onClick={() => setShowSettings(false)} className={`p-2 rounded-lg hover:bg-slate-700/50 ${textMain}`}><X size={20} /></button>
              </div>
              
              <div className="p-6 space-y-6">
                 
                 {/* Theme Section */}
                 <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Appearance</h3>
                    <div className="flex gap-4">
                       <button 
                          onClick={() => setTheme('dark')}
                          className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'dark' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800'}`}
                       >
                          <Moon size={24} className={theme === 'dark' ? 'text-emerald-400' : 'text-slate-400'} />
                          <span className={`text-sm font-medium ${theme === 'dark' ? 'text-emerald-400' : 'text-slate-400'}`}>Dark Mode</span>
                       </button>
                       <button 
                          onClick={() => setTheme('light')}
                          className={`flex-1 p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${theme === 'light' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 bg-slate-800'}`}
                       >
                          <Sun size={24} className={theme === 'light' ? 'text-emerald-500' : 'text-slate-400'} />
                          <span className={`text-sm font-medium ${theme === 'light' ? 'text-emerald-500' : 'text-slate-400'}`}>Light Mode</span>
                       </button>
                    </div>
                 </div>

                 {/* AdBlock Section */}
                 <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Chimera Shield (Ad-Blocker)</h3>
                    <div className={`p-4 rounded-xl border ${border} ${bgMain}`}>
                       <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-full ${adBlockStats.enabled ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-700 text-slate-500'}`}>
                                <ShieldCheck size={20} />
                             </div>
                             <div>
                                <div className={`font-bold ${textMain}`}>Enhanced Tracking Protection</div>
                                <div className="text-xs text-slate-500">Block ads, trackers, and miners</div>
                             </div>
                          </div>
                          <button 
                             onClick={() => setAdBlockStats(prev => ({ ...prev, enabled: !prev.enabled }))}
                             className={`w-12 h-6 rounded-full relative transition-colors ${adBlockStats.enabled ? 'bg-emerald-500' : 'bg-slate-600'}`}
                          >
                             <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-transform ${adBlockStats.enabled ? 'translate-x-6' : 'translate-x-0'}`} />
                          </button>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700/50">
                             <div className="text-2xl font-mono font-bold text-emerald-400">{adBlockStats.totalBlocked.toLocaleString()}</div>
                             <div className="text-xs text-slate-500">Total Threats Blocked</div>
                          </div>
                          <div className="bg-slate-900/30 p-3 rounded-lg border border-slate-700/50">
                             <div className="text-2xl font-mono font-bold text-emerald-400">{adBlockStats.sessionBlocked}</div>
                             <div className="text-xs text-slate-500">Blocked This Session</div>
                          </div>
                       </div>
                    </div>
                 </div>

                 {/* Data Section */}
                 <div>
                    <h3 className="text-xs font-bold text-slate-500 uppercase mb-3">Data Management</h3>
                    <div className="flex gap-2">
                       <button onClick={exportBookmarks} className={`flex-1 py-2 px-4 rounded-lg border ${border} ${bgMain} hover:bg-slate-700/50 ${textMain} text-sm flex items-center justify-center gap-2`}>
                          <FileJson size={16} /> Export Bookmarks
                       </button>
                       <button onClick={() => setHistory([])} className={`flex-1 py-2 px-4 rounded-lg border border-red-900/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm flex items-center justify-center gap-2`}>
                          <Trash2 size={16} /> Clear History
                       </button>
                    </div>
                 </div>

              </div>
           </div>
        </div>
      )}
      
      {/* Footer Status */}
      <div className={`${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} border-t ${border} px-4 py-1.5 flex justify-between items-center text-[10px] text-slate-500 font-mono transition-colors duration-300`}>
         <div className="flex gap-4">
             <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-500"/> Speed: Optimized</span>
             <span className="flex items-center gap-1"><HardDrive size={10} className="text-blue-500"/> Cache: Encrypted</span>
         </div>
         <div className="flex gap-4">
             <span className={`flex items-center gap-1.5 ${adBlockStats.enabled ? 'text-emerald-500' : 'text-red-500'}`}>
                 <span className={`w-1.5 h-1.5 rounded-full ${adBlockStats.enabled ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
                 AdBlock: {adBlockStats.enabled ? 'ON' : 'OFF'}
             </span>
             <span className="flex items-center gap-1"><ShieldAlert size={10}/> Fingerprinting: BLOCKED</span>
         </div>
      </div>
    </div>
  );
};
