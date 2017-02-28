/// <reference path="../src/references.ts" />
// const kmeans = require('node-kmeans');
namespace CxSheet { 

    export class Normalizer { //  extends Analyzer

        subDiv:     number[]   = [] ;
        maxTicks:   number

        constructor( public hub : CxSheet.DataHub ) { 
            this.maxTicks = this.hub.parsed[0].header.ticksPerBeat -1
            this.learnSubDivisions()
        }
        
        /*  Not used p.t.
        addTicks( event: ChannelNote, addTicks: number ): BaseEntry {
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
        
        getTicksDiff( event: BaseEntry): number {
            var numerator    = this.hub.timeSignatures[event.sigIdx].numerator
            var denominator  = this.hub.timeSignatures[event.sigIdx].denominator
            var ticksPerBeat = this.hub.parsed[0].header.ticksPerBeat
            var bar          = Beats.getBar(event.signature)
            var barN         = Beats.getBar(event.sigNorm)
            var beat         = Beats.getBeat(event.signature)
            var beatN        = Beats.getBeat(event.sigNorm)
            var ticks        = Beats.getTicks(event.signature)
            var ticksN       = Beats.getTicks(event.sigNorm)
            var diff:      number = 0
            var barDiff:   number = 0 
            var beatDiff:  number = 0
            var ticksDiff: number = 0   
           
            barDiff   = ( barN - bar ) * ticksPerBeat * numerator
            beatDiff  = ( beatN - beat ) * ticksPerBeat
            ticksDiff = ticksN - ticks

            diff = barDiff + beatDiff + ticksDiff
            return diff
        }

        getClosestIdx( ticks: number, _len: number = -1 ): number {
            var len = _len == -1 || _len >= this.subDiv.length ? this.subDiv.length - 1 : _len
            var closest:    number = 10000000
            var closestIdx: number = -1
            for ( var e = 0 ; e <= len; e++ ) { 
                var dist = Math.abs(ticks - this.subDiv[e])
                if ( dist < closest ) {
                    closest     = dist
                    closestIdx  = e
                }
            }   
            return closestIdx
        }

        setNormalizedVal( event: BaseEntry, _len: number = -1): number {
            var len = _len == -1 || _len >= this.subDiv.length ? this.subDiv.length - 1 : _len
            var closest:    number = 10000000
            var closestIdx: number = this.getClosestIdx( Beats.getTicks(event.signature), len )
            var ticks: number      = this.subDiv[closestIdx]
            var beat = Beats.getBeat(event.signature)
            var bar  = Beats.getBar(event.signature)
            // Check if we are in the next beat and next bar
            if ( ticks == this.maxTicks ) {
                var denominator = this.hub.timeSignatures[event.sigIdx].denominator
                ticks = 0
                beat += 1
                if ( beat  > this.hub.timeSignatures[event.sigIdx].denominator ) {
                    beat  = 1
                    bar  += 1
                }
                event.sigNorm = Beats.setSignature(bar, beat, ticks)
            }
            else {
                event.sigNorm = Beats.setSignature(bar, beat, ticks)
            }
            return this.getTicksDiff(event)
        }
        //
        // Read the drum track and figure out the Sub-Divisions
        //
        learnSubDivisions( divisionOfBeat: number = 6,  pIdx: number = 0  ) {
            var subDivCount = this.hub.subDivCount
            var data   = this.hub.getTrackNotes( this.hub.getDrumTracks() )    
            var ticksPerBeat: number = this.hub.parsed[pIdx].header.ticksPerBeat
            for ( var i = 0; i <= divisionOfBeat ; i++ ) {
                this.subDiv.push( i == 0 ? 0 : Math.floor(ticksPerBeat/i) - 1 ) 
            }
            //
            // Count the number of subdivisions for each time signature
            //
            var timeSignatures: TimeSignature[] = this.hub.timeSignatures
            for ( var t = 0 ; t < timeSignatures.length; t++) {
                var nextSortKey = t < timeSignatures.length -1 ? timeSignatures[t+1].sortKey: 1000000
                var subDiv: number[] = []
                for ( var i = 0; i <= divisionOfBeat ; i++ ) {  
                    subDiv.push(0) 
                }
                for ( var e = 0 ; e < data.length; e++ ) { 
                    while ( data[e].sortKey > nextSortKey ) { 
                        t++
                        nextSortKey = t < timeSignatures.length -1 ? timeSignatures[t+1].sortKey: 1000000 
                    }
                    var ticks   = Number((<ChannelNote> data[e]).signature.split('.')[2])
                    var closestIdx = this.getClosestIdx(ticks)
                    subDiv[closestIdx] += 1
                }  
                subDivCount[t] = _.clone(subDiv)
            }
            //
            // Cleanup accidentals
            //
            for ( t = 0 ; t < timeSignatures.length; t++) {
                var total = _.sum( subDivCount[t] )
                for ( i = subDivCount[t].length - 1; i > 0 ; i-- ) { 
                    var sum =  subDivCount[t][i]
                    if ( sum == 0 || sum < ( total / 10 ) ) { // crude way to remove accidentals
                        subDivCount[t].pop()  
                    } 
                    else { break }
                }
            }
        }

        normalizeAllTracks ( _song: Song = this.hub.parsed[0]) {
            var song: Song = _.cloneDeep(_song)
            if ( this.subDiv.length == 0 ) {
                this.learnSubDivisions()
            }
            for(var t = 0; t < song.tracks.length; t++ ) {
                song.tracks[t] = this.normalizeTrack(song.tracks[t]) 
            }
            this.hub.parsed.push(song)
            // writeJsonArr(song.tracks, "C:\\work\\CxSheet\\resource\\Normalized.json")
        }

        normalizeTrack( _track: Track ) {
            var track = _.sortBy(_track,['sortKey'])
            for ( var e = 0 ; e < track.length; e++ ) {
                var change  = this.setNormalizedVal(track[e])
                // Adjust realTime and deltaTime
                track[e].realNorm  = track[e].realTime  + change
                track[e].deltaNorm = e == 0 ? track[e].deltaTime + change : track[e].realNorm - track[e-1].realNorm
            }
            return track
        }

        // Count active noter at the start of the first six bars
        // For now  assume first bar base on a major change in the number of active notes 
        // 
        // TODO:
        // look for drum pre-count, some cymbol or similar and probably no bass drum
        // look for first beat with an active melody/chord note
        learnFirstActualBar( pIdx: number = 0 ) {
            var grid = this.hub.getAllEvents(pIdx)
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
                        // TODO: Complete or remove this function
                    }
                    event.signature = Beats.setTicks(event.signature, nTicks)
                    sixBars.push(event) 
                }
            }
            writeJsonArr( sixBars, "C:\\work\\CxSheet\\resource\\sixBars.json" )
        } 
    }
}