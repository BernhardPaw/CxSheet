/// <reference path="../src/references.ts" />

namespace CxSheet { 

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
        // grid:           Array< ChannelNote|MetaEntry|MetaText|TimeSignature|SetTempo|KeySignature|PortPrefix|ChannelPrefix|Controller|ProgramChange|PitchBend> = []   
        grids:          TrackArr   = []
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

        constructor() { }
  
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

        getTrackEvents( tracks: Array<number>, pIdx: number = 0 ): Array<ChannelNote> {
            var events = _.sortBy( 
                            _.filter(this.grids[pIdx], 
                                function(e) {
                                    return (tracks.indexOf(e.track) > -1 && e.type == 'noteOn' ) 
                                }) 
                            , ['sortKey', 'realTime', 'track'] 
                        ) 
            return events
        }


    }




    /*
    export class Singleton {
        //
        // Shared Data
        //   
        public parsed: Song 

        private static _instance:Singleton = new Singleton()

        constructor() {
            if(Singleton._instance){
                throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
            }
            Singleton._instance = this;
        }

        public static getInstance(): Singleton {
            return Singleton._instance
        }
    }
    */
}