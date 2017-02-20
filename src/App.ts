/// <reference path="../src/references.ts" />

var _ = require('lodash');
// var  MidiIO = require('./MidiIO.ts')

namespace CxSheet { 

    export class App {
        dataHub:    DataHub[]  = []
        midiIO:     MidiIO[]   = []
        barGrid:    BarGrid[]  = []
        idx:        number     = 0

        constructor(fileName?: string ) {
            if ( ! _.isEmpty(fileName) ) {
                this.readMidiFile(fileName)
            }
        }

        readMidiFile( fileName: string ) {
            var midi = new MidiIO( fileName )
            this.midiIO.push( midi ) 
            this.barGrid.push( new BarGrid( midi.getDataHub() )) 
            this.idx = this.midiIO.length    
        }
    }
}

var myApp = new CxSheet.App("resource/sultans-of-swing.mid") 