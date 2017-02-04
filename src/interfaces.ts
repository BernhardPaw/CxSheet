//
// App Interface 
//

//
// Midi Interfaces
//
interface BaseEntry {
      deltaTime:      number,
      type:           string,
      realTime?:      number,
      track?:         number,
      sortKey?:       number,
      signature?:     string
} 

interface MetaEntry extends BaseEntry {
       meta: boolean
} 

interface MetaText extends MetaEntry {
        text: string
}

interface TimeSignature extends MetaEntry {
        numerator: number,
        denominator: number,
        metronome: number,
        thirtyseconds: number
}

interface SetTempo extends MetaEntry {        
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

interface PitchBend extends BaseEntry {
        value: number
}

interface ChannelNote extends BaseEntry {
        channel:   number,
        type:      string,
        noteNumber: number,
        velocity:   number
}

/*
interface Event {
        event: MetaEntry | MetaText | TimeSignature | SetTempo | KeySignature | PortPrefix | ChannelPrefix | Controller | ProgramChange | PitchBend | ChannelNote
}

interface Track {
        track: Array< MetaEntry | MetaText | TimeSignature | SetTempo | KeySignature | PortPrefix | ChannelPrefix | Controller | ProgramChange | PitchBend | ChannelNote  >
}
*/ 

interface Song {
        header: {
        format:       number,
        numTracks:    number,
        ticksPerBeat: number,
        },
        tracks: Array< Array< MetaEntry | MetaText | TimeSignature | SetTempo | KeySignature | PortPrefix | ChannelPrefix | Controller | ProgramChange | PitchBend | ChannelNote  > >
}  



