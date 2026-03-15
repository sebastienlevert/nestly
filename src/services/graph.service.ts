import { appConfig } from '../config/app.config';

export class GraphService {
  private baseUrl: string;

  constructor(baseUrl: string = appConfig.graph.baseUrl) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    accessToken: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;

    const headers = new Headers(options.headers);
    headers.set('Authorization', `Bearer ${accessToken}`);
    headers.set('Content-Type', 'application/json');

    // Set timezone preference for date/time responses
    const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    headers.set('Prefer', `outlook.timezone="${userTimeZone}"`);

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`
        );
      }

      // Handle no content responses
      if (response.status === 204) {
        return {} as T;
      }

      return await response.json();
    } catch (error) {
      console.error('Graph API request failed:', error);
      throw error;
    }
  }

  async get<T>(endpoint: string, accessToken: string): Promise<T> {
    return this.request<T>(endpoint, accessToken, { method: 'GET' });
  }

  // Follow @odata.nextLink to get all pages of results
  async getAll(endpoint: string, accessToken: string): Promise<{ value: any[] }> {
    const allValues: any[] = [];
    const firstPage: any = await this.get(endpoint, accessToken);
    allValues.push(...(firstPage.value || []));

    let nextLink: string | undefined = firstPage['@odata.nextLink'];
    while (nextLink) {
      const userTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
      const response = await fetch(nextLink, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': `outlook.timezone="${userTimeZone}"`,
        },
      });
      if (!response.ok) break;
      const data = await response.json();
      allValues.push(...(data.value || []));
      nextLink = data['@odata.nextLink'];
    }

    return { value: allValues };
  }

  async post<T>(endpoint: string, accessToken: string, body: any): Promise<T> {
    return this.request<T>(endpoint, accessToken, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async patch<T>(endpoint: string, accessToken: string, body: any): Promise<T> {
    return this.request<T>(endpoint, accessToken, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  async delete(endpoint: string, accessToken: string): Promise<void> {
    await this.request(endpoint, accessToken, { method: 'DELETE' });
  }

  async put<T>(endpoint: string, accessToken: string, body: any): Promise<T> {
    return this.request<T>(endpoint, accessToken, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  // OneDrive file operations (read/write JSON by path)
  async getFileByPath<T>(path: string, accessToken: string): Promise<T> {
    // Download file content from OneDrive by path
    const url = `${this.baseUrl}/me/drive/root:${path}:/content`;
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` },
    });
    if (!response.ok) {
      if (response.status === 404) throw new Error('FILE_NOT_FOUND');
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  async putFileByPath<T>(path: string, accessToken: string, content: any): Promise<T> {
    // Upload/overwrite file content on OneDrive by path
    const url = `${this.baseUrl}/me/drive/root:${path}:/content`;
    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(content),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    return response.json();
  }

  // User operations
  async getMe(accessToken: string) {
    return this.get('/me', accessToken);
  }

  // Calendar operations
  async getCalendars(accessToken: string) {
    return this.get('/me/calendars', accessToken);
  }

  async getCalendar(calendarId: string, accessToken: string) {
    return this.get(`/me/calendars/${calendarId}`, accessToken);
  }

  async getEvents(calendarId: string, accessToken: string, startDateTime?: string, endDateTime?: string) {
    let endpoint = `/me/calendars/${calendarId}/events`;

    const params = new URLSearchParams();
    if (startDateTime && endDateTime) {
      params.append('$filter', `start/dateTime ge '${startDateTime}' and end/dateTime le '${endDateTime}'`);
    }
    params.append('$orderby', 'start/dateTime');
    params.append('$top', '100');

    const queryString = params.toString();
    if (queryString) {
      endpoint += `?${queryString}`;
    }

    return this.get(endpoint, accessToken);
  }

  async getCalendarView(accessToken: string, startDateTime: string, endDateTime: string) {
    const params = new URLSearchParams({
      startDateTime,
      endDateTime,
      $orderby: 'start/dateTime',
      $top: '100',
    });

    return this.getAll(`/me/calendarview?${params.toString()}`, accessToken);
  }

  async getCalendarViewForCalendar(calendarId: string, accessToken: string, startDateTime: string, endDateTime: string) {
    const params = new URLSearchParams({
      startDateTime,
      endDateTime,
      $orderby: 'start/dateTime',
      $top: '100',
    });

    return this.getAll(`/me/calendars/${calendarId}/calendarview?${params.toString()}`, accessToken);
  }

  async createEvent(calendarId: string, accessToken: string, event: any) {
    return this.post(`/me/calendars/${calendarId}/events`, accessToken, event);
  }

  async updateEvent(eventId: string, accessToken: string, updates: any) {
    return this.patch(`/me/events/${eventId}`, accessToken, updates);
  }

  async deleteEvent(eventId: string, accessToken: string) {
    return this.delete(`/me/events/${eventId}`, accessToken);
  }

  // OneDrive operations
  async getDriveRoot(accessToken: string) {
    return this.get('/me/drive/root', accessToken);
  }

  async getFolderChildren(folderId: string, accessToken: string) {
    return this.get(`/me/drive/items/${folderId}/children`, accessToken);
  }

  async getFolderChildrenWithLocation(folderId: string, accessToken: string) {
    return this.get(
      `/me/drive/items/${folderId}/children?$select=id,name,file,folder,location,photo,size&$expand=thumbnails`,
      accessToken
    );
  }

  async getDriveItemsByPath(path: string, accessToken: string) {
    return this.get(`/me/drive/root:${path}:/children`, accessToken);
  }

  async getImageThumbnails(itemId: string, accessToken: string) {
    return this.get(`/me/drive/items/${itemId}/thumbnails`, accessToken);
  }

  async getImageContent(itemId: string, accessToken: string): Promise<Blob> {
    const url = `${this.baseUrl}/me/drive/items/${itemId}/content`;

    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${response.statusText}`);
    }

    return response.blob();
  }

  // Batch requests (for efficiency)
  async batchRequest(requests: any[], accessToken: string) {
    return this.post('/$batch', accessToken, {
      requests,
    });
  }
}

export const graphService = new GraphService();
