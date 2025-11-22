
import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Sparkles, Download, Image as ImageIcon, Maximize2, X, ZoomIn, Code, BrainCircuit, Globe, Zap, AlertTriangle, RotateCcw } from 'lucide-react';
import { ChatMessage, AnalysisResult, GitHubRepo } from '../types';
import { chatWithRepo } from '../services/geminiService';
import { GenerateContentResponse } from '@google/genai';
import mermaid from 'mermaid';
import { marked } from 'marked';
import katex from 'katex';
import { select, zoom, zoomIdentity } from 'd3';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark', 
  securityLevel: 'loose',
  fontFamily: 'Inter, sans-serif',
  logLevel: 5 // Suppress logs
});

interface ChatInterfaceProps {
  repo: GitHubRepo;
  analysis: AnalysisResult;
  readme: string;
  fileTree: any[];
  messages: ChatMessage[];
  onMessagesChange: (messages: ChatMessage[]) => void;
}

// Custom hook to handle D3 Zoom logic with Auto-Centering
const useD3Zoom = (containerRef: React.RefObject<HTMLDivElement>, svgContent: string) => {
    const zoomRef = useRef<any>(null);
    const selectionRef = useRef<any>(null);

    useEffect(() => {
        if (!containerRef.current || !svgContent) return;
        
        // 1. Select the SVG element
        const svgSelection = select(containerRef.current).select('svg');
        if (svgSelection.empty()) return;

        // 2. Configure SVG for responsiveness and zoom
        svgSelection
            .attr('width', '100%')
            .attr('height', '100%')
            .style('max-width', 'none')
            .style('display', 'block')
            .style('cursor', 'grab');
            
        // 3. Select the content group
        // Mermaid typically wraps content in a group. We transform this group.
        let g = svgSelection.select('g');
        
        // Fallback: If no group found (rare), select the first group or create one? 
        // Usually mermaid has a root 'g'.
        if (g.empty()) {
             g = svgSelection.select("g");
        }
        
        // If still empty, we can't zoom properly
        if (g.empty()) return;

        selectionRef.current = svgSelection;

        // 4. Define Zoom Behavior
        const zoomBehavior = zoom()
            .scaleExtent([0.1, 8]) // Min/Max zoom
            .on('zoom', (event) => {
                g.attr('transform', event.transform);
            });

        zoomRef.current = zoomBehavior;

        // 5. Apply Zoom Behavior to SVG
        svgSelection
             .call(zoomBehavior as any)
             .on("dblclick.zoom", null); // Disable double click zoom to avoid accidental zooms

        // 6. Calculate Initial Center & Scale
        try {
            const svgNode = svgSelection.node() as SVGElement;
            const gNode = g.node() as SVGGraphicsElement;
            
            if (svgNode && gNode) {
                const parentRect = svgNode.getBoundingClientRect();
                // We use getBBox for the content dimensions
                const graphBox = gNode.getBBox();
                
                // If the graph has 0 size (hidden/error), skip centering
                if (graphBox.width === 0 || graphBox.height === 0) return;

                const parentWidth = parentRect.width;
                const parentHeight = parentRect.height;

                // Add some padding
                const padding = 40;
                
                // Calculate scale to fit
                const scale = Math.min(
                    (parentWidth - padding) / graphBox.width,
                    (parentHeight - padding) / graphBox.height
                );

                // Don't zoom in crazy amounts for tiny diagrams, limit to 1
                const initialScale = Math.min(scale, 1);
                
                // Calculate centering translation
                const x = (parentWidth - graphBox.width * initialScale) / 2 - graphBox.x * initialScale;
                const y = (parentHeight - graphBox.height * initialScale) / 2 - graphBox.y * initialScale;
                
                const initialTransform = zoomIdentity
                    .translate(x, y)
                    .scale(initialScale);
                    
                // Apply the transform immediately
                svgSelection.call(zoomBehavior.transform as any, initialTransform);
            }
        } catch (e) {
            console.warn("Auto-centering failed", e);
            // Fallback to identity
            svgSelection.call(zoomBehavior.transform as any, zoomIdentity);
        }

    }, [svgContent, containerRef]);

    const resetZoom = () => {
        if (!selectionRef.current || !zoomRef.current) return;
        
        // Re-run the centering logic or just reset to identity? 
        // Identity puts it at 0,0 which might cut off top/left. 
        // Let's try to re-center (simplified version of the effect logic)
        try {
            const svgSelection = selectionRef.current;
            const g = svgSelection.select('g');
            const svgNode = svgSelection.node();
            const gNode = g.node();
            
            if (svgNode && gNode) {
                const parentRect = svgNode.getBoundingClientRect();
                const graphBox = gNode.getBBox();
                const scale = Math.min(
                    (parentRect.width - 40) / graphBox.width,
                    (parentRect.height - 40) / graphBox.height
                );
                const initialScale = Math.min(scale, 1);
                const x = (parentRect.width - graphBox.width * initialScale) / 2 - graphBox.x * initialScale;
                const y = (parentRect.height - graphBox.height * initialScale) / 2 - graphBox.y * initialScale;

                svgSelection.transition().duration(750).call(
                    zoomRef.current.transform, 
                    zoomIdentity.translate(x, y).scale(initialScale)
                );
                return;
            }
        } catch (e) {}

        // Fallback
        selectionRef.current.transition().duration(750).call(zoomRef.current.transform, zoomIdentity);
    };

    return { resetZoom };
};

const MermaidDiagram: React.FC<{ code: string; isDark?: boolean }> = ({ code, isDark = true }) => {
  const [svg, setSvg] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewContainerRef = useRef<HTMLDivElement>(null);

  // Zoom hooks
  const { resetZoom: resetInlineZoom } = useD3Zoom(containerRef, svg);
  const { resetZoom: resetPreviewZoom } = useD3Zoom(previewContainerRef, svg);

  useEffect(() => {
    const renderChart = async () => {
      try {
        setError('');
        const cleanCode = code.trim();
        const uniqueId = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg } = await mermaid.render(uniqueId, cleanCode);
        setSvg(svg);
      } catch (err) {
        console.error('Mermaid render failed:', err);
        setError('Syntax Error');
      }
    };
    
    if (code) {
      renderChart();
    }
  }, [code]);

  const downloadSVG = () => {
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `diagram-${Date.now()}.svg`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const downloadPNG = (scale = 3) => {
    if (!containerRef.current) return;
    
    const svgElement = containerRef.current.querySelector('svg');
    if (!svgElement) return;

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgData = new XMLSerializer().serializeToString(svgElement);
    const viewBox = svgElement.getAttribute('viewBox')?.split(' ').map(Number);
    
    // Fallback if viewBox is missing, use client rect
    const rect = svgElement.getBoundingClientRect();
    let width = viewBox && viewBox[2] ? viewBox[2] : rect.width;
    let height = viewBox && viewBox[3] ? viewBox[3] : rect.height;

    // Ensure valid dimensions
    width = width || 800;
    height = height || 600;

    canvas.width = width * scale; 
    canvas.height = height * scale;

    // Use Base64 Data URI instead of Blob URL to minimize 'tainted canvas' issues with foreignObject
    const encodedSvg = btoa(unescape(encodeURIComponent(svgData)));
    const url = `data:image/svg+xml;base64,${encodedSvg}`;

    img.crossOrigin = "anonymous";

    img.onload = () => {
        if (ctx) {
            ctx.scale(scale, scale);
            const isDarkMode = document.documentElement.classList.contains('dark');
            ctx.fillStyle = isDarkMode ? '#0f172a' : '#ffffff'; 
            ctx.fillRect(0, 0, width, height);
            ctx.drawImage(img, 0, 0, width, height);
            
            try {
                canvas.toBlob(blob => {
                    if (blob) {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = `diagram-${Date.now()}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(a.href);
                    } else {
                         throw new Error("Canvas toBlob failed");
                    }
                });
            } catch (e) {
                console.error("Canvas Export Error:", e);
                alert("Browser security prevented the PNG export (Tainted Canvas). Please download the SVG version instead.");
            }
        }
    };
    
    img.onerror = (e) => {
        console.error("Image Load Error:", e);
        alert("Failed to process diagram for download.");
    };

    img.src = url;
  };

  if (error) {
      return (
        <div className="my-4 p-4 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2 text-red-600 dark:text-red-400 text-xs font-semibold mb-2">
                <AlertTriangle className="w-4 h-4" />
                <span>Diagram Render Failed</span>
            </div>
            <pre className="text-[10px] font-mono overflow-x-auto text-slate-600 dark:text-slate-400 p-2 bg-white dark:bg-black/20 rounded">
                {code}
            </pre>
        </div>
      );
  }
  
  return (
    <>
        <div className="my-4 relative group">
            <div 
                ref={containerRef}
                className="h-[300px] w-full bg-white dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-700 overflow-hidden cursor-grab active:cursor-grabbing"
                dangerouslySetInnerHTML={{ __html: svg }} 
            />
            
            {svg && (
                <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-100 dark:bg-slate-800 p-1 rounded-md border border-slate-200 dark:border-slate-700 shadow-sm z-10">
                    <button 
                        onClick={resetInlineZoom} 
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Reset Zoom"
                    >
                        <RotateCcw className="w-4 h-4" />
                    </button>
                    <div className="w-px h-4 bg-slate-300 dark:bg-slate-600 mx-1 self-center" />
                    <button 
                        onClick={() => setIsPreviewOpen(true)} 
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Preview Fullscreen"
                    >
                        <Maximize2 className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={downloadSVG} 
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Download SVG"
                    >
                        <Code className="w-4 h-4" />
                    </button>
                    <button 
                        onClick={() => downloadPNG(3)} 
                        className="p-1.5 text-slate-500 hover:text-primary hover:bg-slate-200 dark:hover:bg-slate-700 rounded transition-colors"
                        title="Download High-Res PNG"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </button>
                </div>
            )}
            <div className="absolute bottom-2 right-2 pointer-events-none opacity-0 group-hover:opacity-50 transition-opacity">
                 <span className="text-[10px] text-slate-400 bg-white/50 dark:bg-black/50 px-2 py-1 rounded backdrop-blur-sm">
                    Scroll to zoom • Drag to pan
                 </span>
            </div>
        </div>

        {isPreviewOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-8" onClick={() => setIsPreviewOpen(false)}>
                <div 
                    className="relative bg-white dark:bg-slate-900 rounded-xl w-full h-full max-w-6xl max-h-[90vh] shadow-2xl border border-slate-700 flex flex-col overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                     {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 shrink-0 z-20">
                         <h3 className="text-lg font-semibold text-slate-800 dark:text-slate-200">Diagram Preview</h3>
                         <div className="flex items-center gap-2">
                            <button 
                                onClick={resetPreviewZoom}
                                className="flex items-center gap-1 px-3 py-1.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 rounded-lg text-xs font-medium transition-colors"
                            >
                                <RotateCcw className="w-3 h-3" /> Reset
                            </button>
                            <button 
                                onClick={() => downloadPNG(4)}
                                className="flex items-center gap-1 px-3 py-1.5 bg-primary hover:bg-blue-600 text-white rounded-lg text-xs font-medium transition-colors shadow-sm"
                            >
                                <ImageIcon className="w-3 h-3" /> PNG
                            </button>
                            <button 
                                onClick={() => setIsPreviewOpen(false)}
                                className="p-2 hover:bg-red-100 dark:hover:bg-red-900/50 text-slate-500 hover:text-red-500 rounded-full transition-colors"
                            >
                                <X className="w-5 h-5" />
                            </button>
                         </div>
                    </div>

                    {/* Zoomable Content */}
                    <div className="flex-1 relative overflow-hidden bg-slate-50 dark:bg-[#0d1117] cursor-grab active:cursor-grabbing">
                        <div 
                            ref={previewContainerRef}
                            className="w-full h-full"
                            dangerouslySetInnerHTML={{ __html: svg }} 
                        />
                    </div>
                </div>
            </div>
        )}
    </>
  );
};

const MarkdownRenderer: React.FC<{ content: string }> = ({ content }) => {
    const [html, setHtml] = useState('');

    useEffect(() => {
        const mathSegments: string[] = [];
        const protectedText = content.replace(/(\$\$[\s\S]*?\$\$)|(\$[^$\n]+\$)|(\\\[[\s\S]*?\\\])|(\\\([^\\\n]+\\\))/g, (match) => {
            mathSegments.push(match);
            return `%%%MATH${mathSegments.length - 1}%%%`;
        });

        let parsedHtml = marked.parse(protectedText) as string;

        parsedHtml = parsedHtml.replace(/%%%MATH(\d+)%%%/g, (_, index) => {
            const match = mathSegments[parseInt(index)];
            let tex = match;
            let displayMode = false;

            if (tex.startsWith('$$')) { tex = tex.slice(2, -2); displayMode = true; }
            else if (tex.startsWith('\\[')) { tex = tex.slice(2, -2); displayMode = true; }
            else if (tex.startsWith('$')) { tex = tex.slice(1, -1); displayMode = false; }
            else if (tex.startsWith('\\(')) { tex = tex.slice(2, -2); displayMode = false; }

            try {
                return katex.renderToString(tex, { 
                    displayMode,
                    throwOnError: false,
                    output: 'html'
                });
            } catch (e) {
                return match;
            }
        });

        setHtml(parsedHtml);
    }, [content]);

    return (
        <div 
            className="markdown-body" 
            dangerouslySetInnerHTML={{ __html: html }} 
        />
    );
};

const MessageContent: React.FC<{ content: string }> = ({ content }) => {
  // More robust regex to catch mermaid blocks even with messy spacing
  const parts = content.split(/(```(?:mer)?maid[\s\S]*?```)/gi);

  return (
    <>
      {parts.map((part, idx) => {
        const match = part.match(/^```(?:mer)?maid([\s\S]*?)```$/i);
        if (match) {
          const code = match[1].trim();
          if (!code) return null;
          return <MermaidDiagram key={idx} code={code} />;
        }
        if (part.trim().length === 0) return null;
        return <MarkdownRenderer key={idx} content={part} />;
      })}
    </>
  );
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({ repo, analysis, readme, fileTree, messages, onMessagesChange }) => {
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [chatMode, setChatMode] = useState<'standard' | 'thinking' | 'search'>('standard');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: Date.now(),
      mode: chatMode
    };

    const newMessages = [...messages, userMsg];
    onMessagesChange(newMessages);
    setInput('');
    setIsTyping(true);

    try {
      const history = newMessages
        .filter(m => m.id !== 'init')
        .map(m => ({
            role: m.role,
            parts: [{ text: m.content }]
        }));

      const streamResult = await chatWithRepo(
        history, 
        userMsg.content, 
        { repo, analysis, readme, fileTree },
        chatMode
      );
      
      const botMsgId = (Date.now() + 1).toString();
      const botMsg: ChatMessage = {
          id: botMsgId,
          role: 'model',
          content: '',
          timestamp: Date.now(),
          mode: chatMode,
          sources: []
      };
      
      // Update with empty bot message first
      onMessagesChange([...newMessages, botMsg]);

      let fullText = '';
      const allSources: { title?: string; uri: string }[] = [];

      for await (const chunk of streamResult) {
          const c = chunk as GenerateContentResponse;
          const text = c.text || '';
          fullText += text;
          
          if (c.candidates?.[0]?.groundingMetadata?.groundingChunks) {
              c.candidates[0].groundingMetadata.groundingChunks.forEach(chunk => {
                  if (chunk.web?.uri) {
                      if (!allSources.some(s => s.uri === chunk.web?.uri)) {
                          allSources.push({
                              title: chunk.web.title,
                              uri: chunk.web.uri
                          });
                      }
                  }
              });
          }

          // Update the specific bot message in the array
          onMessagesChange([...newMessages, { ...botMsg, content: fullText, sources: allSources }]);
      }
    } catch (error) {
      console.error(error);
      onMessagesChange([...newMessages, {
        id: Date.now().toString(),
        role: 'model',
        content: "**Error**: Sorry, I encountered an issue connecting to the AI service.",
        timestamp: Date.now()
      }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-surface border border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden shadow-sm">
      {/* Header with Mode Toggle */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-purple-500 dark:text-purple-400" />
            <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">Repo Chat Assistant</span>
        </div>
        
        {/* Mode Selector */}
        <div className="flex p-1 bg-slate-200 dark:bg-slate-900 rounded-lg overflow-x-auto no-scrollbar">
            <button
                type="button"
                onClick={() => setChatMode('standard')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${chatMode === 'standard' ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Zap className="w-3 h-3" /> <span className="hidden sm:inline">Standard</span>
            </button>
            <button
                type="button"
                onClick={() => setChatMode('thinking')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${chatMode === 'thinking' ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm ring-1 ring-indigo-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <BrainCircuit className="w-3 h-3" /> <span className="hidden sm:inline">Deep Think</span>
            </button>
            <button
                type="button"
                onClick={() => setChatMode('search')}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all whitespace-nowrap ${chatMode === 'search' ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-300 shadow-sm ring-1 ring-emerald-500/20' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:hover:text-slate-300'}`}
            >
                <Globe className="w-3 h-3" /> <span className="hidden sm:inline">Search Web</span>
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 bg-white dark:bg-surface transition-colors">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2 sm:gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}
          >
            <div className={`
              w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center shrink-0 mt-1
              ${msg.role === 'user' ? 'bg-primary' : 'bg-slate-200 dark:bg-slate-700'}
            `}>
              {msg.role === 'user' ? (
                  <User className="w-3 h-3 sm:w-4 sm:h-4 text-white" />
              ) : msg.mode === 'thinking' ? (
                  <BrainCircuit className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500" />
              ) : msg.mode === 'search' ? (
                  <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500" />
              ) : (
                  <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 dark:text-purple-400" />
              )}
            </div>
            
            <div className={`flex flex-col max-w-[90%]`}>
                {msg.role === 'model' && msg.mode && msg.mode !== 'standard' && (
                    <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 ml-1 flex items-center gap-1">
                        {msg.mode === 'thinking' ? 'Thinking Process Active' : 'Web Search Enabled'}
                    </span>
                )}
                <div className={`
                  rounded-2xl px-4 py-3 sm:px-5 sm:py-3 text-sm leading-relaxed shadow-sm overflow-x-hidden
                  ${msg.role === 'user' 
                    ? 'bg-primary text-white rounded-tr-sm' 
                    : 'bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 rounded-tl-sm'}
                `}>
                  <MessageContent content={msg.content} />
                  
                  {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-slate-200 dark:border-slate-700">
                          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1">
                              <Globe className="w-3 h-3" /> Sources
                          </p>
                          <div className="flex flex-wrap gap-2">
                              {msg.sources.map((source, idx) => (
                                  <a 
                                      key={idx}
                                      href={source.uri}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-xs bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 px-2 py-1 rounded-md text-blue-600 dark:text-blue-400 hover:underline truncate max-w-[200px]"
                                  >
                                      {source.title || new URL(source.uri).hostname}
                                  </a>
                              ))}
                          </div>
                      </div>
                  )}
                </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex gap-3">
             <div className="w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center shrink-0">
                {chatMode === 'thinking' ? (
                    <BrainCircuit className="w-3 h-3 sm:w-4 sm:h-4 text-indigo-500 animate-pulse" />
                ) : chatMode === 'search' ? (
                    <Globe className="w-3 h-3 sm:w-4 sm:h-4 text-emerald-500 animate-pulse" />
                ) : (
                    <Bot className="w-3 h-3 sm:w-4 sm:h-4 text-purple-500 dark:text-purple-400" />
                )}
            </div>
            <div className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1">
                <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 dark:bg-slate-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSend} className="p-3 sm:p-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 shrink-0">
        <div className="relative">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
                chatMode === 'thinking' ? "Ask a complex architectural question..." :
                chatMode === 'search' ? "Search for docs or latest library versions..." :
                "Ask about specific functions, logic, or diagrams..."
            }
            className="w-full pl-4 pr-12 py-3 bg-white dark:bg-background border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-slate-200 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all shadow-sm text-sm sm:text-base"
            disabled={isTyping}
          />
          <button
            type="submit"
            disabled={!input.trim() || isTyping}
            className={`absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed
                ${chatMode === 'thinking' ? 'bg-indigo-500/10 text-indigo-600 hover:bg-indigo-500 hover:text-white' : 
                  chatMode === 'search' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500 hover:text-white' :
                  'bg-primary/10 text-primary hover:bg-primary hover:text-white'}
            `}
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatInterface;
