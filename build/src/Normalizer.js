var __extends = (this && this.__extends) || function (d, b) {
    for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p];
    function __() { this.constructor = d; }
    d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
};
/// <reference path="../src/references.ts" />
// const kmeans = require('node-kmeans');
var CxSheet;
(function (CxSheet) {
    /*
    export class Zone {
        constructor( public spread ) { }
    }
    */
    var Normalizer = (function (_super) {
        __extends(Normalizer, _super);
        function Normalizer(hub) {
            var _this = _super.call(this, hub) || this;
            _this.subDiv = [];
            _this.subDivCount = [];
            return _this;
        }
        Normalizer.prototype.getClosestIdx = function (ticks, _len) {
            if (_len === void 0) { _len = -1; }
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
        Normalizer.prototype.getNormalizedVal = function (event) {
            var subDiv;
            try {
                subDiv = this.subDivCount[event.sigIdx].length;
            }
            catch (err) {
                console.log("subDivCount.length:" + this.subDivCount.length + ", idx:" + event.sigIdx);
            }
            var normIdx = this.getClosestIdx(CxSheet.Beats.getTicks(event.signature), subDiv);
            return this.subDiv[normIdx];
        };
        //
        // Read the drum track and figure out the learnSubDivisions
        //
        Normalizer.prototype.learnSubDivisions = function (divisionOfBeat, pIdx) {
            if (divisionOfBeat === void 0) { divisionOfBeat = 6; }
            if (pIdx === void 0) { pIdx = 0; }
            var data = this.hub.getTrackEvents(this.hub.getDrumTracks());
            var ticksPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat;
            for (var i = 0; i <= divisionOfBeat; i++) {
                this.subDiv.push(i == 0 ? 0 : Math.floor(ticksPerBeat / i));
            }
            //
            var timeSignatures = this.hub.timeSignatures;
            for (var t = 0; t < timeSignatures.length; t++) {
                var nextSortKey = t < timeSignatures.length - 1 ? timeSignatures[t + 1].sortKey : 1000000;
                var subDivCount = [];
                for (var i = 0; i <= divisionOfBeat; i++) {
                    subDivCount.push(0);
                }
                for (var e = 0; e < data.length; e++) {
                    if (data[e].sortKey > nextSortKey) {
                        t++;
                    }
                    var ticks = Number(data[e].signature.split('.')[2]);
                    var closest = this.getClosestIdx(ticks);
                    subDivCount[closest] += 1;
                }
                this.subDivCount[t] = subDivCount;
            }
            for (t = 0; t < timeSignatures.length; t++) {
                var total = _.sum(this.subDivCount[t]);
                for (i = this.subDivCount[t].length - 1; i > 0; i--) {
                    var sum = this.subDivCount[t][i];
                    if (sum == 0 || sum < (total / 10)) {
                        this.subDivCount[t].pop();
                    }
                    else {
                        break;
                    }
                }
            }
        };
        Normalizer.prototype.normalizeAllTracks = function (_song, _seed) {
            if (_seed === void 0) { _seed = null; }
            var song = _.cloneDeep(_song);
            for (var t = 0; t < song.tracks.length; t++) {
                this.normalizeTrack(song.tracks[t]);
            }
        };
        Normalizer.prototype.normalizeTrack = function (track) {
            if (this.subDiv.length == 0) {
                this.learnSubDivisions();
            }
            var prevDelta = 0;
            for (var e = 0; e < track.length; e++) {
                var ticksN = this.getNormalizedVal(track[e]);
                var delta = ticksN - CxSheet.Beats.getTicks(track[e].signature);
                // Adjust deltaTime and realTime
                track[e].deltaTime += (prevDelta + delta);
                track[e].realTime += (prevDelta + delta);
                prevDelta = delta;
                track[e].signature = CxSheet.Beats.setTicks(track[e].signature, ticksN);
            }
        };
        /*
        normalizeChordTrack( track: Track ) {
            var prevDelta = 0
            for ( var e = 0 ; e < track.length; e++ ) {
                var ticksN = this.getNormalizedVal(track[e])
                var delta  = ticksN - Beats.getTicks(track[e].signature)
                // Adjust deltaTime and realTime
                track[e].deltaTime +=  ( prevDelta + delta )
                track[e].realTime  +=  ( prevDelta + delta )
                prevDelta  = delta
                track[e].signature = Beats.setTicks(track[e].signature, ticksN)
            }
        }
        */
        // Count active noter at the start of the first six bars
        // For now  assume first bar base on a major change in the number of active notes 
        // 
        // TODO:
        // look for drum pre-count, some cymbol or similar and probably no bass drum
        // look for first beat with an active melody/chord note
        Normalizer.prototype.learnFirstActualBar = function (pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var grid = this.hub.grids[pIdx];
            var tickPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat;
            var sixBars = [];
            var noteCount = []; // _.fill( Array( this.subDiv.length * 6 ), 0)
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
                    if (nTicks == tickPerBeat) {
                    }
                    event.signature = CxSheet.Beats.setTicks(event.signature, nTicks);
                    sixBars.push(event);
                }
            }
            CxSheet.writeJsonArr(sixBars, "C:\\work\\CxSheet\\resource\\sixBars.json");
        };
        return Normalizer;
    }(CxSheet.Analyzer));
    CxSheet.Normalizer = Normalizer;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=Normalizer.js.map