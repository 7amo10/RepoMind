
import React, { useMemo } from 'react';
import { AnalysisResult } from '../types';
import { 
    Layers, Lightbulb, CheckCircle, Code, GitCommit, Zap, FileCode, Network, 
    Box, Building2, Wrench, Package, Globe, Smartphone, FlaskConical, Database, 
    Gamepad2, GraduationCap, Server, Terminal, Cpu, Layout, Shield,
    Cloud, Book, Bot, ShoppingCart, Film, Landmark, Users, Rocket, Command
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import DependencyGraph from './DependencyGraph';

interface AnalysisPanelProps {
  analysis: AnalysisResult;
}

const AnalysisPanel: React.FC<AnalysisPanelProps> = ({ analysis }) => {
  const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#10b981', '#f59e0b'];
  
  const chartData = useMemo(() => {
      return analysis.techStack.map((tech, index) => ({
        name: tech,
        value: 10 + (tech.length * 5) + (index * 2) 
      }));
  }, [analysis.techStack]);

  const dependencyData = useMemo(() => {
      return analysis.dependencyGraph || { nodes: [], edges: [] };
  }, [analysis.dependencyGraph]);

  const getArchetypeVisual = (title: string) => {
    const t = title.toLowerCase();

    // Infrastructure / Cloud / DevOps
    if (t.includes('cloud') || t.includes('infra') || t.includes('deploy') || t.includes('docker') || t.includes('kubernetes') || t.includes('aws')) 
        return { icon: Cloud, color: 'text-sky-500', bg: 'bg-sky-500/10', border: 'border-sky-500/20' };
    
    // Documentation / Knowledge
    if (t.includes('docs') || t.includes('wiki') || t.includes('guide') || t.includes('handbook') || t.includes('collection') || t.includes('list'))
        return { icon: Book, color: 'text-amber-600', bg: 'bg-amber-600/10', border: 'border-amber-600/20' };

    // AI / Bot / Automation
    if (t.includes('bot') || t.includes('automation') || t.includes('agent') || t.includes('scraper'))
        return { icon: Bot, color: 'text-rose-500', bg: 'bg-rose-500/10', border: 'border-rose-500/20' };

    // E-commerce / Market
    if (t.includes('shop') || t.includes('store') || t.includes('commerce') || t.includes('market') || t.includes('cart'))
        return { icon: ShoppingCart, color: 'text-teal-500', bg: 'bg-teal-500/10', border: 'border-teal-500/20' };

    // Finance / Crypto / Blockchain
    if (t.includes('finance') || t.includes('crypto') || t.includes('wallet') || t.includes('chain') || t.includes('bank') || t.includes('money'))
        return { icon: Landmark, color: 'text-yellow-600', bg: 'bg-yellow-600/10', border: 'border-yellow-600/20' };
    
    // Media / Video / Audio
    if (t.includes('video') || t.includes('audio') || t.includes('media') || t.includes('stream') || t.includes('music') || t.includes('player'))
        return { icon: Film, color: 'text-fuchsia-600', bg: 'bg-fuchsia-600/10', border: 'border-fuchsia-600/20' };

    // Social / Chat / Community
    if (t.includes('social') || t.includes('chat') || t.includes('community') || t.includes('forum') || t.includes('blog'))
        return { icon: Users, color: 'text-pink-600', bg: 'bg-pink-600/10', border: 'border-pink-600/20' };

    // Enterprise / Monolith
    if (t.includes('monolith') || t.includes('enterprise') || t.includes('legacy') || t.includes('crm') || t.includes('erp')) 
        return { icon: Building2, color: 'text-blue-600', bg: 'bg-blue-600/10', border: 'border-blue-600/20' };
    
    // Utility / Tools
    if (t.includes('micro') || t.includes('utility') || t.includes('tool') || t.includes('script') || t.includes('helper')) 
        return { icon: Wrench, color: 'text-slate-600', bg: 'bg-slate-600/10', border: 'border-slate-600/20' };
    
    // Library / Package
    if (t.includes('library') || t.includes('sdk') || t.includes('package') || t.includes('module') || t.includes('plugin')) 
        return { icon: Package, color: 'text-emerald-500', bg: 'bg-emerald-500/10', border: 'border-emerald-500/20' };
    
    // Web / SaaS
    if (t.includes('web') || t.includes('saas') || t.includes('platform') || t.includes('dashboard') || t.includes('portal')) 
        return { icon: Globe, color: 'text-indigo-500', bg: 'bg-indigo-500/10', border: 'border-indigo-500/20' };
    
    // Mobile
    if (t.includes('mobile') || t.includes('app') || t.includes('android') || t.includes('ios') || t.includes('native')) 
        return { icon: Smartphone, color: 'text-purple-500', bg: 'bg-purple-500/10', border: 'border-purple-500/20' };
    
    // Research / Prototype
    if (t.includes('experiment') || t.includes('research') || t.includes('prototype') || t.includes('demo') || t.includes('poc')) 
        return { icon: FlaskConical, color: 'text-pink-500', bg: 'bg-pink-500/10', border: 'border-pink-500/20' };
    
    // Data / ML
    if (t.includes('data') || t.includes('pipeline') || t.includes('analytics') || t.includes('ml') || t.includes('ai') || t.includes('model')) 
        return { icon: Database, color: 'text-cyan-500', bg: 'bg-cyan-500/10', border: 'border-cyan-500/20' };
    
    // Game
    if (t.includes('game') || t.includes('engine') || t.includes('graphics') || t.includes('render')) 
        return { icon: Gamepad2, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    
    // Education
    if (t.includes('learn') || t.includes('education') || t.includes('tutorial') || t.includes('starter') || t.includes('example')) 
        return { icon: GraduationCap, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
    
    // Backend / API
    if (t.includes('api') || t.includes('server') || t.includes('backend') || t.includes('service') || t.includes('proxy')) 
        return { icon: Server, color: 'text-violet-500', bg: 'bg-violet-500/10', border: 'border-violet-500/20' };
    
    // CLI
    if (t.includes('cli') || t.includes('terminal') || t.includes('command') || t.includes('shell')) 
        return { icon: Terminal, color: 'text-slate-700', bg: 'bg-slate-700/10', border: 'border-slate-700/20' };
    
    // System / OS
    if (t.includes('system') || t.includes('os') || t.includes('core') || t.includes('kernel') || t.includes('driver')) 
        return { icon: Cpu, color: 'text-orange-500', bg: 'bg-orange-500/10', border: 'border-orange-500/20' };
    
    // Security
    if (t.includes('security') || t.includes('auth') || t.includes('guard') || t.includes('privacy')) 
        return { icon: Shield, color: 'text-green-600', bg: 'bg-green-600/10', border: 'border-green-600/20' };
    
    // UI / Design
    if (t.includes('ui') || t.includes('component') || t.includes('design') || t.includes('frontend') || t.includes('css')) 
        return { icon: Layout, color: 'text-fuchsia-500', bg: 'bg-fuchsia-500/10', border: 'border-fuchsia-500/20' };
    
    // Startup / Launcher
    if (t.includes('start') || t.includes('launch') || t.includes('boilerplate'))
        return { icon: Rocket, color: 'text-orange-600', bg: 'bg-orange-600/10', border: 'border-orange-600/20' };

    // Default
    return { icon: Box, color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20' };
  };

  const visual = getArchetypeVisual(analysis.archetype.title);
  const ArchetypeIcon = visual.icon;

  return (
    <div className="h-full overflow-y-auto pr-1 md:pr-2 pb-20 md:pb-10 space-y-4 md:space-y-6 custom-scrollbar p-1">
      
      {/* Hero: Archetype & Complexity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        <div className="lg:col-span-2 bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 md:p-6 relative overflow-hidden group shadow-sm hover:shadow-md transition-all duration-300 animate-fade-in-up" style={{ animationDelay: '0ms' }}>
            <div className={`absolute top-0 right-0 w-64 h-64 ${visual.bg} rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-30 group-hover:opacity-60 transition-all duration-1000`}></div>
            
            <div className="relative z-10 flex flex-col sm:flex-row gap-4 md:gap-6 items-start sm:items-center h-full">
                <div className={`p-4 md:p-5 rounded-2xl ${visual.bg} border ${visual.border} shrink-0 shadow-sm transition-transform duration-500 group-hover:scale-110 group-hover:rotate-3`}>
                     <ArchetypeIcon className={`w-8 h-8 md:w-10 md:h-10 ${visual.color}`} />
                </div>

                <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-2 md:mb-3">
                        <span className="px-2 md:px-3 py-0.5 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-500 dark:text-slate-400 text-[10px] font-bold uppercase tracking-wider border border-slate-200 dark:border-slate-600">
                            Project Archetype
                        </span>
                        <div className="flex flex-wrap gap-2">
                            {analysis.archetype.tags.map(tag => (
                                <span key={tag} className="px-2 py-0.5 rounded-full bg-white/50 dark:bg-white/5 text-slate-600 dark:text-slate-400 text-[10px] border border-slate-200 dark:border-slate-600/50">
                                    {tag}
                                </span>
                            ))}
                        </div>
                    </div>
                    <h2 className="text-xl sm:text-2xl md:text-3xl font-bold text-slate-900 dark:text-white mb-2 leading-tight tracking-tight">{analysis.archetype.title}</h2>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed text-xs sm:text-sm md:text-base">
                        {analysis.archetype.description}
                    </p>
                </div>
            </div>
        </div>

        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-2xl p-4 md:p-6 flex flex-col items-center justify-center relative shadow-sm hover:shadow-md transition-all duration-300 min-h-[200px] md:min-h-[220px] animate-fade-in-up" style={{ animationDelay: '100ms' }}>
             <h3 className="text-sm font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-4">Complexity Score</h3>
             
             <div className="relative w-28 h-28 md:w-32 md:h-32 flex items-center justify-center mb-4 group">
                <div className="absolute inset-0 bg-blue-500/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-700"></div>
                <svg className="w-full h-full transform -rotate-90 relative z-10" viewBox="0 0 128 128">
                    {/* Background Circle */}
                    <circle cx="64" cy="64" r="58" fill="none" stroke="currentColor" strokeWidth="8" className="text-slate-100 dark:text-slate-700/50" />
                    
                    {/* Progress Circle */}
                    <circle 
                        cx="64" cy="64" r="58" 
                        fill="none" 
                        stroke={analysis.complexityScore > 75 ? '#ec4899' : analysis.complexityScore > 40 ? '#3b82f6' : '#10b981'} 
                        strokeWidth="8" 
                        strokeDasharray={364} // 2 * pi * 58
                        strokeDashoffset={364 - (364 * analysis.complexityScore) / 100}
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                    />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center flex-col">
                     <span className="text-3xl md:text-4xl font-extrabold text-slate-900 dark:text-slate-100">{analysis.complexityScore}</span>
                </div>
             </div>
             
             <div className="text-xs font-semibold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-700/50 text-slate-600 dark:text-slate-400">
                {analysis.complexityScore > 75 ? 'High Complexity' : analysis.complexityScore > 40 ? 'Moderate Complexity' : 'Simple Structure'}
             </div>
        </div>
      </div>

      {/* Activity & Architecture */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
         <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in-up" style={{ animationDelay: '200ms' }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                    <GitCommit className="w-5 h-5 text-orange-500 dark:text-orange-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">Recent Focus</h3>
            </div>
            <div className="flex-1 flex items-center">
                <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm leading-relaxed italic border-l-2 border-orange-200 dark:border-orange-500/30 pl-4">
                    "{analysis.recentActivitySummary}"
                </p>
            </div>
         </div>

         <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300 flex flex-col animate-fade-in-up" style={{ animationDelay: '300ms' }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                    <Layers className="w-5 h-5 text-purple-500 dark:text-purple-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">Architecture Pattern</h3>
            </div>
             <div className="flex-1 flex items-center">
                <p className="text-slate-600 dark:text-slate-300 text-xs md:text-sm font-medium leading-relaxed">
                    {analysis.architecture}
                </p>
            </div>
        </div>
      </div>

      {/* Dependency Graph */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-6 shadow-sm overflow-hidden animate-fade-in-up" style={{ animationDelay: '400ms' }}>
          <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                    <Network className="w-5 h-5 text-blue-500 dark:text-blue-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">Tech Dependency Map</h3>
          </div>
          {dependencyData.nodes.length > 0 ? (
             <DependencyGraph nodes={dependencyData.nodes} links={dependencyData.edges} />
          ) : (
              <div className="h-64 flex items-center justify-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-lg">
                  No dependency data available
              </div>
          )}
      </div>

      {/* Key Workflows */}
      <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '500ms' }}>
          <div className="flex items-center gap-3 mb-6">
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                    <Zap className="w-5 h-5 text-indigo-500 dark:text-indigo-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">Key Workflows & Core Paths</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.keyWorkflows.map((workflow, idx) => (
                <div key={idx} className="bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/50 rounded-lg p-4 hover:border-primary/50 hover:shadow-md transition-all duration-300 group">
                    <h4 className="font-semibold text-slate-800 dark:text-slate-200 mb-2 flex items-center gap-2 text-sm md:text-base">
                        <span className="w-5 h-5 md:w-6 md:h-6 rounded-full bg-white dark:bg-slate-700 text-[10px] md:text-xs flex items-center justify-center text-slate-600 dark:text-slate-400 group-hover:bg-primary group-hover:text-white transition-colors shadow-sm">{idx + 1}</span>
                        {workflow.title}
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3 min-h-[40px] leading-relaxed">{workflow.description}</p>
                    {workflow.involvedFiles.length > 0 && (
                        <div className="space-y-1">
                            {workflow.involvedFiles.slice(0, 3).map(file => (
                                <div key={file} className="flex items-center gap-1.5 text-[10px] text-slate-500 dark:text-slate-500 font-mono bg-white dark:bg-slate-900/50 px-2 py-1 rounded border border-slate-100 dark:border-transparent truncate transition-colors hover:bg-slate-50 dark:hover:bg-slate-800">
                                    <FileCode className="w-3 h-3 shrink-0" />
                                    <span className="truncate">{file}</span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            ))}
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {/* Tech Stack */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '600ms' }}>
             <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-pink-500/10 rounded-lg">
                    <Code className="w-5 h-5 text-pink-500 dark:text-pink-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">Tech Stack Distribution</h3>
            </div>
            <div className="h-40 w-full flex items-center gap-4">
                <div className="h-full w-1/2">
                    <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                            <Pie
                                data={chartData}
                                cx="50%"
                                cy="50%"
                                innerRadius={30}
                                outerRadius={50}
                                paddingAngle={5}
                                dataKey="value"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip 
                                contentStyle={{ backgroundColor: 'var(--color-surface)', borderColor: '#94a3b8', borderRadius: '8px', fontSize: '12px' }}
                                itemStyle={{ color: 'inherit' }}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>
                <div className="w-1/2 flex flex-col gap-1 overflow-y-auto h-full custom-scrollbar">
                     {analysis.techStack.map((tech, idx) => (
                        <div key={tech} className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full shadow-sm" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                            <span className="text-xs text-slate-600 dark:text-slate-300 font-medium">{tech}</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>

        {/* Improvements */}
        <div className="bg-white dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 rounded-xl p-4 md:p-6 shadow-sm animate-fade-in-up" style={{ animationDelay: '700ms' }}>
            <div className="flex items-center gap-3 mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                    <Lightbulb className="w-5 h-5 text-emerald-500 dark:text-emerald-400" />
                </div>
                <h3 className="text-base md:text-lg font-semibold text-slate-900 dark:text-slate-100">Suggested Improvements</h3>
            </div>
            <ul className="space-y-3">
                {analysis.improvements.map((item, idx) => (
                    <li key={idx} className="flex items-start gap-3 p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                        <CheckCircle className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                        <span className="text-slate-600 dark:text-slate-300 text-xs leading-relaxed font-medium">{item}</span>
                    </li>
                ))}
            </ul>
        </div>
      </div>

    </div>
  );
};

export default AnalysisPanel;
