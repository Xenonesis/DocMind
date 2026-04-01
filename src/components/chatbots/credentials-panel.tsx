'use client'

import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { BookOpen, ExternalLink, Terminal } from 'lucide-react'

interface CredentialsPanelProps {
  generatedToken: string
  generatedApiKey: string
  generatedSlug: string
  previewUrl: string
  previewName: string
  onCopyText: (value: string, label: string) => void
}

export function CredentialsPanel({
  generatedToken,
  generatedApiKey,
  generatedSlug,
  previewUrl,
  previewName,
  onCopyText,
}: CredentialsPanelProps) {
  const origin = typeof window !== 'undefined' ? window.location.origin : ''

  if (!generatedToken && !generatedApiKey) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Latest Generated Credentials</CardTitle>
        <CardDescription>Save these values securely. Sensitive values are shown only once.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {generatedToken && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Hosted URL with Embed Token</Label>
              <div className="flex gap-2">
                <Input value={generatedToken} readOnly />
                <Button variant="outline" onClick={() => onCopyText(generatedToken, 'Embed URL')}>Copy</Button>
                <Button variant="outline" onClick={() => window.open(generatedToken, '_blank', 'noopener,noreferrer')}>
                  <ExternalLink className="w-4 h-4 mr-2" /> Open
                </Button>
              </div>
            </div>

            <div className="space-y-2 p-4 bg-muted/50 rounded-md relative text-sm border">
              <h4 className="font-semibold mb-2 flex items-center">
                <BookOpen className="w-4 h-4 mr-2" />
                How to integrate (Embed)
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                <li>Copy your customized embed URL (includes your token).</li>
                <li>Add an <code>iframe</code> directly to your website.</li>
              </ol>
              <pre className="p-3 mt-3 bg-secondary/30 border rounded overflow-x-auto text-xs font-mono text-secondary-foreground">
                {`<iframe src="${generatedToken}" width="100%" height="600px" frameBorder="0" style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>`}
              </pre>
              
              <Button 
                className="absolute top-3 right-3 h-8"
                variant="outline" 
                size="sm"
                onClick={() => onCopyText(`### Embed Instructions\n\n1. Copy your customized embed URL: \`${generatedToken}\`\n2. Add the following \`iframe\` code to your website:\n\n\`\`\`html\n<iframe src="${generatedToken}" width="100%" height="600px" frameBorder="0" style="border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1);"></iframe>\n\`\`\`\n`, 'Markdown Instructions')}
              >
                Copy as Markdown
              </Button>
            </div>
          </div>
        )}

        {previewUrl && (
          <div className="space-y-3 pt-2">
            <div className="rounded-md border bg-muted/30 p-3">
              <p className="text-sm font-medium">Live Tryout: {previewName || generatedSlug}</p>
              <p className="text-xs text-muted-foreground">This is exactly what your website visitors will see inside an embed iframe.</p>
            </div>
            <div className="border rounded-xl overflow-hidden bg-background shadow-sm">
              <iframe
                src={previewUrl}
                title="Live chatbot preview"
                className="w-full h-[640px]"
                loading="lazy"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
        )}

        {generatedApiKey && (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>REST API Key</Label>
              <div className="flex gap-2">
                <Input value={generatedApiKey} readOnly />
                <Button variant="outline" onClick={() => onCopyText(generatedApiKey, 'API key')}>Copy</Button>
              </div>
            </div>
          </div>
        )}

        {generatedApiKey && generatedSlug && (
          <div className="space-y-4 pt-2">
            <div className="space-y-2 p-4 bg-muted/50 rounded-md relative text-sm border">
              <h4 className="font-semibold mb-2 flex items-center">
                <Terminal className="w-4 h-4 mr-2" />
                How to integrate (REST API)
              </h4>
              <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
                <li>Send a POST request to <code>/api/chatbots/runtime/query</code>.</li>
                <li>Include your secure API Key in the <code>x-api-key</code> header.</li>
                <li>Pass the bot's <code>slug</code> parameter alongside the user's <code>query</code>.</li>
                <li>Optional: add <code>"stream": true</code> for SSE chunked responses.</li>
              </ol>
              <pre className="p-3 mt-3 bg-secondary/30 border rounded overflow-x-auto text-xs font-mono text-secondary-foreground">
{`curl -X POST "${origin || 'https://your-domain.com'}/api/chatbots/runtime/query" \\
  -N \\
  -H "Content-Type: application/json" \\
  -H "x-api-key: ${generatedApiKey}" \\
  -d '{"slug":"${generatedSlug}","query":"Summarize key points from linked documents","stream":true}'`}
              </pre>

              <Button 
                className="absolute top-3 right-3 h-8"
                variant="outline" 
                size="sm"
                onClick={() => onCopyText(`### API Integration Instructions\n\n1. Send a POST request to \`/api/chatbots/runtime/query\`.\n2. Include your secure API Key in the \`x-api-key\` header.\n3. Pass the bot's \`slug\` parameter alongside the user's \`query\`.\n4. Optional: set \`stream\` to \`true\` for SSE chunked responses.\n\n#### cURL Example:\n\`\`\`bash\ncurl -X POST "${typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com'}/api/chatbots/runtime/query" \\\n+  -N \\\n+  -H "Content-Type: application/json" \\\n+  -H "x-api-key: ${generatedApiKey}" \\\n+  -d '{"slug":"${generatedSlug}","query":"Summarize key points from linked documents","stream":true}'\n\`\`\`\n`, 'Markdown Instructions')}
              >
                Copy as Markdown
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
