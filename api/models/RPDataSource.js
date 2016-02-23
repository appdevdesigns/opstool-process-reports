/**
* RPDataSource.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  connection:"appdev_default",

	tableName: "rp_data_source",

  attributes: {
    name : { type: 'string', required: true },

    schema : { type: 'json', required: true },

    permissions : { type: 'json' }
  }
};

