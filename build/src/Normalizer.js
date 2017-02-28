/// <reference path="../src/references.ts" />
// const kmeans = require('node-kmeans');
var CxSheet;
(function (CxSheet) {
    var Normalizer = (function () {
        function Normalizer(hub) {
            this.hub = hub;
            this.subDiv = [];
            this.maxTicks = this.hub.parsed[0].header.ticksPerBeat - 1;
            this.learnSubDivisions();
        }
        Normalizer.prototype.getTicksDiff = function (event) {
            var numerator = this.hub.timeSignatures[event.sigIdx].numerator;
            var denominator = this.hub.timeSignatures[event.sigIdx].denominator;
            var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat;
            var bar = CxSheet.Beats.getBar(event.signature);
            var barN = CxSheet.Beats.getBar(event.sigNorm);
            var beat = CxSheet.Beats.getBeat(event.signature);
            var beatN = CxSheet.Beats.getBeat(event.sigNorm);
            var ticks = CxSheet.Beats.getTicks(event.signature);
            var ticksN = CxSheet.Beats.getTicks(event.sigNorm);
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
        Normalizer.prototype.getClosestIdx = function (ticks, _len) {
            if (_len === void 0) { _len = -1; }
            var len = _len == -1 || _len >= this.subDiv.length ? this.subDiv.length - 1 : _len;
            var closest = 10000000;
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
        Normalizer.prototype.setNormalizedVal = function (event, _len) {
            if (_len === void 0) { _len = -1; }
            var len = _len == -1 || _len >= this.subDiv.length ? this.subDiv.length - 1 : _len;
            var closest = 10000000;
            var closestIdx = this.getClosestIdx(CxSheet.Beats.getTicks(event.signature), len);
            var ticks = this.subDiv[closestIdx];
            var beat = CxSheet.Beats.getBeat(event.signature);
            var bar = CxSheet.Beats.getBar(event.signature);
            // Check if we are in the next beat and next bar
            if (ticks == this.maxTicks) {
                var denominator = this.hub.timeSignatures[event.sigIdx].denominator;
                ticks = 0;
                beat += 1;
                if (beat > this.hub.timeSignatures[event.sigIdx].denominator) {
                    beat = 1;
                    bar += 1;
                }
                event.sigNorm = CxSheet.Beats.setSignature(bar, beat, ticks);
            }
            else {
                event.sigNorm = CxSheet.Beats.setSignature(bar, beat, ticks);
            }
            return this.getTicksDiff(event);
        };
        //
        // Read the drum track and figure out the Sub-Divisions
        //
        Normalizer.prototype.learnSubDivisions = function (divisionOfBeat, pIdx) {
            if (divisionOfBeat === void 0) { divisionOfBeat = 6; }
            if (pIdx === void 0) { pIdx = 0; }
            var subDivCount = this.hub.subDivCount;
            var data = this.hub.getTrackNotes(this.hub.getDrumTracks());
            var ticksPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat;
            for (var i = 0; i <= divisionOfBeat; i++) {
                this.subDiv.push(i == 0 ? 0 : Math.floor(ticksPerBeat / i) - 1);
            }
            //
            // Count the number of subdivisions for each time signature
            //
            var timeSignatures = this.hub.timeSignatures;
            for (var t = 0; t < timeSignatures.length; t++) {
                var nextSortKey = t < timeSignatures.length - 1 ? timeSignatures[t + 1].sortKey : 1000000;
                var subDiv = [];
                for (var i = 0; i <= divisionOfBeat; i++) {
                    subDiv.push(0);
                }
                for (var e = 0; e < data.length; e++) {
                    while (data[e].sortKey > nextSortKey) {
                        t++;
                        nextSortKey = t < timeSignatures.length - 1 ? timeSignatures[t + 1].sortKey : 1000000;
                    }
                    var ticks = Number(data[e].signature.split('.')[2]);
                    var closestIdx = this.getClosestIdx(ticks);
                    subDiv[closestIdx] += 1;
                }
                subDivCount[t] = _.clone(subDiv);
            }
            //
            // Cleanup accidentals
            //
            for (t = 0; t < timeSignatures.length; t++) {
                var total = _.sum(subDivCount[t]);
                for (i = subDivCount[t].length - 1; i > 0; i--) {
                    var sum = subDivCount[t][i];
                    if (sum == 0 || sum < (total / 10)) {
                        subDivCount[t].pop();
                    }
                    else {
                        break;
                    }
                }
            }
        };
        Normalizer.prototype.normalizeAllTracks = function (_song) {
            if (_song === void 0) { _song = this.hub.parsed[0]; }
            var song = _.cloneDeep(_song);
            if (this.subDiv.length == 0) {
                this.learnSubDivisions();
            }
            for (var t = 0; t < song.tracks.length; t++) {
                song.tracks[t] = this.normalizeTrack(song.tracks[t]);
            }
            this.hub.parsed.push(song);
            // writeJsonArr(song.tracks, "C:\\work\\CxSheet\\resource\\Normalized.json")
        };
        Normalizer.prototype.normalizeTrack = function (_track) {
            var track = _.sortBy(_track, ['sortKey']);
            for (var e = 0; e < track.length; e++) {
                var change = this.setNormalizedVal(track[e]);
                // Adjust realTime and deltaTime
                track[e].realNorm = track[e].realTime + change;
                track[e].deltaNorm = e == 0 ? track[e].deltaTime + change : track[e].realNorm - track[e - 1].realNorm;
            }
            return track;
        };
        // Count active noter at the start of the first six bars
        // For now  assume first bar base on a major change in the number of active notes 
        // 
        // TODO:
        // look for drum pre-count, some cymbol or similar and probably no bass drum
        // look for first beat with an active melody/chord note
        Normalizer.prototype.learnFirstActualBar = function (pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var grid = this.hub.getAllEvents(pIdx);
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
    }());
    CxSheet.Normalizer = Normalizer;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=Normalizer.js.map