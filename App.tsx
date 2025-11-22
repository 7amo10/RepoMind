
import React, { useState, useEffect } from 'react';
import RepoInput from './components/RepoInput';
import Dashboard from './components/Dashboard';
import { parseRepoUrl, fetchRepoDetails, fetchRepoTree, fetchFileContent, fetchRepoCommits } from './services/githubService';
import { analyzeRepoStructure } from './services/geminiService';
import { AppState, GitHubRepo, GitHubTreeResponse, AnalysisResult, GitHubCommit, SavedSession, ChatMessage } from './types';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('IDLE');
  const [error, setError] = useState<string>('');
  const [isDark, setIsDark] = useState(true);
  const [token, setToken] = useState<string>(''); 
  
  // Data State
  const [repo, setRepo] = useState<GitHubRepo | null>(null);
  const [tree, setTree] = useState<GitHubTreeResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [readme, setReadme] = useState<string>('');
  const [initialMessages, setInitialMessages] = useState<ChatMessage[] | undefined>(undefined);

  // Saved Sessions State
  const [savedSessions, setSavedSessions] = useState<SavedSession[]>([]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
      // Load saved sessions from local storage
      const stored = localStorage.getItem('repomind_sessions');
      if (stored) {
          try {
              setSavedSessions(JSON.parse(stored));
          } catch (e) {
              console.error("Failed to parse saved sessions", e);
          }
      }
  }, []);

  const toggleTheme = () => setIsDark(!isDark);

  const handleAnalyze = async (url: string, inputToken: string) => {
    try {
      setToken(inputToken); // Store token
      setAppState('FETCHING_REPO');
      setError('');
      setInitialMessages(undefined); // Reset chat history for new scan

      // 1. Parse URL
      const repoInfo = parseRepoUrl(url);
      if (!repoInfo) {
        throw new Error('Invalid GitHub URL. Format: https://github.com/user/repo');
      }

      // 2. Fetch Core Data Parallelly
      const [repoData, commitsData] = await Promise.all([
        fetchRepoDetails(repoInfo.owner, repoInfo.repo, inputToken),
        fetchRepoCommits(repoInfo.owner, repoInfo.repo, inputToken)
      ]);
      
      setRepo(repoData);

      // 3. Fetch Tree (Needs branch from repoData)
      const treeData = await fetchRepoTree(repoInfo.owner, repoInfo.repo, repoData.default_branch, inputToken);
      setTree(treeData);

      // 4. Fetch README
      let readmeContent = '';
      const readmeFile = treeData.tree.find(f => /^readme\.md$/i.test(f.path));
      if (readmeFile) {
         try {
             readmeContent = await fetchFileContent(repoInfo.owner, repoInfo.repo, readmeFile.path, inputToken);
         } catch (e) {
             console.warn("Could not fetch README content", e);
         }
      }
      setReadme(readmeContent);

      // 5. Analyze with Gemini (Now with commits!)
      setAppState('ANALYZING');
      const analysisData = await analyzeRepoStructure(repoData, treeData.tree, readmeContent, commitsData);
      setAnalysis(analysisData);

      setAppState('READY');

    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
      setAppState('ERROR');
      setTimeout(() => setAppState('IDLE'), 4000);
    }
  };

  const handleBack = () => {
    setAppState('IDLE');
    setRepo(null);
    setTree(null);
    setAnalysis(null);
    setReadme('');
    setToken('');
    setInitialMessages(undefined);
  };

  const handleSaveSession = (messages: ChatMessage[]) => {
      if (!repo || !analysis || !tree) return;

      const newSession: SavedSession = {
          id: Date.now().toString(),
          timestamp: Date.now(),
          repo,
          analysis,
          tree, // Warning: Large trees might hit LS limits
          readme,
          chatHistory: messages
      };

      try {
          const updatedSessions = [newSession, ...savedSessions];
          localStorage.setItem('repomind_sessions', JSON.stringify(updatedSessions));
          setSavedSessions(updatedSessions);
      } catch (e) {
          alert("Failed to save bookmark locally. The repository data might be too large for browser storage.");
          console.error("Storage quota exceeded", e);
      }
  };

  const handleLoadSession = (session: SavedSession) => {
      setRepo(session.repo);
      setAnalysis(session.analysis);
      setTree(session.tree);
      setReadme(session.readme);
      setInitialMessages(session.chatHistory);
      setAppState('READY');
  };

  const handleDeleteSession = (id: string) => {
      const updated = savedSessions.filter(s => s.id !== id);
      setSavedSessions(updated);
      localStorage.setItem('repomind_sessions', JSON.stringify(updated));
  };

  // Determine background intensity based on state
  // READY state (dashboard) gets reduced opacity to not distract from content
  const blobOpacity = appState === 'READY' ? 'opacity-15 dark:opacity-10' : 'opacity-30 dark:opacity-20';

  return (
    <div className="relative min-h-screen bg-background text-slate-900 dark:text-slate-100 font-sans selection:bg-primary/30 transition-colors duration-300 overflow-hidden">
      
      {/* Global Animated Background */}
      <div className={`fixed inset-0 w-full h-full pointer-events-none z-0 overflow-hidden transition-opacity duration-1000 ${blobOpacity}`}>
          <div className="absolute top-0 -left-4 w-96 h-96 bg-purple-300 dark:bg-purple-900 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob"></div>
          <div className="absolute top-0 -right-4 w-96 h-96 bg-yellow-300 dark:bg-yellow-900 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute -bottom-8 left-20 w-96 h-96 bg-pink-300 dark:bg-pink-900 rounded-full mix-blend-multiply dark:mix-blend-normal filter blur-3xl animate-blob animation-delay-4000"></div>
      </div>

      {/* Content Container */}
      <div className="relative z-10 w-full h-full">
        {appState === 'IDLE' || appState === 'ERROR' ? (
          <RepoInput 
            onAnalyze={handleAnalyze} 
            isLoading={false}
            error={error}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            savedSessions={savedSessions}
            onLoadSession={handleLoadSession}
            onDeleteSession={handleDeleteSession}
          />
        ) : appState === 'READY' && repo && tree && analysis ? (
          <Dashboard 
            repo={repo}
            tree={tree}
            analysis={analysis}
            readme={readme}
            onBack={handleBack}
            isDark={isDark}
            onToggleTheme={toggleTheme}
            token={token}
            onSaveSession={handleSaveSession}
            initialMessages={initialMessages}
          />
        ) : (
          // Loading State
          <div className="h-screen w-full flex flex-col items-center justify-center space-y-8 backdrop-blur-sm">
             <div className="relative w-32 h-32">
                {/* Outer Ring */}
                <div className="absolute inset-0 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                <div className="absolute inset-0 border-4 border-t-primary border-r-secondary border-b-transparent border-l-transparent rounded-full animate-spin-slow"></div>
                
                {/* Inner Ring */}
                <div className="absolute inset-4 border-4 border-slate-200 dark:border-slate-800 rounded-full"></div>
                <div className="absolute inset-4 border-4 border-t-accent border-l-transparent border-b-transparent border-r-transparent rounded-full animate-spin reverse-spin"></div>

                {/* Center Icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                   <div className={`text-4xl transition-all duration-500 ${appState === 'FETCHING_REPO' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                      📡
                   </div>
                   <div className={`absolute text-4xl transition-all duration-500 ${appState === 'ANALYZING' ? 'opacity-100 scale-100' : 'opacity-0 scale-50'}`}>
                      🧠
                   </div>
                </div>
             </div>
             
             <div className="text-center space-y-3 max-w-md px-6">
               <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary via-purple-400 to-accent animate-pulse">
                  {appState === 'FETCHING_REPO' ? 'Ingesting Repository' : 'Neural Architecture Scan'}
               </h2>
               <div className="h-1.5 w-64 bg-slate-200 dark:bg-slate-800 rounded-full mx-auto overflow-hidden">
                  <div className={`h-full bg-primary transition-all duration-1000 ease-out ${appState === 'FETCHING_REPO' ? 'w-1/3' : 'w-full'}`}></div>
               </div>
               <p className="text-slate-600 dark:text-slate-400 font-mono text-sm bg-white/50 dark:bg-black/30 px-4 py-1 rounded-full backdrop-blur-md">
                  {appState === 'FETCHING_REPO' 
                      ? 'Downloading commit history & file trees...' 
                      : 'Identifying design patterns & key workflows...'}
               </p>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default App;
