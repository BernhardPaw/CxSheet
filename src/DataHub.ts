/// <reference path="../src/references.ts" />

namespace CxSheet { 

    export class Config {
        //
        // Configuration Parameters
        //   
        static sampleBeatDivision:  number = 2
        static overlapLookBack:     number = 10    
        //
        // Singleton logic
        //
        private static _instance: Config = new Config()

        constructor() {
            if(Config._instance){
                throw new Error("Error: Instantiation failed: Use Config.getInstance() instead of new.");
            }
            Config._instance = this;
        }

        public static getInstance(): Config {
            return Config._instance
        }
    }

    export class DataHub {
        //
        // Midi Data
        //
        midiInPath:  string
        midiOutPath: string
        jsonOutPath: string   
        parsed:      SongArr = []
        //
        // BarGrid Data
        // 
        grids:          TrackArr        = []
        timeSignatures: TimeSignature[] = []
        bars:           Array<MetaText> = [] 
        //
        // Analyzer Data
        // 
        // Track identification based on Program Changes
        //
        programChanges: Array<ProgramChange>
        chordTracksCh:  Array<ProgramChange> 
        bassTracksCh:   Array<ProgramChange>
        drumTracksCh:   Array<ProgramChange>
        //
        // Result of beat subdivisions by time timeSignatures learned from drumtracks
        //
        subDivCount:    number[][] = []

        constructor() {}

        getSampleRate (idx: number ) {
            var    sampleRate = _.inRange(idx, 0, this.subDivCount.length) ? this.subDivCount[idx].length : this.subDivCount[0].length  
            return sampleRate
        }
  
        getChordTracks ( includeBass:boolean = true ): number[] {
            var data = this.chordTracksCh
            var tracks: number[] = []
            if ( includeBass ) {
                data = _.concat( this.chordTracksCh, this.bassTracksCh )
            }
            for (var i = 0 ; i < data.length ; i++) {
               tracks.push(data[i].track)
            }
            return _.uniq(tracks).sort()
        }

        getDrumTracks (): number[] {
            var data = this.drumTracksCh
            var tracks: number[] = []
            for (var i = 0 ; i < data.length ; i++) {
               tracks.push(data[i].track)
            }
            return _.uniq(tracks).sort()
        }

        getTrackNotes( trackList: Array<number>, pIdx: number = 0 ): Array<ChannelNote> {
            var trackEvents: Array<MidiEvent> = []
            for( var t = 0; t < trackList.length; t++ ) {
               // console.log("this.parsed[" + pIdx + "].tracks[trackList[" + t + "]].length:" +  this.parsed[pIdx].tracks[trackList[t]].length)
               trackEvents = _.concat( trackEvents, this.parsed[pIdx].tracks[trackList[t]] )
            }
            // console.log("Final trackEvents.length:" +  trackEvents.length)
            var events: Array<ChannelNote> = _.sortBy( _.filter(trackEvents, 
                                                        function(e) {
                                                            return ( e.type == 'noteOn' && (<ChannelNote> e).velocity > 0 ) 
                                                        }) 
                                                    , ['sortKey', 'realTime', 'track'] 
                                                ) 
            return events
        }

        getEventsByType( _type: string, pIdx: number = 0 ): Array<MidiEvent>  {
            var events: Array<MidiEvent> = _.sortBy( _.filter( _.flatten( this.parsed[pIdx].tracks ),
                                                function(e) {
                                                    return ( e.type == _type ) 
                                                }) 
                                                , ['sortKey', 'realTime', 'track'] 
                                            )
            return events
        }

        getAllEvents( pIdx: number = 0 ): Array<MidiEvent>  {
            var events: Array<MidiEvent> = _.sortBy( _.flatten( this.parsed[pIdx].tracks ), ['sortKey', 'realTime', 'track'] )
            return events
        }
    }
}