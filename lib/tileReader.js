'use strict'

const fs      = require('fs')
const ImageJS = require('imagejs')
const palette = require('./palette')
const path    = require('path')

const COLORS = {
  TRANSPARENT: {r: 255, g: 255, b: 255, a: 0},
}

module.exports = fd=>{
  let buffer

  const TILE_DIR_PATH = path.join(__dirname, 'tiles')
  if (!fs.existsSync(TILE_DIR_PATH))
    fs.mkdirSync(TILE_DIR_PATH)

  buffer = Buffer.alloc(4)
  fs.readSync(fd,buffer,0,4)
  const tileSectionLength = buffer.readUInt32LE()

  for (let i = 0; i < tileSectionLength / 0x404; i++) {
    // flags for tile
    buffer = Buffer.alloc(4)
    fs.readSync(fd,buffer,0,4)
    buffer.readUInt32LE()

    const tile = new ImageJS.Bitmap({
      width:  32,
      height: 32,
      color:  COLORS.TRANSPARENT,
    })

    for (let j = 0; j < 0x400; j++) {
      fs.readSync(fd,buffer,0,1)
      const pixelData = buffer.readUInt8()

      // if pixelData is 0, then leave as transparent
      if (pixelData) {
        const r = palette[pixelData*4+2]
        const g = palette[pixelData*4+1]
        const b = palette[pixelData*4+0]
        tile.setPixel(j%32,Math.floor(j/32), r, g, b, 255)
      }
    }

    const tileFilename = path.join(TILE_DIR_PATH, `./${i.toString().padStart(4,'0')}.png`)
    tile.writeFile(tileFilename,{type: ImageJS.ImageType.PNG})
  }
}