import type { MetadataRoute } from 'next'

export default function sitemap(): MetadataRoute.Sitemap {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://docmind.app'

  return [
    {
      url: appUrl,
      changeFrequency: 'weekly',
      priority: 1,
    },
  ]
}
