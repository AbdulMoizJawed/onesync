"use client"

import { useState } from 'react'
import PayoutMethodsManager from '@/components/payout-methods-manager'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { AlertTriangle, CheckCircle, Database } from 'lucide-react'

export default function PayoutTestPage() {
  const [showSQLInstructions, setShowSQLInstructions] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        <Card className="bg-gray-900/80 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-2xl">
              Payout Methods Test Page
            </CardTitle>
            <CardDescription className="text-gray-300">
              Test the payout methods functionality
            </CardDescription>
          </CardHeader>
        </Card>

        <Alert className="bg-orange-900/20 border-orange-700/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-200">
            <strong>Database Setup Required:</strong> If you see errors about missing tables, 
            you need to run the SQL commands to create the payout system tables first.
            <Button 
              onClick={() => setShowSQLInstructions(!showSQLInstructions)}
              variant="link" 
              className="text-orange-300 underline ml-2 p-0 h-auto"
            >
              Show SQL Instructions
            </Button>
          </AlertDescription>
        </Alert>

        {showSQLInstructions && (
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Database className="h-5 w-5" />
                Database Setup Instructions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4 text-gray-300">
                <p>Follow these steps to set up the payout system tables:</p>
                <ol className="list-decimal list-inside space-y-2">
                  <li>Go to your Supabase project dashboard</li>
                  <li>Navigate to <strong>SQL Editor</strong></li>
                  <li>Copy and paste the SQL commands below</li>
                  <li>Click <strong>Run</strong> to execute</li>
                  <li>Refresh this page to test the functionality</li>
                </ol>
                
                <div className="bg-gray-900 p-4 rounded-lg mt-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm font-medium text-gray-400">SQL Commands</span>
                    <Button 
                      onClick={() => {
                        navigator.clipboard.writeText(sqlCommands)
                        alert('SQL copied to clipboard!')
                      }}
                      size="sm" 
                      variant="outline"
                      className="text-xs"
                    >
                      Copy SQL
                    </Button>
                  </div>
                  <pre className="text-xs text-green-400 overflow-x-auto">
                    {sqlCommands}
                  </pre>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <PayoutMethodsManager />

        <Card className="bg-gray-900/80 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Test Instructions</CardTitle>
          </CardHeader>
          <CardContent className="text-gray-300 space-y-3">
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Add PayPal Method:</strong> Enter your PayPal email address
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Add Bank Transfer:</strong> Fill in bank details (account holder, account number, routing number, bank name)
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Set Default:</strong> Check the "Set as default" option to make it your primary payout method
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong>View Methods:</strong> All your payout methods will be displayed with sanitized details for security
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="h-5 w-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div>
                <strong>Delete Methods:</strong> Use the trash icon to remove unwanted payout methods
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

const sqlCommands = `-- 1. Create payout_methods table
CREATE TABLE IF NOT EXISTS payout_methods (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('paypal', 'bank_transfer', 'stripe', 'wise')),
  is_default BOOLEAN DEFAULT FALSE,
  details JSONB NOT NULL,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payout_methods_user_id ON payout_methods(user_id);
CREATE INDEX IF NOT EXISTS idx_payout_methods_default ON payout_methods(user_id, is_default) WHERE is_default = true;

ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;

-- RLS Policies for payout_methods
CREATE POLICY IF NOT EXISTS "Users can view own payout methods" ON payout_methods
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own payout methods" ON payout_methods
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can update own payout methods" ON payout_methods
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can delete own payout methods" ON payout_methods
  FOR DELETE USING (auth.uid() = user_id);

-- 2. Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_method_id UUID NOT NULL REFERENCES payout_methods(id) ON DELETE RESTRICT,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference_id VARCHAR(255),
  failure_reason TEXT,
  requested_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  processed_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON payouts(status);
CREATE INDEX IF NOT EXISTS idx_payouts_requested_at ON payouts(requested_at DESC);

ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own payouts" ON payouts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS "Users can insert own payouts" ON payouts
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 3. Create user_earnings table
CREATE TABLE IF NOT EXISTS user_earnings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('streaming', 'beat_sales', 'sync_opportunities', 'royalties')),
  source_id UUID,
  amount DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  period_start DATE,
  period_end DATE,
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'available', 'paid_out')),
  payout_id UUID REFERENCES payouts(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_earnings_user_id ON user_earnings(user_id);
CREATE INDEX IF NOT EXISTS idx_user_earnings_status ON user_earnings(status);
CREATE INDEX IF NOT EXISTS idx_user_earnings_source ON user_earnings(source_type, source_id);

ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "Users can view own earnings" ON user_earnings
  FOR SELECT USING (auth.uid() = user_id);

-- 4. Trigger to ensure single default payout method
CREATE OR REPLACE FUNCTION ensure_single_default_payout_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE payout_methods 
    SET is_default = FALSE 
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_ensure_single_default_payout_method
  BEFORE INSERT OR UPDATE ON payout_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payout_method();`
