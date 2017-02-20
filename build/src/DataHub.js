/// <reference path="../src/references.ts" />
var CxSheet;
(function (CxSheet) {
    var DataHub = (function () {
        function DataHub() {
            this.parsed = [];
            //
            // BarGrid Data
            // 
            // grid:           Array< ChannelNote|MetaEntry|MetaText|TimeSignature|SetTempo|KeySignature|PortPrefix|ChannelPrefix|Controller|ProgramChange|PitchBend> = []   
            this.grids = [];
            this.timeSignatures = [];
            this.bars = [];
        }
        DataHub.prototype.getChordTracks = function (includeBass) {
            if (includeBass === void 0) { includeBass = true; }
            var data = this.chordTracksCh;
            var tracks = [];
            if (includeBass) {
                data = _.concat(this.chordTracksCh, this.bassTracksCh);
            }
            for (var i = 0; i < data.length; i++) {
                tracks.push(data[i].track);
            }
            return _.uniq(tracks).sort();
        };
        DataHub.prototype.getDrumTracks = function () {
            var data = this.drumTracksCh;
            var tracks = [];
            for (var i = 0; i < data.length; i++) {
                tracks.push(data[i].track);
            }
            return _.uniq(tracks).sort();
        };
        DataHub.prototype.getTrackEvents = function (tracks, pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var events = _.sortBy(_.filter(this.grids[pIdx], function (e) {
                return (tracks.indexOf(e.track) > -1 && e.type == 'noteOn');
            }), ['sortKey', 'realTime', 'track']);
            return events;
        };
        return DataHub;
    }());
    CxSheet.DataHub = DataHub;
    /*
    export class Singleton {
        //
        // Shared Data
        //
        public parsed: Song

        private static _instance:Singleton = new Singleton()

        constructor() {
            if(Singleton._instance){
                throw new Error("Error: Instantiation failed: Use SingletonClass.getInstance() instead of new.");
            }
            Singleton._instance = this;
        }

        public static getInstance(): Singleton {
            return Singleton._instance
        }
    }
    */
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=DataHub.js.map