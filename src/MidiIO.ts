
/// <reference path="../src/references.ts" />


var cxMidi    = require('midi-file')
var nodeFs    = require('fs')
var path      = require("path")
var stringify = require('json-stable-stringify')

namespace CxSheet { 

    //
    // Utilities
    //
    export function normalizePath(_path: string) {
        // var resolvePath  = _path.match(/^\./) ? path.resolve(_path) : _path
        var fullPath     = _path.match(/^\./) ? path.resolve(__dirname + "/" + _path) : _path
        return fullPath
    }

    export function getOutFilePath(_outFile: string, _ext : string = "" ): string {
        var outFile = _outFile.match(/^$/) ? this.midiInPath : normalizePath(_outFile)
        var ext  = _ext.match(/^\./) ? path.extname(outFile): _ext
        var base = path.basename(outFile, ext)
        var dir  = path.dirname(outFile);
        var outFilePath = dir + "/" + base + "_out/" + ext
        return outFilePath
    }

    export function writeJsonArr(arr: any[], _jsonOutPath: string = "") {
        var jsonOutPath = _jsonOutPath.match(/^$/) ? getOutFilePath(_jsonOutPath): normalizePath(_jsonOutPath)
        // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
        // Using native Javascript arrays makes the code portable to the browser or non-node environments
        var outputBuffer = new Buffer( stringify(arr, { space: '  ' }) )  
        // Write to a new MIDI file.  it should match the original
        nodeFs.writeFileSync(jsonOutPath, outputBuffer)
    }

    export function writeJson( map: any, _jsonOutPath: string = "") {
        var jsonOutPath = _jsonOutPath.match(/^$/) ? getOutFilePath(_jsonOutPath): normalizePath(_jsonOutPath)
        // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
        // Using native Javascript arrays makes the code portable to the browser or non-node environments
        var outputBuffer = new Buffer( stringify(map, { space: '  ' }) )  
        // Write to a new MIDI file.  it should match the original
        nodeFs.writeFileSync(jsonOutPath, outputBuffer)
    }
  
    export class MidiIO {

        constructor( _midiInPath: string, _midiOutName: string = "", public hub: DataHub = new DataHub() ) {
            hub.midiInPath  = normalizePath(_midiInPath);
            hub.midiOutPath = _midiOutName.match(/^$/) ? getOutFilePath(hub.midiInPath) : normalizePath(_midiOutName )    
            this.readFile()
        }

        getDataHub(): DataHub { return this.hub }

        readFile( parsedIdx: number = 0 ) {      
            // Read MIDI file into a buffer
            var input = nodeFs.readFileSync(this.hub.midiInPath)
            // Parse it into an intermediate representation
            // This will take any array-like object.  It just needs to support .length, .slice, and the [] indexed element getter.
            // Buffers do that, so do native JS arrays, typed arrays, etc.
            this.hub.parsed[parsedIdx] =  cxMidi.parseMidi(input)
        }

        writeFile(_midiOutPath: string = "", parsedIdx: number = 0 ) {
            var midiOutPath = _midiOutPath.match(/^$/) ? getOutFilePath(this.hub.midiInPath, '_out.mid') : normalizePath(_midiOutPath)
             // Turn the intermediate representation back into raw bytes
            var output = cxMidi.writeMidi(this.hub.parsed[parsedIdx])
            // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
            // Using native Javascript arrays makes the code portable to the browser or non-node environments
            var outputBuffer = new Buffer(output)
            // Write to a new MIDI file.  it should match the original
            nodeFs.writeFileSync(midiOutPath, outputBuffer)
        }

        writeJsonFile(_jsonOutPath: string = "", parsedIdx: number = 0 ) {
            var jsonOutPath = _jsonOutPath.match(/^$/) ? getOutFilePath(_jsonOutPath): normalizePath(_jsonOutPath)
            // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
            // Using native Javascript arrays makes the code portable to the browser or non-node environments
            var outputBuffer = new Buffer( stringify(this.hub.parsed[parsedIdx], { space: '  ' }) ) 
            // Write to a new MIDI file.  it should match the original
            nodeFs.writeFileSync(jsonOutPath, outputBuffer)
        }
    
        ping() {
            return "MidiReader is alive"
        }

    }
}