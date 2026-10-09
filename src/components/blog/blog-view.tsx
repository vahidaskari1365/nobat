'use client'

import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowRight, Clock3, Eye, CalendarDays, Search, Newspaper } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { useApp } from '@/lib/store'
import { api } from '@/components/shared/api'
import { BlogCover } from '@/components/landing/landing'
import { Reveal } from '@/components/shared/motion'
import { formatJalali, faDigits } from '@/lib/persian'
import { Skeleton } from '@/components/ui/skeleton'
import { Spinner } from '@/components/panels/panel-helpers'

/* ============ Blog list ============ */
export function BlogView() {
  const [posts, setPosts] = useState<any[] | null>(null)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState('همه')
  const { setView } = useApp()

  useEffect(() => { api('/api/blog').then((r) => setPosts(r.posts ?? [])).catch(() => setPosts([])) }, [])

  const cats = ['همه', ...Array.from(new Set((posts ?? []).map((p) => p.category)))]
  const filtered = (posts ?? []).filter((p) => (cat === 'همه' || p.category === cat) && (!q || p.title.includes(q)))

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <Reveal>
          <div className="max-w-2xl mb-10">
            <span className="inline-flex items-center gap-2 text-sm font-semibold text-primary bg-primary/10 border border-primary/20 rounded-full px-4 py-1.5 mb-4">
              <Newspaper className="size-4" /> بلاگ سلامت
            </span>
            <h1 className="text-3xl md:text-5xl font-black tracking-tight leading-tight">دانش سلامت، به زبان شما</h1>
            <p className="text-muted-foreground leading-relaxed mt-4">
              مقالات علمی و کاربردی پزشکی که توسط تیم تخصصی نوبت‌یار تهیه و بازبینی می‌شوند.
            </p>
          </div>
        </Reveal>

        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="جستجوی مقاله…" className="pr-10 rounded-xl h-11" />
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 nice-scroll">
            {cats.map((c) => (
              <button key={c} onClick={() => setCat(c)}
                className={`shrink-0 rounded-full px-4 py-2 text-xs font-bold border transition-all ${cat === c ? 'bg-primary text-primary-foreground border-primary shadow-md shadow-primary/25' : 'hover:border-primary/50'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {posts === null ? <Spinner /> : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((p, i) => (
              <Reveal key={p.id} delay={i * 0.06}>
                <motion.article whileHover={{ y: -6 }} transition={{ type: 'spring', stiffness: 300, damping: 20 }}>
                  <button onClick={() => setView({ type: 'blog-post', slug: p.slug })} className="text-right w-full">
                    <Card className="h-full overflow-hidden border hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10 transition-all">
                      <BlogCover cover={p.cover} category={p.category} />
                      <CardContent className="p-5">
                        <h2 className="font-extrabold leading-snug line-clamp-2 min-h-14">{p.title}</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed mt-2 line-clamp-3">{p.excerpt}</p>
                        <div className="flex items-center justify-between mt-4 pt-4 border-t text-xs text-muted-foreground">
                          <span className="inline-flex items-center gap-1"><Eye className="size-3.5" />{faDigits(p.views)} بازدید</span>
                          <span className="inline-flex items-center gap-1"><Clock3 className="size-3.5" />{faDigits(p.readTime)} دقیقه</span>
                          <span>{formatJalali(p.createdAt, { short: true })}</span>
                        </div>
                      </CardContent>
                    </Card>
                  </button>
                </motion.article>
              </Reveal>
            ))}
            {!filtered.length && <div className="col-span-full py-20 text-center text-muted-foreground">مقاله‌ای یافت نشد</div>}
          </div>
        )}
      </div>
    </div>
  )
}

/* ============ Single post ============ */
export function BlogPostView({ slug }: { slug: string }) {
  const [post, setPost] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const { setView } = useApp()

  useEffect(() => {
    api(`/api/blog?slug=${slug}`).then((r) => setPost(r.post)).catch(() => {}).finally(() => setLoading(false))
  }, [slug])

  if (loading) return <div className="pt-40 pb-40"><Spinner label="در حال بارگذاری مقاله…" /></div>
  if (!post) return (
    <div className="pt-40 pb-40 text-center">
      <h1 className="text-2xl font-extrabold mb-4">مقاله یافت نشد</h1>
      <Button onClick={() => setView({ type: 'blog' })} className="rounded-xl"><ArrowRight className="size-4" /> بازگشت به بلاگ</Button>
    </div>
  )

  const blocks = post.content.split('\n\n')

  return (
    <div className="pt-28 pb-24 min-h-dvh">
      <article className="max-w-3xl mx-auto px-4 sm:px-6" itemScope itemType="https://schema.org/BlogPosting">
        <button onClick={() => setView({ type: 'blog' })} className="inline-flex items-center gap-1.5 text-sm text-primary font-bold hover:underline mb-6">
          <ArrowRight className="size-4" /> بازگشت به بلاگ
        </button>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
          <div className="rounded-3xl overflow-hidden mb-8 relative">
            <BlogCover cover={post.cover} />
            <h1 className="absolute bottom-0 inset-x-0 p-8 text-2xl md:text-4xl font-black text-white leading-tight" itemProp="headline">
              {post.title}
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground border-y py-4 mb-8">
            <span className="flex items-center gap-2">
              <Avatar className="size-8"><AvatarFallback className="bg-primary/10 text-primary font-bold text-xs">{post.author?.name?.[0]}</AvatarFallback></Avatar>
              {post.author?.name}
            </span>
            <span className="inline-flex items-center gap-1.5"><CalendarDays className="size-4" />{formatJalali(post.createdAt, { withWeekday: true })}</span>
            <span className="inline-flex items-center gap-1.5"><Clock3 className="size-4" />{faDigits(post.readTime)} دقیقه مطالعه</span>
            <span className="inline-flex items-center gap-1.5"><Eye className="size-4" />{faDigits(post.views)} بازدید</span>
            <Badge variant="secondary" className="mr-auto">{post.category}</Badge>
          </div>

          <div className="prose-fa" itemProp="articleBody">
            {blocks.map((block: string, i: number) => {
              const text = block.trim()
              if (!text) return null
              if (text.startsWith('## ')) return <h2 key={i} className="flex items-center gap-2"><span className="w-1.5 h-6 rounded-full bg-primary" />{text.replace('## ', '')}</h2>
              return <p key={i}>{text}</p>
            })}
          </div>

          <div className="mt-10 rounded-2xl bg-gradient-to-l from-primary/10 to-accent/10 border border-primary/20 p-6 flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-52">
              <h3 className="font-extrabold mb-1">نیاز به مشاوره دارید؟</h3>
              <p className="text-sm text-muted-foreground">همین حالا با پزشکان متخصص نوبت‌یار گفتگو کنید.</p>
            </div>
            <Button onClick={() => setView({ type: 'booking' })} className="rounded-xl shadow-lg shadow-primary/25">رزرو نوبت</Button>
          </div>
        </motion.div>
      </article>
    </div>
  )
}
