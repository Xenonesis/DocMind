'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Database, Shield, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'
import { LoginModal } from '@/components/auth/login-modal'
import { SignupModal } from '@/components/auth/signup-modal'

export function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showSignupModal, setShowSignupModal] = useState(false)

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      setShowSignupModal(true)
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-primary/20 selection:text-foreground flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-md border-b border-border px-6 py-4 flex justify-between items-center transition-all">
        <div className="flex items-center gap-3">
          <div className="relative w-8 h-8 rounded-lg overflow-hidden shrink-0 shadow-sm border border-primary/20 bg-background/50 flex items-center justify-center">
            <Image src="/logo.png" alt="DocMind Logo" fill sizes="40px" className="object-cover" priority />
          </div>
          <span className="text-xl font-bold tracking-tight">DocMind</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          {!user && (
            <Button 
              variant="ghost" 
              onClick={() => setShowLoginModal(true)}
              className="font-medium rounded-full px-4 hidden sm:inline-flex"
            >
              Log in
            </Button>
          )}
          <Button 
            onClick={handleGetStarted}
            className="font-medium rounded-full px-6 shadow-sm hover:shadow-md transition-all"
          >
            {user ? 'Go to Dashboard' : 'Get Started'}
          </Button>
        </div>
      </header>

      <main className="pt-32 pb-24 px-6 max-w-7xl mx-auto flex flex-col gap-24 flex-grow">
        <section className="flex flex-col items-center text-center gap-8 mt-12">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <div className="border border-border bg-secondary/50 text-foreground px-4 py-1.5 rounded-full text-sm font-medium inline-flex items-center gap-2 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              Platform v1.0 is now live
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-5xl md:text-7xl font-bold tracking-tight text-balance max-w-4xl"
          >
            Intelligent document processing for modern teams.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-lg md:text-xl text-muted-foreground max-w-2xl text-balance"
          >
            Unlock the intelligence hidden within your files. Seamlessly extract data, summarize content, and query complex documents using advanced AI.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex gap-4 mt-4"
          >
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="text-base px-8 py-6 rounded-full font-medium shadow-md hover:shadow-lg transition-all group"
            >
              Start for free
              <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Button>
            <Button 
              size="lg"
              variant="outline"
              className="text-base px-8 py-6 rounded-full font-medium"
            >
              View demo
            </Button>
          </motion.div>
        </section>

        <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-16">
          {[
            { icon: FileText, title: 'Universal Support', desc: 'Securely upload PDFs, Word documents, text files, and images.' },
            { icon: Database, title: 'Semantic Querying', desc: 'Find exact answers within complex documents instantly using natural language.' },
            { icon: Zap, title: 'High Performance', desc: 'Powered by highly optimized state-of-the-art vector processing.' },
            { icon: Shield, title: 'Enterprise Security', desc: 'Your data is encrypted and strictly isolated within your workspace.' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border border-border bg-card rounded-2xl p-6 shadow-sm hover:shadow-md transition-all group"
            >
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center mb-6 text-primary group-hover:scale-110 transition-transform">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
              <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="border-t border-border bg-card/50 text-muted-foreground py-8 text-center text-sm">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="relative w-5 h-5 rounded overflow-hidden shrink-0 border border-primary/20 bg-background/50 flex items-center justify-center">
              <Image src="/logo.png" alt="DocMind Logo" fill sizes="48px" className="object-cover" />
            </div>
            <span className="font-medium text-foreground">DocMind</span>
          </div>
          <p>© {new Date().getFullYear()} DocMind AI. All rights reserved.</p>
        </div>
      </footer>

      <LoginModal 
        open={showLoginModal} 
        onOpenChange={setShowLoginModal}
        onSwitchToSignup={() => {
          setShowLoginModal(false)
          setShowSignupModal(true)
        }}
      />

      <SignupModal 
        open={showSignupModal} 
        onOpenChange={setShowSignupModal}
        onSwitchToLogin={() => {
          setShowSignupModal(false)
          setShowLoginModal(true)
        }}
      />
    </div>
  )
}
