/// <reference path="../src/references.ts" />
// const kmeans = require('node-kmeans');
var CxSheet;
(function (CxSheet) {
    var Analyzer = (function () {
        function Analyzer(hub) {
            this.hub = hub;
            this.matrix = {};
            this.matrixIndex = [];
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
        Analyzer.prototype.addTicks = function (event, addTicks) {
            // var newTicks = this.getTicks
            var numerator = this.hub.timeSignatures[event.sigIdx].numerator;
            var denominator = this.hub.timeSignatures[event.sigIdx].denominator;
            var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat;
            var bar = CxSheet.Beats.getBar(event.signature);
            var beat = CxSheet.Beats.getBeat(event.signature);
            var ticks = CxSheet.Beats.getTicks(event.signature);
            var newTicks = ticks + addTicks;
            event.deltaTime += addTicks;
            event.realTime += addTicks;
            while (newTicks > ticksPerBeat) {
                beat += 1;
                if (beat > denominator) {
                    bar += 1;
                    beat = 1;
                }
                newTicks -= ticksPerBeat;
            }
            var barStr = ("0000" + bar).slice(-4);
            var beatStr = ("00" + beat).slice(-2);
            var ticksStr = ("00" + newTicks).slice(-3);
            event.signature = barStr + "." + beatStr + "." + ticksStr;
        };
        Analyzer.prototype.adjustTicksNorm = function (event, addTicks) {
            // var newTicks = this.getTicks
            var numerator = this.hub.timeSignatures[event.sigIdx].numerator;
            var denominator = this.hub.timeSignatures[event.sigIdx].denominator;
            var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat;
            var bar = CxSheet.Beats.getBar(event.signature);
            var beat = CxSheet.Beats.getBeat(event.signature);
            var ticks = CxSheet.Beats.getTicks(event.signature);
            var newTicks = ticks + addTicks;
            event.deltaNorm += addTicks;
            event.realNorm += addTicks;
            event.duration -= addTicks;
            while (newTicks > ticksPerBeat) {
                beat += 1;
                if (beat > denominator) {
                    bar += 1;
                    beat = 1;
                }
                newTicks -= ticksPerBeat;
            }
            var barStr = ("0000" + bar).slice(-4);
            var beatStr = ("00" + beat).slice(-2);
            var ticksStr = ("00" + newTicks).slice(-3);
            event.signature = barStr + "." + beatStr + "." + ticksStr;
        };
        Analyzer.prototype.cleanUpArr = function (_tones) {
            // Cleanup dublicates
            var tones = [];
            // cleanup octave dublicates 
            console.log("INPUT -->" + stringify(_tones));
            for (var i = 0; i < _tones.length; i++) {
                var tone = _tones[i] % 12;
                if (i == 0) {
                    tones.push(tone);
                }
                else
                    while (tone < tones[tones.length - 1] && _.indexOf(tones, tone) < 0) {
                        tone += 12;
                    }
                if (_.indexOf(tones, tone) < 0) {
                    tones.push(tone);
                }
            }
            console.log(stringify(tones));
            return tones;
        };
        //
        // Bar by Bar: 
        //      - sort each sample
        //      - starting from the bottom, remove doubles
        //      - compress to max two octaves while preserving tone order
        //      - recursively include next sample:
        //          - if it consists doubles or octave doublings, especially if the root is sustained
        //          - if single note on strong beat then add next tones
        //      - incorporate position in the bar of the chord (main beats vs off-beats)
        //
        Analyzer.prototype.mergeSamples = function () {
            var prevTones = [];
            for (var key in this.matrix) {
                // console.log(stringify(this.matrix[key].notes))             
                var notes = this.cleanUpArr(_.sortBy(_.uniq(this.matrix[key].notes)));
                // var intersection = _.intersection( tones, prevTones )
                if (_.isEqual(notes, prevTones)) {
                    this.matrix[key].repeat = true;
                }
                else if (notes.length > 0) {
                    this.matrix[key].repeat = false;
                }
                prevTones = _.clone(notes);
                this.matrix[key].notes = _.clone(notes);
            }
            CxSheet.writeJson(this.matrix, "C:\\work\\CxSheet\\resource\\chordMatrix.json");
        };
        Analyzer.prototype.getTicksPerSample = function (sigIdx) {
            var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat;
            var sampleTicks = this.hub.subDivCount[sigIdx].length; // the sample subdivision 
            var samplePerBeat = Math.round(ticksPerBeat / sampleTicks);
            return samplePerBeat;
        };
        /*
        sampleOverlaps( _data: Array<MidiEvent> ) {
             var data: Array<MidiEvent> = _.clone(_data)
             for ( var e = 0; e < data.length ; e++ ) {
                if ( data[e].type == "noteOn" && (<ChannelNote>data[e]).velocity > 0 ) {
                    var goOn = true
                    var noteEnd = data[e].realNorm + (<ChannelNote> data[e]).duration
                    var overlap = noteEnd -  data[e].realNorm
                    while ( goOn ) {
                        noteEnd = data[e].realNorm + (<ChannelNote> data[e]).duration
                        if ( overlap > 0 && overlap > ( data[e].realNorm/10 ) ) {
                            if ( _.indexOf(this.matrix[data[e].signature], (<ChannelNote> data[e]).noteNumber)  < 0 ) {
                                this.matrix[data[e].signature].push( (<ChannelNote> data[e]).noteNumber )
                                var sampleTicks = this.getTicksPerSample( data[e].sigIdx )
                                this.adjustTicksNorm( data[e], sampleTicks )
                                noteEnd = data[e].realNorm + (<ChannelNote> data[e]).duration
                                overlap = noteEnd -  data[e].realNorm
                            }
                        }
                        else  {
                            _.unset( data[e] )
                            goOn = false
                        }
                    }
                }
            }
        }
        */
        //
        // Sample chord tones
        // 
        Analyzer.prototype.sampleChords = function (pIdx, includeBass) {
            if (pIdx === void 0) { pIdx = 1; }
            if (includeBass === void 0) { includeBass = true; }
            var trackList = this.hub.getChordTracks(includeBass);
            var data = this.hub.getTrackNotes(trackList, pIdx);
            // var prevReal: number = 0
            var idx = 0;
            // First pass to add all signature keys
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
                        if (e == (data.length - 1)) {
                            this.matrix[data[e].signaNorm].duration = data[e].duration;
                        }
                        this.matrixIndex.push(data[e].signaNorm);
                        idx += 1;
                    }
                }
            }
            // Second pass to add all notes
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
            CxSheet.writeJson(this.matrix, "C:\\work\\CxSheet\\resource\\matrix.json");
            this.mergeSamples();
        };
        return Analyzer;
    }());
    CxSheet.Analyzer = Analyzer;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=Analyzer.js.map