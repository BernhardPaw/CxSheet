/// <reference path="../../src/references.ts" />

// import CxSheet = require('../../index.js');

  describe('Testing CxSheet', function () {

/*
     it('CxSheet.MidiReader can normalize a file Path', function () {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var file
        expect(readerInst.ping()).toEqual("MidiReader is alive")
        expect(readerInst.hub.midiInPath).toBeDefined();
        expect(readerInst.hub.parsed).toBeDefined();
        // readerInst.writeJsonFile("../../../../resource/4-Voices.json");
        readerInst.writeJsonFile("../../resource/sultans-of-test.json");
        readerInst.writeFile("../../resource/sultans-of-midi_write.mid");
      });
*/
      it('CxSheet.MidiReader can read a midi file', function () {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        expect(readerInst.ping()).toEqual("MidiReader is alive")
        expect(readerInst.hub.midiInPath).toBeDefined();
        expect(readerInst.hub.parsed[0]).toBeDefined();
        // readerInst.writeJsonFile("../../../../resource/4-Voices.json");
        readerInst.writeJsonFile("C:/work/CxSheet/resource/sultans-of-test.json");
        readerInst.writeFile("C:/work/CxSheet/resource/sultans-of-midi_write.mid");
      });

      it('CxSheet.BarGrid can produce a barGrid', function () {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var dataHub = readerInst.getDataHub()
        var barGrid    = new CxSheet.BarGrid(dataHub)
        for ( var e = 1 ; e < barGrid.hub.grids[0].length ; e++ ) {
            expect(barGrid.hub.grids[0][e].realTime >= barGrid.hub.grids[0][e-1].realTime).toBeTruthy() 
            if ( barGrid.hub.grids[0][e].type == 'noteOn' ) {
              expect((<ChannelNote> barGrid.hub.grids[0][e]).duration).toBeDefined()
              if ( (<ChannelNote> barGrid.hub.grids[0][e]).velocity > 0 ) {
                expect((<ChannelNote> barGrid.hub.grids[0][e]).duration >= 0 ).toBeTruthy()
              }
            }
        }
      });

      it('CxSheet.Analyzer can build ChordTracks', function () {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var dataHub = readerInst.getDataHub()
        var barGrid    = new CxSheet.BarGrid(dataHub)
        var analyzer   = new CxSheet.Analyzer(dataHub)
        expect(analyzer.hub.chordTracksCh.length).toBeGreaterThan(0)
        expect(analyzer.hub.bassTracksCh.length).toBeGreaterThan(0)
        expect(analyzer.hub.drumTracksCh.length).toBeGreaterThan(0)
        //
        var trackList = dataHub.getChordTracks(false)
        expect(trackList.length).toBeGreaterThan(0)
        var trackList2 = dataHub.getChordTracks(true)
        expect(trackList2.length).toBeGreaterThan(trackList.length)
        //
        var data: Array<ChannelNote> =  dataHub.getTrackEvents(trackList)  
        expect(data.length).toBeGreaterThan(0)
        for ( var e = 1 ; e < data.length ; e++ ) {
            expect(data[e].type).toEqual('noteOn')
        }
        // analyzer.groupChordNotes()
      }); 

      it('CxSheet.Normalizer can normalize midi tracks', function () {
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var hub = readerInst.getDataHub()
        var barGrid    = new CxSheet.BarGrid(hub)
        var analyzer   = new CxSheet.Analyzer(hub)
        var normalizer = new CxSheet.Normalizer(hub)
        normalizer.learnSubDivisions()
        expect(normalizer.subDiv.length).toBeGreaterThan(0)
        expect(normalizer.subDivCount.length).toBeGreaterThan(0)
        // normalizer.learnFirstActualBar()

        normalizer.normalizeAllTracks(hub.parsed[0])
       // { text: "normalizeGrid", subDiv: this.subDiv, grid: normGrid }
        expect(normalizer.subDivCount.length).toBeGreaterThan(0)
        // var hub: DataHub = normalizer.getDataHub()
        for (var t = 0; t <  hub.parsed[0].tracks.length ; t++ ) {
            var track:Track = hub.parsed[0].tracks[t]
            var prevEvent   = track[0]
            for ( var e = 1 ; e < track.length ; e++ ) {
                var event     = track[e]
                expect(event.realTime >= prevEvent.realTime).toBeTruthy() 
                expect(event.sortKey).toBeGreaterThan(prevEvent.sortKey)
                expect(event.deltaTime ).toEqual(event.realTime - prevEvent.realTime)
                prevEvent = event
            }
        }
      });
     
  });
