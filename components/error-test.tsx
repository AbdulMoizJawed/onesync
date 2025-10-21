"use client"

import { useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase'

export function ErrorTestComponent() {
  const [error, setError] = useState<string>('')
  
  useEffect(() => {
    const testSupabaseCall = async () => {
      try {
        console.log('🧪 Testing Supabase client:', !!supabase)
        
        if (!supabase) {
          setError('Supabase client is null')
          return
        }
        
        console.log('🧪 Testing auth object:', !!supabase.auth)
        
        if (!supabase.auth) {
          setError('Supabase auth is null')
          return
        }
        
        console.log('🧪 Testing getSession method:', typeof supabase.auth.getSession)
        
        if (typeof supabase.auth.getSession !== 'function') {
          setError('getSession method not available')
          return
        }
        
        // This is the most likely place where a "call" error could occur
        const { data, error: sessionError } = await supabase.auth.getSession()
        
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`)
        } else {
          setError(`Success: ${data.session ? 'Has session' : 'No session'}`)
        }
        
      } catch (err: any) {
        console.error('🧪 Error in test:', err)
        setError(`Catch error: ${err.message || err}`)
      }
    }
    
    testSupabaseCall()
  }, [])
  
  return (
    <div className="fixed top-4 right-4 bg-red-500 text-white p-2 rounded text-xs max-w-xs">
      <strong>Error Test:</strong> {error || 'Testing...'}
    </div>
  )
}