import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

export async function GET(request: NextRequest) {
  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Fetch playlist campaigns
    const { data: campaigns, error } = await supabase
      .from('playlist_campaigns')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch playlist campaigns', details: error.message },
        { status: 500 }
      )
    }

    // Manually fetch related data
    const campaignsWithData = await Promise.all(
      (campaigns || []).map(async (campaign) => {
        const [profileResult, releaseResult] = await Promise.all([
          supabase.from('profiles').select('id, full_name, email').eq('id', campaign.user_id).single(),
          campaign.release_id 
            ? supabase.from('releases').select('id, title, artist_name, cover_art_url').eq('id', campaign.release_id).single()
            : Promise.resolve({ data: null })
        ])

        return {
          ...campaign,
          profiles: profileResult.data || { full_name: 'Unknown', email: 'unknown@email.com' },
          releases: releaseResult.data || { title: 'Unknown', artist_name: 'Unknown' }
        }
      })
    )

    return NextResponse.json({ 
      campaigns: campaignsWithData,
      count: campaignsWithData.length,
      success: true 
    })
  } catch (error) {
    console.error('Admin playlist campaigns error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch playlist campaigns' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { id, action, data } = await request.json()
    
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json(
        { error: 'Missing Supabase configuration' },
        { status: 500 }
      )
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    let updateData: any = {
      updated_at: new Date().toISOString()
    }

    switch (action) {
      case 'start':
        updateData.status = 'in_progress'
        updateData.started_at = new Date().toISOString()
        if (data?.assigned_to) updateData.assigned_to = data.assigned_to
        break
      
      case 'complete':
        updateData.status = 'completed'
        updateData.completed_at = new Date().toISOString()
        if (data?.results) updateData.campaign_results = data.results
        if (data?.playlist_placements) updateData.playlist_placements = data.playlist_placements
        if (data?.streams_gained) updateData.streams_gained = data.streams_gained
        break
      
      case 'cancel':
        updateData.status = 'cancelled'
        break
      
      case 'refund':
        updateData.status = 'refunded'
        break
      
      case 'update_results':
        if (data?.results) updateData.campaign_results = data.results
        if (data?.playlist_placements) updateData.playlist_placements = data.playlist_placements
        if (data?.streams_gained) updateData.streams_gained = data.streams_gained
        break
      
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const { error: updateError } = await supabase
      .from('playlist_campaigns')
      .update(updateData)
      .eq('id', id)

    if (updateError) {
      console.error('Database error:', updateError)
      return NextResponse.json(
        { error: 'Failed to update campaign' },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true,
      message: `Campaign ${action} successfully`
    })
  } catch (error) {
    console.error('Admin campaign update error:', error)
    return NextResponse.json(
      { error: 'Failed to update campaign' },
      { status: 500 }
    )
  }
}
