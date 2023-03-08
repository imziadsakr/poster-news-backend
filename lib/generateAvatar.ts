import { randpix, RandpixColorScheme, Symmetry } from 'randpix'
import fs from 'fs'
import path from 'path'

interface generateAvatarData {
  dataUrl: string
  imagePath?: string
}

const types = [
  RandpixColorScheme.NEUTRAL,
  RandpixColorScheme.MAGENTA,
  RandpixColorScheme.MAGENTA_SEPIA,
  RandpixColorScheme.LIGHT_GREEN,
  RandpixColorScheme.SEPIA,
  RandpixColorScheme.MAGMA,
  RandpixColorScheme.ICE,
  RandpixColorScheme.DARK_SEPIA,
  RandpixColorScheme.SOLARIZE,
  RandpixColorScheme.DARKULA,
  RandpixColorScheme.BLUE,
  RandpixColorScheme.RETROWAVE,
  RandpixColorScheme.BLOOD,
  RandpixColorScheme.PURPUR,
  RandpixColorScheme.GRAYSCALE_MAGENTA,
  RandpixColorScheme.NIGHT_SKY,
  RandpixColorScheme.SUNSET,
  RandpixColorScheme.TOXIC_LIME,
  RandpixColorScheme.SKY,
  RandpixColorScheme.BROWNSCALE,
  RandpixColorScheme.LIGHT_SEPIA,
  RandpixColorScheme.SUN,
  RandpixColorScheme.PURPLE_SOLARIZED,
  RandpixColorScheme.CYBERPUNK,
  RandpixColorScheme.DIAMOND_BLACK,
  RandpixColorScheme.CYBER_BLACK,
  RandpixColorScheme.DIAMOND,
  RandpixColorScheme.BLOOD_MOON,
  RandpixColorScheme.GERMANY,
  RandpixColorScheme.GOLD_ORE,
  RandpixColorScheme.LAVA_POOL,
  RandpixColorScheme.CREAM
]

export const generateAvatar = async (
  seed: string,
  saveAsImage?: boolean
) => {
  const randomIndex = Math.floor(Math.random() * types.length)
  const randomType = types[randomIndex]

  const generate = randpix({
    colorScheme: randomType, // Color theme (default: NEUTRAL)
    size: 8, // Art size. Recommended 7 or 8 (odd/even symmetry) (default: 8)
    scale: 32, // Pixel scale (default: 1)
    symmetry: Symmetry.VERTICAL, // Symmetry (default: VERTICAL)
    // color: [255, 100, 50], // [R, G, B] like color for solid art (default: undefined),
    seed, // Seed (default: undefined)
    colorBias: 15, // Slightly changes the color hue, which adds more color to the image (default: undefined)
    grayscaleBias: false // Change only the brightness of the color instead of the hue (default: undefined)
  })

  const art = generate() // Generating the pixel art

  let data: generateAvatarData = {
    dataUrl: art.toDataURL()
  }

  if (saveAsImage) {
    const fileName = `avatar-${Date.now()}.png`
    const filePath = path.join(
      __dirname,
      '../../public',
      'avatars',
      fileName
    )
    const pngBuffer = art.toBuffer('image/png')

    // Write the PNG buffer to a file
    await fs.writeFile(filePath, pngBuffer, err => {
      if (err) {
        console.error(err)
        return
      }
    })
    data['imagePath'] = 'avatars/' + fileName
  }

  return data
}
