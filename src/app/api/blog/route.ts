import { NextRequest } from 'next/server'
import { db } from '@/lib/db'
import { getSessionUser } from '@/lib/auth'
import { randomUUID } from 'crypto'

/** GET ?slug=.. (public single +view) | ?all=1 (admin) | (published list) */
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams
  const slug = sp.get('slug')

  if (slug) {
    const post = await db.blogPost.update({
      where: { slug },
      data: { views: { increment: 1 } },
      include: { author: { select: { name: true, avatar: true } } },
    })
    return Response.json({ ok: true, post })
  }

  const session = await getSessionUser()
  const all = sp.get('all') === '1' && session?.role === 'ADMIN'
  const posts = await db.blogPost.findMany({
    where: all ? {} : { published: true },
    include: { author: { select: { name: true, avatar: true } } },
    orderBy: { createdAt: 'desc' },
  })
  return Response.json({ ok: true, posts })
}

export async function POST(req: NextRequest) {
  const session = await getSessionUser()
  if (session?.role !== 'ADMIN') return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
  const { title, excerpt, content, category, tags, cover, readTime, published } = await req.json()
  if (!title || !content) return Response.json({ ok: false, error: 'عنوان و متن الزامی است' }, { status: 400 })
  const slug = (title.replace(/\s+/g, '-').replace(/[^\w\u0600-\u06FF-]/g, '') || 'post').slice(0, 60) + '-' + randomUUID().slice(0, 5)
  const post = await db.blogPost.create({
    data: { slug, title, excerpt: excerpt || content.slice(0, 150), content, category: category || 'عمومی', tags, cover: cover || 'teal', readTime: readTime || 5, published: !!published, authorId: session.id },
    include: { author: { select: { name: true } } },
  })
  return Response.json({ ok: true, post })
}

export async function PATCH(req: NextRequest) {
  const session = await getSessionUser()
  if (session?.role !== 'ADMIN') return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
  const { id, ...data } = await req.json()
  const post = await db.blogPost.update({ where: { id }, data })
  return Response.json({ ok: true, post })
}

export async function DELETE(req: NextRequest) {
  const session = await getSessionUser()
  if (session?.role !== 'ADMIN') return Response.json({ ok: false, error: 'دسترسی غیرمجاز' }, { status: 403 })
  const id = req.nextUrl.searchParams.get('id')
  if (!id) return Response.json({ ok: false, error: 'شناسه الزامی است' }, { status: 400 })
  await db.blogPost.delete({ where: { id } })
  return Response.json({ ok: true })
}
