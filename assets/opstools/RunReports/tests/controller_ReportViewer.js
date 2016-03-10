// Dependencies
steal(
    "opstools/RunReports/controllers/ReportViewer.js",
// Initialization
function(){

    // the div to attach the controller to
    var divID = 'test_ReportViewer';

    // add the div to the window
    var buildHTML = function() {
        var html = [
                    '<div id="'+divID+'">',
                    '</div>'
                    ].join('\n');

        $('body').append($(html));
    }
    

    //Define the unit tests
    describe('testing controller AD.controllers.opstools.RunReports.ReportViewer ', function(){

        var testController = null;

        before(function(){

            buildHTML();

            // Initialize the controller
            testController = new AD.controllers.opstools.RunReports.ReportViewer($('#'+divID), { some:'data' });

        });



        it('controller definition exists ', function(){
            assert.isDefined(AD.controllers.opstools , ' :=> should have been defined ');
            assert.isDefined(AD.controllers.opstools.RunReports , ' :=> should have been defined ');
            assert.isDefined(AD.controllers.opstools.RunReports.ReportViewer, ' :=> should have been defined ');
              assert.isNotNull(AD.Control.get('opstools.RunReports.ReportViewer'), ' :=> returns our controller. ');
        });


    });


});