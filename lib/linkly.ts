// Linkly API configuration and helper functions
export const LINKLY_CONFIG = {
  apiKey: 'IaqyALsaDgDPuSfumiAs/g==',
  workspaceId: 316098,
  baseUrl: 'https://app.linklyhq.com/api/v1',
  email: process.env.LINKLY_EMAIL || '', // You'll need to add your Linkly email to .env
};

export interface LinklyLink {
  id?: number;
  url: string;
  name?: string;
  note?: string;
  enabled?: boolean;
  domain?: string;
  slug?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_term?: string;
  utm_content?: string;
  og_title?: string;
  og_description?: string;
  og_image?: string;
  expiry_datetime?: string;
  expiry_destination?: string;
  rules?: Array<{
    what: 'rotator' | 'country' | 'platform';
    url: string;
    percentage?: string;
    matches?: string;
  }>;
}

export interface LinklyResponse {
  id: number;
  url: string;
  name: string;
  note: string;
  enabled: boolean;
  full_url: string;
  workspace_id: number;
  [key: string]: any;
}

export class LinklyAPI {
  private config = LINKLY_CONFIG;

  async createLink(linkData: LinklyLink): Promise<LinklyResponse> {
    // Validate required configuration
    if (!this.config.email) {
      console.error('❌ Linkly API missing email configuration');
      throw new Error('Linkly API requires email to be configured');
    }
    
    // Validate required inputs
    if (!linkData.url) {
      console.error('❌ Linkly API missing required URL');
      throw new Error('URL is required for creating a Linkly link');
    }
    
    const payload = {
      api_key: this.config.apiKey,
      email: this.config.email,
      workspace_id: this.config.workspaceId,
      ...linkData,
    };

    console.log('📡 Linkly API Request:', {
      url: `${this.config.baseUrl}/link`,
      payload: { 
        ...payload, 
        api_key: '[HIDDEN]',
        url: linkData.url,
        name: linkData.name || 'Untitled',
        workspace_id: this.config.workspaceId
      }
    });

    try {
      const response = await fetch(`${this.config.baseUrl}/link`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'cache-control': 'no-cache',
        },
        body: JSON.stringify(payload),
      });

      const responseText = await response.text();
      console.log('📥 Linkly API Response:', {
        status: response.status,
        statusText: response.statusText,
        body: responseText.substring(0, 200) + (responseText.length > 200 ? '...' : '')
      });

      if (!response.ok) {
        console.error(`❌ Linkly API error: ${response.status} ${response.statusText}`);
        throw new Error(`Linkly API error: ${response.status} ${response.statusText} - ${responseText}`);
      }

      try {
        const parsedResponse = JSON.parse(responseText);
        console.log('✅ Linkly link created successfully:', {
          id: parsedResponse.id,
          full_url: parsedResponse.full_url || 'Not available'
        });
        return parsedResponse;
      } catch (parseError) {
        console.error('❌ Failed to parse Linkly API response:', parseError);
        throw new Error(`Invalid JSON response from Linkly: ${responseText}`);
      }
    } catch (fetchError) {
      console.error('❌ Linkly API request failed:', fetchError);
      throw new Error(`Linkly API request failed: ${fetchError instanceof Error ? fetchError.message : 'Unknown error'}`);
    }
  }

  async updateLink(linkId: number, linkData: Partial<LinklyLink>): Promise<LinklyResponse> {
    const payload = {
      api_key: this.config.apiKey,
      email: this.config.email,
      workspace_id: this.config.workspaceId,
      id: linkId,
      ...linkData,
    };

    const response = await fetch(`${this.config.baseUrl}/link`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'cache-control': 'no-cache',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Linkly API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  async createMultipleLinks(links: LinklyLink[]): Promise<LinklyResponse[]> {
    const payload = links.map(link => ({
      email: this.config.email,
      workspace_id: this.config.workspaceId,
      ...link,
    }));

    const response = await fetch(
      `${this.config.baseUrl}/workspace/${this.config.workspaceId}/links?api_key=${this.config.apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      throw new Error(`Linkly API error: ${response.status} ${response.statusText}`);
    }

    return response.json();
  }

  // Helper method to create smart links for music releases
  async createMusicReleaseLinks(release: {
    title: string;
    artist: string;
    spotifyUrl?: string;
    appleUrl?: string;
    youtubeUrl?: string;
    soundcloudUrl?: string;
  }) {
    const links = [];
    
    if (release.spotifyUrl) {
      links.push({
        url: release.spotifyUrl,
        name: `${release.artist} - ${release.title} (Spotify)`,
        utm_source: 'linkly',
        utm_medium: 'social',
        utm_campaign: 'music_release',
        utm_content: 'spotify',
      });
    }

    if (release.appleUrl) {
      links.push({
        url: release.appleUrl,
        name: `${release.artist} - ${release.title} (Apple Music)`,
        utm_source: 'linkly',
        utm_medium: 'social',
        utm_campaign: 'music_release',
        utm_content: 'apple_music',
      });
    }

    if (release.youtubeUrl) {
      links.push({
        url: release.youtubeUrl,
        name: `${release.artist} - ${release.title} (YouTube)`,
        utm_source: 'linkly',
        utm_medium: 'social',
        utm_campaign: 'music_release',
        utm_content: 'youtube',
      });
    }

    if (release.soundcloudUrl) {
      links.push({
        url: release.soundcloudUrl,
        name: `${release.artist} - ${release.title} (SoundCloud)`,
        utm_source: 'linkly',
        utm_medium: 'social',
        utm_campaign: 'music_release',
        utm_content: 'soundcloud',
      });
    }

    if (links.length > 0) {
      return await this.createMultipleLinks(links);
    }

    return [];
  }

  // Create a smart link that rotates between platforms
  async createSmartLink(release: {
    title: string;
    artist: string;
    platforms: Array<{
      name: string;
      url: string;
      percentage: number;
    }>;
  }) {
    const rules = release.platforms.map(platform => ({
      what: 'rotator' as const,
      url: platform.url,
      percentage: platform.percentage.toString(),
    }));

    return await this.createLink({
      url: release.platforms[0].url, // Fallback URL
      name: `${release.artist} - ${release.title} (Smart Link)`,
      utm_source: 'linkly',
      utm_medium: 'smart_link',
      utm_campaign: 'music_release',
      rules,
    });
  }
}

export const linkly = new LinklyAPI();
