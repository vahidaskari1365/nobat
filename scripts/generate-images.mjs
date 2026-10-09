/**
 * Generate all images for Nobatyar medical platform
 * Saves raw PNG to scripts/imgtmp, then converts to optimized webp in public/images
 */
import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'
import path from 'path'

const TMP = '/home/z/my-project/scripts/imgtmp'
const OUT = '/home/z/my-project/public/images'
fs.mkdirSync(TMP, { recursive: true })
fs.mkdirSync(OUT, { recursive: true })

const images = [
  // ---- HERO ----
  {
    file: 'hero-bg',
    size: '1440x720',
    prompt:
      'Cinematic futuristic medical technology background, dark deep teal and navy gradient, glowing abstract DNA helix strands and floating translucent molecule particles, soft bokeh light orbs, subtle ECG heartbeat pulse line glowing in cyan across the scene, volumetric light rays, depth of field, ultra clean modern hospital aesthetic, dark moody atmosphere with cyan and teal accent lighting, high quality, detailed, no text, no words, no letters',
  },
  {
    file: 'hero-doctor',
    size: '768x1344',
    prompt:
      'Professional portrait photograph of a friendly Iranian female doctor in her 40s wearing a white medical coat and stethoscope, warm confident smile, arms crossed, studio photography with soft teal and cyan gradient studio background, cinematic rim lighting, high end medical website hero photo, photorealistic, sharp focus, high quality, no text',
  },
  {
    file: 'online-visit',
    size: '1344x768',
    prompt:
      'Telemedicine concept photograph, doctor in white coat visible on a laptop screen during video call, patient at home holding smartphone showing doctor video, modern bright room with soft teal ambient lighting, shallow depth of field, clean minimal composition, photorealistic, high quality, no text, no watermark',
  },
  // ---- DOCTORS ----
  {
    file: 'doctor-sara',
    size: '864x1152',
    prompt:
      'Professional headshot portrait of an Iranian female cardiologist in her early 40s, dark hair in neat hijab, white medical coat over teal scrubs, stethoscope around neck, warm trustworthy smile, soft studio lighting, clean light teal gradient background, photorealistic, sharp focus, high quality, no text',
  },
  {
    file: 'doctor-ali',
    size: '864x1152',
    prompt:
      'Professional headshot portrait of an Iranian male dermatologist in his late 30s, short dark hair, trimmed beard, white medical coat, light blue shirt, friendly confident smile, soft studio lighting, clean light teal gradient background, photorealistic, sharp focus, high quality, no text',
  },
  {
    file: 'doctor-maryam',
    size: '864x1152',
    prompt:
      'Professional headshot portrait of a young Iranian female nutritionist in her early 30s, colorful hijab, smart casual blazer, holding a green apple, bright cheerful smile, soft studio lighting, clean light green teal gradient background, photorealistic, sharp focus, high quality, no text',
  },
  {
    file: 'doctor-hossein',
    size: '864x1152',
    prompt:
      'Professional headshot portrait of a mature Iranian male psychiatrist in his 50s, gray hair, glasses, dark suit jacket over shirt, calm empathetic expression with gentle smile, soft studio lighting, clean light blue teal gradient background, photorealistic, sharp focus, high quality, no text',
  },
  // ---- BLOG ----
  {
    file: 'blog-immune',
    size: '1344x768',
    prompt:
      'Healthy lifestyle flat lay photography, citrus fruits, ginger, turmeric, green vegetables, dumbbells and water glass on bright clean background, concept of strong immune system, vibrant colors, soft natural light, top view, high quality, no text',
  },
  {
    file: 'blog-heart',
    size: '1344x768',
    prompt:
      'Heart health concept photography, red heart shape made of fresh vegetables and fruits next to stethoscope on clean light background, cardiology prevention concept, soft studio light, high quality, detailed, no text',
  },
  {
    file: 'blog-skincare',
    size: '1344x768',
    prompt:
      'Minimal skincare routine photography, cosmetic serum bottles, cream jars and aloe vera leaves on pastel beige background with soft shadows, spa aesthetic, clean beauty product photography, soft light, high quality, no text',
  },
  {
    file: 'blog-mental',
    size: '1344x768',
    prompt:
      'Calm mental health concept photography, peaceful person meditating silhouette by a bright window with plants, soft morning light, serene atmosphere, mindfulness and anxiety relief concept, teal and warm tones, high quality, no text',
  },
  {
    file: 'blog-nutrition',
    size: '1344x768',
    prompt:
      'Healthy balanced diet photography, colorful Mediterranean style bowl with fresh vegetables, grains, fish and herbs on rustic wooden table, top view, vibrant fresh ingredients, natural light, high quality food photography, no text',
  },
  // ---- PATIENT AVATARS ----
  {
    file: 'patient-amir',
    size: '1024x1024',
    prompt:
      'Friendly casual headshot portrait of a young Iranian man in his early 30s, short dark hair, light stubble, wearing casual denim shirt, natural smile, soft studio light, clean neutral background, photorealistic, high quality, no text',
  },
  {
    file: 'patient-negar',
    size: '1024x1024',
    prompt:
      'Friendly casual headshot portrait of a young Iranian woman in her late 20s, elegant colorful headscarf, warm genuine smile, soft studio light, clean neutral background, photorealistic, high quality, no text',
  },
  {
    file: 'patient-reza',
    size: '1024x1024',
    prompt:
      'Friendly casual headshot portrait of a middle aged Iranian man in his late 40s, short graying hair, mustache, wearing smart casual polo shirt, kind smile, soft studio light, clean neutral background, photorealistic, high quality, no text',
  },
]

async function main() {
  const zai = await ZAI.create()
  let ok = 0
  const failed = []
  for (const img of images) {
    const outPath = path.join(OUT, img.file + '.webp')
    const tmpPath = path.join(TMP, img.file + '.png')
    if (fs.existsSync(outPath)) {
      console.log(`skip (exists): ${img.file}`)
      ok++
      continue
    }
    let done = false
    for (let attempt = 1; attempt <= 3 && !done; attempt++) {
      try {
        const res = await zai.images.generations.create({ prompt: img.prompt, size: img.size })
        const b64 = res?.data?.[0]?.base64
        if (!b64) throw new Error('empty base64')
        fs.writeFileSync(tmpPath, Buffer.from(b64, 'base64'))
        done = true
        ok++
        console.log(`OK: ${img.file} (${img.size})`)
      } catch (e) {
        console.error(`attempt ${attempt} failed for ${img.file}: ${e.message}`)
        if (attempt < 3) await new Promise((r) => setTimeout(r, 1500 * attempt))
      }
    }
    if (!done) failed.push(img.file)
  }
  console.log(`\nDONE ok=${ok}/${images.length} failed=${JSON.stringify(failed)}`)
}

main().catch((e) => {
  console.error('FATAL', e)
  process.exit(1)
})
