"use strict"

const fs = require("fs")
const path = require("path")

const DATA_FILE = path.join(__dirname, "YODESK.DTA")

let section, version, sectionLength, sectionData
let sectionMeta = {}
let data = {}

let fileRead = fs.createReadStream(DATA_FILE, {
	flags: "r",
	encoding: null,
	highWaterMark: 4
}).on("data",(chunk)=>{
	if (!section) {
		section = chunk.toString()
		console.log("section", section)

		sectionMeta[section] = {
			size: 0,
			data: null,
			rawData: null
		}
		switch(section) {
			case "VERS":
				if (!sectionMeta[section].size) {
					sectionMeta[section].size = 4*8
					sectionMeta[section].offset = 0
					sectionMeta[section].rawData = new Buffer(4)
				}
				// if (sectionMeta[section].rawData.length < sectionMeta[section].size) {
				if (sectionMeta[section].offset < sectionMeta[section].size) {
					sectionMeta[section].rawData.write(chunk.toString(), sectionMeta[section].offset)
					sectionMeta[section].offset += 4
				} else if (sectionMeta[section].rawData.length === sectionMeta[section].size) {
					// sectionMeta[section].data = (Number(sectionMeta[section].rawData)<<32)>>>0
					sectionMeta[section].data = sectionMeta[section].rawData.readUInt32LE(0)
					// sectionMeta[section].data = sectionMeta[section].rawData.readUInt32LE(0, 4)
					console.log("the data is", sectionMeta[section].data)
					section = null
				}
				break;
		// 		uint version = binaryReader.ReadUInt32();
		// 		break;
		// 	case "STUP":
		// 	case "SNDS":
		// 	case "ZONE":
		// 	case "TILE":
		// 	case "PUZ2":
		// 	case "CHAR":
		// 	case "CHWP":
		// 	case "CAUX":
		// 	case "TNAM":
		// 		uint sectionLength = binaryReader.ReadUInt32();
		// 		byte[] sectionData = binaryReader.ReadBytes((int)sectionLength);
		// 		break;
		// 	case "ENDF":
		// 		keepReading = false;
		// 		break;
		}
	}
	// console.log("the chunk is", chunk)
}).on("end",()=>{
	console.log("end of stream")
})