import axios, { AxiosInstance, AxiosResponse, AxiosError, InternalAxiosRequestConfig } from 'axios';
import type { 
  ApiResponse, 
  ClaudeAnalysisRequest, 
  ClaudeAnalysisResponse,
  ApiClientConfig 
} from '@/types';
import { API_ENDPOINTS, ERROR_MESSAGES, HTTP_STATUS } from '@/utils/constants';

// Extend axios config to include metadata
interface ExtendedAxiosRequestConfig extends InternalAxiosRequestConfig {
  metadata?: {
    startTime: Date;
  };
}

class ApiClient {
  private client: AxiosInstance;

  constructor(config?: Partial<ApiClientConfig>) {
    const defaultConfig: ApiClientConfig = {
      baseURL: process.env.NODE_ENV === 'production' 
        ? process.env.NEXT_PUBLIC_API_URL || ''
        : '',
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    const finalConfig = { ...defaultConfig, ...config };

    this.client = axios.create({
      baseURL: finalConfig.baseURL,
      timeout: finalConfig.timeout,
      headers: finalConfig.headers,
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config: ExtendedAxiosRequestConfig) => {
        // Add timestamp for debugging
        config.metadata = { startTime: new Date() };
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`);
        }
        
        return config;
      },
      (error) => {
        console.error('❌ Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response: AxiosResponse) => {
        const config = response.config as ExtendedAxiosRequestConfig;
        const duration = config.metadata?.startTime 
          ? new Date().getTime() - config.metadata.startTime.getTime()
          : 0;
        
        if (process.env.NODE_ENV === 'development') {
          console.log(`✅ API Response: ${config.method?.toUpperCase()} ${config.url} (${duration}ms)`);
        }
        
        return response;
      },
      (error: AxiosError) => {
        const config = error.config as ExtendedAxiosRequestConfig;
        const duration = config?.metadata?.startTime 
          ? new Date().getTime() - config.metadata.startTime.getTime()
          : 0;
        
        console.error(`❌ API Error: ${config?.method?.toUpperCase()} ${config?.url} (${duration}ms)`, {
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data,
        });
        
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: AxiosError): Error {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const data = error.response.data as any;
      
      switch (status) {
        case HTTP_STATUS.BAD_REQUEST:
          return new Error(data?.message || ERROR_MESSAGES.VALIDATION_ERROR);
        case HTTP_STATUS.UNAUTHORIZED:
          return new Error(ERROR_MESSAGES.UNAUTHORIZED);
        case HTTP_STATUS.NOT_FOUND:
          return new Error('Resource not found');
        case HTTP_STATUS.INTERNAL_SERVER_ERROR:
          return new Error(ERROR_MESSAGES.SERVER_ERROR);
        case HTTP_STATUS.SERVICE_UNAVAILABLE:
          return new Error('Service temporarily unavailable');
        default:
          return new Error(data?.message || ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    } else if (error.request) {
      // Network error
      return new Error(ERROR_MESSAGES.NETWORK_ERROR);
    } else {
      // Request setup error
      return new Error(error.message || ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }

  private async makeRequest<T>(
    method: 'get' | 'post' | 'put' | 'delete',
    url: string,
    data?: any
  ): Promise<T> {
    try {
      const response = await this.client[method]<ApiResponse<T>>(url, data);
      
      if (response.data.success) {
        return response.data.data as T;
      } else {
        throw new Error(response.data.error || ERROR_MESSAGES.UNKNOWN_ERROR);
      }
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(ERROR_MESSAGES.UNKNOWN_ERROR);
    }
  }

  // Claude API methods
  async analyzeUrl(request: ClaudeAnalysisRequest): Promise<ClaudeAnalysisResponse> {
    return this.makeRequest<ClaudeAnalysisResponse>(
      'post',
      API_ENDPOINTS.CLAUDE_ANALYZE,
      request
    );
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.makeRequest<{ status: string; timestamp: string }>(
      'get',
      API_ENDPOINTS.HEALTH
    );
  }

  // MCP methods
  async getMCPServers(): Promise<any[]> {
    return this.makeRequest<any[]>('get', API_ENDPOINTS.MCP_SERVERS);
  }

  async getMCPTools(serverId?: string): Promise<any[]> {
    const url = serverId 
      ? `${API_ENDPOINTS.MCP_TOOLS}?serverId=${serverId}`
      : API_ENDPOINTS.MCP_TOOLS;
    return this.makeRequest<any[]>('get', url);
  }

  // Generic methods for extensibility
  async get<T>(url: string): Promise<T> {
    return this.makeRequest<T>('get', url);
  }

  async post<T>(url: string, data?: any): Promise<T> {
    return this.makeRequest<T>('post', url, data);
  }

  async put<T>(url: string, data?: any): Promise<T> {
    return this.makeRequest<T>('put', url, data);
  }

  async delete<T>(url: string): Promise<T> {
    return this.makeRequest<T>('delete', url);
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Export the class for testing or custom instances
export { ApiClient };

// Export convenience methods
export const claudeApi = {
  analyzeUrl: (request: ClaudeAnalysisRequest) => apiClient.analyzeUrl(request),
};

export const healthApi = {
  check: () => apiClient.healthCheck(),
};

export const mcpApi = {
  getServers: () => apiClient.getMCPServers(),
  getTools: (serverId?: string) => apiClient.getMCPTools(serverId),
}; 