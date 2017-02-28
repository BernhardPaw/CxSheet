/// <reference path="../src/references.ts" />
namespace CxSheet {

    class Sheet {
        constructor ( public hub : CxSheet.DataHub ) {
            
        }

        getDataHub(): DataHub { return this.hub }

        renderHtml(): string {

            return ""
        }
    }

}