'use strict'

const fs = require('fs')
const path = require('path')

const DATA_FILE_PATH = path.join(__dirname, 'YODESK.DTA')

main()

function main (args=[]) {
  const binaryReader = fs.createReadStream(DATA_FILE_PATH, {highWaterMark: 4})

  let keepReading = true

  let section
  let sectionLength
  let mode
  let sectionData = []
  let version

  binaryReader.on('data',chunk=>{
    // console.log('data', chunk.length, chunk.toString())

    if (!mode) {
      section = chunk.toString()

      switch (section) {
        case 'VERS':
          mode = section
          break
        case "STUP":
        case "SNDS":
        case "ZONE":
        case "TILE":
        case "PUZ2":
        case "CHAR":
        case "CHWP":
        case "CAUX":
        case "TNAM":
          mode = 'READLENGTH'

          break
        default:
          // TODO
          break
      }
    } else {
      switch (mode) {
        case 'VERS':
          version = Buffer.from(chunk).readUInt16BE()
          console.log('version',version, chunk)
          mode = null
          break
        case "STUP":
        case "SNDS":
        case "ZONE":
        case "TILE":
        case "PUZ2":
        case "CHAR":
        case "CHWP":
        case "CAUX":
        case "TNAM":
          if (sectionData.length*4 <= sectionLength) {
            sectionData.push(chunk)
          } else {
            console.log('sectionData', mode,sectionData.length)
            mode = null
          }
          break
        case 'READLENGTH':
          sectionLength = Buffer.from(chunk).readUInt16LE()
          mode = section
          break
        default:
          break
      }
    }
  })
}

/*
static void Main(string[] args)
{
  using (BinaryReader binaryReader = new BinaryReader(File.OpenRead("YODESK.DTA")))
  {
    bool keepReading = true
    while (keepReading)
    {
      string section = new string(binaryReader.ReadChars(4))
      switch (section)
      {
        case "VERS":
          uint version = binaryReader.ReadUInt32()
          break
        case "STUP":
        case "SNDS":
        case "ZONE":
        case "TILE":
        case "PUZ2":
        case "CHAR":
        case "CHWP":
        case "CAUX":
        case "TNAM":
          uint sectionLength = binaryReader.ReadUInt32()
          byte[] sectionData = binaryReader.ReadBytes((int)sectionLength)
          break
        case "ENDF":
          keepReading = false
          break
      }
    }
  }
}
*/