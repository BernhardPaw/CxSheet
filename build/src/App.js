/// <reference path="../src/references.ts" />
var _ = require('lodash');
// var  MidiIO = require('./MidiIO.ts')
var CxSheet;
(function (CxSheet) {
    var App = (function () {
        //  dataHub:    DataHub[]  = []
        // midiIO:     MidiIO[]   = []
        // barGrid:    BarGrid[]  = []
        // idx:        number     = 0
        function App(fileName) {
            if (!_.isEmpty(fileName)) {
                // this.readMidiFile(fileName)
                this.run(fileName);
            }
        }
        App.prototype.run = function (fileName) {
            var midiIO = new CxSheet.MidiIO(fileName);
            var hub = midiIO.getDataHub();
            var barGrid = new CxSheet.BarGrid(hub);
            var normalizer = new CxSheet.Normalizer(hub);
            // var analyzer   = new CxSheet.Analyzer(hub)
            // var trackList  = hub.getChordTracks(true)
            // var data       = hub.getTrackNotes(trackList)
            normalizer.normalizeAllTracks(hub.parsed[0]);
            // barGrid.buildGrid(hub.parsed.length -1)
            // analyzer.sampleChords()
        };
        return App;
    }());
    CxSheet.App = App;
})(CxSheet || (CxSheet = {}));
var myApp = new CxSheet.App("C:/work/CxSheet/resource/sultans-of-swing.mid");
//# sourceMappingURL=App.js.map