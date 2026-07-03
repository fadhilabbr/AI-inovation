// API client with automatic token refresh mechanism
const baseUrl = process.env.NEXT_PUBLIC_API_URL || (
  typeof window !== 'undefined'
    ? `${window.location.protocol}//${window.location.hostname}:8000`
    : "http://127.0.0.1:8000"
);

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  user: {
    id: number;
    name: string;
    email: string;
    points: number;
    role: string;
  };
}

class ApiClient {
  private getTokens() {
    if (typeof window === 'undefined') return { accessToken: null, refreshToken: null };
    return {
      accessToken: localStorage.getItem('smartbin_token'),
      refreshToken: localStorage.getItem('smartbin_refresh_token'),
    };
  }

  private setTokens(accessToken: string, refreshToken: string) {
    if (typeof window === 'undefined') return;
    localStorage.setItem('smartbin_token', accessToken);
    localStorage.setItem('smartbin_refresh_token', refreshToken);
  }

  private clearTokens() {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('smartbin_token');
    localStorage.removeItem('smartbin_refresh_token');
    localStorage.removeItem('smartbin_user');
  }

  async refreshAccessToken(): Promise<string | null> {
    try {
      const { refreshToken } = this.getTokens();
      if (!refreshToken) return null;

      const response = await fetch(`${baseUrl}/api/v1/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) {
        this.clearTokens();
        return null;
      }

      const data: TokenResponse = await response.json();
      this.setTokens(data.access_token, data.refresh_token);
      return data.access_token;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
      return null;
    }
  }

  async fetch(url: string, options: RequestInit = {}): Promise<Response> {
    const { accessToken } = this.getTokens();
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }

    let response = await fetch(`${baseUrl}${url}`, {
      ...options,
      headers,
      cache: 'no-store',
    });

    // If unauthorized, try to refresh token
    if (response.status === 401 && accessToken) {
      const newAccessToken = await this.refreshAccessToken();
      if (newAccessToken) {
        headers['Authorization'] = `Bearer ${newAccessToken}`;
        response = await fetch(`${baseUrl}${url}`, {
          ...options,
          headers,
          cache: 'no-store',
        });
      } else {
        // Refresh failed, redirect to login
        if (typeof window !== 'undefined') {
          window.location.href = '/login';
        }
      }
    }

    return response;
  }
}

export const apiClient = new ApiClient();
