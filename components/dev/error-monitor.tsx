'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { AlertTriangle, CheckCircle, XCircle, RefreshCw, Eye, EyeOff } from 'lucide-react'
import { cn } from '@/lib/utils'

interface ErrorLog {
  id: string
  timestamp: string
  level: 'error' | 'warning' | 'info'
  message: string
  component?: string
  stack?: string
  userAgent?: string
  url?: string
}

interface ErrorMonitorProps {
  className?: string
}

export default function ErrorMonitor({ className }: ErrorMonitorProps) {
  const [errors, setErrors] = useState<ErrorLog[]>([])
  const [isRecording, setIsRecording] = useState(true)
  const [showDetails, setShowDetails] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'error' | 'warning'>('all')

  useEffect(() => {
    if (!isRecording) return

    // Store original console methods
    const originalError = console.error
    const originalWarn = console.warn

    // Override console methods to capture errors
    console.error = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      
      addError({
        level: 'error',
        message,
        component: extractComponentName(new Error().stack),
        stack: new Error().stack,
        url: window.location.href,
        userAgent: navigator.userAgent
      })
      
      originalError.apply(console, args)
    }

    console.warn = (...args) => {
      const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
      ).join(' ')
      
      addError({
        level: 'warning',
        message,
        component: extractComponentName(new Error().stack),
        url: window.location.href
      })
      
      originalWarn.apply(console, args)
    }

    // Catch unhandled errors
    const handleError = (event: ErrorEvent) => {
      addError({
        level: 'error',
        message: event.message,
        component: event.filename ? extractComponentName(event.filename) : undefined,
        stack: event.error?.stack,
        url: window.location.href
      })
    }

    // Catch unhandled promise rejections
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      addError({
        level: 'error',
        message: `Unhandled Promise Rejection: ${event.reason}`,
        stack: event.reason?.stack,
        url: window.location.href
      })
    }

    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleUnhandledRejection)

    return () => {
      // Restore original console methods
      console.error = originalError
      console.warn = originalWarn
      
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleUnhandledRejection)
    }
  }, [isRecording])

  const addError = (error: Omit<ErrorLog, 'id' | 'timestamp'>) => {
    const newError: ErrorLog = {
      id: Math.random().toString(36).substr(2, 9),
      timestamp: new Date().toISOString(),
      ...error
    }
    
    setErrors(prev => [newError, ...prev].slice(0, 50)) // Keep last 50 errors
  }

  const extractComponentName = (stack?: string): string | undefined => {
    if (!stack) return undefined
    
    // Try to extract React component name from stack trace
    const componentMatch = stack.match(/at (\w+)/)
    return componentMatch?.[1]
  }

  const clearErrors = () => setErrors([])

  const toggleRecording = () => setIsRecording(prev => !prev)

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  const getLevelColor = (level: ErrorLog['level']) => {
    switch (level) {
      case 'error': return 'text-red-500 bg-red-50 border-red-200'
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200'
      case 'info': return 'text-blue-500 bg-blue-50 border-blue-200'
    }
  }

  const getLevelIcon = (level: ErrorLog['level']) => {
    switch (level) {
      case 'error': return <XCircle className="h-4 w-4" />
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'info': return <CheckCircle className="h-4 w-4" />
    }
  }

  const filteredErrors = errors.filter(error => 
    filter === 'all' || error.level === filter
  )

  const errorCount = errors.filter(e => e.level === 'error').length
  const warningCount = errors.filter(e => e.level === 'warning').length

  return (
    <Card className={cn("w-full", className)}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-yellow-500" />
            Error Monitor
            {errorCount > 0 && (
              <Badge variant="destructive" className="ml-2">
                {errorCount} errors
              </Badge>
            )}
            {warningCount > 0 && (
              <Badge variant="secondary" className="ml-1 bg-yellow-100 text-yellow-800">
                {warningCount} warnings
              </Badge>
            )}
          </CardTitle>
          
          <div className="flex items-center gap-2">
            <div className="flex bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setFilter('all')}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-colors",
                  filter === 'all' ? "bg-white shadow-sm" : "hover:bg-gray-200"
                )}
              >
                All ({errors.length})
              </button>
              <button
                onClick={() => setFilter('error')}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-colors",
                  filter === 'error' ? "bg-white shadow-sm" : "hover:bg-gray-200"
                )}
              >
                Errors ({errorCount})
              </button>
              <button
                onClick={() => setFilter('warning')}
                className={cn(
                  "px-3 py-1 text-xs rounded transition-colors",
                  filter === 'warning' ? "bg-white shadow-sm" : "hover:bg-gray-200"
                )}
              >
                Warnings ({warningCount})
              </button>
            </div>
            
            <Button
              onClick={toggleRecording}
              variant="outline"
              size="sm"
              className={cn(
                "flex items-center gap-2",
                isRecording ? "text-green-600 border-green-300" : "text-gray-600"
              )}
            >
              {isRecording ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              {isRecording ? 'Recording' : 'Stopped'}
            </Button>
            
            <Button
              onClick={clearErrors}
              variant="outline"
              size="sm"
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Clear
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {filteredErrors.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            {isRecording ? (
              <>
                <CheckCircle className="h-12 w-12 mx-auto mb-2 text-green-500" />
                <p>No {filter === 'all' ? '' : filter + ' '}errors detected</p>
                <p className="text-xs">Monitoring in real-time...</p>
              </>
            ) : (
              <>
                <EyeOff className="h-12 w-12 mx-auto mb-2 text-gray-400" />
                <p>Error monitoring is stopped</p>
                <p className="text-xs">Click "Recording" to start monitoring</p>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {filteredErrors.map((error) => (
              <div
                key={error.id}
                className={cn(
                  "p-3 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50",
                  getLevelColor(error.level)
                )}
                onClick={() => setShowDetails(showDetails === error.id ? null : error.id)}
              >
                <div className="flex items-start gap-3">
                  {getLevelIcon(error.level)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-xs font-medium uppercase tracking-wide">
                        {error.level}
                      </span>
                      <span className="text-xs text-gray-500">
                        {formatTime(error.timestamp)}
                      </span>
                      {error.component && (
                        <Badge variant="outline" className="text-xs">
                          {error.component}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm break-words">
                      {error.message.length > 150 && showDetails !== error.id
                        ? `${error.message.substring(0, 150)}...`
                        : error.message
                      }
                    </p>
                    
                    {showDetails === error.id && (
                      <div className="mt-3 space-y-2 text-xs">
                        {error.url && (
                          <div>
                            <strong>URL:</strong> {error.url}
                          </div>
                        )}
                        {error.stack && (
                          <div>
                            <strong>Stack Trace:</strong>
                            <pre className="mt-1 p-2 bg-gray-100 rounded text-xs overflow-x-auto">
                              {error.stack}
                            </pre>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
