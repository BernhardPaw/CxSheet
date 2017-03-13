var ProgramType;

(function(ProgramType) {
    ProgramType[ProgramType["chords"] = 0] = "chords";
    ProgramType[ProgramType["bass"] = 1] = "bass";
    ProgramType[ProgramType["drums"] = 2] = "drums";
})(ProgramType || (ProgramType = {}));

var CxSheet;

(function(CxSheet) {
    var Config = function() {
        function Config() {
            if (Config._instance) {
                throw new Error("Error: Instantiation failed: Use Config.getInstance() instead of new.");
            }
            Config._instance = this;
        }
        Config.getInstance = function() {
            return Config._instance;
        };
        return Config;
    }();
    Config.sampleBeatDivision = 2;
    Config.overlapLookBack = 10;
    Config._instance = new Config();
    CxSheet.Config = Config;
    var DataHub = function() {
        function DataHub() {
            this.parsed = [];
            this.grids = [];
            this.timeSignatures = [];
            this.bars = [];
            this.subDivCount = [];
            this.matrix = {};
        }
        DataHub.prototype.getSampleRate = function(idx) {
            var sampleRate = _.inRange(idx, 0, this.subDivCount.length) ? this.subDivCount[idx].length : this.subDivCount[0].length;
            return sampleRate;
        };
        DataHub.prototype.getChordTracks = function(includeBass) {
            if (includeBass === void 0) {
                includeBass = true;
            }
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
        DataHub.prototype.getTrackNotes = function(trackList, pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var trackEvents = [];
            for (var t = 0; t < trackList.length; t++) {
                trackEvents = _.concat(trackEvents, this.parsed[pIdx].tracks[trackList[t]]);
            }
            var events = _.sortBy(_.filter(trackEvents, function(e) {
                return e.type == "noteOn" && e.velocity > 0;
            }), [ "sortKey", "realTime", "track" ]);
            return events;
        };
        DataHub.prototype.getEventsByType = function(_type, pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var events = _.sortBy(_.filter(_.flatten(this.parsed[pIdx].tracks), function(e) {
                return e.type == _type;
            }), [ "sortKey", "realTime", "track" ]);
            return events;
        };
        DataHub.prototype.getAllEvents = function(pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var events = _.sortBy(_.flatten(this.parsed[pIdx].tracks), [ "sortKey", "realTime", "track" ]);
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
    function writeJson(map, _jsonOutPath) {
        if (_jsonOutPath === void 0) {
            _jsonOutPath = "";
        }
        var jsonOutPath = _jsonOutPath.match(/^$/) ? getOutFilePath(_jsonOutPath) : normalizePath(_jsonOutPath);
        var outputBuffer = new Buffer(stringify(map, {
            space: "  "
        }));
        nodeFs.writeFileSync(jsonOutPath, outputBuffer);
    }
    CxSheet.writeJson = writeJson;
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
        Beats.setSignature = function(barCount, beatCount, _ticks) {
            var bar = ("0000" + barCount).slice(-4);
            var beat = ("00" + beatCount).slice(-2);
            var ticks = ("00" + _ticks).slice(-3);
            return bar + "." + beat + "." + ticks;
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
            _this.extendedParsing();
            _this.buildGrid();
            _this.groupPrograms();
            return _this;
        }
        BarGrid.prototype.setDuration = function(t, e, pIdx) {
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
                    var prevRealTimeEnd = 0;
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
                                this.setDuration(t, e);
                            } else if (song.tracks[t][e].type == "noteOn" && song.tracks[t][e].velocity == 0) {
                                this.setDuration(t, e);
                            }
                        }
                        this.maxRealtime = song.tracks[t][e].realTime > this.maxRealtime ? song.tracks[t][e].realTime : this.maxRealtime;
                    }
                }
            }
            this.hub.timeSignatures = _.sortBy(this.hub.timeSignatures, "realtime");
        };
        BarGrid.prototype.groupPrograms = function(pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var programChanges = this.hub.getEventsByType("programChange");
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
        };
        return BarGrid;
    }(Beats);
    CxSheet.BarGrid = BarGrid;
})(CxSheet || (CxSheet = {}));

var CxSheet;

(function(CxSheet) {
    var Analyzer = function() {
        function Analyzer(hub) {
            this.hub = hub;
            this.matrixIndex = [];
            this.matrix = this.hub.matrix;
        }
        Analyzer.prototype.getDataHub = function() {
            return this.hub;
        };
        Analyzer.prototype.getTempo = function(pIdx, realTime) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            if (realTime === void 0) {
                realTime = 0;
            }
            if (this.tempo == null) {
                this.tempo = _.sortedUniq(_.sortBy(_.filter(_.flatten(this.hub.parsed[pIdx].tracks), {
                    programType: ProgramType.chords
                }), [ "sortKey" ]));
            }
            var event = null;
            if (realTime == 0) {
                event = this.tempo[0];
            } else {
                var prevEvent;
                for (var t = 0; t < this.tempo.length; t++) {
                    if (realTime < this.tempo[t].realTime) {
                        prevEvent = this.tempo[t];
                    } else {
                        event = prevEvent;
                    }
                }
            }
            if (event == null) {
                event = prevEvent;
            }
            return event.microsecondsPerBeat;
        };
        Analyzer.prototype.cleanUpArr = function(_tones) {
            var tones = [];
            for (var i = 0; i < _tones.length; i++) {
                var tone = _tones[i] % 12;
                if (i == 0) {
                    tones.push(tone);
                } else while (tone < tones[tones.length - 1] && _.indexOf(tones, tone) < 0) {
                    tone += 12;
                }
                if (_.indexOf(tones, tone) < 0) {
                    tones.push(tone);
                }
            }
            return tones;
        };
        Analyzer.prototype.mergeSamples = function() {
            var prevTones = [];
            for (var key in this.matrix) {
                var notes = this.cleanUpArr(_.sortBy(_.uniq(this.matrix[key].notes)));
                if (_.isEqual(notes, prevTones)) {
                    this.matrix[key].repeat = true;
                } else if (notes.length > 0) {
                    this.matrix[key].repeat = false;
                }
                prevTones = _.clone(notes);
                this.matrix[key].notes = _.clone(notes);
            }
        };
        Analyzer.prototype.getTicksPerSample = function(sigIdx) {
            var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat;
            var sampleTicks = this.hub.subDivCount[sigIdx].length;
            var samplePerBeat = Math.round(ticksPerBeat / sampleTicks);
            return samplePerBeat;
        };
        Analyzer.prototype.sampleChords = function(pIdx, includeBass) {
            if (pIdx === void 0) {
                pIdx = 1;
            }
            if (includeBass === void 0) {
                includeBass = true;
            }
            var trackList = this.hub.getChordTracks(includeBass);
            var data = this.hub.getTrackNotes(trackList, pIdx);
            var idx = 0;
            for (var e = 0; e < data.length; e++) {
                if (data[e].type == "noteOn" && data[e].velocity > 0) {
                    if (_.isUndefined(this.matrix[data[e].signaNorm])) {
                        this.matrix[data[e].signaNorm] = {
                            realTime: data[e].realNorm,
                            index: idx,
                            duration: 0,
                            notes: []
                        };
                        if (e > 0) {
                            var duration = this.matrix[data[e].signaNorm].realTime - this.matrix[data[e - 1].signaNorm].realTime;
                            this.matrix[data[e - 1].signaNorm].duration = duration;
                        }
                        if (e == data.length - 1) {
                            this.matrix[data[e].signaNorm].duration = data[e].duration;
                        }
                        this.matrixIndex.push(data[e].signaNorm);
                        idx += 1;
                    }
                }
            }
            var noteEnd;
            var overlap;
            for (e = 0; e < data.length; e++) {
                if (data[e].type == "noteOn" && data[e].velocity > 0) {
                    idx = this.matrix[data[e].signaNorm].index;
                    noteEnd = data[e].realNorm + data[e].duration;
                    while (idx < this.matrixIndex.length && noteEnd > this.matrix[this.matrixIndex[idx]].realTime) {
                        this.matrix[this.matrixIndex[idx]].notes.push(data[e].noteNumber);
                        idx += 1;
                    }
                }
            }
            this.mergeSamples();
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
            this.maxTicks = this.hub.parsed[0].header.ticksPerBeat;
            this.learnSubDivisions();
        }
        Normalizer.prototype.getTicksDiff = function(event) {
            var numerator = this.hub.timeSignatures[event.sigIdx].numerator;
            var denominator = this.hub.timeSignatures[event.sigIdx].denominator;
            var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat;
            var bar = CxSheet.Beats.getBar(event.signature);
            var barN = CxSheet.Beats.getBar(event.signaNorm);
            var beat = CxSheet.Beats.getBeat(event.signature);
            var beatN = CxSheet.Beats.getBeat(event.signaNorm);
            var ticks = CxSheet.Beats.getTicks(event.signature);
            var ticksN = CxSheet.Beats.getTicks(event.signaNorm);
            var diff = 0;
            var barDiff = 0;
            var beatDiff = 0;
            var ticksDiff = 0;
            barDiff = (barN - bar) * ticksPerBeat * numerator;
            beatDiff = (beatN - beat) * ticksPerBeat;
            ticksDiff = ticksN - ticks;
            diff = barDiff + beatDiff + ticksDiff;
            return diff;
        };
        Normalizer.prototype.getClosestIdx = function(ticks, _len) {
            if (_len === void 0) {
                _len = -1;
            }
            var len = _len == -1 || _len >= this.subDiv.length ? this.subDiv.length - 1 : _len;
            var closest = 1e7;
            var closestIdx = -1;
            for (var e = 0; e <= len; e++) {
                var dist = Math.abs(ticks - this.subDiv[e]);
                if (dist < closest) {
                    closest = dist;
                    closestIdx = e;
                }
            }
            return closestIdx;
        };
        Normalizer.prototype.setNormalizedVal = function(event, _len) {
            if (_len === void 0) {
                _len = -1;
            }
            var len = _len == -1 || _len >= this.subDiv.length ? this.subDiv.length - 1 : _len;
            var closest = 1e7;
            var closestIdx = this.getClosestIdx(CxSheet.Beats.getTicks(event.signature), len);
            var ticks = this.subDiv[closestIdx];
            var beat = CxSheet.Beats.getBeat(event.signature);
            var bar = CxSheet.Beats.getBar(event.signature);
            if (ticks == this.maxTicks) {
                var denominator = this.hub.timeSignatures[event.sigIdx].denominator;
                ticks = 0;
                beat += 1;
                if (beat > this.hub.timeSignatures[event.sigIdx].denominator) {
                    beat = 1;
                    bar += 1;
                }
                event.signaNorm = CxSheet.Beats.setSignature(bar, beat, ticks);
            } else {
                event.signaNorm = CxSheet.Beats.setSignature(bar, beat, ticks);
            }
            return this.getTicksDiff(event);
        };
        Normalizer.prototype.learnSubDivisions = function(divisionOfBeat, pIdx) {
            if (divisionOfBeat === void 0) {
                divisionOfBeat = 6;
            }
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var subDivCount = this.hub.subDivCount;
            var data = this.hub.getTrackNotes(this.hub.getDrumTracks());
            var ticksPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat;
            for (var i = 0; i <= divisionOfBeat; i++) {
                this.subDiv.push(i == 0 ? 0 : Math.round(ticksPerBeat / i));
            }
            var timeSignatures = this.hub.timeSignatures;
            for (var t = 0; t < timeSignatures.length; t++) {
                var nextSortKey = t < timeSignatures.length - 1 ? timeSignatures[t + 1].sortKey : 1e6;
                var subDiv = [];
                for (var i = 0; i <= divisionOfBeat; i++) {
                    subDiv.push(0);
                }
                for (var e = 0; e < data.length; e++) {
                    while (data[e].sortKey > nextSortKey) {
                        t++;
                        nextSortKey = t < timeSignatures.length - 1 ? timeSignatures[t + 1].sortKey : 1e6;
                    }
                    var ticks = Number(data[e].signature.split(".")[2]);
                    var closestIdx = this.getClosestIdx(ticks);
                    subDiv[closestIdx] += 1;
                }
                subDivCount[t] = _.clone(subDiv);
            }
            for (t = 0; t < timeSignatures.length; t++) {
                var total = _.sum(subDivCount[t]);
                for (i = subDivCount[t].length - 1; i > 0; i--) {
                    var sum = subDivCount[t][i];
                    if (sum == 0 || sum < total / 10) {
                        subDivCount[t].pop();
                    } else {
                        break;
                    }
                }
            }
        };
        Normalizer.prototype.normalizeAllTracks = function(_song) {
            if (_song === void 0) {
                _song = this.hub.parsed[0];
            }
            var song = _.cloneDeep(_song);
            if (this.subDiv.length == 0) {
                this.learnSubDivisions();
            }
            for (var t = 0; t < song.tracks.length; t++) {
                song.tracks[t] = this.normalizeTrack(song.tracks[t]);
            }
            this.hub.parsed.push(song);
        };
        Normalizer.prototype.normalizeTrack = function(_track) {
            var track = _.sortBy(_track, [ "sortKey" ]);
            for (var e = 0; e < track.length; e++) {
                var change = this.setNormalizedVal(track[e]);
                track[e].realNorm = track[e].realTime + change;
                track[e].deltaNorm = e == 0 ? track[e].deltaTime + change : track[e].realNorm - track[e - 1].realNorm;
            }
            return track;
        };
        Normalizer.prototype.learnFirstActualBar = function(pIdx) {
            if (pIdx === void 0) {
                pIdx = 0;
            }
            var grid = this.hub.getAllEvents(pIdx);
            var tickPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat;
            var sixBars = [];
            var noteCount = [];
            for (var e = 0; e < grid.length; e++) {
                if (grid[e].signaNorm.match(/^0007\..*/)) {
                    break;
                }
                if (grid[e].type == "noteOn") {
                    var event = grid[e];
                    var barBeats = (CxSheet.Beats.getBar(event.signaNorm) - 1) * this.hub.timeSignatures[event.sigIdx].numerator;
                    var beat = CxSheet.Beats.getBeat(event.signaNorm);
                    var ticks = CxSheet.Beats.getTicks(event.signaNorm);
                    var idx = this.getClosestIdx(ticks);
                    noteCount[idx] += 1;
                    var nTicks = this.subDiv[idx];
                    if (nTicks == tickPerBeat) {}
                    event.signaNorm = CxSheet.Beats.setTicks(event.signaNorm, nTicks);
                    sixBars.push(event);
                }
            }
            CxSheet.writeJsonArr(sixBars, "C:\\work\\CxSheet\\resource\\sixBars.json");
        };
        return Normalizer;
    }();
    CxSheet.Normalizer = Normalizer;
})(CxSheet || (CxSheet = {}));

var CxChord = require("../../CxChord/index.js");

var CxSheet;

(function(CxSheet) {
    var Sheet = function() {
        function Sheet(hub) {
            this.hub = hub;
            this.chordList = [];
        }
        Sheet.prototype.getDataHub = function() {
            return this.hub;
        };
        Sheet.prototype.renderHtml = function(barsPerLine) {
            return "";
        };
        Sheet.prototype.getChords = function() {
            var prevBar = 0;
            var prevChord = "";
            for (var key in this.hub.matrix) {
                var chord = this.hub.matrix[key];
                var bar = CxSheet.Beats.getBar(key);
                if (!chord.repeat && !(bar == prevBar)) {
                    var cm = new CxChord.ChordMatcher();
                    cm.match(chord.notes);
                    var p0 = cm.bayes.getBestPosterior();
                    var chordName = CxChord.getExtName(p0.hypo.key);
                    console.log(key + ":" + chordName);
                }
            }
        };
        return Sheet;
    }();
    CxSheet.Sheet = Sheet;
})(CxSheet || (CxSheet = {}));

var _ = require("lodash");

var CxSheet;

(function(CxSheet) {
    var App = function() {
        function App(fileName) {
            if (!_.isEmpty(fileName)) {
                this.run(fileName);
            }
        }
        App.prototype.run = function(fileName) {
            var midiIO = new CxSheet.MidiIO(fileName);
            var hub = midiIO.getDataHub();
            var barGrid = new CxSheet.BarGrid(hub);
            var normalizer = new CxSheet.Normalizer(hub);
            normalizer.normalizeAllTracks(hub.parsed[0]);
            var analyzer = new CxSheet.Analyzer(hub);
            analyzer.sampleChords();
            var sheet = new CxSheet.Sheet(hub);
            sheet.getChords();
        };
        return App;
    }();
    CxSheet.App = App;
})(CxSheet || (CxSheet = {}));

var myApp = new CxSheet.App("C:/work/CxSheet/resource/sultans-of-swing.mid");