
import { GitHubRepo, GitHubTreeResponse, GitHubCommit } from '../types';

const GITHUB_API_BASE = 'https://api.github.com';

export const parseRepoUrl = (url: string): { owner: string; repo: string } | null => {
  try {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/').filter(Boolean);
    if (parts.length >= 2) {
      return { owner: parts[0], repo: parts[1] };
    }
    return null;
  } catch (e) {
    return null;
  }
};

const getHeaders = (token?: string): HeadersInit => {
  const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3+json',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  return headers;
};

export const fetchRepoDetails = async (owner: string, repo: string, token?: string): Promise<GitHubRepo> => {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}`, { headers: getHeaders(token) });
  if (!response.ok) {
    throw new Error(`GitHub API Error: ${response.statusText}`);
  }
  return response.json();
};

export const fetchRepoTree = async (owner: string, repo: string, branch: string, token?: string): Promise<GitHubTreeResponse> => {
  // Recursive=1 fetches the whole tree
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/git/trees/${branch}?recursive=1`, { headers: getHeaders(token) });
  if (!response.ok) {
    throw new Error('Failed to fetch file structure');
  }
  return response.json();
};

export const fetchFileContent = async (owner: string, repo: string, path: string, token?: string): Promise<string> => {
   const headers: HeadersInit = {
    'Accept': 'application/vnd.github.v3.raw',
  };
  if (token) {
    headers['Authorization'] = `token ${token}`;
  }
  
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/contents/${path}`, { headers });
  if (!response.ok) {
     throw new Error('Failed to fetch file content');
  }
  return response.text();
};

export const fetchRepoCommits = async (owner: string, repo: string, token?: string): Promise<GitHubCommit[]> => {
  const response = await fetch(`${GITHUB_API_BASE}/repos/${owner}/${repo}/commits?per_page=20`, { headers: getHeaders(token) });
  if (!response.ok) {
    // Commits might fail for empty repos, just return empty array in that case to avoid crashing everything
    console.warn('Failed to fetch commits');
    return [];
  }
  return response.json();
};
