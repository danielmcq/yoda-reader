'use strict'

const fs = require('fs')
const path = require('path')
const tileReader = require('./lib/tileReader')

main(process.argv.slice(2))

function main (args=[]) {
  const fileName = args.shift()
  const DATA_FILE_PATH = path.join(__dirname, fileName||'YODESK.DTA')

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
          versionReader(fd)
          break
        case 'STUP':
        case 'SNDS':
        case 'PUZ2':
        case 'CHAR':
        case 'CHWP':
        case 'CAUX':
        case 'TNAM':
          genericSectionReader(fd)
          break
        case 'TILE':
          tileReader(fd)
          break
        case 'ZONE':
          zoneReader(fd)
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

function versionReader (fd) {
  const buffer = Buffer.alloc(4)
  fs.readSync(fd,buffer,0,4)
  console.log('buffer',buffer)
  const version = buffer.swap16().readUInt32LE()
  console.log('version',version)
}

function genericSectionReader (fd) {
  let buffer

  buffer = Buffer.alloc(4)
  fs.readSync(fd,buffer,0,4)
  const sectionLength = buffer.readUInt32LE()
  console.log('  sectionLength',sectionLength)
  buffer = Buffer.alloc(sectionLength)
  fs.readSync(fd,buffer,0,sectionLength)
  console.log('  sectionData',buffer.slice(0,20))
}

function zoneReader (fd) {
  let buffer

  buffer = Buffer.alloc(2)
  fs.readSync(fd,buffer,0,2)
  const count = buffer.readUInt16LE()
  for (let i = 0; i < count; i++) {
    // unknown
    buffer = Buffer.alloc(2)
    fs.readSync(fd,buffer,0,2)

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
}