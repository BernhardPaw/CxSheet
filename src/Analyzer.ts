/// <reference path="../src/references.ts" />
// const kmeans = require('node-kmeans');
namespace CxSheet { 
   
    export class Analyzer {
        noteEvents: Array<ChannelNote>
        tempo:      Array<Tempo>
        matrix:     chordMatrix = []

        constructor( public hub : CxSheet.DataHub ) {
            this.groupPrograms()
        }

        getDataHub(): DataHub { return this.hub }

        groupPrograms( pIdx: number = 0 ) {    
            var programChanges = _.sortBy( _.filter(this.hub.grids[0], { "type": "programChange" } ), ['realTime', 'track', 'sortKey'] )
            for( var e = 0 ; e < programChanges.length; e++ ) {
                var p =  programChanges[e].programNumber
                if ( ( p > 0 && p < 33 ) || ( p > 40 && p < 113 ) ) {
                    programChanges[e].programType = ProgramType.chords
                }
                else if ( ( p > 32 && p < 41 )  ) {
                    programChanges[e].programType = ProgramType.bass
                }
                else {
                    programChanges[e].programType = ProgramType.drums
                }
            }
            this.hub.programChanges = programChanges
            this.hub.chordTracksCh  = _.sortedUniq( _.sortBy( _.filter(programChanges, { "programType": ProgramType.chords } ), ['realTime', 'track', 'sortKey'] ) )
            this.hub.bassTracksCh   = _.sortedUniq( _.sortBy( _.filter(programChanges, { "programType": ProgramType.bass } ), ['realTime', 'track', 'sortKey'] ) )
            this.hub.drumTracksCh   = _.sortedUniq( _.sortBy( _.filter(programChanges, { "programType": ProgramType.drums } ), ['realTime', 'track', 'sortKey'] ) )
        }

        getTempo( pIdx: number = 0, realTime: number = 0 ): number {
            if ( this.tempo == null )  { 
                this.tempo =  _.sortedUniq( _.sortBy( _.filter( this.hub.grids[pIdx], { "programType": ProgramType.chords } ), ['sortKey'] ) )
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

        /*
        learnAccidentals ( pIdx: number = 0 ) {
            var msPerBeat   = this.getTempo(pIdx)
            var tickPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat
            //
            // TODO: Finish this
            //
            
        }
        */

        learnOverlaps ( data: Array<ChannelNote> ) {
            // Create the data 2D-array (vectors) describing the note overlaps 
            var vectors: number[] = [];
            var headEvent: ChannelNote = data[0]
            var e = 0
            while ( e < data.length - 1 ) { 
                var t = e + 1
                while ( headEvent.realTime + headEvent.duration - data[t].realTime > 0 ) {
                    var lowerBoundary  = data[t].realTime
                    var upperBoundaryE = headEvent.realTime + headEvent.duration
                    var upperBoundaryT = data[t].realTime + data[t].duration
                    var overlap        =  upperBoundaryE > upperBoundaryT ? upperBoundaryT - lowerBoundary : upperBoundaryE - lowerBoundary
                    if ( overlap > 0 ) { vectors.push(overlap) }
                    t += 1
                }
                e += 1
            } 
            
            var overlapArr: number[] = _.sortedUniq(_.sortBy(vectors) )
            writeJsonArr(overlapArr, "C:\\work\\CxSheet\\resource\\overlaps.json")

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
        }

        

        // Single tone durations only have incidental overlaps with other notes to the left and right
        // Single note may be stringed together to form a chord, provided that the steps (looking at the group of stringed notes) are intervallic in nature
        // ChordTones are intonated close to each other within a common duration, but may also have small incidental overlaps with other chords/notes  
        // Use k-means (above) to cluster the short and long overlaps

        
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
            var ticksStr:string = ("00"   + ticks ).slice(-3)
            event.signature = barStr + "." + beatStr + "." + ticksStr
            return event
        }

        addToMatrix( event: ChannelNote) {
            var bar   = Beats.getBar(event.signature)
            var beat  = Beats.getBeat(event.signature)
            var ticks = Beats.getTicks(event.signature)
            if ( _.isUndefined(this.matrix[bar]) ) { this.matrix[bar] = [] }
            if ( _.isUndefined(this.matrix[bar][beat]) ) { this.matrix[bar][beat] = [] }
            this.matrix[bar][beat].push(event.noteNumber)
        }

        //
        // sample chord tones
        // 
        sampleChords( sampleBeatDivision: number = 2, pIdx: number = 0, includeBass: boolean = false ) {
            var ticksPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat
            var ticksPerSample = ticksPerBeat / sampleBeatDivision
            var trackList = this.hub.getChordTracks(includeBass)
            var data =  this.hub.getTrackEvents(trackList, pIdx ) 
            //
            for ( var e = 0; e <= data.length; e++ ) {
                var event = data[e]
                if ( event.type == "noteOn") {          
                    this.addToMatrix( _.clone(event) )
                    event.duration -= ticksPerSample
                    while ( event.duration > ticksPerSample ) {
                        event = this.addTicks( event, ticksPerSample )
                        this.addToMatrix( _.clone(event) )
                        event.duration -= ticksPerSample
                    }
                }
            }
        }
    }
}