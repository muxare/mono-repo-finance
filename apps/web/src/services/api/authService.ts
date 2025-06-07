/**
 * Authentication API Service - Handles authentication and authorization
 */

import type { RequestOptions, AuthToken } from '../../types/ApiTypes';
import { httpClient } from './httpClient';
import { AUTH_CONFIG } from './config';

export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: number;
  user: {
    id: string;
    email: string;
    name: string;
    role: string;
    preferences?: Record<string, any>;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  acceptTerms: boolean;
}

export class AuthApiService {
  private storageKey = 'auth_token';

  /**
   * Login with email and password
   */
  async login(
    request: LoginRequest,
    options: RequestOptions = {}
  ): Promise<LoginResponse> {
    const requestOptions: RequestOptions = {
      auth: false, // Don't add auth header for login
      ...options
    };

    const response = await httpClient.post<LoginResponse>(
      AUTH_CONFIG.loginEndpoint,
      request,
      requestOptions
    );

    // Store the token
    const authToken: AuthToken = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenType: response.tokenType,
      expiresIn: response.expiresIn,
      expiresAt: Date.now() + (response.expiresIn * 1000)
    };

    this.storeAuthToken(authToken);
    httpClient.setAuthToken(authToken);

    return response;
  }

  /**
   * Register a new user account
   */
  async register(
    request: RegisterRequest,
    options: RequestOptions = {}
  ): Promise<LoginResponse> {
    const requestOptions: RequestOptions = {
      auth: false, // Don't add auth header for registration
      ...options
    };

    const response = await httpClient.post<LoginResponse>(
      '/auth/register',
      request,
      requestOptions
    );

    // Store the token
    const authToken: AuthToken = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenType: response.tokenType,
      expiresIn: response.expiresIn,
      expiresAt: Date.now() + (response.expiresIn * 1000)
    };

    this.storeAuthToken(authToken);
    httpClient.setAuthToken(authToken);

    return response;
  }

  /**
   * Refresh the authentication token
   */
  async refreshToken(
    refreshToken?: string,
    options: RequestOptions = {}
  ): Promise<AuthToken> {
    const tokenToUse = refreshToken || this.getStoredToken()?.refreshToken;
    
    if (!tokenToUse) {
      throw new Error('No refresh token available');
    }

    const requestOptions: RequestOptions = {
      auth: false, // Don't add auth header for refresh
      ...options
    };

    const response = await httpClient.post<{
      accessToken: string;
      refreshToken: string;
      tokenType: string;
      expiresIn: number;
    }>(
      AUTH_CONFIG.refreshEndpoint,
      { refreshToken: tokenToUse },
      requestOptions
    );

    const authToken: AuthToken = {
      accessToken: response.accessToken,
      refreshToken: response.refreshToken,
      tokenType: response.tokenType,
      expiresIn: response.expiresIn,
      expiresAt: Date.now() + (response.expiresIn * 1000)
    };

    this.storeAuthToken(authToken);
    httpClient.setAuthToken(authToken);

    return authToken;
  }

  /**
   * Logout and clear authentication
   */
  async logout(options: RequestOptions = {}): Promise<void> {
    try {
      await httpClient.post(AUTH_CONFIG.logoutEndpoint, {}, options);
    } catch (error) {
      // Continue with logout even if server call fails
      console.warn('Logout server call failed:', error);
    } finally {
      this.clearAuthToken();
      httpClient.clearAuthToken();
    }
  }

  /**
   * Check if user is currently authenticated
   */
  isAuthenticated(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;

    // Check if token is expired
    if (Date.now() >= token.expiresAt) {
      this.clearAuthToken();
      return false;
    }

    return true;
  }

  /**
   * Check if token needs refresh (within threshold)
   */
  needsRefresh(): boolean {
    const token = this.getStoredToken();
    if (!token) return false;

    const refreshThreshold = 5 * 60 * 1000; // 5 minutes in milliseconds
    return Date.now() >= (token.expiresAt - refreshThreshold);
  }

  /**
   * Get current user information from token
   */
  getCurrentUser(): LoginResponse['user'] | null {
    // This would typically decode the JWT token or make an API call
    // For now, we'll return null and implement this when backend supports it
    return null;
  }

  /**
   * Get stored authentication token
   */
  getStoredToken(): AuthToken | null {
    const storage = this.getStorage();
    const tokenData = storage.getItem(this.storageKey);
    
    if (!tokenData) return null;

    try {
      return JSON.parse(tokenData);
    } catch {
      // Invalid token data, remove it
      this.clearAuthToken();
      return null;
    }
  }

  /**
   * Verify token with server
   */
  async verifyToken(options: RequestOptions = {}): Promise<boolean> {
    try {
      await httpClient.get('/auth/verify', options);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Get user permissions
   */
  async getPermissions(options: RequestOptions = {}): Promise<string[]> {
    const response = await httpClient.get<{ permissions: string[] }>(
      '/auth/permissions',
      options
    );
    return response.permissions;
  }

  /**
   * Change user password
   */
  async changePassword(
    currentPassword: string,
    newPassword: string,
    options: RequestOptions = {}
  ): Promise<void> {
    await httpClient.post(
      '/auth/change-password',
      { currentPassword, newPassword },
      options
    );
  }

  /**
   * Request password reset
   */
  async requestPasswordReset(
    email: string,
    options: RequestOptions = {}
  ): Promise<void> {
    const requestOptions: RequestOptions = {
      auth: false, // Don't add auth header for password reset
      ...options
    };

    await httpClient.post(
      '/auth/forgot-password',
      { email },
      requestOptions
    );
  }

  /**
   * Reset password with token
   */
  async resetPassword(
    token: string,
    newPassword: string,
    options: RequestOptions = {}
  ): Promise<void> {
    const requestOptions: RequestOptions = {
      auth: false, // Don't add auth header for password reset
      ...options
    };

    await httpClient.post(
      '/auth/reset-password',
      { token, password: newPassword },
      requestOptions
    );
  }

  /**
   * Initialize authentication on app start
   */
  async initialize(): Promise<void> {
    const token = this.getStoredToken();
    if (!token) return;

    // Set token in HTTP client
    httpClient.setAuthToken(token);

    // Check if token needs refresh
    if (this.needsRefresh() && token.refreshToken) {
      try {
        await this.refreshToken();
      } catch (error) {
        console.warn('Token refresh failed during initialization:', error);
        this.clearAuthToken();
      }
    }
  }

  // Private methods
  private storeAuthToken(token: AuthToken): void {
    const storage = this.getStorage();
    storage.setItem(this.storageKey, JSON.stringify(token));
  }

  private clearAuthToken(): void {
    const storage = this.getStorage();
    storage.removeItem(this.storageKey);
  }

  private getStorage(): Storage {
    switch (AUTH_CONFIG.tokenStorage) {
      case 'sessionStorage':
        return sessionStorage;
      case 'localStorage':
      default:
        return localStorage;
    }
  }
}

// Export singleton instance
export const authApiService = new AuthApiService();
