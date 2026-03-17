'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Eye, EyeOff, Mail, Lock, Github, Chrome } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface LoginModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToSignup?: () => void
}

export function LoginModal({ open, onOpenChange, onSwitchToSignup }: LoginModalProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { login, loginWithProvider } = useAuth()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    try {
      await login(email, password)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError('')
    
    try {
      await loginWithProvider(provider)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Social login failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 max-w-[calc(100vw-2rem)] border-4 border-foreground rounded-none brutal-shadow bg-background p-0 font-mono">
        <DialogHeader className="p-6 border-b-4 border-foreground bg-accent text-white">
          <DialogTitle className="text-xl sm:text-2xl font-black text-center uppercase tracking-widest">SYSTEM_AUTH</DialogTitle>
          <DialogDescription className="text-center text-white/80 font-bold uppercase text-xs">
            Authenticate to access node
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 p-6"
        >
          {/* Social Login */}
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full rounded-none border-4 border-foreground bg-background hover:bg-foreground hover:text-background font-bold uppercase transition-none"
              onClick={() => handleSocialLogin('google')}
              disabled={isLoading}
            >
              <Chrome className="w-5 h-5 mr-2" />
              INIT_GOOGLE_AUTH
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-none border-4 border-foreground bg-background hover:bg-foreground hover:text-background font-bold uppercase transition-none"
              onClick={() => handleSocialLogin('github')}
              disabled={isLoading}
            >
              <Github className="w-5 h-5 mr-2" />
              INIT_GITHUB_AUTH
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full border-t-4 border-foreground" />
            </div>
            <div className="relative flex justify-center text-xs uppercase font-black">
              <span className="bg-background px-4 text-foreground border-4 border-foreground brutal-shadow-sm">OR_MANUAL_ENTRY</span>
            </div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="email" className="font-black uppercase text-sm">USER_IDENTIFIER</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-5 w-5 text-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@domain.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-12 rounded-none border-4 border-foreground bg-background text-foreground h-12 font-bold focus-visible:ring-0 focus-visible:border-accent"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="font-black uppercase text-sm">ACCESS_CODE</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-3 h-5 w-5 text-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-12 pr-12 rounded-none border-4 border-foreground bg-background text-foreground h-12 font-bold focus-visible:ring-0 focus-visible:border-accent"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-foreground hover:text-background rounded-none"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </Button>
              </div>
            </div>

            {error && (
              <div className="text-sm font-bold uppercase text-destructive-foreground bg-destructive border-4 border-foreground p-3 brutal-shadow-sm">
                &gt; ERROR: {error}
              </div>
            )}

            <Button type="submit" className="w-full rounded-none border-4 border-foreground bg-foreground text-background hover:bg-accent hover:text-white font-black uppercase text-lg h-14 transition-none" disabled={isLoading}>
              {isLoading ? 'AUTHENTICATING...' : 'AUTHORIZE_ACCESS'}
            </Button>
          </form>

          <div className="text-center text-sm font-bold uppercase">
            <a href="#" className="text-accent hover:underline underline-offset-4 decoration-2">
              RECOVER_CREDENTIALS
            </a>
          </div>

          <div className="text-center text-sm font-bold uppercase text-foreground/70">
            NO_ACCESS_PROFILE?{' '}
            <button
              onClick={() => {
                onOpenChange(false)
                onSwitchToSignup?.()
              }}
              className="text-foreground hover:bg-foreground hover:text-background px-2 py-1 transition-none"
            >
              REQUEST_ACCESS
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}