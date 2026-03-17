'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useAuth } from '@/lib/auth-context'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { ArrowRight, FileText, Terminal, Shield, Zap } from 'lucide-react'
import { ThemeToggle } from '@/components/ui/theme-toggle'

export function LandingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
  }, [])

  const handleGetStarted = () => {
    if (user) {
      router.push('/dashboard')
    } else {
      router.push('/auth')
    }
  }

  if (!isClient) return null

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white">
      {/* Brutalist Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-background border-b-4 border-border px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-foreground brutal-shadow" />
          <span className="text-2xl font-black tracking-tighter uppercase">DocMind.SYS</span>
        </div>
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <Button 
            onClick={handleGetStarted}
            className="uppercase font-bold tracking-widest bg-accent text-white hover:bg-foreground hover:text-background transition-colors rounded-none brutal-shadow border-2 border-border"
          >
            {user ? 'ENTER_SYSTEM' : 'INIT_LOGIN'}
          </Button>
        </div>
      </header>

      {/* Main Hero */}
      <main className="pt-32 pb-16 px-6 max-w-7xl mx-auto flex flex-col gap-24">
        <section className="flex flex-col gap-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="inline-block"
          >
            <div className="border-4 border-foreground bg-accent text-white px-4 py-2 font-mono text-sm uppercase tracking-widest inline-flex w-fit brutal-shadow">
              SYSTEM_STATUS: ONLINE V.1.0.0
            </div>
          </motion.div>

          <motion.h1 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="text-7xl md:text-9xl font-black uppercase leading-[0.85] tracking-tighter"
          >
            EXTRACT <br/>
            ANALYZE <br/>
            DOMINATE.
          </motion.h1>

          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="font-mono text-xl md:text-2xl max-w-2xl border-l-4 border-accent pl-6 py-2"
          >
            Raw intelligence extraction for your documents. 
            No fluff. No standard UI. Just pure data manipulation and semantic querying.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Button 
              size="lg"
              onClick={handleGetStarted}
              className="text-xl px-12 py-8 bg-foreground text-background uppercase font-black tracking-widest hover:bg-accent hover:text-white brutal-shadow border-4 border-foreground group"
            >
              INITIALIZE_SCAN
              <ArrowRight className="ml-4 w-6 h-6 group-hover:translate-x-2 transition-transform" />
            </Button>
          </motion.div>
        </section>

        {/* Brutalist Grid Section */}
        <section className="grid grid-cols-1 md:grid-cols-2 gap-8 border-t-4 border-border pt-16">
          {[
            { icon: FileText, title: 'RAW_INGESTION', desc: 'Feed the system PDFs, Word docs, text files. It eats everything.' },
            { icon: Terminal, title: 'SEMANTIC_QUERY', desc: 'Interrogate your data via command line logic.' },
            { icon: Zap, title: 'HYPER_PROCESSING', desc: 'Powered by state-of-the-art LLM vectorization.' },
            { icon: Shield, title: 'SECURE_VAULT', desc: 'Your documents locked behind standard-compliant auth.' }
          ].map((feature, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="border-4 border-foreground bg-background p-8 brutal-shadow hover:bg-accent hover:text-white transition-colors group"
            >
              <feature.icon className="w-12 h-12 mb-6 group-hover:animate-pulse" />
              <h3 className="text-2xl font-black uppercase mb-4">{feature.title}</h3>
              <p className="font-mono text-lg opacity-80">{feature.desc}</p>
            </motion.div>
          ))}
        </section>
      </main>

      <footer className="border-t-4 border-border bg-foreground text-background p-6 text-center font-mono uppercase text-sm mt-32">
        DOCMIND.SYS // END_OF_FILE // © {new Date().getFullYear()}
      </footer>
    </div>
  )
}
