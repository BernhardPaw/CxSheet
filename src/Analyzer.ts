/// <reference path="../src/references.ts" />
// const kmeans = require('node-kmeans');
// const cxchord = require('cxchord')
namespace CxSheet { 

    export class Analyzer {
        noteEvents:     Array<ChannelNote>
        tempo:          Array<Tempo>
        matrix:         Matrix
        matrixIndex:    string[] = []


        constructor( public hub : CxSheet.DataHub ) {
            this.matrix = this.hub.matrix
            // this.sampleChords()
        }

        getDataHub(): DataHub { return this.hub }
     
        getTempo( pIdx: number = 0, realTime: number = 0 ): number { // TODO: write tests for this
            if ( this.tempo == null )  { 
                this.tempo =  _.sortedUniq( 
                                    _.sortBy( 
                                         _.filter( 
                                                _.flatten(this.hub.parsed[pIdx].tracks) 
                                            , { "programType": ProgramType.chords } 
                                         )
                                         , ['sortKey'] 
                                    ) 
                             )
            }
            var event: Tempo = null
            if ( realTime == 0  ) {
                event = this.tempo[0]
            }
            else {
                var prevEvent: Tempo
                for ( var t = 0; t <  this.tempo.length; t++ ) {
                    if ( realTime < this.tempo[t].realTime ) {
                        prevEvent = this.tempo[t]
                    }
                    else {
                         event = prevEvent     
                    }
                }
            }
            if ( event == null ) {
                 event = prevEvent
            }
            return event.microsecondsPerBeat
        }

        cleanUpArr( _tones: number[] ): number[] {
            // Cleanup dublicates and octave dublicates 
            var tones: number[] = [] 
            // console.log("INPUT -->" + stringify(_tones))
            for( var i = 0; i < _tones.length; i++ ) {
                var tone = _tones[i] % 12
                if ( i == 0 ) {
                    tones.push(tone)
                }
                else while ( tone < tones[tones.length - 1] && _.indexOf( tones, tone ) < 0 ) {
                        tone += 12
                }
                if ( _.indexOf( tones, tone ) < 0 ) {
                     tones.push(tone)
                }
            }
            // console.log(stringify(tones))
            return tones
        }

        //
        // Bar by Bar: 
        //      - sort each sample
        //      - starting from the bottom, remove doubles
        //      - compress to max two octaves while preserving tone order
        //      - mark next chord as repeat if equal
        //      TODO: later incorporate position in the bar of the chord (beats vs off-beats)
        //
        mergeSamples() {
            var prevTones: number[] = []
            for ( var key in this.matrix ) {    
                // console.log(stringify(this.matrix[key].notes))             
                var notes = this.cleanUpArr( _.sortBy( _.uniq( this.matrix[key].notes ) ) )
                // var intersection = _.intersection( tones, prevTones )
                if ( _.isEqual( notes, prevTones ) ) {
                    this.matrix[key].repeat = true
                }
                else if ( notes.length > 0 ) {
                    this.matrix[key].repeat = false
                }
                prevTones = _.clone(notes)
                this.matrix[key].notes  = _.clone(notes)
            }
            // writeJson(this.matrix, "C:\\work\\CxSheet\\resource\\chordMatrix.json") 
        }

        getTicksPerSample( sigIdx: number) {
            var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat
            var sampleTicks = this.hub.subDivCount[sigIdx].length // the sample subdivision 
            var samplePerBeat = Math.round(ticksPerBeat / sampleTicks) 
            return samplePerBeat
        }

        //
        // Sample chord tones
        // 
        sampleChords( pIdx: number = 1, includeBass: boolean = true ) {     
            var trackList    = this.hub.getChordTracks(includeBass)
            var data: Array<MidiEvent> = this.hub.getTrackNotes(trackList, pIdx )
            // var prevReal: number = 0
            var idx: number = 0
            // First pass to add all signature keys
            for ( var e = 0 ; e < data.length; e++ ) {
                if ( data[e].type == "noteOn" && (<ChannelNote>data[e]).velocity > 0 ) {
                    if ( _.isUndefined( this.matrix[data[e].signaNorm] ) ) { 
                        this.matrix[data[e].signaNorm] = { 
                            realTime: data[e].realNorm,
                            index:  idx, 
                            duration: 0, 
                            notes: [] 
                        }
                        if ( e > 0 ) {
                            var duration = this.matrix[data[e].signaNorm].realTime - this.matrix[data[e-1].signaNorm].realTime
                            this.matrix[data[e-1].signaNorm].duration = duration 
                        }
                        if ( e == ( data.length - 1) ) {
                            this.matrix[data[e].signaNorm].duration =  (<ChannelNote>data[e]).duration
                        }
                        this.matrixIndex.push( data[e].signaNorm )
                        idx += 1
                    }
                }
             }
             // Second pass to add all notes
             var noteEnd
             var overlap
             for ( e = 0 ; e < data.length; e++ ) {
                 if ( data[e].type == "noteOn" && (<ChannelNote>data[e]).velocity > 0 ) {    
                     idx =  this.matrix[data[e].signaNorm].index
                     noteEnd = data[e].realNorm + (<ChannelNote> data[e]).duration
                     while ( idx < this.matrixIndex.length && noteEnd >  this.matrix[this.matrixIndex[idx]].realTime ) {
                         this.matrix[this.matrixIndex[idx]].notes.push((<ChannelNote>data[e]).noteNumber)
                         idx += 1
                     }
                 }
             }
            // writeJson(this.matrix, "C:\\work\\CxSheet\\resource\\matrix.json") 
            this.mergeSamples()
        }

        getChords() {
          var cm =   new CxChord.ChordMatcher()
          cm.favorJazz( true )
          // cm.match(midiChord)
          var p0 = cm.bayes.getBestPosterior(1) 
        }
    }
}