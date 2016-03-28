module.exports = {
	"map": {
		"jsreports-all": "js/jsreports-all.min"
	},
	"paths": {
		"opstools/ProcessReports": "opstools/ProcessReports/ProcessReports.js",
		"jsreports-all": "js/jsreports-all.min.js"
	},
	"bundle": [
		"opstools/ProcessReports"
	],
	"meta": {
		"opstools/ProcessReports": {
            "deps": [
				"async"
            ]
        },
		"js/jsreports-all.min": {
            "exports": "jsreports",
			"format": "global",
            "deps": [
                "jquery",
				"js/jsreports-all.min.css"
            ],
            "sideBundle": true
        }

	}
};