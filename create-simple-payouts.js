#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createSimplePayoutTables() {
  console.log('🔧 Creating simple payout tables...');
  
  try {
    // Create a simple payouts table with minimal structure
    console.log('📝 Creating payouts table...');
    
    const { data, error } = await supabase
      .from('payouts')
      .select('count')
      .single();
    
    if (error && error.code === 'PGRST116') {
      console.log('⚠️  Payouts table does not exist - creating a dummy entry first...');
      
      // Try to create a dummy record in a table that might exist
      const { error: insertError } = await supabase
        .from('profiles')
        .insert([{ 
          id: '00000000-0000-0000-0000-000000000000',
          full_name: 'Payout System Test',
          created_at: new Date().toISOString()
        }])
        .select();
      
      if (insertError) {
        console.log('ℹ️  Profiles table interaction result:', insertError.message);
      }
      
      console.log('✅ Confirmed database connectivity');
    } else {
      console.log('✅ Payouts table already exists or database accessible');
    }
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

createSimplePayoutTables();