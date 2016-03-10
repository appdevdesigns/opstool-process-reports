steal(
	"opstools/ProcessReports/models/RPDataSource.js",
	function () {
		System.import('appdev').then(function () {
			steal.import(
				'appdev/ad',
				'appdev/control/control',
				'OpsPortal/classes/OpsButtonBusy',
				'OpsPortal/classes/OpsWidget'
				).then(function () {
					// Namespacing conventions:
					// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.extend('opstools.ProcessReports.ReportTemplateWorkspace', {

						init: function (element, options) {
							var self = this;
							options = AD.defaults({
								eventItemSaved: 'RP_ReportTemplate.Saved',
								eventClearItemSelected: 'RP_ReportTemplate.ClearSelected'
							}, options);
							this.options = options;

							// Call parent init
							this._super(element, options);


							this.dataSource = this.options.dataSource; // AD.models.Projects;

							this.RPDataSource = AD.Model.get('opstools.ProcessReports.RPDataSource');
							this.RPReportDefinition = AD.Model.get('opstools.ProcessReports.RPReportDefinition');

							this.data = {};
							this.buttons = {};

							this.loadReportDataSource();
							this.initDOM();

							this.element.find('.rp-reporttemplate-submit').each(function (index, btn) {
								var status = $(btn).attr('rp-status');
								self.buttons[status] = new AD.op.ButtonBusy(btn);
							});
						},



						initDOM: function () {
							this.dom = {};

							var template = this.domToTemplate(this.element.find('.rp-report-title'));
							can.view.ejs('RP_TitleForm', template);

							this.dom.modalPreview = this.element.find('.rp-template-preview');
							this.dom.modalPreview.modal('hide');

							this.clearWorkspace();
						},



						loadReportDataSource: function () {
							var _this = this;

							this.RPDataSource.findAll()
								.fail(function (err) {
									console.error('!!! Dang.  something went wrong:', err);
								})
								.then(function (dataSources) {
									_this.data.dataSources = dataSources.attr(); // Convert to array
									_this.data.dataSources.forEach(function (ds) {
										ds.id = ds.id.toString(); // jsReports support only id string
									});
								});
						},



						setReportTemplate: function (reportTemplate) {
							this.data.reportTemplate = reportTemplate;

							// Workaround : Convert report_def to string
							var report_def = (typeof this.data.reportTemplate.report_def === 'string') ? JSON.parse(this.data.reportTemplate.report_def.replace(/'/g, '"')) : this.data.reportTemplate.report_def.attr();

							this.element.find('.rp-instructionsPanel').hide();
							this.element.find('.rp-template-form').show();

							this.dom.designer = new jsreports.Designer({
								container: this.element.find(".rp-report-designer"),
								embedded: true,
								showToolbar: true, // If false, it shows overlap UI
								showSaveButton: true,
								data_sources: this.data.dataSources,
								images: this.data.reportTemplate.images || [],
								report_def: report_def,
								layout: "horizontal"
							});

							// $('.jsr-designer-toolbar').remove(); // Fix overlap report UI layout

							this.element.find('.rp-report-title').html(can.view('RP_TitleForm', { title: this.data.reportTemplate.title }));

							this.dom.FormWidget = new AD.op.Widget(this.element.find('.rp-report-designer'));

							if (this.data.screenHeight) {
								this.resize(this.data.screenHeight);
								this.dom.designer.window_resize_delegate();
							}
						},


						prepareWorkspaceToCreate: function () {
							this.clearWorkspace();

							this.setReportTemplate(this.RPReportDefinition.extend({
								title: 'New report',
								report_def: '{"title":"New report","id":"","default_format":"html","version":"1.4.0","page":{"units":"inches","paper_size":{"name":"A4","inches":["8.27","11.69"],"mm":["210","297"],"id":"a4"},"margins":{"top":0.5,"left":0.5,"right":0.5,"bottom":0.5}},"filters":[],"inputs":[],"header":{"height":1.15,"elements":[]},"body":{"data_source":"","show_detail":true,"height":0.35,"elements":[],"sublevels":[],"column_count":1,"pivot_enabled":false,"pivot_expression":"","pivot_column_sort_by":"","pivot_column_bucket_type":"","pivot_value_aggregate":"","pivot_column_left":3.325,"pivot_column_right":4.175,"pivot_area_right":5.449999999999999},"footer":{"height":0,"elements":[]},"page_header":{"visible":false,"elements":[],"height":1},"page_footer":{"visible":false,"elements":[],"height":1},"type":"hierarchical"}'
							})());
						},


						clearWorkspace: function () {
							this.dom.designer = null;
							this.element.find('.rp-report-designer').html('');
							this.element.find('.rp-template-form').hide();
							this.element.find('.rp-instructionsPanel').show();

							this.element.trigger(this.options.eventClearItemSelected);
						},



						resize: function (height) {
							this.data.screenHeight = height;

							if (this.dom.FormWidget) {
								this.dom.FormWidget.resize({ height: height - 105 });
							}
						},
						buttonsEnable: function () {
							for (var b in this.buttons) {
								if (this.buttons[b])
									this.buttons[b].enable();
							}
						},
						buttonsDisable: function () {
							for (var b in this.buttons) {
								if (this.buttons[b])
									this.buttons[b].disable();
							}
						},


						'.rp-reporttemplate-submit click': function ($btn) {
							var _this = this;

							var status = $btn.attr('rp-status');

							this.buttonsDisable();

							switch (status) {
								case 'cancel':
									AD.op.Dialog.Confirm({
										fnYes: function () {
											_this.buttonsEnable();
											_this.clearWorkspace();
										},
										fnNo: function () {
											_this.buttonsEnable();
										}
									});
									break;
								case 'save':
									if (this.dom.designer) {
										this.buttons[status].busy();
										
										// Workaround : Convert report_def to string
										var report_def = JSON.stringify(this.dom.designer.getReport());

										var title = this.element.find('.rp-report-title-value').val();
										this.data.reportTemplate.attr('title', title);
										report_def.title = title;
										
										// TODO : save images field
										this.data.reportTemplate.attr('report_def', report_def);

										this.data.reportTemplate.save().then(function () {
											_this.element.trigger(_this.options.eventItemSaved, _this.data.reportTemplate);

											_this.buttons[status].ready();
											_this.buttonsEnable();
										});
									} else {
										_this.buttons[status].ready();
										_this.buttonsEnable();
									}

									break;
								case 'delete':
									AD.op.Dialog.Confirm({
										fnYes: function () {
											_this.buttons[status].busy();
											_this.data.reportTemplate.destroy(function () {
												_this.buttons[status].ready();
												_this.buttonsEnable();

												_this.element.find('.rp-template-form').hide();
												_this.element.find('.rp-instructionsPanel').show();
											});
										},
										fnNo: function () {
											_this.buttonsEnable();
										}
									});
									break;
							}
						},

						// Create button in the instruction page
						'.rp-reporttemplate-create click': function () {
							this.prepareWorkspaceToCreate();
						},

						// Preview button in the edit page 
						'.rp-reporttemplate-preview click': function () {

							var _this = this;
							var report_def = this.dom.designer.getReport();

							// Find data source schema
							var data_schema = null;
							this.data.dataSources.forEach(function (ds) {
								if (ds.id === report_def.body.data_source)
									data_schema = ds.schema;
							});

							if (!data_schema || !data_schema.fields) {
								alert('Please select the data source');
								return;
							}

							// Mock data to display report preview
							var data = {};
							data_schema.fields.forEach(function (f) {
								switch (f.type) {
									case 'number':
										data[f.name] = 9999;
										break;
									default:
										data[f.name] = '[' + f.name + ']';
										break;
								}
							});

							var report = jsreports.createReport(report_def)
								.header(null, report_def.header)
								.detail(report_def.body.height)
								.table(0.2745228215767635, 2.562213001383126, 7.289083895853422, 4.306460945033751, { data: 'person_activities', hasHeader: false, hasFooter: false, fontSize: 9 })
								.column('5%', '[order]', 'Order', '', { align: 'left' })
								.column('95%', '[title]', 'Activity title', '', { align: 'left' })
								.footer(null, report_def.footer)
								.done();

							// Render report preview
							var report_previewer = jsreports.render({
								report_def: report,
								target: _this.element.find(".rp-report-preview"),
								showToolbar: true,
								datasets: [{
									"id": report_def.body.data_source,
									"name": report_def.body.data_source,
									"data": [data],
									"schema": data_schema
								}]
							});

							// Fix report toolbar
							$('.jsr-content-viewport').css('top', '40px');

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

							// Show modal
							_this.dom.modalPreview.modal('show');
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
						}

					});


				});
		});
	});
