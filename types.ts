
// GitHub API Types
export interface GitHubRepo {
  name: string;
  full_name: string;
  description: string;
  stargazers_count: number;
  language: string;
  html_url: string;
  default_branch: string;
  owner: {
    avatar_url: string;
    login: string;
  };
}

export interface GitHubFile {
  path: string;
  mode: string;
  type: "blob" | "tree";
  sha: string;
  size?: number;
  url: string;
}

export interface GitHubTreeResponse {
  sha: string;
  url: string;
  tree: GitHubFile[];
  truncated: boolean;
}

export interface GitHubCommit {
  sha: string;
  commit: {
    message: string;
    author: {
      name: string;
      date: string;
    };
  };
  html_url: string;
}

// App Logic Types
export interface DependencyNode {
  id: string;
  category: 'Language' | 'Framework' | 'Library' | 'Tool' | 'Database' | 'Core';
}

export interface DependencyLink {
  source: string;
  target: string;
}

export interface AnalysisResult {
  summary: string;
  architecture: string;
  techStack: string[];
  improvements: string[];
  complexityScore: number; // 0-100
  
  // New Creative Features
  archetype: {
    title: string; // e.g., "The Modular Monolith", "The Micro-Utility"
    description: string;
    tags: string[]; // e.g., ["Clean", "Tested", "Complex"]
  };
  recentActivitySummary: string; // AI summary of commit history
  keyWorkflows: {
    title: string;
    description: string;
    involvedFiles: string[]; // List of relevant file paths
  }[];
  
  dependencyGraph: {
    nodes: DependencyNode[];
    edges: DependencyLink[];
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
  sources?: { title?: string; uri: string }[];
  mode?: 'standard' | 'thinking' | 'search';
}

export interface SavedSession {
  id: string;
  timestamp: number;
  repo: GitHubRepo;
  analysis: AnalysisResult;
  tree: GitHubTreeResponse;
  readme: string;
  chatHistory: ChatMessage[];
}

export type AppState = 'IDLE' | 'FETCHING_REPO' | 'ANALYZING' | 'READY' | 'ERROR';
