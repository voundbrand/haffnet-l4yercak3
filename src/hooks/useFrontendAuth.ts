/**
 * Frontend Authentication Hook
 *
 * Provides authentication methods and real-time session verification.
 * Uses Convex for real-time updates and session management.
 */

import { useConvex, useQuery } from 'convex/react';
import { api } from '@/../convex/_generated/api';
import { useFrontendAuthStore } from '@/stores/useFrontendAuthStore';
import { useEffect } from 'react';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface OAuthData {
  provider: string;
  oauthId: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export function useFrontendAuth() {
  const convex = useConvex();
  const { sessionToken, user, setUser, setSessionToken, logout: clearStore, setLoading } = useFrontendAuthStore();

  // Real-time session verification
  const sessionData = useQuery(
    api.frontendAuth.verifySession,
    sessionToken ? { sessionToken } : 'skip'
  );

  // Sync session data with store
  useEffect(() => {
    if (sessionData) {
      if (sessionData.valid && sessionData.user) {
        setUser(sessionData.user);
      } else if (!sessionData.valid) {
        // Session invalid, clear store
        clearStore();
      }
    }
  }, [sessionData, setUser, clearStore]);

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    try {
      const result = await convex.action(api.frontendAuth.loginWithPassword, credentials);

      if (result.success && result.sessionToken && result.user) {
        setSessionToken(result.sessionToken);
        setUser(result.user);
        return { success: true, user: result.user };
      }

      return {
        success: false,
        error: result.error || 'LOGIN_FAILED',
        message: result.message || 'Login failed',
      };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const register = async (data: RegisterData) => {
    setLoading(true);
    try {
      const result = await convex.action(api.frontendAuth.registerWithPassword, data);

      if (result.success && result.sessionToken && result.user) {
        setSessionToken(result.sessionToken);
        setUser(result.user);
        return { success: true, user: result.user };
      }

      return {
        success: false,
        error: result.error || 'REGISTRATION_FAILED',
        message: result.message || 'Registration failed',
      };
    } catch (error) {
      console.error('Registration error:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const verifyOAuth = async (data: OAuthData) => {
    setLoading(true);
    try {
      const result = await convex.action(api.frontendAuth.verifyOAuthToken, data);

      if (result.success && result.sessionToken && result.user) {
        setSessionToken(result.sessionToken);
        setUser(result.user);
        return { success: true, user: result.user };
      }

      return {
        success: false,
        error: 'OAUTH_FAILED',
        message: 'OAuth verification failed',
      };
    } catch (error) {
      console.error('OAuth error:', error);
      return {
        success: false,
        error: 'NETWORK_ERROR',
        message: 'Network error. Please try again.',
      };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    if (sessionToken) {
      try {
        await convex.action(api.frontendAuth.logout, { sessionToken });
      } catch (error) {
        console.error('Logout error:', error);
      }
    }
    clearStore();
  };

  return {
    user,
    sessionToken,
    isAuthenticated: !!sessionToken && sessionData?.valid === true,
    loading: useFrontendAuthStore((state) => state.loading),
    login,
    register,
    verifyOAuth,
    logout,
  };
}
