import ZAI from 'z-ai-web-dev-sdk'
import fs from 'fs'

async function main() {
  const zai = await ZAI.create()
  const res = await zai.images.generations.create({
    prompt:
      'Cinematic futuristic medical background, dark deep teal and navy gradient, glowing abstract DNA helix and floating translucent molecule particles, soft bokeh orbs, subtle glowing cyan ECG heartbeat line, volumetric light, clean modern aesthetic, cyan teal accent lighting, high quality, no text, no words',
    size: '1440x704',
  })
  fs.writeFileSync('/home/z/my-project/scripts/imgtmp/hero-bg.png', Buffer.from(res.data[0].base64, 'base64'))
  console.log('hero-bg OK')
}
main().catch((e) => { console.error(e.message); process.exit(1) })
