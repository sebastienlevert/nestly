import React, { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react';
import { authService } from '../services/auth.service';
import type { AuthAccount, AuthContextType } from '../types/auth.types';
import { StorageService } from '../services/storage.service';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [accounts, setAccounts] = useState<AuthAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const accountsRef = useRef<AuthAccount[]>([]);

  // Keep ref in sync so callbacks always see latest accounts
  accountsRef.current = accounts;

  useEffect(() => {
    initializeAuth();
  }, []);

  // Silently refresh tokens for a list of accounts, returning updated accounts
  const refreshAccountTokens = async (validAccounts: AuthAccount[]): Promise<AuthAccount[]> => {
    const refreshed: AuthAccount[] = [];

    for (const stored of validAccounts) {
      const msalAccount = authService.getAccountById(stored.homeAccountId);
      if (!msalAccount) {
        // MSAL no longer knows this account — skip it
        continue;
      }

      try {
        const newToken = await authService.acquireTokenSilent(msalAccount);
        refreshed.push({
          ...stored,
          accessToken: newToken,
          expiresOn: Date.now() + 3600000, // 1 hour
        });
      } catch {
        // Silent + popup both failed — keep account but with stale token
        // (it will be refreshed lazily on next API call, or user re-signs in)
        console.warn(`Token refresh failed for ${stored.username}, keeping account`);
        refreshed.push(stored);
      }
    }

    return refreshed;
  };

  const initializeAuth = async () => {
    try {
      setIsLoading(true);
      await authService.initialize();

      // Handle any pending redirect (e.g. from loginRedirect)
      await authService.handleRedirectCallback();

      // Load accounts from storage
      const storedAccounts = authService.loadAccounts();

      // Validate stored accounts against MSAL's cache
      const msalAccounts = authService.getAllAccounts();
      const validAccounts = storedAccounts.filter((stored) =>
        msalAccounts.some((msal) => msal.homeAccountId === stored.homeAccountId)
      );

      if (validAccounts.length > 0) {
        // Show accounts immediately so the user sees the authenticated UI
        setAccounts(validAccounts);

        // Silently refresh tokens in background
        const refreshedAccounts = await refreshAccountTokens(validAccounts);
        setAccounts(refreshedAccounts);
        StorageService.setAuthAccounts(refreshedAccounts);
      } else if (storedAccounts.length > 0) {
        // All stored accounts were invalid — clear storage
        StorageService.setAuthAccounts([]);
      }

    } catch (err) {
      console.error('Auth initialization failed:', err);
      setError('Failed to initialize authentication');
    } finally {
      setIsLoading(false);
    }
  };

  // Refresh tokens when the app returns to foreground
  const handleVisibilityChange = useCallback(async () => {
    if (document.visibilityState !== 'visible') return;
    const current = accountsRef.current;
    if (current.length === 0) return;

    // Only refresh if any token is expired or close to expiring (within 10 min)
    const needsRefresh = current.some(acc => acc.expiresOn - Date.now() < 600000);
    if (!needsRefresh) return;

    console.log('[Auth] App resumed, refreshing tokens...');
    try {
      const refreshed = await refreshAccountTokens(current);
      setAccounts(refreshed);
      StorageService.setAuthAccounts(refreshed);
    } catch (err) {
      console.warn('[Auth] Background token refresh failed:', err);
    }
  }, []);

  useEffect(() => {
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [handleVisibilityChange]);

  const addAccount = async () => {
    try {
      setError(null);
      const newAccount = await authService.loginPopup();
      authService.saveAccount(newAccount);
      const updatedAccounts = authService.loadAccounts();
      setAccounts(updatedAccounts);
    } catch (err) {
      console.error('Failed to add account:', err);
      setError('Failed to sign in. Please try again.');
      throw err;
    }
  };

  const removeAccount = async (accountId: string) => {
    try {
      setIsLoading(true);
      await authService.logout(accountId);

      const updatedAccounts = accounts.filter((acc) => acc.homeAccountId !== accountId);
      setAccounts(updatedAccounts);
    } catch (err) {
      console.error('Failed to remove account:', err);
      setError('Failed to sign out. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshToken = async (accountId: string): Promise<string> => {
    const msalAccount = authService.getAccountById(accountId);
    if (!msalAccount) {
      throw new Error('Account not found');
    }

    try {
      const newToken = await authService.acquireTokenSilent(msalAccount);

      // Update stored account with new token
      const updatedAccounts = accounts.map((acc) => {
        if (acc.homeAccountId === accountId) {
          return {
            ...acc,
            accessToken: newToken,
            expiresOn: Date.now() + 3600000, // 1 hour
          };
        }
        return acc;
      });

      setAccounts(updatedAccounts);
      StorageService.setAuthAccounts(updatedAccounts);

      return newToken;
    } catch (err) {
      console.error('Failed to refresh token:', err);
      throw new Error('Failed to refresh authentication token');
    }
  };

  const getAccessToken = async (accountId: string): Promise<string> => {
    const account = accounts.find((acc) => acc.homeAccountId === accountId);
    if (!account) {
      throw new Error('Account not found');
    }

    // Check if token is expired or about to expire (within 5 minutes)
    const expiresIn = account.expiresOn - Date.now();
    if (expiresIn < 300000) {
      // 5 minutes
      return refreshToken(accountId);
    }

    return account.accessToken;
  };

  const reloadAccounts = () => {
    console.log('AuthContext: Reloading accounts from storage...');
    const storedAccounts = authService.loadAccounts();
    console.log('AuthContext: Loaded accounts:', storedAccounts);
    setAccounts(storedAccounts);
  };

  const value: AuthContextType = {
    accounts,
    isAuthenticated: accounts.length > 0,
    isLoading,
    error,
    addAccount,
    removeAccount,
    refreshToken,
    getAccessToken,
    reloadAccounts,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
