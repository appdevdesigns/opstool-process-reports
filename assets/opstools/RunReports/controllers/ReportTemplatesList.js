
steal(
	function () {
		System.import('appdev').then(function () {
			steal.import(
				'appdev/ad',
				'appdev/control/control',
				'appdev/model/model'
				).then(function () {

					// Namespacing conventions:
					// AD.Control.extend('[application].[controller]', [{ static },] {instance} );
					AD.Control.extend('opstools.RunReports.ReportTemplatesList', {


						init: function (element, options) {
							var self = this;
							options = AD.defaults({
								eventItemSelected: 'RP_RunReport.Selected'
							}, options);
							this.options = options;

							// Call parent init
							this._super(element, options);


							this.dataSource = this.options.dataSource; // AD.models.Projects;


							this.data = new can.Map({
								runReportLists: new can.List([]),
								selectedItem: null
							});

							this.initDOM();
						},



						initDOM: function () {
							this.dom = {};
							this.dom.list = this.element.find('ul.op-list');

							var template = this.domToTemplate(this.dom.list);
							can.view.ejs('RunReport_List', template);

							this.dom.list.html(can.view('RunReport_List', { data: this.data }));

							this.dom.ListWidget = new AD.op.Widget(this.element);
						},

						setList: function (list) {
							var _this = this;

							this.data.attr('runReportLists', list);

							// Resize screen
							if (this.data.screenHeight) {
								this.resize(this.data.screenHeight);
							}
						},

						selectLI: function ($el) {
							this.clearSelectItems();

							$el.addClass('active');

							var model = $el.data('item');
							this.data.selectedItem = model;

							this.element.trigger(this.options.eventItemSelected, model);

							if (this.data.screenHeight) {
								this.resize(this.data.screenHeight);
							}
						},

						clearSelectItems: function () {
							this.element.find('.active').removeClass('active');
						},


						resize: function (height) {
							this.data.screenHeight = height;

							if (this.dom.ListWidget) {
								this.dom.ListWidget.resize({ height: height });
							}
						},

						'li click': function ($el, ev) {
							this.selectLI($el);

							ev.preventDefault();
						}


					});


				});

		});

	});