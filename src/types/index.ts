// API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Claude API Types
export interface ClaudeAnalysisRequest {
  url: string;
  prompt?: string;
}

export interface ClaudeAnalysisResponse {
  analysis: string;
  suggestions: string[];
  tools: Tool[];
  serviceName?: string;
  serviceType?: string;
  description?: string;
  authMethod?: string;
  authUrl?: string;
  capabilities?: string[];
  icon?: string;
  baseUrl?: string;
}

// Tool Types
export interface Tool {
  id: string;
  name: string;
  description: string;
  category: string;
  action: string;
  parameters?: Record<string, any>;
}

export interface ToolCategory {
  id: string;
  name: string;
  description: string;
  tools: Tool[];
}

// Tab Types
export interface Tab {
  id: string;
  title: string;
  url: string;
  isActive: boolean;
  analysis?: ClaudeAnalysisResponse;
  tools?: Tool[];
  isLoading?: boolean;
}

// MCP Types
export interface MCPServer {
  id: string;
  name: string;
  description: string;
  status: 'connected' | 'disconnected' | 'error';
  tools: Tool[];
}

// Environment Types
export interface EnvironmentConfig {
  anthropicApiKey: string;
  nodeEnv: string;
  port: number;
  allowedOrigins: string[];
  rateLimitWindowMs: number;
  rateLimitMaxRequests: number;
  helmetEnabled: boolean;
  logLevel: string;
}

// Error Types
export interface AppError extends Error {
  statusCode?: number;
  code?: string;
  details?: any;
}

// Component Props Types
export interface GenerativeMCPAppProps {
  initialUrl?: string;
}

export interface TabProps {
  tab: Tab;
  isActive: boolean;
  onSelect: (tabId: string) => void;
  onClose: (tabId: string) => void;
}

export interface ToolGridProps {
  tools: Tool[];
  onToolClick: (tool: Tool) => void;
}

// Form Types
export interface UrlInputForm {
  url: string;
}

// State Types
export interface AppState {
  tabs: Tab[];
  activeTabId: string | null;
  isLoading: boolean;
  error: string | null;
}

// API Client Types
export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  headers: Record<string, string>;
}

// Validation Types
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Utility Types
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

export type RequiredFields<T, K extends keyof T> = T & Required<Pick<T, K>>; 