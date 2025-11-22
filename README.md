<div align="center">
  <img src="./logo.svg" alt="RepoMind Logo" width="120" height="120" />
  <h1>RepoMind</h1>
  <p><strong>Deep Architectural Analysis for GitHub Repositories</strong></p>
  <p>Powered by Google Gemini 2.5 AI</p>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![React](https://img.shields.io/badge/React-19-blue.svg)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38bdf8.svg)](https://tailwindcss.com/)

</div>

<br />
<img src="./Welcome-Page.png" alt="RepoMind screen"/>
RepoMind is a sophisticated architectural analysis tool designed for GitHub repositories. Leveraging the capabilities of Google's Gemini 2.5 AI models, it provides deep insights into codebase structure, design patterns, and workflows. The application features a context-aware chat interface, allowing developers to interrogate repositories using natural language to understand complex logic, generate diagrams, and visualize dependencies.

## Features

- **Deep Architectural Analysis**: Automatically identifies project archetypes (e.g., "Modular Monolith", "Micro-Utility"), assesses complexity scores, and maps key workflows.
- **Context-Aware Chat Assistant**: A RAG (Retrieval-Augmented Generation) powered interface that allows users to ask specific technical questions about the codebase. It supports "Deep Thinking" mode for complex architectural queries and "Web Search" for up-to-date library information.
- **Interactive Visualizations**:
  - **Dependency Graph**: A force-directed graph visualizing relationships between frameworks, libraries, and internal modules.
  - **Diagram Generation**: On-demand rendering of Mermaid.js diagrams (flowcharts, sequence diagrams) within the chat interface.
- **File Explorer & Preview**: A navigable tree view of the repository structure with syntax-highlighted code previews and Markdown rendering.
- **Local Bookmarking**: Save analysis sessions locally to revisit insights without re-fetching data.
- **Responsive Design**: A fully responsive UI supporting dark/light modes, mobile drawer navigation, and glassmorphic aesthetics.

## Prerequisites

- **Node.js**: Version 18.0.0 or higher.
- **Google Gemini API Key**: Required for AI analysis features.
- **GitHub Personal Access Token (Optional)**: Recommended for higher rate limits and accessing private repositories.

## Installation

1.  **Clone the repository**

    ```bash
    git clone https://github.com/7amo10/repomind.git
    cd repomind
    ```

2.  **Install dependencies**

    ```bash
    npm install
    ```

3.  **Environment Configuration**
    Create a `.env` file in the root directory. You must provide your Gemini API Key here.

    ```env
    VITE_GEMINI_API_KEY=your_google_gemini_api_key
    ```

> [!NOTE]
> The application also allows users to input their API key via the UI if not configured in the environment, but setting it here is recommended for hosted deployments.\*

4.  **Start the development server**
    ```bash
    npm run dev
    ```

## Usage

1.  **Analyze a Repository**: Enter a valid GitHub repository URL (e.g., `https://github.com/facebook/react`) on the welcome screen.
2.  **Explore Insights**: Use the "Deep Analysis" panel to review the executive summary, tech stack distribution, and complexity assessment.
3.  **Interrogate the Code**: Switch to the "Context Chat" tab.
    - **Standard Mode**: General queries about code and structure.
    - **Deep Think Mode**: Complex reasoning tasks and architectural critiques.
    - **Search Mode**: Verification of facts, documentation lookup, and library research.
4.  **Visualize**: Ask the chat assistant to "draw a diagram of the authentication flow" to generate interactive diagrams.

## Technologies

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS
- **AI Integration**: Google Gemini API (`@google/genai`)
- **Visualization**: D3.js, Recharts, Mermaid.js
- **Utilities**: Lucide React, Highlight.js, Marked, KaTeX

## License

This project is licensed under the MIT License. See the `LICENSE` file for details.

