import { PublicChatbot } from '@/components/public-chatbot'

export const dynamic = 'force-dynamic'

export default async function PublicChatbotPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <PublicChatbot slug={slug} />
}
