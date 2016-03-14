module.exports = {
    "map": {
    },
    "paths": {
        "opstools/RunReports": "opstools/RunReports/RunReports.js",
    },
    "bundle": ['opstools/RunReports'],
	"meta": {
		"opstools/RunReports": {
            "deps": [
				"async",
                "jsreports-all"
            ]
        }
	}
};