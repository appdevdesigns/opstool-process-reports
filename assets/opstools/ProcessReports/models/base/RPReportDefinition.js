steal(
	function () {
		System.import('appdev').then(function () {
			steal.import('appdev/model/model').then(function () {
			
				// Namespacing conventions:
				// AD.Model.Base.extend("[application].[Model]" , { static }, {instance} );  --> Object
				AD.Model.Base.extend("opstools.ProcessReports.RPReportDefinition", {
					findAll: 'GET /opstool-process-reports/rpreportdefinition',
					findOne: 'GET /opstool-process-reports/rpreportdefinition/{id}',
					create: 'POST /opstool-process-reports/rpreportdefinition',
					update: 'PUT /opstool-process-reports/rpreportdefinition/{id}',
					destroy: 'DELETE /opstool-process-reports/rpreportdefinition/{id}',
					describe: function () {
						return {
							"title": "string"
						};
					},
					// associations:['actions', 'permissions'],
					// multilingualFields:['role_label', 'role_description'],
					// validations: {
					//     "role_label" : [ 'notEmpty' ],
					//     "role_description" : [ 'notEmpty' ]
					// },
					fieldId: 'id',
					fieldLabel: 'null'
				}, {
						// model: function() {
						//     return AD.Model.get('opstools.opstool-process-reports.RPReportTemplate'); //AD.models.opstools.opstool-process-reports.RPReportTemplate;
						// },
						// getID: function() {
						//     return this.attr(this.model().fieldId) || 'unknown id field';
						// },
						// getLabel: function() {
						//     return this.attr(this.model().fieldLabel) || 'unknown label field';
						// }
					});


			});
		});
	});