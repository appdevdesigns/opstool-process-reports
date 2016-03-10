steal(
// List your Page's dependencies here:
	'opstools/RunReports/RunReports.css',
	'opstools/RunReports/controllers/RunReports.js',
	function () {
		steal.import('site/labels/opstool-RunReports').then(function () { });
	});