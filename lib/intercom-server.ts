/**
 * Server-side Intercom API Integration
 * Handles ticket creation, updates, and user syncing with Intercom
 */

interface IntercomUser {
  user_id: string
  email: string
  name?: string
  custom_attributes?: Record<string, any>
  created_at?: number
}

interface IntercomTicket {
  type: 'ticket'
  title: string
  body: string
  user_id: string
  ticket_attributes?: Record<string, any>
  custom_attributes?: Record<string, any>
}

interface IntercomConversation {
  from: {
    type: 'user'
    user_id: string
  }
  body: string
  message_type?: 'comment'
}

class IntercomServerAPI {
  private baseUrl = 'https://api.intercom.io'
  private accessToken: string

  constructor() {
    // You'll need to add this to your environment variables
    this.accessToken = process.env.INTERCOM_ACCESS_TOKEN || ''
    
    if (!this.accessToken) {
      console.warn('INTERCOM_ACCESS_TOKEN not found in environment variables')
    }
  }

  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`
    
    const config: RequestInit = {
      ...options,
      headers: {
        'Authorization': `Bearer ${this.accessToken}`,
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Intercom-Version': '2.11',
        ...options.headers,
      },
    }

    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Intercom API Error: ${response.status} ${response.statusText} - ${errorText}`)
    }

    return response.json()
  }

  // Create or update a user in Intercom
  async createOrUpdateUser(userData: IntercomUser): Promise<any> {
    try {
      return await this.makeRequest('/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      })
    } catch (error) {
      console.error('Failed to create/update Intercom user:', error)
      throw error
    }
  }

  // Create a conversation (ticket) in Intercom
  async createConversation(conversationData: IntercomConversation): Promise<any> {
    try {
      return await this.makeRequest('/conversations', {
        method: 'POST',
        body: JSON.stringify(conversationData),
      })
    } catch (error) {
      console.error('Failed to create Intercom conversation:', error)
      throw error
    }
  }

  // Add a note to an existing conversation
  async addNoteToConversation(conversationId: string, note: string, adminId?: string): Promise<any> {
    try {
      return await this.makeRequest(`/conversations/${conversationId}/notes`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'note',
          body: note,
          admin_id: adminId,
        }),
      })
    } catch (error) {
      console.error('Failed to add note to Intercom conversation:', error)
      throw error
    }
  }

  // Update conversation tags
  async updateConversationTags(conversationId: string, tags: string[]): Promise<any> {
    try {
      return await this.makeRequest(`/conversations/${conversationId}/tags`, {
        method: 'POST',
        body: JSON.stringify({
          id: conversationId,
          tags: tags.map(tag => ({ name: tag })),
        }),
      })
    } catch (error) {
      console.error('Failed to update Intercom conversation tags:', error)
      throw error
    }
  }

  // Close a conversation
  async closeConversation(conversationId: string, adminId?: string): Promise<any> {
    try {
      return await this.makeRequest(`/conversations/${conversationId}/parts`, {
        method: 'POST',
        body: JSON.stringify({
          type: 'note',
          body: 'This conversation has been resolved.',
          message_type: 'close',
          admin_id: adminId,
        }),
      })
    } catch (error) {
      console.error('Failed to close Intercom conversation:', error)
      throw error
    }
  }

  // Assign conversation to an admin
  async assignConversation(conversationId: string, adminId: string): Promise<any> {
    try {
      return await this.makeRequest(`/conversations/${conversationId}`, {
        method: 'PUT',
        body: JSON.stringify({
          assignee: {
            type: 'admin',
            id: adminId,
          },
        }),
      })
    } catch (error) {
      console.error('Failed to assign Intercom conversation:', error)
      throw error
    }
  }

  // Create a support ticket specifically
  async createSupportTicket(ticketData: {
    userId: string
    email: string
    subject: string
    description: string
    category: string
    priority: string
    metadata?: Record<string, any>
  }): Promise<any> {
    const conversationData: IntercomConversation = {
      from: {
        type: 'user',
        user_id: ticketData.userId,
      },
      body: `
**Subject:** ${ticketData.subject}

**Category:** ${ticketData.category}
**Priority:** ${ticketData.priority}

**Description:**
${ticketData.description}

${ticketData.metadata ? `\n**Additional Details:**\n${JSON.stringify(ticketData.metadata, null, 2)}` : ''}
      `.trim(),
    }

    try {
      const conversation = await this.createConversation(conversationData)
      
      // Add tags for categorization
      const tags = [
        `category-${ticketData.category}`,
        `priority-${ticketData.priority}`,
        'support-ticket',
        'platform-web'
      ]
      
      await this.updateConversationTags(conversation.id, tags)
      
      return conversation
    } catch (error) {
      console.error('Failed to create support ticket in Intercom:', error)
      throw error
    }
  }

  // Create a takedown request ticket
  async createTakedownTicket(ticketData: {
    userId: string
    email: string
    releaseId: string
    releaseTitle: string
    reason: string
    detailedReason?: string
    urgency: string
    platforms: string[]
  }): Promise<any> {
    const conversationData: IntercomConversation = {
      from: {
        type: 'user',
        user_id: ticketData.userId,
      },
      body: `
**🚨 TAKEDOWN REQUEST**

**Release:** ${ticketData.releaseTitle}
**Release ID:** ${ticketData.releaseId}
**Urgency:** ${ticketData.urgency}
**Platforms:** ${ticketData.platforms.join(', ')}

**Reason:** ${ticketData.reason}

${ticketData.detailedReason ? `**Detailed Explanation:**\n${ticketData.detailedReason}` : ''}

**⚠️ This is a content takedown request that requires immediate attention.**
      `.trim(),
    }

    try {
      const conversation = await this.createConversation(conversationData)
      
      // Add urgent tags for takedown requests
      const tags = [
        'takedown-request',
        `urgency-${ticketData.urgency}`,
        `reason-${ticketData.reason}`,
        'requires-immediate-action',
        'platform-web'
      ]
      
      await this.updateConversationTags(conversation.id, tags)
      
      return conversation
    } catch (error) {
      console.error('Failed to create takedown ticket in Intercom:', error)
      throw error
    }
  }

  // Create a release edit request ticket
  async createReleaseEditTicket(ticketData: {
    userId: string
    email: string
    releaseId: string
    releaseTitle: string
    editType: string
    changeSummary: string
    originalData: Record<string, any>
    proposedChanges: Record<string, any>
  }): Promise<any> {
    const conversationData: IntercomConversation = {
      from: {
        type: 'user',
        user_id: ticketData.userId,
      },
      body: `
**✏️ RELEASE EDIT REQUEST**

**Release:** ${ticketData.releaseTitle}
**Release ID:** ${ticketData.releaseId}
**Edit Type:** ${ticketData.editType}

**Summary of Changes:**
${ticketData.changeSummary}

**Original Data:**
\`\`\`json
${JSON.stringify(ticketData.originalData, null, 2)}
\`\`\`

**Proposed Changes:**
\`\`\`json
${JSON.stringify(ticketData.proposedChanges, null, 2)}
\`\`\`

**📝 This request requires review and approval before changes can be applied to the release.**
      `.trim(),
    }

    try {
      const conversation = await this.createConversation(conversationData)
      
      // Add tags for release edit requests
      const tags = [
        'release-edit-request',
        `edit-type-${ticketData.editType}`,
        'requires-approval',
        'metadata-change',
        'platform-web'
      ]
      
      await this.updateConversationTags(conversation.id, tags)
      
      return conversation
    } catch (error) {
      console.error('Failed to create release edit ticket in Intercom:', error)
      throw error
    }
  }
}

// Export singleton instance
export const intercomServerAPI = new IntercomServerAPI()

// Helper function to sync user data with Intercom
export async function syncUserWithIntercom(user: any, additionalData?: Record<string, any>) {
  try {
    const intercomUser: IntercomUser = {
      user_id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
      created_at: user.created_at ? Math.floor(new Date(user.created_at).getTime() / 1000) : undefined,
      custom_attributes: {
        signup_method: user.app_metadata?.provider || 'email',
        platform: 'web',
        last_sync: new Date().toISOString(),
        ...additionalData,
      },
    }

    return await intercomServerAPI.createOrUpdateUser(intercomUser)
  } catch (error) {
    console.error('Failed to sync user with Intercom:', error)
    // Don't throw - this shouldn't block the main application
    return null
  }
}
