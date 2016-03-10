/**
* ProcessReport
*
* @module      :: Service
* @description :: This is a collection of server side services for the Process Reports module.
*
*/
var AD = require('ad-utils');

module.exports = {

	/**
	 * @function addDataSource
	 *
	 * register a datasource and a list of permission requirements for this 
	 * datasource.
	 *
	 * this routine will verify the given datasource is registered and has 
	 * the current list of permissions associated with it.
	 *
	 * @param {json} dataSourceDefinition	The definition of the datasource.  
	 *										It should have the following properties:
	 *						.name {string}  the label for the datasource (multilingual???)
	 *						.schema {json}  the schema for this DS
	 * @param {array} permissions  			An array of action keys required to have
	 *							   			access to this datasource.
	 * @param {string} getDataUrl  			The get data url to render report.
	 *
	 * @param {array} filters				The field filter to show report
	 * 						.name {string}	The field to filter
	 * 						.type {string}	The field type - string, date or number
	 *
	 * @return {deferred} 
	 */
	addDataSource: function (dataSourceDefinition, permissions, getDataUrl, filters) {
		var dfd = AD.sal.Deferred();

		// Validate required fields
		var requiredProperties = ['name', 'schema', 'schema.fields'];
        var allPropertiesFound = true;
        requiredProperties.forEach(function (prop) {
        
            /// NOTE: once Sails uses lodash v3.10.1, we can simply do this:
            /// allPropertiesFound = allPropertiesFound && _.has(data, prop);
        
            /// currently Sails uses v2.4.2 so we do this for now:
            var currData = dataSourceDefinition;

			if (prop.indexOf('.') > -1) {
				var propNames = prop.split('.');
				currData = currData[propNames[0]];
				prop = propNames[1];
			}

            allPropertiesFound = allPropertiesFound && _.has(currData, prop);
            if (currData) currData = currData[prop];
        });

        if (!allPropertiesFound) {

            dfd.fail('Please enter required fields');

        } else {
			RPDataSource.findOne({
				name: dataSourceDefinition.name
			}, function (err, result) {
				if (result) {
					// Update exists data source
					RPDataSource.update(
						{
							name: dataSourceDefinition.name
						},
						{
							name: dataSourceDefinition.name,
							schema: dataSourceDefinition.schema,
							permissions: permissions || [],
							getDataUrl: getDataUrl,
							filters: filters
						}).fail(function (err) {
							dfd.fail(err);
						}).then(function () {
							dfd.resolve();
						});
				}
				else {
					// Create new data source
					RPDataSource.create(
						{
							name: dataSourceDefinition.name,
							schema: dataSourceDefinition.schema,
							permissions: permissions || [],
							getDataUrl: getDataUrl,
							filters: filters
						}).fail(function (err) {
							dfd.fail(err);
						}).then(function () {
							dfd.resolve();
						});
				}
			});
		}

		return dfd;
	}

};