/// <reference path="../../src/references.ts" />

describe('Testing CxSheet', function () {

/*
     it('CxSheet.MidiReader can normalize a file Path', function () {
        var midiIO = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var file
        expect(midiIO.ping()).toEqual("MidiReader is alive")
        expect(midiIO.hub.midiInPath).toBeDefined();
        expect(midiIO.hub.parsed).toBeDefined();
        // midiIO.writeJsonFile("../../../../resource/4-Voices.json");
        midiIO.writeJsonFile("../../resource/sultans-of-test.json");
        midiIO.writeFile("../../resource/sultans-of-midi_write.mid");
      });
*/
      it('CxSheet.MidiReader can read a midi file', function () {
        var hub = new CxSheet.DataHub()
        var midiIO = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid", "", hub)
        //  midiIO.getDataHub()
        expect(midiIO.ping()).toEqual("MidiReader is alive")
        expect(midiIO.hub.midiInPath).toBeDefined();
        expect(midiIO.hub.parsed[0]).toBeDefined();
        // midiIO.writeJsonFile("../../../../resource/4-Voices.json");
        midiIO.writeJsonFile("C:/work/CxSheet/resource/sultans-of-test.json");
        midiIO.writeFile("C:/work/CxSheet/resource/sultans-of-midi_write.mid");
      });

      it('CxSheet.BarGrid can produce a barGrid', function () {
        var midiIO = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid")
        var hub = midiIO.getDataHub()
        var barGrid    = new CxSheet.BarGrid(hub)
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

       it('CxSheet.Normalizer can learn learn SubDivisions', function () {
            var midiIO     = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid")
            var hub        = midiIO.getDataHub()
            var barGrid    = new CxSheet.BarGrid(hub)
            var normalizer = new CxSheet.Normalizer(hub)
            for (var t = 0 ; t < hub.timeSignatures.length; t++ ) {
                expect(hub.timeSignatures[t]).not.toBeUndefined()
            }
            normalizer.learnSubDivisions() 
            expect(normalizer.subDiv.length).toBeGreaterThan(4)
            expect(hub.timeSignatures.length).toBeGreaterThan(0)
            expect(hub.subDivCount.length).toBeGreaterThan(0)
            for (var s = 0 ; s < hub.subDivCount.length; s++ ) {
                for (var e = 0 ; e < hub.subDivCount[s].length; e++ ) {
                     expect(hub.subDivCount[s][e]).not.toBeUndefined()
                     // expect(_.sum(hub.subDivCount[s][e])).toBeGreaterThan(0)
                }
            }
      });

      it('CxSheet.DataHub can find Drum and Chords Tracks', function () {
            var midiIO     = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid")
            var hub        = midiIO.getDataHub()
            var barGrid    = new CxSheet.BarGrid(hub)
            var normalizer = new CxSheet.Normalizer(hub)
            //normalizer.learnSubDivisions() 
            expect(hub.subDivCount.length).toBeGreaterThan(0)
            expect(hub.timeSignatures.length).toBeGreaterThan(0)
            // for (var t = 0 ; t < hub.timeSignatures.length; t++ ) {
            expect(hub.chordTracksCh.length).toBeGreaterThan(0)
            expect(hub.bassTracksCh.length).toBeGreaterThan(0)
            expect(hub.drumTracksCh.length).toBeGreaterThan(0)
      });
    
      it('CxSheet.DataHub can extract Chords with Bass Events', function () {
            var midiIO     = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid")
            var hub        = midiIO.getDataHub()
            var barGrid    = new CxSheet.BarGrid(hub)
            var normalizer = new CxSheet.Normalizer(hub)
            var trackList  = hub.getChordTracks(true)
            expect(trackList.length).toBeGreaterThan(0)

            var data       = hub.getTrackNotes(trackList) 
            expect(data.length).toBeGreaterThan(0)

            for( var e = 0; e < data.length ; e++ ) {
                expect(data[e]).not.toBeUndefined()
                expect(data[e].sigIdx).not.toBeUndefined()
            }

      });

      it('CxSheet.DataHub can extract Chords NO Bass Events', function () {
            var midiIO     = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid")
            var hub        = midiIO.getDataHub()
            var barGrid    = new CxSheet.BarGrid(hub)
            var normalizer = new CxSheet.Normalizer(hub)
            var trackList  = hub.getChordTracks(false)
            var data       = hub.getTrackNotes(trackList) 
            expect(data.length).toBeGreaterThan(0)
            for( var e = 0; e < data.length ; e++ ) {
                expect(data[e]).not.toBeUndefined()
            }
      });
   
      it('CxSheet.DataHub can extract Drum Events', function () {
            var midiIO     = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid")
            var hub        = midiIO.getDataHub()
            var barGrid    = new CxSheet.BarGrid(hub)
            var normalizer = new CxSheet.Normalizer(hub)
            var trackList  = hub.getDrumTracks()
            var data       = hub.getTrackNotes(trackList) 
            expect(data.length).toBeGreaterThan(0)
            for( var e = 0; e < data.length ; e++ ) {
                expect(data[e]).not.toBeUndefined()
            }
      });

      it('CxSheet.Normalizer can normalize midi tracks', function () {
          var midiIO     = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
          var hub        = midiIO.getDataHub()
          var barGrid    = new CxSheet.BarGrid(hub)
          var normalizer = new CxSheet.Normalizer(hub)
          // normalizer.learnSubDivisions()
          expect(hub.subDivCount.length).toBeGreaterThan(0)
        
          normalizer.normalizeAllTracks(hub.parsed[0])
          expect(hub.parsed[1]).not.toBeUndefined()
          expect(hub.parsed[1].tracks).not.toBeUndefined()
          expect(hub.parsed[1].tracks.length).toEqual(hub.parsed[0].tracks.length)
          for (var t = 0; t <  hub.parsed[0].tracks.length ; t++ ) {
            expect(hub.parsed[1].tracks[t].length).toEqual(hub.parsed[0].tracks[t].length)
          }

          for (t = 0; t <  hub.parsed[1].tracks.length ; t++ ) {
              var track:Track = hub.parsed[1].tracks[t]
              for ( var e = 1 ; e < track.length ; e++ ) {
                  var event     = track[e]
                  expect(event.realTime >= track[e-1].realTime).toBeTruthy() 
                  expect(event.sortKey).toBeGreaterThan(track[e-1].sortKey)
                  expect(event.deltaTime ).toEqual(event.realTime - track[e-1].realTime)
              }
          }
      });

      it('CxSheet.Analyzer can group Chord Notes', function () {
          var midiIO    = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
          var hub       = midiIO.getDataHub()
          var barGrid   = new CxSheet.BarGrid(hub)
          var normalizer = new CxSheet.Normalizer(hub)
          normalizer.normalizeAllTracks(hub.parsed[0])
          barGrid.buildGrid(hub.parsed.length -1)

          var trackList = hub.getChordTracks(true)
          expect(trackList.length).toBeGreaterThan(0)
          var data =  hub.getTrackNotes(trackList, 1) 
          expect(data.length).toBeGreaterThan(0)

          for ( var e = 0 ; e < data.length ; e++ ) {
                expect(data[e].type).toEqual('noteOn')
          }   
          var analyzer = new CxSheet.Analyzer(hub)
          analyzer.sampleChords()
          expect(Object.keys(analyzer.matrix).length).toBeGreaterThan(0)
      }); 

      it('CxSheet.Analyzer can merge Chord Notes', function () {
          var midiIO    = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
          var hub       = midiIO.getDataHub()
          var barGrid   = new CxSheet.BarGrid(hub)
          var normalizer = new CxSheet.Normalizer(hub)
          normalizer.normalizeAllTracks(hub.parsed[0])
          var analyzer = new CxSheet.Analyzer(hub)
          analyzer.sampleChords()
          expect(Object.keys(analyzer.matrix).length).toBeGreaterThan(0)
      }); 

  });
