/// <reference path="../src/references.ts" />
var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
var _ = require('lodash');
var stringify = require('json-stable-stringify');
var CxSheet;
(function (CxSheet) {
    var Beats = (function () {
        // firstBeat:       boolean = true
        function Beats(hub, beatCounter) {
            if (beatCounter === void 0) { beatCounter = 0; }
            this.hub = hub;
            this.beatCounter = beatCounter;
            this.beatsSortKey = 0;
            this.prevBeatRealTime = 0;
            this.timeIdx = 0;
            // TODO: ticksPerBeat - Check this for e.g. 1/8 and 12/8 
            // Check for and go past more timeSignatures with realTime == 0 entries
            while ((this.timeIdx + 1) < hub.timeSignatures.length && hub.timeSignatures[this.timeIdx + 1].realTime == 0) {
                this.timeIdx++;
            }
        }
        Beats.getTicks = function (signature) {
            return Number(signature.split('.')[2]);
        };
        Beats.getBeat = function (signature) {
            return Number(signature.split('.')[1]);
        };
        Beats.getBar = function (signature) {
            return Number(signature.split('.')[0]);
        };
        Beats.setTicks = function (signature, ticks) {
            return signature.substr(0, 8) + ("00" + ticks).slice(-3);
        };
        Beats.setSignature = function (barCount, beatCount, _ticks) {
            var bar = ("0000" + barCount).slice(-4);
            var beat = ("00" + beatCount).slice(-2);
            var ticks = ("00" + _ticks).slice(-3);
            return bar + "." + beat + "." + ticks;
        };
        Beats.prototype.checkResolution = function (realTime) {
            var timeSignatures = this.hub.timeSignatures;
            if ((this.timeIdx + 1) < timeSignatures.length && timeSignatures[this.timeIdx + 1].realTime <= realTime) {
                this.timeIdx++;
                this.setResolution();
            }
        };
        Beats.prototype.setResolution = function (pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            // var timeSignatures = this.hub.timeSignatures
            this.ticksPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat;
            this.beatsPerBar = this.hub.timeSignatures.length > this.timeIdx ? this.hub.timeSignatures[this.timeIdx].numerator : 0;
            this.ticksPerBar = this.beatsPerBar * this.ticksPerBeat;
            // this.prevTimeSigRealTime  = barGrid.timeSignatures[this.timeIdx].realTime
        };
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
                var beatIsABar = (Math.floor((this.beatCounter + 1) / this.beatsPerBar) == 0);
                if (beatIsABar) {
                    this.checkResolution(event.realTime);
                }
                this.addBeatMarker();
            }
            event.sortKey = this.beatsSortKey++;
            event.signature = this.getSignature(event.realTime);
        };
        Beats.prototype.addBeatMarker = function (pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var nextBeat = this.prevBeatRealTime + this.ticksPerBeat;
            var event = {
                deltaTime: this.ticksPerBeat,
                type: 'beat',
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
    }());
    CxSheet.Beats = Beats;
    var BarGrid = (function (_super) {
        __extends(BarGrid, _super);
        function BarGrid(hub) {
            var _this = _super.call(this, hub) || this;
            _this.hub = hub;
            _this.maxRealtime = 0;
            _this.minDuration = 100000;
            _this.realTimePointer = 0;
            _this.extendedParsing();
            _this.buildGrid();
            _this.groupPrograms();
            return _this;
        }
        BarGrid.prototype.setDuration = function (t, e, pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var track = this.hub.parsed[pIdx].tracks[t];
            var p = e - 1;
            for (; p >= 0; p--) {
                if (track[p] && track[p].type == "noteOn" &&
                    track[p].velocity > 0 &&
                    track[p].noteNumber == track[e].noteNumber) {
                    var currDuration = track[p].duration;
                    var newDuration = track[e].realTime - track[p].realTime;
                    if (currDuration == 0 || currDuration > newDuration) {
                        track[p].duration = newDuration;
                        this.minDuration = newDuration < this.minDuration ? newDuration : this.minDuration;
                    }
                    else {
                        this.minDuration = currDuration < this.minDuration ? currDuration : this.minDuration;
                    }
                    break;
                }
            }
        };
        BarGrid.prototype.extendedParsing = function (pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var song = this.hub.parsed[pIdx];
            for (var t = 0; t < song.tracks.length; t++) {
                if (song.tracks[t].length > 0) {
                    // Loop through track
                    var prevRealTimeEnd = 0;
                    for (var e = 0; e < song.tracks[t].length; e++) {
                        song.tracks[t][e].track = t;
                        // song.tracks[t][e].realTime = e == 0 ? song.tracks[t][e].deltaTime : song.tracks[t][e].deltaTime + song.tracks[t][e - 1].realTime
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
                            }
                            else if (song.tracks[t][e].type == "noteOn" && song.tracks[t][e].velocity == 0) {
                                this.setDuration(t, e);
                            }
                        }
                        this.maxRealtime = song.tracks[t][e].realTime > this.maxRealtime ? song.tracks[t][e].realTime : this.maxRealtime;
                    }
                }
            }
            // Build the Time Signature map and iterate
            this.hub.timeSignatures = _.sortBy(this.hub.timeSignatures, 'realtime');
        };
        BarGrid.prototype.groupPrograms = function (pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            // var programChanges = _.sortBy( _.filter(this.hub.grids[0], { "type": "programChange" } ), ['realTime', 'track', 'sortKey'] )
            var programChanges = this.hub.getEventsByType("programChange");
            for (var e = 0; e < programChanges.length; e++) {
                var p = programChanges[e].programNumber;
                if ((p > 0 && p < 33) || (p > 40 && p < 113)) {
                    programChanges[e].programType = ProgramType.chords;
                }
                else if ((p > 32 && p < 41)) {
                    programChanges[e].programType = ProgramType.bass;
                }
                else {
                    programChanges[e].programType = ProgramType.drums;
                }
            }
            this.hub.programChanges = programChanges;
            this.hub.chordTracksCh = _.sortedUniq(_.sortBy(_.filter(programChanges, { "programType": ProgramType.chords }), ['realTime', 'track', 'sortKey']));
            this.hub.bassTracksCh = _.sortedUniq(_.sortBy(_.filter(programChanges, { "programType": ProgramType.bass }), ['realTime', 'track', 'sortKey']));
            this.hub.drumTracksCh = _.sortedUniq(_.sortBy(_.filter(programChanges, { "programType": ProgramType.drums }), ['realTime', 'track', 'sortKey']));
        };
        BarGrid.prototype.buildGrid = function (pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var song = this.hub.parsed[pIdx];
            if (_.isEmpty(this.hub.timeSignatures)) {
                this.extendedParsing();
            }
            // Get all track events        
            var trackEvents = _.sortBy(_.flatten(song.tracks), ['realTime', 'track', 'sortKey']);
            for (var e = 0; e < trackEvents.length; e++) {
                this.addSignature(trackEvents[e]);
            }
            // Handle the last beat
            var lastEntry = trackEvents.length - 1;
            if (lastEntry >= 0 && trackEvents[trackEvents.length - 1].type != 'beat') {
                this.addBeatMarker();
            }
            this.hub.grids[pIdx] = trackEvents;
            // writeJsonArr(this.hub.grids[pIdx], "C:\\work\\CxSheet\\resource\\trackEvents.json")
        };
        return BarGrid;
    }(Beats));
    CxSheet.BarGrid = BarGrid;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=BarGrid.js.map