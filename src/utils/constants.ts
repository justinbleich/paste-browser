// API Constants
export const API_ENDPOINTS = {
  CLAUDE_ANALYZE: '/api/claude/analyze',
  HEALTH: '/api/health',
  MCP_SERVERS: '/api/mcp/servers',
  MCP_TOOLS: '/api/mcp/tools',
} as const;

// Environment Constants
export const NODE_ENVIRONMENTS = {
  DEVELOPMENT: 'development',
  PRODUCTION: 'production',
  TEST: 'test',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Error Messages
export const ERROR_MESSAGES = {
  INVALID_URL: 'Please enter a valid URL',
  NETWORK_ERROR: 'Network error occurred. Please try again.',
  SERVER_ERROR: 'Server error occurred. Please try again later.',
  UNAUTHORIZED: 'Unauthorized access. Please check your API key.',
  RATE_LIMITED: 'Too many requests. Please wait before trying again.',
  VALIDATION_ERROR: 'Validation error occurred',
  UNKNOWN_ERROR: 'An unknown error occurred',
} as const;

// Success Messages
export const SUCCESS_MESSAGES = {
  ANALYSIS_COMPLETE: 'Analysis completed successfully',
  TAB_CREATED: 'New tab created',
  TAB_CLOSED: 'Tab closed',
  TOOL_EXECUTED: 'Tool executed successfully',
} as const;

// Tool Categories
export const TOOL_CATEGORIES = {
  NAVIGATION: 'navigation',
  ANALYSIS: 'analysis',
  INTERACTION: 'interaction',
  DATA_EXTRACTION: 'data-extraction',
  AUTOMATION: 'automation',
  UTILITY: 'utility',
} as const;

// Default Values
export const DEFAULTS = {
  TAB_TITLE: 'New Tab',
  ANALYSIS_TIMEOUT: 30000, // 30 seconds
  DEBOUNCE_DELAY: 300, // 300ms
  MAX_TABS: 10,
  MAX_SUGGESTIONS: 5,
} as const;

// Validation Patterns
export const VALIDATION_PATTERNS = {
  URL: /^https?:\/\/.+/,
  EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  API_KEY: /^[a-zA-Z0-9_-]+$/,
} as const;

// Rate Limiting
export const RATE_LIMITS = {
  DEFAULT_WINDOW_MS: 15 * 60 * 1000, // 15 minutes
  DEFAULT_MAX_REQUESTS: 100,
  CLAUDE_API_MAX_REQUESTS: 50,
  CLAUDE_API_WINDOW_MS: 60 * 1000, // 1 minute
} as const;

// Security Headers
export const SECURITY_HEADERS = {
  CONTENT_SECURITY_POLICY: "default-src 'self'; script-src 'self' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; connect-src 'self' https://api.anthropic.com;",
  X_FRAME_OPTIONS: 'DENY',
  X_CONTENT_TYPE_OPTIONS: 'nosniff',
  REFERRER_POLICY: 'strict-origin-when-cross-origin',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  TABS: 'paste-browser-tabs',
  ACTIVE_TAB: 'paste-browser-active-tab',
  USER_PREFERENCES: 'paste-browser-preferences',
  API_KEY: 'paste-browser-api-key',
} as const;

// Component Classes
export const CSS_CLASSES = {
  CONTAINER: 'container mx-auto px-4',
  BUTTON_PRIMARY: 'bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded',
  BUTTON_SECONDARY: 'bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded',
  INPUT: 'shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline',
  CARD: 'bg-white shadow-md rounded-lg p-6',
  ERROR: 'text-red-500 text-sm',
  SUCCESS: 'text-green-500 text-sm',
} as const;

// Animation Durations
export const ANIMATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const; 