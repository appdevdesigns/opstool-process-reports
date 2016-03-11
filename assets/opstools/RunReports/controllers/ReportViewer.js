
steal(
	'opstools/ProcessReports/models/RPDataSource.js',

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

							this.RPDataSource = AD.Model.get('opstools.ProcessReports.RPDataSource');

							this.data = {};

							this.initDOM();
						},

						initDOM: function () {
							this.dom = {};

							this.dom.ViewWidget = new AD.op.Widget(this.element.find('.rp-runreport-preview'));
							this.dom.ReportContentWidget = new AD.op.Widget(this.element.find('.jsr-content-viewport'));
							this.element.find('.rp-runreport-preview-panel').hide();
							this.element.find('.rp-runreport-loading').hide();
						},

						setReportViewer: function (reportTemplate) {
							this.element.find('.rp-runreport-loading').show();
							this.element.find('.rp-runreport-instructionsPanel').hide();
							this.element.find('.rp-runreport-preview-panel').hide();

							var _this = this;
							var report_def = JSON.parse(reportTemplate.report_def);

							this.RPDataSource.findOne({ id: report_def.body.data_source }).then(function (data_source) {
								var getDataUrl = data_source.getDataUrl;
								AD.comm.service.get({ url: getDataUrl }, function (err, data) {
									var report = jsreports.createReport(report_def)
										.header(null, report_def.header)
										.pageHeader(null, report_def.page_header)
										.detail(report_def.body.height)
										.table(0.2745228215767635, 4.062213001383126, 7.289083895853422, 4.306460945033751, { data: 'person_activities', hasHeader: false, hasFooter: false, fontSize: 9 })
										.column('5%', '[order]', 'Order', '', { align: 'left' })
										.column('95%', '[title]', 'Activity title', '', { align: 'left' })
										.pageFooter(null, report_def.page_footer)
										.footer(null, report_def.footer)
										.done();

									_this.element.find('.rp-runreport-preview-panel').show();
									_this.element.find('.rp-runreport-loading').hide();

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
									
									// Remove export PDF/Excel menu
									$(".jsr-save-dropdown-button li[role='presentation']").remove();

									// Add export HTML report format menu
									$('.jsr-save-dropdown-button ul').append('<li role="presentation"><a role="menuitem" tabindex="-1" href="#" class="jsr-export-html">HTML</a></li>');

									$('.jsr-export-html').bind('click', function () {
										// Get report html format
										var html = _this.getReportHtml();

										// Download the report html file
										var downloadReportHtml = $(document.createElement('a'));
										downloadReportHtml.attr('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(html));
										downloadReportHtml.attr('download', report_def.title + '.htm');
										downloadReportHtml[0].click();
									});

									_this.dom.ViewWidget = new AD.op.Widget(_this.element.find('.rp-runreport-preview'));
									_this.dom.ReportContentWidget = new AD.op.Widget(_this.element.find('.jsr-content-viewport'));

									if (_this.data.screenHeight) {
										_this.resize(_this.data.screenHeight);
									}
								});
							});

						},

						getReportHtml: function () {
							var selector = '.jsr-content-viewport';
							var html = '<div class="jsr-report">' + $(selector).html() + '</div>';

							selector = selector.split(",").map(function (subselector) {
								return subselector + "," + subselector + " *";
							}).join(",");

							var elts = $(selector);
							var rulesUsed = [];
							var sheets = document.styleSheets;

							for (var c = 0; c < sheets.length; c++) {
								var rules = sheets[c].rules || sheets[c].cssRules;
								for (var r = 0; r < rules.length; r++) {
									var selectorText = rules[r].selectorText;
									var matchedElts = $(selectorText);
									for (var i = 0; i < elts.length; i++) {
										if (matchedElts.index(elts[i]) != -1) {
											rulesUsed.push(rules[r]); break;
										}
									}
								}
							}

							var style = rulesUsed.map(function (cssRule) {
								var cssText = '';
								if (cssRule.style) {
									cssText = cssRule.style.cssText.toLowerCase();
								} else {
									cssText = cssRule.cssText;
								}

								return cssRule.selectorText + '{' + cssText.replace(/(\{|;)\s+/g, "\$1\n  ").replace(/\A\s+}/, "}") + '}';
							}).join("\n");

							return "<html><head><meta charset='UTF-8'><style>\n" + style + "\n</style></head>\n\n<body>" + html + "</body></html>";
						},

						resize: function (height) {
							this.data.screenHeight = height;

							if (this.dom.ViewWidget) {
								this.dom.ViewWidget.resize({ height: height - 50 });
								this.dom.ReportContentWidget.resize({ height: height - 105 });
							}
						},



					});


				});
		});
	});