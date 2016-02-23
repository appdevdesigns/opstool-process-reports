var assert = require('chai').assert;
var fs = require("fs");
var path = require("path");

describe('ProcessReport service', function () {

	it('should be there', function () {

        assert.isDefined(ProcessReport, ' --> ProcessReport should be defined!');

    });

	it('should add new data source', function () {
		var dataSourceDefinition = {
			name: 'Test Data Source',
			schema: {
				"fields": [
					{
						"name": "Date Field",
						"type": "date",
						"dateFormat": "M/D/YYYY"
					},
					{
						"name": "String Field",
						"type": "string"
					}
				]
			}
		};
		var permissions = ['test_permission'];

		ProcessReport.addDataSource(dataSourceDefinition, permissions)
			.done(function () {
				assert.isTrue(true, ' --> addDateSource should be done');
			})
			.fail(function (err) {
				assert.isTrue(false, ' --> addDateSource should not fail: ' + err);
			});
	});

	it('the name field should be required', function () {
		var dataSourceDefinition = {
			schema: {
				"fields": [
					{
						"name": "Date Field",
						"type": "date",
						"dateFormat": "M/D/YYYY"
					},
					{
						"name": "String Field",
						"type": "string"
					}
				]
			}
		};
		var permissions = ['test_permission'];

		ProcessReport.addDataSource(dataSourceDefinition, permissions)
			.done(function () {
				assert.isTrue(false, ' --> addDateSource should not be done');
			})
			.fail(function (err) {
				assert.areEqual('Please enter required fields', err);
				assert.isTrue(true, ' --> addDateSource should not fail');
			});
	});
	
	it('the schema field should be required', function () {
		var dataSourceDefinition = {
			name: 'Test Data Source',
		};
		var permissions = ['test_permission'];

		ProcessReport.addDataSource(dataSourceDefinition, permissions)
			.done(function () {
				assert.isTrue(false, ' --> addDateSource should not be done');
			})
			.fail(function (err) {
				assert.areEqual('Please enter required fields', err);
				assert.isTrue(true, ' --> addDateSource should not fail');
			});
	});
	
	it('the schema.fields field should be required', function () {
		var dataSourceDefinition = {
			name: 'Test Data Source',
			schema: {}
		};
		var permissions = ['test_permission'];

		ProcessReport.addDataSource(dataSourceDefinition, permissions)
			.done(function () {
				assert.isTrue(false, ' --> addDateSource should not be done');
			})
			.fail(function (err) {
				assert.areEqual('Please enter required fields', err);
				assert.isTrue(true, ' --> addDateSource should not fail');
			});
	});

});