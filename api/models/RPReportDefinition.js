/**
* RPReportTemplate.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

	connection: "appdev_default",

	tableName: "rp_report_definition",

	attributes: {

		title: { type: 'string', required: true },

		images: { type: 'json' },

		// report_def: { type: 'json', required: true }
		// Workaround: Canjs saves same format value 
		report_def: { type: 'text', required: true },

		getDocxUrl: { type: 'string' }
	},

	afterCreate: function(newlyInsertedRecord, cb) {
		sails.sockets.broadcast('sails_model_create_rpreportdefinition', 'rpreportdefinition', { verb: 'stale' });

		cb();
	},
	afterUpdate: function(updatedRecord, cb) {
		sails.sockets.broadcast('sails_model_update_rpreportdefinition', 'rpreportdefinition', { verb: 'stale' });

		cb();
	},
	afterDestroy: function(destroyedRecords, cb) {
		sails.sockets.broadcast('sails_model_destroy_rpreportdefinition', 'rpreportdefinition', { verb: 'stale' });

		cb();
	}

};