/// <reference path="../src/references.ts" />
var kmeans = require('node-kmeans');
var CxSheet;
(function (CxSheet) {
    var Zone = (function () {
        function Zone(spread) {
            this.spread = spread;
        }
        return Zone;
    }());
    CxSheet.Zone = Zone;
    var Analyzer = (function () {
        // overLapClusters: 
        function Analyzer(barGrid) {
            this.barGrid = barGrid;
            this.groupPrograms();
        }
        Analyzer.prototype.groupPrograms = function () {
            this.programChanges = _.sortBy(_.filter(this.barGrid.grid, { "type": "programChange" }), ['realTime', 'track', 'sortKey']);
            for (var e = 0; e < this.programChanges.length; e++) {
                var p = this.programChanges[e].programNumber;
                if ((p > 0 && p < 33) || (p > 40 && p < 113)) {
                    this.programChanges[e].programType = ProgramType.chords;
                }
                else if ((p > 32 && p < 41)) {
                    this.programChanges[e].programType = ProgramType.bass;
                }
                else {
                    this.programChanges[e].programType = ProgramType.drums;
                }
            }
            this.chordTracksCh = _.sortedUniq(_.sortBy(_.filter(this.programChanges, { "programType": ProgramType.chords }), ['realTime', 'track', 'sortKey']));
            this.bassTracksCh = _.sortedUniq(_.sortBy(_.filter(this.programChanges, { "programType": ProgramType.bass }), ['realTime', 'track', 'sortKey']));
            this.drumTracksCh = _.sortedUniq(_.sortBy(_.filter(this.programChanges, { "programType": ProgramType.drums }), ['realTime', 'track', 'sortKey']));
        };
        Analyzer.prototype.getChordTracks = function (includeBass) {
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
        Analyzer.prototype.getTrackEvents = function (tracks) {
            var events = _.sortBy(_.filter(this.barGrid.grid, function (e) {
                return (tracks.indexOf(e.track) > -1 && e.type == 'noteOn');
            }), ['realTime', 'track', 'sortKey']);
            return events;
        };
        Analyzer.prototype.learnSubDivision = function () {
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
            this.barGrid.writeJsonFile(overlapArr, "C:\\work\\CxSheet\\resource\\overlaps.json");
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
        // Single tone durations only have incidental overlaps with other notes to the left and right
        // Single note may be stringed together to form a chord, provided that the steps (looking at the group of stringed notes) are intervallic in nature
        // ChordTones are intonated close to each other within a common duration, but may also have small incidental overlaps with other chords/notes  
        // Use k-means (above) to cluster the short and long overlaps
        Analyzer.prototype.groupChordNotes = function (includeBass) {
            if (includeBass === void 0) { includeBass = false; }
            var trackList = this.getChordTracks(includeBass);
            var data = this.getTrackEvents(trackList);
            this.learnOverlaps(data);
            /*
            var noteCluster: ChannelNote[] = []
            var headEvent: ChannelNote = data[0]
            var e = 1
            while ( e < data.length ) {

                if ( headEvent.deltaTime + headEvent.duration < data[e].realTime - this.incidentalOverlap ) {
                    // SingleNote
                }
            }
            */
        };
        return Analyzer;
    }());
    CxSheet.Analyzer = Analyzer;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=Analyzer.js.map