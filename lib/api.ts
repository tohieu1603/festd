import type { AuthTokens, LoginCredentials, ApiError } from './types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';

// Token management
const TOKEN_KEY = 'access_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(tokens: AuthTokens): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, tokens.access);
  localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refresh);
}

export function clearTokens(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// API Client
interface RequestOptions extends RequestInit {
  token?: string;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { token, ...fetchOptions } = options;

    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    // Add authentication token
    const accessToken = token || getAccessToken();
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    const config: RequestInit = {
      ...fetchOptions,
      headers,
    };

    try {
      const response = await fetch(`${this.baseURL}${endpoint}`, config);

      // Handle 401 - Unauthorized (token expired)
      if (response.status === 401) {
        const refreshToken = getRefreshToken();
        if (refreshToken) {
          // Try to refresh token
          const newTokens = await this.refreshAccessToken(refreshToken);
          if (newTokens) {
            setTokens(newTokens);
            // Retry the original request with new token
            headers['Authorization'] = `Bearer ${newTokens.access}`;
            const retryResponse = await fetch(`${this.baseURL}${endpoint}`, config);
            if (!retryResponse.ok) {
              throw await this.handleError(retryResponse);
            }
            return await retryResponse.json();
          }
        }
        // If refresh fails, clear tokens and redirect to login
        clearTokens();
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
        throw new Error('Authentication required');
      }

      if (!response.ok) {
        throw await this.handleError(response);
      }

      // Handle 204 No Content
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Network error');
    }
  }

  private async handleError(response: Response): Promise<ApiError> {
    let message = 'An error occurred';
    let errors: Record<string, string[]> | undefined;

    try {
      const text = await response.text();
      console.error('Raw error response:', text);

      // Try to parse as JSON
      try {
        const data = JSON.parse(text);
        message = data.detail || data.message || message;
        errors = data.errors || data;
      } catch {
        // Not JSON, use the text as message
        message = text || response.statusText || message;
      }
    } catch (e) {
      console.error('Failed to read error response:', e);
      message = response.statusText || message;
    }

    return { message, errors };
  }

  private async refreshAccessToken(
    refreshToken: string
  ): Promise<AuthTokens | null> {
    try {
      const response = await fetch(`${this.baseURL}/auth/token/refresh/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refresh: refreshToken }),
      });

      if (!response.ok) return null;

      const data = await response.json();
      return {
        access: data.access,
        refresh: refreshToken,
      };
    } catch {
      return null;
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' });
  }

  async post<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async patch<T>(
    endpoint: string,
    data?: unknown,
    options?: RequestOptions
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' });
  }

  // Authentication endpoints
  async login(credentials: LoginCredentials): Promise<AuthTokens> {
    const response = await this.post<{
      success: boolean;
      token: string;
      message: string;
      user: any;
    }>('/auth/login', credentials);

    // Convert backend response to frontend format
    const tokens: AuthTokens = {
      access: response.token,
      refresh: response.token, // Backend uses single token, use same for refresh
    };
    setTokens(tokens);
    return tokens;
  }

  async logout(): Promise<void> {
    clearTokens();
  }
}

// Export singleton instance
export const api = new ApiClient(API_BASE_URL);

// Export helper for building query strings
export function buildQueryString(
  params: Record<string, string | number | boolean | undefined>
): string {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.append(key, String(value));
    }
  });

  const queryString = searchParams.toString();
  return queryString ? `?${queryString}` : '';
}
