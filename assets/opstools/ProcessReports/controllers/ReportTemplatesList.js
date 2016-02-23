
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
					AD.Control.extend('opstools.ProcessReports.ReportTemplatesList', {


						init: function (element, options) {
							var self = this;
							options = AD.defaults({
								eventItemSelected: 'RP_ReportTemplate.Selected'
							}, options);
							this.options = options;

							// Call parent init
							this._super(element, options);


							this.dataSource = this.options.dataSource; // AD.models.Projects;

							this.RPReportDefinition = AD.Model.get('opstools.ProcessReports.RPReportDefinition');
							
							// Bind Lock/Unlock items 
							this.RPReportDefinition.on('messaged', function (ev, data) {
								var foundEL = self.element.find('[rp-report-template-id="' + data.id + '"]');
								if (data.data.locked) {
									foundEL.addClass('rpreport-locked');
								} else {
									foundEL.removeClass('rpreport-locked');
								}
							});

							this.data = new can.Map({
								listReportTemplates: new can.List([]),
								selectedItem: null
							});

							this.initDOM();
						},



						initDOM: function () {
							this.dom = {};
							this.dom.list = this.element.find('ul.op-list');

							var template = this.domToTemplate(this.dom.list);
							can.view.ejs('ReportTemplates_List', template);

							this.dom.list.html(can.view('ReportTemplates_List', { data: this.data }));

							this.dom.ListWidget = new AD.op.Widget(this.element);
						},



						setList: function (list) {
							var _this = this;

							this.data.attr('listReportTemplates', list);

							// Unable selected items
							this.RPReportDefinition.wholock(function (err, result) {
								if (err) return;

								result.forEach(function (lockedId) {
									if (!_this.data.selectedItem || _this.data.selectedItem.getID() !== lockedId) {
										var foundEL = _this.element.find('[rp-report-template-id="' + lockedId + '"]');
										foundEL.addClass('rpreport-locked');
									}
								});
							});

							// Resize screen
							if (this.data.screenHeight) {
								this.resize(this.data.screenHeight);
							}
						},

						selectReportTemplate: function (reportTemplate) {
							var _this = this;
							var menuItems = this.element.find('.op-list li');
							for (var i = 0; i < menuItems.length; i++) {
								var item = $(menuItems[i]);
								if (item.data('item').getID() === reportTemplate.getID()) {
									_this.selectLI(item);
									break;
								}
							}
						},



						selectLI: function ($el) {
							this.clearSelectItems();

							$el.addClass('active');

							var model = $el.data('item');
							this.data.selectedItem = model;

							// lock the newly selected model:
							this.data.selectedItem.lock();

							this.element.trigger(this.options.eventItemSelected, model);
						},



						clearSelectItems: function () {
							if (this.data.selectedItem) {
								this.data.selectedItem.unlock();
								this.data.selectedItem = null;
							}

							this.element.find('.active').removeClass('active');
						},



						updateReportTemplate: function (reportTemplate) {
							this.data.listReportTemplates.forEach(function (rpTemplate) {
								if (rpTemplate.getID() === reportTemplate.getID()) {
									rpTemplate.attr('title', reportTemplate.attr('title'));
									rpTemplate.attr('report_def', reportTemplate.attr('report_def'));
								}
							})
						},



						resize: function (height) {
							this.data.screenHeight = height;

							if (this.dom.ListWidget) {
								this.dom.ListWidget.resize({ height: height });
							}
						},



						'li click': function ($el, ev) {
							if (!$el.hasClass('rpreport-locked') && !$el.hasClass('active')) {
								this.selectLI($el);
							}

							ev.preventDefault();
						}

					});

				});
		});
	});