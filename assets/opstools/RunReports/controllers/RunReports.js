
steal(
	// List your Controller's dependencies here:
	'opstools/ProcessReports/models/RPReportDefinition.js',

	'opstools/RunReports/controllers/ReportTemplatesList.js',
	'opstools/RunReports/controllers/ReportViewer.js',

	'opstools/RunReports/views/RunReports/RunReports.ejs',
	function () {
		System.import('appdev').then(function () {
			steal.import(
				'appdev/ad',
				'appdev/control/control',
				'OpsPortal/classes/OpsTool',
				'site/labels/opstool-RunReports').then(function () {

					// Namespacing conventions:
					// AD.Control.OpsTool.extend('[ToolName]', [{ static },] {instance} );
					AD.Control.OpsTool.extend('RunReports', {
						CONST: {
							ITEM_SELECTED: 'RP_RunReport.Selected',
							POPULATE_FINISHED: 'RP_RunReport.Finished'
						},

						init: function (element, options) {
							var self = this;
							options = AD.defaults({
								templateDOM: '/opstools/RunReports/views/RunReports/RunReports.ejs',
								resize_notification: 'RunReports.resize',
								tool: null   // the parent opsPortal Tool() object
							}, options);
							this.options = options;

							// Call parent init
							this._super(element, options);

							this.RPReportDefinition = AD.Model.get('opstools.ProcessReports.RPReportDefinition');

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

							var ReportTemplatesList = AD.Control.get('opstools.RunReports.ReportTemplatesList');
							var ReportViewer = AD.Control.get('opstools.RunReports.ReportViewer');

							this.controllers.ReportTemplatesList = new ReportTemplatesList(this.element.find('.rp-runreport-list'), { eventItemSelected: this.CONST.ITEM_SELECTED });

							this.controllers.ReportViewer = new ReportViewer(this.element.find('.rp-runreport-display'), { eventPopulateFinished: this.CONST.POPULATE_FINISHED });
						},

						initEvents: function () {
							var _this = this;

							this.RPReportDefinition.bind('stale', function (ev, request) {
								_this.loadReportTemplatesData();
							});

							this.controllers.ReportTemplatesList.element.on(this.CONST.ITEM_SELECTED, function (event, reportTemplate) {
								_this.controllers.ReportViewer.setReportViewer(reportTemplate);
								_this.translate();
							});

							this.controllers.ReportViewer.element.on(this.CONST.POPULATE_FINISHED, function () {
								_this.translate();
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

									_this.translate();
								});
						},

						resize: function (data) {

							this._super(data);

							this.controllers.ReportTemplatesList.resize(data.height);
							this.controllers.ReportViewer.resize(data.height);
						}

					});


				});

		});

	});