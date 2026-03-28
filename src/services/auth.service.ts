import { PublicClientApplication } from '@azure/msal-browser';
import type { AccountInfo, AuthenticationResult, SilentRequest } from '@azure/msal-browser';
import { appConfig } from '../config/app.config';
import type { AuthAccount } from '../types/auth.types';
import { StorageService } from './storage.service';

class AuthService {
  private msalInstance: PublicClientApplication | null = null;
  private initialized: boolean = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      this.msalInstance = new PublicClientApplication({
        auth: {
          clientId: appConfig.microsoft.clientId,
          authority: appConfig.microsoft.authority,
          redirectUri: window.location.origin + import.meta.env.BASE_URL,
        },
        cache: {
          cacheLocation: 'localStorage',
          storeAuthStateInCookie: true, // Better persistence on mobile PWAs
        },
        system: {
          loggerOptions: {
            logLevel: 3,
            loggerCallback: (_level: any, message: string, containsPii: boolean) => {
              if (!containsPii) {
                console.log('[MSAL]', message);
              }
            }
          }
        }
      });

      await this.msalInstance.initialize();
      this.initialized = true;
    } catch (error) {
      console.error('Failed to initialize MSAL:', error);
      throw new Error('Authentication initialization failed');
    }
  }

  async loginPopup(): Promise<AuthAccount> {
    if (!this.msalInstance) {
      throw new Error('Auth service not initialized');
    }

    // Standalone PWA can't open popups — use redirect flow instead
    if (this.shouldUseRedirect()) {
      await this.loginRedirect();
      // Page navigates away; this line is never reached
      throw new Error('Redirecting to login...');
    }

    try {
      const response: AuthenticationResult = await this.msalInstance.loginPopup({
        scopes: appConfig.microsoft.scopes,
        prompt: 'select_account',
      });

      return this.createAuthAccount(response);
    } catch (error: any) {
      // Popup blocked — fall back to redirect
      if (error?.errorCode === 'popup_window_error' ||
          error?.errorCode === 'empty_window_error' ||
          error?.errorCode === 'monitor_popup_timeout') {
        console.warn('[Auth] Popup blocked, falling back to redirect');
        await this.loginRedirect();
        throw new Error('Redirecting to login...');
      }
      console.error('Login failed:', error);
      throw new Error('Failed to sign in');
    }
  }

  async loginRedirect(): Promise<void> {
    if (!this.msalInstance) {
      throw new Error('Auth service not initialized');
    }

    try {
      await this.msalInstance.loginRedirect({
        scopes: appConfig.microsoft.scopes,
        prompt: 'select_account',
      });
    } catch (error) {
      console.error('Login redirect failed:', error);
      throw new Error('Failed to initiate sign in');
    }
  }

  async acquireTokenSilent(account: AccountInfo): Promise<string> {
    if (!this.msalInstance) {
      throw new Error('Auth service not initialized');
    }

    try {
      const request: SilentRequest = {
        scopes: appConfig.microsoft.scopes,
        account: account,
      };

      const response = await this.msalInstance.acquireTokenSilent(request);
      return response.accessToken;
    } catch (error) {
      console.error('Silent token acquisition failed:', error);

      // Standalone PWA can't open popups — use redirect for token refresh
      if (this.shouldUseRedirect()) {
        console.warn('[Auth] Silent refresh failed in PWA, falling back to redirect');
        await this.msalInstance.acquireTokenRedirect({
          scopes: appConfig.microsoft.scopes,
          account: account,
        });
        // Page navigates away
        throw new Error('Redirecting for token refresh...');
      }

      // Desktop: try interactive popup
      try {
        const response = await this.msalInstance.acquireTokenPopup({
          scopes: appConfig.microsoft.scopes,
          account: account,
        });
        return response.accessToken;
      } catch (popupError: any) {
        // Popup also failed — try redirect as last resort
        if (popupError?.errorCode === 'popup_window_error' ||
            popupError?.errorCode === 'empty_window_error') {
          console.warn('[Auth] Popup token refresh failed, falling back to redirect');
          await this.msalInstance.acquireTokenRedirect({
            scopes: appConfig.microsoft.scopes,
            account: account,
          });
          throw new Error('Redirecting for token refresh...');
        }
        console.error('Popup token acquisition failed:', popupError);
        throw new Error('Failed to refresh token');
      }
    }
  }

  async logout(accountId: string): Promise<void> {
    if (!this.msalInstance) {
      throw new Error('Auth service not initialized');
    }

    const accounts = this.msalInstance.getAllAccounts();
    const account = accounts.find(acc => acc.homeAccountId === accountId);

    if (account) {
      try {
        await this.msalInstance.logoutPopup({ account });
      } catch (error) {
        console.error('Logout failed:', error);
      }
    }

    // Remove from stored accounts
    const storedAccounts = StorageService.getAuthAccounts();
    const updatedAccounts = storedAccounts.filter(
      (acc: AuthAccount) => acc.homeAccountId !== accountId
    );
    StorageService.setAuthAccounts(updatedAccounts);
  }

  getAllAccounts(): AccountInfo[] {
    if (!this.msalInstance) return [];
    return this.msalInstance.getAllAccounts();
  }

  getAccountById(accountId: string): AccountInfo | null {
    const accounts = this.getAllAccounts();
    return accounts.find(acc => acc.homeAccountId === accountId) || null;
  }

  /**
   * Attempt silent SSO recovery when MSAL cache was cleared but session cookies
   * may still be valid (common on mobile PWA relaunch).
   */
  async trySsoSilent(loginHint: string): Promise<AuthenticationResult | null> {
    if (!this.msalInstance) return null;

    try {
      const response = await this.msalInstance.ssoSilent({
        scopes: appConfig.microsoft.scopes,
        loginHint,
      });
      return response;
    } catch {
      return null;
    }
  }

  private createAuthAccount(response: AuthenticationResult): AuthAccount {
    const account = response.account;
    if (!account) {
      throw new Error('No account in authentication response');
    }

    return {
      id: account.homeAccountId,
      username: account.username,
      name: account.name || account.username,
      email: account.username,
      accessToken: response.accessToken,
      refreshToken: '', // MSAL handles refresh tokens internally
      expiresOn: response.expiresOn?.getTime() || Date.now() + 3600000,
      homeAccountId: account.homeAccountId,
    };
  }

  async handleRedirectCallback(): Promise<AuthenticationResult | null> {
    if (!this.msalInstance) {
      throw new Error('Auth service not initialized');
    }

    try {
      const response = await this.msalInstance.handleRedirectPromise();
      if (response?.account) {
        // Save/update account from redirect result (login or token refresh)
        const account = this.createAuthAccount(response);
        this.saveAccount(account);
      }
      return response;
    } catch (error) {
      console.error('Redirect callback handling failed:', error);
      return null;
    }
  }

  isInitialized(): boolean {
    return this.initialized;
  }

  // Standalone PWA or mobile contexts where popups don't work reliably
  private shouldUseRedirect(): boolean {
    return window.matchMedia('(display-mode: standalone)').matches ||
           (window.navigator as any).standalone === true;
  }

  // Save account to storage
  saveAccount(account: AuthAccount): void {
    const accounts: AuthAccount[] = StorageService.getAuthAccounts();
    const existingIndex = accounts.findIndex(
      (acc: AuthAccount) => acc.homeAccountId === account.homeAccountId
    );

    if (existingIndex >= 0) {
      accounts[existingIndex] = account;
    } else {
      accounts.push(account);
    }

    StorageService.setAuthAccounts(accounts);
  }

  // Load accounts from storage
  loadAccounts(): AuthAccount[] {
    return StorageService.getAuthAccounts();
  }
}

export const authService = new AuthService();
