
import { GoogleGenAI, Type } from "@google/genai";
import { AnalysisResult, GitHubFile, GitHubRepo, GitHubCommit } from "../types";

const getAiClient = () => {
    return new GoogleGenAI({ apiKey: process.env.API_KEY });
}

export const analyzeRepoStructure = async (
  repo: GitHubRepo,
  files: GitHubFile[],
  readmeContent: string,
  commits: GitHubCommit[]
): Promise<AnalysisResult> => {
  const ai = getAiClient();
  
  // Filter files to reduce context size, keep critical extensions and structure
  const criticalFiles = files
    .filter(f => f.type === 'blob')
    .map(f => f.path)
    .filter(path => {
        return !path.includes('node_modules') && 
               !path.includes('dist') && 
               !path.includes('package-lock') &&
               !path.includes('yarn.lock') &&
               !path.includes('.png') &&
               !path.includes('.jpg');
    })
    .slice(0, 800); // Limit files

  // Process commit history for context
  const commitLog = commits.map(c => 
    `[${c.commit.author.date.substring(0, 10)}] ${c.commit.author.name}: ${c.commit.message.split('\n')[0]}`
  ).join('\n');

  const prompt = `
    You are a Principal Software Engineer and Technical Lead. 
    Analyze the following GitHub repository to provide a deep, connected explanation of how it works.
    
    REPO METADATA:
    Name: ${repo.full_name}
    Description: ${repo.description}
    Language: ${repo.language}
    
    README PREVIEW:
    ${readmeContent.substring(0, 1500)}...
    
    RECENT COMMIT LOG (Use this to determine recent activity focus and contribution health):
    ${commitLog}
    
    FILE STRUCTURE (Partial):
    ${criticalFiles.join('\n')}
    
    Your task is to generate a JSON response that creates a comprehensive "Developer Handbook" style summary.
    
    Define a "Repository Archetype" that gives the project a personality (e.g., "The Minimalist Toolkit", "The Enterprise Monolith", "The Educational Sandbox").
    Identify "Key Workflows" - guesses at the main logical paths a user or data takes through the system, linking specific files.
    
    Also, construct a "Dependency Graph" of the technologies and main internal modules. 
    - Nodes should be the technologies (e.g., React, TypeScript) or major internal concepts.
    - Edges should represent 'depends on' or 'related to'.
    - Categories: 'Language', 'Framework', 'Library', 'Tool', 'Database', 'Core'.
    
    JSON Schema requirements:
    1. summary: Executive summary.
    2. architecture: Architectural pattern.
    3. techStack: Detected libraries/frameworks.
    4. improvements: Provide a list of at least 3 actionable suggestions for improvement based on code, contribution, or health.
    5. complexityScore: 0-100.
    6. archetype: { title, description, tags[] }.
    7. recentActivitySummary: Analyze the commit log to explain what the team is currently working on.
    8. keyWorkflows: { title, description, involvedFiles[] }.
    9. dependencyGraph: { nodes: { id, category }[], edges: { source, target }[] }. Ensure all edges point to valid node IDs.
  `;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          summary: { type: Type.STRING },
          architecture: { type: Type.STRING },
          techStack: { type: Type.ARRAY, items: { type: Type.STRING } },
          improvements: { type: Type.ARRAY, items: { type: Type.STRING } },
          complexityScore: { type: Type.NUMBER },
          archetype: {
            type: Type.OBJECT,
            properties: {
                title: { type: Type.STRING },
                description: { type: Type.STRING },
                tags: { type: Type.ARRAY, items: { type: Type.STRING } }
            }
          },
          recentActivitySummary: { type: Type.STRING },
          keyWorkflows: {
              type: Type.ARRAY,
              items: {
                  type: Type.OBJECT,
                  properties: {
                      title: { type: Type.STRING },
                      description: { type: Type.STRING },
                      involvedFiles: { type: Type.ARRAY, items: { type: Type.STRING } }
                  }
              }
          },
          dependencyGraph: {
            type: Type.OBJECT,
            properties: {
              nodes: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    id: { type: Type.STRING },
                    category: { type: Type.STRING }
                  }
                }
              },
              edges: {
                type: Type.ARRAY,
                items: {
                  type: Type.OBJECT,
                  properties: {
                    source: { type: Type.STRING },
                    target: { type: Type.STRING }
                  }
                }
              }
            }
          }
        },
        required: ["summary", "architecture", "techStack", "improvements", "complexityScore", "archetype", "recentActivitySummary", "keyWorkflows", "dependencyGraph"],
      }
    }
  });

  if (response.text) {
    return JSON.parse(response.text) as AnalysisResult;
  }
  
  throw new Error("Failed to generate analysis");
};

export const chatWithRepo = async (
  history: { role: string; parts: { text: string }[] }[],
  message: string,
  contextData: {
    repo: GitHubRepo;
    analysis: AnalysisResult;
    readme: string;
    fileTree: any[]; // simplified tree list
  },
  mode: 'standard' | 'thinking' | 'search' = 'standard'
) => {
    const ai = getAiClient();

    // Construct optimized context string
    const { repo, analysis, readme, fileTree } = contextData;
    
    const workflowsText = analysis.keyWorkflows.map(w => 
      `- ${w.title}: ${w.description} (Files: ${w.involvedFiles.join(', ')})`
    ).join('\n');

    const fileList = fileTree
      .slice(0, 300) // Limit file list for tokens
      .map(f => f.path)
      .join('\n');

    const refinedContext = `
      REPOSITORY: ${repo.full_name}
      DESCRIPTION: ${repo.description}
      LANGUAGE: ${repo.language}
      
      ARCHETYPE: ${analysis.archetype.title}
      ${analysis.archetype.description}
      
      ARCHITECTURE:
      ${analysis.architecture}
      
      KEY WORKFLOWS:
      ${workflowsText}
      
      TECH STACK: ${analysis.techStack.join(', ')}
      
      README (Excerpt):
      ${readme.substring(0, 2000)}
      
      FILE STRUCTURE (Partial):
      ${fileList}
    `;
    
    const systemInstruction = `
      You are an expert Technical AI Assistant for the repository "${repo.full_name}".
      
      Your goal is to help the developer understand the code, architecture, and logic.
      Use the provided CONTEXT strictly. If you don't know something, say it.
      
      VISUALS AND DIAGRAMS:
      If the user asks for a diagram, or if explaining a complex flow (like inheritance, data flow, or state changes), 
      you MUST generate a mermaid.js diagram.
      
      CRITICAL MERMAID SYNTAX RULES:
      1. Wrap the code in a markdown block: \`\`\`mermaid ... \`\`\`
      2. ALWAYS use quotes for node labels to handle special characters. 
         - CORRECT: A["User Input"] --> B["Process Data"]
         - WRONG: A[User Input] --> B[Process Data]
      3. Do NOT use parentheses inside labels without quotes.
      4. Do NOT use 'end' as a node ID (it is a keyword).
      5. Keep diagrams simple (graph TD or sequenceDiagram).
      
      Example:
      \`\`\`mermaid
      graph TD
        A["Start"] --> B{"Is Valid?"}
        B -- "Yes" --> C["Process"]
        B -- "No" --> D["Error"]
      \`\`\`
      
      Keep responses technical but accessible.
      
      CONTEXT:
      ${refinedContext}
    `;

    let modelName = "gemini-2.5-flash";
    const config: any = {
      systemInstruction: systemInstruction
    };

    // Configure based on mode
    if (mode === 'thinking') {
      modelName = "gemini-3-pro-preview";
      // Thinking config requires a budget. Max for pro is 32k.
      config.thinkingConfig = { thinkingBudget: 32768 };
      // IMPORTANT: do not set maxOutputTokens when using thinking
    } else if (mode === 'search') {
      modelName = "gemini-2.5-flash"; // Prompt specified to use 2.5 flash with search
      config.tools = [{ googleSearch: {} }];
      // Note: responseSchema and responseMimeType are not allowed with googleSearch, which is fine here.
    }

    const chat = ai.chats.create({
        model: modelName,
        history: history,
        config: config
    });

    return chat.sendMessageStream({ message });
};
