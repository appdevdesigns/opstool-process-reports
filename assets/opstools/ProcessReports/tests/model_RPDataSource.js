// Dependencies
steal(
    "opstools/ProcessReports/models/RPDataSource.js",
// Initialization
function(){


    //Define the unit tests
    describe('testing model AD.models.opstools.ProcessReports.RPDataSource ', function(){


        before(function(){


        });


        it('model definition exists ', function(){
            assert.isDefined(AD.models.opstools , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.ProcessReports , ' :=> should have been defined ');
            assert.isDefined(AD.models.opstools.ProcessReports.RPDataSource, ' :=> should have been defined ');
               assert.isNotNull(AD.Model.get("opstools.ProcessReports.RPDataSource"), ' :=> did not return null');
        });

    });


});