
steal(
// List your Controller's dependencies here:
	'opstools/ProcessReports/models/RPReportDefinition.js',

	'opstools/ProcessReports/controllers/ReportTemplatesList.js',
	'opstools/ProcessReports/controllers/ReportTemplateWorkspace.js',

	'opstools/ProcessReports/views/ProcessReports/ProcessReports.ejs',
	function () {
		System.import('appdev').then(function () {
			steal.import(
				'appdev/ad',
				'appdev/control/control',
				'OpsPortal/classes/OpsTool').then(function () {
					
					// Namespacing conventions:
					// AD.Control.OpsTool.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.OpsTool.extend('ProcessReports', {
						CONST: {
							ITEM_SELECTED: 'RP_ReportTemplate.Selected',
							ITEM_SAVED: 'RP_ReportTemplate.Saved',
							CLEAR_ITEM_SELECTED: 'RP_ReportTemplate.ClearSelected'
						},


						init: function (element, options) {
							var self = this;
							options = AD.defaults({
								templateDOM: '/opstools/ProcessReports/views/ProcessReports/ProcessReports.ejs',
								resize_notification: 'ProcessReport.resize',
							}, options);
							this.options = options;

							// Call parent init
							this._super(element, options);

							this.RPReportDefinition = AD.Model.get('opstools.ProcessReports.RPReportDefinition');

							this.dataSource = this.options.dataSource; // AD.models.Projects;

							this.data = {};

							this.initDOM();
							this.initControllers();
							this.initEvents();
							this.loadReportTemplatesData();

						},



						initDOM: function () {

							this.element.html(can.view(this.options.templateDOM, {}));

						},



						initControllers: function () {

							this.controllers = {};

							var ReportTemplatesList = AD.Control.get('opstools.ProcessReports.ReportTemplatesList');
							var ReportTemplateWorkspace = AD.Control.get('opstools.ProcessReports.ReportTemplateWorkspace');

							this.controllers.ReportTemplatesList = new ReportTemplatesList(this.element.find('.rp-reportlist'), { eventItemSelected: this.CONST.ITEM_SELECTED });
							this.controllers.ReportTemplateWorkspace = new ReportTemplateWorkspace(this.element.find('.rp-reportworkspace'), { eventItemSaved: this.CONST.ITEM_SAVED, eventClearItemSelected: this.CONST.CLEAR_ITEM_SELECTED });
						},



						initEvents: function () {
							var _this = this;

							this.controllers.ReportTemplatesList.element.on(this.CONST.ITEM_SELECTED, function (event, reportTemplate) {
								_this.controllers.ReportTemplateWorkspace.setReportTemplate(reportTemplate);
							});

							this.controllers.ReportTemplateWorkspace.element.on(this.CONST.ITEM_SAVED, function (event, reportTemplate) {
								var isNewItem = true;

								_this.data.list.forEach(function (rpTemplate) {
									if (rpTemplate.getID() === reportTemplate.getID()) {
										rpTemplate.attr('title', reportTemplate.title);
										rpTemplate.attr('report_def', reportTemplate.report_def);
										isNewItem = false;
									}
								})

								if (isNewItem) {
									_this.data.list.push(reportTemplate);
									_this.controllers.ReportTemplatesList.setList(_this.data.list);
									_this.controllers.ReportTemplatesList.selectReportTemplate(reportTemplate);
								}
								else {
									_this.controllers.ReportTemplatesList.setList(_this.data.list);
								}

							});

							this.controllers.ReportTemplateWorkspace.element.on(this.CONST.CLEAR_ITEM_SELECTED, function (event) {
								_this.controllers.ReportTemplatesList.clearSelectItems();
							});
						},



						loadReportTemplatesData: function () {
							var _this = this;

							this.RPReportDefinition.findAll()
								.fail(function (err) {
									console.error('!!! Dang.  something went wrong:', err);
								})
								.then(function (list) {
									_this.controllers.ReportTemplatesList.setList(list);

									_this.data.list = list;
								});
						},



						resize: function (data) {

							this._super(data);

							this.controllers.ReportTemplatesList.resize(data.height);
							this.controllers.ReportTemplateWorkspace.resize(data.height);
						}


					});

				});
		});
	});