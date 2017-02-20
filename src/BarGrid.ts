
/// <reference path="../src/references.ts" />

var _ = require('lodash');
var stringify = require('json-stable-stringify')

namespace CxSheet { 

    export class Beats {
        // beatsTrack:      (MetaEntry| MetaText)[] = []
        beatsSortKey:       number = 0
        ticksPerBar:        number
        ticksPerBeat:       number 
        prevBeatRealTime:   number = 0
        // prevTimeSigRealTime: number
        beatsPerBar:        number
        timeIdx:            number = 0
        // firstBeat:       boolean = true

        constructor( public hub : CxSheet.DataHub, public beatCounter: number = 0) {
            // TODO: ticksPerBeat - Check this for e.g. 1/8 and 12/8 
            // Check for and go past more timeSignatures with realTime == 0 entries
            while ( ( this.timeIdx + 1 )  < hub.timeSignatures.length &&  hub.timeSignatures[this.timeIdx + 1].realTime == 0  ) { 
                this.timeIdx++ 
            }
        }

        static getTicks(signature: string ): number {
            return Number(signature.split('.')[2])
        }

        static getBeat(signature: string ): number {
            return Number(signature.split('.')[1])
        }

        static getBar(signature: string ): number {
            return Number(signature.split('.')[0])
        }
        
        /*
        static getBeatIdx(event: ChannelNote ): number {
            var bar = this.getBar(event.signature) 
            return Number(event.signature.split('.')[1])
        }
        */
        
        static setTicks(signature: string, ticks: number ): string {
            return signature.substr( 0,8 ) + ("00" + ticks ).slice(-3)
        }

        checkResolution( realTime: number ) {
            var timeSignatures = this.hub.timeSignatures
            if ( ( this.timeIdx + 1 ) < timeSignatures.length &&  timeSignatures[this.timeIdx + 1].realTime <= realTime  ) {
                this.timeIdx++
                this.setResolution()
            }
        }

        setResolution( pIdx: number = 0 ) {
            // var timeSignatures = this.hub.timeSignatures
            this.ticksPerBeat  = this.hub.parsed[pIdx].header.ticksPerBeat
            this.beatsPerBar   =  this.hub.timeSignatures.length > this.timeIdx ? this.hub.timeSignatures[this.timeIdx].numerator : 0
            this.ticksPerBar   = this.beatsPerBar * this.ticksPerBeat
            // this.prevTimeSigRealTime  = barGrid.timeSignatures[this.timeIdx].realTime
        }

        getSignature ( realTime: number = -1 ): string { 
            var barCount     = Math.floor(this.beatCounter / this.beatsPerBar)  + 1
            var beatCount    = this.beatCounter % this.beatsPerBar + 1
            var _ticks       = realTime == -1 ? 0 : realTime - this.prevBeatRealTime          
            var bar:string   = ("0000" + barCount).slice(-4)
            var beat:string  = ("00"   + beatCount).slice(-2)
            var ticks:string = ("00"   + _ticks ).slice(-3)
            return bar + "." + beat + "." + ticks
        }

        getBeatSignature(): string {
            return this.getSignature()
        }
       
        addSignature( event: MidiEvent ) {
            // Check for new beat
            while ( event.realTime >= ( this.prevBeatRealTime + this.ticksPerBeat ) ) {
                var beatIsABar = ( Math.floor( (this.beatCounter + 1) / this.beatsPerBar) == 0 )
                if ( beatIsABar ) {
                    this.checkResolution(event.realTime)
                }
                this.addBeatMarker()
            }
            event.sortKey   = this.beatsSortKey++
            event.signature = this.getSignature( event.realTime )
            // this.hub.grid.push( event )
            // return event
        }

        addBeatMarker( pIdx: number = 0 ) {       
            var nextBeat: number = this.prevBeatRealTime + this.ticksPerBeat
            var event: MetaText = {
                deltaTime:  this.ticksPerBeat,
                type:       'beat',
                realTime:   nextBeat,
                track :     this.hub.parsed[pIdx].tracks.length,
                sortKey:    this.beatsSortKey++,
                meta:       true,
                text:       this.getBeatSignature()
            }
            this.hub.bars.push( event )
            this.beatCounter++
            this.prevBeatRealTime += this.ticksPerBeat
        }
    }
   
    export class BarGrid extends Beats {

        maxRealtime:     number          = 0
        minDuration:     number          = 100000
        realTimePointer: number          = 0

        constructor( public hub : CxSheet.DataHub ) { 
            super(hub)
            this.buildGrid()
        }

        getDuration( t: number, e: number, pIdx: number = 0  ) {
            var track = this.hub.parsed[pIdx].tracks[t]
            var p = e - 1
            for ( ; p >= 0 ; p-- ) {
                if ( track[p] && track[p].type == "noteOn"  && 
                    (<ChannelNote>track[p]).velocity > 0  && 
                    (<ChannelNote>track[p]).noteNumber == (<ChannelNote>track[e]).noteNumber ) {
                        var currDuration = (<ChannelNote>track[p]).duration
                        var newDuration  = (<ChannelNote>track[e]).realTime - (<ChannelNote>track[p]).realTime;
                        if (  currDuration == 0 || currDuration > newDuration ) { 
                            (<ChannelNote>track[p]).duration = newDuration
                            this.minDuration = newDuration < this.minDuration ? newDuration : this.minDuration
                        }
                        else {
                            this.minDuration = currDuration < this.minDuration ? currDuration : this.minDuration
                        }
                        break
                }
            } 
        }

        extendedParsing( pIdx: number = 0 ) {
            var song: Song = this.hub.parsed[pIdx]
	        for (var t = 0; t < song.tracks.length; t++ ) {
				if (song.tracks[t].length > 0) {
                    // Loop through track
					for (var e = 0; e < song.tracks[t].length; e++) { 
                        song.tracks[t][e].track    = t                       
                        song.tracks[t][e].realTime = e == 0 ? song.tracks[t][e].deltaTime : song.tracks[t][e].deltaTime + song.tracks[t][e - 1].realTime
                        song.tracks[t][e].sortKey  = e
                        if ( song.tracks[t][e].type == "timeSignature" ) {
                            this.hub.timeSignatures.push( <TimeSignature> song.tracks[0][e] )
                            this.setResolution()
                        } 
                        (<ChannelNote> song.tracks[t][e]).sigIdx = this.hub.timeSignatures.length == 0 ? 0 : this.hub.timeSignatures.length - 1 
                        if ( song.tracks[t][e].type == "noteOff" || song.tracks[t][e].type == "noteOn" ){
                            (<ChannelNote> song.tracks[t][e]).duration = 0 
                            if ( song.tracks[t][e].type == "noteOff" ) {
                                this.getDuration(t, e)
                            }
                            else if ( song.tracks[t][e].type == "noteOn" && (<ChannelNote> song.tracks[t][e]).velocity == 0 ) {
                                this.getDuration(t, e)   
                            }
                        }
                        this.maxRealtime =  song.tracks[t][e].realTime > this.maxRealtime ? song.tracks[t][e].realTime : this.maxRealtime          
					}
				}
			}
            // Build the Time Signature map and iterate
            this.hub.timeSignatures = _.sortBy(this.hub.timeSignatures, 'realtime')
        }
      
        buildGrid( pIdx: number = 0 ) {
            var song: Song = this.hub.parsed[pIdx]

            if ( _.isEmpty(this.hub.timeSignatures) ) {
                this.extendedParsing()         
            }		        
            // var beats = new Beats(this.self)
            var trackEvents = _.sortBy( _.flatten(song.tracks), ['realTime', 'track', 'sortKey'] );
			for (var e = 0; e < trackEvents.length; e++ ) {
                this.addSignature(trackEvents[e])
            }
            // Handle the last beat
            var lastEntry = trackEvents.length - 1
            if ( lastEntry >= 0 && trackEvents[ trackEvents.length - 1 ].type != 'beat' ) {
                this.addBeatMarker()
            }	
            this.hub.grids[pIdx] =  trackEvents
            writeJsonArr(this.hub.grids[pIdx], "C:\\work\\CxSheet\\resource\\trackEvents.json")
        }
    }
}
