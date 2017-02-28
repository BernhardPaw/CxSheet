/// <reference path="../src/references.ts" />
// const kmeans = require('node-kmeans');
var CxSheet;
(function (CxSheet) {
    var Analyzer = (function () {
        function Analyzer(hub) {
            this.hub = hub;
            this.matrix = {};
            // this.sampleChords()
        }
        Analyzer.prototype.getDataHub = function () { return this.hub; };
        Analyzer.prototype.getTempo = function (pIdx, realTime) {
            if (pIdx === void 0) { pIdx = 0; }
            if (realTime === void 0) { realTime = 0; }
            if (this.tempo == null) {
                this.tempo = _.sortedUniq(_.sortBy(_.filter(_.flatten(this.hub.parsed[pIdx].tracks), { "programType": ProgramType.chords }), ['sortKey']));
            }
            var event = null;
            if (realTime == 0) {
                event = this.tempo[0];
            }
            else {
                var prevEvent;
                for (var t = 0; t < this.tempo.length; t++) {
                    if (realTime < this.tempo[t].realTime) {
                        prevEvent = this.tempo[t];
                    }
                    else {
                        event = prevEvent;
                    }
                }
            }
            if (event == null) {
                event = prevEvent;
            }
            return event.microsecondsPerBeat;
        };
        Analyzer.prototype.learnOverlaps = function (data) {
            // Create the data 2D-array (vectors) describing the note overlaps 
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
            // writeJsonArr(overlapArr, "C:\\work\\CxSheet\\resource\\overlaps.json")
            /*
            kmeans.clusterize(vectors, {k: 2}, (err,res) => {
                if (err) {
                    this.barGrid.writeJsonFile([{errMsg: err}], "C:\\work\\CxSheet\\resource\\kmeansERR.json")
                    // console.error(err)
                }
                else {
                    this.barGrid.writeJsonFile(res, "C:\\work\\CxSheet\\resource\\kmeans.json")
                    // console.log('%o',res)
                }
            })
            */
        };
        // TODO: 
        // Single tone durations only have incidental overlaps with other notes to the left and right
        // Single note may be stringed together to form a chord, provided that the steps (looking at the group of stringed notes) are intervallic in nature
        // ChordTones are intonated close to each other within a common duration, but may also have small incidental overlaps with other chords/notes  
        // Use k-means (above) to cluster the short and long overlaps
        /*
          setOverlaps ( data: Array<ChannelNote> ) {
            // var track = this.hub.parsed[pIdx].tracks[t]
            // var realTime = e == 0 ? track[e].deltaTime : track[e].deltaTime + track[e - 1].realTime
            // t: number, e: number, pIdx: number = 0
            var minOverlap    = Math.floor( (this.hub.parsed[0].header.ticksPerBeat / CxSheet.Config.sampleBeatDivision ) / 2  )
            var overlapCount  = 0
            var lookBack      = CxSheet.Config.overlapLookBack
            if ( t == 7 ) {
                var debug = 1
            }
            for( var b = e - 1, bCount = 0 ; b > 0 && bCount < lookBack; b--) {
                if ( track[b].type == "noteOn" && (<ChannelNote> track[b]).velocity > 0 ) {
                    var prevRealTimeEnd = track[b].realTime + (<ChannelNote>track[b]).duration
                    var overlap = prevRealTimeEnd - track[e].realTime
                    if ( overlap > minOverlap ) {
                        (<ChannelNote> track[b]).overlaps += 1
                        overlapCount++
                    }
                    bCount++
                }
            }
            (<ChannelNote> track[e]).overlaps = overlapCount
        }
        */
        /*
        getSampleRate() {
            //  TODO: Analyze this.hub.subDivCount to find a a sample rate

        }
        */
        /*
        addTicks( event: ChannelNote, addTicks: number ): ChannelNote {
            // var newTicks = this.getTicks
            var numerator    = this.hub.timeSignatures[event.sigIdx].numerator
            var denominator  = this.hub.timeSignatures[event.sigIdx].denominator
            var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat
            var bar          = Beats.getBar(event.signature)
            var beat         = Beats.getBeat(event.signature)
            var ticks        = Beats.getTicks(event.signature)
            var newTicks     = ticks + addTicks

            event.deltaTime += addTicks
            event.realTime  += addTicks
            while ( newTicks  > ticksPerBeat ) {
                beat += 1
                if ( beat > denominator ) {
                    bar += 1
                    beat = 1
                }
                newTicks -= ticksPerBeat
            }
            var barStr:string   = ("0000" + bar).slice(-4)
            var beatStr:string  = ("00"   + beat).slice(-2)
            var ticksStr:string = ("00"   + newTicks ).slice(-3)
            event.signature = barStr + "." + beatStr + "." + ticksStr
            return event
        }
        */
        //
        // sample chord tones
        // 
        Analyzer.prototype.sampleChords = function (pIdx, includeBass) {
            if (pIdx === void 0) { pIdx = 1; }
            if (includeBass === void 0) { includeBass = true; }
            /// var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat
            var trackList = this.hub.getChordTracks(includeBass);
            var data = this.hub.getTrackNotes(trackList, pIdx);
            for (var e = 0; e < data.length; e++) {
                if (data[e].type == "noteOn" && data[e].velocity > 0) {
                    if (_.isUndefined(this.matrix[data[e].sigNorm])) {
                        this.matrix[data[e].sigNorm] = [];
                    }
                    this.matrix[data[e].sigNorm].push(data[e].noteNumber);
                }
            }
            // writeJson(this.matrix, "C:\\work\\CxSheet\\resource\\matrix.json") 
        };
        return Analyzer;
    }());
    CxSheet.Analyzer = Analyzer;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=Analyzer.js.map