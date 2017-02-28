/// <reference path="../src/references.ts" />
var cxMidi = require('midi-file');
var nodeFs = require('fs');
var path = require("path");
var stringify = require('json-stable-stringify');
var CxSheet;
(function (CxSheet) {
    //
    // Utilities
    //
    function normalizePath(_path) {
        // var resolvePath  = _path.match(/^\./) ? path.resolve(_path) : _path
        var fullPath = _path.match(/^\./) ? path.resolve(__dirname + "/" + _path) : _path;
        return fullPath;
    }
    CxSheet.normalizePath = normalizePath;
    function getOutFilePath(_outFile, _ext) {
        if (_ext === void 0) { _ext = ""; }
        var outFile = _outFile.match(/^$/) ? this.midiInPath : normalizePath(_outFile);
        var ext = _ext.match(/^\./) ? path.extname(outFile) : _ext;
        var base = path.basename(outFile, ext);
        var dir = path.dirname(outFile);
        var outFilePath = dir + "/" + base + "_out/" + ext;
        return outFilePath;
    }
    CxSheet.getOutFilePath = getOutFilePath;
    function writeJsonArr(arr, _jsonOutPath) {
        if (_jsonOutPath === void 0) { _jsonOutPath = ""; }
        var jsonOutPath = _jsonOutPath.match(/^$/) ? getOutFilePath(_jsonOutPath) : normalizePath(_jsonOutPath);
        // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
        // Using native Javascript arrays makes the code portable to the browser or non-node environments
        var outputBuffer = new Buffer(stringify(arr, { space: '  ' }));
        // Write to a new MIDI file.  it should match the original
        nodeFs.writeFileSync(jsonOutPath, outputBuffer);
    }
    CxSheet.writeJsonArr = writeJsonArr;
    function writeJson(map, _jsonOutPath) {
        if (_jsonOutPath === void 0) { _jsonOutPath = ""; }
        var jsonOutPath = _jsonOutPath.match(/^$/) ? getOutFilePath(_jsonOutPath) : normalizePath(_jsonOutPath);
        // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
        // Using native Javascript arrays makes the code portable to the browser or non-node environments
        var outputBuffer = new Buffer(stringify(map, { space: '  ' }));
        // Write to a new MIDI file.  it should match the original
        nodeFs.writeFileSync(jsonOutPath, outputBuffer);
    }
    CxSheet.writeJson = writeJson;
    var MidiIO = (function () {
        function MidiIO(_midiInPath, _midiOutName, hub) {
            if (_midiOutName === void 0) { _midiOutName = ""; }
            if (hub === void 0) { hub = new CxSheet.DataHub(); }
            this.hub = hub;
            hub.midiInPath = normalizePath(_midiInPath);
            hub.midiOutPath = _midiOutName.match(/^$/) ? getOutFilePath(hub.midiInPath) : normalizePath(_midiOutName);
            this.readFile();
        }
        MidiIO.prototype.getDataHub = function () { return this.hub; };
        MidiIO.prototype.readFile = function (parsedIdx) {
            if (parsedIdx === void 0) { parsedIdx = 0; }
            // Read MIDI file into a buffer
            var input = nodeFs.readFileSync(this.hub.midiInPath);
            // Parse it into an intermediate representation
            // This will take any array-like object.  It just needs to support .length, .slice, and the [] indexed element getter.
            // Buffers do that, so do native JS arrays, typed arrays, etc.
            this.hub.parsed[parsedIdx] = cxMidi.parseMidi(input);
        };
        MidiIO.prototype.writeFile = function (_midiOutPath, parsedIdx) {
            if (_midiOutPath === void 0) { _midiOutPath = ""; }
            if (parsedIdx === void 0) { parsedIdx = 0; }
            var midiOutPath = _midiOutPath.match(/^$/) ? getOutFilePath(this.hub.midiInPath, '_out.mid') : normalizePath(_midiOutPath);
            // Turn the intermediate representation back into raw bytes
            var output = cxMidi.writeMidi(this.hub.parsed[parsedIdx]);
            // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
            // Using native Javascript arrays makes the code portable to the browser or non-node environments
            var outputBuffer = new Buffer(output);
            // Write to a new MIDI file.  it should match the original
            nodeFs.writeFileSync(midiOutPath, outputBuffer);
        };
        MidiIO.prototype.writeJsonFile = function (_jsonOutPath, parsedIdx) {
            if (_jsonOutPath === void 0) { _jsonOutPath = ""; }
            if (parsedIdx === void 0) { parsedIdx = 0; }
            var jsonOutPath = _jsonOutPath.match(/^$/) ? getOutFilePath(_jsonOutPath) : normalizePath(_jsonOutPath);
            // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
            // Using native Javascript arrays makes the code portable to the browser or non-node environments
            var outputBuffer = new Buffer(stringify(this.hub.parsed[parsedIdx], { space: '  ' }));
            // Write to a new MIDI file.  it should match the original
            nodeFs.writeFileSync(jsonOutPath, outputBuffer);
        };
        MidiIO.prototype.ping = function () {
            return "MidiReader is alive";
        };
        return MidiIO;
    }());
    CxSheet.MidiIO = MidiIO;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=MidiIO.js.map