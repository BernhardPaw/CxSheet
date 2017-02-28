/// <reference path="../src/references.ts" />

var _ = require('lodash');
// var  MidiIO = require('./MidiIO.ts')

namespace CxSheet { 

    export class App {
        //  dataHub:    DataHub[]  = []
        // midiIO:     MidiIO[]   = []
        // barGrid:    BarGrid[]  = []
        // idx:        number     = 0

        constructor(fileName?: string ) {
            if ( ! _.isEmpty(fileName) ) {
                // this.readMidiFile(fileName)
                this.run(fileName)
            }
        }
  
        run( fileName: string ) {
            var midiIO = new CxSheet.MidiIO(fileName);
            var hub        = midiIO.getDataHub()
            var barGrid    = new CxSheet.BarGrid(hub)
            var normalizer = new CxSheet.Normalizer(hub)
            // var analyzer   = new CxSheet.Analyzer(hub)
            // var trackList  = hub.getChordTracks(true)
            // var data       = hub.getTrackNotes(trackList)
            normalizer.normalizeAllTracks(hub.parsed[0])
            // barGrid.buildGrid(hub.parsed.length -1)
            // analyzer.sampleChords()
        }
    }
}

var myApp = new CxSheet.App("C:/work/CxSheet/resource/sultans-of-swing.mid") 