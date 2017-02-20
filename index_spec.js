var ProgramType;

(function(ProgramType) {
    ProgramType[ProgramType["chords"] = 0] = "chords";
    ProgramType[ProgramType["bass"] = 1] = "bass";
    ProgramType[ProgramType["drums"] = 2] = "drums";
})(ProgramType || (ProgramType = {}));

var CxSheet;

(function(CxSheet) {
    var DataHub = function() {
        function DataHub() {
            this.parsed = [];
            this.grids = [];
            this.timeSignatures = [];
            this.bars = [];
        }
        DataHub.prototype.getChordTracks = function(includeBass) {
            var data = this.chordTracksCh;
            var tracks = [];
            if (includeBass) {
                data = _.concat(this.chordTracksCh, this.bassTracksCh);
            }
            for (var i = 0; i < data.length; i++) {
                tracks.push(data[i].track);
            }
            return _.uniq(tracks).sort();
        };
        DataHub.prototype.getDrumTracks = function() {
            var data = this.drumTracksCh;
            var tracks = [];
            for (var i = 0; i < data.length; i++) {
                tracks.push(data[i].track);
            }
            return _.uniq(tracks).sort();
        };
        DataHub.prototype.getTrackEvents = function(tracks, pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var events = _.sortBy(_.filter(this.grids[pIdx], function(e) {
                return tracks.indexOf(e.track) > -1 && e.type == "noteOn";
            }), [ "realTime", "track", "sortKey" ]);
            return events;
        };
        return DataHub;
    }();
    CxSheet.DataHub = DataHub;
})(CxSheet || (CxSheet = {}));

var cxMidi = require("midi-file");

var nodeFs = require("fs");

var path = require("path");

var stringify = require("json-stable-stringify");

var CxSheet;

(function(CxSheet) {
    function normalizePath(_path) {
        var fullPath = _path.match(/^\./) ? path.resolve(__dirname + "/" + _path) : _path;
        return fullPath;
    }
    CxSheet.normalizePath = normalizePath;
    function getOutFilePath(_outFile, _ext) {
        if (_ext === void 0) {
            _ext = "";
        }
        var outFile = _outFile.match(/^$/) ? this.midiInPath : normalizePath(_outFile);
        var ext = _ext.match(/^\./) ? path.extname(outFile) : _ext;
        var base = path.basename(outFile, ext);
        var dir = path.dirname(outFile);
        var outFilePath = dir + "/" + base + "_out/" + ext;
        return outFilePath;
    }
    CxSheet.getOutFilePath = getOutFilePath;
    function writeJsonArr(arr, _jsonOutPath) {
        if (_jsonOutPath === void 0) {
            _jsonOutPath = "";
        }
        var jsonOutPath = _jsonOutPath.match(/^$/) ? getOutFilePath(_jsonOutPath) : normalizePath(_jsonOutPath);
        var outputBuffer = new Buffer(stringify(arr, {
            space: "  "
        }));
        nodeFs.writeFileSync(jsonOutPath, outputBuffer);
    }
    CxSheet.writeJsonArr = writeJsonArr;
    var MidiIO = function() {
        function MidiIO(_midiInPath, _midiOutName, hub) {
            if (_midiOutName === void 0) {
                _midiOutName = "";
            }
            if (hub === void 0) {
                hub = new CxSheet.DataHub();
            }
            this.hub = hub;
            hub.midiInPath = normalizePath(_midiInPath);
            hub.midiOutPath = _midiOutName.match(/^$/) ? getOutFilePath(hub.midiInPath) : normalizePath(_midiOutName);
            this.readFile();
        }
        MidiIO.prototype.getDataHub = function() {
            return this.hub;
        };
        MidiIO.prototype.readFile = function(parsedIdx) {
            if (parsedIdx === void 0) {
                parsedIdx = 0;
            }
            var input = nodeFs.readFileSync(this.hub.midiInPath);
            this.hub.parsed[parsedIdx] = cxMidi.parseMidi(input);
        };
        MidiIO.prototype.writeFile = function(_midiOutPath, parsedIdx) {
            if (_midiOutPath === void 0) {
                _midiOutPath = "";
            }
            if (parsedIdx === void 0) {
                parsedIdx = 0;
            }
            var midiOutPath = _midiOutPath.match(/^$/) ? getOutFilePath(this.hub.midiInPath, "_out.mid") : normalizePath(_midiOutPath);
            var output = cxMidi.writeMidi(this.hub.parsed[parsedIdx]);
            var outputBuffer = new Buffer(output);
            nodeFs.writeFileSync(midiOutPath, outputBuffer);
        };
        MidiIO.prototype.writeJsonFile = function(_jsonOutPath, parsedIdx) {
            if (_jsonOutPath === void 0) {
                _jsonOutPath = "";
            }
            if (parsedIdx === void 0) {
                parsedIdx = 0;
            }
            var jsonOutPath = _jsonOutPath.match(/^$/) ? getOutFilePath(_jsonOutPath) : normalizePath(_jsonOutPath);
            var outputBuffer = new Buffer(stringify(this.hub.parsed[parsedIdx], {
                space: "  "
            }));
            nodeFs.writeFileSync(jsonOutPath, outputBuffer);
        };
        MidiIO.prototype.ping = function() {
            return "MidiReader is alive";
        };
        return MidiIO;
    }();
    CxSheet.MidiIO = MidiIO;
})(CxSheet || (CxSheet = {}));

var __extends = this && this.__extends || function(d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() {
        this.constructor = d;
    }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};

var _ = require("lodash");

var stringify = require("json-stable-stringify");

var CxSheet;

(function(CxSheet) {
    var Beats = function() {
        function Beats(hub, beatCounter) {
            if (beatCounter === void 0) {
                beatCounter = 0;
            }
            this.hub = hub;
            this.beatCounter = beatCounter;
            this.beatsSortKey = 0;
            this.prevBeatRealTime = 0;
            this.timeIdx = 0;
            while (this.timeIdx + 1 < hub.timeSignatures.length && hub.timeSignatures[this.timeIdx + 1].realTime == 0) {
                this.timeIdx++;
            }
        }
        Beats.getTicks = function(signature) {
            return Number(signature.split(".")[2]);
        };
        Beats.getBeat = function(signature) {
            return Number(signature.split(".")[1]);
        };
        Beats.getBar = function(signature) {
            return Number(signature.split(".")[0]);
        };
        Beats.setTicks = function(signature, ticks) {
            return signature.substr(0, 8) + ("00" + ticks).slice(-3);
        };
        Beats.prototype.checkResolution = function(realTime) {
            var timeSignatures = this.hub.timeSignatures;
            if (this.timeIdx + 1 < timeSignatures.length && timeSignatures[this.timeIdx + 1].realTime <= realTime) {
                this.timeIdx++;
                this.setResolution();
            }
        };
        Beats.prototype.setResolution = function(pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            this.ticksPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat;
            this.beatsPerBar = this.hub.timeSignatures.length > this.timeIdx ? this.hub.timeSignatures[this.timeIdx].numerator : 0;
            this.ticksPerBar = this.beatsPerBar * this.ticksPerBeat;
        };
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
                var beatIsABar = Math.floor((this.beatCounter + 1) / this.beatsPerBar) == 0;
                if (beatIsABar) {
                    this.checkResolution(event.realTime);
                }
                this.addBeatMarker();
            }
            event.sortKey = this.beatsSortKey++;
            event.signature = this.getSignature(event.realTime);
        };
        Beats.prototype.addBeatMarker = function(pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var nextBeat = this.prevBeatRealTime + this.ticksPerBeat;
            var event = {
                deltaTime: this.ticksPerBeat,
                type: "beat",
                realTime: nextBeat,
                track: this.hub.parsed[pIdx].tracks.length,
                sortKey: this.beatsSortKey++,
                meta: true,
                text: this.getBeatSignature()
            };
            this.hub.bars.push(event);
            this.beatCounter++;
            this.prevBeatRealTime += this.ticksPerBeat;
        };
        return Beats;
    }();
    CxSheet.Beats = Beats;
    var BarGrid = function(_super) {
        __extends(BarGrid, _super);
        function BarGrid(hub) {
            var _this = _super.call(this, hub) || this;
            _this.hub = hub;
            _this.maxRealtime = 0;
            _this.minDuration = 1e5;
            _this.realTimePointer = 0;
            _this.buildGrid();
            return _this;
        }
        BarGrid.prototype.getDuration = function(t, e, pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var track = this.hub.parsed[pIdx].tracks[t];
            var p = e - 1;
            for (;p >= 0; p--) {
                if (track[p] && track[p].type == "noteOn" && track[p].velocity > 0 && track[p].noteNumber == track[e].noteNumber) {
                    var currDuration = track[p].duration;
                    var newDuration = track[e].realTime - track[p].realTime;
                    if (currDuration == 0 || currDuration > newDuration) {
                        track[p].duration = newDuration;
                        this.minDuration = newDuration < this.minDuration ? newDuration : this.minDuration;
                    } else {
                        this.minDuration = currDuration < this.minDuration ? currDuration : this.minDuration;
                    }
                    break;
                }
            }
        };
        BarGrid.prototype.extendedParsing = function(pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var song = this.hub.parsed[pIdx];
            for (var t = 0; t < song.tracks.length; t++) {
                if (song.tracks[t].length > 0) {
                    for (var e = 0; e < song.tracks[t].length; e++) {
                        song.tracks[t][e].track = t;
                        song.tracks[t][e].realTime = e == 0 ? song.tracks[t][e].deltaTime : song.tracks[t][e].deltaTime + song.tracks[t][e - 1].realTime;
                        song.tracks[t][e].sortKey = e;
                        if (song.tracks[t][e].type == "timeSignature") {
                            this.hub.timeSignatures.push(song.tracks[0][e]);
                            this.setResolution();
                        }
                        song.tracks[t][e].sigIdx = this.hub.timeSignatures.length == 0 ? 0 : this.hub.timeSignatures.length - 1;
                        if (song.tracks[t][e].type == "noteOff" || song.tracks[t][e].type == "noteOn") {
                            song.tracks[t][e].duration = 0;
                            if (song.tracks[t][e].type == "noteOff") {
                                this.getDuration(t, e);
                            } else if (song.tracks[t][e].type == "noteOn" && song.tracks[t][e].velocity == 0) {
                                this.getDuration(t, e);
                            }
                        }
                        this.maxRealtime = song.tracks[t][e].realTime > this.maxRealtime ? song.tracks[t][e].realTime : this.maxRealtime;
                    }
                }
            }
            this.hub.timeSignatures = _.sortBy(this.hub.timeSignatures, "realtime");
        };
        BarGrid.prototype.buildGrid = function(pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var song = this.hub.parsed[pIdx];
            if (_.isEmpty(this.hub.timeSignatures)) {
                this.extendedParsing();
            }
            var trackEvents = _.sortBy(_.flatten(song.tracks), [ "realTime", "track", "sortKey" ]);
            for (var e = 0; e < trackEvents.length; e++) {
                this.addSignature(trackEvents[e]);
            }
            var lastEntry = trackEvents.length - 1;
            if (lastEntry >= 0 && trackEvents[trackEvents.length - 1].type != "beat") {
                this.addBeatMarker();
            }
            this.hub.grids[pIdx] = trackEvents;
            CxSheet.writeJsonArr(this.hub.grids[pIdx], "C:\\work\\CxSheet\\resource\\trackEvents.json");
        };
        return BarGrid;
    }(Beats);
    CxSheet.BarGrid = BarGrid;
})(CxSheet || (CxSheet = {}));

var kmeans = require("node-kmeans");

var CxSheet;

(function(CxSheet) {
    var Analyzer = function() {
        function Analyzer(hub) {
            this.hub = hub;
            this.groupPrograms();
        }
        Analyzer.prototype.groupPrograms = function() {
            var programChanges = _.sortBy(_.filter(this.hub.grids[0], {
                type: "programChange"
            }), [ "realTime", "track", "sortKey" ]);
            for (var e = 0; e < programChanges.length; e++) {
                var p = programChanges[e].programNumber;
                if (p > 0 && p < 33 || p > 40 && p < 113) {
                    programChanges[e].programType = ProgramType.chords;
                } else if (p > 32 && p < 41) {
                    programChanges[e].programType = ProgramType.bass;
                } else {
                    programChanges[e].programType = ProgramType.drums;
                }
            }
            this.hub.programChanges = programChanges;
            this.hub.chordTracksCh = _.sortedUniq(_.sortBy(_.filter(programChanges, {
                programType: ProgramType.chords
            }), [ "realTime", "track", "sortKey" ]));
            this.hub.bassTracksCh = _.sortedUniq(_.sortBy(_.filter(programChanges, {
                programType: ProgramType.bass
            }), [ "realTime", "track", "sortKey" ]));
            this.hub.drumTracksCh = _.sortedUniq(_.sortBy(_.filter(programChanges, {
                programType: ProgramType.drums
            }), [ "realTime", "track", "sortKey" ]));
        };
        Analyzer.prototype.learnOverlaps = function(data) {
            var vectors = [];
            var headEvent = data[0];
            var e = 0;
            while (e < data.length - 1) {
                var t = e + 1;
                while (headEvent.realTime + headEvent.duration - data[t].realTime > 0) {
                    var lowerBoundary = data[t].realTime;
                    var upperBoundaryE = headEvent.realTime + headEvent.duration;
                    var upperBoundaryT = data[t].realTime + data[t].duration;
                    var overlap = upperBoundaryE > upperBoundaryT ? upperBoundaryT - lowerBoundary : upperBoundaryE - lowerBoundary;
                    if (overlap > 0) {
                        vectors.push(overlap);
                    }
                    t += 1;
                }
                e += 1;
            }
            var overlapArr = _.sortedUniq(_.sortBy(vectors));
            CxSheet.writeJsonArr(overlapArr, "C:\\work\\CxSheet\\resource\\overlaps.json");
        };
        Analyzer.prototype.groupChordNotes = function(includeBass) {
            if (includeBass === void 0) {
                includeBass = false;
            }
            var trackList = this.hub.getChordTracks(includeBass);
            var data = this.hub.getTrackEvents(trackList);
            this.learnOverlaps(data);
        };
        return Analyzer;
    }();
    CxSheet.Analyzer = Analyzer;
})(CxSheet || (CxSheet = {}));

var CxSheet;

(function(CxSheet) {
    var Normalizer = function() {
        function Normalizer(hub) {
            this.hub = hub;
            this.subDiv = [];
            this.subDivCount = [];
        }
        Normalizer.prototype.getDataHub = function() {
            return this.hub;
        };
        Normalizer.prototype.getClosestIdx = function(ticks, _len) {
            if (_len === void 0) {
                _len = -1;
            }
            var len = _len == -1 || _len > this.subDiv.length ? this.subDiv.length : _len;
            var closest = -1;
            for (var e = 1; e < this.subDiv.length; e++) {
                var dist = Math.abs(ticks - this.subDiv[e]);
                if (dist < closest || closest < 0) {
                    closest = e;
                }
            }
            return closest;
        };
        Normalizer.prototype.getNormalizedVal = function(event) {
            var subDiv;
            try {
                subDiv = this.subDivCount[event.sigIdx].length;
            } catch (err) {
                console.log("subDivCount.length:" + this.subDivCount.length + ", idx:" + event.sigIdx);
            }
            var normIdx = this.getClosestIdx(CxSheet.Beats.getTicks(event.signature), subDiv);
            return this.subDiv[normIdx];
        };
        Normalizer.prototype.learnSubDivisions = function(divisionOfBeat, pIdx) {
            if (divisionOfBeat === void 0) {
                divisionOfBeat = 6;
            }
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var data = this.hub.getTrackEvents(this.hub.getDrumTracks());
            var ticksPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat;
            for (var i = 0; i <= divisionOfBeat; i++) {
                this.subDiv.push(i == 0 ? 0 : Math.floor(ticksPerBeat / i));
            }
            var timeSignatures = this.hub.timeSignatures;
            for (var t = 0; t < timeSignatures.length; t++) {
                var nextSortKey = t < timeSignatures.length - 1 ? timeSignatures[t + 1].sortKey : 1e6;
                var subDivCount = [];
                for (var i = 0; i <= divisionOfBeat; i++) {
                    subDivCount.push(0);
                }
                for (var e = 0; e < data.length; e++) {
                    if (data[e].sortKey > nextSortKey) {
                        t++;
                    }
                    var ticks = Number(data[e].signature.split(".")[2]);
                    var closest = this.getClosestIdx(ticks);
                    subDivCount[closest] += 1;
                }
                this.subDivCount[t] = subDivCount;
            }
            for (t = 0; t < timeSignatures.length; t++) {
                var total = _.sum(this.subDivCount[t]);
                for (i = this.subDivCount[t].length - 1; i > 0; i--) {
                    var sum = this.subDivCount[t][i];
                    if (sum == 0 || sum < total / 10) {
                        this.subDivCount[t].pop();
                    } else {
                        break;
                    }
                }
            }
        };
        Normalizer.prototype.normalizeAllTracks = function(_song, _seed) {
            if (_seed === void 0) {
                _seed = null;
            }
            var song = _.cloneDeep(_song);
            for (var t = 0; t < song.tracks.length; t++) {
                this.normalizeTrack(song.tracks[t]);
            }
        };
        Normalizer.prototype.normalizeTrack = function(track) {
            if (this.subDiv.length == 0) {
                this.learnSubDivisions();
            }
            var prevDelta = 0;
            for (var e = 0; e < track.length; e++) {
                var ticksN = this.getNormalizedVal(track[e]);
                var delta = ticksN - CxSheet.Beats.getTicks(track[e].signature);
                track[e].deltaTime += prevDelta + delta;
                track[e].realTime += prevDelta + delta;
                prevDelta = delta;
                track[e].signature = CxSheet.Beats.setTicks(track[e].signature, ticksN);
            }
        };
        Normalizer.prototype.learnFirstActualBar = function(pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var grid = this.hub.grids[pIdx];
            var tickPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat;
            var sixBars = [];
            var noteCount = [];
            for (var e = 0; e < grid.length; e++) {
                if (grid[e].signature.match(/^0007\..*/)) {
                    break;
                }
                if (grid[e].type == "noteOn") {
                    var event = grid[e];
                    var barBeats = (CxSheet.Beats.getBar(event.signature) - 1) * this.hub.timeSignatures[event.sigIdx].numerator;
                    var beat = CxSheet.Beats.getBeat(event.signature);
                    var ticks = CxSheet.Beats.getTicks(event.signature);
                    var idx = this.getClosestIdx(ticks);
                    noteCount[idx] += 1;
                    var nTicks = this.subDiv[idx];
                    if (nTicks == tickPerBeat) {}
                    event.signature = CxSheet.Beats.setTicks(event.signature, nTicks);
                    sixBars.push(event);
                }
            }
            CxSheet.writeJsonArr(sixBars, "C:\\work\\CxSheet\\resource\\sixBars.json");
        };
        return Normalizer;
    }();
    CxSheet.Normalizer = Normalizer;
})(CxSheet || (CxSheet = {}));

describe("Testing CxSheet", function() {
    it("CxSheet.MidiReader can read a midi file", function() {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        expect(readerInst.ping()).toEqual("MidiReader is alive");
        expect(readerInst.hub.midiInPath).toBeDefined();
        expect(readerInst.hub.parsed[0]).toBeDefined();
        readerInst.writeJsonFile("C:/work/CxSheet/resource/sultans-of-test.json");
        readerInst.writeFile("C:/work/CxSheet/resource/sultans-of-midi_write.mid");
    });
    it("CxSheet.BarGrid can produce a barGrid", function() {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var dataHub = readerInst.getDataHub();
        var barGrid = new CxSheet.BarGrid(dataHub);
        for (var e = 1; e < barGrid.hub.grids[0].length; e++) {
            expect(barGrid.hub.grids[0][e].realTime >= barGrid.hub.grids[0][e - 1].realTime).toBeTruthy();
            if (barGrid.hub.grids[0][e].type == "noteOn") {
                expect(barGrid.hub.grids[0][e].duration).toBeDefined();
                if (barGrid.hub.grids[0][e].velocity > 0) {
                    expect(barGrid.hub.grids[0][e].duration >= 0).toBeTruthy();
                }
            }
        }
    });
    it("CxSheet.Analyzer can build ChordTracks", function() {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var dataHub = readerInst.getDataHub();
        var barGrid = new CxSheet.BarGrid(dataHub);
        var analyzer = new CxSheet.Analyzer(dataHub);
        expect(analyzer.hub.chordTracksCh.length).toBeGreaterThan(0);
        expect(analyzer.hub.bassTracksCh.length).toBeGreaterThan(0);
        expect(analyzer.hub.drumTracksCh.length).toBeGreaterThan(0);
        var trackList = dataHub.getChordTracks(false);
        expect(trackList.length).toBeGreaterThan(0);
        var trackList2 = dataHub.getChordTracks(true);
        expect(trackList2.length).toBeGreaterThan(trackList.length);
        var data = dataHub.getTrackEvents(trackList);
        expect(data.length).toBeGreaterThan(0);
        for (var e = 1; e < data.length; e++) {
            expect(data[e].type).toEqual("noteOn");
        }
        analyzer.groupChordNotes();
    });
    it("CxSheet.Normalizer can normalize midi tracks", function() {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var hub = readerInst.getDataHub();
        var barGrid = new CxSheet.BarGrid(hub);
        var analyzer = new CxSheet.Analyzer(hub);
        var normalizer = new CxSheet.Normalizer(hub);
        normalizer.learnSubDivisions();
        expect(normalizer.subDiv.length).toBeGreaterThan(0);
        expect(normalizer.subDivCount.length).toBeGreaterThan(0);
        normalizer.normalizeAllTracks(hub.parsed[0]);
        expect(normalizer.subDivCount.length).toBeGreaterThan(0);
        for (var t = 0; t < hub.parsed[0].tracks.length; t++) {
            var track = hub.parsed[0].tracks[t];
            var prevEvent = track[0];
            for (var e = 1; e < track.length; e++) {
                var event = track[e];
                expect(event.realTime >= prevEvent.realTime).toBeTruthy();
                expect(event.sortKey).toBeGreaterThan(prevEvent.sortKey);
                expect(event.deltaTime).toEqual(event.realTime - prevEvent.realTime);
                prevEvent = event;
            }
        }
    });
});