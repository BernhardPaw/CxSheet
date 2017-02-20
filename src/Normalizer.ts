/// <reference path="../src/references.ts" />
// const kmeans = require('node-kmeans');
namespace CxSheet { 

    /*
    export class Zone {        
        constructor( public spread ) { }
    }
    */

    export class Normalizer extends Analyzer{

        subDiv:      number[]   = [] 
        subDivCount: number[][] = []

        constructor( hub : CxSheet.DataHub ) { 
            super(hub)
        }

        getClosestIdx( ticks: number, _len: number = -1 ): number {
            var len = _len == -1 || _len > this.subDiv.length ? this.subDiv.length : _len
            var closest: number = -1
            for ( var e = 1 ; e < this.subDiv.length; e++ ) { 
                var dist = Math.abs(ticks - this.subDiv[e])
                if ( dist < closest || closest < 0 ) {
                    closest = e
                }
            }
            return closest
        }

        getNormalizedVal( event: BaseEntry): number {

            var subDiv: number
            try {     
                subDiv = this.subDivCount[event.sigIdx].length 
            }
            catch(err) {
               console.log("subDivCount.length:" + this.subDivCount.length + ", idx:" + event.sigIdx )
            }
            var normIdx = this.getClosestIdx(Beats.getTicks(event.signature), subDiv)
            return this.subDiv[normIdx]
        }

        //
        // Read the drum track and figure out the learnSubDivisions
        //
        learnSubDivisions( divisionOfBeat: number = 6,  pIdx: number = 0  ) {
            var data   = this.hub.getTrackEvents( this.hub.getDrumTracks() )    
            var ticksPerBeat: number = this.hub.parsed[pIdx].header.ticksPerBeat
            for ( var i = 0; i <= divisionOfBeat ; i++ ) {
                this.subDiv.push( i == 0 ? 0 : Math.floor(ticksPerBeat/i) ) 
            }
            //
            var timeSignatures: TimeSignature[] = this.hub.timeSignatures
            for ( var t = 0 ; t < timeSignatures.length; t++) {
                var nextSortKey = t < timeSignatures.length -1 ? timeSignatures[t+1].sortKey: 1000000
                var subDivCount: number[] = []
                for ( var i = 0; i <= divisionOfBeat ; i++ ) {  
                    subDivCount.push(0) 
                }
                for ( var e = 0 ; e < data.length; e++ ) { 
                    if ( data[e].sortKey > nextSortKey ) { t++ }
                    var ticks   = Number((<ChannelNote>data[e]).signature.split('.')[2])
                    var closest = this.getClosestIdx(ticks)
                    subDivCount[closest] += 1
                }  
                this.subDivCount[t] = subDivCount 
            }
            for ( t = 0 ; t < timeSignatures.length; t++) {
                var total = _.sum( this.subDivCount[t] )
                for ( i = this.subDivCount[t].length - 1; i > 0 ; i-- ) { 
                    var sum =  this.subDivCount[t][i]
                    if ( sum == 0 || sum < ( total / 10 ) ) { // crude way to remove accidentals
                        this.subDivCount[t].pop()  
                    } 
                    else { break }
                }
            }
        }

        normalizeAllTracks ( _song: Song, _seed: number = null ) {
            var song: Song = _.cloneDeep(_song)
            for(var t = 0; t < song.tracks.length; t++ ) {
                this.normalizeTrack(song.tracks[t]) 
            }
        }

        normalizeTrack( track: Track ) {
            if ( this.subDiv.length == 0 ) {
                this.learnSubDivisions()
            }
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
        learnFirstActualBar( pIdx: number = 0 ) {
            var grid = this.hub.grids[pIdx]
            var tickPerBeat = this.hub.parsed[pIdx].header.ticksPerBeat
            var sixBars: Array<ChannelNote> = []
            var noteCount: number[] = [] // _.fill( Array( this.subDiv.length * 6 ), 0)
            for ( var e = 0; e < grid.length; e++ ) {
                if ( grid[e].signature.match(/^0007\..*/) ) { break }
                if ( grid[e].type ==  "noteOn" ) {
                    var event    = <ChannelNote> grid[e]
                    var barBeats = (Beats.getBar(event.signature) - 1) * this.hub.timeSignatures[event.sigIdx].numerator
                    var beat     = Beats.getBeat(event.signature)
                    var ticks    = Beats.getTicks(event.signature)
                    var idx      = this.getClosestIdx(ticks)
                    noteCount[idx] += 1
                    var nTicks  = this.subDiv[idx] 
                    if ( nTicks == tickPerBeat ) {

                    }
                    event.signature = Beats.setTicks(event.signature, nTicks)
                    sixBars.push(event) 
                }
            }
            writeJsonArr(sixBars, "C:\\work\\CxSheet\\resource\\sixBars.json")
        }
       
    }
}