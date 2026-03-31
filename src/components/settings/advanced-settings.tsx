'use client'

import { motion } from 'framer-motion'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import {
  Save,
  Brain,
  Shield,
  Activity,
  CheckCircle,
} from 'lucide-react'

export function AdvancedSettings() {
  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="p-6 border-b border-border/50 bg-background/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Brain className="w-5 h-5 text-indigo-500" /> System Prompting
          </CardTitle>
          <CardDescription>Configure core behavioral directives for all models</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Base Persona</Label>
            <Textarea
              placeholder="You are a helpful AI assistant that analyzes documents..."
              className="min-h-[120px] bg-background shadow-sm rounded-xl focus-visible:ring-1 focus-visible:ring-primary resize-none"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Timeout (sec)</Label>
              <Input type="number" defaultValue="30" min="5" max="300" className="bg-background rounded-xl shadow-sm" />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Retries</Label>
              <Input type="number" defaultValue="3" min="1" max="10" className="bg-background rounded-xl shadow-sm" />
            </div>
          </div>

          <div className="space-y-4 pt-2">
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Archival Responses</Label>
                <p className="text-xs text-muted-foreground">Save payloads structurally</p>
              </div>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
              <div className="space-y-0.5">
                <Label className="text-sm font-medium">Vector Caching</Label>
                <p className="text-xs text-muted-foreground">Reuse historical embeddings</p>
              </div>
              <Switch defaultChecked />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-card">
        <CardHeader className="p-6 border-b border-border/50 bg-background/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Shield className="w-5 h-5 text-emerald-500" /> Security Layer
          </CardTitle>
          <CardDescription>Manage keys, data lifecycles, and access</CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">At-Rest Encryption</Label>
              <p className="text-xs text-muted-foreground">Keys undergo AES-256 wrapping</p>
            </div>
            <Badge variant="outline" className="bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 border-none shadow-sm gap-1.5 font-normal">
              <CheckCircle className="w-3.5 h-3.5" /> Enforced
            </Badge>
          </div>

          <div className="space-y-3 p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Lifecycle Policy</Label>
              <p className="text-xs text-muted-foreground mb-3">Retention window for raw logs</p>
            </div>
            <Select defaultValue="30">
              <SelectTrigger className="w-full bg-background rounded-xl shadow-sm h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="7">7 Days (Ephemeral)</SelectItem>
                <SelectItem value="30">30 Days (Standard)</SelectItem>
                <SelectItem value="90">90 Days (Compliance)</SelectItem>
                <SelectItem value="365">365 Days (Archival)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Telemetry Sharing</Label>
              <p className="text-xs text-muted-foreground">Submit anonymous operational data</p>
            </div>
            <Switch />
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-sm border-border bg-card lg:col-span-2">
        <CardHeader className="p-6 border-b border-border/50 bg-background/50">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-500" /> Operations Center
          </CardTitle>
          <CardDescription>Pipeline monitoring and resource throttles</CardDescription>
        </CardHeader>
        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Concurrency Cap</Label>
            <div className="flex items-center gap-3">
              <Input type="number" defaultValue="5" min="1" max="20" className="w-24 bg-background rounded-xl shadow-sm" />
              <span className="text-sm text-muted-foreground">req/min</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Traffic Shaping</Label>
            <Select defaultValue="balanced">
              <SelectTrigger className="bg-background rounded-xl shadow-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl">
                <SelectItem value="speed">Optimize for Latency</SelectItem>
                <SelectItem value="balanced">Balanced Mode</SelectItem>
                <SelectItem value="quality">Optimize for Payload</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="md:col-span-2 flex items-center justify-between p-4 rounded-xl border border-border/50 bg-secondary/20 hover:bg-secondary/30 transition-colors">
            <div className="space-y-0.5">
              <Label className="text-sm font-medium">Event Stream (SSE)</Label>
              <p className="text-xs text-muted-foreground">Deliver chunks organically as generated</p>
            </div>
            <Switch defaultChecked />
          </div>
        </CardContent>
      </Card>

      <Card className="border border-border/50 bg-primary/5 dark:bg-primary/10 shadow-sm lg:col-span-2 mt-2">
        <CardContent className="p-6 md:p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-semibold text-foreground">Global Registry Commit</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Apply these policies universally across all configured units.
            </p>
          </div>
          <Button className="w-full sm:w-auto shadow-sm px-6 rounded-full font-medium">
            <Save className="w-4 h-4 mr-2" />
            Synchronize
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  )
}
