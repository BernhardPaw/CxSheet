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
            normalizer.normalizeAllTracks(hub.parsed[0])  
            var analyzer = new CxSheet.Analyzer(hub)
            analyzer.sampleChords()
            var sheet      = new CxSheet.Sheet(hub)
            sheet.getChords()
        }
    }
}

// var myApp = new CxSheet.App("C:/work/CxSheet/resource/sultans-of-swing.mid") 