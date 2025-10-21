import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { validatePayoutMethod, sanitizePayoutDetails } from '@/lib/payment-validation'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  try {
    const { 
      user_id, 
      type, 
      details, 
      is_default = false 
    } = await request.json()

    // Validate required fields
    if (!user_id || !type || !details) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, type, details' },
        { status: 400 }
      )
    }

    // Validate payout method type
    const validTypes = ['paypal', 'bank_transfer', 'stripe', 'wise']
    if (!validTypes.includes(type)) {
      return NextResponse.json(
        { error: `Invalid payout method type. Must be one of: ${validTypes.join(', ')}` },
        { status: 400 }
      )
    }

    // Validate details using comprehensive validation
    const validation = validatePayoutMethod(type, details)
    if (!validation.isValid) {
      return NextResponse.json(
        { 
          error: 'Validation failed', 
          details: validation.errors 
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const { data: userData, error: userError } = await supabase.auth.admin.getUserById(user_id)
    if (userError || !userData) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If this is being set as default, first unset any existing defaults
    if (is_default) {
      await supabase
        .from('payout_methods')
        .update({ is_default: false })
        .eq('user_id', user_id)
    }

    // Insert the new payout method
    const { data, error } = await supabase
      .from('payout_methods')
      .insert([{
        user_id,
        type,
        details,
        is_default,
        is_active: true
      }])
      .select()
      .single()

    if (error) {
      console.error('Database error creating payout method:', error)
      return NextResponse.json(
        { error: 'Failed to create payout method', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Payout method added successfully'
    })

  } catch (error) {
    console.error('Error adding payout method:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const user_id = searchParams.get('user_id')

    if (!user_id) {
      return NextResponse.json(
        { error: 'user_id parameter is required' },
        { status: 400 }
      )
    }

    // Get all payout methods for the user
    const { data, error } = await supabase
      .from('payout_methods')
      .select('*')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching payout methods:', error)
      return NextResponse.json(
        { error: 'Failed to fetch payout methods' },
        { status: 500 }
      )
    }

    // Sanitize sensitive details for response
    const sanitizedData = data.map(method => ({
      ...method,
      details: sanitizePayoutDetails(method.type, method.details)
    }))

    return NextResponse.json({
      success: true,
      data: sanitizedData
    })

  } catch (error) {
    console.error('Error fetching payout methods:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { 
      id, 
      type, 
      details, 
      is_default 
    } = await request.json()

    if (!id) {
      return NextResponse.json(
        { error: 'Payout method ID is required' },
        { status: 400 }
      )
    }

    // Get existing payout method
    const { data: existingMethod, error: fetchError } = await supabase
      .from('payout_methods')
      .select('*')
      .eq('id', id)
      .single()

    if (fetchError || !existingMethod) {
      return NextResponse.json(
        { error: 'Payout method not found' },
        { status: 404 }
      )
    }

    // Prepare update data
    const updateData: any = { updated_at: new Date().toISOString() }
    
    if (type) {
      const validTypes = ['paypal', 'bank_transfer', 'stripe', 'wise']
      if (!validTypes.includes(type)) {
        return NextResponse.json(
          { error: `Invalid payout method type. Must be one of: ${validTypes.join(', ')}` },
          { status: 400 }
        )
      }
      updateData.type = type
    }

    if (details) {
      const validation = validatePayoutMethod(type || existingMethod.type, details)
      if (!validation.isValid) {
        return NextResponse.json(
          { 
            error: 'Validation failed', 
            details: validation.errors 
          },
          { status: 400 }
        )
      }
      updateData.details = details
    }

    // Handle default setting
    if (is_default !== undefined) {
      if (is_default) {
        // Unset other defaults for this user
        await supabase
          .from('payout_methods')
          .update({ is_default: false })
          .eq('user_id', existingMethod.user_id)
      }
      updateData.is_default = is_default
    }

    // Update the payout method
    const { data, error } = await supabase
      .from('payout_methods')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error updating payout method:', error)
      return NextResponse.json(
        { error: 'Failed to update payout method' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      data,
      message: 'Payout method updated successfully'
    })

  } catch (error) {
    console.error('Error updating payout method:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json(
        { error: 'Payout method ID is required' },
        { status: 400 }
      )
    }

    // Soft delete by setting is_active to false
    const { data, error } = await supabase
      .from('payout_methods')
      .update({ 
        is_active: false, 
        is_default: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      console.error('Database error deleting payout method:', error)
      return NextResponse.json(
        { error: 'Failed to delete payout method' },
        { status: 500 }
      )
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Payout method not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Payout method deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting payout method:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
