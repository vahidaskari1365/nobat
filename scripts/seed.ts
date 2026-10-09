/**
 * Seed script for NobatYar medical platform
 * Run: bun scripts/seed.ts
 */
import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'
import { randomUUID } from 'crypto'

const db = new PrismaClient()

const apptCode = () => 'NY-' + Math.floor(100000 + Math.random() * 900000)
const dayStr = (offset: number) => {
  const d = new Date(); d.setDate(d.getDate() + offset)
  return d.toISOString().slice(0, 10)
}

async function main() {
  console.log('Seeding...')
  const pass = await bcrypt.hash('123456', 10)

  // wipe (order matters)
  await db.notification.deleteMany()
  await db.chatMessage.deleteMany()
  await db.conversation.deleteMany()
  await db.review.deleteMany()
  await db.prescription.deleteMany()
  await db.payment.deleteMany()
  await db.appointment.deleteMany()
  await db.schedule.deleteMany()
  await db.blogPost.deleteMany()
  await db.doctorProfile.deleteMany()
  await db.patientProfile.deleteMany()
  await db.secretaryProfile.deleteMany()
  await db.specialty.deleteMany()
  await db.user.deleteMany()

  // ---- Specialties ----
  const specNames: [string, string, string][] = [
    ['قلب و عروق', 'cardiology', 'HeartPulse'],
    ['پوست و مو', 'dermatology', 'Sparkles'],
    ['تغذیه و رژیم‌درمانی', 'nutrition', 'Apple'],
    ['اعصاب و روان', 'neurology', 'Brain'],
    ['دندانپزشکی', 'dentistry', 'Smile'],
    ['اطفال', 'pediatrics', 'Baby'],
    ['ارتوپدی', 'orthopedics', 'Bone'],
    ['چشم‌پزشکی', 'ophthalmology', 'Eye'],
  ]
  const specs: Record<string, string> = {}
  for (const [name, slug, icon] of specNames) {
    const s = await db.specialty.create({ data: { name, slug, icon, description: `متخصصان مجرب ${name}` } })
    specs[name] = s.id
  }

  // ---- Users ----
  const mkUser = (name: string, email: string, role: string, extra: any = {}) =>
    db.user.create({ data: { name, email, password: pass, role, ...extra } })

  const admin = await mkUser('مدیر سیستم', 'admin@demo.ir', 'ADMIN')
  const secretary = await mkUser('زهرا احمدی', 'secretary@demo.ir', 'SECRETARY')
  const patient = await mkUser('امیر تهرانی', 'patient@demo.ir', 'PATIENT', { avatar: '/images/patient-amir.webp' })
  const p2 = await mkUser('نگار صادقی', 'negar@demo.ir', 'PATIENT', { avatar: '/images/patient-negar.webp' })
  const p3 = await mkUser('رضا کریمی', 'reza@demo.ir', 'PATIENT', { avatar: '/images/patient-reza.webp' })

  const d1 = await mkUser('دکتر سارا محمدی', 'doctor@demo.ir', 'DOCTOR', { avatar: '/images/doctor-sara.webp' })
  const d2 = await mkUser('دکتر علی رضایی', 'ali.doctor@demo.ir', 'DOCTOR', { avatar: '/images/doctor-ali.webp' })
  const d3 = await mkUser('دکتر مریم حسینی', 'maryam.doctor@demo.ir', 'DOCTOR', { avatar: '/images/doctor-maryam.webp' })
  const d4 = await mkUser('دکتر حسین کریمی', 'hossein.doctor@demo.ir', 'DOCTOR', { avatar: '/images/doctor-hossein.webp' })

  await db.patientProfile.createMany({
    data: [
      { userId: patient.id, nationalId: '0012345678', birthDate: '1370/05/12', gender: 'MALE', bloodType: 'O+', allergies: 'گل و گردن', address: 'تهران، خیابان ولیعصر' },
      { userId: p2.id, nationalId: '0087654321', birthDate: '1375/02/20', gender: 'FEMALE', bloodType: 'A+' },
      { userId: p3.id, nationalId: '0045678123', birthDate: '1365/11/03', gender: 'MALE', bloodType: 'B-' },
    ],
  })
  await db.secretaryProfile.create({ data: { userId: secretary.id, clinicName: 'کلینیک تخصصی نوبت‌یار', phone: '021-88776655' } })

  const docData: [string, string, string, string, number, number, number][] = [
    [d1.id, 'قلب و عروق', 'بیش از ۱۵ سال تجربه در تشخیص و درمان بیماری‌های قلبی‌عروقی. مدرس دانشگاه و فلوشیپ آنژیوگرافی از دانشگاه تهران.', 'دکترای پزشکی دانشگاه تهران | فلوشیپ آنژیوگرافی', 15, 450000, 350000],
    [d2.id, 'پوست و مو', 'متخصص پوست، مو و زیبایی با رویکرد درمانی مبتنی بر شواهد. متخصص لیزر و میکرونیدلینگ.', 'دکترای پزشکی دانشگاه شهید بهشتی | بورد تخصصی پوست', 12, 400000, 300000],
    [d3.id, 'تغذیه و رژیم‌درمانی', 'کارشناس ارشد تغذیه بالینی و رژیم‌درمانی چاقی و لاغری، دیابت و بیماری‌های متابولیک.', 'کارشناسی ارشد تغذیه دانشگاه تربیت مدرس', 8, 280000, 200000],
    [d4.id, 'اعصاب و روان', 'روانپزشک و درمانگر اختلالات اضطراب، افسردگی و اختلالات خواب با رویکرد شناختی-رفتاری.', 'دکترای پزشکی دانشگاه ایران | بورد روانپزشکی', 18, 500000, 400000],
  ]
  for (const [uid, specName, bio, edu, exp, price, onlinePrice] of docData) {
    await db.doctorProfile.create({
      data: { userId: uid, specialtyId: specs[specName], bio, education: edu, experience: exp, price, onlinePrice, licenseNo: 'IR-' + Math.floor(10000 + Math.random() * 89999), verified: true, city: 'تهران' },
    })
  }

  // ---- Schedules (شنبه تا چهارشنبه 9-17 + پنجشنبه 9-13) ----
  for (const [uid] of docData) {
    const profile = await db.doctorProfile.findUnique({ where: { userId: uid } })
    if (!profile) continue
    const data: any[] = []
    for (let w = 0; w <= 3; w++) data.push({ doctorId: profile.id, weekday: w, startTime: '09:00', endTime: '17:00', slotMinutes: 30 })
    data.push({ doctorId: profile.id, weekday: 4, startTime: '09:00', endTime: '13:00', slotMinutes: 30 })
    await db.schedule.createMany({ data })
  }

  // ---- Appointments ----
  const appts = [
    { p: patient.id, d: d1.id, date: dayStr(1), time: '10:00', type: 'IN_PERSON', status: 'CONFIRMED', price: 450000 },
    { p: patient.id, d: d3.id, date: dayStr(3), time: '11:30', type: 'ONLINE', status: 'CONFIRMED', price: 200000 },
    { p: patient.id, d: d2.id, date: dayStr(-7), time: '12:00', type: 'IN_PERSON', status: 'COMPLETED', price: 400000 },
    { p: p2.id, d: d1.id, date: dayStr(2), time: '09:30', type: 'ONLINE', status: 'PENDING', price: 350000 },
    { p: p2.id, d: d4.id, date: dayStr(-14), time: '16:00', type: 'ONLINE', status: 'COMPLETED', price: 400000 },
    { p: p3.id, d: d2.id, date: dayStr(0), time: '14:00', type: 'IN_PERSON', status: 'CONFIRMED', price: 400000 },
    { p: p3.id, d: d1.id, date: dayStr(-21), time: '10:30', type: 'IN_PERSON', status: 'COMPLETED', price: 450000 },
  ]
  const createdAppts: any[] = []
  for (const a of appts) {
    const ap = await db.appointment.create({ data: { code: apptCode(), patientId: a.p, doctorId: a.d, date: a.date, time: a.time, type: a.type, status: a.status, price: a.price } })
    createdAppts.push(ap)
    if (a.status !== 'CANCELLED') {
      await db.payment.create({ data: { appointmentId: ap.id, amount: a.price, status: a.status === 'PENDING' ? 'PENDING' : 'PAID', trackingCode: 'PAY-' + randomUUID().slice(0, 8).toUpperCase(), paidAt: a.status === 'PENDING' ? null : new Date() } })
    }
  }

  // ---- Prescription for a completed visit ----
  await db.prescription.create({
    data: {
      appointmentId: createdAppts[2].id,
      items: JSON.stringify([
        { drug: 'قرص آدفن', dosage: 'هر ۸ ساعت یک عدد', note: 'بعد از غذا' },
        { drug: 'کرم هیدروکورتیزون', dosage: 'روزی دو بار', note: 'روی محل ضایعه' },
      ]),
      advice: 'استرس را کاهش دهید و روزانه ۸ لیوان آب بنوشید. دو هفته بعد مراجعه کنید.',
    },
  })

  // ---- Reviews ----
  const reviews = [
    { p: patient.id, d: d2.id, ap: createdAppts[2].id, r: 5, c: 'برخورد بسیار محترمانه و دقیق. مشکل پوستی من بعد از دو هفته کاملا بهبود پیدا کرد. واقعا سپاسگزارم.' },
    { p: p2.id, d: d4.id, ap: createdAppts[4].id, r: 5, c: 'بهترین روانپزشکی که تا حالا رفتم. ویزیت آنلاین خیلی راحت بود و وقت زیادی بهم اختصاص دادن.' },
    { p: p3.id, d: d1.id, ap: createdAppts[6].id, r: 4, c: 'دکتر محمدی کاملا حرفه‌ای هستن. کمی معطل شدم ولی ارزشش رو داشت.' },
    { p: p2.id, d: d1.id, ap: null, r: 5, c: 'توضیحات کامل و دقیق. مسیر درمان خیلی شفاف بود.' },
    { p: p3.id, d: d3.id, ap: null, r: 5, c: 'رژیم غذایی که دادن واقعا عملی بود و سه کیلو کم کردم.' },
  ]
  for (const rv of reviews) {
    await db.review.create({ data: { patientId: rv.p, doctorId: rv.d, appointmentId: rv.ap, rating: rv.r, comment: rv.c } })
  }
  for (const [uid] of docData) {
    const list = await db.review.findMany({ where: { doctorId: uid, status: 'APPROVED' } })
    if (!list.length) continue
    const avg = list.reduce((s, r) => s + r.rating, 0) / list.length
    await db.doctorProfile.update({ where: { userId: uid }, data: { rating: Math.round(avg * 10) / 10, reviewsCount: list.length } })
  }

  // ---- Conversations ----
  const conv1 = await db.conversation.create({ data: { patientId: patient.id, doctorId: d1.id } })
  await db.chatMessage.createMany({
    data: [
      { conversationId: conv1.id, senderId: patient.id, content: 'سلام دکتر، فشار خونم این روزها کمی بالاست. چه کار کنم؟' },
      { conversationId: conv1.id, senderId: d1.id, content: 'سلام وقت بخیر. عدد فشارتون رو بفرمایید؟ روزانه اندازه بگیرید و ثبت کنید تا نوبت بعدی بررسی کنیم.' },
      { conversationId: conv1.id, senderId: patient.id, content: 'بله حتماً، ممنون از راهنمایی‌تون.' },
    ],
  })

  // ---- Blog posts ----
  const posts = [
    {
      slug: 'boost-immune-system',
      title: '۱۰ راهکار علمی برای تقویت سیستم ایمنی بدن',
      category: 'سلامت عمومی',
      excerpt: 'سیستم ایمنی قوی، اولین خط دفاع بدن در برابر بیماری‌هاست. با این ۱۰ راهکار مبتنی بر شواهد علمی، ایمنی بدن خود را در فصول سرد سال تقویت کنید.',
      tags: JSON.stringify(['ایمنی', 'ویتامین', 'سبک زندگی']),
      readTime: 7,
      cover: '/images/blog-immune.webp',
      content: `سیستم ایمنی بدن شبکه‌ای پیچیده از سلول‌ها، بافت‌ها و اندام‌هاست که به‌صورت شبانه‌روزی از بدن در برابر عوامل بیماری‌زا محافظت می‌کند. تقویت این سیستم نیازمند رویکردی جامع است که همت سبک زندگی، تغذیه و سلامت روان باشد.\n\n## خواب کافی، بنیان ایمنی بدن\nمطالعات نشان می‌دهد افرادی که کمتر از ۶ ساعت در شبانه‌روز می‌خوابند، چهار برابر بیشتر در معرض سرماخوردگی قرار می‌گیرند. در طول خواب عمیق، بدن سیتوکین‌های ضدالتهابی ترشح می‌کند که برای مقابله با عفونت‌ها حیاتی هستند. هفت تا نه ساعت خواب باکیفیت، سنگ‌بنای سیستم ایمنی قوی است.\n\n## تغذیه رنگین‌کمانی\nویتامین C تنها مکمل مؤثر نیست. روی، ویتامین D و ویتامین‌های گروه B نیز نقش کلیدی در عملکرد لنفوسیت‌ها دارند. مصرف روزانه پنج وعده میوه و سبزیجات رنگارنگ، خوراک‌های تخمیری مثل ماست پروبیوتیک و منابع امگا۳ مانند ماهی سالمون، ترکیبی قدرتمند برای پاسخ ایمنی متعادل فراهم می‌کند.\n\n## مدیریت استرس\nکورتیزول بالای مزمن، تولید سلول‌های ایمنی را سرکوب می‌کند. تمرینات تنفس عمیق، مدیتیشن مایندفولنس و پیاده‌روی روزانه در طبیعت، به‌طور اثبات‌شده سطح استرس و التهاب بدن را کاهش می‌دهند.\n\n## ورزش منظم اما متعادل\nسی دقیقه پیاده‌روی تند در روز، گردش سلول‌های ایمنی را در خون تا چند ساعت پس از تمرین افزایش می‌دهد. توجه کنید که ورزش شدید و طولانی‌مدت بدون ریکاوری کافی، برعکس عمل کرده و ایمنی را تضعیف می‌کند.\n\nدر نهایت به یاد داشته باشید که هیچ مکمل جادویی وجود ندارد؛ ثبات در عادت‌های سالم روزانه، کلید سیستم ایمنی مقاوم است.`,
    },
    {
      slug: 'heart-healthy-tips',
      title: 'سلامت قلب: راهنمای کامل پیشگیری از بیماری‌های قلبی',
      category: 'قلب و عروق',
      excerpt: 'بیماری‌های قلبی عامل اول مرگ در جهان است، اما خبر خوب این‌که ۸۰٪ حملات قلبی قابل پیشگیری هستند. با این راهنمای جامع، قلب خود را جوان نگه دارید.',
      tags: JSON.stringify(['قلب', 'فشار خون', 'کلسترول']),
      readTime: 8,
      cover: '/images/blog-heart.webp',
      content: `قلب شما هر روز حدود ۱۰۰ هزار بار می‌زند و خون را به تمام اعضای بدن می‌رساند. محافظت از این عضو حیاتی آسان‌تر از آن است که فکر می‌کنید.\n\n## فشار خون را جدی بگیرید\nفشار خون بالا «قاتل خاموش» لقب گرفته چون تا سال‌ها بدون علامت است. اندازه‌گیری منظم فشار در منزل، کاهش مصرف نمک به زیر ۵ گرم در روز و مدیریت استرس، سه ستون کنترل فشار خون هستند.\n\n## کلسترول؛ دوست و دشمن\nکلسترول HDL یا «خوب» شاهرگ‌های بدن را از پلاک‌های چربی پاک می‌کند، در حالی که LDL یا «بد» به جدار رگ‌ها می‌چسبد. چربی‌های ترانس در فست‌فودها و شیرینی‌های صنعتی را حذف کنید و جای آن روغن زیتون، آووکادو و مغزها را بگذارید.\n\n## نشانه‌های هشدار حمله قلبی\nدرد فشارنده قفسه سینه، تپش یا تنگی نفس، درد بازوی چپ و فک، تعریق سرد و تهوع. در خانم‌ها علائم اغلب نامتعارف‌تر است: خستگی شدید، سوءهاضمه‌مانند و سرگیجه. هرگز در چنین شرایطی رانندگی نکنید و بلافاصله اورژانس ۱۱۵ را خبر کنید.\n\n## چکاپ سالانه\nاز سن ۳۰ سالگی، هر سال یک بار چکاپ کامل شامل نوار قلب، آزمایش چربی خون و اندازه‌گیری فشار انجام دهید. تشخیص زودهنگام، درمان را ساده و موفق‌تر می‌کند. شما می‌توانید همین حالا از طریق پلتفرم نوبت‌یار نوبت ویزیت قلب رزرو کنید.`,
    },
    {
      slug: 'skincare-routine',
      title: 'روتین پوستی علمی: از مبتدی تا حرفه‌ای',
      category: 'پوست و مو',
      excerpt: 'نیازی به ۱۰ مرحله روتین کره‌ای نیست! با ۴ محصول اصولی، پوستی سالم و شفاف داشته باشید. راهنمای انتخاب ضدآفتاب مناسب پوست ایرانی.',
      tags: JSON.stringify(['پوست', 'ضدآفتاب', 'مراقبت']),
      readTime: 6,
      cover: '/images/blog-skincare.webp',
      content: `پوست بزرگ‌ترین عضو بدن است و مراقبت از آن نباید پیچیده و پرهزینه باشد. یک روتین علمی و مینیمال، همیشه بهتر از دَه محصول بی‌هدف است.\n\n## سه گام طلایی صبح\nاول شوینده ملایم با pH متعادل، دوم مرطوب‌کننده حاوی سرامید یا هیالورونیک‌اسید و سوم و مهم‌تر از همه ضدآفتاب با SPF حداقل ۳۰ و مقاوم در برابر نور. ضدآفتاب را حتی در روزهای ابری و پشت پنجره هم بزنید؛ ۸۰٪ پیری پوست از پرتوهای UVA ناشی می‌شود.\n\n## شب: زمان بازسازی\nپس از پاک‌سازی، رتینول بهترین ترکیب ضدپیری اثبات‌شده است. دو شب در میان شروع کنید، اندازه یک نخود کافی است و حتماً صبح ضدآفتاب بزنید. اگر پوست حساسی دارید، به‌جای رتینول از نیاسینامید استفاده کنید.\n\n## اشتباهات رایج\nلایه‌برداری بیش از حد، ترکیب هم‌زمان رتینول و ویتامین C، مصرف کرم‌های بدون برند و مهم‌تر از همه ترک روتین پس از بهبود. ثبات مهم‌تر از تنوع است.\n\n## چه زمانی به متخصص مراجعه کنیم؟\nاگر جوش‌های شما مکرر و دردناک است، لکه‌ای تغییر شکل یا رنگ داده یا ریزش سکه‌ای مو دارید، خوددرمانی نکنید. مشاوره تخصصی پوست از طریق ویزیت آنلاین نوبت‌یار، در چند دقیقه قابل دسترسی است.`,
    },
    {
      slug: 'mental-health-anxiety',
      title: 'اضطراب را بشناسید و مدیریت کنید',
      category: 'سلامت روان',
      excerpt: 'اضطراب طبیعی است، اما وقتی زندگی روزمره را مختل کند، نیاز به توجه جدی دارد. تکنیک‌های اثبات‌شده CBT برای مدیریت اضطراب.',
      tags: JSON.stringify(['اضطراب', 'سلامت روان', 'CBT']),
      readTime: 7,
      cover: '/images/blog-mental.webp',
      content: `اضطراب واکنشی طبیعی بدن در برابر خطر است، اما وقتی شدت و تداوم آن با واقعیت تهدید هم‌خوانی ندارد، به یک اختلال قابل درمان تبدیل می‌شود.\n\n## تفاوت نگرانی معمول و اختلال اضطراب\nنگرانی معمول محدود و گذرا است؛ اما در اختلال اضطراب، فکرهای نگران‌کننده بیش از شش ماه ادامه می‌یابند، کنترل آن‌ها سخت است و با علائم جسمی مثل تپش قلب، گرفتگی عضلات و بی‌خوابی همراه می‌شود.\n\n## تکنیک ۵-۴-۳-۲-۱\nیکی از سریع‌ترین تکنیک‌های لنگر کردن در لحظه: پنج چیزی که می‌بینید، چهار چیزی که لمس می‌کنید، سه صدایی که می‌شنوید، دو بویی که استشمام می‌کنید و یک مزه. این تمرین حواس را از چرخه فکر اضطرابی به محیط برمی‌گرداند.\n\n## تنفس چهار-هفت-هشت\nچهار ثانیه دم از بینی، هفت ثانیه نگه‌داشتن، هشت ثانیه بازدم از دهان. این الگو سیستم پاراسمپاتیک را فعال می‌کند و ضربان قلب را در کمتر از دو دقیقه کاهش می‌دهد.\n\n## کی کمک بگیریم؟\nاگر اضطراب، کار، روابط یا خواب شما را مختل کرده، درمان شناختی-رفتاری (CBT) مؤثرترین روش اثبات‌شده است. روانپزشکان همکار نوبت‌یار به‌صورت حضوری و آنلاین در دسترس هستند؛ درخواست کمک، اولین قدم شجاعانه درمان است.`,
    },
    {
      slug: 'healthy-nutrition-guide',
      title: 'بشقاب سالم ایرانی: راهنمای تغذیه متعادل',
      category: 'تغذیه',
      excerpt: 'چطور با غذاهای ایرانی و در دسترس، رژیم متعادل داشته باشیم؟ نکاتی درباره برنج، نان سنگک، حبوبات و میان‌وعده‌های سالم.',
      tags: JSON.stringify(['تغذیه', 'رژیم', 'سبک زندگی']),
      readTime: 6,
      cover: '/images/blog-nutrition.webp',
      content: `تغذیه سالم به معنای حذف غذاهای لذت‌بخش نیست؛ به معنای تعادل هوشمندانه است. بشقاب استاندارد سلامت: نیمی سبزیجات و سالاد، یک‌چهارم پروتئین و یک‌چهارم کربوهیدرات کامل.\n\n## برنج؛ دشمن نیست\nمشکل از حجم و نحوه پخت است. برنج نیم‌دانه آبکش‌شده با روغن کمتر، همراه با سبزی پلو یا در کنار خورش کم‌چرب، بخشی از الگوی سالم است. نصف پرس همیشگی به‌همراه یک برش نان سنگک جو، قند خون را متعادل‌تر نگه می‌دارد.\n\n## حبوبات، گنج ملی\nعدسی، خوراک لوبیا و آش انار منابع عالی پروتئین گیاهی و فیبر هستند. سه وعده حبوبات در هفته، کلسترول و قند خون را به‌طور محسوسی بهبود می‌دهد.\n\n## میان‌وعده‌های هوشمند\nبه‌جای بیسکویت و چیپس: یک مشت پسته خام، ماست و خیار، میوه کامل یا خرما همراه با گردو. مراقب نوشیدنی‌های شیرین باشید؛ یک لیوان نوشابه معادل ۱۰ حبه قند خالص دارد.\n\n## ماندگاری عادت\nقانون ۸۰/۲۰ را رعایت کنید: ۸۰٪ زمان سالم بخورید و ۲۰٪ آزاد باشید. رژیم‌های سخت‌گیرانه‌ای که یک‌شبه وعده معجزه می‌دهند، در ۹۵٪ موارد به افزایش وزن برگشتی منجر می‌شوند. برای برنامه اختصاصی، مشاوره تغذیه آنلاین را از دست ندهید.`,
    },
  ]
  for (const p of posts) {
    await db.blogPost.create({ data: { ...p, authorId: admin.id, published: true, views: Math.floor(200 + Math.random() * 1800) } })
  }

  // ---- Notifications ----
  await db.notification.createMany({
    data: [
      { userId: patient.id, title: 'نوبت شما تأیید شد', body: 'نوبت ویزیت حضوری دکتر سارا محمدی تأیید شد.', type: 'SUCCESS' },
      { userId: patient.id, title: 'یادآوری نوبت', body: 'فردا نوبت دکتر سارا محمدی ساعت ۱۰:۰۰ دارید.', type: 'INFO' },
      { userId: d1.id, title: 'نوبت جدید', body: 'یک نوبت جدید برای فردا ساعت ۱۰:۰۰ ثبت شد.', type: 'INFO' },
    ],
  })

  console.log('Seed done ✔')
  console.log('admin@demo.ir | secretary@demo.ir | doctor@demo.ir | patient@demo.ir | pass: 123456')
}

main().finally(() => db.$disconnect())
