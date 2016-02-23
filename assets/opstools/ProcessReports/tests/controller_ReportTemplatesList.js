// Dependencies
steal(
    "opstools/ProcessReports/controllers/ReportTemplatesList.js",
// Initialization
function(){

    // the div to attach the controller to
    var divID = 'test_ReportTemplatesList';

    // add the div to the window
    var buildHTML = function() {
        var html = [
                    '<div id="'+divID+'">',
                    '</div>'
                    ].join('\n');

        $('body').append($(html));
    }
    

    //Define the unit tests
    describe('testing controller AD.controllers.opstools.ProcessReports.ReportTemplatesList ', function(){

        var testController = null;

        before(function(){

            buildHTML();

            // Initialize the controller
            testController = new AD.controllers.opstools.ProcessReports.ReportTemplatesList($('#'+divID), { some:'data' });

        });



        it('controller definition exists ', function(){
            assert.isDefined(AD.controllers.opstools , ' :=> should have been defined ');
            assert.isDefined(AD.controllers.opstools.ProcessReports , ' :=> should have been defined ');
            assert.isDefined(AD.controllers.opstools.ProcessReports.ReportTemplatesList, ' :=> should have been defined ');
              assert.isNotNull(AD.Control.get('opstools.ProcessReports.ReportTemplatesList'), ' :=> returns our controller. ');
        });


    });


});