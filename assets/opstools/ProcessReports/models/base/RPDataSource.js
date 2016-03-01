steal(
	function () {
		System.import('appdev').then(function () {
			steal.import('appdev/model/model').then(function () {

				// Namespacing conventions:
				// AD.Model.Base.extend("[application].[Model]" , { static }, {instance} );  --> Object
				AD.Model.Base.extend("opstools.ProcessReports.RPDataSource", {
					findAll: 'GET /opstool-process-reports/rpdatasource',
					findOne: 'GET /opstool-process-reports/rpdatasource/{id}',
					create: 'POST /opstool-process-reports/rpdatasource',
					update: 'PUT /opstool-process-reports/rpdatasource/{id}',
					destroy: 'DELETE /opstool-process-reports/rpdatasource/{id}',
					describe: function () {
						return {
							"name": "string,",
							"schema": "json,",
							"permissions": "json"
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
						//     return AD.Model.get('opstools.ProcessReports.RPDataSource'); //AD.models.opstools.ProcessReports.RPDataSource;
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