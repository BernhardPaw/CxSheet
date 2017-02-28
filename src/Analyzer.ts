/// <reference path="../src/references.ts" />
// const kmeans = require('node-kmeans');
namespace CxSheet { 

    export class Analyzer {
        noteEvents: Array<ChannelNote>
        tempo:      Array<Tempo>
        matrix:     Matrix = {}

        constructor( public hub : CxSheet.DataHub ) {
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
        
        //
        // sample chord tones
        // 
        sampleChords( pIdx: number = 1, includeBass: boolean = true ) {
            /// var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat
            var trackList    = this.hub.getChordTracks(includeBass)
            var data         = this.hub.getTrackNotes(trackList, pIdx )
             for ( var e = 0 ; e < data.length; e++ ) {
                if ( data[e].type == "noteOn" && data[e].velocity > 0 ) {
                    if ( _.isUndefined( this.matrix[data[e].sigNorm] ) ) { 
                        this.matrix[data[e].sigNorm] = [] 
                    }
                    this.matrix[data[e].sigNorm].push( data[e].noteNumber )
                }
             }
            // writeJson(this.matrix, "C:\\work\\CxSheet\\resource\\matrix.json") 
        }
    }
}