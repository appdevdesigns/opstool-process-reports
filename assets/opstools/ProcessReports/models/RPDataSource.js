steal(
	'opstools/ProcessReports/models/base/RPDataSource.js',
	function () {
		System.import('appdev').then(function () {
			steal.import('appdev/model/model').then(function () {

				// Namespacing conventions:
				// AD.Model.extend('[application].[Model]', {static}, {instance} );  --> Object
				AD.Model.extend('opstools.ProcessReports.RPDataSource', {
					/*
							findAll: 'GET /opstool-process-reports/rpdatasource',
							findOne: 'GET /opstool-process-reports/rpdatasource/{id}',
							create:  'POST /opstool-process-reports/rpdatasource',
							update:  'PUT /opstool-process-reports/rpdatasource/{id}',
							destroy: 'DELETE /opstool-process-reports/rpdatasource/{id}',
							describe: function() {},   // returns an object describing the Model definition
							fieldId: 'id',             // which field is the ID
							fieldLabel:'null'      // which field is considered the Label
					*/
				}, {
						/*
								// Already Defined:
								model: function() {},   // returns the Model Class for an instance
								getID: function() {},   // returns the unique ID of this row
								getLabel: function() {} // returns the defined label value
						*/
					});

			});
		});
	});