import type { Metadata, Viewport } from 'next'
import 'vazirmatn/Vazirmatn-font-face.css'
import './globals.css'
import { Toaster } from '@/components/ui/sonner'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || 'https://nobatyar.ir'

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'نوبت‌یار | پلتفرم نوبت‌دهی و ویزیت آنلاین پزشکی',
    template: '%s | نوبت‌یار',
  },
  description:
    'رزرو آنی نوبت پزشک، ویزیت آنلاین تصویری، چت با پزشک، نسخه الکترونیک و پرداخت امن آنلاین. دسترسی ۲۴ ساعته به بیش از ۵۰ تخصص پزشکی در سراسر ایران.',
  keywords: [
    'نوبت دهی آنلاین', 'رزرو نوبت پزشک', 'ویزیت آنلاین', 'مشاوره تلفنی پزشک',
    'نسخه الکترونیک', 'پزشک آنلاین', 'کلینیک آنلاین', 'نوبت پزشک تهران',
    'مشاوره پزشکی آنلاین', 'پرداخت آنلاین ویزیت',
  ],
  authors: [{ name: 'نوبت‌یار' }],
  creator: 'نوبت‌یار',
  applicationName: 'نوبت‌یار',
  alternates: { canonical: '/', languages: { 'fa-IR': '/' } },
  openGraph: {
    type: 'website',
    locale: 'fa_IR',
    url: SITE_URL,
    siteName: 'نوبت‌یار',
    title: 'نوبت‌یار | پلتفرم نوبت‌دهی و ویزیت آنلاین پزشکی',
    description: 'رزرو آنی نوبت پزشک، ویزیت آنلاین تصویری، چت با پزشک و پرداخت امن. سلامتی شما، اولویت ماست.',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'نوبت‌یار | پلتفرم نوبت‌دهی و ویزیت آنلاین پزشکی',
    description: 'رزرو آنی نوبت پزشک، ویزیت آنلاین تصویری، چت با پزشک و پرداخت امن.',
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large', 'max-snippet': -1 },
  },
  category: 'Health',
}

export const viewport: Viewport = {
  themeColor: '#0891B2',
  width: 'device-width',
  initialScale: 1,
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'MedicalBusiness',
      '@id': `${SITE_URL}/#organization`,
      name: 'نوبت‌یار',
      description: 'پلتفرم نوبت‌دهی و ویزیت آنلاین پزشکی',
      url: SITE_URL,
      telephone: '+98-21-91002000',
      priceRange: 'تومان',
      address: { '@type': 'PostalAddress', addressLocality: 'تهران', addressCountry: 'IR' },
      openingHoursSpecification: {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens: '08:00',
        closes: '22:00',
      },
    },
    {
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'نوبت‌یار',
      inLanguage: 'fa-IR',
      publisher: { '@id': `${SITE_URL}/#organization` },
      potentialAction: {
        '@type': 'SearchAction',
        target: { '@type': 'EntryPoint', urlTemplate: `${SITE_URL}/?q={search_term_string}` },
        'query-input': 'required name=search_term_string',
      },
    },
  ],
}

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        {children}
        <Toaster position="top-center" richColors dir="rtl" />
      </body>
    </html>
  )
}
