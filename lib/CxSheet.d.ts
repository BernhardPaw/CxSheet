/// <reference path="../node_modules/@types/node/index.d.ts" />
/// <reference path="../node_modules/@types/lodash/index.d.ts" />
/// <reference path="../node_modules/@types/jasmine/index.d.ts" />
interface AnalyzeChord {
}
interface Analyze {
}
interface BaseEntry {
    deltaTime: number;
    deltaNorm?: number;
    type: string;
    realTime?: number;
    realNorm?: number;
    track?: number;
    sortKey?: number;
    signature?: string;
    signaNorm?: string;
    sigIdx?: number;
}
interface MetaEntry extends BaseEntry {
    meta: boolean;
}
interface MetaText extends MetaEntry {
    text: string;
}
interface TimeSignature extends MetaEntry {
    numerator: number;
    denominator: number;
    metronome: number;
    thirtyseconds: number;
    granularity?: number;
}
interface Tempo extends MetaEntry {
    microsecondsPerBeat: number;
}
interface KeySignature extends MetaEntry {
    key: number;
    scale: number;
}
interface PortPrefix extends MetaEntry {
    port: number;
}
interface ChannelPrefix extends MetaEntry {
    channel: number;
}
interface Controller extends BaseEntry {
    channel: number;
    controllerType: number;
    value: number;
}
declare enum ProgramType {
    'chords' = 0,
    'bass' = 1,
    'drums' = 2,
}
interface ProgramChange extends BaseEntry {
    programNumber: number;
    programType: ProgramType;
}
declare type ProgramChanges = Array<ProgramChange>;
interface PitchBend extends BaseEntry {
    value: number;
}
interface ChannelNote extends BaseEntry {
    channel: number;
    type: string;
    noteNumber: number;
    velocity: number;
    duration?: number;
    overlaps?: number;
}
declare type MidiEvent = BaseEntry | MetaEntry | MetaText | TimeSignature | Tempo | KeySignature | PortPrefix | ChannelPrefix | Controller | ProgramChange | PitchBend | ChannelNote;
declare type Track = Array<MidiEvent>;
declare type TrackArr = Array<Track>;
interface Song {
    header: {
        format: number;
        numTracks: number;
        ticksPerBeat: number;
    };
    tracks: TrackArr;
}
declare type SongArr = Array<Song>;
interface Grid {
    text: string;
    subDiv: number[];
    grid: Track;
}
interface MatrixEntry {
    realTime: number;
    index: number;
    duration: number;
    notes: number[];
    repeat?: boolean;
}
interface Matrix {
    [id: string]: MatrixEntry;
}
declare const cxMidi: any;
declare const fs: any;
declare const path: any;
declare var stringify: any;
declare namespace CxSheet {
    function normalizePath(_path: string): any;
    function getOutFilePath(_outFile: string, _ext?: string): string;
    function writeJsonArr(arr: any[], _jsonOutPath?: string): void;
    function writeJson(map: any, _jsonOutPath?: string): void;
    class MidiIO {
        hub: DataHub;
        constructor(_midiInPath: string, _midiOutName?: string, _hub?: DataHub);
        getDataHub(): DataHub;
        readFile(parsedIdx?: number): void;
        writeFile(_midiOutPath?: string, parsedIdx?: number): void;
        writeJsonFile(_jsonOutPath?: string, parsedIdx?: number): void;
        ping(): string;
    }
}
declare var _: any;
declare var stringify: any;
declare namespace CxSheet {
    class Beats {
        hub: CxSheet.DataHub;
        beatCounter: number;
        beatsSortKey: number;
        ticksPerBar: number;
        ticksPerBeat: number;
        prevBeatRealTime: number;
        beatsPerBar: number;
        timeIdx: number;
        constructor(hub: CxSheet.DataHub, beatCounter?: number);
        static getTicks(signature: string): number;
        static getBeat(signature: string): number;
        static getBar(signature: string): number;
        static setTicks(signature: string, ticks: number): string;
        static setSignature(barCount: number, beatCount: number, _ticks: number): string;
        checkResolution(realTime: number): void;
        setResolution(pIdx?: number): void;
        getSignature(realTime?: number): string;
        getBeatSignature(): string;
        addSignature(event: MidiEvent): void;
        addBeatMarker(pIdx?: number): void;
    }
    class BarGrid extends Beats {
        hub: CxSheet.DataHub;
        maxRealtime: number;
        minDuration: number;
        realTimePointer: number;
        constructor(hub: CxSheet.DataHub);
        setDuration(t: number, e: number, pIdx?: number): void;
        extendedParsing(pIdx?: number): void;
        groupPrograms(pIdx?: number): void;
        buildGrid(pIdx?: number): void;
    }
}
declare namespace CxSheet {
    class Normalizer {
        hub: CxSheet.DataHub;
        subDiv: number[];
        maxTicks: number;
        constructor(hub: CxSheet.DataHub);
        getTicksDiff(event: BaseEntry): number;
        getClosestIdx(ticks: number, _len?: number): number;
        setNormalizedVal(event: BaseEntry, _len?: number): number;
        learnSubDivisions(divisionOfBeat?: number, pIdx?: number): void;
        normalizeAllTracks(_song?: Song): void;
        normalizeTrack(_track: Track): any;
        learnFirstActualBar(pIdx?: number): void;
    }
}
declare namespace CxSheet {
    class Analyzer {
        hub: CxSheet.DataHub;
        noteEvents: Array<ChannelNote>;
        tempo: Array<Tempo>;
        matrix: Matrix;
        matrixIndex: string[];
        constructor(hub: CxSheet.DataHub);
        getDataHub(): DataHub;
        getTempo(pIdx?: number, realTime?: number): number;
        cleanUpArr(_tones: number[]): number[];
        mergeSamples(): void;
        getTicksPerSample(sigIdx: number): number;
        sampleChords(pIdx?: number, includeBass?: boolean): void;
        getChords(): void;
    }
}
declare const CxChord: any;
declare namespace CxSheet {
    class Sheet {
        hub: CxSheet.DataHub;
        chordList: Array<MatrixEntry>;
        constructor(hub: CxSheet.DataHub);
        getDataHub(): DataHub;
        renderHtml(barsPerLine: any): string;
        getChords(): void;
    }
}
declare var _: any;
declare namespace CxSheet {
    class App {
        constructor(fileName?: string);
        run(fileName: string): void;
    }
}
declare namespace CxSheet {
    class Config {
        static sampleBeatDivision: number;
        static overlapLookBack: number;
        private static _instance;
        constructor();
        static getInstance(): Config;
    }
    class DataHub {
        midiInPath: string;
        midiOutPath: string;
        jsonOutPath: string;
        parsed: SongArr;
        grids: TrackArr;
        timeSignatures: TimeSignature[];
        bars: Array<MetaText>;
        programChanges: Array<ProgramChange>;
        chordTracksCh: Array<ProgramChange>;
        bassTracksCh: Array<ProgramChange>;
        drumTracksCh: Array<ProgramChange>;
        subDivCount: number[][];
        matrix: Matrix;
        constructor();
        getSampleRate(idx: number): number;
        getChordTracks(includeBass?: boolean): number[];
        getDrumTracks(): number[];
        getTrackNotes(trackList: Array<number>, pIdx?: number): Array<ChannelNote>;
        getEventsByType(_type: string, pIdx?: number): Array<MidiEvent>;
        getAllEvents(pIdx?: number): Array<MidiEvent>;
    }
}
