import type { MetadataRoute } from 'next'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nobatyar.ir'

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: ['/api/'] },
      { userAgent: 'GPTBot', allow: '/' },
      { userAgent: 'Google-Extended', allow: '/' },
    ],
    sitemap: `${SITE}/sitemap.xml`,
  }
}
