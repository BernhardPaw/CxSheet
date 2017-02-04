/// <reference path="../src/references.ts" />
var cxMidi = require('midi-file');
var nodeFs = require('fs');
var path = require("path");
var CxSheet;
(function (CxSheet) {
    var MidiIO = (function () {
        // public barGrid:     CxSheet.BarGrid  
        function MidiIO(_midiInPath, _midiOutName) {
            if (_midiOutName === void 0) { _midiOutName = ""; }
            this.midiInPath = this.normalizePath(_midiInPath);
            this.midiOutPath = _midiOutName.match(/^$/) ? this.getOutFilePath(this.midiInPath) : this.normalizePath(_midiOutName);
            this.readFile();
        }
        MidiIO.prototype.normalizePath = function (_path) {
            return _path.match(/^\./) ? path.resolve(__dirname + "/" + _path) : _path;
        };
        MidiIO.prototype.getOutFilePath = function (_outFile, _ext) {
            if (_ext === void 0) { _ext = ""; }
            var outFile = _outFile.match(/^$/) ? this.midiInPath : this.normalizePath(_outFile);
            var ext = _ext.match(/^\./) ? path.extname(outFile) : _ext;
            var base = path.basename(outFile, ext);
            var dir = path.dirname(outFile);
            var outFilePath = dir + "/" + base + "_out/" + ext;
            return outFilePath;
        };
        MidiIO.prototype.readFile = function () {
            // Read MIDI file into a buffer
            var input = nodeFs.readFileSync(this.midiInPath);
            // Parse it into an intermediate representation
            // This will take any array-like object.  It just needs to support .length, .slice, and the [] indexed element getter.
            // Buffers do that, so do native JS arrays, typed arrays, etc.
            this.parsed = cxMidi.parseMidi(input);
        };
        MidiIO.prototype.writeFile = function (_midiOutPath) {
            if (_midiOutPath === void 0) { _midiOutPath = ""; }
            var midiOutPath = _midiOutPath.match(/^$/) ? this.getOutFilePath(this.midiInPath, '.json') : this.normalizePath(_midiOutPath);
            // Turn the intermediate representation back into raw bytes
            var output = cxMidi.writeMidi(this.parsed);
            // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
            // Using native Javascript arrays makes the code portable to the browser or non-node environments
            var outputBuffer = new Buffer(output);
            // Write to a new MIDI file.  it should match the original
            nodeFs.writeFileSync(midiOutPath, outputBuffer);
        };
        MidiIO.prototype.writeJsonFile = function (_jsonOutPath) {
            if (_jsonOutPath === void 0) { _jsonOutPath = ""; }
            var jsonOutPath = _jsonOutPath.match(/^$/) ? this.getOutFilePath(_jsonOutPath) : this.normalizePath(_jsonOutPath);
            // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
            // Using native Javascript arrays makes the code portable to the browser or non-node environments
            var outputBuffer = new Buffer(JSON.stringify(this.parsed, null, '  '));
            // Write to a new MIDI file.  it should match the original
            nodeFs.writeFileSync(jsonOutPath, outputBuffer);
        };
        MidiIO.prototype.printMidi = function () {
            console.log(JSON.stringify(this.parsed, null, '  '));
        };
        MidiIO.prototype.ping = function () {
            return "MidiReader is alive";
        };
        return MidiIO;
    }());
    CxSheet.MidiIO = MidiIO;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=MidiIO.js.map