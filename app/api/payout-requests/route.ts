import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const status = searchParams.get('status');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    let query = supabase
      .from('payout_requests_with_payment_details')
      .select('*')
      .eq('user_id', userId)
      .order('requested_date', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    const { data: payoutRequests, error } = await query;

    if (error) {
      console.error('Error fetching payout requests:', error);
      return NextResponse.json({ error: 'Failed to fetch payout requests' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      payout_requests: payoutRequests || [],
      count: payoutRequests?.length || 0
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      user_id,
      payment_method_id,
      amount,
      currency = 'USD'
    } = body;

    // Validate required fields
    if (!user_id || !payment_method_id || !amount) {
      return NextResponse.json({ 
        error: 'User ID, payment method ID, and amount are required' 
      }, { status: 400 });
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json({ 
        error: 'Amount must be greater than 0' 
      }, { status: 400 });
    }

    // Check if payment method belongs to user
    const { data: paymentMethod, error: pmError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', payment_method_id)
      .eq('user_id', user_id)
      .eq('is_active', true)
      .single();

    if (pmError || !paymentMethod) {
      return NextResponse.json({ 
        error: 'Invalid payment method or payment method not found' 
      }, { status: 400 });
    }

    // TODO: Check user's available balance
    // const { data: balance } = await supabase.rpc('get_user_available_balance', { user_uuid: user_id });
    // if (balance < amount) {
    //   return NextResponse.json({ 
    //     error: 'Insufficient balance for payout request' 
    //   }, { status: 400 });
    // }

    const payoutRequestData = {
      user_id,
      payment_method_id,
      amount: parseFloat(amount),
      currency,
      status: 'pending'
    };

    const { data: payoutRequest, error } = await supabase
      .from('payout_requests')
      .insert([payoutRequestData])
      .select()
      .single();

    if (error) {
      console.error('Error creating payout request:', error);
      return NextResponse.json({ 
        error: 'Failed to create payout request',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      payout_request: payoutRequest,
      message: 'Payout request created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, status, admin_notes, failure_reason, transaction_id } = body;

    if (!id) {
      return NextResponse.json({ 
        error: 'Payout request ID is required' 
      }, { status: 400 });
    }

    // Prepare update data
    const updateData: any = {};
    
    if (status) {
      updateData.status = status;
      
      // Set timestamps based on status
      if (status === 'processing') {
        updateData.processed_date = new Date().toISOString();
      } else if (status === 'completed') {
        updateData.completed_date = new Date().toISOString();
      }
    }

    if (admin_notes) updateData.admin_notes = admin_notes;
    if (failure_reason) updateData.failure_reason = failure_reason;
    if (transaction_id) updateData.transaction_id = transaction_id;

    let query = supabase
      .from('payout_requests')
      .update(updateData)
      .eq('id', id);

    // If user_id is provided, ensure user can only update their own requests
    if (user_id) {
      query = query.eq('user_id', user_id);
    }

    const { data: payoutRequest, error } = await query
      .select()
      .single();

    if (error) {
      console.error('Error updating payout request:', error);
      return NextResponse.json({ 
        error: 'Failed to update payout request',
        details: error.message 
      }, { status: 500 });
    }

    if (!payoutRequest) {
      return NextResponse.json({ 
        error: 'Payout request not found or access denied' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      payout_request: payoutRequest,
      message: 'Payout request updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}