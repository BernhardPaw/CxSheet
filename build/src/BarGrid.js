/// <reference path="../src/references.ts" />
var _ = require('lodash');
var CxSheet;
(function (CxSheet) {
    var Beats = (function () {
        // firstBeat:       boolean = true
        function Beats(barGrid, barCounter, beatCounter) {
            if (barCounter === void 0) { barCounter = 0; }
            if (beatCounter === void 0) { beatCounter = 0; }
            this.barGrid = barGrid;
            this.barCounter = barCounter;
            this.beatCounter = beatCounter;
            // beatsTrack:      (MetaEntry| MetaText)[] = []
            this.beatsSortKey = 0;
            this.prevBeatRealTime = 0;
            this.timeIdx = 0;
            // TODO: ticksPerBeat - Check this for e.g. 1/8 and 12/8 
            // Check for and go past more timeSignatures with realTime == 0 entries
            while ((this.timeIdx + 1) < barGrid.timeSignatures.length && barGrid.timeSignatures[this.timeIdx + 1].realTime == 0) {
                this.timeIdx++;
            }
            this.ticksPerBeat = barGrid.midi.parsed.header.ticksPerBeat;
            this.beatsPerBar = barGrid.timeSignatures[this.timeIdx].numerator;
            this.ticksPerBar = this.beatsPerBar * this.ticksPerBeat;
            this.prevTimeSigRealTime = barGrid.timeSignatures[this.timeIdx].realTime;
        }
        Beats.prototype.getSignature = function (realTime) {
            if (realTime === void 0) { realTime = -1; }
            var barCount = Math.floor(this.beatCounter / this.beatsPerBar) + 1;
            var beatCount = this.beatCounter % this.beatsPerBar + 1;
            var _ticks = realTime == -1 ? 0 : realTime - this.prevBeatRealTime;
            var bar = ("0000" + barCount).slice(-4);
            var beat = ("00" + beatCount).slice(-2);
            var ticks = ("00" + _ticks).slice(-3);
            return bar + "." + beat + "." + ticks;
        };
        Beats.prototype.getBeatSignature = function () {
            return this.getSignature();
        };
        Beats.prototype.addSignature = function (event) {
            // Check for new beat
            while (event.realTime >= (this.prevBeatRealTime + this.ticksPerBeat)) {
                this.addBeatMarker();
            }
            event.sortKey = this.beatsSortKey++;
            event.signature = this.getSignature(event.realTime);
            this.barGrid.grid.push(event);
        };
        Beats.prototype.addBeatMarker = function () {
            var nextBeat = this.prevBeatRealTime + this.ticksPerBeat;
            var event = {
                deltaTime: this.ticksPerBeat,
                type: 'beat',
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
    }());
    CxSheet.Beats = Beats;
    var BarGrid = (function () {
        function BarGrid(midi) {
            this.midi = midi;
            this.grid = [];
            this.bars = [];
            // grid:            BaseEntry[] = []
            this.maxRealtime = 0;
            this.timeSignatures = [];
            this.realTimePointer = 0;
            this.self = this;
            this.buildGrid();
        }
        BarGrid.prototype.extendedParsing = function () {
            var song = this.midi.parsed;
            for (var t = 0; t < song.tracks.length; t++) {
                if (song.tracks[t].length > 0) {
                    // Loop through track
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
            // Build the Time Signature map and iterate
            this.timeSignatures = _.sortBy(this.timeSignatures, 'realtime');
        };
        BarGrid.prototype.buildGrid = function () {
            var song = this.midi.parsed;
            if (_.isEmpty(this.timeSignatures)) {
                this.extendedParsing();
            }
            var beats = new Beats(this.self);
            var trackEvents = _.orderBy(_.flatten(song.tracks), ['realTime', 'track', 'sortKey'], ['asc', 'asc', 'asc']);
            this.writeJsonFile(trackEvents, "C:\\work\\CxSheet\\resource\\trackEvents.json");
            for (var e = 0; e < trackEvents.length; e++) {
                beats.addSignature(trackEvents[e]);
            }
            var lastEntry = this.grid.length - 1;
            if (lastEntry >= 0 && this.grid[this.grid.length - 1].type != 'beat') {
                beats.addBeatMarker();
            }
        };
        BarGrid.prototype.writeJsonFile = function (arr, _jsonOutPath) {
            if (_jsonOutPath === void 0) { _jsonOutPath = ""; }
            var jsonOutPath = _jsonOutPath.match(/^$/) ? this.midi.getOutFilePath(_jsonOutPath) : this.midi.normalizePath(_jsonOutPath);
            // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
            // Using native Javascript arrays makes the code portable to the browser or non-node environments
            var outputBuffer = new Buffer(JSON.stringify(arr, null, '  '));
            // Write to a new MIDI file.  it should match the original
            nodeFs.writeFileSync(jsonOutPath, outputBuffer);
        };
        return BarGrid;
    }());
    CxSheet.BarGrid = BarGrid;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=BarGrid.js.map