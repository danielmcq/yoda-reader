'use strict'

const fs = require('fs')
const bitmapManipulation = require('bitmap-manipulation')
const path = require('path')

const DATA_FILE_PATH = path.join(__dirname, 'YODESK.DTA')

main()

function main (args=[]) {
  fs.open(DATA_FILE_PATH, 'r', (err, fd) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.error(`${DATA_FILE_PATH} does not exist`)
        return
      }

      throw err
    }

    let keepReading = true
    let buffer
    while (keepReading) {
      buffer = Buffer.alloc(4)
      fs.readSync(fd,buffer,0,4)
      const section = buffer.toString()
      console.log('section',section)

      switch (section) {
        case 'VERS':
          buffer = Buffer.alloc(4)
          fs.readSync(fd,buffer,0,4)
          console.log('buffer',buffer)
          const version = buffer.swap16().readUInt32LE()
          console.log('version',version)
          break
        case 'STUP':
        case 'SNDS':
        case 'PUZ2':
        case 'CHAR':
        case 'CHWP':
        case 'CAUX':
        case 'TNAM':
          buffer = Buffer.alloc(4)
          fs.readSync(fd,buffer,0,4)
          const sectionLength = buffer.readUInt32LE()
          console.log('  sectionLength',sectionLength)
          buffer = Buffer.alloc(sectionLength)
          fs.readSync(fd,buffer,0,sectionLength)
          console.log('  sectionData',buffer.slice(0,20))
          break
        case 'TILE':
          // Directory.CreateDirectory(@"Tiles");
          const TILE_DIR_PATH = path.join(__dirname, 'tiles')
          if (!fs.existsSync(TILE_DIR_PATH))
            fs.mkdirSync(TILE_DIR_PATH)

          // uint tileSectionLength = binaryReader.ReadUInt32();
          buffer = Buffer.alloc(4)
          fs.readSync(fd,buffer,0,4)
          const tileSectionLength = buffer.readUInt32LE()

          // for (int i = 0; i < tileSectionLength / 0x404; i++)
          for (let i = 0; i < tileSectionLength / 0x404; i++) {
            // uint unknown = binaryReader.ReadUInt32();
            buffer = Buffer.alloc(4)
            fs.readSync(fd,buffer,0,4)
            const unknown = buffer.readUInt32LE()

            // Bitmap tile = new Bitmap(32, 32);
            const bitmap = new bitmapManipulation.BMPBitmap(32, 32)
            const bmpData = bitmap.data()
            const bmpDataOffset = 0

            // for (int j = 0; j < 0x400; j++)
            for (let j = 0; j < 0x400; j++) {
              // byte pixelData = binaryReader.ReadByte();
              fs.readSync(fd,buffer,0,1)

              // Color pixelColor = Color.FromArgb(pixelData, pixelData, pixelData);
              const pixelColor = buffer.readUInt8()
              // console.log('    pixelColor', pixelColor)

              // tile.SetPixel(j % 32, j / 32, pixelColor);
              bitmap.setPixel(j%32,Math.floor(j/32), Buffer.from(new Uint8Array([pixelColor,pixelColor,pixelColor])))
              // bmpData[j%32,Math.floor(j/32)] = Buffer.from(new Uint8Array([pixelColor,pixelColor,pixelColor]))
            }

            // tile.Save(string.Format(@"Tiles\{0}.png", i));
            const tileFilename = path.join(TILE_DIR_PATH, `./${i}.bmp`)
            bitmap.save(tileFilename)
          }
          break
        case 'ZONE':
          buffer = Buffer.alloc(2)
          fs.readSync(fd,buffer,0,2)
          const count = buffer.readUInt16LE()
          for (let i = 0; i < count; i++) {
            // unknown
            buffer = Buffer.alloc(2)
            fs.readSync(fd,buffer,0,2)
            const unknown = buffer.readUInt16LE()

            // zoneLength
            buffer = Buffer.alloc(4)
            fs.readSync(fd,buffer,0,4)
            const zoneLength = buffer.readUInt32LE()
            // console.log('    zoneLength',zoneLength)

            // zoneData
            buffer = Buffer.alloc(zoneLength)
            fs.readSync(fd,buffer,0,zoneLength)
            // console.log('    zoneData',buffer.slice(0,20))
          }
          break
        case 'ENDF':
          keepReading = false
          break
        default:
          throw new Error(`Unknown section: ${ section}`)
      }
    }
  })
}