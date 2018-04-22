'use strict'

const fs = require('fs')
const path = require('path')
const tileReader = require('./lib/tileReader')

main(process.argv.slice(2))

const SECTION_NAME_SIZE = 4

function main (args=[]) {
  const fileName = args.shift()
  const DATA_FILE_PATH = path.join(process.cwd(), fileName||'YODESK.DTA')

  fs.open(DATA_FILE_PATH, 'r', (err, fd) => {
    if (err) {
      if (err.code === 'ENOENT') {
        console.error(`${DATA_FILE_PATH} does not exist`)
        return
      }

      throw err
    }

    let keepReading = true
    const buffer = fs.readFileSync(fd)
    let offset = 0
    while (keepReading) {
      const section = buffer.toString('ascii',offset,offset+SECTION_NAME_SIZE)
      offset += SECTION_NAME_SIZE
      console.log('section',section, `0x${offset.toString(16)}`)

      switch (section) {
        case 'VERS':
          offset = versionReader(buffer, offset)
          break
        case 'STUP':
        case 'SNDS':
        case 'PUZ2':
        case 'CHAR':
        case 'CHWP':
        case 'CAUX':
        case 'TNAM':
          offset = genericSectionReader(buffer, offset)
          break
        case 'TILE':
          offset = tileReader(buffer, offset)
          break
        case 'ZONE':
          offset = zoneReader(buffer, offset)
          break
        case 'ENDF':
          keepReading = false
          break
        default:
          throw new Error(`Unknown section: ${section}, offset: ${offset.toString(16)}`)
      }
    }
  })
}

function versionReader (buffer, offset) {
  const buf = buffer.slice(offset, offset+4)
  console.log('version buffer',buf)
  const version = buf.swap16().readUInt32LE()
  console.log('version',version)

  return offset + 4
}

function genericSectionReader (buffer, offset) {
  const sectionLength = buffer.readUInt32LE(offset)
  offset += 4
  console.log('  sectionLength',`0x${sectionLength.toString(16)}`)
  console.log('  sectionData',buffer.slice(offset,offset+20))

  return offset + sectionLength
}

function zoneReader (buffer, offset) {
  const count = buffer.readUInt16LE(offset)
  offset += 2
  console.log('    zone count:',count)
  for (let i = 0; i < count; i++) {
    // unknown
    offset += 2

    // zoneLength
    const zoneLength = buffer.readUInt32LE(offset)
    offset += 4
    // console.log('    zoneLength',zoneLength)

    // zoneData
    // console.log('    zoneData',buffer.slice(offset,20))
    offset += zoneLength
  }

  return offset
}