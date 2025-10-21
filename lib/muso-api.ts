/**
 * MUSO.AI API Client
 * Provides access to music industry data including artist credits, collaborations, and detailed music metadata
 */

import { envConfig } from './env-config'
import { musoCache, CACHE_TTL } from './muso-cache'

export interface MusoSearchParams {
  keyword: string
  type?: ('profile' | 'album' | 'track' | 'organization')[]
  childCredits?: string[]
  limit?: number
  offset?: number
  releaseDateEnd?: string
  releaseDateStart?: string
}

export interface MusoProfile {
  id: string;
  name: string;
  avatarUrl?: string;
  type: 'artist' | 'organization';
  bio?: string;
  city?: string;
  country?: string;
  creditCount: number;
  collaboratorsCount: number;
  spotifyId?: string;
  website?: string;
  facebook?: string;
  instagram?: string;
  twitter?: string;
  youtube?: string;
  popularity: number;
  verifiedArtist?: boolean;
  genres?: string[];
  labels?: string[];
  monthlyListeners?: number;
  totalStreams?: number;
  activeYears?: { start: number; end?: number };
}

export interface MusoCredit {
  id: string;
  title: string;
  role: string;
  album?: {
    title: string;
    releaseDate: string;
  };
  popularity: number;
}

export interface MusoCollaborator {
  id: string;
  name: string;
  avatarUrl?: string;
  collaborationsCount: number;
  lastCollaborationDate: string;
  popularity: number;
}

export interface MusoTrack {
  id: string
  title: string
  isrcs: string[]
  label?: string
  publisher?: string
  p_line?: string
  c_line?: string
  spotifyIds: string[]
  spotifyPreviewUrl?: string
  popularity: number
  key?: string
  duration: number
  releaseDate: string
  bpm?: number
  album: any
  artists: any[]
  credits: any[]
}

export interface MusoAlbum {
  id: string
  title: string
  upc?: string
  label?: string
  publisher?: string
  p_line?: string
  c_line?: string
  collaboratorsCount: number
  albumArt?: string
  popularity: number
  releaseDate: string
  trackCount: number
  artist: any[]
  tracks: any[]
}

export interface MusoSearchResult {
  profiles: {
    items: MusoProfile[]
    total: number
  }
  organizations: {
    items: any[]
    total: number
  }
  albums: {
    items: MusoAlbum[]
    total: number
  }
  tracks: {
    items: MusoTrack[]
    total: number
  }
}

export interface MusoRole {
  id: string
  name: string
  description?: string
}

class MusoAPIClient {
  private baseUrl = 'https://api.developer.muso.ai/v4';
  private apiKey: string;

  constructor() {
    this.apiKey = envConfig.musoApiKey;
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'x-api-key': this.apiKey,
        'Content-Type': 'application/json',
        ...options.headers,
      },
    };

    const response = await fetch(url, config);

    if (!response.ok) {
      throw new Error(`MUSO API Error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  }

  // Search across all entity types
  async search(params: MusoSearchParams): Promise<MusoSearchResult> {
    return musoCache.cached(
      'search',
      async () => {
        const response = await this.makeRequest<{ result: string; code: number; data: MusoSearchResult }>('/search', {
          method: 'POST',
          body: JSON.stringify({
            keyword: params.keyword,
            type: params.type || ['profile', 'album', 'track'],
            childCredits: params.childCredits,
            limit: Math.min(params.limit || 20, 50),
            offset: params.offset || 0,
            releaseDateEnd: params.releaseDateEnd,
            releaseDateStart: params.releaseDateStart,
          }),
        })
        return response.data
      },
      params,
      CACHE_TTL.MEDIUM
    )
  }

  // Search profiles by names
  async searchProfiles(names: string[], trackIds?: string[], spotifyTrackIds?: string[]): Promise<MusoProfile[]> {
    const params = { names, trackIds, spotifyTrackIds }
    return musoCache.cached(
      'searchProfiles',
      async () => {
        const queryParams = new URLSearchParams()
        names.forEach(name => queryParams.append('names', name))
        if (trackIds) trackIds.forEach(id => queryParams.append('trackIds', id))
        if (spotifyTrackIds) spotifyTrackIds.forEach(id => queryParams.append('spotifyTrackIds', id))

        const response = await this.makeRequest<{ result: string; code: number; data: MusoProfile[] }>(`/profiles/search?${queryParams}`)
        return response.data
      },
      params,
      CACHE_TTL.LONG // Profile data is more stable
    )
  }

  // Get profile details
  async getProfile(id: string, source: 'muso' | 'spotify' = 'muso'): Promise<MusoProfile> {
    const params = { id, source }
    return musoCache.cached(
      'getProfile',
      async () => {
        const response = await this.makeRequest<{ result: string; code: number; data: MusoProfile }>(`/profile/${id}?source=${source}`)
        return response.data
      },
      params,
      CACHE_TTL.LONG // Profile data is stable
    )
  }

  // Get profile credits
  async getProfileCredits(
    id: string,
    options: {
      keyword?: string
      credit?: string[]
      releaseDateStart?: string
      releaseDateEnd?: string
      offset?: number
      limit?: number
      sortKey?: 'releaseDate' | 'popularity' | 'title'
      sortDirection?: 'ASC' | 'DESC'
    } = {}
  ): Promise<{ items: any[]; limit: number; offset: number; totalCount: number }> {
    const params = { id, options }
    return musoCache.cached(
      'getProfileCredits',
      async () => {
        const queryParams = new URLSearchParams()
        if (options.keyword) queryParams.set('keyword', options.keyword)
        if (options.credit) options.credit.forEach(c => queryParams.append('credit', c))
        if (options.releaseDateStart) queryParams.set('releaseDateStart', options.releaseDateStart)
        if (options.releaseDateEnd) queryParams.set('releaseDateEnd', options.releaseDateEnd)
        queryParams.set('offset', (options.offset || 0).toString())
        queryParams.set('limit', Math.min(options.limit || 20, 50).toString())
        if (options.sortKey) queryParams.set('sortKey', options.sortKey)
        if (options.sortDirection) queryParams.set('sortDirection', options.sortDirection)

        const response = await this.makeRequest<{ result: string; code: number; data: any }>(`/profile/${id}/credits?${queryParams}`)
        return response.data
      },
      params,
      CACHE_TTL.MEDIUM // Credits can change but not frequently
    )
  }

  // Get profile collaborators
  async getProfileCollaborators(
    id: string,
    options: {
      keyword?: string
      sortKey?: 'collaborationsCount' | 'lastCollaborationDate' | 'name' | 'popularity'
      sortDirection?: 'ASC' | 'DESC'
      offset?: number
      limit?: number
      type?: 'artist' | 'organization'
    } = {}
  ): Promise<{ items: any[]; limit: number; offset: number; totalCount: number }> {
    const params = { id, options }
    return musoCache.cached(
      'getProfileCollaborators',
      async () => {
        const queryParams = new URLSearchParams()
        if (options.keyword) queryParams.set('keyword', options.keyword)
        queryParams.set('sortKey', options.sortKey || 'lastCollaborationDate')
        queryParams.set('sortDirection', options.sortDirection || 'DESC')
        queryParams.set('offset', (options.offset || 0).toString())
        queryParams.set('limit', Math.min(options.limit || 20, 50).toString())
        queryParams.set('type', options.type || 'artist')

        const response = await this.makeRequest<{ result: string; code: number; data: any }>(`/profile/${id}/collaborators?${queryParams}`)
        return response.data
      },
      params,
      CACHE_TTL.LONG // Collaborations are relatively stable
    )
  }

  // Get track details
  async getTrack(id: string, idType: 'id' | 'isrc' = 'id'): Promise<MusoTrack> {
    const params = { id, idType }
    return musoCache.cached(
      'getTrack',
      async () => {
        const response = await this.makeRequest<{ result: string; code: number; data: MusoTrack }>(`/track/${idType}/${id}`)
        return response.data
      },
      params,
      CACHE_TTL.VERY_LONG // Track data is very stable
    )
  }

  // Get album details
  async getAlbum(id: string, idType: 'id' | 'upc' = 'id'): Promise<MusoAlbum> {
    const params = { id, idType }
    return musoCache.cached(
      'getAlbum',
      async () => {
        const response = await this.makeRequest<{ result: string; code: number; data: MusoAlbum }>(`/album/${idType}/${id}`)
        return response.data
      },
      params,
      CACHE_TTL.VERY_LONG // Album data is very stable
    )
  }

  /**
   * Get available roles/credits
   */
  async getRoles(params?: {
    keyword?: string;
    offset?: number;
    limit?: number;
  }): Promise<{ result: string; code: number; data: any }> {
    return musoCache.cached(
      'getRoles',
      async () => {
        const queryParams = new URLSearchParams();
        
        if (params?.keyword) queryParams.append('keyword', params.keyword);
        if (params?.offset !== undefined) queryParams.append('offset', params.offset.toString());
        if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());

        const query = queryParams.toString();
        return this.makeRequest(`/roles${query ? `?${query}` : ''}`);
      },
      params || {},
      CACHE_TTL.VERY_LONG // Roles rarely change
    )
  }
}

// Export singleton instance
export const musoApi = new MusoAPIClient()
