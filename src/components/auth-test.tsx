'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useAuth } from '@/lib/auth-context'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import { CheckCircle, XCircle, User, Mail, LogOut } from 'lucide-react'

export function AuthTest() {
  const { user, isAuthenticated, logout, isLoading } = useAuth()
  const [testResult, setTestResult] = useState<string>('')
  const [testing, setTesting] = useState(false)

  const testSupabaseConnection = async () => {
    setTesting(true)
    setTestResult('')
    
    try {
      if (!supabase) {
        setTestResult('❌ Supabase client not initialized')
        return
      }

      // Test basic connection
      const { data, error } = await supabase.auth.getSession()
      
      if (error) {
        setTestResult(`❌ Supabase connection error: ${error.message}`)
        return
      }

      setTestResult('✅ Supabase connection successful')
    } catch (error: any) {
      setTestResult(`❌ Test failed: ${error.message}`)
    } finally {
      setTesting(false)
    }
  }

  if (isLoading) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardContent className="pt-6">
          <div className="text-center">Loading auth state...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="w-5 h-5" />
          Authentication Status
        </CardTitle>
        <CardDescription>
          Current Supabase authentication state
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Configuration Status */}
        <div className="flex items-center justify-between">
          <span>Supabase Configured:</span>
          {isSupabaseConfigured ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Yes
            </Badge>
          ) : (
            <Badge variant="destructive">
              <XCircle className="w-3 h-3 mr-1" />
              No
            </Badge>
          )}
        </div>

        {/* Authentication Status */}
        <div className="flex items-center justify-between">
          <span>Authenticated:</span>
          {isAuthenticated ? (
            <Badge variant="default" className="bg-green-100 text-green-800">
              <CheckCircle className="w-3 h-3 mr-1" />
              Yes
            </Badge>
          ) : (
            <Badge variant="secondary">
              <XCircle className="w-3 h-3 mr-1" />
              No
            </Badge>
          )}
        </div>

        {/* User Info */}
        {user && (
          <div className="space-y-2 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span className="font-medium">{user.name}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              <span className="text-sm text-gray-600 dark:text-gray-400">{user.email}</span>
            </div>
            <div className="text-xs text-gray-500">
              ID: {user.id}
            </div>
          </div>
        )}

        {/* Test Connection */}
        <div className="space-y-2">
          <Button 
            onClick={testSupabaseConnection} 
            disabled={testing}
            variant="outline"
            className="w-full"
          >
            {testing ? 'Testing...' : 'Test Supabase Connection'}
          </Button>
          
          {testResult && (
            <div className="text-sm p-2 bg-gray-50 dark:bg-gray-800 rounded">
              {testResult}
            </div>
          )}
        </div>

        {/* Logout Button */}
        {isAuthenticated && (
          <Button 
            onClick={logout} 
            variant="destructive" 
            className="w-full"
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        )}

        {/* Environment Info */}
        <div className="text-xs text-gray-500 space-y-1">
          <div>URL: {process.env.NEXT_PUBLIC_SUPABASE_URL ? '✅ Set' : '❌ Missing'}</div>
          <div>Anon Key: {process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ Set' : '❌ Missing'}</div>
        </div>
      </CardContent>
    </Card>
  )
}