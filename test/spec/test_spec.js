var cxMidi = require("midi-file");

var nodeFs = require("fs");

var path = require("path");

var CxSheet;

(function(CxSheet) {
    var MidiIO = function() {
        function MidiIO(_midiInPath, _midiOutName) {
            if (_midiOutName === void 0) {
                _midiOutName = "";
            }
            this.midiInPath = this.normalizePath(_midiInPath);
            this.midiOutPath = _midiOutName.match(/^$/) ? this.getOutFilePath(this.midiInPath) : this.normalizePath(_midiOutName);
            this.readFile();
        }
        MidiIO.prototype.normalizePath = function(_path) {
            return _path.match(/^\./) ? path.resolve(__dirname + "/" + _path) : _path;
        };
        MidiIO.prototype.getOutFilePath = function(_outFile, _ext) {
            if (_ext === void 0) {
                _ext = "";
            }
            var outFile = _outFile.match(/^$/) ? this.midiInPath : this.normalizePath(_outFile);
            var ext = _ext.match(/^\./) ? path.extname(outFile) : _ext;
            var base = path.basename(outFile, ext);
            var dir = path.dirname(outFile);
            var outFilePath = dir + "/" + base + "_out/" + ext;
            return outFilePath;
        };
        MidiIO.prototype.readFile = function() {
            var input = nodeFs.readFileSync(this.midiInPath);
            this.parsed = cxMidi.parseMidi(input);
        };
        MidiIO.prototype.writeFile = function(_midiOutPath) {
            if (_midiOutPath === void 0) {
                _midiOutPath = "";
            }
            var midiOutPath = _midiOutPath.match(/^$/) ? this.getOutFilePath(this.midiInPath, ".json") : this.normalizePath(_midiOutPath);
            var output = cxMidi.writeMidi(this.parsed);
            var outputBuffer = new Buffer(output);
            nodeFs.writeFileSync(midiOutPath, outputBuffer);
        };
        MidiIO.prototype.writeJsonFile = function(_jsonOutPath) {
            if (_jsonOutPath === void 0) {
                _jsonOutPath = "";
            }
            var jsonOutPath = _jsonOutPath.match(/^$/) ? this.getOutFilePath(_jsonOutPath) : this.normalizePath(_jsonOutPath);
            var outputBuffer = new Buffer(JSON.stringify(this.parsed, null, "  "));
            nodeFs.writeFileSync(jsonOutPath, outputBuffer);
        };
        MidiIO.prototype.printMidi = function() {
            console.log(JSON.stringify(this.parsed, null, "  "));
        };
        MidiIO.prototype.ping = function() {
            return "MidiReader is alive";
        };
        return MidiIO;
    }();
    CxSheet.MidiIO = MidiIO;
})(CxSheet || (CxSheet = {}));

var _ = require("lodash");

var CxSheet;

(function(CxSheet) {
    var Beats = function() {
        function Beats(barGrid, barCounter, beatCounter) {
            if (barCounter === void 0) {
                barCounter = 0;
            }
            if (beatCounter === void 0) {
                beatCounter = 0;
            }
            this.barGrid = barGrid;
            this.barCounter = barCounter;
            this.beatCounter = beatCounter;
            this.beatsSortKey = 0;
            this.prevBeatRealTime = 0;
            this.timeIdx = 0;
            while (this.timeIdx + 1 < barGrid.timeSignatures.length && barGrid.timeSignatures[this.timeIdx + 1].realTime == 0) {
                this.timeIdx++;
            }
            this.ticksPerBeat = barGrid.midi.parsed.header.ticksPerBeat;
            this.beatsPerBar = barGrid.timeSignatures[this.timeIdx].numerator;
            this.ticksPerBar = this.beatsPerBar * this.ticksPerBeat;
            this.prevTimeSigRealTime = barGrid.timeSignatures[this.timeIdx].realTime;
        }
        Beats.prototype.getSignature = function(realTime) {
            if (realTime === void 0) {
                realTime = -1;
            }
            var barCount = Math.floor(this.beatCounter / this.beatsPerBar) + 1;
            var beatCount = this.beatCounter % this.beatsPerBar + 1;
            var _ticks = realTime == -1 ? 0 : realTime - this.prevBeatRealTime;
            var bar = ("0000" + barCount).slice(-4);
            var beat = ("00" + beatCount).slice(-2);
            var ticks = ("00" + _ticks).slice(-3);
            return bar + "." + beat + "." + ticks;
        };
        Beats.prototype.getBeatSignature = function() {
            return this.getSignature();
        };
        Beats.prototype.addSignature = function(event) {
            while (event.realTime >= this.prevBeatRealTime + this.ticksPerBeat) {
                this.addBeatMarker();
            }
            event.sortKey = this.beatsSortKey++;
            event.signature = this.getSignature(event.realTime);
            this.barGrid.grid.push(event);
        };
        Beats.prototype.addBeatMarker = function() {
            var nextBeat = this.prevBeatRealTime + this.ticksPerBeat;
            var event = {
                deltaTime: this.ticksPerBeat,
                type: "beat",
                realTime: nextBeat,
                track: this.barGrid.midi.parsed.tracks.length,
                sortKey: this.beatsSortKey++,
                meta: true,
                text: this.getBeatSignature()
            };
            this.barGrid.bars.push(event);
            this.beatCounter++;
            this.prevBeatRealTime += this.ticksPerBeat;
        };
        return Beats;
    }();
    CxSheet.Beats = Beats;
    var BarGrid = function() {
        function BarGrid(midi) {
            this.midi = midi;
            this.grid = [];
            this.bars = [];
            this.maxRealtime = 0;
            this.timeSignatures = [];
            this.realTimePointer = 0;
            this.self = this;
            this.buildGrid();
        }
        BarGrid.prototype.extendedParsing = function() {
            var song = this.midi.parsed;
            for (var t = 0; t < song.tracks.length; t++) {
                if (song.tracks[t].length > 0) {
                    for (var e = 0; e < song.tracks[t].length; e++) {
                        song.tracks[t][e].track = t;
                        song.tracks[t][e].realTime = e == 0 ? song.tracks[t][e].deltaTime : song.tracks[t][e].deltaTime + song.tracks[t][e - 1].realTime;
                        song.tracks[t][e].sortKey = e;
                        if (song.tracks[t][e].type == "timeSignature") {
                            this.timeSignatures.push(song.tracks[0][e]);
                        }
                        this.maxRealtime = song.tracks[t][e].realTime > this.maxRealtime ? song.tracks[t][e].realTime : this.maxRealtime;
                    }
                }
            }
            this.timeSignatures = _.sortBy(this.timeSignatures, "realtime");
        };
        BarGrid.prototype.buildGrid = function() {
            var song = this.midi.parsed;
            if (_.isEmpty(this.timeSignatures)) {
                this.extendedParsing();
            }
            var beats = new Beats(this.self);
            var trackEvents = _.orderBy(_.flatten(song.tracks), [ "realTime", "track", "sortKey" ], [ "asc", "asc", "asc" ]);
            this.writeJsonFile(trackEvents, "C:\\work\\CxSheet\\resource\\trackEvents.json");
            for (var e = 0; e < trackEvents.length; e++) {
                beats.addSignature(trackEvents[e]);
            }
            var lastEntry = this.grid.length - 1;
            if (lastEntry >= 0 && this.grid[this.grid.length - 1].type != "beat") {
                beats.addBeatMarker();
            }
        };
        BarGrid.prototype.writeJsonFile = function(arr, _jsonOutPath) {
            if (_jsonOutPath === void 0) {
                _jsonOutPath = "";
            }
            var jsonOutPath = _jsonOutPath.match(/^$/) ? this.midi.getOutFilePath(_jsonOutPath) : this.midi.normalizePath(_jsonOutPath);
            var outputBuffer = new Buffer(JSON.stringify(arr, null, "  "));
            nodeFs.writeFileSync(jsonOutPath, outputBuffer);
        };
        return BarGrid;
    }();
    CxSheet.BarGrid = BarGrid;
})(CxSheet || (CxSheet = {}));

var _ = require("lodash");

var CxSheet;

(function(CxSheet) {
    var App = function() {
        function App(fileName) {
            this.midiIO = [];
            this.barGrid = [];
            this.fileCount = 0;
            if (!_.isEmpty(fileName)) {
                this.readMidiFile(fileName);
            }
        }
        App.prototype.readMidiFile = function(fileName) {
            var midi = new CxSheet.MidiIO(fileName);
            this.midiIO.push(midi);
            this.barGrid.push(new CxSheet.BarGrid(midi));
            this.fileCount = this.midiIO.length;
        };
        return App;
    }();
    CxSheet.App = App;
})(CxSheet || (CxSheet = {}));

var myApp = new CxSheet.App("../../resource/sultans-of-swing.mid");

describe("Testing CxSheet", function() {
    it("CxSheet.MidiReader can read a midi file", function() {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        expect(readerInst.ping()).toEqual("MidiReader is alive");
        expect(readerInst.midiInPath).toBeDefined();
        expect(readerInst.parsed).toBeDefined();
        readerInst.writeJsonFile("C:/work/CxSheet/resource/sultans-of-swing.json");
    });
    it("CxSheet.BarGrid can produce a barGrid", function() {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var barGrid = new CxSheet.BarGrid(readerInst);
        expect(barGrid.maxRealtime).toBeGreaterThan(0);
        expect(barGrid.grid.length).toBeGreaterThan(0);
        barGrid.writeJsonFile(barGrid.grid, "C:/work/CxSheet/resource/sultans-of-list.json");
        for (var e = 1; e < barGrid.grid.length; e++) {
            expect(barGrid.grid[e].realTime >= barGrid.grid[e - 1].realTime).toBeTruthy();
        }
        barGrid.writeJsonFile(barGrid.grid, "C:/work/CxSheet/resource/sultans-of-list.json");
    });
});