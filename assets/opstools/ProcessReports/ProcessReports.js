steal(
	// List your Page's dependencies here:
	'opstools/ProcessReports/ProcessReports.css',
	'opstools/ProcessReports/controllers/ProcessReports.js',
	function() {
		System.import('jsreports-all').then(function() {
		});
	});