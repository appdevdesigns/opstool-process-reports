// Dependencies
steal(
    "opstools/opstool-process-reports/models/RPReportTemplate.js",
// Initialization
function(){


    //Define the unit tests
    describe('testing model AD.models.opstools.ProcessReports.RPReportTemplate ', function(){


        before(function(){


        });


        it('model definition exists ', function(){
            assert.isDefined(AD.models.opstools , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.opstool-process-reports , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.opstool-process-reports.RPReportTemplate, ' :=> should have been defined ');
               assert.isNotNull(AD.Model.get("opstools.opstool-process-reports.RPReportTemplate"), ' :=> did not return null');
        });

    });


});