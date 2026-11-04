import React, { useState, useRef } from 'react';
import { Search, Send, Paperclip, Sparkles, FileText, Globe, Bot } from 'lucide-react';
import { User } from '../types';

interface ResearcherPanelProps {
  currentUser: User;
  darkMode: boolean;
}

type SearchEngine = 'tavily' | 'serpapi' | 'gemini' | 'exa' | 'firecrawl' | 'all';

interface SearchResultItem {
  id: string;
  query: string;
  engine: SearchEngine;
  response: string;
  timestamp: string;
  fileName?: string;
}

export const ResearcherPanel: React.FC<ResearcherPanelProps> = ({
  currentUser,
  darkMode
}) => {
  const [selectedEngine, setSelectedEngine] = useState<SearchEngine>('all');
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResultItem[]>([]);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFileName(file.name);
    }
  };

  const handleSearchSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && !uploadedFileName) return;

    setIsSearching(true);
    const searchQuery = query.trim();
    const currentEngine = selectedEngine;

    try {
      const res = await fetch('/api/ai-search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: searchQuery || (uploadedFileName ? `Fayl tahlili: ${uploadedFileName}` : 'Qidiruv'),
          engine: currentEngine
        })
      });

      const data = await res.json();
      const responseText = data.text || "Qidiruv natijasi olindi.";

      const newItem: SearchResultItem = {
        id: `SR-${Date.now()}`,
        query: searchQuery || (uploadedFileName ? `Fayl tahlili: ${uploadedFileName}` : 'Qidiruv'),
        engine: currentEngine,
        response: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        fileName: uploadedFileName || undefined
      };

      setSearchResults(prev => [newItem, ...prev]);
    } catch (err: any) {
      const errorItem: SearchResultItem = {
        id: `SR-${Date.now()}`,
        query: searchQuery,
        engine: currentEngine,
        response: `Xatolik yuz berdi: ${err?.message || 'Server xatosi'}. Iltimos qaytadan urinib ko'ring.`,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setSearchResults(prev => [errorItem, ...prev]);
    } finally {
      setQuery('');
      setUploadedFileName(null);
      setIsSearching(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold flex items-center space-x-2">
            <Search className="w-6 h-6 text-blue-500" />
            <span>Aqlli Qidiruv (Researcher Panel)</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Tavily, SerpAPI, Gemini (ai.google.dev), Exa.ai va Firecrawl.dev servislaridan jonli Python backend orqali ma'lumot olish
          </p>
        </div>

        {/* Engine Dropdown */}
        <div className="w-full md:w-72">
          <label className="text-[10px] font-bold uppercase text-slate-400 block mb-1">Qidiruv Tizimini Tanlang</label>
          <select
            id="researcher-engine-select"
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value as SearchEngine)}
            className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-blue-500 focus:outline-none"
          >
            <option value="all">🚀 Barcha 5 Qidiruv Tizimi (All)</option>
            <option value="tavily">🌐 Tavily (tavily.com)</option>
            <option value="serpapi">🔍 SerpAPI (serpapi.com)</option>
            <option value="gemini">✨ Google Gemini (ai.google.dev)</option>
            <option value="exa">⚡ Exa AI (exa.ai)</option>
            <option value="firecrawl">🔥 Firecrawl (firecrawl.dev)</option>
          </select>
        </div>
      </div>

      {/* Main Search Interface Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        {/* Search Query & Results Stream (Left / Center) */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Query Form */}
          <form onSubmit={handleSearchSubmit} className={`p-4 rounded-3xl border ${
            darkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'
          } shadow-sm space-y-3`}>
            
            <div className="flex items-center space-x-3">
              <input 
                type="file" 
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden" 
              />

              <button
                id="researcher-file-upload-btn"
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 transition flex-shrink-0"
                title="Qurilmadan fayl yuklash"
              >
                <Paperclip className="w-5 h-5" />
              </button>

              <input 
                id="researcher-query-input"
                type="text"
                placeholder="Savol yoki qidirmoqchi bo'lgan narsani yozing..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="flex-grow px-4 py-3 rounded-2xl bg-slate-50 dark:bg-slate-800 border-transparent focus:outline-none focus:border-blue-500 text-xs"
              />

              <button
                id="researcher-search-btn"
                type="submit"
                disabled={isSearching}
                className="px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs transition shadow-md active:scale-95 flex items-center space-x-2 disabled:opacity-50 flex-shrink-0"
              >
                {isSearching ? <Sparkles className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                <span>{isSearching ? 'Qidirilmoqda...' : 'Qidirish'}</span>
              </button>
            </div>

            {uploadedFileName && (
              <div className="text-xs text-blue-400 flex items-center space-x-2 px-2">
                <FileText className="w-4 h-4" />
                <span>Biriktirilgan fayl: <strong>{uploadedFileName}</strong></span>
              </div>
            )}
          </form>

          {/* Results list */}
          {searchResults.length === 0 ? (
            <div className={`p-8 rounded-3xl border text-center ${
              darkMode ? 'bg-slate-900 border-slate-800 text-slate-500' : 'bg-white border-slate-200 text-slate-400'
            }`}>
              <Bot className="w-10 h-10 mx-auto text-blue-500/50 mb-3" />
              <p className="text-xs font-medium">Hozircha qidiruv o'tkazilmadi. Savol berib Python backend orqali jonli natijalarni ko'ring.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {searchResults.map((item) => (
                <div 
                  key={item.id}
                  className={`p-6 rounded-3xl border ${
                    darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
                  } shadow-sm space-y-3`}
                >
                  <div className="flex items-center justify-between border-b pb-3 border-slate-100 dark:border-slate-800">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-blue-500" />
                      <span className="text-xs font-bold text-blue-500 uppercase">{item.engine} Search Engine</span>
                    </div>
                    <span className="text-[10px] text-slate-400">{item.timestamp}</span>
                  </div>

                  <h3 className="text-sm font-bold text-indigo-400">"{item.query}"</h3>
                  
                  <div className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap bg-slate-800/40 p-4 rounded-2xl border border-slate-800 font-sans">
                    {item.response}
                  </div>

                  {item.fileName && (
                    <div className="text-[11px] text-slate-400 flex items-center space-x-1">
                      <FileText className="w-3.5 h-3.5" />
                      <span>Tahlil qilingan fayl: {item.fileName}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

        </div>

        {/* API Engine Info Panel */}
        <div className={`p-6 rounded-3xl border ${
          darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-200 text-slate-800'
        } shadow-sm space-y-4 h-fit`}>
          <h2 className="text-xs font-bold uppercase tracking-wider text-slate-400">Faol API Servislar</h2>
          
          <div className="space-y-2.5 text-xs">
            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="font-bold text-blue-400 block">🌐 Tavily (tavily.com)</span>
              <p className="text-[11px] text-slate-400">TAVILY_API_KEY bilan chuqur veb qidiruv.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="font-bold text-amber-400 block">🔍 SerpAPI (serpapi.com)</span>
              <p className="text-[11px] text-slate-400">SERPAPI_API_KEY orqali Google natijalari.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="font-bold text-indigo-400 block">✨ Gemini (ai.google.dev)</span>
              <p className="text-[11px] text-slate-400">GEMINI_API_KEY orqali mantiqiy AI xulosa.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="font-bold text-purple-400 block">⚡ Exa (exa.ai)</span>
              <p className="text-[11px] text-slate-400">EXA_API_KEY orqali neyron veb qidiruvi.</p>
            </div>

            <div className="p-3 rounded-2xl bg-slate-800/50 border border-slate-700/60 space-y-1">
              <span className="font-bold text-red-400 block">🔥 Firecrawl (firecrawl.dev)</span>
              <p className="text-[11px] text-slate-400">FIRECRAWL_API_KEY bilan veb skreyping.</p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
