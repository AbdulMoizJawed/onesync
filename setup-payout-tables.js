#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
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

async function setupPayoutTables() {
  console.log('🔧 Setting up payout tables...');
  
  try {
    // Read the SQL file
    const sqlContent = fs.readFileSync('payout_system_setup.sql', 'utf8');
    
    // Split SQL into individual statements
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    console.log(`📝 Executing ${statements.length} SQL statements...`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      if (statement) {
        console.log(`${i + 1}/${statements.length}: Executing statement...`);
        
        const { error } = await supabase.rpc('exec_sql', {
          sql: statement + ';'
        });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} failed (this may be expected):`, error.message);
        } else {
          console.log(`✅ Statement ${i + 1} completed successfully`);
        }
      }
    }
    
    console.log('🎉 Payout tables setup completed!');
    
    // Verify tables exist
    console.log('🔍 Verifying tables exist...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('payout_methods')
      .select('count')
      .single();
    
    if (!tablesError) {
      console.log('✅ payout_methods table verified');
    } else {
      console.log('❌ payout_methods table verification failed:', tablesError.message);
    }
    
  } catch (error) {
    console.error('❌ Error setting up payout tables:', error);
  }
}

setupPayoutTables();