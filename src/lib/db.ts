import { PrismaClient } from '@prisma/client'
import fs from 'fs'
import os from 'os'
import path from 'path'

/**
 * Resolve a usable SQLite URL in every environment:
 * - Local dev / standalone server: db/custom.db inside the project (writable → read & write in place)
 * - Serverless (e.g. Vercel): filesystem is READ-ONLY and `db/custom.db` ships inside the lambda bundle,
 *   so we copy it to a writable /tmp directory and point Prisma there (writes live for the instance lifetime).
 */
function resolveDatabaseUrl(): string {
  const bundled = path.join(process.cwd(), 'db', 'custom.db')
  try {
    if (fs.existsSync(bundled)) {
      let dirWritable = true
      try {
        fs.accessSync(path.dirname(bundled), fs.constants.W_OK)
      } catch {
        dirWritable = false
      }
      if (dirWritable) {
        return `file:${path.resolve(bundled)}`
      }
      // Read-only FS (serverless) → copy DB (and any journal/wal sidecars) to /tmp
      const tmpDir = path.join(os.tmpdir(), 'nobat-db')
      const tmpDb = path.join(tmpDir, 'custom.db')
      fs.mkdirSync(tmpDir, { recursive: true })
      const needsCopy =
        !fs.existsSync(tmpDb) ||
        fs.statSync(bundled).mtimeMs > fs.statSync(tmpDb).mtimeMs
      if (needsCopy) {
        fs.copyFileSync(bundled, tmpDb)
        for (const suffix of ['-wal', '-shm', '-journal']) {
          const src = bundled + suffix
          if (fs.existsSync(src)) fs.copyFileSync(src, tmpDb + suffix)
        }
      }
      return `file:${tmpDb}`
    }
  } catch (err) {
    console.error('[db] could not prepare local SQLite file, falling back to DATABASE_URL:', err)
  }
  return process.env.DATABASE_URL || `file:${path.resolve(bundled)}`
}

const databaseUrl = resolveDatabaseUrl()

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: databaseUrl,
    log: process.env.NODE_ENV === 'production' ? ['error'] : ['query'],
  })

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = db
