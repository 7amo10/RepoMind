
import React, { useState, useEffect, useRef } from 'react';
import { GitHubRepo, GitHubTreeResponse, AnalysisResult, ChatMessage } from '../types';
import { Folder, FileText, ChevronRight, ChevronDown, GitBranch, Star, Code as CodeIcon, ArrowLeft, Sun, Moon, X, Loader2, FileCode, Image as ImageIcon, Bookmark, BookmarkCheck, Menu } from 'lucide-react';
import AnalysisPanel from './AnalysisPanel';
import ChatInterface from './ChatInterface';
import { fetchFileContent } from '../services/githubService';
import { marked } from 'marked';
import hljs from 'highlight.js';

interface DashboardProps {
  repo: GitHubRepo;
  tree: GitHubTreeResponse;
  analysis: AnalysisResult;
  readme: string;
  onBack: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
  token: string;
  onSaveSession: (messages: ChatMessage[]) => void;
  initialMessages?: ChatMessage[];
}

// Helper to safely determine language for highlight.js
const getFileLanguage = (filename: string): string => {
  const lower = filename.toLowerCase();
  
  // Specific filenames
  const specialFiles: {[key: string]: string} = {
    'dockerfile': 'dockerfile',
    'makefile': 'makefile',
    'jenkinsfile': 'groovy',
    'gemfile': 'ruby',
    'cargo.toml': 'toml',
    'package.json': 'json',
    'license': 'plaintext',
    'copying': 'plaintext',
    'changelog': 'plaintext',
    'notice': 'plaintext',
    '.gitignore': 'ini',
    '.env': 'ini',
    '.dockerignore': 'ini',
    '.editorconfig': 'ini'
  };
  
  if (specialFiles[lower]) return specialFiles[lower];
  
  // Extension mapping
  const ext = lower.split('.').pop();
  
  if (!ext || ext === lower) return 'plaintext'; // No extension
  
  // Map common extensions to highlight.js standard names
  const extMap: {[key: string]: string} = {
    'js': 'javascript',
    'jsx': 'javascript',
    'ts': 'typescript',
    'tsx': 'typescript',
    'py': 'python',
    'rb': 'ruby',
    'rs': 'rust',
    'go': 'go',
    'java': 'java',
    'c': 'c',
    'cpp': 'cpp',
    'h': 'c',
    'hpp': 'cpp',
    'cs': 'csharp',
    'sh': 'bash',
    'bash': 'bash',
    'zsh': 'bash',
    'yml': 'yaml',
    'yaml': 'yaml',
    'json': 'json',
    'md': 'markdown',
    'html': 'xml',
    'xml': 'xml',
    'svg': 'xml',
    'css': 'css',
    'scss': 'scss',
    'less': 'less',
    'sql': 'sql',
    'php': 'php',
    'txt': 'plaintext',
    'lock': 'yaml', // yarn.lock often looks like yaml/properties
    'toml': 'toml'
  };
  
  return extMap[ext] || 'plaintext'; // Default to plaintext to avoid 'Could not find language' errors
};

const FileTreeNode = ({ node, depth = 0, onFileClick }: { node: any; depth?: number; onFileClick: (node: any) => void }) => {
  const [isOpen, setIsOpen] = useState(false);
  const isFolder = node.type === 'tree' || (node.children && node.children.length > 0);
  
  const handleClick = () => {
      if (isFolder) {
          setIsOpen(!isOpen);
      } else {
          onFileClick(node);
      }
  };

  return (
    <div className="select-none">
      <div 
        className={`
            flex items-center gap-2 py-2 px-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors
            ${depth === 0 ? 'text-slate-700 dark:text-slate-200' : 'text-slate-600 dark:text-slate-400'}
        `}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {isFolder ? (
           isOpen ? <ChevronDown className="w-4 h-4 text-slate-400 dark:text-slate-500" /> : <ChevronRight className="w-4 h-4 text-slate-400 dark:text-slate-500" />
        ) : <div className="w-4" />}
        
        {isFolder ? (
            <Folder className={`w-4 h-4 ${isOpen ? 'text-yellow-500 dark:text-yellow-400' : 'text-yellow-500/80 dark:text-yellow-400/80'}`} />
        ) : (
            <FileText className="w-4 h-4 text-blue-500/80 dark:text-blue-400/80" />
        )}
        
        <span className="text-sm truncate">{node.name}</span>
      </div>
      
      {isOpen && node.children && (
        <div>
          {node.children.map((child: any) => (
            <FileTreeNode key={child.path} node={child} depth={depth + 1} onFileClick={onFileClick} />
          ))}
        </div>
      )}
    </div>
  );
};

// Robust tree builder that handles sparse file lists and synthesizes directory structures
const buildTree = (files: any[]) => {
  const root: any = { name: 'root', path: '', children: [], type: 'tree' };
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;
    
    parts.forEach((part: string, index: number) => {
      const isLast = index === parts.length - 1;
      const path = parts.slice(0, index + 1).join('/');
      
      let node = current.children.find((c: any) => c.name === part);
      
      if (!node) {
        node = {
          name: part,
          path: path,
          type: isLast ? file.type : 'tree',
          children: [],
          ...(isLast ? file : {}) // Preserve file properties like url, size if it's a leaf
        };
        current.children.push(node);
      }
      current = node;
    });
  });

  // Recursive sort function: Folders first, then files, alphabetical within groups
  const sortNodes = (nodes: any[]) => {
    nodes.sort((a, b) => {
      if (a.type === b.type) return a.name.localeCompare(b.name);
      return a.type === 'tree' ? -1 : 1;
    });
    nodes.forEach(node => {
      if (node.children && node.children.length > 0) sortNodes(node.children);
    });
  };

  sortNodes(root.children);
  return root.children;
};

interface FilePreviewModalProps {
    file: any;
    content: string;
    isLoading: boolean;
    onClose: () => void;
}

const FilePreviewModal: React.FC<FilePreviewModalProps> = ({ file, content, isLoading, onClose }) => {
    const [renderedContent, setRenderedContent] = useState<string>('');
    const isMarkdown = file.name.toLowerCase().endsWith('.md');
    const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].some(ext => file.name.toLowerCase().endsWith(ext));
    
    const codeRef = useRef<HTMLElement>(null);
    const contentRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!content || isLoading) return;
        
        if (isMarkdown) {
            try {
                const rawHtml = marked.parse(content) as string;
                setRenderedContent(rawHtml);
            } catch (e) {
                setRenderedContent('<p>Error rendering markdown</p>');
            }
        }
    }, [content, isMarkdown, isLoading]);

    // Syntax Highlighting Effect for Code Files
    useEffect(() => {
        if (!isLoading && !isMarkdown && !isImage && codeRef.current && content) {
            try {
                // Determine safe language class
                const lang = getFileLanguage(file.name);
                codeRef.current.className = `language-${lang} !bg-transparent !p-0`;
                codeRef.current.removeAttribute('data-highlighted');
                hljs.highlightElement(codeRef.current);
            } catch (e) {
                console.warn('Highlighter error:', e);
            }
        }
    }, [content, isLoading, isMarkdown, isImage, file.name]);

    // Syntax Highlighting Effect for Markdown Code Blocks
    useEffect(() => {
        if (isMarkdown && renderedContent && contentRef.current) {
            try {
                contentRef.current.querySelectorAll('pre code').forEach((block) => {
                    hljs.highlightElement(block as HTMLElement);
                });
            } catch (e) {
                console.warn('Markdown highlighting error:', e);
            }
        }
    }, [renderedContent, isMarkdown]);

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 sm:p-8" onClick={onClose}>
            <div 
                className="bg-white dark:bg-slate-900 w-full max-w-5xl h-[80vh] mt-16 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-500/10 rounded-lg">
                            {isImage ? (
                                <ImageIcon className="w-5 h-5 text-blue-500" />
                            ) : (
                                <FileCode className="w-5 h-5 text-blue-500" />
                            )}
                        </div>
                        <div className="overflow-hidden">
                            <h3 className="font-semibold text-slate-900 dark:text-slate-100 truncate max-w-[200px] sm:max-w-md">{file.name}</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400 font-mono truncate max-w-[200px] sm:max-w-md">{file.path}</p>
                        </div>
                    </div>
                    <button 
                        onClick={onClose}
                        className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full text-slate-500 transition-colors"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-auto p-0 bg-[#282c34] relative">
                    {isLoading ? (
                        <div className="absolute inset-0 flex flex-col items-center justify-center text-slate-400 gap-3 bg-white dark:bg-slate-900">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                            <span className="text-sm">Fetching content...</span>
                        </div>
                    ) : (
                        <>
                            {isImage ? (
                                <div className="flex items-center justify-center min-h-full bg-white dark:bg-slate-900 p-8">
                                    <div className="text-center">
                                         <ImageIcon className="w-16 h-16 text-slate-300 mx-auto mb-4" />
                                         <p className="text-slate-500 mb-2">Image preview requires binary fetching.</p>
                                         <a href={`https://github.com/${file.path}`} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                                             Open on GitHub
                                         </a>
                                    </div>
                                </div>
                            ) : isMarkdown ? (
                                <div className="bg-white dark:bg-[#0d1117] min-h-full p-6 sm:p-10">
                                    <div 
                                        ref={contentRef}
                                        className="markdown-body"
                                        dangerouslySetInnerHTML={{ __html: renderedContent }}
                                    />
                                </div>
                            ) : (
                                <div className="min-h-full p-4">
                                    <pre className="bg-transparent font-mono text-sm leading-relaxed">
                                        <code 
                                            ref={codeRef} 
                                            className={`language-${getFileLanguage(file.name)} !bg-transparent !p-0`}
                                        >
                                            {content}
                                        </code>
                                    </pre>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}


const Dashboard: React.FC<DashboardProps> = ({ repo, tree, analysis, readme, onBack, isDark, onToggleTheme, token, onSaveSession, initialMessages }) => {
  const [activeTab, setActiveTab] = useState<'analysis' | 'chat'>('analysis');
  const [selectedFile, setSelectedFile] = useState<any | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isFileLoading, setIsFileLoading] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  // Lifted Chat State
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages || [
    {
        id: 'init',
        role: 'model',
        content: `Hi! I'm ready to discuss **${repo.full_name}**. \n\nI can help you with:\n- 🏗️ **Architecture**: Explaining the ${analysis.archetype.title} pattern.\n- 🔄 **Workflows**: detailing how data flows in "${analysis.keyWorkflows[0]?.title}".\n- 🎨 **Diagrams**: visualizing classes or sequences (just ask!).\n\nWhat would you like to know?`,
        timestamp: Date.now()
    }
  ]);

  useEffect(() => {
    // Reset saved state if repo changes (though repo shouldn't change without remount)
    setIsSaved(false);
  }, [repo.full_name]);

  const handleSave = () => {
    onSaveSession(messages);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // Prepare tree data with robust builder
  const treeData = React.useMemo(() => {
    const rawFiles = tree.tree
        .filter(f => !f.path.includes('.git/'))
        .slice(0, 1000); 
        
    return buildTree(rawFiles);
  }, [tree]);

  const handleFileClick = async (node: any) => {
      setSelectedFile(node);
      setIsFileLoading(true);
      setFileContent('');
      
      // Close sidebar on mobile when file is selected
      setIsSidebarOpen(false);

      try {
          const isImage = ['.png', '.jpg', '.jpeg', '.gif', '.svg', '.webp', '.ico'].some(ext => node.name.toLowerCase().endsWith(ext));
          
          if (isImage) {
              setFileContent(''); 
          } else {
              const content = await fetchFileContent(repo.owner.login, repo.name, node.path, token);
              setFileContent(content);
          }
      } catch (error) {
          console.error("Failed to fetch file", error);
          setFileContent("Error loading file content. It might be too large or binary.");
      } finally {
          setIsFileLoading(false);
      }
  };

  const closeFilePreview = () => {
      setSelectedFile(null);
      setFileContent('');
  };

  return (
    <div className="h-screen w-full flex flex-col overflow-hidden transition-colors duration-300 bg-transparent">
      {/* Top Bar */}
      <header className="h-auto min-h-[64px] border-b border-slate-200 dark:border-slate-800 bg-surface/60 backdrop-blur-md flex flex-col md:flex-row items-center justify-between px-4 py-2 md:py-0 gap-3 md:gap-0 shrink-0 z-10 relative">
        <div className="flex items-center w-full md:w-auto justify-between md:justify-start gap-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors" title="Back to home">
                    <ArrowLeft className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>
                
                {/* Mobile Hamburger */}
                <button 
                    onClick={() => setIsSidebarOpen(true)} 
                    className="md:hidden p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-full transition-colors"
                    title="Open File Explorer"
                >
                    <Menu className="w-5 h-5 text-slate-500 dark:text-slate-400" />
                </button>

                <div className="flex items-center gap-3">
                    <img src={repo.owner.avatar_url} alt={repo.owner.login} className="w-8 h-8 rounded-full border border-slate-300 dark:border-slate-600 hidden sm:block" />
                    <div className="min-w-0">
                        <h1 className="font-semibold text-slate-900 dark:text-slate-100 leading-tight truncate max-w-[180px] sm:max-w-xs text-sm sm:text-base">{repo.full_name}</h1>
                        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400">
                            <span className="flex items-center gap-1"><Star className="w-3 h-3" /> {repo.stargazers_count}</span>
                            <span className="flex items-center gap-1"><GitBranch className="w-3 h-3" /> {repo.default_branch}</span>
                            <span className="flex items-center gap-1"><CodeIcon className="w-3 h-3" /> {repo.language}</span>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Theme Toggle Mobile (Absolute right) */}
            <button 
                onClick={onToggleTheme}
                className="md:hidden p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        </div>
        
        <div className="flex items-center gap-2 w-full md:w-auto justify-between md:justify-end overflow-x-auto no-scrollbar pb-1 md:pb-0">
            <div className="flex bg-slate-200 dark:bg-slate-800/50 p-1 rounded-lg shrink-0">
                <button 
                    onClick={() => setActiveTab('analysis')}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'analysis' ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Deep Analysis
                </button>
                <button 
                    onClick={() => setActiveTab('chat')}
                    className={`px-3 sm:px-4 py-1.5 rounded-md text-xs sm:text-sm font-medium transition-all whitespace-nowrap ${activeTab === 'chat' ? 'bg-white dark:bg-primary text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'}`}
                >
                    Context Chat
                </button>
            </div>
            
            <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all shrink-0 ${isSaved ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200'}`}
                title="Save locally"
            >
                {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                <span className="hidden sm:inline">{isSaved ? 'Saved' : 'Bookmark'}</span>
            </button>

            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden md:block" />
            
            {/* Theme Toggle Desktop */}
            <button 
                onClick={onToggleTheme}
                className="hidden md:block p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
            >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 flex overflow-hidden relative z-0">
        
        {/* Mobile Sidebar Drawer Overlay */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm md:hidden"
                onClick={() => setIsSidebarOpen(false)}
            />
        )}

        {/* Left Sidebar: File Explorer (Desktop Static / Mobile Drawer) */}
        <aside className={`
            fixed md:static inset-y-0 left-0 z-50 w-80 transform transition-transform duration-300 ease-in-out
            ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
            border-r border-slate-200 dark:border-slate-800 bg-slate-50/95 dark:bg-slate-900/95 backdrop-blur-md md:bg-slate-50/90 md:dark:bg-slate-900/90 flex flex-col
            h-full shadow-2xl md:shadow-none
        `}>
            <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
                <h2 className="text-xs font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">Repository Structure</h2>
                <button 
                    onClick={() => setIsSidebarOpen(false)}
                    className="md:hidden p-1 hover:bg-slate-200 dark:hover:bg-slate-800 rounded text-slate-500"
                >
                    <X className="w-5 h-5" />
                </button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 custom-scrollbar">
                {treeData.map((node: any) => (
                    <FileTreeNode 
                        key={node.path} 
                        node={node} 
                        onFileClick={handleFileClick} 
                    />
                ))}
            </div>
        </aside>

        {/* Right Content */}
        <div className="flex-1 p-4 md:p-6 overflow-hidden bg-transparent transition-colors duration-300 w-full">
            {activeTab === 'analysis' ? (
                <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                     <AnalysisPanel analysis={analysis} />
                </div>
            ) : (
                <div className="h-full flex flex-col animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <ChatInterface 
                        repo={repo}
                        analysis={analysis}
                        readme={readme}
                        fileTree={tree.tree}
                        messages={messages}
                        onMessagesChange={setMessages}
                    />
                </div>
            )}
        </div>

        {/* File Preview Modal */}
        {selectedFile && (
            <FilePreviewModal 
                file={selectedFile} 
                content={fileContent} 
                isLoading={isFileLoading} 
                onClose={closeFilePreview} 
            />
        )}
      </main>
    </div>
  );
};

export default Dashboard;
