/// <reference path="../../src/references.ts" />

// var csx = require('./index.js');

  describe('Testing CxSheet', function () {

      it('CxSheet.MidiReader can read a midi file', function () {
        // var readerInst = new CxSheet.MidiReader("../../../../resource/4-Voices_Minor_3-4_IVm6_-III6A_IVm_-VImaj7-5_UU_222_13.mid");
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        expect(readerInst.ping()).toEqual("MidiReader is alive")
        expect(readerInst.midiInPath).toBeDefined();
        expect(readerInst.parsed).toBeDefined();
        // readerInst.writeJsonFile("../../../../resource/4-Voices.json");
        readerInst.writeJsonFile("C:/work/CxSheet/resource/sultans-of-swing.json");
      });

      it('CxSheet.BarGrid can produce a barGrid', function () {
        // var readerInst = new CxSheet.MidiReader("../../../../resource/4-Voices_Minor_3-4_IVm6_-III6A_IVm_-VImaj7-5_UU_222_13.mid");
        var readerInst = new CxSheet.MidiIO("C:/work/CxSheet/resource/sultans-of-swing.mid");
        var barGrid    = new CxSheet.BarGrid(readerInst)
        expect(barGrid.maxRealtime).toBeGreaterThan(0)
        expect(barGrid.grid.length).toBeGreaterThan(0)
         barGrid.writeJsonFile(barGrid.grid, "C:/work/CxSheet/resource/sultans-of-list.json");
        for ( var e = 1 ; e < barGrid.grid.length ; e++ ) {
            expect(barGrid.grid[e].realTime >= barGrid.grid[e-1].realTime).toBeTruthy()
        }
        barGrid.writeJsonFile(barGrid.grid, "C:/work/CxSheet/resource/sultans-of-list.json");
      }); 
  });
