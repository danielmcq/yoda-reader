'use strict'

const fs      = require('fs')
const ImageJS = require('imagejs')
const palette = require('./palette')
const path    = require('path')

const COLORS = {
  TRANSPARENT: {r: 255, g: 255, b: 255, a: 0},
}

const TILE_DIR_PATH = path.join(process.cwd(), 'tiles')

const TILE_SECTION_LENGTH_HEADER_SIZE_IN_BYTES = 4

const TILE_HEADER_LENGTH_IN_BYTES = 4
const TILE_PIXEL_SIZE_IN_BYTES = 1
const TILE_HEIGHT = 32
const TILE_WIDTH = 32
const TILE_SIZE_IN_BYTES = TILE_HEIGHT*TILE_WIDTH*TILE_PIXEL_SIZE_IN_BYTES
const TILE_TOTAL_SIZE_IN_BYTES = TILE_SIZE_IN_BYTES+TILE_HEADER_LENGTH_IN_BYTES

module.exports = (buffer, offset)=>{
  if (!fs.existsSync(TILE_DIR_PATH))
    fs.mkdirSync(TILE_DIR_PATH)

  const tileSectionLengthInBytes = buffer.readUInt32LE(offset)
  offset += TILE_SECTION_LENGTH_HEADER_SIZE_IN_BYTES
  console.log('tile section offset',offset.toString(16), tileSectionLengthInBytes.toString(16))

  const totalTiles = tileSectionLengthInBytes / TILE_TOTAL_SIZE_IN_BYTES
  const sectionBuffer = buffer.slice(offset,offset+TILE_TOTAL_SIZE_IN_BYTES*totalTiles)

  let tile, i
  for (i = 0; i < totalTiles; i++) {
    // console.log('  tile offset:',offset.toString(16))
    tile = tileFactory(sectionBuffer, i)

    const filename = path.join(TILE_DIR_PATH, `./${i.toString().padStart(4,'0')}_${tile.header.typeRaw.toString(2).padStart(8,'0')}.png`)
    tile.bmp.writeFile(filename,{type: ImageJS.ImageType.PNG})
    offset += TILE_TOTAL_SIZE_IN_BYTES
    if (i % 7 === 0) console.log(`tile # ${i} has type of ${JSON.stringify(tile.header,0,2)}, typeRaw: ${tile.header.typeRaw.toString(2).padStart(8,'0')}, rawHeader: ${tile.headerRaw.toString(2).padStart(32,'0')}`)
    // const tile4x = bmp.resize({
    //   width:     128, height:    128,
    //   algorithm: 'nearestNeighbor',
    // }).blur()
    // const tile4xFilename = path.join(TILE_DIR_PATH, `./${tileNumber.toString().padStart(4,'0')}_4x.png`)
    // tile4x.writeFile(tile4xFilename,{type: ImageJS.ImageType.PNG})
  }

  return offset
}

function tileFactory (buffer, tileNumber=0) {
  let offset = tileNumber*TILE_TOTAL_SIZE_IN_BYTES
  // console.log('  tile #',tileNumber)
  // flags for tile
  // console.log('  tileFactory buffer',buffer, buffer.length.toString(16))
  const headerRaw = buffer.readUInt32LE(offset)
  const header = parseRawHeader(headerRaw)
  // console.log('    flags: ', flags.toString(2).padStart(32,'0'))
  offset += TILE_HEADER_LENGTH_IN_BYTES

  const bmp = bmpFactory()

  buffer.slice(offset, offset+TILE_SIZE_IN_BYTES).forEach((pixelData,i)=>{
    // if pixelData is 0, then leave as transparent
    if (pixelData) {
      const r = palette[pixelData*4+2]
      const g = palette[pixelData*4+1]
      const b = palette[pixelData*4+0]
      const transparency = 0xff
      const x = i%TILE_WIDTH
      const y = Math.floor(i/TILE_HEIGHT)
      bmp.setPixel(x, y, r, g, b, transparency)
    }
  })

  return {
    bmp,
    header,
    headerRaw,
  }
}

function bmpFactory () {
  return new ImageJS.Bitmap({
    width:  TILE_WIDTH,
    height: TILE_HEIGHT,
    color:  COLORS.TRANSPARENT,
  })
}

function parseRawHeader (typeRaw) {
  const data = {
    flags: {},
    typeRaw,
  }

  const {flags} = data

  if (typeRaw & 1<<0) flags['game_object'] = true
  if (typeRaw & 1<<1) flags['non_colliding_behind_player'] = true
  if (typeRaw & 1<<2) flags['colliding_middle_layer'] = true
  if (typeRaw & 1<<3) flags['push_pull_block'] = true
  if (typeRaw & 1<<4) flags['non_colliding_above_player'] = true
  if (typeRaw & 1<<5) flags['mini_map'] = true
  if (typeRaw & 1<<6) flags['weapon'] = true
  if (typeRaw & 1<<7) flags['item'] = true
  if (typeRaw & 1<<8) flags['character'] = true

  if (flags['weapon']) {
    if (typeRaw & 1<<16) flags['weapon_light_blaster'] = true
    if (typeRaw & 1<<17) flags['weapon_heavy_blaster_or_thermal_detonator'] = true
    if (typeRaw & 1<<18) flags['weapon_lightsaber'] = true
    if (typeRaw & 1<<19) flags['weapon_the_force'] = true
  }
  else if (flags['item']) {
    if (typeRaw & 1<<16) flags['item_keycard'] = true
    if (typeRaw & 1<<17) flags['item_puzzle_item'] = true
    if (typeRaw & 1<<18) flags['item_puzzle_item_rare'] = true
    if (typeRaw & 1<<19) flags['item_puzzle_item_key_item'] = true
    if (typeRaw & 1<<20) flags['item_locator'] = true
    if (typeRaw & 1<<22) flags['item_health_pack'] = true
  }
  else if (flags['character']) {
    if (typeRaw & 1<<16) flags['char_player'] = true
    if (typeRaw & 1<<17) flags['char_enemy'] = true
    if (typeRaw & 1<<18) flags['char_friendly'] = true
  }
  else {
    if (typeRaw & 1<<16) flags['door'] = true
  }

  if (flags['mini_map']) {
    if (typeRaw & 1<<17) flags['mm_home'] = true
    if (typeRaw & 1<<18) flags['mm_puzzle_unsolved'] = true
    if (typeRaw & 1<<19) flags['mm_puzzle_solved'] = true
    if (typeRaw & 1<<20) flags['mm_gateway_unsolved'] = true
    if (typeRaw & 1<<21) flags['mm_gateway_solved'] = true
    if (typeRaw & 1<<22) flags['mm_up_wall_locked'] = true
    if (typeRaw & 1<<23) flags['mm_down_wall_locked'] = true
    if (typeRaw & 1<<24) flags['mm_left_wall_locked'] = true
    if (typeRaw & 1<<25) flags['mm_right_wall_locked'] = true
    if (typeRaw & 1<<26) flags['mm_up_wall_unlocked'] = true
    if (typeRaw & 1<<27) flags['mm_down_wall_unlocked'] = true
    if (typeRaw & 1<<28) flags['mm_left_wall_unlocked'] = true
    if (typeRaw & 1<<29) flags['mm_right_wall_unlocked'] = true
    if (typeRaw & 1<<30) flags['mm_objective'] = true
  }

  return data
}