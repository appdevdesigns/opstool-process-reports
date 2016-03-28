
steal(
	'opstools/ProcessReports/models/RPDataSource.js',

	function() {
		System.import('appdev').then(function() {
			steal.import(
				'appdev/ad',
				'appdev/control/control',
				'appdev/model/model',
				'appdev/comm/service'
			).then(function() {

				// Namespacing conventions:
				// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
				AD.Control.extend('opstools.RunReports.ReportViewer', {


					init: function(element, options) {
						var self = this;
						options = AD.defaults({
						}, options);
						this.options = options;

						// Call parent init
						this._super(element, options);

						this.dataSource = this.options.dataSource; // AD.models.Projects;

						this.RPDataSource = AD.Model.get('opstools.ProcessReports.RPDataSource');
						this.RPReportDefinition = AD.Model.get('opstools.ProcessReports.RPReportDefinition');

						this.data = {};

						this.initDOM();
						this.loadReportDataSource();
					},

					initDOM: function() {
						this.dom = {};

						this.dom.ViewWidget = new AD.op.Widget(this.element.find('.rp-runreport-preview'));
						this.dom.ReportContentWidget = new AD.op.Widget(this.element.find('.jsr-content-viewport'));
						this.element.find('.rp-runreport-preview-panel').hide();
						this.element.find('.rp-runreport-loading').hide();

						this.dom.modalPreview = this.element.find('.rp-runreport-workspace');
						this.dom.modalPreview.modal('hide');
					},

					setReportViewer: function(reportTemplate) {
						this.element.find('.rp-runreport-loading').show();
						this.element.find('.rp-runreport-instructionsPanel').hide();
						this.element.find('.rp-runreport-preview-panel').hide();

						this.data.reportTemplate = reportTemplate;

						var _this = this,
							report_def = JSON.parse(reportTemplate.report_def),
							data_source_ids = [],
							data_sources = [],
							datasets = [];

						data_source_ids.push({ id: report_def.body.data_source });

						// Find subreport data source info
						if (report_def.body.elements && report_def.body.elements.length > 0) {
							report_def.body.elements.forEach(function(elm) {
								if (elm.type === 'subreport') {
									data_source_ids.push({ id: elm.report.body.data_source });
								}
							});
						}

						async.series(
							[
								function(next) {
									// Get data sources info
									_this.RPDataSource.findAll({ or: data_source_ids }).then(function(ds) {
										data_sources = ds;

										next();
									});
								},
								function(next) {
									var getJoinDsTasks = [];

									// Find Join data source object
									data_sources.forEach(function(ds) {
										if (ds.join) {
											getJoinDsTasks.push(function(callback) {
												_this.RPDataSource.findAll({ or: [{ id: ds.join.left }, { id: ds.join.right }] }).then(function(ds) {
													data_sources = data_sources.concat(ds);

													callback();
												});
											});
										}
									});

									async.parallel(getJoinDsTasks, function() {
										// Unique data sources
										var data_source_ids = {};
										var unique_ids = [];

										$.each(data_sources, function(i, ds) {
											if (!data_source_ids[ds.id]) {
												data_source_ids[ds.id] = true;
												unique_ids.push(ds);
											}
										});
										data_sources = unique_ids;

										next();
									});
								},
								function(next) {
									var getDataSourcesTasks = [];

									// Get data to render report
									data_sources.forEach(function(ds) {
										if (ds.join) {
											datasets.push({
												"id": ds.id.toString(),
												"name": ds.name,
												"join": ds.join.attr()
											});
										}
										else {
											getDataSourcesTasks.push(function(callback) {
												AD.comm.service.get({ url: ds.getDataUrl }, function(err, data) {

													// data.forEach(function(d) {
													// 	if (d.startDate) {
													// 		d.startDate = '1/20/2016';
													// 		// console.log('d: ', d);
													// 	}
													// });

													// var data2 = data.concat([]);
													// console.log('data: ', data2);

													datasets.push({
														"id": ds.id.toString(),
														"name": ds.name,
														"data": data instanceof Array ? data : [data],
														"schema": (typeof ds.schema === 'string' ? JSON.parse(ds.schema) : ds.schema.attr())
													});

													callback();
												});
											});
										}
									});

									async.parallel(getDataSourcesTasks, function() {
										next();
									});
								}
							],
							function() {
								_this.element.find('.rp-runreport-preview-panel').show();
								_this.element.find('.rp-runreport-loading').hide();

								// Render report preview
								jsreports.render({
									report_def: report_def,
									target: _this.element.find(".rp-runreport-preview"),
									showToolbar: true,
									datasets: datasets
								});

								// Remove export PDF/Excel menu
								$(".jsr-save-dropdown-button li[role='presentation']").remove();

								// Add export HTML report format menu
								$('.jsr-save-dropdown-button ul').append('<li role="presentation"><a role="menuitem" tabindex="-1" href="#" class="jsr-export-html">HTML</a></li>');

								$('.jsr-export-html').bind('click', function() {
									// Get report html format
									var html = _this.getReportHtml();

									// Download the report html file
									var clickEvent = new MouseEvent('click', {
										'view': window,
										'bubbles': true,
										'cancelable': true
									});
									var downloadLink = document.createElement('a');
									downloadLink.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(html));
									downloadLink.setAttribute('download', report_def.title + '.htm');
									downloadLink.dispatchEvent(clickEvent);
								});

								_this.dom.ViewWidget = new AD.op.Widget(_this.element.find('.rp-runreport-preview'));
								_this.dom.ReportContentWidget = new AD.op.Widget(_this.element.find('.jsr-content-viewport'));

								if (_this.data.screenHeight) {
									_this.resize(_this.data.screenHeight);
								}
							}
						);

					},

					getReportHtml: function() {
						var selector = '.jsr-content-viewport';
						var html = '<div class="jsr-report">' + $(selector).html() + '</div>';

						selector = selector.split(",").map(function(subselector) {
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

						var style = rulesUsed.map(function(cssRule) {
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

					loadReportDataSource: function() {
						var _this = this;

						this.RPDataSource.findAll()
							.fail(function(err) {
								console.error('!!! Dang.  something went wrong:', err);
							})
							.then(function(dataSources) {
								_this.data.dataSources = dataSources.attr(); // Convert to array
								_this.data.dataSources.forEach(function(ds) {
									ds.id = ds.id.toString(); // jsReports support only id string
								});
							});
					},

					resize: function(height) {
						this.data.screenHeight = height;

						if (this.dom.ViewWidget) {
							this.dom.ViewWidget.resize({ height: height - 50 });
							this.dom.ReportContentWidget.resize({ height: height - 105 });
						}
					},

					'.rp-runreport-edit click': function($el, ev) {
						var report_def = (typeof this.data.reportTemplate.report_def === 'string') ? JSON.parse(this.data.reportTemplate.report_def.replace(/'/g, '"')) : this.data.reportTemplate.report_def.attr();

						this.dom.designer = new jsreports.Designer({
							container: this.element.find('.rp-runreport-designer'),
							embedded: true,
							showToolbar: true, // If false, it shows overlap UI
							showSaveButton: true,
							data_sources: this.data.dataSources,
							images: this.data.reportTemplate.images || [],
							report_def: report_def,
							layout: "horizontal"
						});

						// Remove save button
						this.element.find('.save-button').remove();

						// Show modal
						this.dom.modalPreview.modal('show');
					},

					'.rp-runreport-save click': function($el, ev) {
						var _this = this;

						this.data.reportTemplate.save().then(function() {
							_this.RPReportDefinition.findOne({ id: _this.data.reportTemplate.id }).then(function(reportTemplate) {
								_this.data.reportTemplate = reportTemplate;

								_this.setReportViewer(_this.data.reportTemplate);
							});
						});
					}

				});


			});
		});
	});