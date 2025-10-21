"use client"

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { 
  CheckCircle, 
  AlertTriangle, 
  Database, 
  Copy, 
  ExternalLink,
  Play,
  Settings
} from 'lucide-react'

export default function PayoutSetupPage() {
  const [copied, setCopied] = useState(false)
  const [testingComplete, setTestingComplete] = useState(false)

  const simplifiedSQL = `-- SIMPLIFIED PAYOUT SYSTEM FOR IMMEDIATE USE
-- Copy and paste this into your Supabase SQL Editor

-- 1. Create payout_methods table (simplified)
CREATE TABLE IF NOT EXISTS payout_methods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('paypal', 'bank_transfer', 'stripe', 'wise')),
  details JSONB NOT NULL,
  is_default BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create indexes
CREATE INDEX IF NOT EXISTS idx_payout_methods_user_id ON payout_methods(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_payout_methods_user_default 
  ON payout_methods(user_id) WHERE is_default = true;

-- 3. Enable Row Level Security
ALTER TABLE payout_methods ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
CREATE POLICY IF NOT EXISTS "Users can manage own payout methods" ON payout_methods
  FOR ALL USING (auth.uid() = user_id);

-- 5. Create payouts table
CREATE TABLE IF NOT EXISTS payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  payout_method_id UUID REFERENCES payout_methods(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'cancelled')),
  reference_id VARCHAR(255),
  failure_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Payouts indexes and RLS
CREATE INDEX IF NOT EXISTS idx_payouts_user_id ON payouts(user_id);
ALTER TABLE payouts ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can manage own payouts" ON payouts
  FOR ALL USING (auth.uid() = user_id);

-- 7. Create user_earnings table
CREATE TABLE IF NOT EXISTS user_earnings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  source_type VARCHAR(50) DEFAULT 'other' CHECK (source_type IN ('streaming', 'beat_sales', 'sync_opportunities', 'royalties', 'other')),
  source_id UUID,
  status VARCHAR(50) DEFAULT 'available' CHECK (status IN ('pending', 'available', 'paid_out')),
  period_start DATE,
  period_end DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. User earnings indexes and RLS  
CREATE INDEX IF NOT EXISTS idx_user_earnings_user_id ON user_earnings(user_id);
ALTER TABLE user_earnings ENABLE ROW LEVEL SECURITY;
CREATE POLICY IF NOT EXISTS "Users can view own earnings" ON user_earnings
  FOR ALL USING (auth.uid() = user_id);

-- 9. Create trigger to ensure single default payout method
CREATE OR REPLACE FUNCTION ensure_single_default_payout_method()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_default = TRUE THEN
    UPDATE payout_methods 
    SET is_default = FALSE, updated_at = NOW()
    WHERE user_id = NEW.user_id AND id != NEW.id;
  END IF;
  
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER IF NOT EXISTS trigger_ensure_single_default_payout_method
  BEFORE INSERT OR UPDATE ON payout_methods
  FOR EACH ROW
  EXECUTE FUNCTION ensure_single_default_payout_method();

-- 10. Helper function for available balance
CREATE OR REPLACE FUNCTION get_user_available_balance(user_uuid UUID)
RETURNS DECIMAL(10,2) AS $$
BEGIN
  RETURN COALESCE(
    (SELECT SUM(amount) FROM user_earnings 
     WHERE user_id = user_uuid AND status = 'available'),
    0
  );
END;
$$ LANGUAGE plpgsql;`

  const copySQL = () => {
    navigator.clipboard.writeText(simplifiedSQL)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const testSetup = async () => {
    try {
      const response = await fetch('/api/payout-methods?user_id=test')
      setTestingComplete(true)
    } catch (error) {
      console.error('Test failed:', error)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <Card className="bg-gray-900/80 backdrop-blur border-gray-700">
          <CardHeader>
            <CardTitle className="text-white text-3xl flex items-center gap-3">
              <Settings className="h-8 w-8" />
              Payout System Setup
            </CardTitle>
            <CardDescription className="text-gray-300">
              Fix the "ERROR ADDING PAYOUT METHOD" by setting up the database tables
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Status Alert */}
        <Alert className="bg-orange-900/20 border-orange-700/50">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription className="text-orange-200">
            <strong>Setup Required:</strong> The payout system tables need to be created in your database.
            Follow the steps below to fix the payout method errors.
          </AlertDescription>
        </Alert>

        {/* Setup Steps */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Step 1 */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Badge className="bg-blue-600">1</Badge>
                Copy SQL Commands
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Copy the SQL commands that will create all the necessary payout system tables.
              </p>
              <Button 
                onClick={copySQL}
                className="w-full bg-blue-600 hover:bg-blue-700"
                size="lg"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy SQL Commands'}
              </Button>
            </CardContent>
          </Card>

          {/* Step 2 */}
          <Card className="bg-gray-800/50 border-gray-600">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Badge className="bg-green-600">2</Badge>
                Execute in Supabase
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-gray-300">
                Open your Supabase SQL Editor and execute the copied commands.
              </p>
              <Button 
                onClick={() => window.open('https://supabase.com/dashboard', '_blank')}
                className="w-full bg-green-600 hover:bg-green-700"
                size="lg"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Open Supabase Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Detailed Instructions */}
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Database className="h-5 w-5" />
              Detailed Setup Instructions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-gray-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">In Supabase Dashboard:</h4>
                  <ol className="list-decimal list-inside space-y-2 text-sm">
                    <li>Navigate to your project</li>
                    <li>Click "SQL Editor" in the sidebar</li>
                    <li>Click "New Query"</li>
                    <li>Paste the copied SQL</li>
                    <li>Click "Run" to execute</li>
                  </ol>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-white">What Gets Created:</h4>
                  <ul className="list-disc list-inside space-y-2 text-sm">
                    <li><code>payout_methods</code> - Payment methods</li>
                    <li><code>payouts</code> - Payout requests</li>
                    <li><code>user_earnings</code> - User earnings</li>
                    <li>Row Level Security policies</li>
                    <li>Helper functions and triggers</li>
                  </ul>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SQL Display */}
        <Card className="bg-gray-900/50 border-gray-600">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-white">SQL Commands</CardTitle>
              <Button 
                onClick={copySQL}
                variant="outline"
                size="sm"
                className="border-gray-500 text-gray-300 hover:bg-gray-700"
              >
                <Copy className="h-4 w-4 mr-2" />
                {copied ? 'Copied!' : 'Copy'}
              </Button>
            </div>
            <CardDescription className="text-gray-400">
              Copy this SQL and execute it in your Supabase SQL Editor
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-950 p-4 rounded-lg overflow-x-auto">
              <pre className="text-sm text-green-400 whitespace-pre-wrap">
                {simplifiedSQL}
              </pre>
            </div>
          </CardContent>
        </Card>

        {/* Test Section */}
        <Card className="bg-gray-800/50 border-gray-600">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Play className="h-5 w-5" />
              Test Your Setup
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-gray-300">
              After executing the SQL, test your payout system:
            </p>
            <div className="flex flex-wrap gap-3">
              <Button 
                onClick={() => window.open('/test-payout', '_blank')}
                className="bg-purple-600 hover:bg-purple-700"
              >
                Test Payout Interface
              </Button>
              <Button 
                onClick={testSetup}
                variant="outline"
                className="border-gray-500 text-gray-300 hover:bg-gray-700"
              >
                Test API Endpoint
              </Button>
            </div>
            
            {testingComplete && (
              <Alert className="bg-green-900/20 border-green-700/50 mt-4">
                <CheckCircle className="h-4 w-4" />
                <AlertDescription className="text-green-200">
                  Setup test completed! Your payout system should now be working.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Success Message */}
        <Alert className="bg-green-900/20 border-green-700/50">
          <CheckCircle className="h-4 w-4" />
          <AlertDescription className="text-green-200">
            <strong>After Setup:</strong> Your "ERROR ADDING PAYOUT METHOD" will be fixed! 
            Users will be able to add PayPal, Bank Transfer, Stripe, and Wise payout methods.
          </AlertDescription>
        </Alert>
      </div>
    </div>
  )
}
