var fs = require('fs')
var parseMidi = require('midi-file').parseMidi
var writeMidi = require('midi-file').writeMidi

// Read MIDI file into a buffer
var input = fs.readFileSync("C:/work/CxSheet/resource/sultans-of-swing.mid")

// Parse it into an intermediate representation
// This will take any array-like object.  It just needs to support .length, .slice, and the [] indexed element getter.
// Buffers do that, so do native JS arrays, typed arrays, etc.
var parsed = parseMidi(input)

// Turn the intermediate representation back into raw bytes
var output = writeMidi(parsed)

// Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
// Using native Javascript arrays makes the code portable to the browser or non-node environments
var outputBuffer = new Buffer(output)

// Write to a new MIDI file.  it should match the original
fs.writeFileSync("C:/work/CxSheet/resource/sultans-of-swing_copy.mid", outputBuffer)