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
								showSaveButton: false,
								data_sources: this.data.dataSources,
								images: this.data.reportTemplate.images,
								report_def: report_def,
								layout: "horizontal"
							});

							$('.jsr-designer-toolbar').remove(); // Fix overlap report UI layout

							this.element.find('.rp-report-title').html(can.view('RP_TitleForm', { title: this.data.reportTemplate.title }));

							this.dom.FormWidget = new AD.op.Widget(this.element.find('.rp-report-designer'));

							if (this.data.screenHeight) {
								this.resize(this.data.screenHeight);
								this.dom.designer.window_resize_delegate();
							}
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
								this.dom.FormWidget.resize({ height: height - 95 });
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

										this.data.reportTemplate.attr('title', this.element.find('.rp-report-title-value').val());
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

							this.setReportTemplate(this.RPReportDefinition.extend({
								title: 'New report',
								report_def: '{"title":"New report","id":"","default_format":"html","version":"1.4.0","page":{"units":"inches","paper_size":{"name":"Letter","inches":["8.5","11"],"mm":["216","279"],"id":"letter"},"margins":{"top":0.5,"left":0.5,"right":0.5,"bottom":0.5}},"filters":[],"inputs":[],"header":{"height":1.15,"elements":[]},"body":{"data_source":"","show_detail":true,"height":0.35,"elements":[],"sublevels":[],"column_count":1,"pivot_enabled":false,"pivot_expression":"","pivot_column_sort_by":"","pivot_column_bucket_type":"","pivot_value_aggregate":"","order_detail_by":"Entry_Date","pivot_column_left":3.325,"pivot_column_right":4.175,"pivot_area_right":5.449999999999999},"footer":{"height":0,"elements":[]},"page_header":{"visible":false,"elements":[],"height":1},"page_footer":{"visible":false,"elements":[],"height":1},"type":"hierarchical"}'
							})());
						},

						// Preview button in the edit page 
						'.rp-reporttemplate-preview click': function () {
							var report_def = this.dom.designer.getReport();

							// Find data source schema
							var data_schema = null;
							this.data.dataSources.forEach(function (ds) {
								if (ds.id === report_def.body.data_source)
									data_schema = ds.schema;
							});

							if (data_schema === null)
								return; // TODO: show error message

							// Render report preview
							var report_previewer = jsreports.render({
								report_def: report_def,
								target: this.element.find(".rp-report-preview"),
								showToolbar: true,
								datasets: [{
									"id": report_def.body.data_source,
									"name": report_def.body.data_source,
									"data": [
										{
											"Entry_Date": "6/23/2015",
											"Previous_timesheet_status": "open",
											"Current_timesheet_status": "locked",
											"Full_name": "Elizabeth Stewart",
											"Employee_number": "na",
											"Person_status": "Active",
											"Employment_type": "Employee",
											"Client_name": "Nakatomi Trading Corp.",
											"Job_name": "Project Molybdenum",
											"Hours": 2.25,
											"Task_name": "Meeting",
											"Billing_rate": "190",
											"Cost": "10",
											"Time_Entry_ID": "1854509",
											"Timesheet_ID": "1498876",
											"Person_ID": "100000003",
											"Client_ID": "100000000",
											"Job_ID": "100000001",
											"Task_ID": "100000002"
										}],
									"schema": data_schema
								}]
							});

							// Show modal
							this.dom.modalPreview.modal('show');
						}


					});


				});
		});
	});
