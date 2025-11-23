import React, { useState, useEffect, useRef } from 'react';
import { 
  ArrowLeft, ArrowRight, RotateCw, Lock, ShieldCheck, Globe, 
  Star, Download, Settings, Moon, Sun, X, FileJson, Upload, 
  Trash2, PlayCircle, HardDrive, ShieldAlert, Zap, Search,
  ExternalLink, Plus, AlertOctagon, Smartphone, Cpu, Clock,
  Layout, Wifi, ArrowUp, ArrowDown
} from 'lucide-react';

interface Bookmark {
  id: string;
  title: string;
  url: string;
  createdAt: number;
}

interface HistoryItem {
  id: string;
  title: string;
  url: string;
  timestamp: number;
}

interface DownloadItem {
  id: string;
  filename: string;
  progress: number; // 0-100
  status: 'downloading' | 'completed' | 'error';
  size: string;
  type: 'video' | 'file';
  date: number;
}

interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  ads: boolean;
}

// Helper to safely access localStorage
const usePersistentState = <T,>(key: string, initialValue: T): [T, React.Dispatch<React.SetStateAction<T>>] => {
  const [state, setState] = useState<T>(() => {
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      console.error(`Error reading ${key} from localStorage`, error);
      return initialValue;
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(state));
    } catch (error) {
      console.error(`Error saving ${key} to localStorage`, error);
    }
  }, [key, state]);

  return [state, setState];
};

const formatSpeed = (bytes: number) => {
  if (bytes < 1024) return `${bytes.toFixed(0)} B/s`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB/s`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB/s`;
};

export const BrowserView: React.FC = () => {
  // --- Core Browser State (Persisted) ---
  const [url, setUrl] = usePersistentState<string>('chimera_url', 'chimera://newtab');
  const [history, setHistory] = usePersistentState<string[]>('chimera_history_stack', ['chimera://newtab']);
  const [historyIndex, setHistoryIndex] = usePersistentState<number>('chimera_history_index', 0);
  
  // Internal UI state (not persisted)
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [internalPage, setInternalPage] = useState<'newtab' | 'search' | 'external'>('newtab');
  const [searchQuery, setSearchQuery] = useState('');

  // --- Feature State ---
  const [theme, setTheme] = usePersistentState<'dark' | 'light'>('chimera_theme', 'dark');
  const [showSettings, setShowSettings] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showDownloads, setShowDownloads] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  
  // --- Data State (Persisted) ---
  const [bookmarks, setBookmarks] = usePersistentState<Bookmark[]>('chimera_bookmarks', [
    { id: '1', title: 'Wikipedia', url: 'https://www.wikipedia.org', createdAt: Date.now() },
    { id: '2', title: 'Hacker News', url: 'https://news.ycombinator.com', createdAt: Date.now() },
    { id: '3', title: 'EFF', url: 'https://www.eff.org', createdAt: Date.now() }
  ]);
  const [visitedHistory, setVisitedHistory] = usePersistentState<HistoryItem[]>('chimera_visited_history', [
    { id: 'init', title: 'New Tab', url: 'chimera://newtab', timestamp: Date.now() }
  ]);
  const [downloads, setDownloads] = usePersistentState<DownloadItem[]>('chimera_downloads', []);
  
  // --- Ephemeral Data State ---
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  
  // --- Ad Blocker State (Persisted) ---
  const [adBlockStats, setAdBlockStats] = usePersistentState('chimera_adblock', { enabled: true, totalBlocked: 1420, sessionBlocked: 0, strictMode: false });
  
  // --- Media Grabber State ---
  const [mediaUrl, setMediaUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- Network Stats Simulation ---
  const [netSpeed, setNetSpeed] = useState({ down: 0, up: 0 });

  useEffect(() => {
    const interval = setInterval(() => {
      // Base traffic (idle chatter)
      let d = Math.random() * 2000; // 0-2 KB/s
      let u = Math.random() * 500;  // 0-0.5 KB/s

      // Loading page spikes
      if (isLoading) {
        d += Math.random() * 8 * 1024 * 1024; // 0-8 MB/s
        u += Math.random() * 200 * 1024;      // 0-200 KB/s
      }

      // Active downloads (huge spike)
      const activeDownloads = downloads.filter(dl => dl.status === 'downloading').length;
      if (activeDownloads > 0) {
        d += activeDownloads * (15 + Math.random() * 25) * 1024 * 1024; // 15-40 MB/s per file
        u += activeDownloads * (50 + Math.random() * 50) * 1024;        // ACK packets
      }

      setNetSpeed({ down: d, up: u });
    }, 1000);
    return () => clearInterval(interval);
  }, [isLoading, downloads]);

  // Sync internalPage and inputValue with URL on mount/update
  useEffect(() => {
    setInputValue(url);
    if (url === 'chimera://newtab') {
      setInternalPage('newtab');
      setInputValue('');
    } else if (url.startsWith('chimera://search')) {
      setInternalPage('search');
      const q = decodeURIComponent(url.split('q=')[1] || '');
      setSearchQuery(q);
      setInputValue(q);
      if (searchResults.length === 0) generateMockResults(q);
    } else {
      setInternalPage('external');
    }
  }, [url]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Cmd/Ctrl + B: Toggle Bookmarks
      if ((e.metaKey || e.ctrlKey) && e.key === 'b') {
        e.preventDefault();
        setShowBookmarks(prev => !prev);
        setShowDownloads(false);
        setShowHistory(false);
      }
      // Cmd/Ctrl + H: Toggle History
      if ((e.metaKey || e.ctrlKey) && e.key === 'h') {
        e.preventDefault();
        setShowHistory(prev => !prev);
        setShowBookmarks(false);
        setShowDownloads(false);
      }
      // Cmd/Ctrl + J: Toggle Downloads
      if ((e.metaKey || e.ctrlKey) && e.key === 'j') {
        e.preventDefault();
        setShowDownloads(prev => !prev);
        setShowBookmarks(false);
        setShowHistory(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Simulate Ad Blocking increments
  useEffect(() => {
    if (!adBlockStats.enabled || !isLoading) return;
    const interval = setInterval(() => {
      if (Math.random() > 0.7) {
        setAdBlockStats(prev => ({
          ...prev,
          totalBlocked: prev.totalBlocked + 1,
          sessionBlocked: prev.sessionBlocked + 1
        }));
      }
    }, 800);
    return () => clearInterval(interval);
  }, [isLoading, adBlockStats.enabled]);

  // Simulate Download Progress
  useEffect(() => {
    const interval = setInterval(() => {
      setDownloads(prev => prev.map(dl => {
        if (dl.status === 'downloading') {
          const newProgress = dl.progress + Math.random() * 8;
          if (newProgress >= 100) {
            return { ...dl, progress: 100, status: 'completed' };
          }
          return { ...dl, progress: newProgress };
        }
        return dl;
      }));
    }, 200);
    return () => clearInterval(interval);
  }, []);

  const addToHistory = (targetUrl: string, title: string) => {
    setVisitedHistory(prev => {
        // Remove duplicate if it's the most recent one to keep stack clean
        if (prev.length > 0 && prev[0].url === targetUrl) return prev;
        return [{
            id: Date.now().toString(),
            title: title || targetUrl,
            url: targetUrl,
            timestamp: Date.now()
        }, ...prev].slice(0, 1000); // Limit history size
    });
  };

  const getFavicon = (targetUrl: string) => {
    if (targetUrl.startsWith('chimera://')) return null;
    try {
      const domain = new URL(targetUrl).hostname;
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
    } catch {
      return null;
    }
  };

  // --- Navigation Logic ---
  const navigate = (input: string) => {
    let target = input.trim();
    let isSearch = false;

    // Handle internal protocols
    if (target === 'chimera://newtab' || target === '') {
      setInternalPage('newtab');
      setUrl('chimera://newtab');
      setInputValue('');
      addToHistory('chimera://newtab', 'New Tab');
      
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push('chimera://newtab');
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      return;
    }

    // Determine if URL or Search
    if (!target.includes('://') && !target.startsWith('chimera://')) {
       // Heuristic: if it has no spaces and has a dot, assume domain. Else search.
       if (target.includes('.') && !target.includes(' ')) {
          if (!target.startsWith('http')) target = 'https://' + target;
       } else {
          isSearch = true;
       }
    }

    setIsLoading(true);
    setAdBlockStats(prev => ({ ...prev, sessionBlocked: 0 }));

    let finalUrl = target;

    if (isSearch) {
       setInternalPage('search');
       setSearchQuery(target);
       finalUrl = `chimera://search?q=${encodeURIComponent(target)}`;
       generateMockResults(target);
       addToHistory(finalUrl, `Search: ${target}`);
    } else {
       setInternalPage('external');
       let hostname = target;
       try { hostname = new URL(target).hostname; } catch(e) {}
       addToHistory(target, hostname);
    }

    setUrl(finalUrl);
    
    // History management (Back/Forward stack)
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(finalUrl);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);

    setTimeout(() => setIsLoading(false), isSearch ? 600 : 1200);
  };

  const generateMockResults = (query: string) => {
     // Deterministic Mock Results based on query hash
     let hash = 0;
     for (let i = 0; i < query.length; i++) {
        hash = ((hash << 5) - hash) + query.charCodeAt(i);
        hash |= 0;
     }
     const seed = Math.abs(hash);

     const mockResults: SearchResult[] = Array.from({ length: 8 }).map((_, i) => {
        const resultSeed = seed + i;
        const types = ['Official', 'Wiki', 'News', 'Blog'];
        return {
            id: i.toString(),
            title: `${query} - Result ${i + 1} (${types[resultSeed % types.length]})`,
            url: `https://www.example.com/${query.replace(/\s+/g, '-')}/${i}`,
            snippet: `This is a simulated search result for "${query}". Chimera Browser protects your privacy by stripping trackers from this result before you click.`,
            ads: (resultSeed % 4) === 0 // Deterministic ads
        };
     });
     setSearchResults(mockResults);
  };

  const handleBack = () => {
     if (historyIndex > 0) {
        const prevUrl = history[historyIndex - 1];
        setHistoryIndex(historyIndex - 1);
        setUrl(prevUrl);
     }
  };

  const handleForward = () => {
    if (historyIndex < history.length - 1) {
        const nextUrl = history[historyIndex + 1];
        setHistoryIndex(historyIndex + 1);
        setUrl(nextUrl);
    }
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
      let title = url;
      if (internalPage === 'search') title = `Search: ${searchQuery}`;
      else if (internalPage === 'newtab') title = 'New Tab';
      else {
         try { title = new URL(url).hostname; } catch {}
      }
      
      setBookmarks(prev => [...prev, {
        id: Date.now().toString(),
        title: title,
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
      type,
      date: Date.now()
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
        <div className="flex items-center gap-1">
          <button 
            onClick={handleBack}
            disabled={historyIndex === 0}
            className={`p-2 hover:bg-slate-700/50 disabled:opacity-30 rounded-lg transition-colors ${textMain}`}
          >
            <ArrowLeft size={18} />
          </button>
          <button 
             onClick={handleForward}
             disabled={historyIndex >= history.length - 1}
             className={`p-2 hover:bg-slate-700/50 disabled:opacity-30 rounded-lg transition-colors ${textMain}`}
          >
             <ArrowRight size={18} />
          </button>
          <button 
            onClick={() => setIsLoading(true)}
            className={`p-2 hover:bg-slate-700/50 rounded-lg transition-colors ${textMain} ${isLoading ? 'animate-spin' : ''}`}
          >
            <RotateCw size={18} />
          </button>
          <button 
            onClick={() => navigate('chimera://newtab')}
            className={`p-2 hover:bg-slate-700/50 rounded-lg transition-colors ${textMain}`}
          >
             <Plus size={18} />
          </button>
        </div>

        {/* Address Bar */}
        <form onSubmit={handleSubmit} className="flex-1 relative group">
          <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
             {url.startsWith('https') || url.startsWith('chimera') ? (
               <Lock size={14} className="text-emerald-500" />
             ) : (
               <Globe size={14} className="text-slate-500" />
             )}
          </div>
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onFocus={(e) => e.target.select()}
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
              onClick={() => { setShowDownloads(!showDownloads); setShowBookmarks(false); setShowHistory(false); }}
              className={`p-2 rounded-lg transition-colors relative ${showDownloads ? 'bg-emerald-500/20 text-emerald-400' : `${textMain} hover:bg-slate-700/50`}`}
              title="Downloads (Cmd+J)"
           >
              <Download size={18} />
              {downloads.some(d => d.status === 'downloading') && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
              )}
           </button>
           <button 
              onClick={() => { setShowBookmarks(!showBookmarks); setShowDownloads(false); setShowHistory(false); }}
              className={`p-2 rounded-lg transition-colors ${showBookmarks ? 'bg-emerald-500/20 text-emerald-400' : `${textMain} hover:bg-slate-700/50`}`}
              title="Bookmarks (Cmd+B)"
           >
              <Star size={18} />
           </button>
           <button 
              onClick={() => { setShowHistory(!showHistory); setShowBookmarks(false); setShowDownloads(false); }}
              className={`p-2 rounded-lg transition-colors ${showHistory ? 'bg-emerald-500/20 text-emerald-400' : `${textMain} hover:bg-slate-700/50`}`}
              title="History (Cmd+H)"
           >
              <Clock size={18} />
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

      {/* Bookmarks Bar */}
      <div className={`flex items-center gap-1 px-3 py-1.5 border-b ${border} ${bgPanel} overflow-x-auto scrollbar-hide h-[40px] flex-shrink-0`}>
          {bookmarks.map(b => {
            const favicon = getFavicon(b.url);
            return (
              <button 
                  key={b.id} 
                  onClick={() => navigate(b.url)}
                  className={`flex items-center gap-2 px-2 py-1 rounded hover:bg-slate-700/50 ${textMain} text-xs transition-colors group flex-shrink-0 max-w-[200px] border border-transparent hover:border-slate-600/50`}
                  title={b.title}
              >
                  {favicon ? (
                     <img src={favicon} alt="" className="w-3.5 h-3.5 rounded-sm opacity-80 group-hover:opacity-100" />
                  ) : (
                     <Globe size={14} className={`${textMuted} group-hover:text-emerald-400`} />
                  )}
                  <span className="truncate font-medium">{b.title}</span>
              </button>
            );
          })}
          {bookmarks.length === 0 && (
             <span className={`text-[10px] ${textMuted} px-1 italic flex items-center gap-2`}>
                <Star size={10} /> bookmarks bar
             </span>
          )}
      </div>

      {/* Main Content Area */}
      <div className={`flex-1 relative ${bgMain} overflow-hidden`}>
        {isLoading && (
           <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-emerald-500 to-transparent animate-shimmer z-50`}></div>
        )}

        {/* Internal Page: New Tab */}
        {internalPage === 'newtab' && (
           <div className="flex flex-col items-center justify-center h-full p-8 animate-in fade-in duration-300">
               <div className="w-24 h-24 bg-gradient-to-br from-emerald-500 to-teal-700 rounded-2xl shadow-2xl flex items-center justify-center mb-8 ring-4 ring-emerald-500/10">
                   <ShieldCheck size={48} className="text-white" />
               </div>
               <h1 className={`text-4xl font-bold mb-8 ${textMain} tracking-tight`}>Chimera Browser</h1>
               
               <form onSubmit={handleSubmit} className="w-full max-w-2xl mb-12">
                   <div className={`flex items-center ${bgPanel} border ${border} rounded-2xl p-2 shadow-lg focus-within:ring-2 focus-within:ring-emerald-500/50 transition-all`}>
                       <Search className="ml-4 text-slate-500" />
                       <input 
                          type="text"
                          value={inputValue}
                          onChange={(e) => setInputValue(e.target.value)}
                          placeholder="Search the web securely..."
                          className={`flex-1 bg-transparent border-none focus:ring-0 p-4 text-lg ${textMain} placeholder:text-slate-600`}
                       />
                       <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-6 py-3 rounded-xl font-medium transition-colors shadow-lg shadow-emerald-600/20">
                           Search
                       </button>
                   </div>
               </form>

               {/* Speed Dials */}
               <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-4xl">
                   {bookmarks.slice(0, 4).map(b => (
                       <button key={b.id} onClick={() => navigate(b.url)} className={`p-4 rounded-xl ${bgPanel} border ${border} hover:border-emerald-500/50 transition-all group text-left relative overflow-hidden`}>
                           <div className="absolute top-0 right-0 w-16 h-16 bg-gradient-to-br from-emerald-500/10 to-transparent rounded-bl-full -mr-8 -mt-8 group-hover:from-emerald-500/20 transition-all"></div>
                           <div className="w-10 h-10 rounded-full bg-slate-700/50 flex items-center justify-center mb-3 group-hover:bg-emerald-500/20 group-hover:text-emerald-400 transition-colors">
                               {getFavicon(b.url) ? (
                                   <img src={getFavicon(b.url)!} alt="" className="w-5 h-5" />
                               ) : (
                                   <Globe size={20} className={textMuted} />
                               )}
                           </div>
                           <div className={`font-medium ${textMain} truncate`}>{b.title}</div>
                           <div className="text-xs text-slate-500 truncate">{b.url.replace('https://', '')}</div>
                       </button>
                   ))}
               </div>
           </div>
        )}

        {/* Internal Page: Search Results */}
        {internalPage === 'search' && (
           <div className="h-full overflow-y-auto p-4 md:p-8">
              <div className="max-w-4xl mx-auto space-y-6">
                 <div className="flex items-center justify-between mb-4">
                     <p className="text-slate-500 text-sm">Found {searchResults.length * 1540} results (0.34 seconds)</p>
                     <div className="flex items-center gap-2 text-emerald-500 text-xs bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                         <ShieldCheck size={12} />
                         <span>Tracking Protection Active</span>
                     </div>
                 </div>

                 {searchResults.map((result) => (
                    <div key={result.id} className={`p-4 rounded-xl border ${border} ${bgPanel} transition-all relative overflow-hidden group hover:border-slate-600`}>
                        {result.ads && adBlockStats.enabled ? (
                            <div className="flex items-center justify-between text-slate-500 italic text-sm bg-red-500/5 p-2 rounded -mx-2 -my-2 border border-red-500/10">
                                <span className="flex items-center gap-2"><AlertOctagon size={14} className="text-red-400"/> Ad blocked by Chimera Shield</span>
                                <button className="text-xs hover:text-slate-300 underline decoration-dotted">Show anyway</button>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-1">
                                    <div className="w-6 h-6 rounded-full bg-slate-700/50 flex items-center justify-center text-[10px] text-white font-bold border border-slate-600">
                                        {result.url.includes('example') ? 'E' : result.url[8].toUpperCase()}
                                    </div>
                                    <div className="text-xs text-slate-500 truncate">{result.url}</div>
                                </div>
                                <h3 
                                    onClick={() => navigate(result.url)}
                                    className={`text-xl font-medium ${theme === 'dark' ? 'text-blue-400 group-hover:text-blue-300' : 'text-blue-600 group-hover:text-blue-700'} cursor-pointer mb-2`}
                                >
                                    {result.title}
                                </h3>
                                <p className={`text-sm ${textMuted} leading-relaxed`}>
                                    {result.snippet}
                                </p>
                            </>
                        )}
                    </div>
                 ))}
              </div>
           </div>
        )}

        {/* External Iframe */}
        {internalPage === 'external' && (
            <div className="w-full h-full bg-white relative">
                 {/* Iframe Fallback/Simulation Message */}
                 <div className="absolute inset-0 flex items-center justify-center bg-slate-100 text-slate-900 pointer-events-none z-0">
                     <div className="text-center p-8">
                         <div className="w-20 h-20 bg-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                             <Globe className="w-10 h-10 text-slate-400" />
                         </div>
                         <h3 className="font-bold text-2xl text-slate-700">Preview Mode</h3>
                         <p className="text-slate-500 mt-2 max-w-md mx-auto">
                           You are viewing <strong>{url}</strong> in a secure sandboxed environment.
                         </p>
                         <div className="mt-8 flex gap-4 justify-center">
                             <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-200/50 px-3 py-2 rounded">
                                <ShieldCheck size={14}/> TLS 1.3
                             </div>
                             <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-200/50 px-3 py-2 rounded">
                                <Lock size={14}/> AES-256
                             </div>
                         </div>
                     </div>
                 </div>
                 <iframe
                    src={url}
                    className="w-full h-full border-none relative z-10"
                    title="Content"
                    sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-modals allow-presentation"
                    referrerPolicy="no-referrer"
                />
            </div>
        )}

        {/* --- Side Panels (Inside Relative Container) --- */}
        
        {/* Bookmarks Panel */}
        {showBookmarks && (
          <div className={`absolute top-0 right-0 w-80 bottom-0 ${bgPanel} border-l ${border} shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200`}>
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
                   <div key={b.id} className="group flex items-center justify-between p-2 hover:bg-slate-700/30 rounded-lg cursor-pointer transition-colors">
                      <div onClick={() => navigate(b.url)} className="flex items-center gap-3 flex-1 overflow-hidden">
                         <div className="w-8 h-8 rounded bg-slate-700/50 flex items-center justify-center flex-shrink-0">
                           {getFavicon(b.url) ? <img src={getFavicon(b.url)!} className="w-4 h-4"/> : <Globe size={14} className={textMuted}/>}
                         </div>
                         <div className="overflow-hidden">
                             <div className={`text-sm font-medium ${textMain} truncate`}>{b.title}</div>
                             <div className="text-xs text-slate-500 truncate">{b.url}</div>
                         </div>
                      </div>
                      <button 
                         onClick={(e) => { e.stopPropagation(); setBookmarks(prev => prev.filter(x => x.id !== b.id)); }}
                         className="opacity-0 group-hover:opacity-100 p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-all"
                      >
                         <Trash2 size={14} />
                      </button>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* History Panel */}
        {showHistory && (
          <div className={`absolute top-0 right-0 w-80 bottom-0 ${bgPanel} border-l ${border} shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200`}>
             <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className={`font-bold ${textMain} flex items-center gap-2`}>
                   <Clock className="text-blue-400" size={16} /> History
                </h3>
                <div className="flex gap-2">
                   <button 
                      onClick={() => setVisitedHistory([])} 
                      title="Clear History" 
                      className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-400 flex items-center gap-1 text-xs"
                   >
                      <Trash2 size={12}/> Clear
                   </button>
                   <button onClick={() => setShowHistory(false)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-500"><X size={16}/></button>
                </div>
             </div>
             <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {visitedHistory.length === 0 && (
                  <div className="text-center py-12 flex flex-col items-center">
                    <Clock size={32} className="text-slate-600 mb-2 opacity-50"/>
                    <div className="text-slate-500 text-sm italic">No history yet.</div>
                  </div>
                )}
                {visitedHistory.map(item => (
                   <div key={item.id} className="group flex flex-col p-3 hover:bg-slate-700/30 rounded-lg cursor-pointer border-b border-slate-700/30 last:border-0 transition-colors" onClick={() => navigate(item.url)}>
                      <div className={`text-sm font-medium ${textMain} truncate`}>{item.title}</div>
                      <div className="text-xs text-slate-500 truncate mb-1">{item.url}</div>
                      <div className="text-[10px] text-slate-600 font-mono flex items-center gap-1">
                        <Clock size={8}/>
                        {new Date(item.timestamp).toLocaleTimeString()}
                      </div>
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* Downloads / YTTD Panel */}
        {showDownloads && (
          <div className={`absolute top-0 right-0 w-96 bottom-0 ${bgPanel} border-l ${border} shadow-2xl z-30 flex flex-col animate-in slide-in-from-right duration-200`}>
             <div className="p-4 border-b border-slate-700 flex justify-between items-center">
                <h3 className={`font-bold ${textMain} flex items-center gap-2`}>
                   <Download className="text-emerald-500" size={16} /> Download Manager
                </h3>
                <div className="flex gap-2">
                   <button onClick={() => setDownloads([])} className="p-1.5 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-400 flex items-center gap-1 text-xs"><Trash2 size={12}/> Clear</button>
                   <button onClick={() => setShowDownloads(false)} className="p-1 hover:bg-red-500/20 hover:text-red-400 rounded text-slate-500"><X size={16}/></button>
                </div>
             </div>
             
             {/* Media Grabber Tool */}
             <div className={`p-4 border-b ${border} bg-slate-900/20`}>
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
                   <div className="text-center py-10 text-slate-500 text-sm flex flex-col items-center">
                     <HardDrive size={32} className="text-slate-600 mb-2 opacity-50"/>
                     No downloads active.
                   </div>
                )}
                {downloads.map(dl => (
                   <div key={dl.id} className={`p-3 rounded-lg border ${border} ${bgMain}`}>
                      <div className="flex items-center gap-3 mb-2">
                         <div className={`p-2 rounded-full ${dl.type === 'video' ? 'bg-purple-500/20 text-purple-400' : 'bg-blue-500/20 text-blue-400'}`}>
                            {dl.type === 'video' ? <PlayCircle size={16} /> : <FileJson size={16} />}
                         </div>
                         <div className="flex-1 overflow-hidden">
                            <div className={`text-sm font-medium ${textMain} truncate`}>{dl.filename}</div>
                            <div className="text-xs text-slate-500 flex justify-between">
                               <span>{dl.size} • {dl.status}</span>
                               <span>{new Date(dl.date).toLocaleDateString()}</span>
                            </div>
                         </div>
                      </div>
                      {dl.status === 'downloading' ? (
                         <div className="h-1.5 w-full bg-slate-700 rounded-full overflow-hidden">
                            <div className="h-full bg-emerald-500 transition-all duration-300" style={{ width: `${dl.progress}%` }}></div>
                         </div>
                      ) : (
                         <button className="w-full text-xs bg-slate-700 hover:bg-slate-600 text-slate-200 py-1 rounded transition-colors flex items-center justify-center gap-2">
                            <Layout size={12}/> Open File
                         </button>
                      )}
                   </div>
                ))}
             </div>
          </div>
        )}

        {/* Settings Modal */}
        {showSettings && (
          <div className="absolute inset-0 z-40 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
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
                         
                         <div className="flex items-center justify-between mb-4 pt-4 border-t border-slate-700/50">
                            <span className={`text-sm ${textMain}`}>Strict Mode (Breaks some sites)</span>
                            <button 
                               onClick={() => setAdBlockStats(prev => ({ ...prev, strictMode: !prev.strictMode }))}
                               className={`w-10 h-5 rounded-full relative transition-colors ${adBlockStats.strictMode ? 'bg-purple-500' : 'bg-slate-600'}`}
                            >
                               <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${adBlockStats.strictMode ? 'translate-x-5' : 'translate-x-0'}`} />
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
                         <button onClick={() => { setHistory(['chimera://newtab']); setHistoryIndex(0); setVisitedHistory([]); setDownloads([]); setUrl('chimera://newtab'); }} className={`flex-1 py-2 px-4 rounded-lg border border-red-900/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm flex items-center justify-center gap-2`}>
                            <Trash2 size={16} /> Reset Browser
                         </button>
                      </div>
                   </div>

                </div>
             </div>
          </div>
        )}

      {/* Footer Status */}
      <div className={`${theme === 'dark' ? 'bg-slate-900' : 'bg-slate-100'} border-t ${border} px-4 py-1.5 flex justify-between items-center text-[10px] text-slate-500 font-mono transition-colors duration-300`}>
         <div className="flex-1 flex gap-4">
             <span className="flex items-center gap-1"><Zap size={10} className="text-yellow-500"/> Speed: Optimized</span>
             <span className="flex items-center gap-1"><HardDrive size={10} className="text-blue-500"/> Cache: Encrypted</span>
             <span className="flex items-center gap-1"><Cpu size={10} className="text-purple-500"/> GPU: Isolated</span>
         </div>
         
         <div className="flex-none mx-4">
            <div className={`flex items-center gap-3 px-3 py-0.5 rounded-full border ${theme === 'dark' ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-300'} shadow-sm`}>
                <Wifi size={12} className={`${netSpeed.down > 1024 * 1024 ? 'text-emerald-500 animate-pulse' : 'text-slate-400'}`} />
                <div className="flex items-center gap-1.5 min-w-[60px]">
                    <ArrowDown size={10} className={netSpeed.down > 0 ? 'text-emerald-500' : 'text-slate-400'} />
                    <span className={`font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{formatSpeed(netSpeed.down)}</span>
                </div>
                <div className={`w-px h-3 ${theme === 'dark' ? 'bg-slate-700' : 'bg-slate-300'}`}></div>
                <div className="flex items-center gap-1.5 min-w-[60px]">
                    <ArrowUp size={10} className={netSpeed.up > 0 ? 'text-blue-500' : 'text-slate-400'} />
                    <span className={`font-mono ${theme === 'dark' ? 'text-slate-300' : 'text-slate-700'}`}>{formatSpeed(netSpeed.up)}</span>
                </div>
            </div>
         </div>

         <div className="flex-1 flex justify-end gap-4">
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