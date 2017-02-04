
/// <reference path="../src/references.ts" />

var _ = require('lodash');

namespace CxSheet { 

    export class Beats {
        // beatsTrack:      (MetaEntry| MetaText)[] = []
        beatsSortKey:       number = 0
        ticksPerBar:        number
        ticksPerBeat:       number 
        prevBeatRealTime:   number = 0
        prevTimeSigRealTime: number
        beatsPerBar:        number
        timeIdx:            number = 0
        // firstBeat:       boolean = true

        constructor( public barGrid: BarGrid, public barCounter: number = 0, public beatCounter: number = 0) {
            // TODO: ticksPerBeat - Check this for e.g. 1/8 and 12/8 
            // Check for and go past more timeSignatures with realTime == 0 entries
            while ( ( this.timeIdx + 1 )  < barGrid.timeSignatures.length &&  barGrid.timeSignatures[this.timeIdx + 1].realTime == 0  ) { 
                this.timeIdx++ 
            }
            this.ticksPerBeat  = barGrid.midi.parsed.header.ticksPerBeat
            this.beatsPerBar   = barGrid.timeSignatures[this.timeIdx].numerator
            this.ticksPerBar   = this.beatsPerBar * this.ticksPerBeat
            this.prevTimeSigRealTime  = barGrid.timeSignatures[this.timeIdx].realTime
        }

        getSignature ( realTime: number = -1 ): string {
            var barCount     = Math.floor(this.beatCounter / this.beatsPerBar)  + 1;
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
       
        addSignature( event: MetaEntry|MetaText|TimeSignature|SetTempo|KeySignature|PortPrefix|ChannelPrefix|Controller|ProgramChange|PitchBend|ChannelNote ) {
            // Check for new beat
            while ( event.realTime >= ( this.prevBeatRealTime + this.ticksPerBeat ) ) {
                this.addBeatMarker()
            }
            event.sortKey   = this.beatsSortKey++
            event.signature = this.getSignature( event.realTime )
            this.barGrid.grid.push( event )
        }

        addBeatMarker() {       
            var nextBeat: number = this.prevBeatRealTime + this.ticksPerBeat
            var event: MetaText = {
                deltaTime:  this.ticksPerBeat,
                type:       'beat',
                realTime:   nextBeat,
                track :     this.barGrid.midi.parsed.tracks.length,
                sortKey:    this.beatsSortKey++,
                meta:       true,
                text:       this.getBeatSignature()
            }
            this.barGrid.bars.push( event )
            this.beatCounter++
            this.prevBeatRealTime += this.ticksPerBeat
        }
    }
   
    export class BarGrid {
        grid: Array< MetaEntry|MetaText|TimeSignature|SetTempo|KeySignature|PortPrefix|ChannelPrefix|Controller|ProgramChange|PitchBend|ChannelNote> = [] 
        bars: Array<MetaText> = []  
        // grid:            BaseEntry[] = []
        maxRealtime:     number = 0
        timeSignatures:  TimeSignature[] = []
        realTimePointer: number = 0
        self = this

        constructor( public midi : CxSheet.MidiIO ) { 
            this.buildGrid()
        }

        extendedParsing() {
            var song = this.midi.parsed
	        for (var t = 0; t < song.tracks.length; t++ ) {
				if (song.tracks[t].length > 0) {
                    // Loop through track
					for (var e = 0; e < song.tracks[t].length; e++) { 
                        song.tracks[t][e].track    = t                       
                        song.tracks[t][e].realTime = e == 0 ? song.tracks[t][e].deltaTime : song.tracks[t][e].deltaTime + song.tracks[t][e - 1].realTime
                        song.tracks[t][e].sortKey  = e
                        if ( song.tracks[t][e].type == "timeSignature" ) {
                            this.timeSignatures.push( <TimeSignature> song.tracks[0][e] )
                        } 
                        this.maxRealtime =  song.tracks[t][e].realTime > this.maxRealtime ? song.tracks[t][e].realTime : this.maxRealtime          
					}
				}
			}
            // Build the Time Signature map and iterate
            this.timeSignatures = _.sortBy(this.timeSignatures, 'realtime')
        }
      
        buildGrid() {
            var song = this.midi.parsed
            if ( _.isEmpty(this.timeSignatures) ) {
                this.extendedParsing()         
            }		        

            var beats = new Beats(this.self)
            var trackEvents: any[] = _.sortBy( _.flatten(song.tracks), ['realTime', 'track', 'sortKey'] );
            this.writeJsonFile(trackEvents, "C:\\work\\CxSheet\\resource\\trackEvents.json")
			for (var e = 0; e < trackEvents.length; e++ ) {
                beats.addSignature(trackEvents[e])
            }
            var lastEntry = this.grid.length - 1
            if ( lastEntry >= 0 && this.grid[ this.grid.length - 1 ].type != 'beat' ) {
                beats.addBeatMarker()
            }	
        }

        writeJsonFile(arr: any[], _jsonOutPath: string = "") {
            var jsonOutPath = _jsonOutPath.match(/^$/) ? this.midi.getOutFilePath(_jsonOutPath) : this.midi.normalizePath(_jsonOutPath)
            // Note that the output is simply an array of byte values.  writeFileSync wants a buffer, so this will convert accordingly.
            // Using native Javascript arrays makes the code portable to the browser or non-node environments
            var outputBuffer = new Buffer(JSON.stringify(arr, null, '  ')) 
            // Write to a new MIDI file.  it should match the original
            nodeFs.writeFileSync(jsonOutPath, outputBuffer)
        }
    }
}