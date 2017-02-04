/// <reference path="../src/references.ts" />
var _ = require('lodash');
// var  MidiIO = require('./MidiIO.ts')
var CxSheet;
(function (CxSheet) {
    var App = (function () {
        function App(fileName) {
            this.midiIO = [];
            this.barGrid = [];
            this.fileCount = 0;
            if (!_.isEmpty(fileName)) {
                this.readMidiFile(fileName);
            }
        }
        App.prototype.readMidiFile = function (fileName) {
            var midi = new CxSheet.MidiIO(fileName);
            this.midiIO.push(midi);
            this.barGrid.push(new CxSheet.BarGrid(midi));
            this.fileCount = this.midiIO.length;
        };
        return App;
    }());
    CxSheet.App = App;
})(CxSheet || (CxSheet = {}));
var myApp = new CxSheet.App("../../resource/sultans-of-swing.mid");
//# sourceMappingURL=App.js.map