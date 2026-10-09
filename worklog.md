# Worklog

---
Task ID: 1
Agent: Super Z (main)
Task: نصب اسکیل‌های GitHub درخواستی و ساخت پلتفرم نوبت‌دهی و ویزیت آنلاین پزشکی (نوبت‌یار)

Work Log:
- کلون و نصب ۷ اسکیل درخواستی در /home/z/my-project/skills/: taste-skill-plugin، impeccable، playwright-cli، awesome-design-md، img2threejs، ui-ux-pro-max-skill، claude-seo
- مطالعه راهنمای اسکیل‌ها: taste-skill (motion 6 سینمایی، ممنوعیت بنفش AI، split hero، anti-emoji)، ui-ux-pro-max (پالت Medical Teal #0891B2 + سبز #16A34A، استایل Minimalism Swiss + Accessible)، claude-seo (schema.org، sitemap، technical SEO)
- راه‌اندازی محیط fullstack-dev (Next.js 16 + TypeScript + Tailwind 4 + shadcn/ui + Prisma/SQLite)
- نصب پکیج‌ها: socket.io، socket.io-client، jsonwebtoken، bcryptjs، jalaali-js، vazirmatn
- طراحی کامل دیتابیس Prisma: User (۴ نقش)، DoctorProfile، PatientProfile، SecretaryProfile، Specialty، Schedule، Appointment، Payment، Prescription، Review، Conversation، ChatMessage، BlogPost، Notification
- Seed داده‌های فارسی: ۴ پزشک، ۸ تخصص، ۵ مقاله بلاگ کامل، ۷ نوبت، ۵ نظر، اکانت‌های دمو (رمز همه ۱۲۳۴۵۶)
- API Routes (۱۵ مسیر): auth، doctors، specialties، availability، appointments، payments، reviews، chat، blog، admin، schedules، prescriptions، notifications، secretary، profile
- mini-services/chat-service روی پورت 3003: چت realtime + سیگنالینگ WebRTC + ذخیره دیتابیس
- سیستم طراحی: فونت وزیرمتن، RTL کامل، تم فیروزه‌ای پزشکی، دارک‌مود tokens، انیمیشن‌های CSS سخت‌افزاری (orb، ECG، pulse، marquee، shimmer)
- لندینگ سینمایی: Hero پارالاکس با تایپوگرافی مرحله‌ای، کارت پزشک 3D-tilt، ECG متحرک، مارکی تخصص‌ها، شمارنده آمار، نظرات، پیش‌نمایش بلاگ، CTA، فوتر SEO
- ویزارد رزرو ۵ مرحله‌ای: انتخاب پزشک → تقویم شمسی (jalaali-js) → اسلات‌های لحظه‌ای → نوع ویزیت (حضوری/آنلاین) → درگاه پرداخت شبیه‌سازی‌شده زرین‌پال‌مانند → تأیید با کد پیگیری
- ۴ پنل کامل: بیمار (داشبورد/نوبت‌ها/چت/پروفایل سلامت)، پزشک (داشبورد/نوبت‌ها/برنامه کاری هفتگی/چت/نظرات/نسخه)، منشی (داشبورد/نوبت امروز/همه نوبت‌ها/بیماران/رزرو تلفنی)، ادمین (نمودارهای recharts/کاربران/تأیید پزشکان/مدیریت بلاگ/مدیریشن نظرات)
- چت realtime با socket.io (XTransformPort=3003) + fallback REST
- اتاق ویزیت آنلاین WebRTC: اتصال P2P تصویری، چت داخل اتاق، صدور نسخه توسط پزشک
- SEO کامل: metadata + OpenGraph + Twitter، JSON-LD (MedicalBusiness + WebSite)، sitemap.xml داینامیک، robots.txt، manifest PWA، هدرهای امنیتی SSL (HSTS، X-Frame-Options، nosniff، Permissions-Policy)
- رفع خطاها: default-export jalaali-js (به named exports مهاجرت شد)، opts.short در formatJalali، تداخل jalaliMonthName، تداخل public/robots.txt، خطاهای lint (setState-in-effect با الگوی remount-key)
- تست کامل با agent-browser: لندینگ، ورود دمو بیمار، داشبورد بیمار، ویزارد رزرو کامل (پزشک→تقویم ۱۴۰۵→اسلات→پرداخت موفق با کد پیگیری)، پنل ادمین با نمودارها، مدیریت کاربران، بلاگ لیست+مقاله، اتاق ویزیت، نمای موبایل — همگی بدون خطای کنسول

Stage Summary:
- پلتفرم کامل نوبت‌دهی پزشکی «نوبت‌یار» روی یک route SPA در src/app/page.tsx ساخته شد (مطابق محدودیت sandbox که فقط / قابل مشاهده است)
- فایل‌های کلیدی: prisma/schema.prisma، scripts/seed.ts، src/lib/{auth,persian,store}.ts، src/app/api/** (۱۵ route)، mini-services/chat-service/index.ts، src/components/{app-shell,landing/landing,auth/auth-dialog,booking/booking-wizard,visit/visit-room,blog/blog-view,panels/*,shared/*}
- سرویس realtime روی 3003 با لاگ سالم؛ دیتابیس روی db/custom.db
- اکانت‌های دمو: patient@demo.ir / doctor@demo.ir / secretary@demo.ir / admin@demo.ir — رمز 123456
- lint پاک (0 error)، همه endpoint ها 200، جریان رزرو+پرداخت end-to-end تست‌شده
