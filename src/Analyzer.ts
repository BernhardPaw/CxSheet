/// <reference path="../src/references.ts" />

namespace CxSheet { 

    export class Zone {        
        constructor( public spread ) { }
    }
   
    export class Analyzer {
        programChanges: Array<ProgramChange> = []

        constructor( public barGrid : CxSheet.BarGrid, public spread:number ) { }

        groupPrograms( program: number) {

            this.programChanges = _.sortBy( _.filter(this.barGrid.grid, { "type": "programChange" } ), ['realTime', 'track', 'sortKey'] )
            
            for( var e = 0 ; e < this.programChanges.length; e++ ) {
                var p =  this.programChanges[e].programNumber
                if ( ( p > 0 && p < 33 ) || ( p > 40 && p < 113 ) ) {
                    this.programChanges[e].programType = ProgramType.chords
                }
                else if ( ( p > 32 && p < 41 )  ) {
                    this.programChanges[e].programType = ProgramType.bass
                }
                else {
                    this.programChanges[e].programType = ProgramType.drums
                }
            }
        }

        groupMidiNotes( ) {


        }
    }
}