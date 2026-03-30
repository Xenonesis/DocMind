'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Separator } from '@/components/ui/separator'
import { Checkbox } from '@/components/ui/checkbox'
import { Eye, EyeOff, Mail, Lock, User, Github, Chrome, AlertCircle } from 'lucide-react'
import { useAuth } from '@/lib/auth-context'

interface SignupModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSwitchToLogin?: () => void
}

export function SignupModal({ open, onOpenChange, onSwitchToLogin }: SignupModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: ''
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [acceptTerms, setAcceptTerms] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const { signup, loginWithProvider } = useAuth()

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      setIsLoading(false)
      return
    }

    if (!acceptTerms) {
      setError('Please accept the terms and conditions')
      setIsLoading(false)
      return
    }

    try {
      await signup(formData.email, formData.password, formData.name)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSocialSignup = async (provider: 'google' | 'github') => {
    setIsLoading(true)
    setError('')
    
    try {
      await loginWithProvider(provider)
      onOpenChange(false)
    } catch (err: any) {
      setError(err.message || 'Social signup failed. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md mx-4 max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto border-border rounded-2xl shadow-lg bg-card p-0">
        <DialogHeader className="p-6 pb-2">
          <DialogTitle className="text-xl sm:text-2xl font-semibold text-center tracking-tight">Create an account</DialogTitle>
          <DialogDescription className="text-center text-muted-foreground">
            Get started with DocMind today
          </DialogDescription>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6 p-6 pt-4"
        >
          <div className="space-y-3">
            <Button
              variant="outline"
              className="w-full rounded-xl shadow-sm h-11 transition-colors"
              onClick={() => handleSocialSignup('google')}
              disabled={isLoading}
            >
              <Chrome className="w-5 h-5 mr-3 text-muted-foreground" />
              Continue with Google
            </Button>
            <Button
              variant="outline"
              className="w-full rounded-xl shadow-sm h-11 transition-colors"
              onClick={() => handleSocialSignup('github')}
              disabled={isLoading}
            >
              <Github className="w-5 h-5 mr-3 text-muted-foreground" />
              Continue with GitHub
            </Button>
          </div>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <Separator className="w-full border-t border-border/50" />
            </div>
            <div className="relative flex justify-center text-xs font-medium">
              <span className="bg-card px-4 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="name">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className="pl-10 rounded-xl bg-background border-border text-foreground h-11 focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email">Email address</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="name@company.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  className="pl-10 rounded-xl bg-background border-border text-foreground h-11 focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={(e) => handleInputChange('password', e.target.value)}
                  className="pl-10 pr-11 rounded-xl bg-background border-border text-foreground h-11 focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1.5 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="confirmPassword">Confirm Password</Label>
              <div className="relative">
                <Lock className="absolute left-3.5 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.confirmPassword}
                  onChange={(e) => handleInputChange('confirmPassword', e.target.value)}
                  className="pl-10 pr-11 rounded-xl bg-background border-border text-foreground h-11 focus-visible:ring-1 focus-visible:ring-primary shadow-sm"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1.5 h-8 w-8 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  aria-label={showConfirmPassword ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex items-start space-x-3 pt-3">
              <Checkbox
                id="terms"
                checked={acceptTerms}
                onCheckedChange={(checked) => setAcceptTerms(checked as boolean)}
                className="mt-0.5 rounded shadow-sm border-muted-foreground/30 data-[state=checked]:bg-primary"
              />
              <Label htmlFor="terms" className="text-xs text-muted-foreground leading-snug">
                I agree to the{' '}
                <a href="#" className="font-medium text-primary hover:underline">
                  Terms of Service
                </a>{' '}
                and{' '}
                <a href="#" className="font-medium text-primary hover:underline">
                  Privacy Policy
                </a>
              </Label>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-sm font-medium text-rose-600 bg-rose-50 dark:bg-rose-900/10 p-3 rounded-lg border border-rose-100 dark:border-rose-900/50 mt-4" role="alert" aria-live="assertive">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <p>{error}</p>
              </div>
            )}

            <Button type="submit" className="w-full rounded-xl shadow-sm h-11 font-medium mt-4" disabled={isLoading}>
              {isLoading ? 'Creating account...' : 'Create account'}
            </Button>
          </form>

          <div className="text-center text-sm text-muted-foreground pt-2">
            Already have an account?{' '}
            <button
              type="button"
              onClick={() => {
                onOpenChange(false)
                onSwitchToLogin?.()
              }}
              className="text-primary hover:underline underline-offset-4 font-medium"
            >
              Sign in
            </button>
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  )
}