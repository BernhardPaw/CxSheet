/// <reference path="../src/references.ts" />

const CxChord = require("cxchord")

namespace CxSheet {

    export class Sheet {
        chordList: Array<MatrixEntry> = []

        constructor ( public hub : CxSheet.DataHub ) {}

        getDataHub(): DataHub { return this.hub }

        renderHtml( barsPerLine ): string {

            return ""
        }


        getChords() { 
            var prevBar:   number = 0
            var prevChord: string = ""
            for(var key in this.hub.matrix ) {
                var chord = this.hub.matrix[key]
                var bar   = Beats.getBar(key)
                if ( ! chord.repeat && ! ( bar == prevBar) ) {
                    var cm =   new CxChord.ChordMatcher()
                    cm.match(chord.notes)
                    var p0 = cm.bayes.getBestPosterior()
                    var chordName = CxChord.getExtName(p0.hypo.key)
                    console.log( key + ":" + chordName )
                }
            }
        }
    }

}