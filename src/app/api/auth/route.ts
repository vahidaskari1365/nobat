import { NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { signToken, TOKEN_COOKIE, getSessionUser } from '@/lib/auth'
import { cookies } from 'next/headers'

export async function GET() {
  const session = await getSessionUser()
  if (!session) return Response.json({ ok: true, user: null })
  const user = await db.user.findUnique({
    where: { id: session.id },
    select: { id: true, name: true, email: true, role: true, avatar: true, status: true,
      doctorProfile: { include: { specialty: true } }, patientProfile: true, secretaryProfile: true },
  })
  if (!user || user.status !== 'ACTIVE') return Response.json({ ok: true, user: null })
  return Response.json({ ok: true, user })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const action = body.action

  if (action === 'logout') {
    (await cookies()).delete(TOKEN_COOKIE)
    return Response.json({ ok: true })
  }

  if (action === 'login') {
    const { email, password } = body
    if (!email || !password) return Response.json({ ok: false, error: 'ایمیل و رمز عبور الزامی است' }, { status: 400 })
    const user = await db.user.findUnique({ where: { email: String(email).toLowerCase().trim() } })
    if (!user || !(await bcrypt.compare(password, user.password)))
      return Response.json({ ok: false, error: 'ایمیل یا رمز عبور اشتباه است' }, { status: 401 })
    if (user.status !== 'ACTIVE')
      return Response.json({ ok: false, error: 'حساب شما غیرفعال شده است' }, { status: 403 })
    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role })
    ;(await cookies()).set(TOKEN_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
    const full = await db.user.findUnique({ where: { id: user.id },
      select: { id: true, name: true, email: true, role: true, avatar: true,
        doctorProfile: { include: { specialty: true } }, patientProfile: true, secretaryProfile: true } })
    return Response.json({ ok: true, user: full })
  }

  if (action === 'register') {
    const { name, email, password, role, phone, specialtyId, bio } = body
    if (!name || !email || !password)
      return Response.json({ ok: false, error: 'همه فیلدهای الزامی را تکمیل کنید' }, { status: 400 })
    if (String(password).length < 6)
      return Response.json({ ok: false, error: 'رمز عبور باید حداقل ۶ کاراکتر باشد' }, { status: 400 })
    const exists = await db.user.findUnique({ where: { email: String(email).toLowerCase().trim() } })
    if (exists) return Response.json({ ok: false, error: 'این ایمیل قبلا ثبت شده است' }, { status: 409 })

    const allowedRole = role === 'DOCTOR' ? 'DOCTOR' : 'PATIENT'
    const user = await db.user.create({
      data: { name, email: String(email).toLowerCase().trim(), password: await bcrypt.hash(password, 10), role: allowedRole },
    })
    if (allowedRole === 'PATIENT') await db.patientProfile.create({ data: { userId: user.id, phone } })
    if (allowedRole === 'DOCTOR') {
      await db.doctorProfile.create({ data: { userId: user.id, specialtyId: specialtyId || null, bio, verified: false } })
      const admin = await db.user.findFirst({ where: { role: 'ADMIN' } })
      if (admin) await db.notification.create({ data: { userId: admin.id, title: 'درخواست همکاری پزشک جدید', body: `${name} درخواست ثبت‌نام کرده است. پس از بررسی، حساب را تأیید کنید.`, type: 'WARNING' } })
    }
    const token = signToken({ id: user.id, name: user.name, email: user.email, role: user.role })
    ;(await cookies()).set(TOKEN_COOKIE, token, { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 60 * 60 * 24 * 7 })
    return Response.json({ ok: true, user: { id: user.id, name: user.name, email: user.email, role: user.role, avatar: null } })
  }

  return Response.json({ ok: false, error: 'action نامعتبر' }, { status: 400 })
}
