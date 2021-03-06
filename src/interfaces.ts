//
// App Interface 
//
interface AnalyzeChord {
 

}

interface Analyze {
        
}

//
// Midi Interfaces
//
interface BaseEntry {
      deltaTime:      number,
      deltaNorm?:     number,
      type:           string,
      realTime?:      number,
      realNorm?:      number,
      track?:         number,
      sortKey?:       number,
      signature?:     string,
      signaNorm?:     string,
      sigIdx?:        number
} 

interface MetaEntry extends BaseEntry {
       meta: boolean
} 

interface MetaText extends MetaEntry {
        text: string
}

interface TimeSignature extends MetaEntry {
        numerator:      number,
        denominator:    number,
        metronome:      number,
        thirtyseconds:  number,
        granularity?:   number  // smallest subdivision of the beat
}

interface Tempo extends MetaEntry {        
        microsecondsPerBeat: number
}

interface KeySignature extends MetaEntry {
        key:   number,
        scale: number
}

interface PortPrefix extends MetaEntry {
        port: number
}

interface ChannelPrefix extends MetaEntry {
        channel: number
}

interface Controller extends BaseEntry {
        channel:        number,     
        controllerType: number,
        value:          number
}

enum ProgramType { 'chords', 'bass', 'drums' }

interface ProgramChange extends BaseEntry {      
        programNumber: number,
        programType: ProgramType 
}

type ProgramChanges = Array<ProgramChange>

interface PitchBend extends BaseEntry {
        value: number
}

interface ChannelNote extends BaseEntry {
        channel:    number,
        type:       string,
        noteNumber: number,
        velocity:   number,
        duration?:  number,
        overlaps?:  number
}

type MidiEvent  = BaseEntry|MetaEntry|MetaText|TimeSignature|Tempo|KeySignature|PortPrefix|ChannelPrefix|Controller|ProgramChange|PitchBend|ChannelNote
type Track    = Array<MidiEvent>
type TrackArr = Array<Track>

interface Song {
        header: {
        format:       number,
        numTracks:    number,
        ticksPerBeat: number,
        },
        tracks: TrackArr
}  

type SongArr = Array<Song>

interface Grid {
        text:   string,
        subDiv: number[],
        grid:   Track            
}

interface MatrixEntry {
        realTime: number, 
        index:    number, 
        duration: number, 
        notes:    number[],
        repeat?:  boolean
} 

interface Matrix { [id: string] : MatrixEntry }