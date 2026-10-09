/** Convert generated PNGs in scripts/imgtmp to optimized webp in public/images */
import sharp from 'sharp'
import fs from 'fs'
import path from 'path'

const TMP = '/home/z/my-project/scripts/imgtmp'
const OUT = '/home/z/my-project/public/images'

async function main() {
  const files = fs.readdirSync(TMP).filter((f) => f.endsWith('.png'))
  for (const f of files) {
    const name = path.basename(f, '.png')
    const src = path.join(TMP, f)
    const dest = path.join(OUT, name + '.webp')
    const meta = await sharp(src).webp({ quality: 82 }).toFile(dest)
    console.log(`${name}.webp  ${(meta.size / 1024).toFixed(0)}KB  ${meta.width}x${meta.height}`)
  }
}
main().catch((e) => { console.error(e); process.exit(1) })
