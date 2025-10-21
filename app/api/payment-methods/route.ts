import { createClient } from '@supabase/supabase-js';
import { NextRequest, NextResponse } from 'next/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    
    if (!userId) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 });
    }

    const { data: paymentMethods, error } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching payment methods:', error);
      return NextResponse.json({ error: 'Failed to fetch payment methods' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      payment_methods: paymentMethods || [],
      count: paymentMethods?.length || 0
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
      method_type,
      is_default = false,
      paypal_email,
      account_holder_name,
      bank_name,
      routing_number,
      account_number,
      swift_code,
      iban,
      crypto_type,
      crypto_address,
      stripe_account_id,
      wise_account_id,
      wise_email,
      country_code,
      currency = 'USD',
      notes
    } = body;

    // Validate required fields
    if (!user_id || !method_type) {
      return NextResponse.json({ 
        error: 'User ID and method type are required' 
      }, { status: 400 });
    }

    // Method-specific validation
    if (method_type === 'paypal' && !paypal_email) {
      return NextResponse.json({ 
        error: 'PayPal email is required for PayPal payments' 
      }, { status: 400 });
    }

    if (method_type === 'bank_transfer' && (!account_holder_name || !bank_name || !account_number)) {
      return NextResponse.json({ 
        error: 'Account holder name, bank name, and account number are required for bank transfers' 
      }, { status: 400 });
    }

    if (method_type === 'crypto' && (!crypto_type || !crypto_address)) {
      return NextResponse.json({ 
        error: 'Crypto type and address are required for crypto payments' 
      }, { status: 400 });
    }

    if (method_type === 'stripe' && !stripe_account_id) {
      return NextResponse.json({ 
        error: 'Stripe account ID is required for Stripe payments' 
      }, { status: 400 });
    }

    if (method_type === 'wise' && !wise_account_id && !wise_email) {
      return NextResponse.json({ 
        error: 'Wise account ID or email is required for Wise payments' 
      }, { status: 400 });
    }

    const paymentMethodData = {
      user_id,
      method_type,
      is_default,
      paypal_email,
      account_holder_name,
      bank_name,
      routing_number,
      account_number,
      swift_code,
      iban,
      crypto_type,
      crypto_address,
      stripe_account_id,
      wise_account_id,
      wise_email,
      country_code,
      currency,
      notes
    };

    // Remove undefined fields
    Object.keys(paymentMethodData).forEach(key => {
      if (paymentMethodData[key as keyof typeof paymentMethodData] === undefined) {
        delete paymentMethodData[key as keyof typeof paymentMethodData];
      }
    });

    const { data: paymentMethod, error } = await supabase
      .from('payment_methods')
      .insert([paymentMethodData])
      .select()
      .single();

    if (error) {
      console.error('Error creating payment method:', error);
      return NextResponse.json({ 
        error: 'Failed to create payment method',
        details: error.message 
      }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true,
      payment_method: paymentMethod,
      message: 'Payment method created successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, user_id, ...updateData } = body;

    if (!id || !user_id) {
      return NextResponse.json({ 
        error: 'Payment method ID and user ID are required' 
      }, { status: 400 });
    }

    // Remove undefined fields
    Object.keys(updateData).forEach(key => {
      if (updateData[key] === undefined) {
        delete updateData[key];
      }
    });

    const { data: paymentMethod, error } = await supabase
      .from('payment_methods')
      .update(updateData)
      .eq('id', id)
      .eq('user_id', user_id)
      .select()
      .single();

    if (error) {
      console.error('Error updating payment method:', error);
      return NextResponse.json({ 
        error: 'Failed to update payment method',
        details: error.message 
      }, { status: 500 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ 
        error: 'Payment method not found or access denied' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      payment_method: paymentMethod,
      message: 'Payment method updated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const userId = searchParams.get('user_id');

    if (!id || !userId) {
      return NextResponse.json({ 
        error: 'Payment method ID and user ID are required' 
      }, { status: 400 });
    }

    // Instead of deleting, we'll mark as inactive
    const { data: paymentMethod, error } = await supabase
      .from('payment_methods')
      .update({ is_active: false })
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      console.error('Error deactivating payment method:', error);
      return NextResponse.json({ 
        error: 'Failed to deactivate payment method',
        details: error.message 
      }, { status: 500 });
    }

    if (!paymentMethod) {
      return NextResponse.json({ 
        error: 'Payment method not found or access denied' 
      }, { status: 404 });
    }

    return NextResponse.json({ 
      success: true,
      message: 'Payment method deactivated successfully'
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}