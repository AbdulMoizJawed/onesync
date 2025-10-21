import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { intercomServerAPI, syncUserWithIntercom } from '@/lib/intercom-server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: Request) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { subject, category, priority, description, attachments } = await request.json()

    if (!subject || !description) {
      return NextResponse.json({ error: 'Subject and description are required' }, { status: 400 })
    }

    // Create support request
    const { data: supportRequest, error } = await supabase
      .from('support_requests')
      .insert({
        user_id: user.id,
        subject: subject.trim(),
        category: category || 'general',
        priority: priority || 'medium',
        description: description.trim(),
        attachments: attachments || [],
        status: 'open'
      })
      .select()
      .single()

    if (error) {
      console.error('Error creating support request:', error)
      return NextResponse.json({ error: 'Failed to create support request' }, { status: 500 })
    }

    // Sync with Intercom (don't block on this)
    try {
      // First ensure user exists in Intercom
      await syncUserWithIntercom(user, {
        support_requests_count: 1,
        last_support_request: new Date().toISOString()
      })

      // Create the support ticket in Intercom
      const intercomTicket = await intercomServerAPI.createSupportTicket({
        userId: user.id,
        email: user.email!,
        subject,
        description,
        category: category || 'general',
        priority: priority || 'medium',
        metadata: {
          database_id: supportRequest.id,
          created_at: supportRequest.created_at,
          attachments_count: (attachments || []).length
        }
      })

      // Store Intercom conversation ID in database for future reference
      if (intercomTicket?.id) {
        await supabase
          .from('support_requests')
          .update({ 
            internal_notes: JSON.stringify({ 
              intercom_conversation_id: intercomTicket.id 
            })
          })
          .eq('id', supportRequest.id)
      }

      console.log('Support ticket synced with Intercom:', intercomTicket?.id)
    } catch (intercomError) {
      console.error('Failed to sync with Intercom (non-blocking):', intercomError)
      // Continue - don't fail the request if Intercom sync fails
    }

    return NextResponse.json({ 
      success: true, 
      supportRequest 
    })

  } catch (error) {
    console.error('Support request error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
    
    // Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Get user's support requests
    const { data: supportRequests, error } = await supabase
      .from('support_requests')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching support requests:', error)
      return NextResponse.json({ error: 'Failed to fetch support requests' }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true, 
      supportRequests 
    })

  } catch (error) {
    console.error('Support request fetch error:', error)
    return NextResponse.json({ 
      error: 'Internal server error' 
    }, { status: 500 })
  }
}
