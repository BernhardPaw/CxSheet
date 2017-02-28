/// <reference path="../src/references.ts" />
var CxSheet;
(function (CxSheet) {
    var Config = (function () {
        function Config() {
            if (Config._instance) {
                throw new Error("Error: Instantiation failed: Use Config.getInstance() instead of new.");
            }
            Config._instance = this;
        }
        Config.getInstance = function () {
            return Config._instance;
        };
        return Config;
    }());
    //
    // Configuration Parameters
    //   
    Config.sampleBeatDivision = 2;
    Config.overlapLookBack = 10;
    //
    // Singleton logic
    //
    Config._instance = new Config();
    CxSheet.Config = Config;
    var DataHub = (function () {
        function DataHub() {
            this.parsed = [];
            //
            // BarGrid Data
            // 
            this.grids = [];
            this.timeSignatures = [];
            this.bars = [];
            //
            // Result of beat subdivisions by time timeSignatures learned from drumtracks
            //
            this.subDivCount = [];
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
        DataHub.prototype.getTrackNotes = function (trackList, pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var trackEvents = [];
            for (var t = 0; t < trackList.length; t++) {
                // console.log("this.parsed[" + pIdx + "].tracks[trackList[" + t + "]].length:" +  this.parsed[pIdx].tracks[trackList[t]].length)
                trackEvents = _.concat(trackEvents, this.parsed[pIdx].tracks[trackList[t]]);
            }
            // console.log("Final trackEvents.length:" +  trackEvents.length)
            var events = _.sortBy(_.filter(trackEvents, function (e) {
                return (e.type == 'noteOn' && e.velocity > 0);
            }), ['sortKey', 'realTime', 'track']);
            return events;
        };
        DataHub.prototype.getEventsByType = function (_type, pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var events = _.sortBy(_.filter(_.flatten(this.parsed[pIdx].tracks), function (e) {
                return (e.type == _type);
            }), ['sortKey', 'realTime', 'track']);
            return events;
        };
        DataHub.prototype.getAllEvents = function (pIdx) {
            if (pIdx === void 0) { pIdx = 0; }
            var events = _.sortBy(_.flatten(this.parsed[pIdx].tracks), ['sortKey', 'realTime', 'track']);
            return events;
        };
        return DataHub;
    }());
    CxSheet.DataHub = DataHub;
})(CxSheet || (CxSheet = {}));
//# sourceMappingURL=DataHub.js.map