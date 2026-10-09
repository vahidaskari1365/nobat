import type { MetadataRoute } from 'next'
import { db } from '@/lib/db'

const SITE = process.env.NEXT_PUBLIC_SITE_URL || 'https://nobatyar.ir'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let posts: { slug: string; updatedAt: Date }[] = []
  try {
    posts = await db.blogPost.findMany({ where: { published: true }, select: { slug: true, updatedAt: true } })
  } catch {}

  return [
    { url: SITE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${SITE}/#booking`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE}/#blog`, lastModified: new Date(), changeFrequency: 'daily', priority: 0.8 },
    ...posts.map((p) => ({
      url: `${SITE}/blog/${p.slug}`,
      lastModified: p.updatedAt,
      changeFrequency: 'weekly' as const,
      priority: 0.6,
    })),
  ]
}
