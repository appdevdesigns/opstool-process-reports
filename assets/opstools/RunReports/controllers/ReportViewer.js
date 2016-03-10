
steal(
	function () {
		System.import('appdev').then(function () {
			steal.import(
				'appdev/ad',
				'appdev/control/control',
				'appdev/model/model',
				'appdev/comm/service'
				).then(function () {

					// Namespacing conventions:
					// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.extend('opstools.RunReports.ReportViewer', {


						init: function (element, options) {
							var self = this;
							options = AD.defaults({
							}, options);
							this.options = options;

							// Call parent init
							this._super(element, options);

							this.dataSource = this.options.dataSource; // AD.models.Projects;

							this.data = {};

							this.initDOM();
						},

						initDOM: function () {
							this.dom = {};
							
							this.dom.ViewWidget = new AD.op.Widget(this.element.find('.rp-runreport-preview'));
						},

						setReportViewer: function (reportTemplate) {
							var _this = this;
							var report_def = JSON.parse(reportTemplate.report_def);

							AD.comm.service.get({ url: '/fcf_activities/renderreport/activities' }, function (err, data) {
								var report = jsreports.createReport(report_def)
									.header(null, report_def.header)
									.detail(report_def.body.height)
									.table(0.2745228215767635, 2.562213001383126, 7.289083895853422, 4.306460945033751, { data: 'person_activities', hasHeader: false, hasFooter: false, fontSize: 9 })
									.column('5%', '[order]', 'Order', '', { align: 'left' })
									.column('95%', '[title]', 'Activity title', '', { align: 'left' })
									.footer(null, report_def.footer)
									.done();

								// Render report preview
								jsreports.render({
									report_def: report,
									target: _this.element.find(".rp-runreport-preview"),
									showToolbar: true,
									datasets: [{
										"id": report_def.body.data_source,
										"name": report_def.body.data_source,
										"data": data instanceof Array ? data : [data],
										"schema": report_def.data_schema
									}]
								});

								_this.dom.ViewWidget = new AD.op.Widget(_this.element.find('.jsr-content-viewport'));

								if (_this.data.screenHeight) {
									_this.resize(_this.data.screenHeight);
								}
							});
						},

						resize: function (height) {
							this.data.screenHeight = height;

							if (this.dom.ViewWidget) {
								this.dom.ViewWidget.resize({ height: height });
							}
						},



					});


				});
		});
	});