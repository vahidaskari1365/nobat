import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'نوبت‌یار | پلتفرم نوبت‌دهی پزشکی',
    short_name: 'نوبت‌یار',
    description: 'رزرو آنی نوبت پزشک، ویزیت آنلاین و چت با پزشک',
    start_url: '/',
    display: 'standalone',
    background_color: '#f6fbfb',
    theme_color: '#0891b2',
    dir: 'rtl',
    lang: 'fa-IR',
    orientation: 'portrait',
  }
}
