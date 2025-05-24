'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Search, ArrowLeft, ArrowRight, RotateCcw, Plus, X, Play, Loader, Circle, Square, Triangle, Database, Code, MessageSquare } from 'lucide-react';
import { claudeApi } from '@/services/api';
import type { Tab, Tool, ClaudeAnalysisResponse } from '@/types';
import { validateUrl, sanitizeUrl } from '@/utils/validation';
import { DEFAULTS, ERROR_MESSAGES, SUCCESS_MESSAGES } from '@/utils/constants';

// Legacy interfaces for compatibility with existing code
interface MCPServer {
  name: string;
  icon: React.ReactElement;
  type: string;
  description: string;
  tools: string[];
  predictiveActions: PredictiveAction[];
  toolSchemas: Record<string, ToolSchema>;
  serviceName?: string;
  serviceType?: string;
  authFlow?: AuthFlow;
  baseUrl?: string;
  aiGenerated?: boolean;
  isReal?: boolean;
  authUrl?: string;
}

interface PredictiveAction {
  action: string;
  confidence: number;
  context: string;
  enhancedContext?: string;
}

interface ToolSchema {
  name: string;
  description: string;
  displayName?: string;
  parameters?: Record<string, any>;
  interface?: ToolInterface;
}

interface ToolInterface {
  type: string;
  fields?: FieldDefinition[];
  multiple?: boolean;
  accept?: string;
}

interface FieldDefinition {
  name: string;
  type: string;
  label: string;
  required?: boolean;
  options?: string[];
  accept?: string;
  placeholder?: string;
  rows?: number;
}

interface AuthFlow {
  steps: AuthStep[];
}

interface AuthStep {
  step: number;
  title: string;
  description: string;
  fields?: AuthField[];
  action?: string;
}

interface AuthField {
  name: string;
  type: string;
  label: string;
}

interface LegacyTab {
  id: number;
  title: string;
  url: string;
  active: boolean;
}

interface PopularMCP {
  url: string;
  title: string;
}

const GenerativeMCPApp = () => {
  const [url, setUrl] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [currentServer, setCurrentServer] = useState<MCPServer | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState<boolean>(false);
  const [tabs, setTabs] = useState<LegacyTab[]>([{ id: 1, title: 'New Tab', url: '', active: true }]);
  const [activeTab, setActiveTab] = useState<number>(1);
  const [predictiveActions, setPredictiveActions] = useState<PredictiveAction[]>([]);
  const [executingAction, setExecutingAction] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [toolResults, setToolResults] = useState<Record<string, string>>({});
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [authState, setAuthState] = useState<Record<string, any>>({});
  const [error, setError] = useState<string | null>(null);
  
  const urlInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Enhanced MCP directory with actual tool definitions
  const mcpDirectory: Record<string, MCPServer> = {
    'github.com': {
      name: 'GitHub',
      icon: <Square size={12} />,
      type: 'code',
      description: 'Code repositories and collaboration',
      tools: ['create-repo', 'list-repos', 'search-code', 'manage-issues', 'create-pr', 'view-commits'],
      predictiveActions: [
        { action: 'create-repo', confidence: 0.9, context: 'Start a new project' },
        { action: 'list-repos', confidence: 0.7, context: 'Browse existing repositories' },
        { action: 'search-code', confidence: 0.6, context: 'Find specific code patterns' }
      ],
      toolSchemas: {
        'create-repo': {
          name: 'create-repo',
          description: 'Create a new GitHub repository',
          parameters: {
            name: { type: 'string', required: true },
            description: { type: 'string', required: false },
            private: { type: 'boolean', required: false },
            init_readme: { type: 'boolean', required: false }
          }
        },
        'list-repos': {
          name: 'list-repos',
          description: 'List GitHub repositories',
          parameters: {
            language: { type: 'string', enum: ['All Languages', 'JavaScript', 'Python', 'Go', 'Rust'] },
            visibility: { type: 'string', enum: ['All Visibility', 'Public', 'Private'] }
          }
        }
      }
    },
    'notion.so': {
      name: 'Notion',
      icon: <Circle size={12} />,
      type: 'knowledge',
      description: 'Knowledge management and productivity',
      tools: ['create-page', 'search-content', 'update-database', 'get-analytics', 'manage-templates'],
      predictiveActions: [
        { action: 'create-page', confidence: 0.8, context: 'Start documenting' },
        { action: 'search-content', confidence: 0.7, context: 'Find existing notes' }
      ],
      toolSchemas: {
        'create-page': {
          name: 'create-page',
          description: 'Create a new Notion page',
          parameters: {
            title: { type: 'string', required: true },
            content: { type: 'text', required: true },
            template: { type: 'string', enum: ['Meeting Notes', 'Project Brief', 'Documentation'] }
          }
        }
      }
    },
    'slack.com': {
      name: 'Slack',
      icon: <Triangle size={12} />,
      type: 'communication',
      description: 'Team communication and automation',
      tools: ['send-message', 'create-channel', 'schedule-message', 'get-analytics', 'manage-users'],
      predictiveActions: [
        { action: 'send-message', confidence: 0.9, context: 'Communicate with team' },
        { action: 'create-channel', confidence: 0.6, context: 'Organize conversations' }
      ],
      toolSchemas: {
        'send-message': {
          name: 'send-message',
          description: 'Send a message to Slack',
          parameters: {
            channel: { type: 'string', required: true },
            message: { type: 'text', required: true },
            schedule_time: { type: 'datetime', required: false }
          }
        }
      }
    },
    'data.local': {
      name: 'Data Analysis',
      icon: <Database size={12} />,
      type: 'analytics',
      description: 'Local data analysis and visualization tools',
      tools: ['import-data', 'analyze-dataset', 'create-visualization', 'export-results', 'run-query'],
      predictiveActions: [
        { action: 'import-data', confidence: 0.9, context: 'Load your dataset' },
        { action: 'analyze-dataset', confidence: 0.8, context: 'Explore data patterns' },
        { action: 'create-visualization', confidence: 0.7, context: 'Generate charts and graphs' }
      ],
      toolSchemas: {
        'import-data': {
          name: 'import-data',
          description: 'Import data from various sources',
          parameters: {
            source: { type: 'string', enum: ['CSV', 'JSON', 'Excel', 'Database'] },
            file_path: { type: 'string', required: true }
          }
        },
        'analyze-dataset': {
          name: 'analyze-dataset',
          description: 'Perform statistical analysis on dataset',
          parameters: {
            dataset_id: { type: 'string', required: true },
            analysis_type: { type: 'string', enum: ['Summary', 'Correlation', 'Regression', 'Clustering'] }
          }
        }
      }
    }
  };

  const popularMCPs: PopularMCP[] = [
    { url: 'github.com', title: 'GitHub — Code & Collaboration' },
    { url: 'notion.so', title: 'Notion — Knowledge Base' },
    { url: 'slack.com', title: 'Slack — Team Communication' },
    { url: 'data.local', title: 'Data Analysis — Local Tools' }
  ];

  // AI Analysis function using our API
  const analyzeUrlWithAI = async (url: string): Promise<ClaudeAnalysisResponse | null> => {
    try {
      setError(null);
      const response = await claudeApi.analyzeUrl({ url });
      return response;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      console.error('AI analysis error:', error);
      return null;
    }
  };

  // Generate tool interfaces with AI
  const generateToolInterfacesWithAI = async (serviceAnalysis: any) => {
    // This would use AI to generate dynamic tool interfaces
    // For now, return mock data
    return {};
  };

  // Generate auth flow with AI
  const generateAuthFlowWithAI = async (serviceAnalysis: any) => {
    // This would use AI to generate authentication flows
    // For now, return mock data
    return null;
  };

  // Connect to MCP Server
  const connectToMCPServer = async (serverUrl: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Check if we have a predefined server
      const predefinedServer = mcpDirectory[serverUrl];
      if (predefinedServer) {
        setCurrentServer(predefinedServer);
        setPredictiveActions(predefinedServer.predictiveActions);
        return;
      }

      // Use AI to analyze the URL and generate server configuration
      const analysis = await analyzeUrlWithAI(serverUrl);
      if (analysis) {
        const aiGeneratedServer: MCPServer = {
          name: analysis.analysis || 'AI Generated Server',
          icon: <Database size={12} />,
          type: 'ai-generated',
          description: analysis.analysis || 'AI-generated MCP server',
          tools: analysis.tools?.map(tool => tool.id) || [],
          predictiveActions: analysis.suggestions?.map((suggestion, index) => ({
            action: `action-${index}`,
            confidence: 0.8,
            context: suggestion,
            enhancedContext: suggestion
          })) || [],
          toolSchemas: {},
          aiGenerated: true,
          isReal: false,
          baseUrl: serverUrl
        };

        // Generate tool schemas from AI response
        if (analysis.tools) {
          analysis.tools.forEach(tool => {
            aiGeneratedServer.toolSchemas[tool.id] = {
              name: tool.id,
              description: tool.description,
              displayName: tool.name
            };
          });
        }

        setCurrentServer(aiGeneratedServer);
        setPredictiveActions(aiGeneratedServer.predictiveActions);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : ERROR_MESSAGES.UNKNOWN_ERROR;
      setError(errorMessage);
      console.error('MCP connection error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Execute tool with AI
  const executeToolWithAI = async (toolName: string, parameters: any, serverInfo: MCPServer) => {
    setExecutingAction(toolName);
    
    try {
      // Simulate tool execution
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const result = `Tool "${toolName}" executed successfully with parameters: ${JSON.stringify(parameters, null, 2)}`;
      setToolResults(prev => ({ ...prev, [toolName]: result }));
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Tool execution failed';
      setError(errorMessage);
      throw error;
    } finally {
      setExecutingAction(null);
    }
  };

  // Click outside handler for dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputFocus = () => {
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleInputBlur = () => {
    // Delay hiding to allow for suggestion clicks
    setTimeout(() => setShowSuggestions(false), 200);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setUrl(suggestion);
    setShowSuggestions(false);
    navigateToMCP(suggestion);
  };

  const navigateToMCP = async (mcpUrl: string) => {
    const validation = validateUrl(mcpUrl);
    if (!validation.isValid) {
      setError(validation.errors.join(', '));
      return;
    }

    const sanitizedUrl = sanitizeUrl(mcpUrl);
    setUrl(sanitizedUrl);
    
    // Update current tab
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.active 
          ? { ...tab, url: sanitizedUrl, title: sanitizedUrl }
          : tab
      )
    );

    // Generate suggestions based on URL
    const urlSuggestions = [
      `${sanitizedUrl}/api`,
      `${sanitizedUrl}/docs`,
      `${sanitizedUrl}/tools`,
      `${sanitizedUrl}/auth`,
      `${sanitizedUrl}/status`
    ];
    setSuggestions(urlSuggestions);

    await connectToMCPServer(sanitizedUrl);
  };

  const executeAction = async (action: string) => {
    if (!currentServer) return;
    
    setExecutingAction(action);
    try {
      await executeToolWithAI(action, formData[action] || {}, currentServer);
    } catch (error) {
      console.error('Action execution error:', error);
    }
  };

  const handleAuth = async (serviceName: string, authData: any) => {
    // Simulate authentication
    setAuthState(prev => ({ ...prev, [serviceName]: authData }));
    console.log(`Authenticated with ${serviceName}:`, authData);
  };

  const handleFormChange = (toolName: string, field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [toolName]: {
        ...prev[toolName],
        [field]: value
      }
    }));
  };

  const handleExecuteTool = async () => {
    if (!selectedTool || !currentServer) return;
    
    try {
      await executeToolWithAI(selectedTool, formData[selectedTool] || {}, currentServer);
    } catch (error) {
      console.error('Tool execution error:', error);
    }
  };

  const createNewTab = () => {
    const newTabId = Math.max(...tabs.map(t => t.id)) + 1;
    const newTab: LegacyTab = {
      id: newTabId,
      title: 'New Tab',
      url: '',
      active: false
    };
    
    setTabs(prev => [...prev, newTab]);
    selectTab(newTabId);
  };

  const closeTab = (tabId: number, e: React.MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    
    if (tabs.length === 1) return; // Don't close the last tab
    
    const tabIndex = tabs.findIndex(t => t.id === tabId);
    const wasActive = tabs[tabIndex]?.active;
    
    setTabs(prev => prev.filter(t => t.id !== tabId));
    
    if (wasActive) {
      const remainingTabs = tabs.filter(t => t.id !== tabId);
      const newActiveTab = remainingTabs[Math.max(0, tabIndex - 1)];
      if (newActiveTab) {
        selectTab(newActiveTab.id);
      }
    }
  };

  const selectTab = (tabId: number) => {
    setTabs(prev => prev.map(tab => ({ ...tab, active: tab.id === tabId })));
    setActiveTab(tabId);
    
    const selectedTab = tabs.find(t => t.id === tabId);
    if (selectedTab?.url) {
      setUrl(selectedTab.url);
      connectToMCPServer(selectedTab.url);
    } else {
      setUrl('');
      setCurrentServer(null);
      setPredictiveActions([]);
    }
  };

  const PredictiveActionCard = ({ action, confidence, context, enhancedContext }: PredictiveAction) => (
    <div className="border border-gray-300 p-4 hover:border-black transition-colors cursor-pointer"
         onClick={() => executeAction(action)}>
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-mono text-sm uppercase tracking-wider text-black">
          {action.replace(/-/g, ' ')}
        </h3>
        <div className="flex items-center space-x-1">
          <div className="w-2 h-2 bg-green-500 rounded-full"></div>
          <span className="text-xs text-gray-600">{Math.round(confidence * 100)}%</span>
        </div>
      </div>
      <p className="text-sm text-gray-700 mb-3">{enhancedContext || context}</p>
      <button
        className="w-full px-4 py-2 border border-gray-300 hover:border-black transition-colors font-mono text-xs uppercase tracking-wider"
        disabled={executingAction === action}
      >
        {executingAction === action ? (
          <div className="flex items-center justify-center space-x-2">
            <Loader className="animate-spin" size={12} />
            <span>Executing...</span>
          </div>
        ) : (
          'Execute'
        )}
      </button>
    </div>
  );

  // Tool interface renderer
  const renderToolInterface = (toolName: string) => {
    const result = toolResults[toolName];
    const schema = currentServer?.toolSchemas?.[toolName];
    
    // Generic form interface for any tool
    return (
      <div className="space-y-6">
        {/* Tool Description */}
        {schema?.description && (
          <div className="border border-gray-300 p-4">
            <h3 className="font-mono text-sm uppercase tracking-wider text-black mb-2">
              Description
            </h3>
            <p className="text-sm text-gray-700">{schema.description}</p>
          </div>
        )}

        {/* Tool Parameters */}
        {schema?.parameters && (
          <div className="border border-gray-300 p-4">
            <h3 className="font-mono text-sm uppercase tracking-wider text-black mb-4">
              Parameters
            </h3>
            <div className="space-y-4">
              {Object.entries(schema.parameters).map(([paramName, paramConfig]: [string, any]) => (
                <div key={paramName}>
                  <label className="block font-mono text-xs uppercase tracking-wider text-gray-600 mb-2">
                    {paramName.replace(/_/g, ' ')} {paramConfig.required && '*'}
                  </label>
                  
                  {paramConfig.enum ? (
                    <select 
                      className="w-full p-3 border border-gray-300 focus:border-black font-mono text-sm"
                      onChange={(e) => handleFormChange(toolName, paramName, e.target.value)}
                    >
                      <option value="">Select {paramName}</option>
                      {paramConfig.enum.map((option: string) => (
                        <option key={option} value={option}>{option}</option>
                      ))}
                    </select>
                  ) : paramConfig.type === 'boolean' ? (
                    <label className="flex items-center space-x-2">
                      <input 
                        type="checkbox" 
                        className="w-4 h-4"
                        onChange={(e) => handleFormChange(toolName, paramName, e.target.checked)}
                      />
                      <span className="text-sm text-gray-700">Enable {paramName.replace(/_/g, ' ')}</span>
                    </label>
                  ) : paramConfig.type === 'text' ? (
                    <textarea 
                      className="w-full p-3 border border-gray-300 focus:border-black font-mono text-sm" 
                      rows={3} 
                      placeholder={`Enter ${paramName.replace(/_/g, ' ')}...`}
                      onChange={(e) => handleFormChange(toolName, paramName, e.target.value)}
                    />
                  ) : (
                    <input 
                      type="text" 
                      className="w-full p-3 border border-gray-300 focus:border-black font-mono text-sm" 
                      placeholder={`Enter ${paramName.replace(/_/g, ' ')}...`}
                      onChange={(e) => handleFormChange(toolName, paramName, e.target.value)}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tool Result */}
        {result && (
          <div className="border border-gray-300 p-4">
            <h3 className="font-mono text-sm uppercase tracking-wider text-black mb-2">
              Result
            </h3>
            <pre className="text-sm whitespace-pre-wrap text-gray-700 bg-gray-50 p-3 rounded">
              {result}
            </pre>
          </div>
        )}

        {/* Default interface if no schema */}
        {!schema && (
          <div className="border border-gray-300 p-4">
            <h3 className="font-mono text-sm uppercase tracking-wider text-black mb-4">
              {toolName.replace(/-/g, ' ')} Tool
            </h3>
            <p className="text-sm text-gray-700 mb-4">
              This tool is ready to execute. Click the Execute Tool button above to run it.
            </p>
            {result && (
              <div className="mt-4 p-3 bg-gray-50 rounded">
                <pre className="text-sm whitespace-pre-wrap text-gray-700">{result}</pre>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Tab Bar */}
      <div className="border-b border-gray-300">
        <div className="flex items-center">
          {tabs.map(tab => (
            <div
              key={tab.id}
              className={`flex items-center px-4 py-3 border-r border-gray-300 cursor-pointer min-w-0 max-w-xs ${
                tab.active ? 'bg-white' : 'bg-gray-50 hover:bg-gray-100'
              }`}
              onClick={() => selectTab(tab.id)}
            >
              <span className="font-mono text-sm truncate flex-1">
                {tab.title}
              </span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => closeTab(tab.id, e)}
                  className="ml-2 p-1 hover:bg-gray-200 rounded"
                >
                  <X size={12} />
                </button>
              )}
            </div>
          ))}
          <button
            onClick={createNewTab}
            className="p-3 hover:bg-gray-100 border-r border-gray-300"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Navigation Bar */}
      <div className="border-b border-gray-300 p-4">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <button className="p-2 hover:bg-gray-100 disabled:opacity-50" disabled>
              <ArrowLeft size={16} />
            </button>
            <button className="p-2 hover:bg-gray-100 disabled:opacity-50" disabled>
              <ArrowRight size={16} />
            </button>
            <button 
              className="p-2 hover:bg-gray-100"
              onClick={() => window.location.reload()}
            >
              <RotateCcw size={16} />
            </button>
          </div>
          
          <div className="flex-1 relative" ref={dropdownRef}>
            <div className="flex items-center border border-gray-300 focus-within:border-black">
              <Search className="ml-3 text-gray-400" size={16} />
              <input
                ref={urlInputRef}
                type="text"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && navigateToMCP(url)}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
                placeholder="Enter MCP server URL..."
                className="flex-1 p-3 font-mono text-sm focus:outline-none"
              />
              <button
                onClick={() => navigateToMCP(url)}
                disabled={isLoading}
                className="px-4 py-3 border-l border-gray-300 hover:bg-gray-50 disabled:opacity-50"
              >
                {isLoading ? <Loader className="animate-spin" size={16} /> : <Play size={16} />}
              </button>
            </div>
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-300 border-t-0 z-10">
                {suggestions.map((suggestion, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-4 py-2 hover:bg-gray-50 font-mono text-sm border-b border-gray-100 last:border-b-0"
                    onClick={() => handleSuggestionClick(suggestion)}
                  >
                    {suggestion}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 p-4">
          <div className="flex items-center space-x-2">
            <X className="text-red-500" size={16} />
            <span className="text-red-700 text-sm">{error}</span>
            <button
              onClick={() => setError(null)}
              className="ml-auto text-red-500 hover:text-red-700"
            >
              <X size={16} />
            </button>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="p-8">
        {currentServer ? (
          <div>
            {/* Server Header */}
            <div className="mb-8">
              <div className="flex items-center space-x-4 mb-4">
                {currentServer.icon}
                <div>
                  <h1 className="font-mono text-2xl uppercase tracking-wider text-black">
                    {currentServer.name}
                  </h1>
                  <p className="text-gray-600">{currentServer.description}</p>
                </div>
                {isAnalyzing && (
                  <div className="flex items-center space-x-2 text-gray-600">
                    <Loader className="animate-spin" size={16} />
                    <span className="text-sm">Analyzing...</span>
                  </div>
                )}
              </div>
              <div className="flex items-center space-x-2">
                <span className="px-2 py-1 border border-gray-300 font-mono text-xs uppercase">
                  {currentServer.serviceType || currentServer.type}
                </span>
                <span className="px-2 py-1 border border-gray-300 font-mono text-xs">
                  {currentServer.tools.length} tools
                </span>
                {currentServer.baseUrl && (
                  <span className="px-2 py-1 border border-gray-300 font-mono text-xs">
                    API: {currentServer.baseUrl}
                  </span>
                )}
              </div>
            </div>

            {/* Predictive Actions */}
            {predictiveActions.length > 0 && !selectedTool && (
              <div className="mb-8">
                <h2 className="font-mono text-xl uppercase tracking-wider text-black mb-6">
                  Suggested Actions
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {predictiveActions.map((action, index) => (
                    <PredictiveActionCard
                      key={index}
                      action={action.action}
                      confidence={action.confidence}
                      context={action.context}
                      enhancedContext={action.enhancedContext}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Available Tools */}
            <div>
              <h2 className="font-mono text-xl uppercase tracking-wider text-black mb-6">
                Available Tools
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {currentServer.tools.map(tool => (
                  <button
                    key={tool}
                    className="text-left p-4 border border-gray-300 hover:border-black transition-colors"
                    onClick={() => setSelectedTool(tool)}
                  >
                    <h3 className="font-mono text-sm uppercase tracking-wider text-black mb-2">
                      {tool.replace(/-/g, ' ')}
                    </h3>
                    <p className="text-xs text-gray-600">
                      {currentServer.toolSchemas?.[tool]?.description || `Execute ${tool} operation`}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            {/* Tool Interface */}
            {selectedTool && (
              <div className="mt-8">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="font-mono text-xl uppercase tracking-wider text-black">
                    {selectedTool.replace(/-/g, ' ')}
                  </h2>
                  <div className="flex items-center space-x-4">
                    <button
                      onClick={handleExecuteTool}
                      disabled={executingAction === selectedTool}
                      className="px-6 py-3 border border-black hover:bg-black hover:text-white transition-colors font-mono text-sm disabled:opacity-50"
                    >
                      {executingAction === selectedTool ? (
                        <div className="flex items-center space-x-2">
                          <Loader className="animate-spin" size={14} />
                          <span>Executing...</span>
                        </div>
                      ) : (
                        'Execute Tool'
                      )}
                    </button>
                    <button
                      onClick={() => setSelectedTool(null)}
                      className="px-6 py-3 border border-gray-300 hover:border-black transition-colors font-mono text-sm"
                    >
                      Close
                    </button>
                  </div>
                </div>
                
                {renderToolInterface(selectedTool)}
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-16">
            <h1 className="font-mono text-3xl uppercase tracking-wider text-black mb-8">
              Generative MCP Browser
            </h1>
            <p className="text-lg text-gray-600 mb-12 max-w-2xl mx-auto">
              Connect to Model Context Protocol servers and interact with AI-powered tools through an intuitive browser interface.
            </p>
            
            <div className="mb-12">
              <h2 className="font-mono text-xl uppercase tracking-wider text-black mb-6">
                Popular MCP Servers
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-4xl mx-auto">
                {popularMCPs.map(mcp => (
                  <button
                    key={mcp.url}
                    className="text-left p-6 border border-gray-300 hover:border-black transition-colors"
                    onClick={() => navigateToMCP(mcp.url)}
                  >
                    <div className="flex items-center space-x-3 mb-2">
                      {mcpDirectory[mcp.url]?.icon}
                      <h3 className="font-mono text-sm uppercase tracking-wider text-black">
                        {mcp.title}
                      </h3>
                    </div>
                    <p className="text-sm text-gray-600">
                      {mcpDirectory[mcp.url]?.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>

            <div className="text-sm text-gray-600">
              <p>Enter an MCP server URL in the address bar above to get started.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default GenerativeMCPApp; 