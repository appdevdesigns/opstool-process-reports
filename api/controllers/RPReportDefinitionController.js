/**
 * RPReportTemplateController
 *
 * @description :: Server-side logic for managing Rpreporttemplates
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */
var lockedItems = [];
var _ = require('lodash');

ADCore.queue.subscribe('opsportal.socket.disconnect', function (message, socket) {
    var socketId = socket.id;

    _.forEach(lockedItems, function (lockedItem) {
        if (lockedItem.socketId === socketId) {
            RPReportDefinition.message(lockedItem.id, { locked: false }, {});
        }
    });

    _.remove(lockedItems, function (lockedItem) {
        return lockedItem.socketId === socketId;
    });
});

module.exports = {

    _config: {
        model: "rpreportdefinition", // all lowercase model name
        actions: true,
        shortcuts: false,
        rest: true
    },

	lock: function (req, res) {
        var id = req.param('id');
        if (id) {
            var socketId = req.socket.id;

            if (!lockedItems[id]) {
                lockedItems.push({
                    socketId: socketId,
                    id: id
                });
            }

            RPReportDefinition.message(id, { locked: true }, req);
            res.AD.success({ locked: id });
        } else {
            res.AD.error(new Error('must provide an id'));
        }
    },

    unlock: function (req, res) {
        var id = req.param('id');
        if (id) {
            _.remove(lockedItems, function (lockedItem) {
                return lockedItem.id === id;
            });

            RPReportDefinition.message(id, { locked: false }, req);
            res.AD.success({ unlocked: id });
        } else {
            res.AD.error(new Error('must provide an id'));
        }
    },

    wholock: function (req, res) {
        res.AD.success(_.map(lockedItems, function (item) { return parseInt(item.id); }));
    }

};

