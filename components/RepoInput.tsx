
import React, { useState } from 'react';
import { Github, Search, Key, AlertCircle, Sun, Moon, Bookmark, Trash2, ArrowRight } from 'lucide-react';
import { SavedSession } from '../types';

interface RepoInputProps {
  onAnalyze: (url: string, token: string) => void;
  isLoading: boolean;
  error?: string;
  isDark: boolean;
  onToggleTheme: () => void;
  savedSessions: SavedSession[];
  onLoadSession: (session: SavedSession) => void;
  onDeleteSession: (id: string) => void;
}

const RepoInput: React.FC<RepoInputProps> = ({ 
    onAnalyze, 
    isLoading, 
    error, 
    isDark, 
    onToggleTheme,
    savedSessions,
    onLoadSession,
    onDeleteSession
}) => {
  const [url, setUrl] = useState('');
  const [token, setToken] = useState('');
  const [showTokenInput, setShowTokenInput] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) {
      onAnalyze(url, token);
    }
  };

  return (
    <div className="relative w-full h-screen overflow-y-auto overflow-x-hidden custom-scrollbar">
      
      <button 
        onClick={onToggleTheme}
        className="fixed top-4 right-4 md:top-6 md:right-6 p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 hover:bg-white dark:hover:bg-slate-800 transition-all shadow-sm text-slate-600 dark:text-slate-300 z-50"
      >
        {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <div className="flex flex-col items-center justify-center min-h-full w-full py-12 px-4">
        <div className="relative z-10 w-full max-w-4xl flex flex-col items-center">
          
          {/* Header Section */}
          <div className="text-center mb-8 md:mb-10 space-y-4 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <div className="bg-gradient-to-br from-primary to-secondary w-16 h-16 md:w-20 md:h-20 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-primary/20 mb-6 animate-pulse-slow">
                <Github className="text-white w-8 h-8 md:w-10 md:h-10" />
            </div>
            <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-slate-900 via-primary to-slate-900 dark:from-white dark:via-blue-400 dark:to-white drop-shadow-sm">
              RepoMind
            </h1>
            <p className="text-slate-600 dark:text-slate-400 text-base md:text-xl max-w-lg mx-auto leading-relaxed font-medium bg-white/30 dark:bg-black/20 p-2 rounded-xl backdrop-blur-sm">
              Deep architectural analysis for GitHub repositories powered by Gemini 2.5 AI.
            </p>
          </div>

          {/* Form Section */}
          <div className="w-full max-w-xl md:max-w-2xl animate-fade-in-up" style={{ animationDelay: '150ms' }}>
            <div className="bg-white/80 dark:bg-slate-900/60 backdrop-blur-xl border border-white/20 dark:border-white/10 rounded-2xl p-6 md:p-8 shadow-2xl dark:shadow-none ring-1 ring-black/5">
              <form onSubmit={handleSubmit} className="space-y-5 md:space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">Repository URL</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-primary transition-colors" />
                    </div>
                    <input
                      type="text"
                      value={url}
                      onChange={(e) => setUrl(e.target.value)}
                      placeholder="https://github.com/facebook/react"
                      className="block w-full pl-11 pr-4 py-3.5 md:py-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all shadow-inner text-sm md:text-base"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {showTokenInput && (
                   <div className="space-y-2 animate-fade-in-up">
                   <label className="text-sm font-semibold text-slate-700 dark:text-slate-300 ml-1">GitHub Personal Access Token (Optional)</label>
                   <div className="relative group">
                     <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                       <Key className="h-5 w-5 text-slate-400 dark:text-slate-500 group-focus-within:text-yellow-500 dark:group-focus-within:text-yellow-400 transition-colors" />
                     </div>
                     <input
                       type="password"
                       value={token}
                       onChange={(e) => setToken(e.target.value)}
                       placeholder="ghp_xxxxxxxxxxxx"
                       className="block w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-yellow-400/50 focus:border-yellow-400 transition-all shadow-inner text-sm md:text-base"
                       disabled={isLoading}
                     />
                   </div>
                   <p className="text-xs text-slate-500 dark:text-slate-500 ml-1">Required for private repos or to avoid rate limits.</p>
                 </div>
                )}

                <div className="flex flex-col sm:flex-row items-center justify-between pt-2 gap-4 sm:gap-0">
                  <button
                    type="button"
                    onClick={() => setShowTokenInput(!showTokenInput)}
                    className="text-sm text-slate-500 dark:text-slate-400 hover:text-primary transition-colors underline decoration-dotted underline-offset-4"
                  >
                    {showTokenInput ? 'Hide Token' : 'Add Access Token'}
                  </button>
                  
                  <button
                    type="submit"
                    disabled={isLoading || !url}
                    className={`
                      w-full sm:w-auto px-8 py-3.5 rounded-xl font-bold text-white shadow-lg shadow-primary/25 transition-all duration-300
                      ${isLoading || !url 
                        ? 'bg-slate-400 dark:bg-slate-700 cursor-not-allowed opacity-50 transform-none' 
                        : 'bg-gradient-to-r from-primary to-blue-600 hover:to-blue-500 hover:scale-[1.02] active:scale-[0.98]'}
                    `}
                  >
                    {isLoading ? (
                      <span className="flex items-center justify-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Scanning...
                      </span>
                    ) : (
                      'Analyze Repository'
                    )}
                  </button>
                </div>
              </form>

              {error && (
                <div className="mt-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/50 rounded-xl flex items-start gap-3 text-red-600 dark:text-red-400 animate-fade-in-up">
                  <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                  <p className="text-sm font-medium">{error}</p>
                </div>
              )}
            </div>
          </div>

          {savedSessions.length > 0 && (
              <div className="w-full max-w-2xl mt-12 animate-fade-in-up" style={{ animationDelay: '300ms' }}>
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 uppercase tracking-wider flex items-center gap-2 px-2 bg-white/50 dark:bg-black/20 inline-block p-1 rounded backdrop-blur-sm">
                      <Bookmark className="w-4 h-4" /> Saved Analyses
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                      {savedSessions.map((session, idx) => (
                          <div 
                            key={session.id} 
                            className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm border border-slate-200 dark:border-slate-700 p-4 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between group hover:border-primary/50 hover:shadow-lg dark:hover:shadow-primary/5 transition-all duration-300 transform hover:-translate-y-0.5 gap-3 sm:gap-0"
                            style={{ animationDelay: `${idx * 100}ms` }}
                          >
                              <div className="flex items-center gap-4 overflow-hidden">
                                    <img src={session.repo.owner.avatar_url} alt={session.repo.owner.login} className="w-10 h-10 rounded-full border border-slate-200 dark:border-slate-600" />
                                    <div className="min-w-0">
                                        <h4 className="font-semibold text-slate-900 dark:text-slate-100 truncate group-hover:text-primary transition-colors">{session.repo.full_name}</h4>
                                        <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                                            <span>{new Date(session.timestamp).toLocaleDateString()}</span>
                                            <span className="w-1 h-1 bg-slate-300 rounded-full" />
                                            <span className="truncate">{session.analysis.archetype.title}</span>
                                        </div>
                                    </div>
                              </div>
                              
                              <div className="flex items-center gap-2 justify-end">
                                  <button 
                                    onClick={() => onLoadSession(session)}
                                    className="px-3 py-1.5 bg-slate-100 dark:bg-slate-900 hover:bg-primary hover:text-white text-slate-600 dark:text-slate-300 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
                                  >
                                      Load <ArrowRight className="w-4 h-4" />
                                  </button>
                                  <button 
                                    onClick={() => onDeleteSession(session.id)}
                                    className="p-2 hover:bg-red-100 dark:hover:bg-red-900/30 text-slate-400 hover:text-red-500 rounded-lg transition-colors opacity-100 sm:opacity-0 sm:group-hover:opacity-100"
                                  >
                                      <Trash2 className="w-4 h-4" />
                                  </button>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          )}
          
          <div className="mt-16 flex flex-wrap justify-center gap-4 sm:gap-8 text-slate-400 dark:text-slate-500 text-sm font-medium animate-fade-in-up" style={{ animationDelay: '500ms' }}>
            <div className="flex items-center gap-2 bg-white/30 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]" />
                <span>Gemini 2.5 Powered</span>
            </div>
            <div className="flex items-center gap-2 bg-white/30 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]" />
                <span>Structural Analysis</span>
            </div>
            <div className="flex items-center gap-2 bg-white/30 dark:bg-black/20 px-3 py-1 rounded-full backdrop-blur-sm">
                <div className="w-2 h-2 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />
                <span>Contextual Chat</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RepoInput;
