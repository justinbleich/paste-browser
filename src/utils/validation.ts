import { VALIDATION_PATTERNS, ERROR_MESSAGES } from './constants';
import type { ValidationResult } from '@/types';

/**
 * Validates a URL string
 */
export function validateUrl(url: string): ValidationResult {
  const errors: string[] = [];

  if (!url || url.trim().length === 0) {
    errors.push('URL is required');
  } else if (!VALIDATION_PATTERNS.URL.test(url.trim())) {
    errors.push(ERROR_MESSAGES.INVALID_URL);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an email address
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email || email.trim().length === 0) {
    errors.push('Email is required');
  } else if (!VALIDATION_PATTERNS.EMAIL.test(email.trim())) {
    errors.push('Please enter a valid email address');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates an API key format
 */
export function validateApiKey(apiKey: string): ValidationResult {
  const errors: string[] = [];

  if (!apiKey || apiKey.trim().length === 0) {
    errors.push('API key is required');
  } else if (apiKey.trim().length < 10) {
    errors.push('API key must be at least 10 characters long');
  } else if (!VALIDATION_PATTERNS.API_KEY.test(apiKey.trim())) {
    errors.push('API key contains invalid characters');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates environment variables
 */
export function validateEnvironmentVariables(env: Record<string, string | undefined>): ValidationResult {
  const errors: string[] = [];
  const required = ['ANTHROPIC_API_KEY'];

  for (const key of required) {
    if (!env[key]) {
      errors.push(`Missing required environment variable: ${key}`);
    }
  }

  // Validate API key format if present
  if (env.ANTHROPIC_API_KEY) {
    const apiKeyValidation = validateApiKey(env.ANTHROPIC_API_KEY);
    if (!apiKeyValidation.isValid) {
      errors.push(...apiKeyValidation.errors.map(error => `ANTHROPIC_API_KEY: ${error}`));
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Sanitizes a URL by trimming whitespace and ensuring protocol
 */
export function sanitizeUrl(url: string): string {
  const trimmed = url.trim();
  
  if (!trimmed) return '';
  
  // Add https:// if no protocol is specified
  if (!/^https?:\/\//.test(trimmed)) {
    return `https://${trimmed}`;
  }
  
  return trimmed;
}

/**
 * Validates and sanitizes form data
 */
export function validateAndSanitizeFormData<T extends Record<string, any>>(
  data: T,
  validators: Record<keyof T, (value: any) => ValidationResult>
): { isValid: boolean; errors: Record<keyof T, string[]>; sanitizedData: T } {
  const errors: Record<keyof T, string[]> = {} as Record<keyof T, string[]>;
  const sanitizedData: T = { ...data };
  let isValid = true;

  for (const [key, validator] of Object.entries(validators)) {
    const result = validator(data[key]);
    if (!result.isValid) {
      errors[key as keyof T] = result.errors;
      isValid = false;
    }
  }

  return { isValid, errors, sanitizedData };
}

/**
 * Debounce function for input validation
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Validates a tab object
 */
export function validateTab(tab: any): ValidationResult {
  const errors: string[] = [];

  if (!tab) {
    errors.push('Tab object is required');
    return { isValid: false, errors };
  }

  if (!tab.id || typeof tab.id !== 'string') {
    errors.push('Tab must have a valid ID');
  }

  if (!tab.title || typeof tab.title !== 'string') {
    errors.push('Tab must have a valid title');
  }

  if (!tab.url || typeof tab.url !== 'string') {
    errors.push('Tab must have a valid URL');
  } else {
    const urlValidation = validateUrl(tab.url);
    if (!urlValidation.isValid) {
      errors.push(...urlValidation.errors);
    }
  }

  if (typeof tab.isActive !== 'boolean') {
    errors.push('Tab isActive must be a boolean');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}

/**
 * Validates a tool object
 */
export function validateTool(tool: any): ValidationResult {
  const errors: string[] = [];

  if (!tool) {
    errors.push('Tool object is required');
    return { isValid: false, errors };
  }

  if (!tool.id || typeof tool.id !== 'string') {
    errors.push('Tool must have a valid ID');
  }

  if (!tool.name || typeof tool.name !== 'string') {
    errors.push('Tool must have a valid name');
  }

  if (!tool.description || typeof tool.description !== 'string') {
    errors.push('Tool must have a valid description');
  }

  if (!tool.category || typeof tool.category !== 'string') {
    errors.push('Tool must have a valid category');
  }

  if (!tool.action || typeof tool.action !== 'string') {
    errors.push('Tool must have a valid action');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
} 